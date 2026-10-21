import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Play, 
  Pause, 
  RotateCcw, 
  Building2,
  Navigation
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAeros } from '../context/AerosContext';

export const TopBar: React.FC = () => {
  const location = useLocation();
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
        classes: 'bg-[#DDF7EA] text-[#065F46] border-[#A7F3D0]',
        dot: 'bg-[#10B981]'
      };
    }
    if (incident.status === 'ACCIDENT_DETECTED') {
      return {
        label: `COLLISION DETECTED [${incident.severity}]`,
        classes: 'bg-red-50 text-red-700 border-red-200 animate-pulse shadow-sm',
        dot: 'bg-red-500'
      };
    }
    if (incident.status === 'COMPLETED' || incident.status === 'ARRIVED_AT_HOSPITAL') {
      return {
        label: 'MISSION COMPLETED — PATIENT DELIVERED',
        classes: 'bg-blue-50 text-blue-700 border-blue-200',
        dot: 'bg-blue-500'
      };
    }
    return {
      label: `PRIORITY CORRIDOR ACTIVE: ${incident.status}`,
      classes: 'bg-amber-50 text-amber-800 border-amber-200 animate-pulse',
      dot: 'bg-amber-500'
    };
  };

  const statusBadge = getStatusBadge();
  const isSystemActive = location.pathname.includes('/system') || location.pathname === '/';
  const isHospitalActive = location.pathname.includes('/hospital');

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E3EEE8] px-4 lg:px-6 py-2.5 shadow-sm transition-all">
      <div className="max-w-[1920px] mx-auto flex flex-wrap items-center justify-between gap-4">
        
        {/* Left: Brand Identity & Active Navigation Tabs */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl bg-[#DDF7EA] border border-[#10B981]/40 flex items-center justify-center shadow-xs">
              <Radio className="w-5 h-5 text-[#10B981] animate-pulse" />
              <span className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-white ${backendConnected ? 'bg-[#10B981] animate-ping' : 'bg-amber-400'}`} />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-[#1F2937] flex items-center gap-1.5">
                  A.E.R.O.S.
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#DDF7EA] text-[#065F46] border border-[#A7F3D0]">
                  V2.0
                </span>
              </div>
              <p className="text-[11px] text-[#6B7280] font-medium hidden sm:block">
                AI Smart Accident Detection & Priority Response System
              </p>
            </div>
          </div>

          {/* Navigation Route Tabs */}
          <nav className="hidden md:flex items-center bg-[#F3F4F6] p-1 rounded-xl border border-[#E5E7EB] text-xs font-semibold">
            <Link
              to="/system"
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                isSystemActive
                  ? 'bg-white text-[#1F2937] shadow-xs font-bold border border-[#E5E7EB]'
                  : 'text-[#6B7280] hover:text-[#1F2937]'
              }`}
            >
              <Navigation className="w-3.5 h-3.5 text-[#10B981]" />
              <span>Junction Command</span>
            </Link>
            <Link
              to="/hospital"
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                isHospitalActive
                  ? 'bg-white text-[#1F2937] shadow-xs font-bold border border-[#E5E7EB]'
                  : 'text-[#6B7280] hover:text-[#1F2937]'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-[#10B981]" />
              <span>Hospital Intake</span>
            </Link>
          </nav>
        </div>

        {/* Center: System Status Badge & Live Clock */}
        <div className="flex items-center gap-3 lg:gap-5">
          <div className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border flex items-center gap-2 font-mono ${statusBadge.classes}`}>
            <span className={`w-2 h-2 rounded-full ${statusBadge.dot}`} />
            <span>{statusBadge.label}</span>
          </div>

          <div className="hidden lg:flex flex-col text-right font-mono text-xs">
            <span className="text-[#1F2937] font-bold text-sm tracking-wide">{currentTime}</span>
            <span className="text-[#6B7280] text-[10px]">{currentDate}</span>
          </div>
        </div>

        {/* Right: Master Simulation Controls & Key Shortcut Hint */}
        <div className="flex items-center gap-2.5">
          
          <span className="hidden xl:inline-block text-[11px] text-[#6B7280] font-mono bg-slate-100 px-2 py-1 rounded-md border border-slate-200" title="Press key 'A' anytime to trigger emergency collision">
            Shortcut: <kbd className="font-bold text-[#1F2937]">Key 'A'</kbd>
          </span>

          {/* Master Simulation Controls */}
          {!isSimulating ? (
            <button
              onClick={startSimulation}
              className="px-4 py-2 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold tracking-wide transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-98"
              title="Run complete single-junction automated emergency response simulation"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              START SIMULATION
            </button>
          ) : (
            <div className="flex items-center gap-1.5 bg-[#F9FAFB] p-1 rounded-xl border border-[#E5E7EB]">
              {isPaused ? (
                <button
                  onClick={resumeSimulation}
                  className="px-3 py-1.5 rounded-lg bg-[#DDF7EA] text-[#065F46] hover:bg-emerald-200 text-xs font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Play className="w-3 h-3 fill-current" /> RESUME
                </button>
              ) : (
                <button
                  onClick={pauseSimulation}
                  className="px-3 py-1.5 rounded-lg bg-amber-100 text-amber-800 hover:bg-amber-200 text-xs font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Pause className="w-3 h-3" /> PAUSE
                </button>
              )}
              <button
                onClick={resetSimulation}
                className="px-3 py-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 text-xs font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RotateCcw className="w-3 h-3" /> RESET
              </button>
            </div>
          )}

        </div>

      </div>
    </header>
  );
};
