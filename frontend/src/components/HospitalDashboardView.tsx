import React, { useState } from 'react';
import { 
  Truck, 
  Heart, 
  Thermometer, 
  Droplets, 
  Building2, 
  CheckCircle2, 
  Activity, 
  Send,
  ShieldCheck
} from 'lucide-react';
import { useAeros } from '../context/AerosContext';

export const HospitalDashboardView: React.FC = () => {
  const { 
    hospital, 
    ambulance, 
    vitals, 
    prioritySwitchOn,
    updatePatientVitals,
    acknowledgeHospitalCase,
    markHospitalArrived
  } = useAeros();

  const [customBpm, setCustomBpm] = useState<string>('');
  const [showBpmInput, setShowBpmInput] = useState<boolean>(false);
  const [isUpdatingVitals, setIsUpdatingVitals] = useState<boolean>(false);

  const progress = ambulance.progress || 0;
  const isEnRoute = progress > 0 && progress < 85;
  const isArriving = progress >= 85 && progress < 98;
  const isAtHospital = ambulance.status === 'RETURNED_TO_HOSPITAL' || hospital.arrival_status === 'ARRIVED' || progress >= 98;
  const isAcknowledged = hospital.case_acknowledged;

  const handleUpdateBpm = async (e: React.FormEvent) => {
    e.preventDefault();
    const bpmNum = parseInt(customBpm, 10);
    if (isNaN(bpmNum) || bpmNum < 30 || bpmNum > 240) {
      alert('Please enter a valid BPM between 30 and 240');
      return;
    }
    setIsUpdatingVitals(true);
    try {
      await updatePatientVitals({ heart_rate: bpmNum });
      setShowBpmInput(false);
      setCustomBpm('');
    } finally {
      setIsUpdatingVitals(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 w-full select-none">
      
      {/* ================================================================= */}
      {/* 1. CARD: INCOMING AMBULANCE (Left, 4 cols) */}
      {/* ================================================================= */}
      <div className="lg:col-span-4 flex flex-col bg-white rounded-2xl p-4 lg:p-5 border border-[#E3EEE8] shadow-xs">
        
        {/* Header: Red Ambulance icon + "Incoming Ambulance" + "● LIVE" */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800 tracking-tight">
                Incoming Ambulance
              </h2>
              <p className="text-[10px] text-slate-400 font-mono">
                Unit {ambulance.id} • Real-time Telemetry
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#00A86B] text-white text-[10px] font-bold tracking-wide shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span>LIVE</span>
          </div>
        </div>

        {/* Ambulance Visual Container matching reference image */}
        <div className="relative flex-1 min-h-[220px] rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center shadow-inner group">
          {/* Realistic High-Res Ambulance Visual */}
          <div 
            className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1587745416684-47953f16f02f?auto=format&fit=crop&w=800&q=80')`,
              backgroundColor: '#1E293B'
            }}
          >
            {/* Fallback & Atmospheric Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-600 text-white uppercase tracking-wider">
                    {ambulance.status.replace(/_/g, ' ')}
                  </span>
                  <p className="text-xs font-bold font-sans mt-1 text-slate-100">
                    {ambulance.callsign}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping" />
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stepper matching reference image (En Route -> Arriving -> At Hospital) */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="relative flex items-center justify-between px-3">
            {/* Connecting Bar */}
            <div className="absolute left-6 right-6 top-2 h-0.5 bg-slate-200 -z-0">
              <div 
                className="h-full bg-[#00A86B] transition-all duration-500"
                style={{
                  width: isAtHospital ? '100%' : (isArriving ? '50%' : (isEnRoute ? '20%' : '0%'))
                }}
              />
            </div>

            {/* Step 1: En Route */}
            <div className="flex flex-col items-center z-10">
              <div className={`w-4 h-4 rounded-full flex items-center justify-center border-2 ${
                isEnRoute || isArriving || isAtHospital
                  ? 'bg-white border-[#00A86B] ring-2 ring-[#00A86B]/20'
                  : 'bg-white border-slate-300'
              }`}>
                {(isEnRoute || isArriving || isAtHospital) && (
                  <div className="w-1.5 h-1.5 rounded-full bg-[#00A86B]" />
                )}
              </div>
              <span className={`text-[11px] mt-1.5 font-medium ${
                isEnRoute ? 'font-bold text-[#00A86B]' : 'text-slate-500'
              }`}>
                En Route
              </span>
            </div>

            {/* Step 2: Arriving */}
            <div className="flex flex-col items-center z-10">
              <div className={`w-4 h-4 rounded-full flex items-center justify-center border-2 ${
                isArriving || isAtHospital
                  ? 'bg-white border-[#00A86B] ring-2 ring-[#00A86B]/20'
                  : 'bg-white border-slate-300'
              }`}>
                {(isArriving || isAtHospital) && (
                  <div className="w-1.5 h-1.5 rounded-full bg-[#00A86B]" />
                )}
              </div>
              <span className={`text-[11px] mt-1.5 font-medium ${
                isArriving ? 'font-bold text-[#00A86B]' : 'text-slate-500'
              }`}>
                Arriving
              </span>
            </div>

            {/* Step 3: At Hospital */}
            <div className="flex flex-col items-center z-10">
              <div className={`w-4 h-4 rounded-full flex items-center justify-center border-2 ${
                isAtHospital
                  ? 'bg-[#00A86B] border-[#00A86B] ring-2 ring-[#00A86B]/20'
                  : 'bg-white border-slate-300'
              }`}>
                {isAtHospital && (
                  <CheckCircle2 className="w-3 h-3 text-white" />
                )}
              </div>
              <span className={`text-[11px] mt-1.5 font-medium ${
                isAtHospital ? 'font-bold text-[#00A86B]' : 'text-slate-500'
              }`}>
                At Hospital
              </span>
            </div>

          </div>
        </div>

        {/* Real-time Status Panel: Current Phase on line above, Priority Mode on last line */}
        <div className="mt-4 pt-2.5 border-t border-slate-100 flex flex-col gap-1.5 px-3 py-2 bg-slate-50/90 rounded-xl border border-[#E3EEE8] text-xs font-mono">
          {/* Line 1 (Above): Current Phase update */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-slate-400 shrink-0 font-medium">Current Phase:</span>
            <span className="font-bold text-[#00966a] truncate">
              {ambulance.status === 'STANDBY' 
                ? 'Standby at Hospital (Bottom-Right)' 
                : ambulance.status.replace(/_/g, ' ')}
            </span>
          </div>

          {/* Line 2 (Last Line, Below): Priority Mode */}
          <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60">
            <ShieldCheck className="w-3.5 h-3.5 text-[#00966a] shrink-0" />
            <span className="text-slate-600 text-[11px] font-semibold">
              {(prioritySwitchOn ?? true) ? 'Priority Mode Active' : 'Priority Mode OFF'}
            </span>
          </div>
        </div>

      </div>

      {/* ================================================================= */}
      {/* 2. CARD: PATIENT VITALS (Center, 4.5 cols) */}
      {/* Handles BPM through API endpoint as requested by user */}
      {/* ================================================================= */}
      <div className="lg:col-span-5 flex flex-col bg-white rounded-2xl p-4 lg:p-5 border border-[#E3EEE8] shadow-xs">
        
        {/* Header: Heart icon + "Patient Vitals" */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500">
              <Heart className="w-4 h-4 fill-current animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800 tracking-tight">
                Patient Vitals
              </h2>
              <p className="text-[10px] text-slate-400 font-mono">
                Tele-ICU Live Stream
              </p>
            </div>
          </div>

          {/* Quick Endpoint Trigger Pill */}
          <button
            onClick={() => setShowBpmInput(!showBpmInput)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-mono font-bold transition-colors cursor-pointer"
            title="Update Heart Rate BPM via API Endpoint"
          >
            <Activity className="w-3 h-3 text-[#00A86B]" />
            <span>API: /api/hospital/vitals</span>
          </button>
        </div>

        {/* Optional Test Input Modal/Drawer to supply BPM via API */}
        {showBpmInput && (
          <form onSubmit={handleUpdateBpm} className="mb-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2">
            <span className="text-xs font-mono text-slate-600">New BPM:</span>
            <input
              type="number"
              min="30"
              max="240"
              placeholder="e.g. 84"
              value={customBpm}
              onChange={(e) => setCustomBpm(e.target.value)}
              className="w-20 px-2 py-1 rounded bg-white border border-slate-300 text-xs font-bold font-mono outline-none focus:border-[#00A86B]"
              autoFocus
            />
            <button
              type="submit"
              disabled={isUpdatingVitals}
              className="px-2.5 py-1 rounded bg-[#00A86B] hover:bg-[#008c58] text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Send className="w-3 h-3" />
              <span>{isUpdatingVitals ? 'Sending...' : 'POST'}</span>
            </button>
          </form>
        )}

        {/* 3 Sub-Cards Grid matching reference image */}
        <div className="grid grid-cols-3 gap-3 flex-1">
          
          {/* Subcard 1: Heart Rate */}
          <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 flex flex-col justify-between">
            <div>
              <div className="w-7 h-7 rounded-lg bg-red-100/70 flex items-center justify-center text-red-500 mb-2">
                <Heart className="w-3.5 h-3.5 fill-current" />
              </div>
              <p className="text-[11px] font-medium text-slate-500">Heart Rate</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl lg:text-3xl font-extrabold text-slate-800">
                  {vitals.heart_rate}
                </span>
                <span className="text-xs text-slate-400 font-mono">bpm</span>
              </div>
            </div>

            {/* Animated Green Mini ECG Waveform (matching reference image) */}
            <div className="mt-3 pt-2 border-t border-slate-200/60">
              <svg viewBox="0 0 100 24" className="w-full h-6 stroke-[#00A86B] fill-none stroke-[2] stroke-linecap-round stroke-linejoin-round">
                <path d="M 0 12 L 20 12 L 25 5 L 30 19 L 35 3 L 40 21 L 45 12 L 65 12 L 70 6 L 75 18 L 80 12 L 100 12" />
              </svg>
            </div>
          </div>

          {/* Subcard 2: Temperature */}
          <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 flex flex-col justify-between">
            <div>
              <div className="w-7 h-7 rounded-lg bg-blue-100/70 flex items-center justify-center text-blue-500 mb-2">
                <Thermometer className="w-3.5 h-3.5" />
              </div>
              <p className="text-[11px] font-medium text-slate-500">Temperature</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl lg:text-3xl font-extrabold text-slate-800">
                  {vitals.temperature}
                </span>
                <span className="text-xs text-slate-400 font-mono">°C</span>
              </div>
            </div>

            {/* Animated Blue Mini Sparkline (matching reference image) */}
            <div className="mt-3 pt-2 border-t border-slate-200/60">
              <svg viewBox="0 0 100 24" className="w-full h-6 stroke-[#0284C7] fill-none stroke-[2] stroke-linecap-round stroke-linejoin-round">
                <path d="M 0 14 Q 25 8 50 14 T 100 12" />
              </svg>
            </div>
          </div>

          {/* Subcard 3: SpO2 */}
          <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 flex flex-col justify-between">
            <div>
              <div className="w-7 h-7 rounded-lg bg-cyan-100/70 flex items-center justify-center text-cyan-600 mb-2">
                <Droplets className="w-3.5 h-3.5 fill-current" />
              </div>
              <p className="text-[11px] font-medium text-slate-500">SpO2</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl lg:text-3xl font-extrabold text-slate-800">
                  {vitals.spo2}
                </span>
                <span className="text-xs text-slate-400 font-mono">%</span>
              </div>
            </div>

            {/* Animated Blue Mini Waveform (matching reference image) */}
            <div className="mt-3 pt-2 border-t border-slate-200/60">
              <svg viewBox="0 0 100 24" className="w-full h-6 stroke-[#0284C7] fill-none stroke-[2] stroke-linecap-round stroke-linejoin-round">
                <path d="M 0 12 L 20 12 Q 35 2 50 14 T 80 10 L 100 12" />
              </svg>
            </div>
          </div>

        </div>

      </div>

      {/* ================================================================= */}
      {/* 3. CARD: HOSPITAL READINESS (Right, 3 cols) */}
      {/* ================================================================= */}
      <div className="lg:col-span-3 flex flex-col bg-white rounded-2xl p-4 lg:p-5 border border-[#E3EEE8] shadow-xs">
        
        {/* Header: Teal Hospital icon + "Hospital Readiness" */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#E6F4EA] flex items-center justify-center text-[#0F9D58]">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800 tracking-tight">
                Hospital Readiness
              </h2>
              <p className="text-[10px] text-slate-400 font-mono">
                Trauma Bay Capacity
              </p>
            </div>
          </div>
        </div>

        {/* Circular Donut Gauge matching reference image */}
        <div className="flex-1 flex flex-col items-center justify-center py-2">
          
          <div className="relative w-32 h-32 flex items-center justify-center">
            <svg viewBox="0 0 120 120" className="w-full h-full transform -rotate-90">
              {/* Background ring */}
              <circle
                cx="60"
                cy="60"
                r="48"
                stroke="#E2E8F0"
                strokeWidth="10"
                fill="none"
              />
              {/* Green Progress ring (80% capacity) */}
              <circle
                cx="60"
                cy="60"
                r="48"
                stroke="#00A86B"
                strokeWidth="10"
                strokeDasharray={2 * Math.PI * 48}
                strokeDashoffset={2 * Math.PI * 48 * (1 - 0.8)}
                strokeLinecap="round"
                fill="none"
                className="transition-all duration-1000"
              />
            </svg>
            {/* Center Percentage Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-extrabold text-slate-800">80%</span>
            </div>
          </div>

          <p className="text-xs font-bold text-slate-700 mt-2">Capacity Available</p>
          <p className="text-[11px] text-slate-400 font-mono mt-0.5">24 / 30 beds</p>
        </div>

        {/* Bottom Status Card: "Hospital Ready" + Emergency department prepared */}
        <div className="mt-3 p-3 rounded-xl bg-[#EBFBF3] border border-[#A7F3D0] flex items-center gap-2.5 shadow-xs">
          <div className="w-6 h-6 rounded-full bg-[#00A86B] flex items-center justify-center text-white shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#065F46]">Hospital Ready</p>
            <p className="text-[10px] text-slate-500">Emergency department prepared</p>
          </div>
        </div>

        {/* Triage Actions */}
        <div className="mt-2.5 flex items-center gap-2">
          <button
            onClick={acknowledgeHospitalCase}
            disabled={isAcknowledged}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-colors cursor-pointer text-center ${
              isAcknowledged
                ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                : 'bg-[#00966a] hover:bg-[#00875a] text-white shadow-xs'
            }`}
          >
            {isAcknowledged ? '✓ Acknowledged' : 'Acknowledge Case'}
          </button>

          <button
            onClick={markHospitalArrived}
            disabled={!isAtHospital || hospital.arrival_status === 'ARRIVED'}
            className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              hospital.arrival_status === 'ARRIVED'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 cursor-not-allowed'
                : isAtHospital
                ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
            }`}
            title={isAtHospital ? 'Confirm Patient Handover' : 'Ambulance must complete return journey to Hospital'}
          >
            Handover
          </button>
        </div>

      </div>

    </div>
  );
};
