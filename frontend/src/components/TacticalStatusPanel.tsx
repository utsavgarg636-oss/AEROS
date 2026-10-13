import React from 'react';
import { 
  Truck, 
  Activity, 
  Building2, 
  Clock, 
  Cpu, 
  CheckCircle2, 
  ShieldCheck, 
  Volume2 
} from 'lucide-react';
import { useAeros } from '../context/AerosContext';

export const TacticalStatusPanel: React.FC = () => {
  const {
    ambulance,
    junction,
    hospital,
    timelineEvents,
    iot
  } = useAeros();

  const isCorridorGreen = junction.ambulance_signal === 'GREEN';
  const isCrossRed = junction.conflicting_signal === 'RED';
  const isAcknowledged = hospital.case_acknowledged;

  return (
    <div className="flex flex-col gap-4">
      
      {/* 1. AMBULANCE ASSIGNMENT & DISPATCH TELEMETRY */}
      <div className="spatial-glass rounded-2xl p-4 border border-[#38BDF8]/20 space-y-3 shadow-xl bg-[#111D2E]/90">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#08111F] border border-[#38BDF8]/30 flex items-center justify-center">
              <Truck className="w-3.5 h-3.5 text-[#38BDF8]" />
            </div>
            <h3 className="text-xs font-bold tracking-wider font-hud text-white uppercase">
              Ambulance Telemetry
            </h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-[#38BDF8] border border-[#38BDF8]/30 font-bold">
            {ambulance.id} [ADVANCED ICU]
          </span>
        </div>

        <div className="space-y-2 text-xs font-mono">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Unit Callsign:</span>
            <span className="text-white font-bold">{ambulance.callsign}</span>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Transit Status:</span>
            <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
              ambulance.status === 'ARRIVED'
                ? 'bg-emerald-500/20 text-[#22C55E] border border-[#22C55E]/30'
                : ambulance.status === 'CROSSING'
                ? 'bg-amber-500/20 text-[#F59E0B] border border-[#F59E0B]/30 animate-pulse'
                : 'bg-blue-500/20 text-[#38BDF8] border border-[#38BDF8]/30'
            }`}>
              {ambulance.status}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Driver / Lead:</span>
            <span className="text-slate-200">{ambulance.driver}</span>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Destination:</span>
            <span className="text-white font-semibold truncate">{hospital.name}</span>
          </div>

          {/* Progress Bar */}
          <div className="pt-1">
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
              <span>Transit Progress:</span>
              <span className="text-white font-bold">{Math.round(ambulance.progress)}%</span>
            </div>
            <div className="w-full bg-[#08111F] h-2 rounded-full overflow-hidden border border-slate-800">
              <div 
                className="bg-gradient-to-r from-[#38BDF8] to-[#22C55E] h-full transition-all duration-500"
                style={{ width: `${ambulance.progress}%` }}
              />
            </div>
          </div>

          {/* Hospital Triage Synchronization Status */}
          <div className="p-2.5 rounded-lg bg-[#08111F] border border-slate-800 text-[11px] space-y-1 mt-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#22C55E]" /> Hospital Triage:
              </span>
              <span className={`px-2 py-0.5 rounded font-bold text-[10px] flex items-center gap-1 ${
                isAcknowledged
                  ? 'bg-emerald-500/20 text-[#22C55E] border border-[#22C55E]/30'
                  : 'bg-amber-500/20 text-[#F59E0B] border border-[#F59E0B]/30'
              }`}>
                {isAcknowledged ? (
                  <>
                    <CheckCircle2 className="w-3 h-3" /> ACKNOWLEDGED
                  </>
                ) : (
                  <>
                    <Clock className="w-3 h-3" /> PENDING REVIEW
                  </>
                )}
              </span>
            </div>
            {isAcknowledged && hospital.acknowledged_at && (
              <p className="text-[10px] text-slate-400">
                Acknowledged by Triage Bay at <span className="text-slate-200 font-semibold">{hospital.acknowledged_at}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 2. EXACTLY FOUR TRAFFIC SIGNALS CONTROLLER & HARDWARE INTERFACE */}
      <div className="spatial-glass rounded-2xl p-4 border border-[#38BDF8]/20 space-y-3 shadow-xl bg-[#111D2E]/90">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#08111F] border border-[#22C55E]/30 flex items-center justify-center">
              <Activity className="w-3.5 h-3.5 text-[#22C55E]" />
            </div>
            <h3 className="text-xs font-bold tracking-wider font-hud text-white uppercase">
              4-Signal Intersection Controller
            </h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
            J-01 HARDWARE
          </span>
        </div>

        {/* 4 Signals Grid Matrix: North, South, East, West */}
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          
          {/* TL-01: WEST (Corridor Entry) */}
          <div className={`p-2 rounded-xl border text-center transition-all ${
            isCorridorGreen ? 'bg-emerald-950/40 border-[#22C55E] shadow-[0_0_12px_rgba(34,197,94,0.2)]' : 'bg-[#08111F] border-slate-800'
          }`}>
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
              <span>TL-01: WEST</span>
              <span className={`w-2 h-2 rounded-full ${isCorridorGreen ? 'bg-[#22C55E] animate-ping' : 'bg-amber-400'}`} />
            </div>
            <p className={`font-bold text-xs ${isCorridorGreen ? 'text-[#22C55E]' : 'text-slate-300'}`}>
              {isCorridorGreen ? 'PRIORITY GREEN' : junction.ambulance_signal}
            </p>
            <span className="text-[9px] text-slate-500">Ambulance Route</span>
          </div>

          {/* TL-02: EAST (Corridor Exit / Hospital) */}
          <div className={`p-2 rounded-xl border text-center transition-all ${
            isCorridorGreen ? 'bg-emerald-950/40 border-[#22C55E] shadow-[0_0_12px_rgba(34,197,94,0.2)]' : 'bg-[#08111F] border-slate-800'
          }`}>
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
              <span>TL-02: EAST</span>
              <span className={`w-2 h-2 rounded-full ${isCorridorGreen ? 'bg-[#22C55E] animate-ping' : 'bg-amber-400'}`} />
            </div>
            <p className={`font-bold text-xs ${isCorridorGreen ? 'text-[#22C55E]' : 'text-slate-300'}`}>
              {isCorridorGreen ? 'PRIORITY GREEN' : junction.ambulance_signal}
            </p>
            <span className="text-[9px] text-slate-500">Hospital Route</span>
          </div>

          {/* TL-03: NORTH (Conflicting Cross Traffic) */}
          <div className={`p-2 rounded-xl border text-center transition-all ${
            isCrossRed ? 'bg-red-950/40 border-[#FF4D5A] shadow-[0_0_12px_rgba(255,77,90,0.2)]' : 'bg-[#08111F] border-slate-800'
          }`}>
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
              <span>TL-03: NORTH</span>
              <span className={`w-2 h-2 rounded-full ${isCrossRed ? 'bg-[#FF4D5A]' : 'bg-amber-400'}`} />
            </div>
            <p className={`font-bold text-xs ${isCrossRed ? 'text-[#FF4D5A]' : 'text-slate-300'}`}>
              {isCrossRed ? 'HELD RED' : junction.conflicting_signal}
            </p>
            <span className="text-[9px] text-slate-500">Cross Traffic</span>
          </div>

          {/* TL-04: SOUTH (Conflicting Cross Traffic) */}
          <div className={`p-2 rounded-xl border text-center transition-all ${
            isCrossRed ? 'bg-red-950/40 border-[#FF4D5A] shadow-[0_0_12px_rgba(255,77,90,0.2)]' : 'bg-[#08111F] border-slate-800'
          }`}>
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
              <span>TL-04: SOUTH</span>
              <span className={`w-2 h-2 rounded-full ${isCrossRed ? 'bg-[#FF4D5A]' : 'bg-amber-400'}`} />
            </div>
            <p className={`font-bold text-xs ${isCrossRed ? 'text-[#FF4D5A]' : 'text-slate-300'}`}>
              {isCrossRed ? 'HELD RED' : junction.conflicting_signal}
            </p>
            <span className="text-[9px] text-slate-500">Cross Traffic</span>
          </div>

        </div>

        {/* 16x2 Intersection LCD Dot-Matrix Display */}
        <div className="p-2.5 rounded-xl bg-[#08111F] border border-slate-800 text-xs font-mono space-y-1.5">
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <Cpu className="w-3 h-3" /> 16×2 INTERSECTION LCD
            </span>
            <span className="text-[9px] text-slate-500 font-mono">I2C BUS 0x27</span>
          </div>

          <div className="lcd-display rounded-lg p-2 text-center space-y-0.5 font-bold">
            <div className="tracking-widest text-[11px] text-emerald-400">
              {(iot?.acknowledged_state?.lcd_line1 || (isCorridorGreen ? 'AMBULANCE' : 'AEROS MONITORING')).padEnd(16, ' ')}
            </div>
            <div className="tracking-widest text-[11px] text-emerald-400">
              {(iot?.acknowledged_state?.lcd_line2 || (isCorridorGreen ? 'PLEASE GIVE WAY' : 'JUNCTION STANDBY')).padEnd(16, ' ')}
            </div>
          </div>
        </div>

        {/* Safety Interlock & IoT Telemetry Specs */}
        <div className="space-y-1.5 text-[10px] font-mono text-slate-400">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-slate-400">
              <ShieldCheck className="w-3 h-3 text-[#22C55E]" /> Safety Interlock:
            </span>
            <span className="text-[#22C55E] font-bold">ENGAGED (NO CONFLICTING GREENS)</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-slate-400">
              <Volume2 className="w-3 h-3 text-[#38BDF8]" /> Audible Buzzer:
            </span>
            <span className={`font-bold ${isCorridorGreen ? 'text-[#FF4D5A]' : 'text-slate-400'}`}>
              {isCorridorGreen ? 'SIREN ACTIVE (HIGH PITCH)' : 'STANDBY MUTE'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span>Hardware Bridge:</span>
            <span className="text-amber-400 font-bold">ESP32 SERIAL (SIMULATED)</span>
          </div>
        </div>
      </div>

      {/* 3. INCIDENT & DISPATCH TIMELINE LOG */}
      <div className="spatial-glass rounded-2xl p-4 border border-[#38BDF8]/20 space-y-2 shadow-xl bg-[#111D2E]/90">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#08111F] border border-[#38BDF8]/30 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5 text-[#38BDF8]" />
            </div>
            <h3 className="text-xs font-bold tracking-wider font-hud text-white uppercase">
              Dispatch Timeline
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            {timelineEvents.length} Events
          </span>
        </div>

        <div className="max-h-[170px] overflow-y-auto space-y-2 pr-1 font-mono text-xs custom-scrollbar">
          {timelineEvents.slice(0, 6).map((evt) => (
            <div key={evt.id} className="p-2 rounded-lg bg-[#08111F] border border-slate-800/80 space-y-0.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className={`font-bold px-1 rounded ${
                  evt.severity === 'critical' ? 'text-[#FF4D5A] bg-red-500/10' :
                  evt.severity === 'success' ? 'text-[#22C55E] bg-emerald-500/10' :
                  evt.severity === 'warning' ? 'text-[#F59E0B] bg-amber-500/10' :
                  'text-[#38BDF8] bg-blue-500/10'
                }`}>
                  [{evt.category.toUpperCase()}]
                </span>
                <span className="text-slate-500 text-[9px]">{evt.timestamp}</span>
              </div>
              <p className="text-white text-[11px] font-semibold">{evt.title}</p>
              <p className="text-slate-400 text-[10px] line-clamp-2">{evt.description}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
