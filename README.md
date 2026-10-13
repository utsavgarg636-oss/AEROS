# A.E.R.O.S. — Automated Emergency Response & Optimization Network
### Single-Junction Emergency Corridor & Hospital Operations Architecture

---

## 1. Project Overview & Concept Alignment

**A.E.R.O.S.** (*Automated Emergency Response & Optimization Network*) is updated directly according to the core 5-point prototype concept:

1. **Accident Detection on the Left:** Video feed / test video stream with real Ultralytics YOLOv8 inference and spatial collision detection.
2. **One Traffic Junction in the Center:** Single visually prominent 4-way intersection (`J-CENTRAL / J-01`) with clear signal heads for both ambulance corridor and conflicting cross-street traffic.
3. **Ambulance Movement:** Ambulance approaching from the accident site and crossing the central junction.
4. **Emergency Signal Coordination:** Priority Green given to the ambulance movement while conflicting cross traffic is strictly held at RED (conflicting green states mechanically and logically prevented). Safe demo state restored after the ambulance crosses.
5. **One Destination Hospital on the Right:** Fictional demo hospital (`Apex Emergency & Trauma Center`) where the ambulance arrives.

---

## 2. Preserved Existing Files & Code

All original components, assets, ML weights, and code have been preserved:

| Preserved File | Status | Description |
|---|---|---|
| [`accident_detector.py`](accident_detector.py) | **100% Preserved** | Core collision detection class (`AccidentDetector`) using YOLOv8n, centroid distance, IoU overlap, and rollover checks. |
| [`yolov8n.pt`](yolov8n.pt) | **100% Preserved** | Existing YOLOv8 nano model weights (6.25 MB). |
| [`sample_crash.mp4`](sample_crash.mp4) | **100% Preserved** | Live CCTV test video stream and frame extraction source. |
| [`serial_communicator.py`](serial_communicator.py) | **100% Preserved** | Serial bridge for ESP32 hardware communication on `COM3`. |
| [`app.py`](app.py) | **100% Preserved** | Original legacy Flask + SocketIO prototype application. |
| [`templates/dashboard.html`](templates/dashboard.html) | **100% Preserved** | Legacy HTML template. |

---

## 3. Architecture & New Updates

### A. Shared Backend State (`api_server.py`)
- Provides unified in-memory synchronized state shared by both `/system` and `/hospital`.
- Endpoints:
  - `GET /api/simulation/state` — Real-time single-source-of-truth state.
  - `POST /api/simulation/start`, `pause`, `resume`, `reset` — Master simulation workflow controls.
  - `POST /api/simulation/demo-incident` — Clearly labelled simulated incident generator.
  - `POST /api/hospital/acknowledge` — Triage acknowledgment with valid state validation.
  - `POST /api/hospital/mark-arrived` — Confirms patient arrival once ambulance reaches campus.
  - `POST /api/inference/image` & `GET /api/inference/sample-frame` — Genuine YOLOv8 ML inference endpoints.
  - `GET /api/video_feed` — Real-time MJPEG camera stream from `sample_crash.mp4`.

### B. Replaceable IoT Adapter (`iot_adapter.py`)
- Designed for future ESP32, physical traffic LEDs, 16×2 I2C LCD, and buzzer siren.
- Decouples **Requested Commands** from **Acknowledged Device States**.
- Never falsely claims hardware is connected (`is_hardware_connected: False`, reported as `Simulated Virtual Adapter`).
- Public-road traffic signal control is explicitly **DISABLED** (safety guardrail).
- Conflicting green states are prevented at the interlock level.

### C. System Dashboard — Dark Theme (`/system`)
- Route: `http://127.0.0.1:5173/system` (also accessible at root `/`).
- Dark navy (`#060B13`) and cyan design with tactical glowing aesthetics.
- Left: Live CCTV feed, test buttons (`Test Sample Crash`, `Upload Image`, `Demo Incident`), and YOLOv8 telemetry.
- Center: Focused **Single-Junction Map** (`SingleJunctionMap.tsx`) showing accident site, 1 junction, ambulance crossing, and destination hospital.
- Right: Ambulance assignment, signal controller, 16×2 simulated LCD, and event timeline log.

### D. Hospital Dashboard — Light Theme (`/hospital`)
- Route: `http://127.0.0.1:5173/hospital`.
- Clean off-white (`#F8FAFC`) and teal design.
- Displays single fictional demo hospital (`Apex Emergency & Trauma Center`).
- Displays incoming ambulance case, incident ID, ambulance ID, location, severity, and triage status.
- Actions: **Acknowledge Case** and **Mark Arrived** with valid state transitions.
- **NO ETA, countdown, or estimated arrival time is shown anywhere.**
- Clearly labels all data as simulated demo healthcare data.

---

## 4. How to Run the Project

### Option 1: One-Click Launch (Windows)
Double-click [`run_aeros.bat`](run_aeros.bat) in the project root.

### Option 2: Manual Terminal Commands

#### Terminal 1 — Start Shared Backend (FastAPI)
```powershell
# In project root: c:\Users\UJJAWAL BANSAL\OneDrive\Desktop\InnoProj\AEROS
python api_server.py
```
- API Server URL: `http://127.0.0.1:8000`
- Swagger Docs: `http://127.0.0.1:8000/docs`

#### Terminal 2 — Start Frontend Dashboards (Vite)
```powershell
cd frontend
npm run dev -- --host 127.0.0.1 --port 5173
```
- System Dashboard (Dark Theme): `http://127.0.0.1:5173/system`
- Hospital Dashboard (Light Theme): `http://127.0.0.1:5173/hospital`

---

## 5. Testing the End-to-End Workflow

1. Open **System Dashboard** at `http://127.0.0.1:5173/system`.
2. Open **Hospital Dashboard** in another tab or window at `http://127.0.0.1:5173/hospital`.
3. In the System Dashboard, click **"START SIMULATION"** or **"Demo Incident"**:
   - Accident is detected on the left.
   - Ambulance AMB-101 is dispatched and approaches the central junction.
   - Corridor signal switches to **Priority Green** and conflicting traffic switches to **RED**.
   - Ambulance crosses the intersection smoothly.
   - Signals return to safe demo state (normal cycle).
   - Ambulance moves toward Apex Emergency Care hospital.
4. In the Hospital Dashboard tab:
   - Notice the incoming case is displayed with Incident ID, Ambulance ID, and details (without any ETA).
   - Click **"Acknowledge Case"**. The status changes to **"ACKNOWLEDGED BY TRIAGE"**.
   - Switch back to the System Dashboard tab: notice that the hospital status immediately updates to **"ACKNOWLEDGED BY TRIAGE"** via the shared backend!
5. When the ambulance arrives at the hospital (100% progress):
   - In the Hospital Dashboard, the **"Mark Arrived"** button unlocks.
   - Click **"Mark Arrived"** to complete the admission.
