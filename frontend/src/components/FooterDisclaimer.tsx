import React from 'react';
import { AlertCircle } from 'lucide-react';
import { useAeros } from '../context/AerosContext';

export const FooterDisclaimer: React.FC = () => {
  const { backendConnected } = useAeros();

  return (
    <footer className="w-full mt-6 py-4 px-6 border-t border-slate-800 bg-[#08111F]/95 text-xs font-mono text-slate-400">
      <div className="max-w-[1920px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Core Prototype Disclaimer */}
        <div className="flex items-center gap-2 text-center md:text-left">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <p className="text-slate-300">
            <span className="text-white font-bold">A.E.R.O.S. Prototype Twin:</span> Physical model digital twin (1 four-way junction, 4 traffic signals, 1 left accident site, 1 ambulance, 1 hospital). Real public-road signal override is disabled.
          </p>
        </div>

        {/* Verification Status Tags */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-[10px]">
          <span className="px-2 py-0.5 rounded bg-[#111D2E] border border-slate-800 text-slate-300">
            4-WAY JUNCTION TWIN
          </span>
          <span className="px-2 py-0.5 rounded bg-[#111D2E] border border-slate-800 text-[#38BDF8]">
            4 TRAFFIC SIGNAL UNITS
          </span>
          <span className="px-2 py-0.5 rounded bg-[#111D2E] border border-slate-800 text-amber-300">
            ESP32 HARDWARE ADAPTER READY
          </span>
          <span className="px-2 py-0.5 rounded bg-red-950/40 border border-red-500/30 text-red-300">
            SAFETY INTERLOCK ENGAGED
          </span>
          <span className={`px-2 py-0.5 rounded border ${backendConnected ? 'bg-emerald-950/40 text-[#22C55E] border-emerald-500/30' : 'bg-blue-950/40 text-[#38BDF8] border-[#38BDF8]/30'}`}>
            {backendConnected ? 'BACKEND LINKED' : 'DEMO MODE'}
          </span>
        </div>

      </div>
    </footer>
  );
};
