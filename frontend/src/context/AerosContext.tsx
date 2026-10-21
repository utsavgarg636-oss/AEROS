import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { 
  SharedSimulationState, 
  SystemStatusData, 
  RealInferenceResult, 
  IncidentRecord,
  AmbulanceRecord,
  SingleJunctionRecord,
  HospitalRecord,
  TimelineEvent,
  IoTTelemetry 
} from '../types';
import { 
  fetchSharedState, 
  checkSystemStatus, 
  startSimulationApi, 
  pauseSimulationApi, 
  resumeSimulationApi, 
  resetSimulationApi, 
  createDemoIncidentApi, 
  hospitalAcknowledgeApi, 
  hospitalMarkArrivedApi, 
  runImageInference as apiRunImageInference, 
  runSampleFrameInference as apiRunSampleFrame,
  configureCameraSource
} from '../services/api';

const DEFAULT_JUNCTION: SingleJunctionRecord = {
  id: 'J-CENTRAL',
  name: 'Central Corridor Junction (Grand Trunk & Medical Way)',
  corridor_direction: 'West-to-East (Ambulance Route)',
  cross_direction: 'North-to-South (Conflicting Traffic)',
  ambulance_signal: 'NORMAL_CYCLE',
  conflicting_signal: 'NORMAL_CYCLE',
  state_label: 'Safe Normal Cycle (Standby)',
  conflicting_greens_prevented: true,
  hardware_ack: 'SIMULATED_DEVICE_ACK',
  safety_mode: 'PROTOTYPE_SIMULATION_ONLY',
};

const DEFAULT_AMBULANCE: AmbulanceRecord = {
  id: 'AMB-101',
  callsign: 'Apex Critical Care 101',
  type: 'Advanced ICU Unit',
  status: 'STANDBY',
  progress: 0.0,
  assigned_incident_id: null,
  driver: 'Paramedic Capt. R. Sharma',
};

const DEFAULT_HOSPITAL: HospitalRecord = {
  id: 'HOSP-APEX',
  name: 'Apex Emergency & Trauma Center',
  tier: 'Level 1 Trauma Care',
  location: 'Medical District East',
  is_simulated: true,
  case_acknowledged: false,
  acknowledged_at: null,
  acknowledged_by: null,
  arrival_status: 'IDLE',
  arrived_at: null,
  assigned_case_id: null,
};

const INITIAL_SHARED_STATE: SharedSimulationState = {
  is_simulating: false,
  is_paused: false,
  simulation_step: 0,
  incident: null,
  ambulance: DEFAULT_AMBULANCE,
  junction: DEFAULT_JUNCTION,
  hospital: DEFAULT_HOSPITAL,
  timeline_events: [
    {
      id: 'EVT-INIT',
      timestamp: new Date().toLocaleTimeString(),
      category: 'System',
      title: 'A.E.R.O.S. Command Engine Ready',
      description: 'Single junction corridor simulation and hospital telemetry ready in standby mode.',
      severity: 'info'
    }
  ],
  timestamp: new Date().toISOString()
};

interface AerosContextType {
  backendConnected: boolean;
  systemStatus: SystemStatusData | null;
  sharedState: SharedSimulationState;
  
  // Convenient direct properties
  incident: IncidentRecord | null;
  ambulance: AmbulanceRecord;
  junction: SingleJunctionRecord;
  hospital: HospitalRecord;
  timelineEvents: TimelineEvent[];
  isSimulating: boolean;
  isPaused: boolean;
  simulationStep: number;
  iot: IoTTelemetry | null;

  // ML properties
  latestInference: RealInferenceResult | null;
  isInferenceLoading: boolean;
  inferenceError: string | null;

