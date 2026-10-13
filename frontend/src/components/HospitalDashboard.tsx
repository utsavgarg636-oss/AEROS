import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  CheckCircle2, 
  Clock, 
  Truck, 
  ArrowLeft, 
  Activity, 
  ShieldCheck, 
  FileText,
  UserCheck
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
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans flex flex-col selection:bg-[#0D9488]/20 selection:text-[#0F766E]">
      
      {/* 1. Hospital Header Bar (Clean Off-White & Teal) */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-sm px-4 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          
          {/* Brand & Hospital Info */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#CCFBF1] border border-[#14B8A6]/40 flex items-center justify-center text-[#0F766E] shadow-sm">
              <Building2 className="w-6 h-6 text-[#0D9488]" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-[#0F172A]">
                  Apex Emergency & Trauma Center
                </h1>
                <span className="text-[11px] font-medium font-mono px-2 py-0.5 rounded-full bg-teal-50 text-[#0F766E] border border-teal-200">
                  SIMULATED DEMO HOSPITAL
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">
                Emergency Department Receiving Console • Fictional Intake System
              </p>
            </div>
          </div>

          {/* Right Controls: Navigation link & Live Clock */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col text-right font-mono text-xs">
              <span className="text-slate-800 font-semibold">{currentTime}</span>
              <span className="text-slate-400 text-[10px]">{currentDate}</span>
            </div>

            <Link
              to="/system"
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0F766E] border border-slate-200 font-mono text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              title="Return to System Command Dashboard"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to System Dashboard (/system)</span>
            </Link>
          </div>

        </div>
      </header>

      {/* 2. Top Simulated Data Notice Banner */}
      <div className="bg-amber-50 border-b border-amber-200/80 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs font-mono text-amber-900">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span>
              <strong>NOTICE:</strong> All hospital records, triage admission statuses, and paramedic links are <strong>SIMULATED</strong> for academic demonstration.
            </span>
          </div>
          <span className="hidden md:inline font-bold text-amber-700">
            Backend Connection: {backendConnected ? 'ACTIVE (Shared State)' : 'STANDBY'}
          </span>
        </div>
      </div>

      {/* 3. Main Console Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 flex flex-col gap-6">
        
        {/* Hospital Overview Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-mono text-slate-400">Emergency Department</p>
              <h3 className="text-lg font-bold text-slate-800 mt-0.5">Triage Bay Alpha</h3>
              <p className="text-[11px] text-teal-700 font-medium mt-1">Dedicated Corridor Intake</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#0D9488]">
              <Activity className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-mono text-slate-400">Triage Case Status</p>
              <h3 className="text-lg font-bold text-slate-800 mt-0.5">
                {hasActiveCase ? (isAcknowledged ? 'Case Acknowledged' : 'Incoming Case') : 'Standby / Ready'}
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">
                {isAcknowledged ? `Verified at ${hospital.acknowledged_at}` : 'Awaiting paramedic triage'}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#0D9488]">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-mono text-slate-400">Campus Arrival Status</p>
              <h3 className="text-lg font-bold text-slate-800 mt-0.5">
                {isArrivalConfirmed ? 'Arrived at Campus' : (hasActiveCase ? 'In Transit / Approaching' : 'Bay Vacant')}
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">
                {isArrivalConfirmed ? `Logged at ${hospital.arrived_at}` : (isAmbulanceAtHospital ? 'Ambulance docked at gate' : 'En route to hospital')}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#0D9488]">
              <Truck className="w-5 h-5" />
            </div>
          </div>
        </section>

        {/* Incoming Ambulance Case Card */}
        <section className="bg-white rounded-2xl border border-slate-200/90 shadow-md p-6 flex flex-col gap-6">
          
          <div className="flex flex-wrap items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-[#0D9488]">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Incoming Emergency Ambulance Case
                </h2>
                <p className="text-xs text-slate-500 font-mono">
                  Case ID: <span className="font-bold text-slate-800">{caseId}</span> • Unit: <span className="font-bold text-[#0D9488]">{ambulance.id}</span>
                </p>
              </div>
            </div>

            {/* Status Pills */}
            <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
              <span className={`px-3 py-1 rounded-full font-bold border flex items-center gap-1.5 ${
                isAcknowledged
                  ? 'bg-teal-50 text-[#0F766E] border-teal-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200 animate-pulse'
              }`}>
                {isAcknowledged ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                <span>{isAcknowledged ? 'ACKNOWLEDGED BY TRIAGE' : 'PENDING ACKNOWLEDGEMENT'}</span>
              </span>

              <span className={`px-3 py-1 rounded-full font-bold border flex items-center gap-1.5 ${
                isArrivalConfirmed
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}>
                <Truck className="w-3.5 h-3.5 text-[#0D9488]" />
                <span>{isArrivalConfirmed ? 'ARRIVED AT HOSPITAL' : 'IN TRANSIT / APPROACHING'}</span>
              </span>
            </div>
          </div>

          {/* Incident Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <p className="text-slate-400 text-[11px]">Incident ID</p>
              <p className="text-sm font-bold text-slate-900 mt-1">{caseId}</p>
              <span className="text-[10px] text-teal-600 font-semibold mt-1 inline-block">
                {incident?.is_demo ? '[SIMULATED DEMO]' : '[REAL YOLOv8]'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <p className="text-slate-400 text-[11px]">Assigned Ambulance</p>
              <p className="text-sm font-bold text-[#0D9488] mt-1">{ambulance.id}</p>
              <p className="text-[11px] text-slate-500 mt-1 truncate">{ambulance.callsign}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <p className="text-slate-400 text-[11px]">Incident Location</p>
              <p className="text-sm font-bold text-slate-900 mt-1 truncate">
                {incident?.location || 'NH-24 West Approach (Sector 5 Corridor)'}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Single Junction Corridor</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <p className="text-slate-400 text-[11px]">Severity Classification</p>
              <p className="text-sm font-bold text-red-600 mt-1">
                {incident?.severity || 'HIGH'}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Vehicles: {(incident?.vehicles_involved || ['car', 'truck']).join(', ')}
              </p>
            </div>
          </div>

          {/* Acknowledgement Status Callout */}
          <div className="p-4 rounded-xl bg-teal-50/60 border border-teal-200 text-xs font-mono flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <UserCheck className="w-5 h-5 text-[#0F766E]" />
              <div>
                <p className="font-bold text-slate-800">
                  Hospital Case Acknowledgement
                </p>
                <p className="text-slate-500 text-[11px]">
                  {isAcknowledged 
                    ? `Acknowledged at ${hospital.acknowledged_at} by ${hospital.acknowledged_by || 'ED Triage Lead'}`
                    : 'Awaiting triage acknowledgment to confirm trauma team readiness.'}
                </p>
              </div>
            </div>

            <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
              isAcknowledged ? 'bg-teal-600 text-white shadow-sm' : 'bg-amber-100 text-amber-900'
            }`}>
              {isAcknowledged ? 'ACKNOWLEDGED' : 'ACTION REQUIRED'}
            </span>
          </div>

          {/* Valid State Transition Actions */}
          <div className="pt-2 flex flex-wrap items-center justify-end gap-3 font-mono text-xs">
            
            {/* Action 1: Acknowledge Case */}
            <button
              onClick={handleAcknowledge}
              disabled={isActing || isAcknowledged || !hasActiveCase}
              className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm ${
                isAcknowledged
                  ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                  : 'bg-[#0D9488] hover:bg-[#0F766E] text-white shadow-md active:scale-95'
              } disabled:opacity-50`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isAcknowledged ? 'Case Already Acknowledged' : 'Acknowledge Case'}</span>
            </button>

            {/* Action 2: Mark Arrived */}
            <button
              onClick={handleMarkArrived}
              disabled={isActing || isArrivalConfirmed || !isAmbulanceAtHospital}
              className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm ${
                isArrivalConfirmed
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 cursor-not-allowed'
                  : isAmbulanceAtHospital
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md cursor-pointer active:scale-95'
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
                  : (isAmbulanceAtHospital ? 'Mark Arrived' : 'Mark Arrived (Ambulance En Route)')}
              </span>
            </button>

          </div>

          {!isAmbulanceAtHospital && !isArrivalConfirmed && (
            <p className="text-[11px] font-mono text-slate-400 text-right">
              * "Mark Arrived" action unlocks automatically when the ambulance reaches the hospital campus.
            </p>
          )}

        </section>

      </main>

      {/* 4. Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-3 px-4 text-center text-xs font-mono text-slate-500">
        Apex Emergency Care Hospital Intake Simulation • Part of A.E.R.O.S. Automated Response Architecture
      </footer>

    </div>
  );
};
