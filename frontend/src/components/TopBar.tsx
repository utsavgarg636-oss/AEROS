import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Play, 
  Pause, 
  RotateCcw, 
  ExternalLink 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAeros } from '../context/AerosContext';

export const TopBar: React.FC = () => {
  const { 
    backendConnected,
    incident, 
    isSimulating, 
    isPaused, 
    startSimulation, 
    pauseSimulation, 
    resumeSimulation, 
    resetSimulation 
  } = useAeros();

  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setCurrentDate(now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = () => {
    if (!incident) {
      return {
        label: 'STANDBY — NORMAL TRAFFIC FLOW',
        classes: 'bg-emerald-950/60 text-[#22C55E] border-[#22C55E]/40',
        dot: 'bg-[#22C55E]'
      };
    }
    if (incident.status === 'ACCIDENT_DETECTED') {
      return {
        label: `COLLISION DETECTED [${incident.severity}]`,
        classes: 'bg-amber-950/60 text-[#F59E0B] border-[#F59E0B]/50 animate-pulse',
        dot: 'bg-[#F59E0B]'
      };
    }
    if (incident.status === 'COMPLETED' || incident.status === 'ARRIVED_AT_HOSPITAL') {
      return {
        label: 'MISSION COMPLETED — PATIENT DELIVERED',
        classes: 'bg-blue-950/60 text-[#38BDF8] border-[#38BDF8]/40',
        dot: 'bg-[#38BDF8]'
      };
    }
    return {
      label: `PRIORITY CORRIDOR ACTIVE: ${incident.status}`,
      classes: 'bg-red-950/80 text-[#FF4D5A] border-[#FF4D5A]/60 shadow-[0_0_15px_rgba(255,77,90,0.35)] animate-pulse',
      dot: 'bg-[#FF4D5A]'
    };
  };

  const statusBadge = getStatusBadge();

  return (
    <header className="sticky top-0 z-50 bg-[#111D2E]/90 backdrop-blur-md border-b border-[#38BDF8]/20 px-4 lg:px-6 py-2.5 shadow-xl">
      <div className="max-w-[1920px] mx-auto flex flex-wrap items-center justify-between gap-4">
        
        {/* Left: Brand & Physical Model Badge */}
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-xl bg-[#08111F] border border-[#38BDF8]/40 flex items-center justify-center spatial-glow-cyan">
            <Radio className="w-5 h-5 text-[#38BDF8] animate-pulse" />
            <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ${backendConnected ? 'bg-[#22C55E] animate-ping' : 'bg-amber-400'}`} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl lg:text-2xl font-bold tracking-wider text-white font-hud flex items-center gap-2">
                A.E.R.O.S.
                <span className="text-xs px-2 py-0.5 rounded bg-[#38BDF8]/10 text-[#38BDF8] font-mono border border-[#38BDF8]/30 tracking-normal font-normal">
                  4-WAY JUNCTION
                </span>
              </h1>
            </div>
            <p className="text-[11px] text-[#94A3B8] font-mono tracking-tight hidden sm:block">
              Automated Emergency Response & Optimization Network • Control Room Dashboard
            </p>
          </div>
        </div>

        {/* Center: Incident Corridor Status & Live Clock */}
        <div className="flex items-center gap-3 lg:gap-5">
          <div className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-2 font-mono ${statusBadge.classes}`}>
            <span className={`w-2 h-2 rounded-full ${statusBadge.dot} animate-ping`} />
            <span>{statusBadge.label}</span>
          </div>

          <div className="hidden md:flex flex-col text-right font-mono text-xs">
            <span className="text-white font-semibold text-sm tracking-widest">{currentTime}</span>
            <span className="text-[#94A3B8] text-[10px]">{currentDate}</span>
          </div>
        </div>

        {/* Right: Master Simulation Controls & Navigation to Hospital Console */}
        <div className="flex items-center gap-2 lg:gap-3">
          
          {/* Master Simulation Controls */}
          {!isSimulating ? (
            <button
              onClick={startSimulation}
              className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#38BDF8] to-[#22C55E] text-[#08111F] font-hud text-xs lg:text-sm font-bold tracking-wider hover:opacity-95 transition-all shadow-[0_0_20px_rgba(56,189,248,0.4)] flex items-center gap-1.5 cursor-pointer active:scale-95"
              title="Run complete single-junction automated emergency response simulation"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              START SIMULATION
            </button>
          ) : (
            <div className="flex items-center gap-1.5 bg-[#08111F] p-1 rounded-lg border border-[#38BDF8]/30">
              {isPaused ? (
                <button
                  onClick={resumeSimulation}
                  className="px-3 py-1 rounded bg-[#22C55E]/20 text-[#22C55E] hover:bg-[#22C55E]/30 text-xs font-mono font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Play className="w-3 h-3 fill-current" /> RESUME
                </button>
              ) : (
                <button
                  onClick={pauseSimulation}
                  className="px-3 py-1 rounded bg-[#F59E0B]/20 text-[#F59E0B] hover:bg-[#F59E0B]/30 text-xs font-mono font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Pause className="w-3 h-3" /> PAUSE
                </button>
              )}
              <button
                onClick={resetSimulation}
                className="px-3 py-1 rounded bg-red-500/20 text-[#FF4D5A] hover:bg-red-500/30 text-xs font-mono font-bold flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> RESET
              </button>
            </div>
          )}

          {/* Navigation to Hospital Dashboard */}
          <Link
            to="/hospital"
            className="px-3.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-[#22C55E] border border-[#22C55E]/40 font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
            title="Open Hospital Receiving Console (/hospital)"
          >
            <span>Hospital Dashboard</span>
            <ExternalLink className="w-3 h-3" />
          </Link>

        </div>

      </div>
    </header>
  );
};
