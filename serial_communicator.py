import serial
import time

class SerialBridge:
    def __init__(self, port='COM3', baudrate=115200, mock=True):
        self.mock = mock
        self.ser = None
        if not self.mock:
            try:
                self.ser = serial.Serial(port, baudrate, timeout=1)
                print(f"[SERIAL] Connected to ESP32 on {port}")
            except Exception as e:
                print(f"[SERIAL WARNING] Could not connect to {port}. Switching to Mock Mode.")
                self.mock = True

    def send_trigger(self, alert_type, severity):
        payload = f"{alert_type}:{severity}\n"
        if self.mock:
            print(f"[MOCK SERIAL SEND] -> ESP32: {payload.strip()}")
        else:
            try:
                self.ser.write(payload.encode('utf-8'))
                print(f"[SERIAL SENT] -> ESP32: {payload.strip()}")
            except Exception as e:
                print(f"[SERIAL ERROR] Failed to send: {e}")

    def close(self):
        if self.ser and self.ser.is_open:
            self.ser.close()