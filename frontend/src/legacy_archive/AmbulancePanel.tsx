import { 
  Truck, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  AlertCircle,
  XCircle
} from 'lucide-react';
import { useAeros } from '../context/AerosContext';

export const AmbulancePanel: React.FC = () => {
  const {
    ambulances,
    selectedAmbulanceId,
    selectAmbulance,
    confirmAmbulanceAssignment,
    cancelAmbulanceAssignment,
    incident,
  } = useAeros();

  const isVerified = incident?.verified ?? false;
  const hasActiveAssignment = ambulances.some(a => a.status !== 'Available');

  return (
    <div className="spatial-glass rounded-2xl p-4 flex flex-col gap-3.5 border border-[#00D9FF]/20 shadow-xl">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-[#00D9FF]" />
          <h2 className="text-sm font-bold tracking-wider font-hud text-white uppercase">
            Emergency Ambulance Fleet
          </h2>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-[#00D9FF] border border-[#00D9FF]/20">
          SIMULATED GPS WAYPOINTS
        </span>
      </div>

      {/* Fleet Cards */}
      <div className="space-y-2.5">
        {ambulances.map((amb) => {
          const isSelected = selectedAmbulanceId === amb.id;
          const isAssigned = amb.status !== 'Available';

          return (
            <div
              key={amb.id}
              onClick={() => {
                if (amb.availability) selectAmbulance(amb.id);
              }}
              className={`p-3 rounded-xl border transition-all text-xs font-mono cursor-pointer ${
                isSelected
                  ? 'bg-[#00D9FF]/10 border-[#00D9FF] shadow-[0_0_15px_rgba(0,217,255,0.2)]'
                  : isAssigned
                  ? 'bg-amber-950/20 border-amber-500/40 opacity-90'
                  : 'bg-[#0B1220]/80 border-slate-800 hover:border-slate-700 hover:bg-[#0B1220]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">{amb.id}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                    amb.status === 'Available'
                      ? 'bg-emerald-500/15 text-[#00E5B0] border border-[#00E5B0]/30'
                      : 'bg-amber-500/15 text-[#FFB547] border border-[#FFB547]/30'
                  }`}>
                    {amb.status.toUpperCase()}
                  </span>
                </div>
                <span className="text-slate-400 text-[11px]">{amb.distanceKm} km from site</span>
              </div>

              <div className="mt-2 text-[11px] text-slate-300">
                <p className="text-white font-medium">{amb.callsign}</p>
                <p className="text-slate-400 text-[10px] mt-0.5">{amb.category}</p>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#00D9FF]" /> {amb.baseLocation}
                </span>
                <span className="flex items-center gap-1 font-bold text-white">
                  <Clock className="w-3 h-3 text-emerald-400" /> ETA: {amb.etaMinutes} Mins
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dispatch Authorization Bar */}
      <div className="pt-2 border-t border-slate-800 flex flex-col gap-2 font-mono text-xs">
        {!isVerified && (
          <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-500/30 text-[11px] text-[#FFB547] flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Verify active accident before dispatching ambulance.</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={confirmAmbulanceAssignment}
            disabled={!isVerified || !selectedAmbulanceId || hasActiveAssignment}
            className={`p-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
              isVerified && selectedAmbulanceId && !hasActiveAssignment
                ? 'bg-gradient-to-r from-[#00D9FF] to-[#00E5B0] text-[#070B14] shadow-[0_0_20px_rgba(0,217,255,0.4)] cursor-pointer hover:opacity-95'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            <ShieldCheck className="w-4 h-4" /> Confirm Dispatch
          </button>

          <button
            onClick={cancelAmbulanceAssignment}
            disabled={!hasActiveAssignment}
            className={`p-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
              hasActiveAssignment
                ? 'bg-red-500/15 text-[#FF4057] border border-red-500/30 hover:bg-red-500/25 cursor-pointer'
                : 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700'
            }`}
          >
            <XCircle className="w-4 h-4" /> Cancel Dispatch
          </button>
        </div>
      </div>

    </div>
  );
};
