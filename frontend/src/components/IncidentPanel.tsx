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
    systemStatus,
    incident,
    latestInference,
    isInferenceLoading,
    inferenceError,
    runImageInference,
    runSampleVideoFrameInference,
    switchCameraSource,
    createDemoIncident,
    resetSimulation,
  } = useAeros();

  const [streamActive, setStreamActive] = useState<boolean>(true);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cameraComp = systemStatus?.components?.camera;
  const isEsp32 = cameraComp?.source_type === 'esp32' || (!cameraComp?.source_type && Boolean(cameraComp?.source?.includes('ESP32')));
  const isCameraConnected = cameraComp?.status === 'CONNECTED';

  const feedLabel = !backendConnected
    ? 'DEMO PLAYBACK'
    : isEsp32
      ? isCameraConnected
        ? 'FEED: ESP32-CAM LIVE'
        : 'FEED: ESP32-CAM (CONNECTING)'
      : 'FEED: sample_crash.mp4';

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
    <div className="bg-white rounded-2xl p-4 flex flex-col gap-3.5 border border-[#E3EEE8] shadow-sm">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#DDF7EA] border border-[#A7F3D0] flex items-center justify-center">
            <Camera className="w-4 h-4 text-[#10B981]" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-[#1F2937]">
              Accident Detection & CCTV
            </h2>
            <span className="text-[10px] text-slate-500 font-mono">Real-time Stream & Inference</span>
          </div>
        </div>
        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
          WEST CAM
        </span>
      </div>

      {/* Source Mode Badge */}
      <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-mono">
        <span className="text-slate-500 flex items-center gap-1.5 text-[11px]">
          <Cpu className="w-3.5 h-3.5 text-[#10B981]" /> Source Mode:
        </span>
        <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wide ${
          incident 
            ? (isDemo ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200') 
            : 'text-slate-500 bg-slate-200/60'
        }`}>
          {incident ? (isDemo ? 'DEMO SIMULATION' : 'ML ACCIDENT DETECTOR') : 'DETECTION STANDBY'}
        </span>
      </div>

      {/* CCTV Camera Preview Area */}
      <div className="relative aspect-video rounded-xl overflow-hidden bg-[#0A111E] border border-slate-800 flex items-center justify-center group shadow-inner">
        
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
            <p className="text-[10px] text-slate-500 font-mono mt-1">Upload frame or select video feed</p>
          </div>
        )}

        {/* Live HUD Overlay (Top-Left) */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded bg-black/75 backdrop-blur-md border border-white/10 text-[10px] font-mono">
          <span className={`w-2 h-2 rounded-full ${
            !backendConnected
              ? 'bg-amber-400'
              : (isEsp32 ? (isCameraConnected ? 'bg-[#10B981] animate-ping' : 'bg-red-400') : 'bg-sky-400 animate-ping')
          }`} />
          <span className="font-bold text-white tracking-wide">
            {feedLabel}
          </span>
        </div>

        {/* HUD Model Tag (Top-Right) */}
        <div className="absolute top-2 right-2 px-2 py-1 rounded bg-black/75 backdrop-blur-md border border-white/10 text-[10px] font-mono text-slate-300">
          YOLOv8 + Multi-Frame Tracking
        </div>

        {/* Inference Loading Spinner */}
        {isInferenceLoading && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-20">
            <div className="w-8 h-8 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-[#10B981] font-mono mt-2 tracking-wider">RUNNING YOLOv8 INFERENCE...</p>
          </div>
        )}

        {/* Collision Alert Banner */}
        {incident && (
          <div className="absolute bottom-2 inset-x-2 p-2 rounded-lg bg-red-600/90 backdrop-blur-md border border-red-400 flex items-center justify-between text-xs font-mono shadow-md animate-pulse">
            <div className="flex items-center gap-1.5 text-white font-bold text-[11px]">
              <AlertOctagon className="w-4 h-4 fill-white/20" />
              <span>COLLISION CONFIRMED</span>
            </div>
            <span className="text-white text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/40">
              [{incident.severity}]
            </span>
          </div>
        )}
      </div>

      {/* Camera Feed Source Selector */}
      <div className="flex items-center justify-between p-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono">
        <span className="text-slate-500 text-[11px] pl-1 font-semibold">Feed Source:</span>
        <div className="flex gap-1.5">
          <button
            onClick={() => switchCameraSource('esp32')}
            className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              isEsp32
                ? 'bg-[#10B981] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
            }`}
            title="Switch to live ESP32-CAM stream endpoint"
          >
            ESP32-CAM (Live)
          </button>
          <button
            onClick={() => switchCameraSource('sample')}
            className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              !isEsp32
                ? 'bg-[#10B981] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
            }`}
            title="Switch to local sample crash video"
          >
            Sample Video
          </button>
        </div>
      </div>

      {/* CCTV Action Buttons */}
      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
        <button
          onClick={handleSampleFrameClick}
          disabled={isInferenceLoading}
          className="p-2 rounded-xl bg-slate-50 hover:bg-[#DDF7EA] text-slate-700 hover:text-[#065F46] border border-slate-200 hover:border-[#A7F3D0] flex items-center justify-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50 text-[11px] font-medium"
          title="Run inference directly on sample crash video frame"
        >
          <FileVideo className="w-3.5 h-3.5 text-[#10B981]" />
          <span>Test Crash Frame</span>
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isInferenceLoading}
          className="p-2 rounded-xl bg-slate-50 hover:bg-[#DDF7EA] text-slate-700 hover:text-[#065F46] border border-slate-200 hover:border-[#A7F3D0] flex items-center justify-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50 text-[11px] font-medium"
          title="Upload image or CCTV snapshot to run real YOLOv8 accident detector"
        >
          <Upload className="w-3.5 h-3.5 text-[#10B981]" />
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
        <div className="p-2 rounded-xl bg-red-50 border border-red-200 text-[11px] text-red-700 font-mono">
          Model Note: {inferenceError}
        </div>
      )}

      {/* ACCIDENT LOCATION CARD */}
      <div className={`p-3.5 rounded-xl border transition-all ${
        incident 
          ? 'bg-red-50/70 border-red-200 shadow-xs' 
          : 'bg-slate-50/70 border-slate-200'
      }`}>
        <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
              incident ? 'bg-red-100 text-red-600' : 'bg-slate-200 text-slate-500'
            }`}>
              <MapPin className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-mono uppercase font-semibold">Incident Location</span>
              <h4 className="text-xs font-bold text-slate-800">
                {incident?.location || 'NH-24 West Approach (Sector 5 Corridor)'}
              </h4>
            </div>
          </div>

          {/* Emergency Tag */}
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1 ${
            incident 
              ? 'bg-red-100 text-red-700 border border-red-200' 
              : 'bg-slate-100 text-slate-500 border border-slate-200'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${incident ? 'bg-red-500 animate-ping' : 'bg-slate-400'}`} />
            {incident ? 'RED ALERT' : 'NORMAL'}
          </span>
        </div>

        {/* Incident Details Grid */}
        <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] font-mono">
          <div>
            <span className="text-slate-400 text-[10px]">Incident ID:</span>
            <p className="font-bold text-slate-800 mt-0.5 truncate">
              {incident?.id || 'NO ACTIVE INCIDENT'}
            </p>
          </div>

          <div>
            <span className="text-slate-400 text-[10px]">Status:</span>
            <p className={`font-bold mt-0.5 ${incident ? 'text-red-600' : 'text-slate-500'}`}>
              {incident?.status || 'STANDBY'}
            </p>
          </div>

          <div>
            <span className="text-slate-400 text-[10px]">Severity Level:</span>
            <p className={`font-bold mt-0.5 ${incident ? 'text-red-600' : 'text-slate-500'}`}>
              {incident?.severity || 'NONE'}
            </p>
          </div>

          <div>
            <span className="text-slate-400 text-[10px]">Detection Time:</span>
            <p className="text-slate-700 mt-0.5 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              {incident?.detection_time || '--:--:--'}
            </p>
          </div>
        </div>

        {/* Vehicles Involved */}
        <div className="mt-2 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[10px] font-mono">
          <span className="text-slate-400 flex items-center gap-1">
            <Car className="w-3 h-3 text-slate-400" /> Vehicles:
          </span>
          <span className="text-slate-700 font-semibold">
            {incident?.vehicles_involved?.join(', ') || (latestInference?.detected_count ? `${latestInference.detected_count} Vehicles Detected` : '2 Units (Simulated)')}
          </span>
        </div>
      </div>

      {/* Action Triggers */}
      <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-xs">
        <button
          onClick={createDemoIncident}
          className="p-2 rounded-xl bg-slate-50 hover:bg-[#DDF7EA] text-[#065F46] border border-slate-200 hover:border-[#A7F3D0] flex items-center justify-center gap-1.5 cursor-pointer transition-colors text-[11px] font-bold"
          title="Initialize clearly labelled demo incident"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#10B981]" />
          <span>Demo Incident</span>
        </button>

        <button
          onClick={resetSimulation}
          className="p-2 rounded-xl bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-600 border border-slate-200 hover:border-red-200 flex items-center justify-center gap-1.5 cursor-pointer transition-colors text-[11px] font-medium"
          title="Reset incident and simulation state"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset System</span>
        </button>
      </div>

    </div>
  );
};
