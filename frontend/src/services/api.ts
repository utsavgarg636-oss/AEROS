import type { 
  SystemStatusData, 
  SharedSimulationState, 
  RealInferenceResult, 
  IoTTelemetry 
} from '../types';

const API_BASE = '/api';

export async function fetchSharedState(): Promise<SharedSimulationState | null> {
  try {
    const res = await fetch(`${API_BASE}/simulation/state`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) throw new Error('Failed to fetch shared state');
    return await res.json();
  } catch (err) {
    console.warn('fetchSharedState error:', err);
    return null;
  }
}

export async function checkSystemStatus(): Promise<{ connected: boolean; data?: SystemStatusData }> {
  try {
    const res = await fetch(`${API_BASE}/status`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) throw new Error('Status endpoint non-200');
    const data = await res.json();
    return { connected: true, data };
  } catch {
    return { connected: false };
  }
}

export async function startSimulationApi(): Promise<SharedSimulationState> {
  const res = await fetch(`${API_BASE}/simulation/start`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to start simulation');
  return await res.json();
}

export async function pauseSimulationApi(): Promise<SharedSimulationState> {
  const res = await fetch(`${API_BASE}/simulation/pause`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to pause simulation');
  return await res.json();
}

export async function resumeSimulationApi(): Promise<SharedSimulationState> {
  const res = await fetch(`${API_BASE}/simulation/resume`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to resume simulation');
  return await res.json();
}

export async function resetSimulationApi(): Promise<SharedSimulationState> {
  const res = await fetch(`${API_BASE}/simulation/reset`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reset simulation');
  return await res.json();
}

export async function createDemoIncidentApi(): Promise<SharedSimulationState> {
  const res = await fetch(`${API_BASE}/simulation/demo-incident`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to create demo incident');
  return await res.json();
}

export async function hospitalAcknowledgeApi(): Promise<SharedSimulationState> {
  const res = await fetch(`${API_BASE}/hospital/acknowledge`, { method: 'POST' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to acknowledge case' }));
    throw new Error(err.detail || 'Failed to acknowledge case');
  }
  return await res.json();
}

export async function hospitalMarkArrivedApi(): Promise<SharedSimulationState> {
  const res = await fetch(`${API_BASE}/hospital/mark-arrived`, { method: 'POST' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to mark arrival' }));
    throw new Error(err.detail || 'Failed to mark arrival');
  }
  return await res.json();
}

export async function runImageInference(file: File): Promise<RealInferenceResult> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/inference/image`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: 'Inference request failed' }));
    throw new Error(errData.detail || 'Inference failed');
  }

  return await res.json();
}

export async function runSampleFrameInference(): Promise<{
  success: boolean;
  accident_detected: boolean;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  inference_time_ms: number;
  timestamp: string;
  annotated_image: string;
  detected_count?: number;
  detected_objects?: Array<{ class: string; confidence: number; box: [number, number, number, number] }>;
}> {
  const res = await fetch(`${API_BASE}/inference/sample-frame`);
  if (!res.ok) {
    throw new Error('Sample frame inference request failed');
  }
  return await res.json();
}

export async function fetchIoTTelemetry(): Promise<IoTTelemetry | null> {
  try {
    const res = await fetch(`${API_BASE}/iot/state`, { signal: AbortSignal.timeout(2000) });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function updateVitalsApi(vitals: { heart_rate?: number; bpm?: number; temperature?: number; spo2?: number }): Promise<any> {
  const res = await fetch(`${API_BASE}/hospital/vitals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(vitals),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to update vitals' }));
    throw new Error(err.detail || 'Failed to update vitals');
  }
  return await res.json();
}

export async function togglePrioritySwitchApi(active: boolean): Promise<any> {
  const res = await fetch(`${API_BASE}/junction/priority-switch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ active }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to toggle priority switch' }));
    throw new Error(err.detail || 'Failed to toggle priority switch');
  }
  return await res.json();
}

export async function configureCameraSource(source: 'esp32' | 'sample', streamUrl?: string): Promise<any> {
  const res = await fetch(`${API_BASE}/camera/configure`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source, stream_url: streamUrl }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to configure camera' }));
    throw new Error(err.detail || 'Failed to configure camera');
  }
  return await res.json();
}
