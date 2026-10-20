import cv2
import numpy as np
import time
from ultralytics import YOLO

class AccidentDetector:
    def __init__(self, model_path='yolov8n.pt', conf_thresh=0.25, iou_thresh=0.15):
        self.model = YOLO(model_path)
        self.conf_thresh = conf_thresh
        self.iou_thresh = iou_thresh
        self.collision_start_time = None
        self.accident_flag = False

    def calculate_iou(self, box1, box2):
        xi1 = max(box1[0], box2[0])
        yi1 = max(box1[1], box2[1])
        xi2 = min(box1[2], box2[2])
        yi2 = min(box1[3], box2[3])

        inter_area = max(0, xi2 - xi1) * max(0, yi2 - yi1)
        box1_area = (box1[2] - box1[0]) * (box1[3] - box1[1])
        box2_area = (box2[2] - box2[0]) * (box2[3] - box2[1])
        union_area = box1_area + box2_area - inter_area

        return inter_area / float(union_area) if union_area > 0 else 0

    def process_frame(self, frame, require_temporal_confirmation=True):
        frame = cv2.resize(frame, (640, 480))
        frame_area = 640 * 480

        results = self.model(frame, conf=self.conf_thresh, verbose=False)
        detected_objects = []

        for r in results:
            for box in r.boxes:
                cls_id = int(box.cls[0])
                class_name = self.model.names[cls_id]
                
                if class_name in ['car', 'motorcycle', 'bus', 'truck', 'cell phone']:
                    coords = list(map(int, box.xyxy[0]))
                    center_x = (coords[0] + coords[2]) // 2
                    center_y = (coords[1] + coords[3]) // 2
                    detected_objects.append((coords, class_name, (center_x, center_y)))
                    
                    cv2.rectangle(frame, (coords[0], coords[1]), (coords[2], coords[3]), (0, 255, 0), 2)
                    cv2.putText(frame, f"{class_name.upper()}", (coords[0], coords[1]-8),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

        actual_collision = False
        num_objects = len(detected_objects)
        involved_classes = []
        max_impact_area = 0

        # 1. STRICT OVERLAP CHECK (Car Takrane Par Hi Collision Flag TRUE Hoga)
        for i in range(num_objects):
            box_i, cls_i, center_i = detected_objects[i]
            for j in range(i + 1, num_objects):
                box_j, cls_j, center_j = detected_objects[j]
                
                iou = self.calculate_iou(box_i, box_j)
                # Centroid Distance Check (Euclidean distance between car centers)
                dist = np.sqrt((center_i[0] - center_j[0])**2 + (center_i[1] - center_j[1])**2)

                # Jab tak 15% Overlap na ho YA Center distance 80px se kam na ho, accident trigger nahi hoga
                if iou >= self.iou_thresh or dist < 85:
                    actual_collision = True
                    involved_classes.extend([cls_i, cls_j])
                    
                    area_i = (box_i[2] - box_i[0]) * (box_i[3] - box_i[1])
                    area_j = (box_j[2] - box_j[0]) * (box_j[3] - box_j[1])
                    max_impact_area = max(max_impact_area, area_i + area_j)

                    cv2.rectangle(frame, (box_i[0], box_i[1]), (box_i[2], box_i[3]), (0, 0, 255), 3)
                    cv2.rectangle(frame, (box_j[0], box_j[1]), (box_j[2], box_j[3]), (0, 0, 255), 3)

        # 2. SINGLE-VEHICLE ROLLOVER CHECK
        if not actual_collision and num_objects == 1:
            box, cls_name, _ = detected_objects[0]
            bw = box[2] - box[0]
            bh = box[3] - box[1]
            aspect_ratio = float(bw) / bh if bh > 0 else 0
            if aspect_ratio > 3.0 or aspect_ratio < 0.2:  # Extreme Deformation Only
                actual_collision = True
                involved_classes.append(cls_name)
                max_impact_area = bw * bh
                cv2.rectangle(frame, (box[0], box[1]), (box[2], box[3]), (0, 0, 255), 3)

        # 3. SEVERITY DECISION (ONLY ON CONFIRMED ACCIDENT)
        severity = "LOW"
        if actual_collision:
            cars_heavy = sum(1 for c in involved_classes if c in ['car', 'bus', 'truck', 'cell phone'])
            impact_ratio = max_impact_area / frame_area

            # Agar takraao confirm hua hai AUR (Heavy vehicles hain YA Impact area bada hai) -> HIGH
            if cars_heavy >= 2 or impact_ratio > 0.05 or num_objects >= 3:
                severity = "HIGH"
            elif cars_heavy == 1 or impact_ratio > 0.02:
                severity = "MEDIUM"
            else:
                severity = "LOW"

            if not require_temporal_confirmation:
                self.accident_flag = True
            elif self.collision_start_time is None:
                self.collision_start_time = time.time()
            elif time.time() - self.collision_start_time >= 0.3:  # 0.3s delay guarantees crash confirmation
                self.accident_flag = True
                
            if self.accident_flag:
                banner_text = f"CRITICAL ACCIDENT DETECTED! [{severity}]"
                cv2.rectangle(frame, (0, 0), (frame.shape[1], 50), (0, 0, 200), -1)
                cv2.putText(frame, banner_text, (20, 35),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        else:
            if require_temporal_confirmation:
                self.collision_start_time = None
                self.accident_flag = False
            else:
                return frame, False, "NONE"

        return frame, self.accident_flag, severity