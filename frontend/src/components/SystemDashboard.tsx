import React from 'react';
import { TopBar } from './TopBar';
import { IncidentPanel } from './IncidentPanel';
import { SingleJunctionMap } from './SingleJunctionMap';
import { TacticalStatusPanel } from './TacticalStatusPanel';
import { FooterDisclaimer } from './FooterDisclaimer';

export const SystemDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#08111F] text-[#F1F5F9] flex flex-col font-sans selection:bg-[#38BDF8]/20 selection:text-[#38BDF8]">
      
      {/* Tactical Top HUD Bar */}
      <TopBar />

      {/* Main Grid: Left (Accident AI & CCTV), Center (Single 4-Way Junction Prototype Twin), Right (4-Signal Controller & Telemetry) */}
      <main className="flex-1 p-3 lg:p-4 max-w-[1920px] w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* LEFT COLUMN: Accident Detection Panel & Location Card */}
        <section className="lg:col-span-3 flex flex-col gap-4">
          <IncidentPanel />
        </section>

        {/* CENTER COLUMN: The Single 4-Way Junction & Ambulance Movement (Main Visual Focus) */}
        <section className="lg:col-span-6 flex flex-col">
          <div className="flex-1 min-h-[520px]">
            <SingleJunctionMap />
          </div>
        </section>

        {/* RIGHT COLUMN: 4-Way Signal Unit Controller, IoT Telemetry, and Timeline */}
        <section className="lg:col-span-3 flex flex-col gap-4">
          <TacticalStatusPanel />
        </section>

      </main>

      {/* Verification Notice & Safety Disclaimer */}
      <FooterDisclaimer />

    </div>
  );
};
