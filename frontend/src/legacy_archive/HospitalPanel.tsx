import { 
  Building2, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck,
  Stethoscope,
  UserPlus
} from 'lucide-react';
import { useAeros } from '../context/AerosContext';

export const HospitalPanel: React.FC = () => {
  const {
    hospitals,
    selectedHospitalId,
    selectHospital,
    hospitalAcceptCase,
    hospitalPrepareED,
    hospitalMarkReady,
    hospitalConfirmArrival,
    incident,
    selectedAmbulanceId,
    ambulances,
  } = useAeros();

  const selectedHospital = hospitals.find(h => h.id === selectedHospitalId) || hospitals[0];
  const assignedAmbulance = ambulances.find(a => a.id === selectedAmbulanceId);
  const isEnRoute = incident?.status && ['DISPATCHED', 'EN_ROUTE', 'ON_SCENE', 'TRANSPORTING'].includes(incident.status);

  return (
    <div className="spatial-glass rounded-2xl p-4 flex flex-col gap-3.5 border border-[#00D9FF]/20 shadow-xl">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-[#00E5B0]" />
          <h2 className="text-sm font-bold tracking-wider font-hud text-white uppercase">
            Hospital ED Receiving Console
          </h2>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-[#00E5B0] border border-[#00E5B0]/20">
          SIMULATED ED CONSOLE
        </span>
      </div>

      {/* Hospital Selection Tabs */}
      <div className="grid grid-cols-3 gap-1.5 font-mono text-xs">
        {hospitals.map((hosp) => {
          const isSelected = hosp.id === selectedHospitalId;
          return (
            <button
              key={hosp.id}
              onClick={() => selectHospital(hosp.id)}
              className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#00E5B0]/15 border-[#00E5B0] text-white shadow-[0_0_12px_rgba(0,229,176,0.25)]'
                  : 'bg-[#0B1220]/70 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <p className="font-bold text-[11px] truncate">{hosp.name.split(' ')[0]}</p>
              <p className="text-[9px] text-[#00D9FF] mt-0.5">{hosp.distanceKm} km</p>
            </button>
          );
        })}
      </div>

      {/* Selected Hospital Detailed Card */}
      <div className="p-3 rounded-xl bg-[#0B1220]/80 border border-slate-800 text-xs font-mono space-y-2">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
          <div>
            <h3 className="font-bold text-white text-sm">{selectedHospital.name}</h3>
            <p className="text-[10px] text-slate-400">{selectedHospital.tier}</p>
          </div>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
            selectedHospital.edReadiness === 'High' ? 'bg-emerald-500/20 text-[#00E5B0]' : 'bg-amber-500/20 text-[#FFB547]'
          }`}>
            READINESS: {selectedHospital.edReadiness.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
          <div className="flex items-center justify-between p-1.5 rounded bg-slate-900/60">
            <span className="text-slate-400">Available Beds:</span>
            <span className="text-[#00E5B0] font-bold">{selectedHospital.availableBeds}</span>
          </div>

          <div className="flex items-center justify-between p-1.5 rounded bg-slate-900/60">
            <span className="text-slate-400">Trauma OT 1:</span>
            <span className="text-white font-semibold">{selectedHospital.traumaOtStatus}</span>
          </div>

          <div className="flex items-center justify-between p-1.5 rounded bg-slate-900/60">
            <span className="text-slate-400">Blood Bank:</span>
            <span className="text-white font-semibold">{selectedHospital.bloodBankStatus}</span>
          </div>

          <div className="flex items-center justify-between p-1.5 rounded bg-slate-900/60">
            <span className="text-slate-400">Surgical Team:</span>
            <span className={`font-semibold ${selectedHospital.medicalTeamAlerted ? 'text-[#00E5B0]' : 'text-slate-400'}`}>
              {selectedHospital.medicalTeamAlerted ? 'MOBILIZED' : 'STANDBY'}
            </span>
          </div>
        </div>
      </div>

      {/* INCOMING EMERGENCY PATIENT NOTIFICATION */}
      {isEnRoute && (
        <div className="p-3 rounded-xl bg-red-950/70 border border-[#FF4057]/70 text-xs font-mono shadow-[0_0_20px_rgba(255,64,87,0.25)] animate-pulse space-y-1.5">
          <div className="flex items-center justify-between text-[#FF4057] font-bold text-xs pb-1 border-b border-red-900/60">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 fill-red-500/20" /> INCOMING EMERGENCY PATIENT
            </span>
            <span>ETA: {assignedAmbulance?.etaMinutes ?? 5} MINS</span>
          </div>

          <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-300 pt-1">
            <p>Incident: <span className="font-bold text-white">{incident?.id}</span></p>
            <p>Severity: <span className="font-bold text-[#FF4057]">{incident?.severity}</span></p>
            <p>Unit: <span className="font-bold text-[#00D9FF]">{selectedAmbulanceId || 'AMB-102'}</span></p>
            <p>Site: <span className="font-bold text-slate-200">Zone A (Sector 5)</span></p>
          </div>
        </div>
      )}

      {/* Hospital Coordination Actions */}
      <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-xs">
        <button
          onClick={hospitalAcceptCase}
          className={`p-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            selectedHospital.caseAccepted
              ? 'bg-emerald-950/60 text-[#00E5B0] border border-[#00E5B0]/40'
              : 'bg-[#0B1220] hover:bg-[#00E5B0]/10 text-slate-200 border border-slate-700'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-[#00E5B0]" />
          <span>{selectedHospital.caseAccepted ? 'Case Accepted' : 'Accept Case'}</span>
        </button>

        <button
          onClick={hospitalPrepareED}
          className="p-2 rounded-xl bg-[#0B1220] hover:bg-[#00D9FF]/10 text-slate-200 border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Stethoscope className="w-3.5 h-3.5 text-[#00D9FF]" />
          <span>Prepare Trauma OT</span>
        </button>

        <button
          onClick={hospitalMarkReady}
          className="p-2 rounded-xl bg-[#0B1220] hover:bg-[#00E5B0]/10 text-slate-200 border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-[#00E5B0]" />
          <span>Mark ED Ready</span>
        </button>

        <button
          onClick={hospitalConfirmArrival}
          className="p-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(0,229,176,0.3)]"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Confirm Arrival</span>
        </button>
      </div>

    </div>
  );
};
