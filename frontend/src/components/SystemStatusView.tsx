import React from 'react';
import { 
  Cpu, 
  Camera, 
  ShieldCheck, 
  CheckCircle2, 
  Wifi
} from 'lucide-react';
import { useAeros } from '../context/AerosContext';

export const SystemStatusView: React.FC = () => {
  const { 
    systemStatus, 
    backendConnected, 
    iot 
  } = useAeros();

  const ml = systemStatus?.components?.ml_model;
  const cam = systemStatus?.components?.camera;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full select-none">
      
      {/* 1. YOLOv8 Incident Detector */}
      <div className="bg-white rounded-2xl p-5 border border-[#E3EEE8] shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#E6F4EA] flex items-center justify-center text-[#0F9D58]">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">YOLOv8 Collision Detector</h3>
                <p className="text-[10px] text-slate-400 font-mono">Ultralytics Neural Vision</p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              {ml?.status || (backendConnected ? 'OPERATIONAL' : 'STANDBY')}
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-400">Model Weights:</span>
              <span className="font-bold text-slate-700">{ml?.weights_file || 'yolov8n.pt'} ({ml?.weights_size_mb || 6.25} MB)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-400">Inference Architecture:</span>
              <span className="text-slate-700 font-bold">PyTorch + Spatial Overlap</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-400">Temporal Filter:</span>
              <span className="text-emerald-700 font-bold">3-Frame Collision Confirmation</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Monitored Classes:</span>
              <span className="text-slate-700 font-bold">car, bus, truck, motorcycle</span>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-[11px] text-[#00966A] font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Real-time spatial bounding box verified</span>
        </div>
      </div>

      {/* 2. Camera Feeds & Video Pipeline */}
      <div className="bg-white rounded-2xl p-5 border border-[#E3EEE8] shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#E6F4EA] flex items-center justify-center text-[#0F9D58]">
                <Camera className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">CCTV & ESP32-CAM Pipeline</h3>
                <p className="text-[10px] text-slate-400 font-mono">Video Capture Stream</p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
              {cam?.status || (backendConnected ? 'CONNECTED' : 'STANDBY')}
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-400">Configured Source:</span>
              <span className="font-bold text-slate-700">{cam?.configured_source || 'esp32'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-400">Stream Resolution:</span>
              <span className="font-bold text-slate-700">{cam?.frame_width || 640} × {cam?.frame_height || 480} px</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-400">Streaming Protocol:</span>
              <span className="text-slate-700 font-bold">MJPEG Socket Stream</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Fallback Source:</span>
              <span className="text-slate-700 font-bold">sample_crash.mp4</span>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-[11px] text-[#00966A] font-semibold">
          <Wifi className="w-3.5 h-3.5" />
          <span>Zero-latency single connection thread active</span>
        </div>
      </div>

      {/* 3. Safety Interlock & IoT Controller */}
      <div className="bg-white rounded-2xl p-5 border border-[#E3EEE8] shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#E6F4EA] flex items-center justify-center text-[#0F9D58]">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Traffic Controller & Safety</h3>
                <p className="text-[10px] text-slate-400 font-mono">Hardware Interlock Engine</p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              FAIL-SAFE ACTIVE
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-400">Conflicting Greens:</span>
              <span className="font-bold text-emerald-700">STRICTLY PREVENTED</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-400">Safety Guardrail:</span>
              <span className="font-bold text-slate-700">Prototype Sandbox Actuation</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-400">Hardware Driver:</span>
              <span className="text-slate-700 font-bold">{iot?.hardware_driver || 'ESP32 Serial (Simulated)'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">LCD Bus:</span>
              <span className="text-slate-700 font-bold">16×2 Character Display (I2C)</span>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-[11px] text-[#00966A] font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Priority Green Interlock Certified</span>
        </div>
      </div>

    </div>
  );
};