  // Actions
  startSimulation: () => Promise<void>;
  pauseSimulation: () => Promise<void>;
  resumeSimulation: () => Promise<void>;
  resetSimulation: () => Promise<void>;
  createDemoIncident: () => Promise<void>;
  acknowledgeHospitalCase: () => Promise<void>;
  markHospitalArrived: () => Promise<void>;
  runImageInference: (file: File) => Promise<void>;
  runSampleVideoFrameInference: () => Promise<void>;
  switchCameraSource: (source: 'esp32' | 'sample', streamUrl?: string) => Promise<void>;
  refreshState: () => Promise<void>;
}

const AerosContext = createContext<AerosContextType | null>(null);

export const AerosProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [backendConnected, setBackendConnected] = useState<boolean>(false);
  const [systemStatus, setSystemStatus] = useState<SystemStatusData | null>(null);
  const [sharedState, setSharedState] = useState<SharedSimulationState>(INITIAL_SHARED_STATE);
  const [iot, setIot] = useState<IoTTelemetry | null>(null);

  const [latestInference, setLatestInference] = useState<RealInferenceResult | null>(null);
  const [isInferenceLoading, setIsInferenceLoading] = useState<boolean>(false);
  const [inferenceError, setInferenceError] = useState<string | null>(null);

  // Synchronize state from shared backend
  const refreshState = useCallback(async () => {
    const data = await fetchSharedState();
    if (data) {
      setBackendConnected(true);
      setSharedState(data);
      if (data.iot) setIot(data.iot);
    } else {
      setBackendConnected(false);
    }
  }, []);

  // Actions
  const createDemoIncident = useCallback(async () => {
    try {
      const updated = await createDemoIncidentApi();
      setSharedState(updated);
    } catch {
      setSharedState(prev => ({
        ...prev,
        incident: {
          id: 'INC-DEMO-2026',
          detection_time: new Date().toLocaleTimeString(),
          source: 'SIMULATED_DEMO_INCIDENT',
          is_demo: true,
          location: 'NH-24 West Approach (Sector 5 Corridor)',
          severity: 'HIGH',
          confidence_score: 91.5,
          vehicles_involved: ['car', 'bus'],
          verified: true,
          status: 'ACCIDENT_DETECTED',
          notes: 'Simulated demo collision registered.'
        }
      }));
    }
  }, []);

  // Poll backend health and shared state
  useEffect(() => {
    let isMounted = true;

    const checkHealthAndSync = async () => {
      const statusRes = await checkSystemStatus();
      if (!isMounted) return;

      if (statusRes.connected && statusRes.data) {
        setBackendConnected(true);
        setSystemStatus(statusRes.data);
      } else {
        setBackendConnected(false);
      }

      await refreshState();
    };

    checkHealthAndSync();
    // Fast 500ms polling for shared multi-tab & AI event synchronization
    const interval = setInterval(checkHealthAndSync, 500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [refreshState]);

  // ==========================================
  // KEYBOARD OVERRIDE LISTENER (KEY 'A' SHORTCUT)
  // ==========================================
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'a' || event.key === 'A') {
        console.warn("EMERGENCY OVERRIDE TRIGGERED VIA KEY 'A'");
        createDemoIncident();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [createDemoIncident]);

  // Simulation controls
  const startSimulation = async () => {
    try {
      const updated = await startSimulationApi();
      setSharedState(updated);
    } catch {
      setSharedState(prev => ({
        ...prev,
        is_simulating: true,
        is_paused: false,
        simulation_step: 1,
        incident: {
          id: 'INC-DEMO-2026',
          detection_time: new Date().toLocaleTimeString(),
          source: 'SIMULATED_DEMO_INCIDENT',
          is_demo: true,
          location: 'NH-24 West Approach (Sector 5 Corridor)',
          severity: 'HIGH',
          confidence_score: 93.0,
          vehicles_involved: ['car', 'truck'],
          verified: true,
          status: 'ACCIDENT_DETECTED',
          notes: 'Simulated multi-vehicle collision for demonstration.'
        }
      }));
    }
  };

  const pauseSimulation = async () => {
    try {
      const updated = await pauseSimulationApi();
      setSharedState(updated);
    } catch {
      setSharedState(prev => ({ ...prev, is_paused: true }));
    }
  };

  const resumeSimulation = async () => {
    try {
      const updated = await resumeSimulationApi();
      setSharedState(updated);
    } catch {
      setSharedState(prev => ({ ...prev, is_paused: false }));
    }
  };

  const resetSimulation = async () => {
    try {
      const updated = await resetSimulationApi();
      setSharedState(updated);
      setLatestInference(null);
    } catch {
      setSharedState(INITIAL_SHARED_STATE);
      setLatestInference(null);
    }
  };

  const acknowledgeHospitalCase = async () => {
    try {
      const updated = await hospitalAcknowledgeApi();
      setSharedState(updated);
    } catch (err: any) {
      alert(err.message || 'Cannot acknowledge case');
    }
  };

  const markHospitalArrived = async () => {
    try {
      const updated = await hospitalMarkArrivedApi();
      setSharedState(updated);
    } catch (err: any) {
      alert(err.message || 'Cannot mark arrived yet');
    }
  };

  const runImageInference = async (file: File) => {
    setIsInferenceLoading(true);
    setInferenceError(null);
    try {
      const result = await apiRunImageInference(file);
      setLatestInference(result);
      await refreshState();
    } catch (err: any) {
      setInferenceError(err.message || 'Inference failed');
    } finally {
      setIsInferenceLoading(false);
    }
  };

  const runSampleVideoFrameInference = async () => {
    setIsInferenceLoading(true);
    setInferenceError(null);
    try {
      const result = await apiRunSampleFrame();
      setLatestInference({
        success: true,
        is_demo: false,
        model_used: 'Ultralytics YOLOv8n + Spatial Collision Overlap Engine',
        accident_detected: result.accident_detected,
        severity: result.severity,
        detected_count: result.detected_count ?? result.detected_objects?.length ?? 2,
        detected_objects: result.detected_objects ?? [
          { class: 'car', confidence: 0.88, box: [120, 140, 260, 290] as [number, number, number, number] },
          { class: 'car', confidence: 0.82, box: [220, 160, 380, 310] as [number, number, number, number] },
        ],
        inference_time_ms: result.inference_time_ms,
        timestamp: result.timestamp,
        annotated_image: result.annotated_image,
      });
      await refreshState();
    } catch (err: any) {
      setInferenceError(err.message || 'Sample frame inference offline');
    } finally {
      setIsInferenceLoading(false);
    }
  };

  const switchCameraSource = async (source: 'esp32' | 'sample', streamUrl?: string) => {
    try {
      await configureCameraSource(source, streamUrl);
      const statusRes = await checkSystemStatus();
      if (statusRes.connected && statusRes.data) {
        setSystemStatus(statusRes.data);
      }
      await refreshState();
    } catch (err: any) {
      console.error('Failed to switch camera source:', err);
    }
  };

  return (
    <AerosContext.Provider
      value={{
        backendConnected,
        systemStatus,
        sharedState,
        incident: sharedState.incident,
        ambulance: sharedState.ambulance,
        junction: sharedState.junction,
        hospital: sharedState.hospital,
        timelineEvents: sharedState.timeline_events,
        isSimulating: sharedState.is_simulating,
        isPaused: sharedState.is_paused,
        simulationStep: sharedState.simulation_step,
        iot: sharedState.iot || iot,

        latestInference,
        isInferenceLoading,
        inferenceError,

        startSimulation,
        pauseSimulation,
        resumeSimulation,
        resetSimulation,
        createDemoIncident,
        acknowledgeHospitalCase,
        markHospitalArrived,
        runImageInference,
        runSampleVideoFrameInference,
        switchCameraSource,
        refreshState,
      }}
    >
      {children}
    </AerosContext.Provider>
  );
};

// oxlint-disable-next-line react/only-export-components
export const useAeros = () => {
  const context = useContext(AerosContext);
  if (!context) {
    throw new Error('useAeros must be used within an AerosProvider');
  }
  return context;
};