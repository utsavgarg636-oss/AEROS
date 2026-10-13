import { useState } from 'react';
import { 
  Navigation, 
  ZoomIn, 
  ZoomOut, 
  Compass, 
  RotateCcw,
  Truck
} from 'lucide-react';
import { useAeros } from '../context/AerosContext';

export const SpatialMap: React.FC = () => {
  const {
    incident,
    ambulances,
    hospitals,
    junctions,
    ambulanceMapCoords,
    ambulanceProgress,
    roadBlocked,
  } = useAeros();

  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showCorridor, setShowCorridor] = useState<boolean>(true);
  const [showFleet, setShowFleet] = useState<boolean>(true);
  const [selectedEntity, setSelectedEntity] = useState<any | null>(null);

  // Predefined corridor waypoints
  const corridorPoints = [
    { x: 140, y: 480, label: 'Base Depot' },
    { x: 320, y: 400, label: 'Junction 1' },
    { x: 510, y: 310, label: 'Junction 2' },
    { x: 650, y: 230, label: 'Accident Site (Zone A)' },
    { x: 780, y: 180, label: 'Junction 3' },
    { x: 900, y: 140, label: 'Apex Trauma Hospital' },
  ];

  const corridorPathString = corridorPoints.map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ');

  // Active receiving hospital
  const activeHospital = hospitals.find(h => h.id === 'HOSP-APEX') || hospitals[0];

  return (
    <div className="spatial-glass rounded-2xl p-4 flex flex-col h-full border border-[#00D9FF]/20 relative overflow-hidden select-none">
      
      {/* Top Map HUD Controls */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-[#00D9FF] animate-spin-slow" />
            <h2 className="text-sm font-bold tracking-wider font-hud text-white uppercase">
              Tactical Spatial Grid — Sector 5 Emergency Corridor
            </h2>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-[#00E5B0] border border-[#00E5B0]/20 hidden sm:inline">
            PREDEFINED CORRIDOR ACTIVE
          </span>
        </div>

        {/* View Controls */}
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <button
            onClick={() => setShowCorridor(!showCorridor)}
            className={`px-2 py-1 rounded border text-[11px] flex items-center gap-1 cursor-pointer transition-colors ${
              showCorridor ? 'bg-[#00D9FF]/15 text-[#00D9FF] border-[#00D9FF]/40' : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
            title="Toggle Predefined Emergency Corridor Display"
          >
            <Navigation className="w-3 h-3" /> Corridor
          </button>

          <button
            onClick={() => setShowFleet(!showFleet)}
            className={`px-2 py-1 rounded border text-[11px] flex items-center gap-1 cursor-pointer transition-colors ${
              showFleet ? 'bg-[#00E5B0]/15 text-[#00E5B0] border-[#00E5B0]/40' : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
            title="Toggle Patrol Ambulances Display"
          >
            <Truck className="w-3 h-3" /> Patrol Fleet
          </button>

          <div className="flex items-center bg-slate-900 rounded border border-slate-800 ml-1">
            <button
              onClick={() => setZoomLevel(prev => Math.min(prev + 0.15, 1.6))}
              className="p-1 hover:text-[#00D9FF] cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] px-1 text-slate-400">{Math.round(zoomLevel * 100)}%</span>
            <button
              onClick={() => setZoomLevel(prev => Math.max(prev - 0.15, 0.85))}
              className="p-1 hover:text-[#00D9FF] cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="p-1 hover:text-[#00D9FF] cursor-pointer border-l border-slate-800"
              title="Recenter Map"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Main SVG Vector City Map Canvas */}
      <div className="relative flex-1 min-h-[460px] lg:min-h-[560px] bg-[#070B14] rounded-xl overflow-hidden mt-3 border border-slate-800/80 tactical-grid">
        
        {/* Radar Scanning Line Overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
          <div className="w-full h-1 bg-gradient-to-r from-transparent via-[#00D9FF] to-transparent animate-pulse transform translate-y-1/2"></div>
        </div>

        <svg 
          viewBox="0 0 1000 650" 
          className="w-full h-full cursor-crosshair transition-transform duration-300"
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: '50% 50%' }}
        >
          <defs>
            {/* Glowing filters */}
            <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="glow-teal" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Linear gradients for roads */}
            <linearGradient id="corridor-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00D9FF" stopOpacity="0.9" />
              <stop offset="60%" stopColor="#00E5B0" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#00D9FF" stopOpacity="1" />
            </linearGradient>
          </defs>

          {/* 1. City Base Roads & Secondary Arteries (Background Network) */}
          <g stroke="rgba(255,255,255,0.06)" strokeWidth="18" fill="none" strokeLinecap="round" strokeLinejoin="round">
            {/* Horizontal expressways */}
            <path d="M 60 520 L 940 520" />
            <path d="M 60 400 L 940 400" />
            <path d="M 60 260 L 940 260" />
            <path d="M 60 120 L 940 120" />
            {/* Vertical avenues */}
            <path d="M 140 60 L 140 580" />
            <path d="M 320 60 L 320 580" />
            <path d="M 510 60 L 510 580" />
            <path d="M 720 60 L 720 580" />
            <path d="M 880 60 L 880 580" />
            {/* Diagonal Ring Road */}
            <path d="M 140 480 L 400 200 L 750 140" />
            <path d="M 380 580 L 700 340 L 900 340" />
          </g>

          {/* Road Centerlines (Dashed Subtle Blue) */}
          <g stroke="rgba(0,217,255,0.12)" strokeWidth="1.5" strokeDasharray="6 8" fill="none">
            <path d="M 60 520 L 940 520" />
            <path d="M 60 400 L 940 400" />
            <path d="M 60 260 L 940 260" />
            <path d="M 140 60 L 140 580" />
            <path d="M 320 60 L 320 580" />
            <path d="M 510 60 L 510 580" />
            <path d="M 720 60 L 720 580" />
          </g>

          {/* Street Name Labels */}
          <g fill="rgba(148, 163, 184, 0.45)" fontSize="9" fontFamily="monospace" letterSpacing="1">
            <text x="70" y="514">EXPRESSWAY ARTERY WEST</text>
            <text x="330" y="394">CROSSWAY AVE [J1]</text>
            <text x="520" y="304">NH-24 FLYOVER CORRIDOR [J2]</text>
            <text x="730" y="172">MEDICAL CENTER PKWY [J3]</text>
            <text x="70" y="390" transform="rotate(-90 70 390)">CENTRAL DEPOT BLVD</text>
            <text x="330" y="140">SECTOR 5 RESIDENTIAL GRID</text>
          </g>

          {/* 2. Predefined Emergency Corridor Glow & Animated Flow Line */}
          {showCorridor && (
            <g>
              {/* Outer Corridor Glow */}
              <path 
                d={corridorPathString} 
                stroke="#00D9FF" 
                strokeWidth="14" 
                strokeOpacity="0.2" 
                fill="none" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                filter="url(#glow-cyan)"
              />
              {/* Core Predefined Corridor Line */}
              <path 
                d={corridorPathString} 
                stroke="url(#corridor-gradient)" 
                strokeWidth="5" 
                fill="none" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
              {/* Animated Direction Flow Pulses */}
              <path 
                d={corridorPathString} 
                stroke="#FFFFFF" 
                strokeWidth="3" 
                fill="none" 
                strokeLinecap="round" 
                className="animate-corridor"
              />

              {/* Waypoint Direction Arrows */}
              <polygon points="225,438 235,444 225,450" fill="#00D9FF" opacity="0.8" />
              <polygon points="410,352 420,358 410,364" fill="#00D9FF" opacity="0.8" />
              <polygon points="575,268 585,274 575,280" fill="#00D9FF" opacity="0.8" />
              <polygon points="710,200 720,206 710,212" fill="#00D9FF" opacity="0.8" />
              <polygon points="835,158 845,162 835,168" fill="#00D9FF" opacity="0.8" />
            </g>
          )}

          {/* 3. Central Ambulance Base Marker */}
          <g 
            transform="translate(140, 480)"
            className="cursor-pointer group"
            onClick={() => setSelectedEntity({ type: 'Base', title: 'Central Emergency Station', desc: 'Ambulance dispatch hub & paramedic headquarters' })}
          >
            <circle r="22" fill="#0B1220" stroke="#00D9FF" strokeWidth="2" filter="url(#glow-cyan)" />
            <rect x="-8" y="-8" width="16" height="16" rx="3" fill="#00D9FF" />
            <text x="0" y="4" fill="#070B14" fontSize="11" fontWeight="bold" textAnchor="middle">B</text>
            <text x="0" y="32" fill="#00D9FF" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
              BASE DEPOT
            </text>
          </g>

          {/* 4. Predefined Intersections along Corridor (J1, J2, J3) */}
          {junctions.map((j) => {
            const isPriority = j.signalState === 'Priority Green';
            const isBlocked = j.signalState === 'Road Blocked';
            return (
              <g 
                key={j.id} 
                transform={`translate(${j.coords[0]}, ${j.coords[1]})`}
                className="cursor-pointer"
                onClick={() => setSelectedEntity({ type: 'Junction', title: j.name, data: j })}
              >
                {/* Traffic light aura */}
                <circle 
                  r="18" 
                  fill={isBlocked ? '#FF4057' : (isPriority ? '#00E5B0' : '#0B1220')} 
                  fillOpacity={isPriority || isBlocked ? '0.35' : '0.9'} 
                  stroke={isBlocked ? '#FF4057' : (isPriority ? '#00E5B0' : '#475569')} 
                  strokeWidth="2" 
                  className={isPriority || isBlocked ? 'animate-ping' : ''}
                />
                <circle 
                  r="12" 
                  fill="#0B1220" 
                  stroke={isBlocked ? '#FF4057' : (isPriority ? '#00E5B0' : '#64748B')} 
                  strokeWidth="1.5" 
                />
                
                {/* Tactical mini signal dot */}
                <circle 
                  r="5" 
                  fill={isBlocked ? '#FF4057' : (isPriority ? '#00E5B0' : '#FFB547')} 
                />

                <text x="0" y="-22" fill="white" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                  {j.id}
                </text>
                <text 
                  x="0" 
                  y="26" 
                  fill={isBlocked ? '#FF4057' : (isPriority ? '#00E5B0' : '#94A3B8')} 
                  fontSize="8" 
                  fontFamily="monospace" 
                  textAnchor="middle"
                >
                  {j.signalState.toUpperCase()}
                </text>
              </g>
            );
          })}

          {/* 5. Road Blockage Marker (if simulated at J2) */}
          {roadBlocked && (
            <g transform="translate(540, 290)" className="animate-bounce">
              <polygon points="0,-18 18,14 -18,14" fill="#FF4057" stroke="#FFFFFF" strokeWidth="2" filter="url(#glow-red)" />
              <text x="0" y="8" fill="white" fontSize="14" fontWeight="bold" textAnchor="middle">!</text>
              <rect x="-45" y="18" width="90" height="18" rx="4" fill="rgba(30,10,18,0.9)" stroke="#FF4057" strokeWidth="1" />
              <text x="0" y="30" fill="#FF4057" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                ROAD BLOCKED
              </text>
            </g>
          )}

          {/* 6. Accident Location Marker (Pulsing concentric red rings) */}
          {(incident && incident.status !== 'IDLE') && (
            <g 
              transform="translate(650, 230)"
              className="cursor-pointer"
              onClick={() => setSelectedEntity({ type: 'Accident', title: 'Accident Site (Zone A)', data: incident })}
            >
              {/* Expanding Sonar Waves */}
              <circle r="36" fill="none" stroke="#FF4057" strokeWidth="1.5" opacity="0.4" className="animate-ping" />
              <circle r="24" fill="#FF4057" fillOpacity="0.25" stroke="#FF4057" strokeWidth="2" filter="url(#glow-red)" />
              <circle r="8" fill="#FF4057" />
              
              {/* Tactical crosshair */}
              <line x1="-16" y1="0" x2="16" y2="0" stroke="#FF4057" strokeWidth="1.5" />
              <line x1="0" y1="-16" x2="0" y2="16" stroke="#FF4057" strokeWidth="1.5" />

              {/* Label */}
              <rect x="-65" y="-42" width="130" height="20" rx="4" fill="rgba(30,10,18,0.92)" stroke="#FF4057" strokeWidth="1" />
              <text x="0" y="-28" fill="#FF4057" fontSize="9" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                CRASH: {incident.id} [{incident.severity}]
              </text>
            </g>
          )}

          {/* 7. Receiving Hospital Marker (Apex Trauma Center) */}
          <g 
            transform="translate(900, 140)"
            className="cursor-pointer group"
            onClick={() => setSelectedEntity({ type: 'Hospital', title: activeHospital.name, data: activeHospital })}
          >
            <circle r="24" fill="#0B1220" stroke="#00E5B0" strokeWidth="2" filter="url(#glow-teal)" />
            {/* Medical Cross Icon */}
            <rect x="-3" y="-10" width="6" height="20" fill="#00E5B0" />
            <rect x="-10" y="-3" width="20" height="6" fill="#00E5B0" />
            
            <text x="0" y="34" fill="#00E5B0" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
              APEX HOSPITAL
            </text>
            <text x="0" y="44" fill="#94A3B8" fontSize="8" fontFamily="monospace" textAnchor="middle">
              LEVEL 1 TRAUMA
            </text>
          </g>

          {/* Other Patrol Ambulances (if showFleet is true) */}
          {showFleet && ambulances.filter(a => a.id !== 'AMB-102').map((amb) => (
            <g 
              key={amb.id} 
              transform={`translate(${amb.currentCoords[0]}, ${amb.currentCoords[1]})`}
              className="cursor-pointer opacity-70 hover:opacity-100"
              onClick={() => setSelectedEntity({ type: 'Ambulance', title: amb.callsign, data: amb })}
            >
              <circle r="12" fill="#0B1220" stroke="#94A3B8" strokeWidth="1.5" />
              <circle r="4" fill="#00D9FF" />
              <text x="0" y="20" fill="#94A3B8" fontSize="8" fontFamily="monospace" textAnchor="middle">
                {amb.id} (PATROL)
              </text>
            </g>
          ))}

          {/* 8. Active Moving Ambulance Marker (AMB-102) */}
          <g 
            transform={`translate(${ambulanceMapCoords[0]}, ${ambulanceMapCoords[1]})`}
            className="cursor-pointer transition-transform duration-700 ease-out"
            onClick={() => setSelectedEntity({ type: 'Ambulance', title: 'AMB-102 (Active Unit)', data: ambulances.find(a => a.id === 'AMB-102') })}
          >
            {/* Siren Wave Aura */}
            <circle r="22" fill="#00D9FF" fillOpacity="0.3" stroke="#00D9FF" strokeWidth="1.5" className="animate-ping" />
            
            {/* Ambulance Pod */}
            <rect x="-14" y="-10" width="28" height="20" rx="4" fill="#00D9FF" stroke="#FFFFFF" strokeWidth="1.5" filter="url(#glow-cyan)" />
            {/* Red Cross */}
            <rect x="-2" y="-6" width="4" height="12" fill="#FF4057" />
            <rect x="-6" y="-2" width="12" height="4" fill="#FF4057" />
            
            {/* Floating Tag */}
            <rect x="-35" y="-28" width="70" height="15" rx="3" fill="rgba(7,11,20,0.85)" stroke="#00D9FF" strokeWidth="1" />
            <text x="0" y="-17" fill="white" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
              AMB-102 • {ambulanceProgress}%
            </text>
          </g>

        </svg>

        {/* Map Telemetry HUD Box Overlay (Bottom Left) */}
        <div className="absolute bottom-3 left-3 p-2.5 rounded-xl bg-[#0B1220]/85 backdrop-blur-md border border-slate-800 text-[11px] font-mono space-y-1.5 z-20">
          <div className="flex items-center justify-between text-slate-400 gap-4">
            <span>Corridor Sequence:</span>
            <span className="text-[#00D9FF] font-bold">Base → J1 → J2 → Site → J3 → Hosp</span>
          </div>
          <div className="flex items-center justify-between text-slate-400 gap-4">
            <span>Corridor Progress:</span>
            <div className="w-24 bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-[#00D9FF] to-[#00E5B0] h-full transition-all duration-500" 
                style={{ width: `${ambulanceProgress}%` }}
              ></div>
            </div>
            <span className="text-white font-bold">{ambulanceProgress}%</span>
          </div>
          <div className="flex items-center justify-between text-slate-400 gap-4 text-[10px]">
            <span>Next Target Node:</span>
            <span className="text-[#00E5B0] font-bold">
              {ambulanceProgress < 20 ? 'Junction 1' : ambulanceProgress < 50 ? 'Junction 2 (NH-24)' : ambulanceProgress < 70 ? 'Accident Scene' : ambulanceProgress < 90 ? 'Junction 3' : 'Apex Trauma Gate'}
            </span>
          </div>
        </div>

        {/* Tactical Entity Details Modal */}
        {selectedEntity && (
          <div className="absolute top-3 right-3 w-72 p-3 rounded-xl spatial-glass border border-[#00D9FF]/30 text-xs font-mono z-30 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-[#00D9FF] font-bold">{selectedEntity.type} Tactical Info</span>
              <button 
                onClick={() => setSelectedEntity(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>
            <p className="font-bold text-white mt-2 text-sm">{selectedEntity.title}</p>
            {selectedEntity.data ? (
              <pre className="mt-2 text-[10px] text-slate-300 overflow-x-auto bg-black/40 p-2 rounded">
                {JSON.stringify(selectedEntity.data, null, 2)}
              </pre>
            ) : (
              <p className="mt-2 text-slate-400 text-[11px]">{selectedEntity.desc}</p>
            )}
          </div>
        )}

      </div>

    </div>
  );
};
