import os
import time
import cv2
from flask import Flask, render_template, Response
from flask_socketio import SocketIO
from accident_detector import AccidentDetector
from serial_communicator import SerialBridge

app = Flask(__name__)
app.config['SECRET_KEY'] = 'aeros_secret!'
socketio = SocketIO(app, cors_allowed_origins="*")

# Detector & Serial Initialization
detector = AccidentDetector(conf_thresh=0.30, iou_thresh=0.35)
serial_bridge = SerialBridge(mock=True)

# Path resolution for video source
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
video_source = os.path.join(BASE_DIR, "sample_crash.mp4")

# Agar video source webcam par switch karna ho toh `video_source = 1` use karein
cap = cv2.VideoCapture(video_source)

if not cap.isOpened():
    print(f"[ERROR] Could not open video file at: {video_source}")
else:
    print(f"[SUCCESS] Loaded video file from: {video_source}")

last_alert_time = 0

def generate_frames():
    global last_alert_time
    while True:
        success, frame = cap.read()
        if not success:
            # Video end hone par auto rewind (looping)
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            time.sleep(0.1)
            continue

        processed_frame, is_accident, severity = detector.process_frame(frame)

        if is_accident and (time.time() - last_alert_time > 5):
            last_alert_time = time.time()
            # Dashboard ko realtime alert bhejna
            socketio.emit('emergency_alert', {
                'status': 'ACCIDENT_DETECTED',
                'location': 'Zone A - NH-24 Junction',
                'severity': severity,
                'timestamp': time.strftime("%H:%M:%S"),
                'eta': '6 Mins',
                'ambulance': 'AMB-102 (Advanced ICU)'
            })
            # Hardware serial trigger
            serial_bridge.send_trigger('ACCIDENT', severity)

        ret, buffer = cv2.imencode('.jpg', processed_frame)
        frame_bytes = buffer.tobytes()

        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

@app.route('/')
def index():
    return render_template('dashboard.html')

@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == '__main__':
    print("[SERVER] Starting A.E.R.O.S Hospital Command Center on http://127.0.0.1:5000")
    socketio.run(app, debug=True, port=5000)