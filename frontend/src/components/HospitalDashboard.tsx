import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  CheckCircle2, 
  Truck, 
  Activity, 
  ShieldCheck, 
  UserCheck,
  Heart,
  Zap,
  Navigation,
  MapPin
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAeros } from '../context/AerosContext';

export const HospitalDashboard: React.FC = () => {
  const { 
    hospital, 
    incident, 
    ambulance, 
    acknowledgeHospitalCase, 
    markHospitalArrived,
    backendConnected
  } = useAeros();

  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [isActing, setIsActing] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setCurrentDate(now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const hasActiveCase = Boolean(incident || ambulance.assigned_incident_id);
  const caseId = incident?.id || ambulance.assigned_incident_id || 'INC-DEMO-2026';
  const isAcknowledged = hospital.case_acknowledged;
  const isAmbulanceAtHospital = ambulance.progress >= 95 || ambulance.status === 'ARRIVED';
  const isArrivalConfirmed = hospital.arrival_status === 'ARRIVED';

  const handleAcknowledge = async () => {
    setIsActing(true);
    try {
      await acknowledgeHospitalCase();
    } finally {
      setIsActing(false);
    }
  };

  const handleMarkArrived = async () => {
    setIsActing(true);
    try {
      await markHospitalArrived();
    } finally {
      setIsActing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5FBF8] text-[#1F2937] font-sans flex flex-col selection:bg-[#10B981]/20 selection:text-[#065F46]">
      
      {/* 1. Hospital Header Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E3EEE8] px-4 lg:px-6 py-2.5 shadow-sm">
        <div className="max-w-[1920px] mx-auto flex flex-wrap items-center justify-between gap-4">
          
          {/* Brand & Hospital Info */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#DDF7EA] border border-[#10B981]/40 flex items-center justify-center text-[#10B981] shadow-xs">
                <Building2 className="w-5 h-5" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight text-[#1F2937]">
                    Apex Emergency & Trauma Center
                  </h1>
                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-[#DDF7EA] text-[#065F46] border border-[#A7F3D0]">
                    DEMO HOSPITAL
                  </span>
                </div>
                <p className="text-[11px] text-[#6B7280] font-medium">
                  Emergency Department Receiving Console • Fictional Intake System
                </p>
              </div>
            </div>

            {/* Navigation Route Tabs */}
            <nav className="hidden md:flex items-center bg-[#F3F4F6] p-1 rounded-xl border border-[#E5E7EB] text-xs font-semibold">
              <Link
                to="/system"
                className="px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-[#6B7280] hover:text-[#1F2937] transition-all cursor-pointer"
              >
                <Navigation className="w-3.5 h-3.5 text-[#10B981]" />
                <span>Junction Command</span>
              </Link>
              <Link
                to="/hospital"
                className="px-3 py-1.5 rounded-lg flex items-center gap-1.5 bg-white text-[#1F2937] shadow-xs font-bold border border-[#E5E7EB] transition-all cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5 text-[#10B981]" />
                <span>Hospital Intake</span>
              </Link>
            </nav>
          </div>

          {/* Right Controls: Navigation link & Live Clock */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col text-right font-mono text-xs">
              <span className="text-[#1F2937] font-bold text-sm tracking-wide">{currentTime}</span>
              <span className="text-[#6B7280] text-[10px]">{currentDate}</span>
            </div>

            <Link
              to="/system"
              className="px-3.5 py-1.5 rounded-xl bg-[#DDF7EA] hover:bg-emerald-200 text-[#065F46] border border-[#A7F3D0] font-mono text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              title="Return to System Command Dashboard"
            >
              <span>← Junction Dashboard</span>
            </Link>
          </div>

        </div>
      </header>

      {/* 2. Top Simulated Data Notice Banner */}
      <div className="bg-[#FFFBEB] border-b border-[#FDE68A] px-4 py-2">
        <div className="max-w-[1920px] mx-auto flex items-center justify-between text-xs font-mono text-amber-900">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span>
              <strong>NOTICE:</strong> All hospital admission records, patient vitals, and triage links are <strong>SIMULATED</strong> for academic demonstration.
            </span>
          </div>
          <span className="hidden md:inline font-bold text-amber-800">
            Backend Connection: {backendConnected ? 'ACTIVE (Shared Single Source of Truth)' : 'STANDBY'}
          </span>
        </div>
      </div>

      {/* 3. Main Console Body: 3 Structured Columns */}
      <main className="flex-1 max-w-[1920px] w-full mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* ================================================================= */}
        {/* COLUMN 1: INCOMING AMBULANCE UNIT & TRANSIT PROGRESS (lg:col-span-4) */}
        {/* ================================================================= */}
        <section className="lg:col-span-4 flex flex-col gap-4">
          
          {/* Card: Ambulance Unit Profile */}
          <div className="bg-white rounded-2xl p-5 border border-[#E3EEE8] shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#DDF7EA] border border-[#A7F3D0] flex items-center justify-center">
                  <Truck className="w-4 h-4 text-[#10B981]" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800">Incoming Ambulance</h2>
                  <p className="text-[10px] text-slate-500 font-mono">Priority Transit En Route</p>
                </div>
              </div>

              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                isArrivalConfirmed 
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                  : (ambulance.status === 'CROSSING' ? 'bg-amber-100 text-amber-800 border border-amber-200 animate-pulse' : 'bg-blue-100 text-blue-800 border border-blue-200')
              }`}>
                {ambulance.status}
              </span>
            </div>

            {/* Vehicle Details Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-slate-400 text-[10px]">Unit ID</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">{ambulance.id}</p>
                <p className="text-[10px] text-emerald-700 font-medium mt-1">{ambulance.type}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-slate-400 text-[10px]">Callsign</p>
                <p className="text-xs font-bold text-slate-800 mt-1 truncate">{ambulance.callsign}</p>
                <p className="text-[10px] text-slate-500 mt-1">Lead: {ambulance.driver}</p>
              </div>
            </div>

            {/* Transit Progress Bar */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-semibold">Corridor Route Progress:</span>
                <span className="text-[#10B981] font-bold text-sm">{Math.round(ambulance.progress)}%</span>
              </div>
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-[#10B981] h-full transition-all duration-500"
                  style={{ width: `${ambulance.progress}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                <span>West Approach Site</span>
                <span>Central J-01</span>
                <span>Apex Trauma Bay</span>
              </div>
            </div>

            {/* Incident Origin Location */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2.5 font-mono text-xs">
              <MapPin className="w-4 h-4 text-red-500 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-400">Incident Origin</p>
                <p className="font-bold text-slate-800 text-[11px] truncate">
                  {incident?.location || 'NH-24 West Approach (Sector 5 Corridor)'}
                </p>
              </div>
            </div>

          </div>

          {/* Quick Overview Card */}
          <div className="bg-white rounded-2xl p-4 border border-[#E3EEE8] shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Hospital Bay Allocation</p>
              <h3 className="text-base font-bold text-slate-800 mt-0.5">Triage Bay Alpha (Trauma)</h3>
              <p className="text-[11px] text-[#065F46] font-medium mt-0.5">Reserved for Incoming Unit {ambulance.id}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#DDF7EA] border border-[#A7F3D0] flex items-center justify-center text-[#10B981]">
              <Activity className="w-5 h-5" />
            </div>
          </div>

        </section>

        {/* ================================================================= */}
        {/* COLUMN 2: PATIENT CLINICAL VITALS & TRIAGE ASSESSMENT (lg:col-span-4) */}
        {/* ================================================================= */}
        <section className="lg:col-span-4 flex flex-col gap-4">
          
          <div className="bg-white rounded-2xl p-5 border border-[#E3EEE8] shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center">
                  <Heart className="w-4 h-4 text-red-600 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800">Patient Clinical Vitals</h2>
                  <p className="text-[10px] text-slate-500 font-mono">Telemetry Transmitted via Tele-ICU</p>
                </div>
              </div>

              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                incident?.severity === 'HIGH' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}>
                TRIAGE: {incident?.severity || 'HIGH'} PRIORITY
              </span>
            </div>

            {/* Vitals Telemetry Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between text-slate-500 text-[10px]">
                  <span>Heart Rate</span>
                  <Heart className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                </div>
                <p className="text-xl font-bold text-slate-800 mt-1">
                  {hasActiveCase ? '112' : '--'} <span className="text-[10px] font-normal text-slate-500">bpm</span>
                </p>
                <p className="text-[10px] text-red-600 font-medium mt-0.5">Tachycardia / Trauma</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between text-slate-500 text-[10px]">
                  <span>Blood Pressure</span>
                  <Activity className="w-3.5 h-3.5 text-blue-500" />
                </div>
                <p className="text-xl font-bold text-slate-800 mt-1">
                  {hasActiveCase ? '138/88' : '--/--'} <span className="text-[10px] font-normal text-slate-500">mmHg</span>
                </p>
                <p className="text-[10px] text-slate-600 font-medium mt-0.5">Elevated MAP</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between text-slate-500 text-[10px]">
                  <span>SpO2 (Oxygen)</span>
                  <Zap className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                <p className="text-xl font-bold text-slate-800 mt-1">
                  {hasActiveCase ? '96%' : '--%'}
                </p>
                <p className="text-[10px] text-emerald-700 font-medium mt-0.5">Oxygenated (4L O2)</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between text-slate-500 text-[10px]">
                  <span>GCS / Trauma</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
                </div>
                <p className="text-xl font-bold text-slate-800 mt-1">
                  {hasActiveCase ? 'GCS 14' : '--'}
                </p>
                <p className="text-[10px] text-purple-700 font-medium mt-0.5">Conscious / Alert</p>
              </div>

            </div>

            {/* Incident Impact Context */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Case Identifier:</span>
                <span className="font-bold text-slate-800">{caseId}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Detection Source:</span>
                <span className="text-slate-700">{incident?.source || 'SIMULATED_DEMO_INCIDENT'}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Vehicles Involved:</span>
                <span className="font-semibold text-slate-800">
                  {(incident?.vehicles_involved || ['car', 'truck']).join(', ')}
                </span>
              </div>
            </div>

            {/* Trauma Team Standby Callout */}
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-mono text-red-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shrink-0" />
              <span>
                <strong>LEVEL 1 TRAUMA PROTOCOL:</strong> Surgical team on standby in Trauma Bay Alpha.
              </span>
            </div>

          </div>

        </section>

        {/* ================================================================= */}
        {/* COLUMN 3: HOSPITAL READINESS & TRIAGE ADMISSION ACTIONS (lg:col-span-4) */}
        {/* ================================================================= */}
        <section className="lg:col-span-4 flex flex-col gap-4">
          
          <div className="bg-white rounded-2xl p-5 border border-[#E3EEE8] shadow-sm flex flex-col gap-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#DDF7EA] border border-[#A7F3D0] flex items-center justify-center">
                  <UserCheck className="w-4 h-4 text-[#10B981]" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800">Triage Intake & Actions</h2>
                  <p className="text-[10px] text-slate-500 font-mono">Admission Workflow Controls</p>
                </div>
              </div>

              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                isAcknowledged ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200 animate-pulse'
              }`}>
                {isAcknowledged ? 'CASE ACKNOWLEDGED' : 'ACTION REQUIRED'}
              </span>
            </div>

            {/* Acknowledgement Status Callout */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-[11px]">Triage Lead:</span>
                <span className="font-bold text-slate-800">{hospital.acknowledged_by || 'Dr. S. Nair (Triage Lead)'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-[11px]">Case Acknowledgement:</span>
                <span className={`font-bold ${isAcknowledged ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {isAcknowledged ? `Verified at ${hospital.acknowledged_at}` : 'Pending Intake Confirmation'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-[11px]">Arrival Registration:</span>
                <span className={`font-bold ${isArrivalConfirmed ? 'text-emerald-700' : 'text-slate-500'}`}>
                  {isArrivalConfirmed ? `Logged at ${hospital.arrived_at}` : (isAmbulanceAtHospital ? 'Ambulance At Gate' : 'In Transit')}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2.5 pt-1 font-mono text-xs">
              
              {/* Action 1: Acknowledge Case */}
              <button
                onClick={handleAcknowledge}
                disabled={isActing || isAcknowledged || !hasActiveCase}
                className={`w-full py-2.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs ${
                  isAcknowledged
                    ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                    : 'bg-[#10B981] hover:bg-[#059669] text-white shadow-sm active:scale-98'
                } disabled:opacity-50`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isAcknowledged ? 'Case Verified & Acknowledged' : 'Acknowledge Emergency Case'}</span>
              </button>

              {/* Action 2: Mark Arrived */}
              <button
                onClick={handleMarkArrived}
                disabled={isActing || isArrivalConfirmed || !isAmbulanceAtHospital}
                className={`w-full py-2.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-xs ${
                  isArrivalConfirmed
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 cursor-not-allowed'
                    : isAmbulanceAtHospital
                    ? 'bg-[#10B981] hover:bg-[#059669] text-white shadow-sm cursor-pointer active:scale-98'
                    : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                } disabled:opacity-50`}
                title={
                  !isAmbulanceAtHospital 
                    ? 'Disabled: Ambulance must reach the hospital in the simulation before arrival can be marked.'
                    : 'Confirm verified arrival at hospital campus'
                }
              >
                <Truck className="w-4 h-4" />
                <span>
                  {isArrivalConfirmed 
                    ? 'Arrival Officially Recorded' 
                    : (isAmbulanceAtHospital ? 'Confirm Ambulance Arrival' : 'Mark Arrived (Ambulance En Route)')}
                </span>
              </button>

            </div>

            {!isAmbulanceAtHospital && !isArrivalConfirmed && (
              <p className="text-[10px] font-mono text-slate-400 text-center">
                * "Confirm Ambulance Arrival" unlocks automatically when the ambulance reaches the hospital campus.
              </p>
            )}

            {/* Handover Notice Banner */}
            {isArrivalConfirmed && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-mono text-emerald-800 flex items-center gap-2 shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                <span>
                  <strong>PATIENT HANDOVER COMPLETE:</strong> Triage handover logged at {hospital.arrived_at}. Trauma surgery team mobilized.
                </span>
              </div>
            )}

          </div>

          {/* ICU Bed Capacity Card */}
          <div className="bg-white rounded-2xl p-4 border border-[#E3EEE8] shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Trauma Center Capacity</p>
              <h3 className="text-base font-bold text-slate-800 mt-0.5">Level 1 Trauma Ready</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">4 ICU Bays Available • 2 ORs Standby</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#DDF7EA] border border-[#A7F3D0] flex items-center justify-center text-[#10B981]">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

        </section>

      </main>

      {/* 4. Footer */}
      <footer className="mt-auto border-t border-[#E3EEE8] bg-white py-3 px-6 text-center text-xs font-mono text-slate-500">
        Apex Emergency Care Hospital Intake Simulation • Part of A.E.R.O.S. Automated Response Architecture
      </footer>

    </div>
  );
};
