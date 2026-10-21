import React, { useState, useEffect } from 'react';
import { 
  Home, 
  Building2, 
  Settings, 
  FileText, 
  Calendar, 
  MapPin
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { JunctionDashboardView } from './JunctionDashboardView';
import { HospitalDashboardView } from './HospitalDashboardView';
import { SystemStatusView } from './SystemStatusView';
import { EventLogView } from './EventLogView';
import { useAeros } from '../context/AerosContext';

type TabType = 'junction' | 'hospital' | 'system' | 'events';

export const MainLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { backendConnected } = useAeros();

  // Determine active tab based on URL route
  const getTabFromPath = (path: string): TabType => {
    if (path.includes('/hospital')) return 'hospital';
    if (path.includes('/status')) return 'system';
    if (path.includes('/events')) return 'events';
    return 'junction';
  };

  const [activeTab, setActiveTab] = useState<TabType>(getTabFromPath(location.pathname));

  useEffect(() => {
    setActiveTab(getTabFromPath(location.pathname));
  }, [location.pathname]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    switch (tab) {
      case 'junction': navigate('/system'); break;
      case 'hospital': navigate('/hospital'); break;
      case 'system': navigate('/status'); break;
      case 'events': navigate('/events'); break;
    }
  };

  // Live Clock & Date matching reference image
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setCurrentDate(now.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Header Titles and Icons matching reference image
  const getHeaderInfo = () => {
    switch (activeTab) {
      case 'hospital':
        return {
          icon: <Building2 className="w-5 h-5 text-[#00A86B]" />,
          title: 'Hospital Dashboard',
          subtitle: 'Incoming ambulance and patient readiness'
        };
      case 'system':
        return {
          icon: <Settings className="w-5 h-5 text-[#00A86B]" />,
          title: 'System Status',
          subtitle: 'Neural vision, camera feeds, and traffic controller telemetry'
        };
      case 'events':
        return {
          icon: <FileText className="w-5 h-5 text-[#00A86B]" />,
          title: 'Event Log',
          subtitle: 'Chronological emergency corridor and collision audit log'
        };
      case 'junction':
      default:
        return {
          icon: <MapPin className="w-5 h-5 text-[#00A86B]" />,
          title: 'Junction Dashboard',
          subtitle: 'Real-time accident detection and emergency signal control'
        };
    }
  };

  const headerInfo = getHeaderInfo();

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-[#F0F7F4] flex flex-col lg:flex-row font-sans text-slate-800 antialiased selection:bg-[#00A86B]/20 selection:text-[#065F46]">
      
      {/* ================================================================= */}
      {/* 1. LEFT SIDEBAR PANEL (Matches the dark pine panel in the image) */}
      {/* ================================================================= */}
      <aside className="w-full lg:w-64 bg-[#081713] text-white flex flex-col shrink-0 border-r border-[#132A23] p-4 lg:py-6 lg:px-4 z-30 lg:h-screen lg:overflow-y-auto">
        
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2 mb-8">
          {/* Neon ECG Pulse Waveform Icon */}
          <div className="w-9 h-9 rounded-xl bg-[#0F2D25] border border-[#00E676]/30 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(0,230,118,0.2)]">
            <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-[#00E676] fill-none stroke-[2.2] stroke-linecap-round stroke-linejoin-round">
              <path d="M 2 12 L 6 12 L 9 5 L 13 19 L 16 9 L 19 12 L 22 12" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-extrabold tracking-wider text-white">
                A.E.R.O.S.
              </h1>
            </div>
            <p className="text-[9.5px] text-[#719284] leading-tight font-medium mt-0.5 line-clamp-2">
              Automated Emergency Response & Optimization Network
            </p>
          </div>
        </div>

        {/* Navigation Buttons (4 items exactly matching the image) */}
        <nav className="flex-1 flex flex-col gap-1.5">
          
          {/* Nav Item 1: Junction Dashboard */}
          <button
            onClick={() => handleTabChange('junction')}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'junction'
                ? 'bg-[#00966A] text-white shadow-[0_4px_16px_rgba(0,150,106,0.35)]'
                : 'text-[#8EA89C] hover:text-white hover:bg-[#10271F]'
            }`}
          >
            <Home className="w-4 h-4 shrink-0" />
            <span className="tracking-wide">Junction Dashboard</span>
          </button>

          {/* Nav Item 2: Hospital Dashboard */}
          <button
            onClick={() => handleTabChange('hospital')}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'hospital'
                ? 'bg-[#00966A] text-white shadow-[0_4px_16px_rgba(0,150,106,0.35)]'
                : 'text-[#8EA89C] hover:text-white hover:bg-[#10271F]'
            }`}
          >
            <Building2 className="w-4 h-4 shrink-0" />
            <span className="tracking-wide">Hospital Dashboard</span>
          </button>

          {/* Nav Item 3: System Status */}
          <button
            onClick={() => handleTabChange('system')}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'system'
                ? 'bg-[#00966A] text-white shadow-[0_4px_16px_rgba(0,150,106,0.35)]'
                : 'text-[#8EA89C] hover:text-white hover:bg-[#10271F]'
            }`}
          >
            <Settings className="w-4 h-4 shrink-0" />
            <span className="tracking-wide">System Status</span>
          </button>

          {/* Nav Item 4: Event Log */}
          <button
            onClick={() => handleTabChange('events')}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'events'
                ? 'bg-[#00966A] text-white shadow-[0_4px_16px_rgba(0,150,106,0.35)]'
                : 'text-[#8EA89C] hover:text-white hover:bg-[#10271F]'
            }`}
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span className="tracking-wide">Event Log</span>
          </button>

        </nav>

        {/* Sidebar Footer info */}
        <div className="pt-4 border-t border-[#132A23] text-[10px] text-[#5C796E] font-mono px-2">
          <span>A.E.R.O.S. v2.0 • Active Node</span>
        </div>

      </aside>

      {/* ================================================================= */}
      {/* 2. MAIN VIEW AREA (With Top Header Bar & Dashboard Content) */}
      {/* ================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen lg:h-screen lg:overflow-hidden">
        
        {/* Top Header Bar matching reference image */}
        <header className="sticky top-0 z-20 shrink-0 bg-white/95 backdrop-blur-md border-b border-[#E3EEE8] px-5 lg:px-8 py-3 shadow-xs">
          <div className="max-w-[1920px] mx-auto flex flex-wrap items-center justify-between gap-4">
            
            {/* Left: Green Icon Badge + Title + Subtitle */}
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#E6F4EA] flex items-center justify-center shrink-0">
                {headerInfo.icon}
              </div>
              <div>
                <h1 className="text-lg lg:text-xl font-extrabold text-slate-800 tracking-tight">
                  {headerInfo.title}
                </h1>
                <p className="text-xs text-slate-400 font-medium hidden sm:block">
                  {headerInfo.subtitle}
                </p>
              </div>
            </div>

            {/* Right: Status Pill + Date/Clock + Profile Avatar */}
            <div className="flex items-center gap-4 lg:gap-6">
              
              {/* Status Pill: "● System Online" */}
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#EBFBF3] border border-[#A7F3D0] text-xs font-semibold text-[#065F46] shadow-xs">
                <span className={`w-2 h-2 rounded-full ${backendConnected ? 'bg-[#00A86B] animate-pulse' : 'bg-amber-400'}`} />
                <span>System Online</span>
              </div>

              {/* Date & Time with Calendar Icon (matches image) */}
              <div className="hidden md:flex items-center gap-2 text-xs font-mono text-slate-600">
                <Calendar className="w-4 h-4 text-slate-400" />
                <div className="flex flex-col text-right">
                  <span className="font-bold text-slate-800 text-[11px]">{currentDate}</span>
                  <span className="text-[10px] text-slate-400">{currentTime}</span>
                </div>
              </div>

              {/* Avatar Profile Badge: Circle 'A' + A.E.R.O.S. Control System */}
              <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
                <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700">
                  A
                </div>
                <div className="hidden xl:block text-left">
                  <p className="text-xs font-extrabold text-slate-800 leading-tight">A.E.R.O.S.</p>
                  <p className="text-[10px] text-slate-400 font-medium">Control System</p>
                </div>
              </div>

            </div>

          </div>
        </header>

        {/* Main Content Body */}
        <main className="flex-1 p-3.5 lg:p-4 max-w-[1920px] w-full mx-auto flex flex-col overflow-y-auto min-h-0">
          {activeTab === 'junction' && <JunctionDashboardView />}
          {activeTab === 'hospital' && <HospitalDashboardView />}
          {activeTab === 'system' && <SystemStatusView />}
          {activeTab === 'events' && <EventLogView />}
        </main>

      </div>

    </div>
  );
};
