import React from 'react';
import { TopBar } from './TopBar';
import { IncidentPanel } from './IncidentPanel';
import { SingleJunctionMap } from './SingleJunctionMap';
import { TacticalStatusPanel } from './TacticalStatusPanel';
import { FooterDisclaimer } from './FooterDisclaimer';

export const SystemDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F5FBF8] text-[#1F2937] flex flex-col font-sans selection:bg-[#10B981]/20 selection:text-[#065F46]">
      
      {/* Top Navigation & Command Bar */}
      <TopBar />

      {/* Main Grid: Left (Accident AI & CCTV), Center (4-Way Junction Digital Twin), Right (4-Signal Controller & Telemetry) */}
      <main className="flex-1 p-3 lg:p-5 max-w-[1920px] w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* LEFT COLUMN: Accident Detection Panel & Location Card */}
        <section className="lg:col-span-3 flex flex-col gap-4">
          <IncidentPanel />
        </section>

        {/* CENTER COLUMN: The Single 4-Way Junction & Ambulance Movement (Main Visual Focus) */}
        <section className="lg:col-span-6 flex flex-col">
          <div className="flex-1 min-h-[540px]">
            <SingleJunctionMap />
          </div>
        </section>

        {/* RIGHT COLUMN: 4-Way Signal Unit Controller, IoT Telemetry, and Timeline */}
        <section className="lg:col-span-3 flex flex-col gap-4">
          <TacticalStatusPanel />
        </section>

      </main>

      {/* Safety Notice & Status Footer */}
      <FooterDisclaimer />

    </div>
  );
};
