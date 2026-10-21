import React from 'react';
import { LiveRoadFeedCard } from './LiveRoadFeedCard';
import { SingleJunctionMap } from './SingleJunctionMap';
import { TrafficSignalStatusCard } from './TrafficSignalStatusCard';

export const JunctionDashboardView: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 w-full flex-1 min-h-0 h-full pb-1">
      {/* 1. Live Road Feed Card (Left, 4 cols) */}
      <div className="lg:col-span-4 xl:col-span-4 h-full flex flex-col min-h-0">
        <LiveRoadFeedCard />
      </div>

      {/* 2. Junction Map Digital Twin Card (Center, 5 cols) */}
      <div className="lg:col-span-5 xl:col-span-5 h-full flex flex-col min-h-0">
        <SingleJunctionMap />
      </div>

      {/* 3. Traffic Signal Status Card (Right, 3 cols) */}
      <div className="lg:col-span-3 xl:col-span-3 h-full flex flex-col min-h-0">
        <TrafficSignalStatusCard />
      </div>
    </div>
  );
};
