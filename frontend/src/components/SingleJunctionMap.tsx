import React from 'react';
import { 
  ShieldCheck, 
  Radio 
} from 'lucide-react';
import { useAeros } from '../context/AerosContext';

type SignalColor = 'GREEN' | 'AMBER' | 'RED' | 'CYCLE';

export const SingleJunctionMap: React.FC = () => {
  const { 
    incident, 
    ambulance, 
    junction,
    hospital
  } = useAeros();

  // Progress is 0 to 100
  const progress = Math.min(Math.max(ambulance.progress || 0, 0), 100);

  // =========================================================================
  // AMBULANCE KINEMATICS & ROUTE COMPUTATION
  // Sequence:
  // 1. Starts from upper side of WEST approach (X=110, Y=270).
  // 2. Travels horizontally from LEFT to RIGHT through central junction (X=450, Y=270).
  // 3. Continues along EAST road toward and past hospital (X=720, Y=270).
  // 4. Reaches U-turn entry beyond hospital (X=860, Y=270).
  // 5. Executes smooth rounded U-turn loop (semicircle R=40 from Y=270 to Y=350).
  // 6. Returns toward junction from EAST side on lower lane (X=860 down to X=680, Y=350).
  // =========================================================================

  // Route breakdown & proportions:
  // Leg 1: Outbound Eastbound (X: 110 -> 860, Y: 270, Angle: 0°) => Length = 750 px
  // Leg 2: U-Turn Loop (Arc R=40 from Y=270 to Y=350 around center (860, 310)) => Length = PI * 40 ≈ 125.7 px
  // Leg 3: Return Westbound along lower lane (X: 860 -> 680, Y: 350, Angle: 180°) => Length = 180 px
  // Total distance ≈ 1055.7 px
  const T1 = 0.710; // Fraction when reaching U-turn start (progress = 71%)
  const T2 = 0.830; // Fraction when completing U-turn exit (progress = 83%)

  const p = progress / 100;

  let ambX = 110;
  let ambY = 270;
  let ambAngle = 0; // heading angle in degrees (0 = East, 90 = South, 180 = West)

  if (p <= T1) {
    const fraction = p / T1;
    ambX = 110 + (860 - 110) * fraction;
    ambY = 270;
    ambAngle = 0;
  } else if (p <= T2) {
    const fraction = (p - T1) / (T2 - T1); // 0 to 1
    // Semicircle arc: theta from -PI/2 (top lane Y=270) to +PI/2 (bottom lane Y=350)
    const theta = -Math.PI / 2 + fraction * Math.PI;
    const R = 40;
    ambX = 860 + R * Math.cos(theta);
    ambY = 310 + R * Math.sin(theta);
    // Heading smoothly turns from 0° (facing East) to 180° (facing West)
    ambAngle = fraction * 180;
  } else {
    const fraction = (p - T2) / (1 - T2); // 0 to 1
    ambX = 860 - (860 - 680) * fraction;
    ambY = 350;
    ambAngle = 180;
  }

  // Simulation status flags
  const isCorridorGreen = junction.ambulance_signal === 'GREEN';
  const isCrossRed = junction.conflicting_signal === 'RED';
  
  // Active crossing window inside central junction box [370, 530]
  const isCrossing = ambulance.status === 'CROSSING' || (progress >= 38 && progress <= 58);

  // Exact arrival check: ONLY when simulation reaches defined arrival condition or progress >= 98
  const isArrived = ambulance.status === 'ARRIVED' || progress >= 98;

  // 4 Signal Units:
  // TL-01: WEST approach (Ambulance inbound corridor)
  // TL-02: EAST approach (East traffic approach / return corridor)
  // TL-03: NORTH approach (Cross traffic)
  // TL-04: SOUTH approach (Cross traffic)
  const westSignalColor: SignalColor = isCorridorGreen 
    ? 'GREEN' 
    : (junction.ambulance_signal === 'RED' ? 'RED' : (junction.ambulance_signal === 'AMBER' ? 'AMBER' : 'CYCLE'));

  const eastSignalColor: SignalColor = isCorridorGreen 
    ? 'GREEN' 
    : (junction.ambulance_signal === 'RED' ? 'RED' : (junction.ambulance_signal === 'AMBER' ? 'AMBER' : 'CYCLE'));

  const northSignalColor: SignalColor = isCrossRed 
    ? 'RED' 
    : (junction.conflicting_signal === 'AMBER' ? 'AMBER' : 'CYCLE');

  const southSignalColor: SignalColor = isCrossRed 
    ? 'RED' 
    : (junction.conflicting_signal === 'AMBER' ? 'AMBER' : 'CYCLE');

  return (
    <div className="bg-white rounded-2xl p-3.5 lg:p-4 flex flex-col h-full border border-[#E3EEE8] relative overflow-hidden select-none shadow-sm">
      
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-100 gap-2 z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#DDF7EA] border border-[#A7F3D0] flex items-center justify-center">
            <Radio className="w-3.5 h-3.5 text-[#38BDF8] animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-wider font-bold tracking-tight text-slate-800">
                Physical Prototype Digital Twin
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#DDF7EA] text-[#065F46] border border-[#A7F3D0] font-bold">
                1 JUNCTION • 4 SIGNALS • U-TURN CORRIDOR
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              Central 4-Way Intersection (J-01) • West → East Corridor → U-Turn Return
            </p>
          </div>
        </div>

        {/* Safety Interlock Pill */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-mono text-emerald-800 shadow-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
          <span className="font-semibold">CONFLICTING GREENS INTERLOCKED (FAIL-SAFE)</span>
        </div>
      </div>

      {/* Main SVG Vector Canvas */}
      <div className="relative flex-1 min-h-[500px] lg:min-h-[540px] bg-[#0A111E] rounded-xl overflow-hidden mt-3 border border-slate-800 flex items-center justify-center shadow-inner">
        
        {/* Soft Ambient Radial Lighting */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_rgba(56,189,248,0.06)_0%,_transparent_70%)]" />

        <svg 
          viewBox="0 0 1000 620" 
          className="w-full h-full"
        >
          <defs>
            {/* Glow Filters */}
            <filter id="glow-cyan" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="glow-red" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="7" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="glow-green" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="7" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="glow-amber" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Asphalt Gradients */}
            <linearGradient id="horizontal-road" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0B1626" />
              <stop offset="35%" stopColor="#122238" />
              <stop offset="70%" stopColor="#122238" />
              <stop offset="100%" stopColor="#0B1626" />
            </linearGradient>

            <linearGradient id="vertical-road" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0B1626" />
              <stop offset="50%" stopColor="#122238" />
              <stop offset="100%" stopColor="#0B1626" />
            </linearGradient>

            {/* Emergency Corridor Green Flow Pattern */}
            <linearGradient id="corridor-flow-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#22C55E" stopOpacity="0.12" />
              <stop offset="50%" stopColor="#22C55E" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.15" />
            </linearGradient>

            {/* Island Gradient */}
            <radialGradient id="island-grad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#162A45" />
              <stop offset="85%" stopColor="#0D192B" />
              <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.3" />
            </radialGradient>
          </defs>

          {/* ============================================================= */}
          {/* 1. TERRAIN & 4-WAY ROAD NETWORK */}
          {/* ============================================================= */}

          {/* North-South Conflicting Cross-Road (Approaches: North & South) */}
          {/* X: 370 to 530, Width = 160 */}
          <rect 
            x="370" y="20" width="160" height="580" 
            fill="url(#vertical-road)" 
            stroke="rgba(255,255,255,0.08)" 
            strokeWidth="2" 
            rx="6" 
          />

          {/* North-South Yellow Divider Centerline */}
          <line x1="450" y1="20" x2="450" y2="230" stroke="#F59E0B" strokeWidth="2.5" strokeDasharray="10 8" opacity="0.6" />
          <line x1="450" y1="390" x2="450" y2="600" stroke="#F59E0B" strokeWidth="2.5" strokeDasharray="10 8" opacity="0.6" />

          {/* North-South Lane Guidelines (White Dashes) */}
          <line x1="410" y1="20" x2="410" y2="230" stroke="#64748B" strokeWidth="1.5" strokeDasharray="6 10" opacity="0.3" />
          <line x1="490" y1="20" x2="490" y2="230" stroke="#64748B" strokeWidth="1.5" strokeDasharray="6 10" opacity="0.3" />
          <line x1="410" y1="390" x2="410" y2="600" stroke="#64748B" strokeWidth="1.5" strokeDasharray="6 10" opacity="0.3" />
          <line x1="490" y1="390" x2="490" y2="600" stroke="#64748B" strokeWidth="1.5" strokeDasharray="6 10" opacity="0.3" />

          {/* West-East Main Emergency Highway */}
          {/* X: 20 to 860, Y: 230 to 390, Height = 160 */}
          <rect 
            x="20" y="230" width="840" height="160" 
            fill="url(#horizontal-road)" 
            stroke="rgba(56,189,248,0.25)" 
            strokeWidth="2" 
            rx="6" 
          />

          {/* ============================================================= */}
          {/* U-TURN ROAD LOOP (PHYSICAL EXTENSION BEYOND HOSPITAL) */}
          {/* Smooth rounded turnaround pavement from Y=230 to Y=390, arcing to X=945 */}
          {/* ============================================================= */}
          <path 
            d="M 855 230 L 865 230 A 80 80 0 0 1 865 390 L 855 390 Z" 
            fill="#122238" 
            stroke="rgba(56,189,248,0.3)" 
            strokeWidth="2" 
          />

          {/* U-Turn Center Median Island (prevents head-on traffic, directs U-turn) */}
          <rect 
            x="852" y="300" width="20" height="20" 
            rx="10" 
            fill="url(#island-grad)" 
            stroke="#F59E0B" 
            strokeWidth="1.5" 
            opacity="0.8" 
          />
          <circle cx="862" cy="310" r="14" fill="#0D192B" stroke="#38BDF8" strokeWidth="1.5" />
          <path d="M 858 306 L 866 310 L 858 314" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />

          {/* Priority Corridor Flow Zone (Active during Priority Green) */}
          {isCorridorGreen && (
            <g>
              {/* Outbound upper lane glow */}
              <rect 
                x="20" y="230" width="840" height="80" 
                fill="url(#corridor-flow-grad)" 
              />
              {/* U-turn arc flow glow */}
              <path 
                d="M 860 230 A 80 80 0 0 1 860 390 L 860 310 Z" 
                fill="#22C55E" 
                fillOpacity="0.15" 
              />
              {/* Return lower lane glow */}
              <rect 
                x="650" y="310" width="210" height="80" 
                fill="url(#corridor-flow-grad)" 
              />
            </g>
          )}

          {/* West-East Yellow Divider Centerline */}
          <line x1="20" y1="310" x2="370" y2="310" stroke="#F59E0B" strokeWidth="2.5" strokeDasharray="12 8" opacity="0.7" />
          <line x1="530" y1="310" x2="852" y2="310" stroke="#F59E0B" strokeWidth="2.5" strokeDasharray="12 8" opacity="0.7" />

          {/* West-East Lane Guidelines (Cyan Dashes for Corridor) */}
          <line x1="20" y1="270" x2="370" y2="270" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="8 8" opacity="0.4" />
          <line x1="20" y1="350" x2="370" y2="350" stroke="#64748B" strokeWidth="1.5" strokeDasharray="8 8" opacity="0.4" />
          <line x1="530" y1="270" x2="860" y2="270" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="8 8" opacity="0.4" />
          <line x1="530" y1="350" x2="860" y2="350" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="8 8" opacity="0.4" />

          {/* U-Turn Lane Arc Center Guideline */}
          <path 
            d="M 860 270 A 40 40 0 0 1 860 350" 
            fill="none" 
            stroke="#38BDF8" 
            strokeWidth="2" 
            strokeDasharray="6 6" 
            opacity="0.6" 
          />

          {/* ============================================================= */}
          {/* 2. THE ONE CENTRAL 4-WAY INTERSECTION BOX */}
          {/* ============================================================= */}
          <rect 
            x="370" y="230" width="160" height="160" 
            fill="#142640" 
            stroke="#38BDF8" 
            strokeWidth="2" 
            strokeOpacity="0.6" 
          />

          {/* Intersection Center Halo (Expands when crossing) */}
          <circle 
            cx="450" cy="310" 
            r={isCrossing ? "72" : "54"} 
            fill={isCorridorGreen ? "#22C55E" : "#38BDF8"} 
            fillOpacity={isCrossing ? "0.22" : "0.08"} 
            stroke={isCorridorGreen ? "#22C55E" : "#38BDF8"} 
            strokeWidth="2" 
            strokeDasharray="6 4"
            className={isCrossing ? "animate-pulse" : ""}
          />

          {/* Diagonal Yellow Hazard Hatching in Intersection Corners */}
          <path d="M 375 235 L 395 235 L 375 255 Z" fill="#F59E0B" opacity="0.3" />
          <path d="M 525 235 L 505 235 L 525 255 Z" fill="#F59E0B" opacity="0.3" />
          <path d="M 375 385 L 395 385 L 375 365 Z" fill="#F59E0B" opacity="0.3" />
          <path d="M 525 385 L 505 385 L 525 365 Z" fill="#F59E0B" opacity="0.3" />

          {/* Central Junction Badge */}
          <rect 
            x="365" y="296" width="170" height="28" 
            rx="6" 
            fill="rgba(8,17,31,0.95)" 
            stroke={isCorridorGreen ? "#22C55E" : "#38BDF8"} 
            strokeWidth="1.5" 
          />
          <text 
            x="450" y="314" 
            fill="#FFFFFF" 
            fontSize="10" 
            fontFamily="monospace" 
            fontWeight="bold" 
            textAnchor="middle" 
            letterSpacing="1"
          >
            4-WAY JUNCTION (J-01)
          </text>

          {/* Pedestrian Crosswalks (Zebra Crossings on all 4 approaches) */}
          {/* West Zebra */}
          <g stroke="rgba(255,255,255,0.3)" strokeWidth="5">
            <line x1="356" y1="236" x2="356" y2="384" strokeDasharray="8 8" />
            <line x1="364" y1="236" x2="364" y2="384" strokeDasharray="8 8" />
          </g>
          {/* East Zebra */}
          <g stroke="rgba(255,255,255,0.3)" strokeWidth="5">
            <line x1="536" y1="236" x2="536" y2="384" strokeDasharray="8 8" />
            <line x1="544" y1="236" x2="544" y2="384" strokeDasharray="8 8" />
          </g>
          {/* North Zebra */}
          <g stroke="rgba(255,255,255,0.3)" strokeWidth="5">
            <line x1="376" y1="216" x2="524" y2="216" strokeDasharray="8 8" />
            <line x1="376" y1="224" x2="524" y2="224" strokeDasharray="8 8" />
          </g>
          {/* South Zebra */}
          <g stroke="rgba(255,255,255,0.3)" strokeWidth="5">
            <line x1="376" y1="396" x2="524" y2="396" strokeDasharray="8 8" />
            <line x1="376" y1="404" x2="524" y2="404" strokeDasharray="8 8" />
          </g>

          {/* Stop Lines on all 4 Approaches */}
          {/* West Stop Line (Turns Green when Priority corridor active) */}
          <line 
            x1="348" y1="230" x2="348" y2="390" 
            stroke={isCorridorGreen ? "#22C55E" : "#94A3B8"} 
            strokeWidth={isCorridorGreen ? "5" : "3"} 
            filter={isCorridorGreen ? "url(#glow-green)" : ""}
          />
          {/* East Stop Line */}
          <line 
            x1="552" y1="230" x2="552" y2="390" 
            stroke={isCorridorGreen ? "#22C55E" : "#94A3B8"} 
            strokeWidth={isCorridorGreen ? "5" : "3"} 
            filter={isCorridorGreen ? "url(#glow-green)" : ""}
          />
          {/* North Stop Line (Glows Red when Conflicting Cross Traffic is held) */}
          <line 
            x1="370" y1="208" x2="530" y2="208" 
            stroke={isCrossRed ? "#FF4D5A" : "#94A3B8"} 
            strokeWidth={isCrossRed ? "5" : "3"} 
            filter={isCrossRed ? "url(#glow-red)" : ""}
          />
          {/* South Stop Line (Glows Red when Conflicting Cross Traffic is held) */}
          <line 
            x1="370" y1="412" x2="530" y2="412" 
            stroke={isCrossRed ? "#FF4D5A" : "#94A3B8"} 
            strokeWidth={isCrossRed ? "5" : "3"} 
            filter={isCrossRed ? "url(#glow-red)" : ""}
          />

          {/* Conflicting Vehicles Waiting at North and South Stop Lines */}
          {/* North Waiting Vehicles (Southbound lane, held at Red) */}
          <g transform="translate(410, 140)">
            <rect x="-14" y="-22" width="28" height="44" rx="5" fill="#1E293B" stroke="#475569" strokeWidth="1.5" />
            <rect x="-10" y="-12" width="20" height="12" rx="2" fill="#334155" />
            {/* Brake lights glowing red when held at red signal */}
            <circle cx="-9" cy="20" r="2.5" fill={isCrossRed ? "#FF4D5A" : "#64748B"} filter={isCrossRed ? "url(#glow-red)" : ""} />
            <circle cx="9" cy="20" r="2.5" fill={isCrossRed ? "#FF4D5A" : "#64748B"} filter={isCrossRed ? "url(#glow-red)" : ""} />
          </g>
          <g transform="translate(410, 80)">
            <rect x="-13" y="-20" width="26" height="40" rx="4" fill="#334155" stroke="#64748B" strokeWidth="1.5" />
            <circle cx="-8" cy="18" r="2" fill={isCrossRed ? "#FF4D5A" : "#64748B"} />
            <circle cx="8" cy="18" r="2" fill={isCrossRed ? "#FF4D5A" : "#64748B"} />
          </g>

          {/* South Waiting Vehicles (Northbound lane, held at Red) */}
          <g transform="translate(490, 470)">
            <rect x="-14" y="-24" width="28" height="48" rx="5" fill="#1E293B" stroke="#475569" strokeWidth="1.5" />
            <rect x="-10" y="-8" width="20" height="14" rx="2" fill="#334155" />
            {/* Front headlights facing junction */}
            <circle cx="-9" cy="-22" r="2" fill="#FEF08A" opacity="0.7" />
            <circle cx="9" cy="-22" r="2" fill="#FEF08A" opacity="0.7" />
          </g>
          <g transform="translate(490, 530)">
            <rect x="-13" y="-20" width="26" height="40" rx="4" fill="#334155" stroke="#64748B" strokeWidth="1.5" />
            <circle cx="-8" cy="-18" r="2" fill="#FEF08A" opacity="0.7" />
            <circle cx="8" cy="-18" r="2" fill="#FEF08A" opacity="0.7" />
          </g>

          {/* ============================================================= */}
          {/* 3. ROAD DIRECTION ARROWS (HIGH-CONTRAST & CLEAR MARKINGS) */}
          {/* ============================================================= */}

          {/* NORTH APPROACH: Two-way traffic arrows */}
          {/* Left lane (Southbound into junction): ▼ */}
          <g fill="#94A3B8" opacity="0.8">
            <path d="M 410 185 L 404 175 L 416 175 Z" />
            <line x1="410" y1="175" x2="410" y2="165" stroke="#94A3B8" strokeWidth="2.5" />
          </g>
          {/* Right lane (Northbound out of junction): ▲ */}
          <g fill="#94A3B8" opacity="0.8">
            <path d="M 490 165 L 484 175 L 496 175 Z" />
            <line x1="490" y1="175" x2="490" y2="185" stroke="#94A3B8" strokeWidth="2.5" />
            <path d="M 490 95 L 484 105 L 496 105 Z" />
            <line x1="490" y1="105" x2="490" y2="115" stroke="#94A3B8" strokeWidth="2.5" />
          </g>

          {/* SOUTH APPROACH: Two-way traffic arrows */}
          {/* Left lane (Southbound departing junction): ▼ */}
          <g fill="#94A3B8" opacity="0.8">
            <path d="M 410 445 L 404 435 L 416 435 Z" />
            <line x1="410" y1="435" x2="410" y2="425" stroke="#94A3B8" strokeWidth="2.5" />
            <path d="M 410 520 L 404 510 L 416 510 Z" />
            <line x1="410" y1="510" x2="410" y2="500" stroke="#94A3B8" strokeWidth="2.5" />
          </g>
          {/* Right lane (Northbound approaching junction): ▲ */}
          <g fill="#94A3B8" opacity="0.8">
            <path d="M 490 425 L 484 435 L 496 435 Z" />
            <line x1="490" y1="435" x2="490" y2="445" stroke="#94A3B8" strokeWidth="2.5" />
          </g>

          {/* WEST APPROACH: Upper side = Ambulance Outbound Route (► Cyan/Green) */}
          <g fill={isCorridorGreen ? "#22C55E" : "#38BDF8"} filter="url(#glow-cyan)">
            {/* Arrow 1: Near accident site */}
            <path d="M 210 270 L 196 264 L 196 276 Z" />
            <line x1="196" y1="270" x2="182" y2="270" stroke={isCorridorGreen ? "#22C55E" : "#38BDF8"} strokeWidth="3" />
            {/* Arrow 2: Before junction */}
            <path d="M 315 270 L 301 264 L 301 276 Z" />
            <line x1="301" y1="270" x2="287" y2="270" stroke={isCorridorGreen ? "#22C55E" : "#38BDF8"} strokeWidth="3" />
          </g>
          {/* West approach: Lower side = Normal Westbound departing traffic (◄ Slate) */}
          <g fill="#64748B" opacity="0.6">
            <path d="M 190 350 L 202 344 L 202 356 Z" />
            <line x1="202" y1="350" x2="216" y2="350" stroke="#64748B" strokeWidth="2.5" />
          </g>

          {/* EAST ROAD: Upper side = Ambulance Outbound toward Hospital (► Cyan/Green) */}
          <g fill={isCorridorGreen ? "#22C55E" : "#38BDF8"} filter="url(#glow-cyan)">
            {/* Arrow 1: Just past junction */}
            <path d="M 590 270 L 576 264 L 576 276 Z" />
            <line x1="576" y1="270" x2="562" y2="270" stroke={isCorridorGreen ? "#22C55E" : "#38BDF8"} strokeWidth="3" />
            {/* Arrow 2: Passing Hospital */}
            <path d="M 700 270 L 686 264 L 686 276 Z" />
            <line x1="686" y1="270" x2="672" y2="270" stroke={isCorridorGreen ? "#22C55E" : "#38BDF8"} strokeWidth="3" />
            {/* Arrow 3: Approaching U-Turn */}
            <path d="M 810 270 L 796 264 L 796 276 Z" />
            <line x1="796" y1="270" x2="782" y2="270" stroke={isCorridorGreen ? "#22C55E" : "#38BDF8"} strokeWidth="3" />
          </g>

          {/* U-TURN SECTION: Curved direction arrows along turnaround loop (↷) */}
          <g fill="#22C55E" stroke="#22C55E" filter="url(#glow-green)">
            {/* Turn entry curve arrow */}
            <path d="M 888 274 A 32 32 0 0 1 902 300" fill="none" strokeWidth="3" strokeLinecap="round" />
            <path d="M 903 303 L 897 294 L 907 296 Z" fill="#22C55E" />

            {/* Turn apex downwards arrow */}
            <path d="M 905 315 A 32 32 0 0 1 890 346" fill="none" strokeWidth="3" strokeLinecap="round" />
            <path d="M 887 348 L 893 340 L 897 348 Z" fill="#22C55E" />
          </g>

          {/* U-Turn Badge Pill above the loop */}
          <g transform="translate(895, 215)">
            <rect x="-42" y="-12" width="84" height="20" rx="4" fill="rgba(8,17,31,0.92)" stroke="#22C55E" strokeWidth="1" />
            <text x="0" y="1" fill="#22C55E" fontSize="8.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
              U-TURN LOOP ↷
            </text>
          </g>

          {/* EAST ROAD: Lower side = Ambulance Inbound / Return Route (◄ Cyan/Green) */}
          <g fill={isCorridorGreen ? "#22C55E" : "#38BDF8"} filter="url(#glow-cyan)">
            {/* Return Arrow 1: Just after U-Turn */}
            <path d="M 810 350 L 824 344 L 824 356 Z" />
            <line x1="824" y1="350" x2="838" y2="350" stroke={isCorridorGreen ? "#22C55E" : "#38BDF8"} strokeWidth="3" />
            {/* Return Arrow 2: Past Hospital trauma bay */}
            <path d="M 700 350 L 714 344 L 714 356 Z" />
            <line x1="714" y1="350" x2="728" y2="350" stroke={isCorridorGreen ? "#22C55E" : "#38BDF8"} strokeWidth="3" />
            {/* Return Arrow 3: Heading toward junction stop line */}
            <path d="M 590 350 L 604 344 L 604 356 Z" />
            <line x1="604" y1="350" x2="618" y2="350" stroke={isCorridorGreen ? "#22C55E" : "#38BDF8"} strokeWidth="3" />
          </g>

          {/* Sector Approach Direction & Text Labels */}
          <text x="450" y="45" fill="rgba(148, 163, 184, 0.7)" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle" letterSpacing="1.5">
            ▲ NORTH APPROACH (SECTOR 4)
          </text>
          <text x="450" y="595" fill="rgba(148, 163, 184, 0.7)" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle" letterSpacing="1.5">
            ▼ SOUTH APPROACH (SECTOR 6)
          </text>
          <text x="180" y="380" fill="rgba(56, 189, 248, 0.85)" fontSize="9.5" fontFamily="monospace" fontWeight="bold" letterSpacing="1">
            ► WEST APPROACH (EMERGENCY CORRIDOR)
          </text>
          <text x="640" y="380" fill="rgba(34, 197, 94, 0.85)" fontSize="9.5" fontFamily="monospace" fontWeight="bold" letterSpacing="1">
            ◄ EAST RETURN (HOSPITAL BLVD)
          </text>

          {/* ============================================================= */}
          {/* 4. EXACTLY FOUR TRAFFIC SIGNAL UNITS (PHYSICAL SIGNAL HEADS) */}
          {/* ============================================================= */}

          {/* SIGNAL UNIT 1: WEST APPROACH (TL-01) */}
          {/* Positioned on OUTER SIDE (top side of West road), before central intersection */}
          <g transform="translate(285, 155)">
            {/* Mounting Pole down to West road curb */}
            <line x1="0" y1="42" x2="0" y2="75" stroke="#475569" strokeWidth="3" />
            <circle cx="0" cy="75" r="3" fill="#64748B" />
            
            {/* Signal Housing */}
            <rect x="-15" y="-14" width="30" height="70" rx="6" fill="#0A1322" stroke="#475569" strokeWidth="1.5" />
            
            {/* Red Light */}
            <circle cx="0" cy="-1" r="7.5" fill={westSignalColor === 'RED' ? "#FF4D5A" : "#381418"} filter={westSignalColor === 'RED' ? "url(#glow-red)" : ""} />
            {/* Amber Light */}
            <circle cx="0" cy="21" r="7.5" fill={westSignalColor === 'AMBER' || westSignalColor === 'CYCLE' ? "#F59E0B" : "#352408"} filter={westSignalColor === 'AMBER' ? "url(#glow-amber)" : ""} />
            {/* Green Light */}
            <circle cx="0" cy="43" r="7.5" fill={westSignalColor === 'GREEN' ? "#22C55E" : "#092B16"} filter={westSignalColor === 'GREEN' ? "url(#glow-green)" : ""} />

            {/* Signal Label Badge */}
            <rect x="-55" y="-38" width="110" height="20" rx="4" fill="rgba(8,17,31,0.95)" stroke={westSignalColor === 'GREEN' ? "#22C55E" : "#38BDF8"} strokeWidth="1.2" />
            <text x="0" y="-25" fill={westSignalColor === 'GREEN' ? "#22C55E" : "#E2E8F0"} fontSize="8.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
              TL-01: WEST [{westSignalColor === 'GREEN' ? 'PRIORITY' : 'CYCLE'}]
            </text>
          </g>

          {/* SIGNAL UNIT 2: EAST APPROACH (TL-02) */}
          {/* Positioned on OUTER SIDE (bottom side of East road), beside approach and before intersection */}
          <g transform="translate(620, 465)">
            {/* Mounting Pole up to East road curb */}
            <line x1="0" y1="-14" x2="0" y2="-75" stroke="#475569" strokeWidth="3" />
            <circle cx="0" cy="-75" r="3" fill="#64748B" />
            
            {/* Signal Housing */}
            <rect x="-15" y="-14" width="30" height="70" rx="6" fill="#0A1322" stroke="#475569" strokeWidth="1.5" />
            
            {/* Red Light */}
            <circle cx="0" cy="-1" r="7.5" fill={eastSignalColor === 'RED' ? "#FF4D5A" : "#381418"} filter={eastSignalColor === 'RED' ? "url(#glow-red)" : ""} />
            {/* Amber Light */}
            <circle cx="0" cy="21" r="7.5" fill={eastSignalColor === 'AMBER' || eastSignalColor === 'CYCLE' ? "#F59E0B" : "#352408"} filter={eastSignalColor === 'AMBER' ? "url(#glow-amber)" : ""} />
            {/* Green Light */}
            <circle cx="0" cy="43" r="7.5" fill={eastSignalColor === 'GREEN' ? "#22C55E" : "#092B16"} filter={eastSignalColor === 'GREEN' ? "url(#glow-green)" : ""} />

            {/* Signal Label Badge */}
            <rect x="-55" y="60" width="110" height="20" rx="4" fill="rgba(8,17,31,0.95)" stroke={eastSignalColor === 'GREEN' ? "#22C55E" : "#38BDF8"} strokeWidth="1.2" />
            <text x="0" y="73" fill={eastSignalColor === 'GREEN' ? "#22C55E" : "#E2E8F0"} fontSize="8.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
              TL-02: EAST [{eastSignalColor === 'GREEN' ? 'PRIORITY' : 'CYCLE'}]
            </text>
          </g>

          {/* SIGNAL UNIT 3: NORTH APPROACH (TL-03) */}
          {/* Positioned on OUTER SIDE (left side of North road), beside approach and before intersection */}
          <g transform="translate(295, 85)">
            {/* Mast Arm connecting right to North road curb */}
            <line x1="15" y1="21" x2="75" y2="21" stroke="#475569" strokeWidth="3" />
            <circle cx="75" cy="21" r="3" fill="#64748B" />

            {/* Signal Housing */}
            <rect x="-15" y="-14" width="30" height="70" rx="6" fill="#0A1322" stroke={northSignalColor === 'RED' ? "#FF4D5A" : "#475569"} strokeWidth="1.5" />
            
            {/* Red Light */}
            <circle cx="0" cy="-1" r="7.5" fill={northSignalColor === 'RED' ? "#FF4D5A" : "#381418"} filter={northSignalColor === 'RED' ? "url(#glow-red)" : ""} />
            {/* Amber Light */}
            <circle cx="0" cy="21" r="7.5" fill={northSignalColor === 'AMBER' ? "#F59E0B" : "#352408"} filter={northSignalColor === 'AMBER' ? "url(#glow-amber)" : ""} />
            {/* Green Light */}
            <circle cx="0" cy="43" r="7.5" fill={northSignalColor === 'CYCLE' ? "#22C55E" : "#092B16"} />

            {/* Signal Label Badge */}
            <rect x="-60" y="-38" width="120" height="20" rx="4" fill="rgba(8,17,31,0.95)" stroke={northSignalColor === 'RED' ? "#FF4D5A" : "#94A3B8"} strokeWidth="1.2" />
            <text x="0" y="-25" fill={northSignalColor === 'RED' ? "#FF4D5A" : "#E2E8F0"} fontSize="8.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
              TL-03: NORTH [{northSignalColor === 'RED' ? 'HELD RED' : 'CYCLE'}]
            </text>
          </g>

          {/* SIGNAL UNIT 4: SOUTH APPROACH (TL-04) */}
          {/* Positioned on OUTER SIDE (right side of South road), beside approach and before intersection */}
          <g transform="translate(605, 535)">
            {/* Mast Arm connecting left to South road curb */}
            <line x1="-15" y1="21" x2="-75" y2="21" stroke="#475569" strokeWidth="3" />
            <circle cx="-75" cy="21" r="3" fill="#64748B" />

            {/* Signal Housing */}
            <rect x="-15" y="-14" width="30" height="70" rx="6" fill="#0A1322" stroke={southSignalColor === 'RED' ? "#FF4D5A" : "#475569"} strokeWidth="1.5" />
            
            {/* Red Light */}
            <circle cx="0" cy="-1" r="7.5" fill={southSignalColor === 'RED' ? "#FF4D5A" : "#381418"} filter={southSignalColor === 'RED' ? "url(#glow-red)" : ""} />
            {/* Amber Light */}
            <circle cx="0" cy="21" r="7.5" fill={southSignalColor === 'AMBER' ? "#F59E0B" : "#352408"} filter={southSignalColor === 'AMBER' ? "url(#glow-amber)" : ""} />
            {/* Green Light */}
            <circle cx="0" cy="43" r="7.5" fill={southSignalColor === 'CYCLE' ? "#22C55E" : "#092B16"} />

            {/* Signal Label Badge */}
            <rect x="-60" y="60" width="120" height="20" rx="4" fill="rgba(8,17,31,0.95)" stroke={southSignalColor === 'RED' ? "#FF4D5A" : "#94A3B8"} strokeWidth="1.2" />
            <text x="0" y="73" fill={southSignalColor === 'RED' ? "#FF4D5A" : "#E2E8F0"} fontSize="8.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
              TL-04: SOUTH [{southSignalColor === 'RED' ? 'HELD RED' : 'CYCLE'}]
            </text>
          </g>

          {/* ============================================================= */}
          {/* 5. EXACTLY ONE ACCIDENT LOCATION (UPPER SIDE OF WEST APPROACH) */}
          {/* ============================================================= */}
          <g transform="translate(110, 270)">
            {incident ? (
              <g>
                {/* Emergency Sonar Waves */}
                <circle r="44" fill="none" stroke="#FF4D5A" strokeWidth="2.5" opacity="0.5" className="animate-ping" />
                <circle r="28" fill="#FF4D5A" fillOpacity="0.22" stroke="#FF4D5A" strokeWidth="2" filter="url(#glow-red)" />
                <circle r="12" fill="#FF4D5A" />

                {/* Crash Silhouette / Crosshair */}
                <line x1="-16" y1="0" x2="16" y2="0" stroke="#FFFFFF" strokeWidth="2" />
                <line x1="0" y1="-16" x2="0" y2="16" stroke="#FFFFFF" strokeWidth="2" />

                {/* Hazard Icon / Symbol */}
                <polygon points="0,-9 8,5 -8,5" fill="#F59E0B" />
                <text x="0" y="3" fill="#000000" fontSize="6.5" fontWeight="bold" textAnchor="middle">!</text>

                {/* Tactical Tag Card Above Crash */}
                <rect x="-70" y="-62" width="140" height="32" rx="5" fill="rgba(30,10,18,0.95)" stroke="#FF4D5A" strokeWidth="1.5" />
                <text x="0" y="-48" fill="#FF4D5A" fontSize="9" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                  ⚠ COLLISION: {incident.id}
                </text>
                <text x="0" y="-36" fill="#FFFFFF" fontSize="7.5" fontFamily="monospace" textAnchor="middle">
                  WEST UPPER APPROACH • [{incident.severity}]
                </text>
              </g>
            ) : (
              <g opacity="0.5">
                <circle r="20" fill="#0C1524" stroke="#475569" strokeWidth="1.5" strokeDasharray="4 4" />
                <text x="0" y="3" fill="#64748B" fontSize="8.5" fontFamily="monospace" textAnchor="middle">STANDBY</text>
                <text x="0" y="32" fill="#64748B" fontSize="7.5" fontFamily="monospace" textAnchor="middle">WEST SECTOR</text>
              </g>
            )}
          </g>

          {/* ============================================================= */}
          {/* 6. EXACTLY ONE DESTINATION HOSPITAL (EAST ROAD BEFORE U-TURN) */}
          {/* Positioned at X=720, Y=135 beside East road, before U-turn (X=860) */}
          {/* ============================================================= */}
          <g transform="translate(720, 135)">
            {/* Hospital Building Base / Campus */}
            <rect 
              x="-60" y="-55" width="120" height="85" 
              rx="10" 
              fill="#0F1F36" 
              stroke={isArrived ? "#22C55E" : "#38BDF8"} 
              strokeWidth="2.5" 
              filter={isArrived ? "url(#glow-green)" : "url(#glow-cyan)"} 
            />

            {/* Emergency Driveway & Trauma Intake Gate connecting to East Road */}
            <path 
              d="M -30 30 L -30 95 L 30 95 L 30 30 Z" 
              fill="#13233C" 
              stroke={isArrived ? "#22C55E" : "#38BDF8"} 
              strokeWidth="1.5" 
              strokeDasharray="4 4" 
              opacity="0.7" 
            />

            {/* Emergency Medical Cross */}
            <rect x="-8" y="-36" width="16" height="42" fill={isArrived ? "#22C55E" : "#38BDF8"} rx="3" />
            <rect x="-21" y="-23" width="42" height="16" fill={isArrived ? "#22C55E" : "#38BDF8"} rx="3" />

            {/* Arrival Beacon Wave */}
            {isArrived && (
              <circle r="52" fill="none" stroke="#22C55E" strokeWidth="3" className="animate-ping" />
            )}

            {/* Helipad / Triage Drop-Off Marker */}
            <circle cx="0" cy="-15" r="14" fill="rgba(8,17,31,0.8)" stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="3 3" />
            <text x="0" y="-11" fill="#FFFFFF" fontSize="9.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">H</text>

            {/* Hospital Label Card */}
            <rect 
              x="-85" y="38" width="170" height="32" 
              rx="6" 
              fill="rgba(8,17,31,0.96)" 
              stroke={isArrived ? "#22C55E" : "#38BDF8"} 
              strokeWidth="1.5" 
            />
            <text x="0" y="51" fill={isArrived ? "#22C55E" : "#FFFFFF"} fontSize="9" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
              {hospital.name || "APEX EMERGENCY & TRAUMA"}
            </text>
            <text x="0" y="63" fill={isArrived ? "#22C55E" : "#94A3B8"} fontSize="7.5" fontFamily="monospace" textAnchor="middle">
              {isArrived ? "✓ AMBULANCE ARRIVED AT BAY" : "DESTINATION HOSPITAL (EAST ROAD)"}
            </text>
          </g>

          {/* ============================================================= */}
          {/* 7. EXACTLY ONE AMBULANCE TRAVELING ON PHYSICAL ROUTE */}
          {/* West -> Junction -> East road -> Past Hospital -> U-turn -> Return */}
          {/* ============================================================= */}
          <g transform={`translate(${ambX}, ${ambY})`}>
            
            {/* Vehicle body rotates with movement angle (smooth turning) */}
            <g transform={`rotate(${ambAngle})`}>
              
              {/* Forward Headlight Beam on Road */}
              <polygon 
                points="22,-14 75,-30 75,30 22,14" 
                fill="#FEF08A" 
                fillOpacity={isCorridorGreen ? "0.22" : "0.08"} 
              />

              {/* Siren Wave Aura */}
              <circle 
                r="28" 
                fill="#38BDF8" 
                fillOpacity={isCrossing ? "0.45" : "0.2"} 
                stroke="#38BDF8" 
                strokeWidth="2" 
                className="animate-ping" 
              />

              {/* Ambulance Vehicle Body */}
              <rect 
                x="-24" y="-15" 
                width="48" height="30" 
                rx="6" 
                fill="#0B172B" 
                stroke="#FFFFFF" 
                strokeWidth="2" 
                filter="url(#glow-cyan)" 
              />

              {/* Front Windshield Cab Window */}
              <rect x="9" y="-11" width="11" height="22" rx="3" fill="#38BDF8" fillOpacity="0.85" />

              {/* Red Cross Symbol on Roof */}
              <rect x="-8" y="-3" width="12" height="6" fill="#FF4D5A" />
              <rect x="-5" y="-6" width="6" height="12" fill="#FF4D5A" />

              {/* Dual Emergency Strobes (Alternating Cyan & Red) */}
              <circle cx="3" cy="-13" r="3.5" fill="#38BDF8" className="animate-pulse" />
              <circle cx="-3" cy="-13" r="3.5" fill="#FF4D5A" className="animate-pulse" />

              {/* Forward Direction Vector Arrow */}
              <path d="M 26 0 L 33 -4 L 33 4 Z" fill="#22C55E" />
            </g>

            {/* Floating Telemetry Badge (Stays upright regardless of vehicle angle) */}
            <g transform="translate(0, -32)">
              <rect 
                x="-48" y="-11" width="96" height="20" 
                rx="4" 
                fill="rgba(8,17,31,0.96)" 
                stroke={isCorridorGreen ? "#22C55E" : "#38BDF8"} 
                strokeWidth="1.2" 
              />
              <text x="0" y="3" fill="#FFFFFF" fontSize="8.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                {ambulance.id} • {Math.round(progress)}%
              </text>
            </g>
          </g>

        </svg>

        {/* Tactical HUD Overlay (Bottom Status Bar) */}
        <div className="absolute bottom-3 inset-x-3 p-3 rounded-xl bg-[#08111F]/95 backdrop-blur-md border border-slate-800 text-[11px] font-mono flex flex-wrap items-center justify-between gap-3 z-20">
          
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Junction State:</span>
            <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
              isCorridorGreen ? 'bg-emerald-500/20 text-[#10B981] border border-[#22C55E]/40' : 'bg-slate-800 text-slate-300'
            }`}>
              {junction.state_label}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-400">Ambulance Transit:</span>
            <div className="w-36 bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700">
              <div 
                className="bg-gradient-to-r from-[#38BDF8] to-[#22C55E] h-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-white font-bold">{Math.round(progress)}%</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Corridor Phase:</span>
            <span className="text-[#38BDF8] font-bold">
              {progress < 15 
                ? 'Phase 1: Accident Site (West Approach Upper)' 
                : progress < 38 
                ? 'Phase 2: Approaching J-01 (TL-01 West Priority)' 
                : progress < 58 
                ? 'Phase 3: Crossing Central Intersection (Priority Green)' 
                : progress < 72 
                ? 'Phase 4: East Road & Passing Apex Hospital' 
                : progress < 83 
                ? 'Phase 5: Smooth U-Turn Beyond Hospital' 
                : progress < 98 
                ? 'Phase 6: Returning Toward Junction (East Approach)' 
                : 'Phase 7: Ambulance Arrived at Trauma Bay'}
            </span>
          </div>

        </div>

      </div>

    </div>
  );
};
