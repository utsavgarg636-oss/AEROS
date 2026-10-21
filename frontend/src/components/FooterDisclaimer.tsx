import React from 'react';
import { AlertCircle } from 'lucide-react';
import { useAeros } from '../context/AerosContext';

export const FooterDisclaimer: React.FC = () => {
  const { backendConnected } = useAeros();

  return (
    <footer className="w-full mt-6 py-4 px-6 border-t border-[#E3EEE8] bg-white text-xs font-mono text-[#6B7280]">
      <div className="max-w-[1920px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Core Prototype Disclaimer */}
        <div className="flex items-center gap-2 text-center md:text-left">
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
          <p className="text-slate-600">
            <span className="text-slate-900 font-bold">A.E.R.O.S. Operations System:</span> Single junction digital twin (1 four-way junction, 4 traffic signals, 1 west accident site, 1 ambulance, 1 hospital). Real-world signal overrides require physical interlock verification.
          </p>
        </div>

        {/* Verification Status Tags */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-[10px]">
          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700">
            4-WAY JUNCTION TWIN
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700">
            4 TRAFFIC SIGNAL HEADS
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800">
            ESP32 HARDWARE ADAPTER READY
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-700 font-semibold">
            FAIL-SAFE INTERLOCK ENGAGED
          </span>
          <span className={`px-2.5 py-0.5 rounded-full border font-semibold ${
            backendConnected 
              ? 'bg-[#DDF7EA] text-[#065F46] border-[#A7F3D0]' 
              : 'bg-slate-100 text-slate-500 border-slate-200'
          }`}>
            {backendConnected ? 'BACKEND LINKED (OPERATIONAL)' : 'STANDBY MODE'}
          </span>
        </div>

      </div>
    </footer>
  );
};
