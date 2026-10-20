import React, { useState, useRef } from 'react';
import { 
  Camera, 
  Upload, 
  AlertOctagon, 
  Cpu, 
  Sparkles, 
  Video, 
  FileVideo, 
  RotateCcw, 
  MapPin, 
  Clock, 
  Car 
} from 'lucide-react';
import { useAeros } from '../context/AerosContext';

export const IncidentPanel: React.FC = () => {
  const {
    backendConnected,
    incident,
    latestInference,
    isInferenceLoading,
    inferenceError,
    runImageInference,
    runSampleVideoFrameInference,
    createDemoIncident,
    resetSimulation,
  } = useAeros();

  const [streamActive, setStreamActive] = useState<boolean>(true);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    await runImageInference(file);
  };

  const handleSampleFrameClick = async () => {
    setImagePreview(null);
    await runSampleVideoFrameInference();
  };

  const isDemo = incident?.is_demo ?? true;

  return (
    <div className="spatial-glass rounded-2xl p-4 flex flex-col gap-3.5 border border-[#38BDF8]/20 shadow-2xl bg-[#111D2E]/90">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[#08111F] border border-[#38BDF8]/30 flex items-center justify-center">
            <Camera className="w-3.5 h-3.5 text-[#38BDF8]" />
          </div>
          <h2 className="text-sm font-bold tracking-wider font-hud text-white uppercase">
            Accident Detection & CCTV
          </h2>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/30">
          WEST APPROACH CAM
        </span>
      </div>

      {/* Prominent Source Label Badge */}
      <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-[#08111F] border border-slate-800 text-xs font-mono">
        <span className="text-slate-400 flex items-center gap-1.5">
          <Cpu className="w-3 h-3 text-[#38BDF8]" /> Source Mode:
        </span>
        <span className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider ${
          incident ? (isDemo ? 'bg-amber-500/15 text-[#F59E0B] border border-[#F59E0B]/30' : 'bg-emerald-500/15 text-[#22C55E] border border-[#22C55E]/30') : 'text-slate-400 bg-slate-800/60'
        }`}>
          {incident ? (isDemo ? 'DEMO SIMULATION' : 'ML ACCIDENT DETECTOR') : 'DEMO SIMULATION STANDBY'}
        </span>
      </div>

      {/* CCTV Camera Preview Area */}
      <div className="relative aspect-video rounded-xl overflow-hidden bg-[#08111F] border border-slate-800 flex items-center justify-center group shadow-inner">
        
        {/* Stream or uploaded image */}
        {latestInference?.annotated_image ? (
          <img 
            src={latestInference.annotated_image} 
            alt="AI Annotated Frame" 
            className="w-full h-full object-contain"
          />
        ) : imagePreview ? (
          <img 
            src={imagePreview} 
            alt="Uploaded Test Frame" 
            className="w-full h-full object-contain"
          />
        ) : streamActive && backendConnected ? (
          <img 
            src="/api/video_feed" 
            alt="Live Stream Feed" 
            className="w-full h-full object-cover"
            onError={() => setStreamActive(false)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <Video className="w-8 h-8 text-slate-600 mb-2 animate-pulse" />
            <p className="text-xs text-slate-400 font-mono">CCTV WEST FEED STANDBY</p>
            <p className="text-[10px] text-slate-500 font-mono mt-1">Upload frame or trigger demo incident</p>
          </div>
        )}

        {/* Live HUD Overlay (Top-Left) */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded bg-black/75 backdrop-blur-md border border-white/10 text-[10px] font-mono">
          <span className={`w-2 h-2 rounded-full ${backendConnected ? 'bg-[#22C55E] animate-ping' : 'bg-[#F59E0B]'}`} />
          <span className="font-bold text-white">
            {backendConnected ? 'FEED: sample_crash.mp4' : 'DEMO PLAYBACK'}
          </span>
        </div>

        {/* HUD Model Tag (Top-Right) */}
        <div className="absolute top-2 right-2 px-2 py-1 rounded bg-black/75 backdrop-blur-md border border-white/10 text-[10px] font-mono text-slate-300">
          YOLOv8 Collision Model
        </div>

        {/* Inference Loading Spinner */}
        {isInferenceLoading && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-20">
            <div className="w-8 h-8 border-2 border-[#38BDF8] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-[#38BDF8] font-mono mt-2 tracking-wider">RUNNING YOLOv8 INFERENCE...</p>
          </div>
        )}

        {/* Collision Alert Banner */}
        {incident && (
          <div className="absolute bottom-2 inset-x-2 p-2 rounded-lg bg-red-950/90 backdrop-blur-md border border-[#FF4D5A]/80 flex items-center justify-between text-xs font-mono shadow-[0_0_15px_rgba(255,77,90,0.4)] animate-pulse">
            <div className="flex items-center gap-1.5 text-[#FF4D5A] font-bold text-[11px]">
              <AlertOctagon className="w-3.5 h-3.5 fill-[#FF4D5A]/20" />
              <span>COLLISION CONFIRMED</span>
            </div>
            <span className="text-white text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/40">
              [{incident.severity}]
            </span>
          </div>
        )}
      </div>

      {/* CCTV Action Buttons */}
      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
        <button
          onClick={handleSampleFrameClick}
          disabled={isInferenceLoading}
          className="p-2 rounded-lg bg-[#08111F] hover:bg-[#38BDF8]/10 text-slate-200 border border-slate-700 hover:border-[#38BDF8]/40 flex items-center justify-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50 text-[11px]"
          title="Run inference directly on sample crash video frame"
        >
          <FileVideo className="w-3.5 h-3.5 text-[#38BDF8]" />
          <span>Test Sample Crash</span>
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isInferenceLoading}
          className="p-2 rounded-lg bg-[#08111F] hover:bg-[#22C55E]/10 text-slate-200 border border-slate-700 hover:border-[#22C55E]/40 flex items-center justify-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50 text-[11px]"
          title="Upload image or CCTV snapshot to run real YOLOv8 accident detector"
        >
          <Upload className="w-3.5 h-3.5 text-[#22C55E]" />
          <span>Upload Image</span>
        </button>
        <input 
          ref={fileInputRef} 
          type="file" 
          accept="image/*" 
          onChange={handleFileUpload} 
          className="hidden" 
        />
      </div>

      {inferenceError && (
        <div className="p-2 rounded-lg bg-red-950/60 border border-red-500/40 text-[11px] text-red-300 font-mono">
          Model Note: {inferenceError}
        </div>
      )}

      {/* ACCIDENT LOCATION CARD (With Clear Red Emergency Marker) */}
      <div className={`p-3 rounded-xl border transition-all ${
        incident 
          ? 'bg-red-950/30 border-[#FF4D5A]/50 shadow-[0_0_20px_rgba(255,77,90,0.15)]' 
          : 'bg-[#08111F] border-slate-800'
      }`}>
        <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
              incident ? 'bg-[#FF4D5A]/20 border border-[#FF4D5A] animate-pulse' : 'bg-slate-800 text-slate-500'
            }`}>
              <MapPin className={`w-3.5 h-3.5 ${incident ? 'text-[#FF4D5A]' : 'text-slate-400'}`} />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-mono uppercase">Incident Location</span>
              <h4 className="text-xs font-bold text-white font-hud">
                {incident?.location || 'NH-24 West Approach (Sector 5 Corridor)'}
              </h4>
            </div>
          </div>

          {/* Red Emergency Marker Tag */}
          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 ${
            incident 
              ? 'bg-[#FF4D5A]/20 text-[#FF4D5A] border border-[#FF4D5A]/40' 
              : 'bg-slate-800 text-slate-500'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${incident ? 'bg-[#FF4D5A] animate-ping' : 'bg-slate-600'}`} />
            {incident ? 'RED ALERT' : 'NORMAL'}
          </span>
        </div>

        {/* Incident Details Grid */}
        <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] font-mono">
          <div>
            <span className="text-slate-400 text-[10px]">Incident ID:</span>
            <p className="font-bold text-white mt-0.5 truncate">
              {incident?.id || 'NO ACTIVE INCIDENT'}
            </p>
          </div>

          <div>
            <span className="text-slate-400 text-[10px]">Status:</span>
            <p className={`font-bold mt-0.5 ${incident ? 'text-[#38BDF8]' : 'text-slate-400'}`}>
              {incident?.status || 'STANDBY'}
            </p>
          </div>

          <div>
            <span className="text-slate-400 text-[10px]">Severity Level:</span>
            <p className={`font-bold mt-0.5 ${incident ? 'text-[#FF4D5A]' : 'text-slate-400'}`}>
              {incident?.severity || 'NONE'}
            </p>
          </div>

          <div>
            <span className="text-slate-400 text-[10px]">Detection Time:</span>
            <p className="text-slate-200 mt-0.5 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              {incident?.detection_time || '--:--:--'}
            </p>
          </div>
        </div>

        {/* Vehicles Involved */}
        <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono">
          <span className="text-slate-400 flex items-center gap-1">
            <Car className="w-3 h-3 text-slate-400" /> Vehicles:
          </span>
          <span className="text-slate-200 font-semibold">
            {incident?.vehicles_involved?.join(', ') || (latestInference?.detected_count ? `${latestInference.detected_count} Vehicles Detected` : 'Standby / 2 Units')}
          </span>
        </div>
      </div>

      {/* Simulation Triggers */}
      <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-xs">
        <button
          onClick={createDemoIncident}
          className="p-2 rounded-lg bg-[#08111F] hover:bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/30 hover:border-[#38BDF8]/60 flex items-center justify-center gap-1.5 cursor-pointer transition-colors text-[11px] font-bold"
          title="Initialize clearly labelled demo incident without ML inference"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Demo Incident</span>
        </button>

        <button
          onClick={resetSimulation}
          className="p-2 rounded-lg bg-[#08111F] hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-500/30 flex items-center justify-center gap-1.5 cursor-pointer transition-colors text-[11px]"
          title="Reset incident and simulation state"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset System</span>
        </button>
      </div>

    </div>
  );
};
