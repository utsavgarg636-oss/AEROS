import React, { useState, useRef } from 'react';
import { 
  Camera, 
  Upload, 
  Video, 
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { useAeros } from '../context/AerosContext';

export const LiveRoadFeedCard: React.FC = () => {
  const {
    backendConnected,
    incident,
    latestInference,
    isInferenceLoading,
    runImageInference,
    runSampleVideoFrameInference,
    switchCameraSource,
    resetSimulation,
    systemStatus
  } = useAeros();

  const [streamActive, setStreamActive] = useState<boolean>(true);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cameraComp = systemStatus?.components?.camera;
  const isEsp32 = cameraComp?.source_type === 'esp32';

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

  const handleTestInference = async () => {
    setImagePreview(null);
    await runSampleVideoFrameInference();
  };

  return (
    <div className="bg-white rounded-2xl p-4 lg:p-5 flex flex-col justify-between h-full border border-[#E3EEE8] shadow-xs select-none">
      
      {/* Header matching reference image: Camera icon + "Live Road Feed" + "● LIVE" */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#E6F4EA] flex items-center justify-center text-[#0F9D58]">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800 tracking-tight">
                Live Road Feed
              </h2>
              <p className="text-[10px] text-slate-400 font-mono">
                YOLOv8 Accident Vision
              </p>
            </div>
          </div>

          {/* Live Pill Badge matching reference image */}
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#00A86B] text-white text-[10px] font-bold tracking-wide shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span>LIVE</span>
          </div>
        </div>

        {/* 1. Main CCTV Feed Viewport: Fixed to almost a square (aspect-[1/0.95]) with safe containment */}
        <div className="relative w-full aspect-[1/0.95] max-h-[440px] rounded-xl overflow-hidden bg-[#111827] border border-slate-800 flex items-center justify-center shadow-inner group mx-auto">
          
          {/* Stream image or ML output */}
          {latestInference?.annotated_image ? (
            <img 
              src={latestInference.annotated_image} 
              alt="AI Detection Feed" 
              className="w-full h-full object-contain"
            />
          ) : imagePreview ? (
            <img 
              src={imagePreview} 
              alt="Uploaded Frame" 
              className="w-full h-full object-contain"
            />
          ) : streamActive && backendConnected ? (
            <img 
              src="/api/video_feed" 
              alt="CCTV Video Feed" 
              className="w-full h-full object-contain"
              onError={() => setStreamActive(false)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-center text-slate-400">
              <Video className="w-8 h-8 text-slate-600 mb-2 animate-pulse" />
              <p className="text-xs font-mono">AWAITING CAMERA STREAM</p>
            </div>
          )}

          {/* Overlay Bounding Boxes Simulation overlay if feed is running in sample mode */}
          {(!latestInference?.annotated_image && incident) && (
            <div className="absolute inset-0 pointer-events-none">
              {/* Top Car Box */}
              <div className="absolute top-[16%] left-[32%] w-16 h-14 border-2 border-[#00E676] rounded text-[9px] font-bold text-[#00E676] px-1 bg-[#00E676]/10">
                car
              </div>
              {/* Right Car Box */}
              <div className="absolute top-[18%] right-[24%] w-14 h-12 border-2 border-[#00E676] rounded text-[9px] font-bold text-[#00E676] px-1 bg-[#00E676]/10">
                car
              </div>
              {/* Central Accident Detected Box (matches image red box with banner) */}
              <div className="absolute top-[38%] left-[34%] w-32 h-18 border-2 border-[#EF4444] rounded bg-[#EF4444]/15 flex flex-col justify-between">
                <span className="self-center -mt-3.5 bg-[#EF4444] text-white text-[9px] font-bold px-2 py-0.5 rounded shadow">
                  Accident Detected
                </span>
              </div>
              {/* Bottom Car Box */}
              <div className="absolute bottom-[22%] right-[22%] w-16 h-14 border-2 border-[#00E676] rounded text-[9px] font-bold text-[#00E676] px-1 bg-[#00E676]/10">
                car
              </div>
            </div>
          )}

          {/* Top-Right HUD Tag */}
          <div className="absolute top-2.5 right-2.5 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded text-[9px] font-mono text-emerald-400 border border-emerald-500/30 z-10">
            WEST CAM 01
          </div>
        </div>
      </div>

      {/* 2. Bottom Controls Bar: 3 buttons on the same line, Reset button below center-aligned & bigger */}
      <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-col gap-2.5">
        
        {/* Line 1: Three buttons in the same line */}
        <div className="grid grid-cols-3 gap-2 w-full">
          {/* Button 1: Source */}
          <button
            onClick={() => switchCameraSource(isEsp32 ? 'sample' : 'esp32')}
            className="py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-colors cursor-pointer text-center truncate shadow-2xs"
            title="Toggle between ESP32-CAM stream and Sample Crash video"
          >
            Source: {isEsp32 ? 'ESP32' : 'Sample'}
          </button>

          {/* Button 2: Test AI Detection */}
          <button
            onClick={handleTestInference}
            disabled={isInferenceLoading}
            className="py-1.5 px-2 rounded-lg bg-[#E6F4EA] hover:bg-[#D4EEDC] text-[#0F9D58] text-[11px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
            title="Run accident detection inference on sample frame"
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{isInferenceLoading ? 'Scanning...' : 'Test AI Detection'}</span>
          </button>

          {/* Button 3: Upload Custom Image */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept="image/*" 
            className="hidden" 
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
            title="Upload custom image for YOLOv8 inference"
          >
            <Upload className="w-3.5 h-3.5 shrink-0 text-slate-500" />
            <span>Upload</span>
          </button>
        </div>

        {/* Line 2: Reset button on new line, center aligned, bigger than the three above */}
        <div className="flex justify-center w-full">
          <button
            onClick={resetSimulation}
            className="w-3/5 min-w-[180px] py-2 px-5 rounded-xl bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-700 border border-red-200 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs hover:shadow-sm"
            title="Reset system and simulation to clean standby state"
          >
            <RotateCcw className="w-4 h-4 text-red-600" />
            <span>Reset</span>
          </button>
        </div>

      </div>

    </div>
  );
};
