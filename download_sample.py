import urllib.request

# Sample traffic/car crash test video download
url = "https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/car-detection.mp4"
output_path = "sample_crash.mp4"

print("[INFO] Downloading sample test video...")
try:
    urllib.request.urlretrieve(url, output_path)
    print(f"[SUCCESS] Sample video downloaded successfully as '{output_path}'!")
except Exception as e:
    print(f"[ERROR] Failed to download video: {e}")