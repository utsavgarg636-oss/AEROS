export type SystemStatusType = 
  | 'CONNECTED' 
  | 'DISCONNECTED' 
  | 'DEMO MODE' 
  | 'SIMULATED' 
  | 'MODEL AVAILABLE / INFERENCE OFFLINE';

export interface HardwareComponentStatus {
  status: SystemStatusType;
  framework?: string;
  weights_file?: string;
  weights_size_mb?: number;
  model_loaded?: boolean;
  error?: string | null;
  supported_classes?: string[];
  source?: string;
  source_type?: 'esp32' | 'sample';
  active_source?: 'esp32' | 'sample';
  configured_source?: 'esp32' | 'sample';
  live_stream_available?: boolean;
  junction_count?: number;
  hospital_count?: number;
  note?: string;
  frame_width?: number;
  frame_height?: number;
  fps?: number;
  reconnect_attempts?: number;
  diagnostic_message?: string;
  is_fallback_active?: boolean;
  last_successful_frame?: string | null;
}

export interface SystemStatusData {
  timestamp: string;
  system_name: string;
  status: string;
  components: {
    ml_model: HardwareComponentStatus;
    camera: HardwareComponentStatus;
    traffic_junction: HardwareComponentStatus;
    hospital: HardwareComponentStatus;
    iot_adapter?: {
      hardware_connected: boolean;
      note?: string;
      hardware_driver?: string;
    };
  };
}

export type SeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface IncidentRecord {
  id: string;
  detection_time: string;
  source: string;
  is_demo: boolean;
  location: string;
  severity: SeverityLevel;
  confidence_score?: number;
  vehicles_involved?: string[];
  verified: boolean;
  status: string;
  notes?: string;
}

export interface AmbulanceRecord {
  id: string;
  callsign: string;
  type: string;
  status: 'STANDBY' | 'ASSIGNED' | 'APPROACHING' | 'CROSSING' | 'EN_ROUTE_HOSPITAL' | 'ARRIVED';
  progress: number; // 0 to 100
  assigned_incident_id: string | null;
  driver: string;
}

export interface SingleJunctionRecord {
  id: string;
  name: string;
  corridor_direction: string;
  cross_direction: string;
  ambulance_signal: 'NORMAL_CYCLE' | 'GREEN' | 'AMBER' | 'RED';
  conflicting_signal: 'NORMAL_CYCLE' | 'RED' | 'AMBER';
  state_label: string;
  conflicting_greens_prevented: boolean;
  hardware_ack?: string;
  safety_mode?: string;
}

export interface HospitalRecord {
  id: string;
  name: string;
  tier: string;
  location: string;
  is_simulated: boolean;
  case_acknowledged: boolean;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  arrival_status: 'IDLE' | 'IN_TRANSIT' | 'ARRIVED';
  arrived_at: string | null;
  assigned_case_id: string | null;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  category: 'Accident' | 'Ambulance' | 'Traffic' | 'Hospital' | 'System';
  title: string;
  description: string;
  severity?: 'info' | 'warning' | 'critical' | 'success';
}

export interface IoTTelemetry {
  hardware_connected: boolean;
  hardware_driver: string;
  port: string;
  requested_state?: {
    ambulance_corridor_signal: string;
    conflicting_cross_signal: string;
    lcd_line1: string;
    lcd_line2: string;
    buzzer_active: boolean;
    timestamp: string;
  };
  acknowledged_state?: {
    ambulance_corridor_signal: string;
    conflicting_cross_signal: string;
    lcd_line1: string;
    lcd_line2: string;
    buzzer_active: boolean;
    ack_source: string;
    latency_ms: number;
    timestamp: string;
  };
  safety_guardrails?: {
    live_public_road_control: string;
    conflicting_greens_prevented: boolean;
    interlock_status: string;
    operating_mode: string;
  };
}

export interface SharedSimulationState {
  is_simulating: boolean;
  is_paused: boolean;
  simulation_step: number;
  incident: IncidentRecord | null;
  ambulance: AmbulanceRecord;
  junction: SingleJunctionRecord;
  hospital: HospitalRecord;
  timeline_events: TimelineEvent[];
  iot?: IoTTelemetry;
  timestamp: string;
}

export interface RealInferenceResult {
  success: boolean;
  is_demo: boolean;
  model_used: string;
  accident_detected: boolean;
  severity: SeverityLevel;
  detected_count: number;
  detected_objects: Array<{
    class: string;
    confidence: number;
    box: [number, number, number, number];
  }>;
  inference_time_ms: number;
  timestamp: string;
  annotated_image?: string;
}
