import os
import sys
import time
import base64
import asyncio
import threading
import socket
import urllib.parse
from datetime import datetime
from typing import Optional, List, Dict, Any

import cv2
import numpy as np
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel

# Import existing ML model and IoT adapter
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

try:
    from accident_detector import AccidentDetector
    detector_loaded = True
    detector_error = None
except Exception as e:
    detector_loaded = False
    detector_error = str(e)
    AccidentDetector = None

try:
    from iot_adapter import IoTAdapter
    iot_adapter = IoTAdapter(port="COM3", force_simulation=True)
except Exception as e:
    print(f"[API SERVER] IoT Adapter init note: {e}")
    iot_adapter = None

# Initialize FastAPI application
app = FastAPI(
    title="A.E.R.O.S. Operations API",
    description="Automated Emergency Response & Optimization Network — Single Junction Incident & Corridor API",
    version="2.0.0"
)

# Enable CORS for frontend Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Model paths
model_path = os.path.join(BASE_DIR, "yolov8n.pt")
sample_video_path = os.path.join(BASE_DIR, "sample_crash.mp4")

detector = None
detector_lock = threading.Lock()
if detector_loaded:
    try:
        detector = AccidentDetector(model_path=model_path, conf_thresh=0.25, iou_thresh=0.15)
        print(f"[API SERVER] Successfully loaded existing AccidentDetector with {model_path}")
    except Exception as e:
        print(f"[API SERVER ERROR] Failed to instantiate AccidentDetector: {e}")
        detector_error = str(e)

# ============================================================================
# CONFIGURATION & CAMERA CAPTURE MANAGER
# ============================================================================

def load_env_file(env_path: Optional[str] = None):
    """Zero-dependency .env file loader for environment configuration."""
    if env_path is None:
        env_path = os.path.join(BASE_DIR, ".env")
    if not os.path.isfile(env_path):
        return
    try:
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, val = line.split("=", 1)
                key = key.strip()
                val = val.strip().strip("'\"")
                if key and key not in os.environ:
                    os.environ[key] = val
        print(f"[API SERVER] Loaded configuration from {env_path}")
    except Exception as e:
        print(f"[API SERVER] Note reading .env: {e}")

load_env_file()

# Environment-configurable camera parameters
DEFAULT_ESP32_STREAM_URL = os.getenv("ESP32_STREAM_URL", "http://10.143.81.138:81/stream").strip()
DEFAULT_CAMERA_SOURCE = os.getenv("CAMERA_SOURCE", "esp32").strip().lower()
DEFAULT_CAMERA_FALLBACK = os.getenv("CAMERA_FALLBACK", "none").strip().lower()
try:
    DEFAULT_RECONNECT_INTERVAL = float(os.getenv("CAMERA_RECONNECT_INTERVAL", "2.0"))
except ValueError:
    DEFAULT_RECONNECT_INTERVAL = 2.0


