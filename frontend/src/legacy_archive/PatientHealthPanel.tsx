import { 
  Heart, 
  Activity, 
  Wind, 
  Brain, 
  Stethoscope
} from 'lucide-react';
import { useAeros } from '../context/AerosContext';

export const PatientHealthPanel: React.FC = () => {
  const { patientVitals, incident } = useAeros();

  // Simulated ECG pulse points for SVG waveform
  const ecgWaveform = "M 0 30 L 30 30 L 40 10 L 45 50 L 52 5 L 60 40 L 68 30 L 110 30 L 120 10 L 125 50 L 132 5 L 140 40 L 148 30 L 190 30 L 200 10 L 205 50 L 212 5 L 220 40 L 228 30 L 280 30";

  return (
    <div className="spatial-glass rounded-2xl p-4 flex flex-col gap-3.5 border border-[#00D9FF]/20 shadow-xl">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Stethoscope className="w-4 h-4 text-[#00E5B0]" />
          <h2 className="text-sm font-bold tracking-wider font-hud text-white uppercase">
            In-Transit Patient Telemetry
          </h2>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-[#FFB547] border border-[#FFB547]/30">
          SIMULATED VITALS
        </span>
      </div>

      {/* Patient Profile Header */}
      <div className="p-2.5 rounded-xl bg-[#0B1220]/80 border border-slate-800 flex items-center justify-between text-xs font-mono">
        <div>
          <span className="text-slate-400 text-[10px]">PATIENT IDENTIFIER</span>
          <p className="font-bold text-white text-sm">{patientVitals.patientId}</p>
        </div>
        <div className="text-right">
          <span className="text-slate-400 text-[10px]">INCIDENT REF</span>
          <p className="font-bold text-[#00D9FF]">{incident?.id || patientVitals.incidentId}</p>
        </div>
      </div>

      {/* Real-time ECG Cardiac Rhythm Waveform */}
      <div className="p-3 rounded-xl bg-[#070B14] border border-slate-800/90 relative overflow-hidden">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
          <span className="flex items-center gap-1.5 text-[#00E5B0]">
            <Activity className="w-3.5 h-3.5 animate-pulse" /> LEAD-II REALTIME ECG MONITOR
          </span>
          <span className="font-bold text-white">{patientVitals.heartRate} BPM</span>
        </div>

        {/* Animated ECG Waveform */}
        <div className="h-14 w-full relative flex items-center">
          <svg viewBox="0 0 280 60" className="w-full h-full stroke-[#00E5B0]" fill="none" strokeWidth="2" strokeLinecap="round">
            <path d={ecgWaveform} className="animate-corridor opacity-85" />
          </svg>
        </div>
      </div>

      {/* Vital Signs Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
        
        {/* Heart Rate */}
        <div className="p-2.5 rounded-xl bg-[#0B1220]/70 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-[10px]">
            <span className="flex items-center gap-1">
              <Heart className="w-3 h-3 text-[#FF4057]" /> HEART RATE
            </span>
            <span className="text-[#FF4057] font-bold">NORMAL</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-xl font-bold text-white font-hud">{patientVitals.heartRate}</span>
            <span className="text-[10px] text-slate-400">BPM</span>
          </div>
        </div>

        {/* Blood Oxygen SpO2 */}
        <div className="p-2.5 rounded-xl bg-[#0B1220]/70 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-[10px]">
            <span className="flex items-center gap-1">
              <Wind className="w-3 h-3 text-[#00D9FF]" /> SpO₂ OXYGEN
            </span>
            <span className="text-[#00E5B0] font-bold">OPTIMAL</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-xl font-bold text-white font-hud">{patientVitals.spo2}%</span>
            <span className="text-[10px] text-slate-400">Saturation</span>
          </div>
        </div>

        {/* Blood Pressure */}
        <div className="p-2.5 rounded-xl bg-[#0B1220]/70 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-[10px]">
            <span className="flex items-center gap-1">
              <Activity className="w-3 h-3 text-[#FFB547]" /> BLOOD PRESSURE
            </span>
            <span className="text-[#00E5B0] font-bold">STABLE</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-lg font-bold text-white font-hud">
              {patientVitals.bloodPressureSys}/{patientVitals.bloodPressureDia}
            </span>
            <span className="text-[10px] text-slate-400">mmHg</span>
          </div>
        </div>

        {/* Consciousness GCS */}
        <div className="p-2.5 rounded-xl bg-[#0B1220]/70 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-[10px]">
            <span className="flex items-center gap-1">
              <Brain className="w-3 h-3 text-purple-400" /> CONSCIOUSNESS
            </span>
          </div>
          <p className="mt-1 font-bold text-white text-[11px] truncate">
            {patientVitals.consciousness}
          </p>
        </div>

      </div>

      {/* Patient Assessment & Clinical Condition Summary */}
      <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] font-mono">
        <span className="text-slate-400 text-[10px]">TRIAGE ASSESSMENT NOTE:</span>
        <p className="text-slate-200 mt-0.5 leading-relaxed">
          {patientVitals.conditionSummary}
        </p>
        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-800/80 pt-1.5">
          <span>Updated: {patientVitals.lastUpdated}</span>
          <span className="text-amber-400">Simulated Profile</span>
        </div>
      </div>

    </div>
  );
};
