import cv2
import numpy as np
import time
import threading
from collections import deque
from typing import Dict, List, Tuple, Optional, Any
from ultralytics import YOLO

class TrackedVehicle:
    """Represents a vehicle tracked across consecutive video frames."""
    def __init__(self, track_id: int, class_name: str, box: List[int], conf: float):
        self.track_id = track_id
        self.class_name = class_name
        self.box = box  # [x1, y1, x2, y2]
        self.conf = conf
        self.center = ((box[0] + box[2]) // 2, (box[1] + box[3]) // 2)
        
        # History for velocity and trajectory estimation (stores (center_x, center_y, time))
        self.history: deque = deque(maxlen=15)
        self.history.append((self.center[0], self.center[1], time.time()))
        
        # Motion metrics
        self.velocity = (0.0, 0.0)  # px/s
        self.speed = 0.0            # px/s
        self.speeds: deque = deque(maxlen=15)
        self.speeds.append(0.0)
        self.last_seen = time.time()
        self.disappeared_frames = 0
        self.state = "NORMAL"       # NORMAL | POTENTIAL | CONFIRMED

    def update(self, box: List[int], conf: float):
        now = time.time()
        new_center = ((box[0] + box[2]) // 2, (box[1] + box[3]) // 2)
        
        if self.history:
            prev_cx, prev_cy, prev_t = self.history[-1]
            dt = max(now - prev_t, 0.02)
            vx = (new_center[0] - prev_cx) / dt
            vy = (new_center[1] - prev_cy) / dt
            # Smooth velocity with exponential moving average
            self.velocity = (0.6 * vx + 0.4 * self.velocity[0], 0.6 * vy + 0.4 * self.velocity[1])
            self.speed = np.sqrt(self.velocity[0] ** 2 + self.velocity[1] ** 2)
            self.speeds.append(self.speed)
            
        self.box = box
        self.conf = conf
        self.center = new_center
        self.last_seen = now
        self.disappeared_frames = 0
        self.history.append((new_center[0], new_center[1], now))


class AccidentDetector:
    """
    Enhanced Multi-Frame Temporal Accident Detector for A.E.R.O.S.
    
    Key Capabilities:
    1. Multi-vehicle identity tracking: Each vehicle maintains distinct identity and bounding box.
       No artificial box merging.
    2. Multi-frame temporal state transition:
       NORMAL -> POTENTIAL COLLISION -> CONFIRMED COLLISION
    3. Trajectory & kinematic collision analysis:
       - Evaluates closing speed, trajectory convergence, and spatial overlap.
       - Distinguishes close passing vehicles (parallel motion without abrupt stop)
         from real crashes (sudden deceleration + persistent contact).
    4. Single-vehicle rollover / catastrophic deformation detection.
    5. Severity assessment: LOW, MEDIUM, HIGH based on vehicle mass and impact scale.
    6. High-visibility tactical HUD annotations.
    """
    def __init__(
        self,
        model_path: str = 'yolov8n.pt',
        conf_thresh: float = 0.35,
        iou_thresh: float = 0.15,
        inference_size: int = 480
    ):
        self.model = YOLO(model_path)
        self.conf_thresh = conf_thresh
        self.iou_thresh = iou_thresh
        self.inference_size = inference_size
        
        # Valid vehicle classes to evaluate
        self.vehicle_classes = {'car', 'motorcycle', 'bus', 'truck'}
        
        # Tracking state
        self.tracks: Dict[int, TrackedVehicle] = {}
        self.next_track_id: int = 1
        
        # Collision confirmation state
        self.collision_pairs: Dict[Tuple[int, int], Dict[str, Any]] = {}
        self.accident_flag: bool = False
        self.current_severity: str = "NONE"
        self.confirmed_accident_time: Optional[float] = None
        self.last_confirmed_boxes: List[List[int]] = []
        self.impact_point: Optional[Tuple[int, int]] = None
        self.state_lock = threading.Lock()
        self.detected_impact_points: List[Tuple[int, int]] = []
        self.frame_has_confirmed: bool = False
        self.frame_has_potential: bool = False

    def calculate_iou(self, box1: List[int], box2: List[int]) -> float:
        """Computes Intersection over Union (IoU) of two bounding boxes."""
        xi1 = max(box1[0], box2[0])
        yi1 = max(box1[1], box2[1])
        xi2 = min(box1[2], box2[2])
        yi2 = min(box1[3], box2[3])

        inter_w = max(0, xi2 - xi1)
        inter_h = max(0, yi2 - yi1)
        inter_area = inter_w * inter_h

        box1_area = (box1[2] - box1[0]) * (box1[3] - box1[1])
        box2_area = (box2[2] - box2[0]) * (box2[3] - box2[1])
        union_area = box1_area + box2_area - inter_area

        return inter_area / float(union_area) if union_area > 0 else 0.0

    def boxes_intersect(self, box1: List[int], box2: List[int]) -> Tuple[bool, float]:
        """
        Calculates genuine spatial overlap between two bounding boxes.
        Returns (is_intersecting, overlap_ratio_relative_to_smaller_box).
        """
        xi1 = max(box1[0], box2[0])
        yi1 = max(box1[1], box2[1])
        xi2 = min(box1[2], box2[2])
        yi2 = min(box1[3], box2[3])

        inter_w = max(0, xi2 - xi1)
        inter_h = max(0, yi2 - yi1)
        inter_area = inter_w * inter_h
        if inter_area <= 0:
            return False, 0.0

        area1 = max(1, (box1[2] - box1[0]) * (box1[3] - box1[1]))
        area2 = max(1, (box2[2] - box2[0]) * (box2[3] - box2[1]))
        overlap_ratio = inter_area / float(min(area1, area2))
        return True, overlap_ratio

    def boxes_intersect_or_adjacent(self, box1: List[int], box2: List[int], margin: int = 12) -> bool:
        """Checks if two bounding boxes touch or are within a margin (legacy compatibility)."""
        eb1 = [box1[0] - margin, box1[1] - margin, box1[2] + margin, box1[3] + margin]
        xi1 = max(eb1[0], box2[0])
        yi1 = max(eb1[1], box2[1])
        xi2 = min(eb1[2], box2[2])
        yi2 = min(eb1[3], box2[3])
        return (xi2 > xi1) and (yi2 > yi1)

    def _clean_detections(
        self,
        detections: List[Tuple[List[int], str, float]]
    ) -> List[Tuple[List[int], str, float]]:
        """
        Applies class-agnostic Non-Maximum Suppression (NMS) to eliminate duplicate
        or overlapping proposal boxes for the same physical vehicle.
        Prevents a single vehicle from being tracked as two colliding vehicles.
        """
        if not detections:
            return []
        # Sort by confidence descending
        sorted_dets = sorted(detections, key=lambda d: d[2], reverse=True)
        clean = []
        for d in sorted_dets:
            box, cls_name, conf = d
            area_d = max(0, box[2] - box[0]) * max(0, box[3] - box[1])
            if area_d < 150:  # Skip tiny noise boxes (< 12x12 px)
                continue
            is_dup = False
            for k_box, k_cls, k_conf in clean:
                area_k = max(0, k_box[2] - k_box[0]) * max(0, k_box[3] - k_box[1])
                xi1 = max(box[0], k_box[0])
                yi1 = max(box[1], k_box[1])
                xi2 = min(box[2], k_box[2])
                yi2 = min(box[3], k_box[3])
                inter_w = max(0, xi2 - xi1)
                inter_h = max(0, yi2 - yi1)
                inter_area = inter_w * inter_h
                if inter_area > 0:
                    union = area_d + area_k - inter_area
                    iou = inter_area / float(union) if union > 0 else 0.0
                    containment = inter_area / float(min(area_d, area_k)) if min(area_d, area_k) > 0 else 0.0
                    # If high overlap or one box largely contained within another, it's the same vehicle
                    if iou > 0.40 or containment > 0.60:
                        is_dup = True
                        break
            if not is_dup:
                clean.append(d)
        return clean

    def _match_detections_to_tracks(
        self,
        detections: List[Tuple[List[int], str, float]]
    ) -> List[Tuple[Optional[int], List[int], str, float]]:
        """
        Associates current raw detections with existing tracked vehicles using
        centroid distance and IoU matching.
        """
        matched = []
        unmatched_dets = list(range(len(detections)))
        unmatched_tracks = set(self.tracks.keys())
        
        # Pass 1: Match by IoU > 0.25 (same vehicle slightly moved)
        for d_idx in list(unmatched_dets):
            box, cls_name, conf = detections[d_idx]
            best_t_id = None
            best_iou = 0.25
            for t_id in list(unmatched_tracks):
                track = self.tracks[t_id]
                iou = self.calculate_iou(box, track.box)
                if iou > best_iou:
                    best_iou = iou
                    best_t_id = t_id
            if best_t_id is not None:
                matched.append((best_t_id, box, cls_name, conf))
                unmatched_dets.remove(d_idx)
                unmatched_tracks.remove(best_t_id)

        # Pass 2: Match by nearest centroid (< 60 px)
        for d_idx in list(unmatched_dets):
            box, cls_name, conf = detections[d_idx]
            cx = (box[0] + box[2]) // 2
            cy = (box[1] + box[3]) // 2
            best_t_id = None
            best_dist = 60.0
            for t_id in list(unmatched_tracks):
                track = self.tracks[t_id]
                dist = np.sqrt((cx - track.center[0]) ** 2 + (cy - track.center[1]) ** 2)
                if dist < best_dist:
                    best_dist = dist
                    best_t_id = t_id
            if best_t_id is not None:
                matched.append((best_t_id, box, cls_name, conf))
                unmatched_dets.remove(d_idx)
                unmatched_tracks.remove(best_t_id)

        # Pass 3: Remaining detections are newly appeared vehicles
        for d_idx in unmatched_dets:
            box, cls_name, conf = detections[d_idx]
            matched.append((None, box, cls_name, conf))

        # Mark disappeared tracks
        for t_id in unmatched_tracks:
            self.tracks[t_id].disappeared_frames += 1

        return matched

    def detect_and_update(
        self,
        frame: np.ndarray,
        require_temporal_confirmation: bool = True
    ) -> Tuple[bool, str]:
        """
        Runs YOLOv8 detection and updates multi-frame tracking and accident state.
        Thread-safe under self.state_lock.
        
        Returns:
            is_accident (bool): True strictly when confirmed accident state is verified.
            severity (str): 'HIGH', 'MEDIUM', 'LOW', or 'NONE'.
        """
        # Resize for high-efficiency, consistent inference
        orig_h, orig_w = frame.shape[:2]
        if (orig_w, orig_h) == (640, 480):
            display_frame = frame
        else:
            display_frame = cv2.resize(frame, (640, 480))

        # Run YOLOv8 inference with optimized imgsz
        results = self.model.predict(
            display_frame,
            imgsz=self.inference_size,
            conf=self.conf_thresh,
            verbose=False
        )

        raw_detections: List[Tuple[List[int], str, float]] = []
        for r in results:
            for box in r.boxes:
                cls_id = int(box.cls[0])
                cls_name = self.model.names[cls_id]
                if cls_name in self.vehicle_classes:
                    conf = float(box.conf[0])
                    coords = list(map(int, box.xyxy[0]))
                    raw_detections.append((coords, cls_name, conf))

        # Class-agnostic NMS to eliminate multiple overlapping boxes on the same physical vehicle
        clean_detections = self._clean_detections(raw_detections)

        with self.state_lock:
            # Update vehicle tracks
            matches = self._match_detections_to_tracks(clean_detections)
            current_active_ids = []

            for t_id, box, cls_name, conf in matches:
                if t_id is not None and t_id in self.tracks:
                    self.tracks[t_id].update(box, conf)
                    current_active_ids.append(t_id)
                else:
                    new_id = self.next_track_id
                    self.next_track_id += 1
                    self.tracks[new_id] = TrackedVehicle(new_id, cls_name, box, conf)
                    current_active_ids.append(new_id)

            # Prune dead tracks (not seen for > 10 frames)
            dead_ids = [t_id for t_id, t in self.tracks.items() if t.disappeared_frames > 10]
            for d_id in dead_ids:
                del self.tracks[d_id]
                # Clean up pair states involving this track
                for pair in list(self.collision_pairs.keys()):
                    if d_id in pair:
                        del self.collision_pairs[pair]

            # Reset states
            for t_id in current_active_ids:
                self.tracks[t_id].state = "NORMAL"

            frame_has_potential = False
            frame_has_confirmed = False
            detected_impact_points: List[Tuple[int, int]] = []
            colliding_pairs_info: List[Tuple[int, int, str]] = []
            max_impact_area = 0
            heavy_vehicle_count = 0

            # STAGE 1 & 2: MULTI-VEHICLE PAIRWISE COLLISION ANALYSIS
            # Real collision strictly requires at least 2 distinct physical vehicles
            num_vehicles = len(current_active_ids)
            if num_vehicles >= 2:
                for i in range(num_vehicles):
                    id_a = current_active_ids[i]
                    veh_a = self.tracks[id_a]
                    
                    for j in range(i + 1, num_vehicles):
                        id_b = current_active_ids[j]
                        veh_b = self.tracks[id_b]
                        pair_key = (min(id_a, id_b), max(id_a, id_b))
                        
                        iou = self.calculate_iou(veh_a.box, veh_b.box)
                        touches, overlap_ratio = self.boxes_intersect(veh_a.box, veh_b.box)
                        centroid_dist = np.sqrt(
                            (veh_a.center[0] - veh_b.center[0]) ** 2 +
                            (veh_a.center[1] - veh_b.center[1]) ** 2
                        )

                        if pair_key not in self.collision_pairs:
                            self.collision_pairs[pair_key] = {
                                "state": "NORMAL",
                                "first_contact_time": None,
                                "contact_frames": 0,
                                "prev_dist": centroid_dist,
                                "closing_frames": 0,
                                "had_closing_trajectory": False,
                            }

                        p_data = self.collision_pairs[pair_key]
                        prev_dist = p_data["prev_dist"]
                        delta_dist = centroid_dist - prev_dist
                        p_data["prev_dist"] = centroid_dist

                        # Trajectory convergence: distance was decreasing into proximity
                        if delta_dist < -1.5 and centroid_dist < 130:
                            p_data["closing_frames"] += 1
                            if p_data["closing_frames"] >= 2:
                                p_data["had_closing_trajectory"] = True
                        else:
                            p_data["closing_frames"] = max(0, p_data["closing_frames"] - 1)

                        # Genuine spatial intersection between vehicles
                        is_in_contact = (iou >= self.iou_thresh) or (touches and overlap_ratio >= 0.18)

                        if is_in_contact:
                            p_data["contact_frames"] += 1
                            if p_data["first_contact_time"] is None:
                                p_data["first_contact_time"] = time.time()
                            
                            # Deceleration or post-impact stationary entanglement
                            both_tracked = (len(veh_a.history) >= 2 and len(veh_b.history) >= 2)
                            is_stopped_or_decelerated = (veh_a.speed < 45.0 and veh_b.speed < 45.0)

                            if not require_temporal_confirmation:
                                # Snapshot photo verification: require unambiguous physical overlap
                                confirmed = (iou >= 0.18 or overlap_ratio >= 0.22)
                            else:
                                # Live multi-frame stream verification:
                                # Require persistence + either closing trajectory OR sustained post-impact entanglement
                                confirmed = both_tracked and (
                                    (p_data["contact_frames"] >= 3 and p_data["had_closing_trajectory"] and is_stopped_or_decelerated) or
                                    (p_data["contact_frames"] >= 5 and is_stopped_or_decelerated)
                                )

                            if confirmed:
                                p_data["state"] = "CONFIRMED"
                                veh_a.state = "CONFIRMED"
                                veh_b.state = "CONFIRMED"
                                frame_has_confirmed = True
                                
                                imp_x = (veh_a.center[0] + veh_b.center[0]) // 2
                                imp_y = (veh_a.center[1] + veh_b.center[1]) // 2
                                detected_impact_points.append((imp_x, imp_y))
                                colliding_pairs_info.append((id_a, id_b, "CONFIRMED"))
                                
                                area_a = (veh_a.box[2] - veh_a.box[0]) * (veh_a.box[3] - veh_a.box[1])
                                area_b = (veh_b.box[2] - veh_b.box[0]) * (veh_b.box[3] - veh_b.box[1])
                                max_impact_area = max(max_impact_area, area_a + area_b)
                                
                                if veh_a.class_name in ['bus', 'truck']:
                                    heavy_vehicle_count += 1
                                if veh_b.class_name in ['bus', 'truck']:
                                    heavy_vehicle_count += 1
                            else:
                                p_data["state"] = "POTENTIAL"
                                if veh_a.state != "CONFIRMED":
                                    veh_a.state = "POTENTIAL"
                                if veh_b.state != "CONFIRMED":
                                    veh_b.state = "POTENTIAL"
                                frame_has_potential = True
                                colliding_pairs_info.append((id_a, id_b, "POTENTIAL"))
                        else:
                            p_data["contact_frames"] = max(0, p_data["contact_frames"] - 1)
                            if p_data["contact_frames"] == 0:
                                p_data["first_contact_time"] = None
                                p_data["state"] = "NORMAL"

            # STAGE 3: SINGLE-VEHICLE VIOLENT CRASH CHECK (Extreme kinetic halt only)
            # Normal vehicles (driving, turning, or parked) never trigger this
            if not frame_has_confirmed and num_vehicles == 1 and require_temporal_confirmation:
                v_single = self.tracks[current_active_ids[0]]
                max_hist_speed = max(v_single.speeds) if v_single.speeds else 0.0
                # Must have been moving at high speed (> 70 px/s) followed by abrupt drop to 0
                if max_hist_speed > 70.0 and v_single.speed < 8.0 and len(v_single.history) >= 6:
                    v_single.state = "CONFIRMED"
                    frame_has_confirmed = True
                    detected_impact_points.append(v_single.center)
                    bw = v_single.box[2] - v_single.box[0]
                    bh = v_single.box[3] - v_single.box[1]
                    max_impact_area = bw * bh
                    if v_single.class_name in ['bus', 'truck']:
                        heavy_vehicle_count += 1

            # SEVERITY DETERMINATION
            frame_area = 640 * 480
            impact_ratio = max_impact_area / float(frame_area)

            if frame_has_confirmed:
                if heavy_vehicle_count >= 1 or impact_ratio > 0.08 or num_vehicles >= 3:
                    self.current_severity = "HIGH"
                elif impact_ratio > 0.03 or num_vehicles >= 2:
                    self.current_severity = "MEDIUM"
                else:
                    self.current_severity = "LOW"
                self.accident_flag = True
                self.confirmed_accident_time = time.time()
            else:
                self.accident_flag = False
                self.current_severity = "NONE"

            self.frame_has_potential = frame_has_potential
            self.frame_has_confirmed = frame_has_confirmed
            self.detected_impact_points = detected_impact_points

            return self.accident_flag, self.current_severity

    def annotate_frame(self, frame: np.ndarray) -> np.ndarray:
        """
        Renders bounding boxes, HUD indicators, and accident alerts onto a frame
        using the latest tracking and collision state in sub-millisecond time.
        """
        orig_h, orig_w = frame.shape[:2]
        if (orig_w, orig_h) == (640, 480):
            display_frame = frame.copy()
        else:
            display_frame = cv2.resize(frame, (640, 480))

        with self.state_lock:
            tracks_to_draw = [
                (t.track_id, t.class_name, t.box, t.conf, t.state)
                for t in self.tracks.values()
                if t.disappeared_frames == 0
            ]
            impact_pts = list(self.detected_impact_points)
            has_confirmed = self.frame_has_confirmed
            has_potential = self.frame_has_potential
            severity = self.current_severity

        # 1. Draw each individual vehicle with distinct ID and bounding box
        for track_id, class_name, b, conf, state in tracks_to_draw:
            if state == "CONFIRMED":
                cv2.rectangle(display_frame, (b[0], b[1]), (b[2], b[3]), (0, 0, 255), 3)
                label = f"#{track_id} {class_name.upper()} [COLLISION]"
                badge_bg = (0, 0, 180)
                badge_fg = (255, 255, 255)
            elif state == "POTENTIAL":
                cv2.rectangle(display_frame, (b[0], b[1]), (b[2], b[3]), (0, 180, 255), 2)
                label = f"#{track_id} {class_name.upper()} [CLOSING]"
                badge_bg = (0, 140, 220)
                badge_fg = (255, 255, 255)
            else:
                cv2.rectangle(display_frame, (b[0], b[1]), (b[2], b[3]), (80, 220, 100), 2)
                label = f"#{track_id} {class_name.upper()} {int(conf * 100)}%"
                badge_bg = (30, 140, 50)
                badge_fg = (255, 255, 255)

            (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.45, 1)
            cv2.rectangle(
                display_frame,
                (b[0], max(0, b[1] - th - 8)),
                (b[0] + tw + 8, max(th + 8, b[1])),
                badge_bg,
                -1
            )
            cv2.putText(
                display_frame,
                label,
                (b[0] + 4, max(th + 2, b[1] - 4)),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.45,
                badge_fg,
                1,
                cv2.LINE_AA
            )

        # 2. Draw Impact Points and Convergence Vectors
        for imp_pt in impact_pts:
            cv2.circle(display_frame, imp_pt, 18, (0, 0, 255), 2)
            cv2.circle(display_frame, imp_pt, 10, (0, 220, 255), -1)
            cv2.circle(display_frame, imp_pt, 4, (255, 255, 255), -1)
            cv2.putText(
                display_frame,
                "IMPACT ZONE",
                (imp_pt[0] - 45, imp_pt[1] - 24),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.45,
                (0, 0, 255),
                2,
                cv2.LINE_AA
            )

        # 3. Top HUD Banner
        if has_confirmed:
            overlay = display_frame.copy()
            cv2.rectangle(overlay, (0, 0), (640, 48), (0, 0, 180), -1)
            cv2.addWeighted(overlay, 0.85, display_frame, 0.15, 0, display_frame)
            banner_text = f"CRITICAL ACCIDENT DETECTED! [{severity}]"
            cv2.putText(
                display_frame,
                banner_text,
                (18, 32),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.75,
                (255, 255, 255),
                2,
                cv2.LINE_AA
            )
            cv2.putText(
                display_frame,
                "A.E.R.O.S. EMERGENCY PROTOCOL ACTIVE",
                (360, 32),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.45,
                (180, 230, 255),
                1,
                cv2.LINE_AA
            )
        elif has_potential:
            overlay = display_frame.copy()
            cv2.rectangle(overlay, (0, 0), (640, 36), (0, 140, 220), -1)
            cv2.addWeighted(overlay, 0.8, display_frame, 0.2, 0, display_frame)
            cv2.putText(
                display_frame,
                "WARNING: HIGH CLOSING VELOCITY / POTENTIAL HAZARD",
                (18, 24),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.55,
                (255, 255, 255),
                2,
                cv2.LINE_AA
            )

        return display_frame

    def process_frame(
        self,
        frame: np.ndarray,
        require_temporal_confirmation: bool = True
    ) -> Tuple[np.ndarray, bool, str]:
        """
        Processes a single video frame through the collision detection engine.
        Guarantees 100% backward compatibility for all callers.
        
        Returns:
            annotated_frame (np.ndarray): Video frame rendered with bounding boxes and HUD.
            is_accident (bool): True strictly when confirmed accident state is verified.
            severity (str): 'HIGH', 'MEDIUM', 'LOW', or 'NONE'.
        """
        is_accident, severity = self.detect_and_update(frame, require_temporal_confirmation)
        annotated_frame = self.annotate_frame(frame)
        return annotated_frame, is_accident, severity
