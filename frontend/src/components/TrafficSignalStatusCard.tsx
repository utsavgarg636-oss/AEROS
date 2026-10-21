import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { useAeros } from '../context/AerosContext';

export const TrafficSignalStatusCard: React.FC = () => {
  const { 
    junction, 
    ambulance, 
    prioritySwitchOn, 
    isSimulating 
  } = useAeros();

  const isPriorityOn = prioritySwitchOn ?? true;
  const progress = ambulance.progress || 0;
  const isCorridorActive = isSimulating && ambulance.status !== 'STANDBY';

  // Eastbound return crossing (Step 5: West signal is green)
  const isReturnCrossing = progress >= 68 && progress <= 80;
  // Westbound outbound crossing (Step 1-3: East signal is green)
  const isOutboundCrossing = progress >= 20 && progress <= 38;

  const isEastGreen = isOutboundCrossing && isPriorityOn;
  const isWestGreen = isReturnCrossing && isPriorityOn;
  // If in demo standby or normal corridor, can reflect South or East depending on state
  const isSouthGreen = !isCorridorActive && junction.ambulance_signal === 'NORMAL_CYCLE';
  const isNorthGreen = false;

  // Signal Aspect Component matching reference image
  const TrafficLightAspect: React.FC<{ activeLight: 'RED' | 'YELLOW' | 'GREEN' }> = ({ activeLight }) => (
    <div className="w-8 h-[68px] bg-[#18212C] rounded-lg p-1.5 flex flex-col items-center justify-between border border-slate-700/60 shadow-inner shrink-0">
      <div className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${
        activeLight === 'RED' ? 'bg-[#FF3B47] shadow-[0_0_8px_#FF3B47]' : 'bg-[#3A141A]'
      }`} />
      <div className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${
        activeLight === 'YELLOW' ? 'bg-[#FBBF24] shadow-[0_0_8px_#FBBF24]' : 'bg-[#36270E]'
      }`} />
      <div className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${
        activeLight === 'GREEN' ? 'bg-[#00E676] shadow-[0_0_10px_#00E676]' : 'bg-[#0A291A]'
      }`} />
    </div>
  );

  return (
    <div className="bg-white rounded-2xl p-4 lg:p-5 flex flex-col justify-between h-full border border-[#E3EEE8] shadow-xs select-none">
      
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#E6F4EA] flex items-center justify-center text-[#0F9D58]">
              {/* Traffic Light Graphic Icon */}
              <div className="w-3.5 h-5 bg-[#1F2937] rounded-sm p-0.5 flex flex-col justify-between items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF4D5A]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#00E676]" />
              </div>
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800 tracking-tight">
                Traffic Signal Status
              </h2>
              <p className="text-[10px] text-slate-400 font-mono">
                Signal Priority Telemetry
              </p>
            </div>
          </div>

          <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            4 LANES
          </span>
        </div>

        {/* 2x2 Grid neatly proportioned to fill relevant screen area */}
        <div className="grid grid-cols-2 gap-3.5 my-auto flex-1 content-center">
          
          {/* Card 1: North Lane */}
          <div className={`p-4 rounded-2xl border transition-all flex items-center gap-3.5 min-h-[102px] ${
            isNorthGreen ? 'bg-[#EBFBF3] border-[#A7F3D0] shadow-xs' : 'bg-slate-50/80 border-slate-200/80'
          }`}>
            <TrafficLightAspect activeLight={isNorthGreen ? 'GREEN' : 'RED'} />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-800">North Lane</p>
              <p className={`text-sm font-extrabold mt-0.5 ${isNorthGreen ? 'text-[#00966A]' : 'text-[#DC2626]'}`}>
                {isNorthGreen ? 'GREEN' : 'RED'}
              </p>
              <p className="text-[10.5px] text-slate-400 font-medium truncate mt-0.5">
                {isNorthGreen ? 'Ambulance Lane Active' : 'Stopped'}
              </p>
            </div>
          </div>

          {/* Card 2: East Lane */}
          <div className={`p-4 rounded-2xl border transition-all flex items-center gap-3.5 min-h-[102px] ${
            isEastGreen ? 'bg-[#EBFBF3] border-[#00966A] shadow-xs ring-1 ring-[#00966A]/30' : 'bg-slate-50/80 border-slate-200/80'
          }`}>
            <TrafficLightAspect activeLight={isEastGreen ? 'GREEN' : 'RED'} />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-800">East Lane</p>
              <p className={`text-sm font-extrabold mt-0.5 ${isEastGreen ? 'text-[#00966A]' : 'text-[#DC2626]'}`}>
                {isEastGreen ? 'GREEN' : 'RED'}
              </p>
              <p className="text-[10.5px] text-slate-400 font-medium truncate mt-0.5">
                {isEastGreen ? 'Ambulance Lane Active' : 'Stopped'}
              </p>
            </div>
          </div>

          {/* Card 3: South Lane */}
          <div className={`p-4 rounded-2xl border transition-all flex items-center gap-3.5 min-h-[102px] ${
            isSouthGreen ? 'bg-[#EBFBF3] border-[#00966A] shadow-xs ring-1 ring-[#00966A]/30' : 'bg-slate-50/80 border-slate-200/80'
          }`}>
            <TrafficLightAspect activeLight={isSouthGreen ? 'GREEN' : 'RED'} />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-800">South Lane</p>
              <p className={`text-sm font-extrabold mt-0.5 ${isSouthGreen ? 'text-[#00966A]' : 'text-[#DC2626]'}`}>
                {isSouthGreen ? 'GREEN' : 'RED'}
              </p>
              <p className="text-[10.5px] text-slate-400 font-medium truncate mt-0.5">
                {isSouthGreen ? 'Ambulance Lane Active' : 'Stopped'}
              </p>
            </div>
          </div>

          {/* Card 4: West Lane */}
          <div className={`p-4 rounded-2xl border transition-all flex items-center gap-3.5 min-h-[102px] ${
            isWestGreen ? 'bg-[#EBFBF3] border-[#00966A] shadow-xs ring-1 ring-[#00966A]/30' : 'bg-slate-50/80 border-slate-200/80'
          }`}>
            <TrafficLightAspect activeLight={isWestGreen ? 'GREEN' : 'RED'} />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-800">West Lane</p>
              <p className={`text-sm font-extrabold mt-0.5 ${isWestGreen ? 'text-[#00966A]' : 'text-[#DC2626]'}`}>
                {isWestGreen ? 'GREEN' : 'RED'}
              </p>
              <p className="text-[10.5px] text-slate-400 font-medium truncate mt-0.5">
                {isWestGreen ? 'Ambulance Lane Active' : 'Stopped'}
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Safety Interlock Status */}
      <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
        <span className="flex items-center gap-1.5 text-[#00966A] font-bold">
          <ShieldCheck className="w-3.5 h-3.5" /> Interlocked Fail-Safe
        </span>
        <span className="text-slate-400">Zero Conflicting Greens</span>
      </div>

    </div>
  );
};
