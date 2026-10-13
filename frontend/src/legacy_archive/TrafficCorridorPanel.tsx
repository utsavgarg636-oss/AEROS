import { 
  Activity, 
  Volume2, 
  VolumeX, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Cpu, 
  Info 
} from 'lucide-react';
import { useAeros } from '../context/AerosContext';
import { triggerHardwareAlert } from '../services/api';

export const TrafficCorridorPanel: React.FC = () => {
  const {
    junctions,
    lcdDisplay,
    buzzerActive,
    buzzerAudioEnabled,
    setBuzzerAudioEnabled,
    roadBlocked,
    simulateRoadBlockage,
    clearRoadBlockage,
    addTimelineEvent,
  } = useAeros();

  const handleManualHardwareTest = async () => {
    const res = await triggerHardwareAlert('MANUAL_TEST', 'HIGH');
    addTimelineEvent(
      'Traffic',
      'Hardware Trigger Dispatched',
      `Signal trigger sent to ${res.mock ? 'Mock Serial Bridge (COM3)' : 'ESP32 Serial (COM3)'}.`,
      'info'
    );
  };

  return (
    <div className="spatial-glass rounded-2xl p-4 flex flex-col gap-3.5 border border-[#00D9FF]/20 shadow-xl">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#00D9FF]" />
          <h2 className="text-sm font-bold tracking-wider font-hud text-white uppercase">
            Corridor Signals & Hardware Alerts
          </h2>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-[#00D9FF] border border-[#00D9FF]/20">
          COORDINATED PREDEFINED CORRIDOR
        </span>
      </div>

      {/* Corridor Intersections Grid */}
      <div className="grid grid-cols-3 gap-2 text-xs font-mono">
        {junctions.map((j) => {
          const isPriority = j.signalState === 'Priority Green';
          const isBlocked = j.signalState === 'Road Blocked';

          return (
            <div 
              key={j.id} 
              className={`p-2.5 rounded-xl border text-center transition-all ${
                isBlocked
                  ? 'bg-red-950/40 border-[#FF4057] shadow-[0_0_15px_rgba(255,64,87,0.3)] animate-pulse'
                  : isPriority
                  ? 'bg-emerald-950/40 border-[#00E5B0] shadow-[0_0_15px_rgba(0,229,176,0.3)]'
                  : 'bg-[#0B1220]/80 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between pb-1 border-b border-slate-800/80 text-[10px]">
                <span className="font-bold text-white">{j.id}</span>
                <span className={`w-2 h-2 rounded-full ${
                  isBlocked ? 'bg-[#FF4057] animate-ping' : isPriority ? 'bg-[#00E5B0] animate-ping' : 'bg-slate-500'
                }`}></span>
              </div>

              <p className="text-[11px] font-bold text-white mt-1.5 truncate">{j.name.split('(')[0]}</p>

              {/* Tactical Traffic Light Mini Indicators */}
              <div className="flex items-center justify-center gap-1.5 my-2">
                <span className={`w-2.5 h-2.5 rounded-full ${isBlocked || isPriority ? 'bg-[#FF4057] shadow-[0_0_8px_#FF4057]' : 'bg-slate-700'}`} title="Cross-street Red"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-slate-700"></span>
                <span className={`w-2.5 h-2.5 rounded-full ${isPriority ? 'bg-[#00E5B0] shadow-[0_0_8px_#00E5B0]' : (isBlocked ? 'bg-slate-700' : 'bg-emerald-600')}`} title="Corridor Direction Green"></span>
              </div>

              <p className={`text-[10px] font-bold ${
                isBlocked ? 'text-[#FF4057]' : isPriority ? 'text-[#00E5B0]' : 'text-slate-400'
              }`}>
                {j.signalState}
              </p>
              <p className="text-[9px] text-slate-500 mt-0.5 truncate">{j.crossingStreet}</p>
            </div>
          );
        })}
      </div>

      {/* 16x2 Physical LCD & Buzzer Hardware Simulator */}
      <div className="p-3 rounded-xl bg-[#070B14] border border-slate-800 text-xs font-mono space-y-2">
        <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-1.5">
          <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <Cpu className="w-3.5 h-3.5" /> 16×2 INTERSECTION LCD DISPLAY
          </span>
          <div className="flex items-center gap-2">
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
              lcdDisplay.active ? 'bg-emerald-500/20 text-[#00E5B0]' : 'bg-slate-800 text-slate-500'
            }`}>
              {lcdDisplay.active ? 'ACTIVE' : 'STANDBY'}
            </span>

            {/* Buzzer Sound Toggle */}
            <button
              onClick={() => setBuzzerAudioEnabled(!buzzerAudioEnabled)}
              className={`p-1 rounded cursor-pointer ${buzzerAudioEnabled ? 'text-[#00D9FF] bg-[#00D9FF]/10' : 'text-slate-500'}`}
              title="Toggle Audio Feedback"
            >
              {buzzerAudioEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* 16x2 Dot Matrix Screen Representation */}
        <div className="lcd-display rounded-lg p-2.5 text-center space-y-0.5 select-none font-bold">
          <div className="tracking-widest text-[13px] text-emerald-400">
            {lcdDisplay.line1.padEnd(16, ' ')}
          </div>
          <div className="tracking-widest text-[13px] text-emerald-400">
            {lcdDisplay.line2.padEnd(16, ' ')}
          </div>
        </div>

        {/* Hardware Status Summary */}
        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
          <div className="flex items-center gap-1.5">
            <span>Buzzer:</span>
            <span className={`font-bold ${buzzerActive ? 'text-[#FF4057] animate-pulse' : 'text-slate-500'}`}>
              {buzzerActive ? 'ON (ALARMING)' : 'OFF'}
            </span>
          </div>

          <button
            onClick={handleManualHardwareTest}
            className="text-[10px] text-[#00D9FF] hover:underline cursor-pointer"
          >
            Trigger Serial ESP32 Test
          </button>
        </div>
      </div>

      {/* Road Blockage Controls */}
      <div className="pt-1 flex flex-col gap-2 font-mono text-xs">
        {!roadBlocked ? (
          <button
            onClick={simulateRoadBlockage}
            className="p-2.5 rounded-xl bg-red-950/40 hover:bg-red-950/70 text-[#FF4057] border border-[#FF4057]/40 hover:border-[#FF4057] font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_15px_rgba(255,64,87,0.2)]"
            title="Simulate traffic jam or physical vehicle stall on corridor"
          >
            <AlertTriangle className="w-4 h-4" /> SIMULATE ROAD BLOCKAGE
          </button>
        ) : (
          <div className="p-2.5 rounded-xl bg-red-950/80 border border-red-500 text-xs font-mono text-white space-y-2">
            <div className="flex items-center justify-between text-red-300 font-bold">
              <span className="flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-red-400 animate-pulse" /> ROAD BLOCKED — ASSISTANCE REQUIRED
              </span>
            </div>
            <p className="text-[10px] text-slate-300">
              Corridor halted at Junction 2. Manual police intervention flagged.
            </p>
            <button
              onClick={clearRoadBlockage}
              className="w-full p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
            >
              <CheckCircle2 className="w-4 h-4" /> CLEAR BLOCKAGE & RESUME CORRIDOR
            </button>
          </div>
        )}

        <div className="flex items-start gap-1.5 text-[10px] text-slate-500 p-1">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />
          <span>Priority signals cannot physically guarantee that drivers will yield without enforcement.</span>
        </div>
      </div>

    </div>
  );
};