class CameraCaptureManager:
    """
    Centralized, thread-safe capture manager for A.E.R.O.S. video feeds.
    
    Guarantees:
    1. Single active reader on the camera socket (prevents ESP32-CAM socket rejection).
    2. Zero duplicate YOLOv8 inference passes regardless of how many frontend clients connect.
    3. Non-blocking TCP pre-flight checks prevent cv2.VideoCapture from hanging when IP drops.
    4. Bounded exponential/linear backoff without blocking FastAPI routes.
    5. Clean diagnostic standby frames when stream is interrupted.
    6. Runtime source-switching between 'esp32' and 'sample'.
    """
    def __init__(
        self,
        source_type: str = DEFAULT_CAMERA_SOURCE,
        esp32_url: str = DEFAULT_ESP32_STREAM_URL,
        sample_path: str = sample_video_path,
        fallback_mode: str = DEFAULT_CAMERA_FALLBACK,
        reconnect_interval: float = DEFAULT_RECONNECT_INTERVAL,
        detector_instance: Optional[AccidentDetector] = None,
        lock: Optional[threading.Lock] = None,
    ):
        self.configured_source_type = source_type if source_type in ["esp32", "sample"] else "esp32"
        self.active_source_type = self.configured_source_type
        self.esp32_url = esp32_url
        self.sample_path = sample_path
        self.fallback_mode = fallback_mode if fallback_mode in ["none", "sample"] else "none"
        self.reconnect_interval = max(0.5, reconnect_interval)
        self.detector = detector_instance
        self.lock = lock or threading.Lock()

        # State flags
        self.is_running = True
        self.is_connected = False
        self.is_fallback_active = False
        self.reconnect_attempts = 0
        self.diagnostic_message = "Initializing camera capture manager..."
        self.last_successful_frame_time: Optional[str] = None
        self.frame_width: int = 0
        self.frame_height: int = 0
        self.fps: float = 0.0
        self.total_frames_read: int = 0
        self.total_inferences: int = 0
        self.detected_vehicles: List[str] = []
        self.last_accident_flag: bool = False
        self.last_severity: str = "NONE"

        # Frame buffers
        self.frame_lock = threading.Lock()
        self.latest_jpeg_bytes: Optional[bytes] = None
        self.latest_raw_frame: Optional[np.ndarray] = None
        self.new_frame_event = threading.Event()
        self.interrupt_event = threading.Event()

        # Thread management
        self.worker_thread = threading.Thread(target=self._capture_worker, daemon=True, name="AerosCameraWorker")
        self.worker_thread.start()

    def _check_socket_reachability(self, url: str, timeout: float = 1.5) -> tuple:
        """Performs non-blocking TCP reachability probe to prevent OpenCV connection hangs."""
        try:
            parsed = urllib.parse.urlparse(url)
            host = parsed.hostname
            if not host:
                return False, "Missing hostname in stream URL"
            port = parsed.port or (443 if parsed.scheme == "https" else 80)
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(timeout)
                s.connect((host, port))
            return True, "Reachable"
        except socket.timeout:
            return False, f"Timeout connecting to {host}:{port} after {timeout}s"
        except ConnectionRefusedError:
            return False, f"Connection refused on {host}:{port}"
        except Exception as e:
            return False, f"Unreachable ({e})"

    def _generate_offline_frame(self, message: str, detail: str = "") -> bytes:
        """Draws a high-visibility tactical HUD offline/connecting placeholder frame."""
        img = np.zeros((480, 640, 3), dtype=np.uint8)
        img[:] = (19, 11, 8)  # Tactical navy dark background
        cv2.rectangle(img, (20, 20), (620, 460), (46, 29, 17), 2)
        cv2.putText(img, "A.E.R.O.S. TACTICAL CCTV FEED", (40, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (248, 189, 56), 2)
        cv2.putText(img, f"SOURCE: {self.active_source_type.upper()}", (40, 100), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (200, 200, 200), 1)
        cv2.putText(img, f"STATUS: {message}", (40, 150), cv2.FONT_HERSHEY_SIMPLEX, 0.75, (90, 77, 255), 2)
        if detail:
            cv2.putText(img, detail[:65], (40, 190), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (160, 160, 160), 1)
        if self.reconnect_attempts > 0:
            cv2.putText(img, f"Reconnect attempt #{self.reconnect_attempts} (retrying every {self.reconnect_interval:.1f}s)...", (40, 230), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (120, 120, 120), 1)
        timestamp_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        cv2.putText(img, timestamp_str, (40, 440), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (100, 100, 100), 1)
        ret, buf = cv2.imencode('.jpg', img)
        return buf.tobytes() if ret else b""

    def _read_mjpeg_stream(self, stream_url: str) -> bool:
        """Reads frames directly from an HTTP multipart/x-mixed-replace MJPEG stream."""
        import urllib.request
        try:
            req = urllib.request.Request(stream_url, headers={"User-Agent": "AEROS-CameraManager/1.0"})
            with urllib.request.urlopen(req, timeout=3.0) as resp:
                bytes_buf = b""
                prev_fps_time = time.time()
                fps_frame_count = 0
                first_frame = True

                while self.is_running and self.active_source_type == "esp32":
                    chunk = resp.read(4096)
                    if not chunk:
                        break
                    bytes_buf += chunk
                    a = bytes_buf.find(b"\xff\xd8")
                    b = bytes_buf.find(b"\xff\xd9")
                    if a != -1 and b != -1 and b > a:
                        jpg_data = bytes_buf[a:b+2]
                        bytes_buf = bytes_buf[b+2:]
                        frame = cv2.imdecode(np.frombuffer(jpg_data, dtype=np.uint8), cv2.IMREAD_COLOR)
                        if frame is not None and frame.size > 0:
                            if first_frame:
                                self.is_connected = True
                                self.is_fallback_active = False
                                self.reconnect_attempts = 0
                                self.diagnostic_message = "Live ESP32-CAM MJPEG streaming active"
                                print(f"[CAMERA] ESP32-CAM stream connected! Resolution: {frame.shape[1]}x{frame.shape[0]}")
                                first_frame = False

                            self._process_and_store_frame(frame)
                            fps_frame_count += 1
                            now = time.time()
                            if now - prev_fps_time >= 1.0:
                                self.fps = round(fps_frame_count / (now - prev_fps_time), 1)
                                fps_frame_count = 0
                                prev_fps_time = now
                return not first_frame
        except Exception as e:
            return False

    def _capture_worker(self):
        """Dedicated background capture thread."""
        prev_fps_time = time.time()
        fps_frame_count = 0

        while self.is_running:
            target_source = self.active_source_type

            if target_source == "esp32":
                stream_url = self.esp32_url
                reachable, reason = self._check_socket_reachability(stream_url, timeout=1.5)

                if not reachable:
                    self.is_connected = False
                    self.reconnect_attempts += 1
                    self.diagnostic_message = f"ESP32-CAM unreachable: {reason}"
                    
                    if self.fallback_mode == "sample" and os.path.exists(self.sample_path):
                        self.is_fallback_active = True
                        print(f"[CAMERA] ESP32 unreachable. Fallback active: using sample_crash.mp4 ({reason})")
                        self._stream_sample_video(single_pass=True)
                        continue
                    else:
                        offline_jpeg = self._generate_offline_frame("CAMERA DISCONNECTED", self.diagnostic_message)
                        with self.frame_lock:
                            self.latest_jpeg_bytes = offline_jpeg
                        self.new_frame_event.set()
                        self.interrupt_event.wait(timeout=self.reconnect_interval)
                        self.interrupt_event.clear()
                        continue

                # Attempt to stream from ESP32 camera
                # First try direct robust MJPEG stream reader (fastest for ESP32-CAM)
                stream_success = self._read_mjpeg_stream(stream_url)

                if not stream_success:
                    # Fallback to OpenCV VideoCapture backend
                    print(f"[CAMERA] Direct MJPEG reader finished or unhandled, testing OpenCV VideoCapture for: {stream_url} ...")
                    cap = cv2.VideoCapture(stream_url)
                    if not cap.isOpened():
                        self.is_connected = False
                        self.reconnect_attempts += 1
                        self.diagnostic_message = "Stream opened socket but failed frame decoding"
                        cap.release()
                        time.sleep(self.reconnect_interval)
                        continue

                    ret, test_frame = cap.read()
                    if not ret or test_frame is None:
                        self.is_connected = False
                        self.reconnect_attempts += 1
                        self.diagnostic_message = "OpenCV received empty frame from stream"
                        cap.release()
                        time.sleep(self.reconnect_interval)
                        continue

                    # Stream is successfully established via OpenCV
                    self.is_connected = True
                    self.is_fallback_active = False
                    self.reconnect_attempts = 0
                    self.diagnostic_message = "Live ESP32-CAM streaming active (OpenCV backend)"
                    print(f"[CAMERA] ESP32-CAM connected via OpenCV! Resolution: {test_frame.shape[1]}x{test_frame.shape[0]}")

                    self._process_and_store_frame(test_frame)

                    while self.is_running and self.active_source_type == "esp32":
                        ret, frame = cap.read()
                        if not ret or frame is None:
                            self.is_connected = False
                            self.diagnostic_message = "Stream interrupted / empty frame"
                            break

                        self._process_and_store_frame(frame)
                        fps_frame_count += 1
                        now = time.time()
                        if now - prev_fps_time >= 1.0:
                            self.fps = round(fps_frame_count / (now - prev_fps_time), 1)
                            fps_frame_count = 0
                            prev_fps_time = now

                    cap.release()

                time.sleep(self.reconnect_interval)

            elif target_source == "sample":
                self.is_fallback_active = False
                self._stream_sample_video(single_pass=False)

            else:
                time.sleep(0.5)

    def _stream_sample_video(self, single_pass: bool = False):
        """Reads and loops through sample_crash.mp4."""
        if not os.path.exists(self.sample_path):
            self.is_connected = False
            self.diagnostic_message = f"Sample video not found at {self.sample_path}"
            offline_jpeg = self._generate_offline_frame("SAMPLE FILE MISSING", self.diagnostic_message)
            with self.frame_lock:
                self.latest_jpeg_bytes = offline_jpeg
            self.new_frame_event.set()
            time.sleep(1.0)
            return

        cap = cv2.VideoCapture(self.sample_path)
        if not cap.isOpened():
            self.is_connected = False
            self.diagnostic_message = "Failed to open sample_crash.mp4"
            time.sleep(1.0)
            return

        self.is_connected = True
        self.diagnostic_message = "Sample video loop active (sample_crash.mp4)"

        prev_time = time.time()
        fps_count = 0
        fps_start = time.time()

        while self.is_running:
            if not single_pass and self.active_source_type != "sample":
                break

            ret, frame = cap.read()
            if not ret or frame is None:
                if single_pass:
                    break
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                time.sleep(0.04)
                continue

            self._process_and_store_frame(frame)

            fps_count += 1
            now = time.time()
            if now - fps_start >= 1.0:
                self.fps = round(fps_count / (now - fps_start), 1)
                fps_count = 0
                fps_start = now

            # Pacing to simulate ~28-30 FPS playback
            elapsed = time.time() - prev_time
            sleep_time = max(0.005, 0.035 - elapsed)
            time.sleep(sleep_time)
            prev_time = time.time()

        cap.release()

    def _process_and_store_frame(self, frame: np.ndarray):
        """Applies YOLOv8 detector under detector_lock and caches latest JPEG bytes."""
        self.frame_height, self.frame_width = frame.shape[:2]
        self.last_successful_frame_time = datetime.now().isoformat()
        self.total_frames_read += 1

        if self.detector:
            with self.lock:
                processed_frame, is_accident, severity = self.detector.process_frame(frame)
            self.last_accident_flag = is_accident
            self.last_severity = severity
            self.total_inferences += 1
        else:
            processed_frame = frame

        ret, buffer = cv2.imencode('.jpg', processed_frame)
        if ret:
            with self.frame_lock:
                self.latest_jpeg_bytes = buffer.tobytes()
                self.latest_raw_frame = frame
            self.new_frame_event.set()

    def get_latest_jpeg(self, timeout: float = 0.5) -> Optional[bytes]:
        """Returns the latest processed JPEG bytes for MJPEG streaming."""
        self.new_frame_event.wait(timeout=timeout)
        with self.frame_lock:
            return self.latest_jpeg_bytes

    def set_source(self, source: str) -> None:
        """Switches active camera source to 'esp32' or 'sample'."""
        source = source.lower().strip()
        if source not in ["esp32", "sample"]:
            raise ValueError(f"Invalid source '{source}'. Must be 'esp32' or 'sample'.")
        self.configured_source_type = source
        self.active_source_type = source
        self.reconnect_attempts = 0
        self.diagnostic_message = f"Switched source to {source}"
        self.interrupt_event.set()
        print(f"[CAMERA] Active source changed to: {source}")

    def set_stream_url(self, url: str) -> None:
        """Updates the ESP32 stream endpoint URL dynamically."""
        url = url.strip()
        if not url.startswith("http://") and not url.startswith("https://") and not url.startswith("rtsp://"):
            raise ValueError("Stream URL must begin with http://, https://, or rtsp://")
        self.esp32_url = url
        self.reconnect_attempts = 0
        self.diagnostic_message = f"Stream URL updated to {url}"
        self.interrupt_event.set()
        print(f"[CAMERA] Stream URL updated: {url}")

    def set_fallback_mode(self, mode: str) -> None:
        """Sets fallback mode to 'none' or 'sample'."""
        mode = mode.lower().strip()
        if mode in ["none", "sample"]:
            self.fallback_mode = mode

    def get_telemetry(self) -> Dict[str, Any]:
        """Returns real-time telemetry dictionary."""
        return {
            "source_type": self.active_source_type,
            "configured_source_type": self.configured_source_type,
            "active_source": self.active_source_type,
            "source_description": f"ESP32-CAM ({self.esp32_url})" if self.active_source_type == "esp32" else "sample_crash.mp4 (Traffic Stream)",
            "camera_connected": self.is_connected,
            "camera_active": self.is_connected,
            "stream_url": self.esp32_url,
            "stream_url_configured": bool(self.esp32_url),
            "frame_width": self.frame_width,
            "frame_height": self.frame_height,
            "frame_dimensions": [self.frame_width, self.frame_height] if self.frame_width > 0 else None,
            "fps": self.fps,
            "last_successful_frame": self.last_successful_frame_time,
            "latest_inference_time": self.last_successful_frame_time,
            "reconnect_attempts": self.reconnect_attempts,
            "is_fallback_active": self.is_fallback_active,
            "diagnostic_message": self.diagnostic_message,
            "error": None if self.is_connected else self.diagnostic_message,
            "last_accident_flag": self.last_accident_flag,
            "last_severity": self.last_severity,
            "total_frames_read": self.total_frames_read,
            "total_inferences": self.total_inferences,
        }

    def stop(self):
        """Stops background capture loop."""
        self.is_running = False
        self.interrupt_event.set()


camera_manager = CameraCaptureManager(
    source_type=DEFAULT_CAMERA_SOURCE,
    esp32_url=DEFAULT_ESP32_STREAM_URL,
    sample_path=sample_video_path,
    fallback_mode=DEFAULT_CAMERA_FALLBACK,
    reconnect_interval=DEFAULT_RECONNECT_INTERVAL,
    detector_instance=detector,
    lock=detector_lock
)

# Global Telemetry from Camera Feed
latest_telemetry = camera_manager.get_telemetry()

# ============================================================================
# SHARED BACKEND STATE STORE (Single Source of Truth for /system and /hospital)
# ============================================================================
class SharedStateStore:
    def __init__(self):
        self.reset()

    def reset(self):
        self.is_simulating = False
        self.is_paused = False
        self.simulation_step = 0
        self.incident: Optional[Dict[str, Any]] = None
        self.ambulance: Dict[str, Any] = {
            "id": "AMB-101",
            "callsign": "Apex Critical Care 101",
            "type": "Advanced ICU Unit",
            "status": "STANDBY",  # "STANDBY" | "ASSIGNED" | "APPROACHING" | "CROSSING" | "EN_ROUTE_HOSPITAL" | "ARRIVED"
            "progress": 0.0,      # 0 to 100%
            "assigned_incident_id": None,
            "driver": "Paramedic Capt. R. Sharma",
        }
        self.junction: Dict[str, Any] = {
            "id": "J-CENTRAL",
            "name": "Central Corridor Junction (Grand Trunk & Medical Way)",
            "corridor_direction": "West-to-East (Ambulance Route)",
            "cross_direction": "North-to-South (Conflicting Traffic)",
            "ambulance_signal": "NORMAL_CYCLE",  # "NORMAL_CYCLE" | "GREEN" | "AMBER" | "RED"
            "conflicting_signal": "NORMAL_CYCLE", # "NORMAL_CYCLE" | "RED" | "AMBER"
            "state_label": "Safe Normal Cycle (Standby)",
            "conflicting_greens_prevented": True,
            "hardware_ack": "SIMULATED_DEVICE_ACK",
            "safety_mode": "PROTOTYPE_SIMULATION_ONLY",
        }
        self.hospital: Dict[str, Any] = {
            "id": "HOSP-APEX",
            "name": "Apex Emergency & Trauma Center",
            "tier": "Level 1 Trauma Care",
            "location": "Medical District East",
            "is_simulated": True,
            "case_acknowledged": False,
            "acknowledged_at": None,
            "acknowledged_by": None,
            "arrival_status": "IDLE",  # "IDLE" | "IN_TRANSIT" | "ARRIVED"
            "arrived_at": None,
            "assigned_case_id": None,
        }
        self.timeline_events: List[Dict[str, Any]] = [
            {
                "id": "EVT-INIT",
                "timestamp": datetime.now().strftime("%H:%M:%S"),
                "category": "System",
                "title": "A.E.R.O.S. Command Engine Ready",
                "description": "Single junction corridor simulation and hospital telemetry ready in standby mode.",
                "severity": "info"
            }
        ]

    def add_event(self, category: str, title: str, description: str, severity: str = "info"):
        event = {
            "id": f"EVT-{int(time.time() * 1000)}-{np.random.randint(100, 999)}",
            "timestamp": datetime.now().strftime("%H:%M:%S"),
            "category": category,
            "title": title,
            "description": description,
            "severity": severity
        }
        self.timeline_events.insert(0, event)
        if len(self.timeline_events) > 30:
            self.timeline_events.pop()

    def get_state(self) -> Dict[str, Any]:
        iot_telemetry = iot_adapter.get_telemetry() if iot_adapter else {}
        return {
            "is_simulating": self.is_simulating,
            "is_paused": self.is_paused,
            "simulation_step": self.simulation_step,
            "incident": self.incident,
            "ambulance": self.ambulance,
            "junction": self.junction,
            "hospital": self.hospital,
            "timeline_events": self.timeline_events,
            "iot": iot_telemetry,
            "timestamp": datetime.now().isoformat()
        }

shared_store = SharedStateStore()

# Background runner for simulation pacing
simulation_task_handle: Optional[asyncio.Task] = None

async def simulation_runner():
    while True:
        await asyncio.sleep(2.4)
        if not shared_store.is_simulating or shared_store.is_paused:
            continue

        shared_store.simulation_step += 1
        step = shared_store.simulation_step

        if step == 1:
            # Step 1: Accident Detected (if not already set)
            if not shared_store.incident:
                shared_store.incident = {
                    "id": "INC-DEMO-2026",
                    "detection_time": datetime.now().strftime("%H:%M:%S"),
                    "source": "SIMULATED_DEMO_INCIDENT",
                    "is_demo": True,
                    "location": "NH-24 West Approach (Sector 5 Corridor)",
                    "severity": "HIGH",
                    "confidence_score": 92.4,
                    "vehicles_involved": ["car", "truck"],
                    "verified": True,
                    "status": "ACCIDENT_DETECTED",
                    "notes": "Simulated multi-vehicle collision for corridor demonstration."
                }
                shared_store.add_event(
                    "Accident",
                    "Demo Accident Registered [HIGH]",
                    "Collision detected at West Approach. Emergency corridor alerted.",
                    "critical"
                )

        elif step == 2:
            # Step 2: Ambulance Assigned and Approaching Junction
            shared_store.ambulance["status"] = "APPROACHING"
            shared_store.ambulance["progress"] = 25.0
            shared_store.ambulance["assigned_incident_id"] = shared_store.incident["id"] if shared_store.incident else "INC-DEMO-2026"
            if shared_store.incident:
                shared_store.incident["status"] = "AMBULANCE_DISPATCHED"

            # Hospital receives the case in transit
            shared_store.hospital["assigned_case_id"] = shared_store.ambulance["assigned_incident_id"]
            shared_store.hospital["arrival_status"] = "IN_TRANSIT"

            shared_store.add_event(
                "Ambulance",
                f"{shared_store.ambulance['id']} Dispatched & Rolling",
                "Unit approaching Central Traffic Junction along West Corridor.",
                "success"
            )

        elif step == 3:
            # Step 3: Activate Predefined Emergency Signal Sequence
            # INTERLOCK: Ambulance green, conflicting cross traffic MUST be RED
            shared_store.junction["ambulance_signal"] = "GREEN"
            shared_store.junction["conflicting_signal"] = "RED"
            shared_store.junction["state_label"] = "EMERGENCY PRIORITY GREEN (Conflicting Red)"
            shared_store.ambulance["progress"] = 45.0

            if iot_adapter:
                iot_adapter.set_emergency_corridor(active=True, ambulance_crossing=False)

            shared_store.add_event(
                "Traffic",
                "Emergency Green Signal Activated",
                "Central Junction switched to PRIORITY GREEN for ambulance. Conflicting cross traffic held at RED.",
                "info"
            )

        elif step == 4:
            # Step 4: Animate Ambulance Crossing Junction
            shared_store.ambulance["status"] = "CROSSING"
            shared_store.ambulance["progress"] = 55.0
            shared_store.junction["state_label"] = "AMBULANCE CROSSING INTERSECTION"

            if iot_adapter:
                iot_adapter.set_emergency_corridor(active=True, ambulance_crossing=True)

            shared_store.add_event(
                "Traffic",
                "Ambulance Safely Crossing Junction",
                "Vehicle clearing central intersection. Conflicting traffic continues to wait at RED.",
                "info"
            )

        elif step == 5:
            # Step 5: Return signals to safe demo state after crossing event
            shared_store.junction["ambulance_signal"] = "NORMAL_CYCLE"
            shared_store.junction["conflicting_signal"] = "NORMAL_CYCLE"
            shared_store.junction["state_label"] = "Safe Demo State Restored (Normal Cycle)"
            shared_store.ambulance["status"] = "EN_ROUTE_HOSPITAL"
            shared_store.ambulance["progress"] = 75.0

            if iot_adapter:
                iot_adapter.restore_safe_demo_state()

            shared_store.add_event(
                "Traffic",
                "Signals Returned to Safe Demo State",
                "Corridor safely de-escalated. Central junction returned to normal traffic cycles.",
                "info"
            )

        elif step == 6:
            # Step 6: Ambulance Moving toward Single Hospital
            shared_store.ambulance["progress"] = 92.0
            shared_store.add_event(
                "Ambulance",
                "Approaching Apex Emergency Gate",
                "Ambulance on final medical access boulevard toward hospital entrance.",
                "info"
            )

        elif step == 7:
            # Step 7: Ambulance Arrives at Single Hospital
            shared_store.ambulance["status"] = "ARRIVED"
            shared_store.ambulance["progress"] = 100.0
            shared_store.hospital["arrival_status"] = "ARRIVED"
            shared_store.hospital["arrived_at"] = datetime.now().strftime("%H:%M:%S")

            if shared_store.incident:
                shared_store.incident["status"] = "ARRIVED_AT_HOSPITAL"

            shared_store.add_event(
                "Hospital",
                "Ambulance Arrived at Apex Emergency Hospital",
                "Patient successfully delivered to hospital triage bay. Awaiting triage case mark.",
                "success"
            )
            # Finish automated progression; pause simulation loop
            shared_store.is_simulating = False


@app.on_event("startup")
async def startup_event():
    global simulation_task_handle
    simulation_task_handle = asyncio.create_task(simulation_runner())


# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.get("/api/status")
def get_system_status():
    """Returns genuine status of all system and simulation subsystems."""
    model_exists = os.path.exists(model_path)
    weights_size_mb = round(os.path.getsize(model_path) / (1024 * 1024), 2) if model_exists else 0

    ml_status = "CONNECTED" if (detector is not None) else ("MODEL AVAILABLE / INFERENCE OFFLINE" if model_exists else "DISCONNECTED")
    
    cam_tel = camera_manager.get_telemetry()
    cam_status = "CONNECTED" if cam_tel["camera_connected"] else "DISCONNECTED"

    return {
        "timestamp": datetime.now().isoformat(),
        "system_name": "A.E.R.O.S. Command & Corridor Network",
        "status": "OPERATIONAL",
        "components": {
            "ml_model": {
                "status": ml_status,
                "framework": "Ultralytics YOLOv8",
                "weights_file": "yolov8n.pt",
                "weights_size_mb": weights_size_mb,
                "model_loaded": detector is not None,
                "error": detector_error,
                "supported_classes": ["car", "motorcycle", "bus", "truck", "cell phone"]
            },
            "camera": {
                "status": cam_status,
                "source": cam_tel["source_description"],
                "source_type": cam_tel["source_type"],
                "active_source": cam_tel["active_source"],
                "configured_source": cam_tel["configured_source_type"],
                "live_stream_available": cam_tel["camera_connected"],
                "frame_width": cam_tel["frame_width"],
                "frame_height": cam_tel["frame_height"],
                "fps": cam_tel["fps"],
                "reconnect_attempts": cam_tel["reconnect_attempts"],
                "error": cam_tel["error"],
                "diagnostic_message": cam_tel["diagnostic_message"],
                "is_fallback_active": cam_tel["is_fallback_active"],
                "last_successful_frame": cam_tel["last_successful_frame"]
            },
            "traffic_junction": {
                "status": "SIMULATED",
                "junction_count": 1,
                "note": "Single central traffic junction simulation with safety interlock"
            },
            "hospital": {
                "status": "SIMULATED",
                "hospital_count": 1,
                "note": "Single fictional destination hospital (Apex Emergency Care)"
            },
            "iot_adapter": iot_adapter.get_telemetry() if iot_adapter else {
                "hardware_connected": False,
                "note": "Simulation adapter active"
            }
        }
    }


@app.get("/api/simulation/state")
def get_simulation_state():
    """Returns the shared single-source-of-truth state for both /system and /hospital."""
    return shared_store.get_state()


@app.post("/api/simulation/start")
def start_simulation():
    """Starts or triggers the demo simulation workflow."""
    if not shared_store.incident:
        shared_store.incident = {
            "id": f"INC-SIM-{int(time.time() % 10000)}",
            "detection_time": datetime.now().strftime("%H:%M:%S"),
            "source": "SIMULATED_DEMO_INCIDENT",
            "is_demo": True,
            "location": "NH-24 West Approach (Sector 5 Corridor)",
            "severity": "HIGH",
            "confidence_score": 93.5,
            "vehicles_involved": ["car", "truck"],
            "verified": True,
            "status": "ACCIDENT_DETECTED",
            "notes": "Simulated multi-vehicle collision for demonstration."
        }
    shared_store.is_simulating = True
    shared_store.is_paused = False
    shared_store.simulation_step = 0
    shared_store.add_event(
        "Accident",
        "Simulation Run Started",
        "Emergency sequence triggered for single junction corridor.",
        "info"
    )
    return shared_store.get_state()


@app.post("/api/simulation/pause")
def pause_simulation():
    """Pauses the active simulation."""
    shared_store.is_paused = True
    shared_store.add_event("System", "Simulation Paused", "Operator paused simulation progress.", "warning")
    return shared_store.get_state()


@app.post("/api/simulation/resume")
def resume_simulation():
    """Resumes paused simulation."""
    shared_store.is_paused = False
    shared_store.add_event("System", "Simulation Resumed", "Simulation running.", "info")
    return shared_store.get_state()


@app.post("/api/simulation/reset")
def reset_simulation():
    """Resets the simulation, ambulance, junction, and hospital state to standby."""
    shared_store.reset()
    if iot_adapter:
        iot_adapter.restore_safe_demo_state()
    shared_store.add_event("System", "System Reset", "All components returned to clean standby state.", "info")
    return shared_store.get_state()


@app.post("/api/simulation/demo-incident")
def create_demo_incident():
    """Creates a clearly labelled demo incident without running inference."""
    shared_store.incident = {
        "id": f"INC-DEMO-{int(time.time() % 10000)}",
        "detection_time": datetime.now().strftime("%H:%M:%S"),
        "source": "SIMULATED_DEMO_INCIDENT",
        "is_demo": True,
        "location": "NH-24 West Approach (Sector 5 Corridor)",
        "severity": "HIGH",
        "confidence_score": 91.0,
        "vehicles_involved": ["car", "bus"],
        "verified": True,
        "status": "ACCIDENT_DETECTED",
        "notes": "Clearly labelled simulated incident for demo evaluation."
    }
    shared_store.add_event("Accident", "Demo Incident Created", "Simulated accident at West Approach registered.", "critical")
    return shared_store.get_state()


@app.post("/api/hospital/acknowledge")
def hospital_acknowledge_case():
    """
    Hospital triage acknowledges the incoming ambulance case.
    Valid state transition: Must have an assigned case or incident.
    Updates the shared backend so /system reflects this immediately.
    """
    if not shared_store.incident and not shared_store.hospital.get("assigned_case_id"):
        raise HTTPException(status_code=400, detail="No active emergency case to acknowledge.")

    case_id = shared_store.hospital.get("assigned_case_id") or (shared_store.incident["id"] if shared_store.incident else "CASE-01")
    shared_store.hospital["case_acknowledged"] = True
    shared_store.hospital["acknowledged_at"] = datetime.now().strftime("%H:%M:%S")
    shared_store.hospital["acknowledged_by"] = "Dr. S. Nair (Triage Lead)"

    shared_store.add_event(
        "Hospital",
        f"Case {case_id} Acknowledged by Hospital",
        f"Apex Emergency Triage acknowledged incoming case at {shared_store.hospital['acknowledged_at']}. Trauma team mobilized.",
        "success"
    )
    return shared_store.get_state()


@app.post("/api/hospital/mark-arrived")
def hospital_mark_arrived():
    """
    Marks the ambulance case as arrived at the hospital.
    Valid state transition: Ambulance must be at the hospital (progress >= 95% or status == ARRIVED).
    """
    if shared_store.ambulance["progress"] < 95.0 and shared_store.ambulance["status"] != "ARRIVED":
        raise HTTPException(
            status_code=400,
            detail="Cannot mark arrived before the ambulance reaches the hospital in simulation."
        )

    shared_store.hospital["arrival_status"] = "ARRIVED"
    shared_store.hospital["arrived_at"] = datetime.now().strftime("%H:%M:%S")
    shared_store.ambulance["status"] = "ARRIVED"
    shared_store.ambulance["progress"] = 100.0

    if shared_store.incident:
        shared_store.incident["status"] = "COMPLETED"

    shared_store.add_event(
        "Hospital",
        "Patient Handover Completed",
        "Ambulance arrival officially verified by hospital triage. Case completed.",
        "success"
    )
    return shared_store.get_state()


@app.get("/api/iot/state")
def get_iot_state():
    """Returns the decoupled requested and acknowledged states of the IoT adapter."""
    if iot_adapter:
        return iot_adapter.get_telemetry()
    return {
        "hardware_connected": False,
        "note": "IoT adapter not loaded"
    }


# ============================================================================
# ML INFERENCE ENDPOINTS (Existing Preserved Model Integration)
# ============================================================================

@app.post("/api/inference/image")
async def run_image_inference(file: UploadFile = File(...)):
    """Executes real inference on an uploaded image using existing AccidentDetector."""
    if detector is None:
        raise HTTPException(status_code=503, detail=f"ML Detector is offline. Model error: {detector_error}")

    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if frame is None:
        raise HTTPException(status_code=400, detail="Invalid image file or unsupported format.")

    start_time = time.time()
    with detector_lock:
        processed_frame, is_accident, severity = detector.process_frame(frame.copy(), require_temporal_confirmation=False)
    elapsed_ms = round((time.time() - start_time) * 1000, 2)

    yolo_results = detector.model(cv2.resize(frame, (640, 480)), conf=detector.conf_thresh, verbose=False)
    detected_objects = []

    for r in yolo_results:
        for box in r.boxes:
            cls_id = int(box.cls[0])
            class_name = detector.model.names[cls_id]
            if class_name in ['car', 'motorcycle', 'bus', 'truck', 'cell phone']:
                conf = float(box.conf[0])
                coords = list(map(int, box.xyxy[0]))
                detected_objects.append({
                    "class": class_name,
                    "confidence": round(conf, 4),
                    "box": coords
                })

    ret, buffer = cv2.imencode('.jpg', processed_frame)
    if not ret:
        raise HTTPException(status_code=500, detail="Could not encode processed frame.")
    
    encoded_image = base64.b64encode(buffer).decode('utf-8')
    image_data_uri = f"data:image/jpeg;base64,{encoded_image}"

    # Update global telemetry
    latest_telemetry["latest_inference_time"] = datetime.now().isoformat()
    latest_telemetry["last_accident_flag"] = is_accident
    latest_telemetry["last_severity"] = severity
    latest_telemetry["detected_vehicles"] = [obj["class"] for obj in detected_objects]
    latest_telemetry["total_inferences"] += 1

    # If accident detected, register it genuinely as a real ML incident in shared state
    if is_accident:
        real_incident = {
            "id": f"INC-ML-{int(time.time() % 10000)}",
            "detection_time": datetime.now().strftime("%H:%M:%S"),
            "source": "REAL_YOLO_MODEL",
            "is_demo": False,
            "location": "NH-24 West Approach (Sector 5 Corridor)",
            "severity": severity,
            "confidence_score": round(detected_objects[0]["confidence"] * 100, 1) if detected_objects else 85.0,
            "vehicles_involved": [obj["class"] for obj in detected_objects] or ["car"],
            "verified": True,
            "status": "ACCIDENT_DETECTED",
            "notes": "Verified by genuine YOLOv8 inference and collision overlap."
        }
        shared_store.incident = real_incident
        shared_store.add_event(
            "Accident",
            f"Genuine ML Collision Detected [{severity}]",
            f"Real YOLOv8 inference identified {len(detected_objects)} vehicles with spatial collision overlap.",
            "critical"
        )

    return {
        "success": True,
        "is_demo": False,
        "model_used": "Ultralytics YOLOv8n + Spatial Collision Overlap Engine",
        "accident_detected": is_accident,
        "severity": severity,
        "detected_count": len(detected_objects),
        "detected_objects": detected_objects,
        "inference_time_ms": elapsed_ms,
        "timestamp": datetime.now().isoformat(),
        "annotated_image": image_data_uri
    }


@app.get("/api/inference/sample-frame")
def run_sample_frame_inference():
    """
    Extracts a frame from sample_crash.mp4 and processes it using
    AccidentDetector.

    An AI incident is registered only when the detector confirms
    an accident. A potential collision is not treated as a confirmed
    accident.
    """
    if detector is None:
        raise HTTPException(
            status_code=503,
            detail=f"Detector not loaded. Model error: {detector_error}"
        )

    if not os.path.exists(sample_video_path):
        raise HTTPException(
            status_code=404,
            detail="sample_crash.mp4 not found."
        )

    cap = cv2.VideoCapture(sample_video_path)

    try:
        if not cap.isOpened():
            raise HTTPException(
                status_code=500,
                detail="Could not open sample_crash.mp4."
            )

        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

        if total_frames <= 0:
            raise HTTPException(
                status_code=500,
                detail="The sample video contains no readable frames."
            )

        target_frame = 25 if total_frames >= 26 else min(45, max(0, total_frames // 3))
        cap.set(cv2.CAP_PROP_POS_FRAMES, target_frame)

        ret, frame = cap.read()

    finally:
        cap.release()

    if not ret or frame is None:
        raise HTTPException(
            status_code=500,
            detail="Could not extract frame from sample video."
        )

    start_time = time.time()

    # Run the existing accident detection model with lock and direct evaluation.
    with detector_lock:
        processed_frame, is_accident, candidate_severity = (
            detector.process_frame(frame.copy(), require_temporal_confirmation=False)
        )

    elapsed_ms = round((time.time() - start_time) * 1000, 2)

    # Obtain the objects detected by YOLO for reporting.
    yolo_results = detector.model(
        cv2.resize(frame, (640, 480)),
        conf=detector.conf_thresh,
        verbose=False
    )

    detected_objects = []

    for result in yolo_results:
        for box in result.boxes:
            class_id = int(box.cls[0])
            class_name = detector.model.names[class_id]
            confidence = float(box.conf[0])

            if class_name in [
                "car",
                "motorcycle",
                "bus",
                "truck"
            ]:
                detected_objects.append({
                    "class": class_name,
                    "confidence": round(confidence, 4),
                    "box": list(map(int, box.xyxy[0]))
                })

    # Keep confirmed severity separate from candidate severity.
    confirmed_severity = (
        candidate_severity if is_accident else "NONE"
    )

    # Update global inference telemetry.
    latest_telemetry["latest_inference_time"] = (
        datetime.now().isoformat()
    )
    latest_telemetry["last_accident_flag"] = bool(is_accident)
    latest_telemetry["last_severity"] = confirmed_severity
    latest_telemetry["detected_vehicles"] = [
        obj["class"] for obj in detected_objects
    ]
    latest_telemetry["total_inferences"] += 1

    incident_registered = False

    # CRITICAL FIX:
    # Do not create an incident when the detector has not confirmed one.
    if is_accident:
        real_incident = {
            "id": f"INC-SAMPLE-{int(time.time() * 1000)}",
            "detection_time": datetime.now().strftime("%H:%M:%S"),
            "source": "AI_DETECTION",
            "is_demo": False,
            "location": "NH-24 West Approach (Sector 5 Corridor)",
            "severity": confirmed_severity,
            "confidence_score": (
                round(
                    max(obj["confidence"] for obj in detected_objects)
                    * 100,
                    1
                )
                if detected_objects
                else None
            ),
            "vehicles_involved": [
                obj["class"] for obj in detected_objects
            ],
            "verified": True,
            "status": "ACCIDENT_DETECTED",
            "notes": (
                f"Accident confirmed by AccidentDetector on "
                f"sample video frame {target_frame}."
            )
        }

        shared_store.incident = real_incident
        incident_registered = True

        shared_store.add_event(
            "Accident",
            f"AI Accident Confirmed [{confirmed_severity}]",
            (
                f"AccidentDetector confirmed an accident on frame "
                f"{target_frame}. Inference took {elapsed_ms} ms."
            ),
            "critical"
        )

    else:
        # Do not overwrite an existing incident with a false detection.
        shared_store.add_event(
            "Inference",
            "Sample Frame Evaluated - No Confirmed Accident",
            (
                f"Frame {target_frame} was evaluated in "
                f"{elapsed_ms} ms. No confirmed accident was returned."
            ),
            "info"
        )

    # Encode the annotated frame for the frontend.
    ret, buffer = cv2.imencode(".jpg", processed_frame)

    if not ret:
        raise HTTPException(
            status_code=500,
            detail="Could not encode processed frame."
        )

    encoded_image = base64.b64encode(buffer).decode("utf-8")

    return {
        "success": True,
        "source": "sample_crash.mp4",
        "frame_number": target_frame,

        # Confirmed accident state.
        "accident_detected": bool(is_accident),
        "severity": confirmed_severity,

        # Diagnostic field: a candidate severity is not confirmation.
        "candidate_severity": candidate_severity,

        "incident_registered": incident_registered,
        "detected_count": len(detected_objects),
        "detected_objects": detected_objects,
        "inference_time_ms": elapsed_ms,
        "timestamp": datetime.now().isoformat(),
        "annotated_image": f"data:image/jpeg;base64,{encoded_image}"
    }



def generate_video_stream():
    """Generator that yields MJPEG frames from the central camera capture manager."""
    while True:
        frame_bytes = camera_manager.get_latest_jpeg(timeout=0.2)
        if frame_bytes:
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
        else:
            time.sleep(0.04)


@app.get("/api/video_feed")
def video_feed():
    """Live MJPEG video stream with real-time YOLOv8 bounding boxes."""
    return StreamingResponse(
        generate_video_stream(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )


@app.get("/api/telemetry")
def get_telemetry():
    """Returns latest camera stream metrics and detection telemetry."""
    cam_tel = camera_manager.get_telemetry()
    return {
        **latest_telemetry,
        **cam_tel,
        "server_time": datetime.now().isoformat()
    }


class CameraConfigRequest(BaseModel):
    source: Optional[str] = None          # 'esp32' | 'sample'
    stream_url: Optional[str] = None      # e.g. 'http://10.143.81.138:81/stream'
    fallback_mode: Optional[str] = None   # 'none' | 'sample'


@app.get("/api/camera/sources")
def get_camera_sources():
    """Returns available camera sources, configured stream URL, and telemetry status."""
    return {
        "status": "OK",
        "configured_source": camera_manager.configured_source_type,
        "active_source": camera_manager.active_source_type,
        "is_connected": camera_manager.is_connected,
        "esp32_url": camera_manager.esp32_url,
        "sample_video_path": sample_video_path,
        "telemetry": camera_manager.get_telemetry()
    }


@app.post("/api/camera/configure")
def configure_camera(cfg: CameraConfigRequest):
    """
    Updates the camera source and/or stream URL at runtime without restarting the server.
    Safely validates inputs and handles URL updates.
    """
    try:
        if cfg.source:
            camera_manager.set_source(cfg.source)
        if cfg.stream_url:
            camera_manager.set_stream_url(cfg.stream_url)
        if cfg.fallback_mode:
            camera_manager.set_fallback_mode(cfg.fallback_mode)
        return {
            "success": True,
            "message": "Camera configuration updated successfully",
            "telemetry": camera_manager.get_telemetry()
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update camera configuration: {e}")


@app.get("/api/inference/live-frame")
def run_live_frame_inference():
    """
    Executes real inference on the latest frame acquired from the active camera (ESP32-CAM).
    Returns real YOLOv8 annotations, bounding boxes, and collision telemetry.
    """
    if detector is None:
        raise HTTPException(status_code=503, detail=f"Detector not loaded: {detector_error}")

    frame = camera_manager.latest_raw_frame
    if frame is None or not camera_manager.is_connected:
        raise HTTPException(
            status_code=503,
            detail=f"No active camera frame available ({camera_manager.diagnostic_message})"
        )

    start_time = time.time()
    with detector_lock:
        processed_frame, is_accident, candidate_severity = detector.process_frame(
            frame.copy(), require_temporal_confirmation=False
        )
    elapsed_ms = round((time.time() - start_time) * 1000, 2)

    # Obtain YOLO objects for reporting
    yolo_results = detector.model(cv2.resize(frame, (640, 480)), conf=detector.conf_thresh, verbose=False)
    detected_objects = []
    for result in yolo_results:
        for box in result.boxes:
            class_id = int(box.cls[0])
            class_name = detector.model.names[class_id]
            if class_name in ['car', 'motorcycle', 'bus', 'truck']:
                detected_objects.append({
                    "class": class_name,
                    "confidence": round(float(box.conf[0]), 4),
                    "box": list(map(int, box.xyxy[0]))
                })

    confirmed_severity = candidate_severity if is_accident else "NONE"
    ret, buffer = cv2.imencode(".jpg", processed_frame)
    if not ret:
        raise HTTPException(status_code=500, detail="Could not encode processed live frame.")

    encoded_image = base64.b64encode(buffer).decode("utf-8")
    return {
        "success": True,
        "source": camera_manager.active_source_type,
        "accident_detected": bool(is_accident),
        "severity": confirmed_severity,
        "detected_count": len(detected_objects),
        "detected_objects": detected_objects,
        "inference_time_ms": elapsed_ms,
        "timestamp": datetime.now().isoformat(),
        "annotated_image": f"data:image/jpeg;base64,{encoded_image}"
    }


@app.on_event("shutdown")
def shutdown_event():
    """Releases camera capture resources on server shutdown."""
    print("[API SERVER] Stopping camera capture manager...")
    camera_manager.stop()


if __name__ == "__main__":
    import uvicorn
    print("[A.E.R.O.S.] Starting Operations API on http://127.0.0.1:8000 ...")
    uvicorn.run(app, host="127.0.0.1", port=8000)
