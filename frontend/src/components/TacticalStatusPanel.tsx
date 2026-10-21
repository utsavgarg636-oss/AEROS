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
      <div className="bg-white rounded-2xl p-4 border border-[#E3EEE8] space-y-3 shadow-sm">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#DDF7EA] border border-[#A7F3D0] flex items-center justify-center">
              <Truck className="w-4 h-4 text-[#10B981]" />
            </div>
            <h3 className="text-xs font-bold tracking-tight text-slate-800 uppercase">
              Ambulance Telemetry
            </h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#DDF7EA] text-[#065F46] border border-[#A7F3D0] font-bold">
            {ambulance.id} [ICU]
          </span>
        </div>

        <div className="space-y-2 text-xs font-mono">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Callsign:</span>
            <span className="text-slate-800 font-bold">{ambulance.callsign}</span>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Transit Status:</span>
            <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
              ambulance.status === 'ARRIVED'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : ambulance.status === 'CROSSING'
                ? 'bg-amber-100 text-amber-800 border border-amber-200 animate-pulse'
                : 'bg-blue-100 text-blue-800 border border-blue-200'
            }`}>
              {ambulance.status}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Driver / Lead:</span>
            <span className="text-slate-700">{ambulance.driver}</span>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Destination:</span>
            <span className="text-slate-800 font-semibold truncate">{hospital.name}</span>
          </div>

          {/* Progress Bar */}
          <div className="pt-1">
            <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
              <span>Transit Progress:</span>
              <span className="text-slate-800 font-bold">{Math.round(ambulance.progress)}%</span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
              <div 
                className="bg-[#10B981] h-full transition-all duration-500"
                style={{ width: `${ambulance.progress}%` }}
              />
            </div>
          </div>

          {/* Hospital Triage Synchronization Status */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] space-y-1 mt-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#10B981]" /> Hospital Triage:
              </span>
              <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] flex items-center gap-1 ${
                isAcknowledged
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-100 text-amber-800 border border-amber-200'
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
              <p className="text-[10px] text-slate-500">
                Logged by Triage Bay at <span className="text-slate-800 font-semibold">{hospital.acknowledged_at}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 2. 4-SIGNAL INTERSECTION CONTROLLER */}
      <div className="bg-white rounded-2xl p-4 border border-[#E3EEE8] space-y-3 shadow-sm">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#DDF7EA] border border-[#A7F3D0] flex items-center justify-center">
              <Activity className="w-4 h-4 text-[#10B981]" />
            </div>
            <h3 className="text-xs font-bold tracking-tight text-slate-800 uppercase">
              4-Signal Controller
            </h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            J-01 JUNCTION
          </span>
        </div>

        {/* 4 Signals Grid Matrix: North, South, East, West */}
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          
          {/* TL-01: WEST (Corridor Entry) */}
          <div className={`p-2.5 rounded-xl border text-center transition-all ${
            isCorridorGreen ? 'bg-emerald-50 border-emerald-400 shadow-xs' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
              <span>TL-01: WEST</span>
              <span className={`w-2 h-2 rounded-full ${isCorridorGreen ? 'bg-emerald-500 animate-ping' : 'bg-amber-400'}`} />
            </div>
            <p className={`font-bold text-xs ${isCorridorGreen ? 'text-emerald-700' : 'text-slate-700'}`}>
              {isCorridorGreen ? 'PRIORITY GREEN' : junction.ambulance_signal}
            </p>
            <span className="text-[9px] text-slate-400">Ambulance Route</span>
          </div>

          {/* TL-02: EAST (Corridor Exit / Hospital) */}
          <div className={`p-2.5 rounded-xl border text-center transition-all ${
            isCorridorGreen ? 'bg-emerald-50 border-emerald-400 shadow-xs' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
              <span>TL-02: EAST</span>
              <span className={`w-2 h-2 rounded-full ${isCorridorGreen ? 'bg-emerald-500 animate-ping' : 'bg-amber-400'}`} />
            </div>
            <p className={`font-bold text-xs ${isCorridorGreen ? 'text-emerald-700' : 'text-slate-700'}`}>
              {isCorridorGreen ? 'PRIORITY GREEN' : junction.ambulance_signal}
            </p>
            <span className="text-[9px] text-slate-400">Hospital Route</span>
          </div>

          {/* TL-03: NORTH (Conflicting Cross Traffic) */}
          <div className={`p-2.5 rounded-xl border text-center transition-all ${
            isCrossRed ? 'bg-red-50 border-red-300 shadow-xs' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
              <span>TL-03: NORTH</span>
              <span className={`w-2 h-2 rounded-full ${isCrossRed ? 'bg-red-500' : 'bg-amber-400'}`} />
            </div>
            <p className={`font-bold text-xs ${isCrossRed ? 'text-red-700' : 'text-slate-700'}`}>
              {isCrossRed ? 'HELD RED' : junction.conflicting_signal}
            </p>
            <span className="text-[9px] text-slate-400">Cross Traffic</span>
          </div>

          {/* TL-04: SOUTH (Conflicting Cross Traffic) */}
          <div className={`p-2.5 rounded-xl border text-center transition-all ${
            isCrossRed ? 'bg-red-50 border-red-300 shadow-xs' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
              <span>TL-04: SOUTH</span>
              <span className={`w-2 h-2 rounded-full ${isCrossRed ? 'bg-red-500' : 'bg-amber-400'}`} />
            </div>
            <p className={`font-bold text-xs ${isCrossRed ? 'text-red-700' : 'text-slate-700'}`}>
              {isCrossRed ? 'HELD RED' : junction.conflicting_signal}
            </p>
            <span className="text-[9px] text-slate-400">Cross Traffic</span>
          </div>

        </div>

        {/* 16x2 Intersection LCD Dot-Matrix Display */}
        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono space-y-1.5 shadow-inner">
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
        <div className="space-y-1.5 text-[10px] font-mono text-slate-500">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-[#10B981]" /> Safety Interlock:
            </span>
            <span className="text-[#065F46] font-bold">ENGAGED (NO CONFLICTING GREENS)</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Volume2 className="w-3 h-3 text-slate-500" /> Audible Buzzer:
            </span>
            <span className={`font-bold ${isCorridorGreen ? 'text-red-600' : 'text-slate-500'}`}>
              {isCorridorGreen ? 'SIREN ACTIVE (HIGH PITCH)' : 'STANDBY MUTE'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span>Hardware Bridge:</span>
            <span className="text-amber-700 font-bold">ESP32 SERIAL (SIMULATED)</span>
          </div>
        </div>
      </div>

      {/* 3. INCIDENT & DISPATCH TIMELINE LOG */}
      <div className="bg-white rounded-2xl p-4 border border-[#E3EEE8] space-y-2 shadow-sm">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#DDF7EA] border border-[#A7F3D0] flex items-center justify-center">
              <Clock className="w-4 h-4 text-[#10B981]" />
            </div>
            <h3 className="text-xs font-bold tracking-tight text-slate-800 uppercase">
              Dispatch Timeline
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            {timelineEvents.length} Events
          </span>
        </div>

        <div className="max-h-[170px] overflow-y-auto space-y-2 pr-1 font-mono text-xs">
          {timelineEvents.slice(0, 6).map((evt) => (
            <div key={evt.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-0.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className={`font-bold px-1.5 py-0.2 rounded-full ${
                  evt.severity === 'critical' ? 'text-red-700 bg-red-100 border border-red-200' :
                  evt.severity === 'success' ? 'text-emerald-700 bg-emerald-100 border border-emerald-200' :
                  evt.severity === 'warning' ? 'text-amber-800 bg-amber-100 border border-amber-200' :
                  'text-blue-700 bg-blue-100 border border-blue-200'
                }`}>
                  [{evt.category.toUpperCase()}]
                </span>
                <span className="text-slate-400 text-[9px]">{evt.timestamp}</span>
              </div>
              <p className="text-slate-800 text-[11px] font-semibold">{evt.title}</p>
              <p className="text-slate-500 text-[10px] line-clamp-2">{evt.description}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
