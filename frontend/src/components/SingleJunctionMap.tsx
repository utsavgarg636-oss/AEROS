import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  ToggleLeft, 
  ToggleRight, 
  Play, 
  RotateCcw,
  Building2
} from 'lucide-react';
import { useAeros } from '../context/AerosContext';

type SignalColor = 'GREEN' | 'AMBER' | 'RED' | 'CYCLE';

export const SingleJunctionMap: React.FC = () => {
  const { 
    ambulance, 
    prioritySwitchOn, 
    togglePrioritySwitch, 
    startSimulation, 
    resetSimulation, 
    setCorridorProgress,
    isSimulating,
    isPaused
  } = useAeros();

  const [selectedJunction, setSelectedJunction] = useState('Junction 1');

  // Smooth 60fps continuous simulation progress (0 to 100)
  const [animProgress, setAnimProgress] = useState<number>(0);
  const [phaseDescription, setPhaseDescription] = useState<string>('Standby at Hospital (Bottom-Right)');
  
  // Pause counters for natural stopping at junction lights & accident scene
  const pauseRef = useRef<number>(0);
  const animFrameRef = useRef<number>(0);

  const isPriorityOn = prioritySwitchOn ?? true;
  const isPriorityRef = useRef(isPriorityOn);
  isPriorityRef.current = isPriorityOn;

  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  const setCorridorProgressRef = useRef(setCorridorProgress);
  setCorridorProgressRef.current = setCorridorProgress;

  const progressRef = useRef<number>(0);

  // Sync animation progress with simulation state
  useEffect(() => {
    if (!isSimulating) {
      progressRef.current = 0;
      setAnimProgress(0);
      setCorridorProgressRef.current(0);
      pauseRef.current = 0;
      setPhaseDescription('Standby at Hospital (Bottom-Right)');
      return;
    }

    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      if (!isPausedRef.current) {
        const prev = progressRef.current;
        let next = prev;
        const priorityActive = isPriorityRef.current;

        // -------------------------------------------------------------
        // STEP 1 & 2: Hospital -> East Stop Line (Stop at Junction)
        // -------------------------------------------------------------
        if (prev < 22) {
          setPhaseDescription(prev >= 17 ? 'Step 2: East Priority Green Active • Approaching Stop Line' : 'Step 1: Hospital → East Junction Approach');
          next = Math.min(prev + dt * 7.5, 22);
        } else if (prev >= 22 && prev < 22.05) {
          // Reached East Stop Line! Check Priority Mode
          if (!priorityActive) {
            // Priority is OFF: Hold stopped indefinitely at red signal
            setPhaseDescription('Step 2: Stopped at East Red Signal (Priority OFF)');
            next = 22;
          } else {
            // Priority is ON: Slight natural pause (~0.35s = ~22 frames)
            if (pauseRef.current < 22) {
              pauseRef.current += 1;
              setPhaseDescription('Step 2: East Green Priority Active • Crossing Junction');
              next = 22;
            } else {
              // Resume moving across junction!
              pauseRef.current = 0;
              next = 22.1;
            }
          }
        } 
        // -------------------------------------------------------------
        // STEP 3: Crossing Junction & West Road to First U-Turn
        // -------------------------------------------------------------
        else if (prev >= 22.05 && prev < 34) {
          setPhaseDescription('Step 3: Crossing Central Intersection (Priority Green)');
          next = prev + dt * 7.5;
        } else if (prev >= 34 && prev < 44) {
          setPhaseDescription('Step 3: Continuing West toward Turnaround Loop');
          next = prev + dt * 7.5;
        } else if (prev >= 44 && prev < 50) {
          setPhaseDescription('Step 3: Executing Smooth First U-Turn at West End');
          next = prev + dt * 5.0; // Smooth realistic turning speed
        } 
        // -------------------------------------------------------------
        // STEP 4: West Upper Lane to Accident Site (Stop at Scene)
        // -------------------------------------------------------------
        else if (prev >= 50 && prev < 58) {
          setPhaseDescription('Step 4: Approaching Accident Site (Upper-Left)');
          next = Math.min(prev + dt * 7.5, 58);
        } else if (prev >= 58 && prev < 58.05) {
          // Reached Accident Location! Stop and pause (~1.5s = ~90 frames)
          if (pauseRef.current < 90) {
            pauseRef.current += 1;
            setPhaseDescription('Step 4: Arrived at Accident Site • Loading Patient into ICU');
            next = 58;
          } else {
            // Patient loaded! Resume return journey
            pauseRef.current = 0;
            next = 58.1;
          }
        } 
        // -------------------------------------------------------------
        // STEP 5: Return Journey to West Stop Line -> Junction -> East U-Turn
        // -------------------------------------------------------------
        else if (prev >= 58.05 && prev < 68) {
          setPhaseDescription(prev >= 64 ? 'Step 5: West Priority Green Active • Approaching Stop Line' : 'Step 5: Return Transit toward Junction (West Approach)');
          next = Math.min(prev + dt * 7.5, 68);
        } else if (prev >= 68 && prev < 68.05) {
          // Reached West Stop Line at Junction!
          if (!priorityActive) {
            setPhaseDescription('Step 5: Stopped at West Red Signal (Priority OFF)');
            next = 68;
          } else {
            if (pauseRef.current < 22) {
              pauseRef.current += 1;
              setPhaseDescription('Step 5: West Green Priority Active • Crossing Junction');
              next = 68;
            } else {
              pauseRef.current = 0;
              next = 68.1;
            }
          }
        } else if (prev >= 68.05 && prev < 78) {
          setPhaseDescription('Step 5: Crossing Junction Eastbound with Patient');
          next = prev + dt * 7.5;
        } else if (prev >= 78 && prev < 84) {
          setPhaseDescription('Step 5: En Route to East Turnaround Loop');
          next = prev + dt * 7.5;
        } else if (prev >= 84 && prev < 90) {
          setPhaseDescription('Step 5: Executing Smooth Second U-Turn at East End');
          next = prev + dt * 5.0;
        } 
        // -------------------------------------------------------------
        // STEP 6: Hospital Arrival in Bottom-Right Corner
        // -------------------------------------------------------------
        else if (prev >= 90 && prev < 100) {
          setPhaseDescription('Step 6: Final Approach to Hospital Intake Bay');
          next = Math.min(prev + dt * 7.5, 100);
        } else {
          setPhaseDescription('Step 6: Returned to Hospital (Bottom-Right) • Patient Handover');
          next = 100;
        }

        progressRef.current = next;
        setAnimProgress(next);
        setCorridorProgressRef.current(next);
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isSimulating]);

  const p = animProgress;

  // =========================================================================
  // CONTINUOUS MATHEMATICAL KINEMATICS & TANGENT HEADING ANGLE
  // Zero teleportation, zero cutting through buildings, 100% road-following!
  // =========================================================================

  let ambX = 760;
  let ambY = 350;
  let ambAngle = 180; // Heading in degrees (0 = East, 90 = South, 180 = West, 270 = North)

  if (p <= 0.05) {
    // Initial standby: parked at Hospital in bottom-right corner (760, 350)
    ambX = 760;
    ambY = 350;
    ambAngle = 180;
  } else if (p <= 22) {
    // Step 1: Hospital to East stop line (X: 760 -> 600, Y = 350, heading 180°)
    const f = p / 22;
    ambX = 760 - (760 - 600) * f;
    ambY = 350;
    ambAngle = 180;
  } else if (p <= 44) {
    // Step 3A & 3B: Crosses junction and continues West (X: 600 -> 100, Y = 350, heading 180°)
    const f = (p - 22) / 22;
    ambX = 600 - (600 - 100) * f;
    ambY = 350;
    ambAngle = 180;
  } else if (p <= 50) {
    // Step 3C: First smooth U-Turn arc around (100, 310) with R = 40
    // Continuous rotation from 180° -> 270° -> 360° (0°)
    const u = (p - 44) / 6;
    ambX = 100 - 40 * Math.sin(u * Math.PI);
    ambY = 310 + 40 * Math.cos(u * Math.PI);
    ambAngle = 180 + u * 180;
  } else if (p <= 58) {
    // Step 4: Upper lane to Accident Site (X: 100 -> 180, Y = 270, heading 0°)
    const f = (p - 50) / 8;
    ambX = 100 + (180 - 100) * f;
    ambY = 270;
    ambAngle = 0;
  } else if (p <= 68) {
    // Step 5A: Upper lane from Accident site to West Stop Line (X: 180 -> 400, Y = 270, heading 0°)
    const f = (p - 58) / 10;
    ambX = 180 + (400 - 180) * f;
    ambY = 270;
    ambAngle = 0;
  } else if (p <= 84) {
    // Step 5B & 5C: Crossing junction Eastbound to East turnaround loop (X: 400 -> 900, Y = 270, heading 0°)
    const f = (p - 68) / 16;
    ambX = 400 + (900 - 400) * f;
    ambY = 270;
    ambAngle = 0;
  } else if (p <= 90) {
    // Step 5D: Second smooth U-Turn arc around (900, 310) with R = 40
    // Continuous rotation from 0° -> 90° -> 180°
    const u = (p - 84) / 6;
    ambX = 900 + 40 * Math.sin(u * Math.PI);
    ambY = 310 - 40 * Math.cos(u * Math.PI);
    ambAngle = u * 180;
  } else {
    // Step 6: Lower lane to Hospital bay (X: 900 -> 760, Y = 350, heading 180°)
    const f = (p - 90) / 10;
    ambX = 900 - (900 - 760) * f;
    ambY = 350;
    ambAngle = 180;
  }

  // =========================================================================
  // TRAFFIC LIGHT COORDINATION WITH MOVEMENT & PRIORITY SWITCH
  // =========================================================================
  const isCorridorActive = isSimulating && p > 0;

  // Outbound crossing window: updates IMMEDIATELY as ambulance reaches East traffic light (p >= 17 to p <= 34)
  const isOutboundCrossing = p >= 17 && p <= 34;
  // Return crossing window: updates IMMEDIATELY as ambulance reaches West traffic light (p >= 64 to p <= 78)
  const isReturnCrossing = p >= 64 && p <= 78;

  // Signal lights:
  const northSignal: SignalColor = isCorridorActive ? 'RED' : 'CYCLE';
  const southSignal: SignalColor = isCorridorActive ? 'RED' : 'CYCLE';

  const eastSignal: SignalColor = (isOutboundCrossing && isPriorityOn) 
    ? 'GREEN' 
    : (isCorridorActive ? 'RED' : 'CYCLE');

  const westSignal: SignalColor = (isReturnCrossing && isPriorityOn) 
    ? 'GREEN' 
    : (isCorridorActive ? 'RED' : 'CYCLE');

  const isReturned = p >= 99.8;
  const isAtAccident = p >= 57.8 && p <= 58.2;

  return (
    <div className="bg-white rounded-2xl p-4 lg:p-5 flex flex-col justify-between h-full border border-[#E3EEE8] shadow-xs select-none">
      
      {/* 1. Header Bar matching reference image */}
      <div>
        <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-100 gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#E6F4EA] flex items-center justify-center text-[#0F9D58]">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800 tracking-tight">
                Junction Map
              </h2>
              <p className="text-[10px] text-slate-400 font-mono">
                Central 4-Way Intersection • Real-time Corridor
              </p>
            </div>
          </div>

          {/* Junction Selector Dropdown (matches image: "Junction 1 ▾") */}
          <div className="flex items-center gap-2.5">
            <select
              value={selectedJunction}
              onChange={(e) => setSelectedJunction(e.target.value)}
              className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 outline-none cursor-pointer hover:border-slate-300 transition-colors"
            >
              <option value="Junction 1">Junction 1</option>
              <option value="Junction 2 (Standby)">Junction 2 (Standby)</option>
            </select>

            {/* Ambulance Priority Switch Toggle */}
            <button
              onClick={() => togglePrioritySwitch()}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer ${
                isPriorityOn 
                  ? 'bg-[#00966a] hover:bg-[#00875a] text-white shadow-emerald-500/20' 
                  : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
              }`}
              title="Toggle Ambulance Priority Switch"
            >
              {isPriorityOn ? (
                <>
                  <ToggleRight className="w-4 h-4" />
                  <span>Priority: ON</span>
                </>
              ) : (
                <>
                  <ToggleLeft className="w-4 h-4 text-red-500" />
                  <span>Priority: OFF</span>
                </>
              )}
            </button>

            {/* Quick Simulation Trigger */}
            {!isSimulating ? (
              <button
                onClick={startSimulation}
                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer transition-colors shadow-xs"
                title="Dispatch Ambulance from Hospital"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Dispatch</span>
              </button>
            ) : (
              <button
                onClick={resetSimulation}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition-colors"
                title="Reset Simulation"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* 2. Main Map Graphic Area (Vector Digital Twin) */}
        <div className="relative w-full aspect-[1000/620] rounded-xl overflow-hidden bg-[#E5ECE7] border border-slate-200/80 shadow-inner flex items-center justify-center">
          
          <svg 
            viewBox="0 0 1000 620" 
            className="w-full h-full"
          >
            <defs>
              {/* Soft Green Turf Pattern */}
              <pattern id="turf" width="40" height="40" patternUnits="userSpaceOnUse">
                <rect width="40" height="40" fill="#E2EEE5" />
                <circle cx="20" cy="20" r="1.5" fill="#D3E5D8" />
              </pattern>

              {/* Road Asphalt Fill */}
              <linearGradient id="road-asphalt" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#2A3441" />
                <stop offset="100%" stopColor="#252E3A" />
              </linearGradient>

              {/* Active Green Corridor Pattern */}
              <linearGradient id="green-corridor-lane" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00A86B" stopOpacity="0.92" />
                <stop offset="100%" stopColor="#00966A" stopOpacity="0.92" />
              </linearGradient>

              {/* Glow Filters */}
              <filter id="glow-red-lamp" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="glow-green-lamp" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Grass Background */}
            <rect width="1000" height="620" fill="url(#turf)" />

            {/* ============================================================= */}
            {/* A. TREES (ROUND GREEN TREES IN 4 CORNERS MATCHING IMAGE) */}
            {/* ============================================================= */}
            {/* Top-Left Quadrant Trees */}
            <g>
              <circle cx="280" cy="90" r="22" fill="#75B085" />
              <circle cx="277" cy="87" r="18" fill="#88C398" />
              <circle cx="340" cy="150" r="18" fill="#75B085" />
              <circle cx="338" cy="148" r="15" fill="#88C398" />
            </g>

            {/* Top-Right Quadrant Trees */}
            <g>
              <circle cx="680" cy="90" r="22" fill="#75B085" />
              <circle cx="677" cy="87" r="18" fill="#88C398" />
              <circle cx="750" cy="140" r="19" fill="#75B085" />
              <circle cx="748" cy="138" r="16" fill="#88C398" />
            </g>

            {/* Bottom-Left Quadrant Trees */}
            <g>
              <circle cx="290" cy="480" r="20" fill="#75B085" />
              <circle cx="288" cy="478" r="17" fill="#88C398" />
              <circle cx="340" cy="540" r="22" fill="#75B085" />
              <circle cx="337" cy="537" r="18" fill="#88C398" />
            </g>

            {/* Bottom-Right Quadrant Trees (around hospital campus) */}
            <g>
              <circle cx="660" cy="540" r="20" fill="#75B085" />
              <circle cx="658" cy="538" r="17" fill="#88C398" />
              <circle cx="890" cy="470" r="18" fill="#75B085" />
              <circle cx="888" cy="468" r="15" fill="#88C398" />
            </g>

            {/* ============================================================= */}
            {/* B. ROAD NETWORK (4-WAY INTERSECTION + U-TURN LOOPS) */}
            {/* ============================================================= */}

            {/* North-South Road (X: 420 to 580, Width = 160) */}
            <rect x="420" y="0" width="160" height="620" fill="url(#road-asphalt)" />

            {/* East-West Highway (Y: 230 to 390, Height = 160) */}
            <rect x="100" y="230" width="800" height="160" fill="url(#road-asphalt)" />

            {/* West Designated U-Turn Loop Pavement (Arc from Y=230 to 390 at X=100) */}
            <path 
              d="M 105 230 L 95 230 A 80 80 0 0 0 95 390 L 105 390 Z" 
              fill="url(#road-asphalt)" 
            />
            {/* West U-Turn Median Island */}
            <rect x="90" y="300" width="16" height="20" rx="8" fill="#1A222C" stroke="#F59E0B" strokeWidth="1.5" />
            <path d="M 98 304 L 92 310 L 98 316" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />

            {/* East Designated U-Turn Loop Pavement (Arc from Y=230 to 390 at X=900) */}
            <path 
              d="M 895 230 L 905 230 A 80 80 0 0 1 905 390 L 895 390 Z" 
              fill="url(#road-asphalt)" 
            />
            {/* East U-Turn Median Island */}
            <rect x="894" y="300" width="16" height="20" rx="8" fill="#1A222C" stroke="#F59E0B" strokeWidth="1.5" />
            <path d="M 902 304 L 908 310 L 902 316" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />

            {/* ============================================================= */}
            {/* C. ACTIVE EMERGENCY CORRIDOR GREEN LANE HIGHLIGHT */}
            {/* Highlights the active road lane the ambulance is traversing */}
            {/* ============================================================= */}
            {isCorridorActive && (
              <g>
                {/* Outbound (Step 1 to 3): Lower lane (Y=310..390) is green */}
                {(p <= 50) && (
                  <rect x="100" y="310" width="800" height="80" fill="url(#green-corridor-lane)" opacity="0.9" />
                )}
                {/* First U-turn loop green flow */}
                {(p >= 40 && p <= 54) && (
                  <path d="M 100 230 A 80 80 0 0 0 100 390 L 100 310 Z" fill="#00A86B" opacity="0.85" />
                )}
                {/* Return (Step 4 to 6): Upper lane (Y=230..310) is green */}
                {(p > 50 && p < 92) && (
                  <rect x="100" y="230" width="800" height="80" fill="url(#green-corridor-lane)" opacity="0.9" />
                )}
                {/* Second U-turn loop green flow */}
                {(p >= 80 && p <= 95) && (
                  <path d="M 900 230 A 80 80 0 0 1 900 390 L 900 310 Z" fill="#00A86B" opacity="0.85" />
                )}
              </g>
            )}

            {/* ============================================================= */}
            {/* D. ROAD MARKINGS: DIVIDERS & ZEBRA CROSSINGS */}
            {/* ============================================================= */}

            {/* Centerline Dividers */}
            <line x1="100" y1="310" x2="420" y2="310" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="12 10" opacity="0.75" />
            <line x1="580" y1="310" x2="900" y2="310" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="12 10" opacity="0.75" />

            <line x1="500" y1="0" x2="500" y2="230" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="12 10" opacity="0.75" />
            <line x1="500" y1="390" x2="500" y2="620" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="12 10" opacity="0.75" />

            {/* Pedestrian Zebra Crossings */}
            <g stroke="#FFFFFF" strokeWidth="4" opacity="0.85">
              {/* North Zebra */}
              <line x1="426" y1="218" x2="574" y2="218" strokeDasharray="8 8" />
              <line x1="426" y1="225" x2="574" y2="225" strokeDasharray="8 8" />
              {/* South Zebra */}
              <line x1="426" y1="395" x2="574" y2="395" strokeDasharray="8 8" />
              <line x1="426" y1="402" x2="574" y2="402" strokeDasharray="8 8" />
              {/* West Zebra */}
              <line x1="406" y1="236" x2="406" y2="384" strokeDasharray="8 8" />
              <line x1="413" y1="236" x2="413" y2="384" strokeDasharray="8 8" />
              {/* East Zebra */}
              <line x1="587" y1="236" x2="587" y2="384" strokeDasharray="8 8" />
              <line x1="594" y1="236" x2="594" y2="384" strokeDasharray="8 8" />
            </g>

            {/* Stop Lines on Approaches */}
            {/* East Stop Line */}
            <line 
              x1="600" y1="310" x2="600" y2="390" 
              stroke={eastSignal === 'GREEN' ? '#00E676' : '#FF4D5A'} 
              strokeWidth={eastSignal === 'GREEN' ? '4' : '3'}
              filter={eastSignal === 'GREEN' ? 'url(#glow-green-lamp)' : ''}
            />
            {/* West Stop Line */}
            <line 
              x1="400" y1="230" x2="400" y2="310" 
              stroke={westSignal === 'GREEN' ? '#00E676' : '#FF4D5A'} 
              strokeWidth={westSignal === 'GREEN' ? '4' : '3'}
              filter={westSignal === 'GREEN' ? 'url(#glow-green-lamp)' : ''}
            />
            {/* North Stop Line (controlling Southbound entrance into junction: X=500..580) */}
            <line x1="500" y1="210" x2="580" y2="210" stroke="#FF4D5A" strokeWidth="3" />
            {/* South Stop Line (controlling Northbound entrance into junction: X=420..500) */}
            <line x1="420" y1="410" x2="500" y2="410" stroke="#FF4D5A" strokeWidth="3" />

            {/* ============================================================= */}
            {/* E. CORRECT ROAD DIRECTION ARROWS (MATCHING TRUE MOVEMENT!) */}
            {/* Lower lane: flows WEST (points LEFT ◄) */}
            {/* Upper lane: flows EAST (points RIGHT ►) */}
            {/* Vertical roads: Left lane flows NORTH (▲), Right lane flows SOUTH (▼) */}
            {/* ============================================================= */}
            
            {/* 1. LOWER LANE (Y=350): TRAVELS FROM RIGHT TO LEFT (WESTBOUND) */}
            {/* East Road Lower Lane Arrow (pointing LEFT ◄) */}
            <g fill="#FFFFFF" opacity="0.9">
              <path d="M 710 350 L 722 345 L 722 355 Z" />
              <line x1="722" y1="350" x2="742" y2="350" stroke="#FFFFFF" strokeWidth="2.5" />
            </g>
            <g fill="#FFFFFF" opacity="0.9">
              <path d="M 625 350 L 637 345 L 637 355 Z" />
              <line x1="637" y1="350" x2="657" y2="350" stroke="#FFFFFF" strokeWidth="2.5" />
            </g>
            {/* West Road Lower Lane Arrow (pointing LEFT ◄) */}
            <g fill="#FFFFFF" opacity="0.9">
              <path d="M 270 350 L 282 345 L 282 355 Z" />
              <line x1="282" y1="350" x2="302" y2="350" stroke="#FFFFFF" strokeWidth="2.5" />
            </g>
            <g fill="#FFFFFF" opacity="0.9">
              <path d="M 170 350 L 182 345 L 182 355 Z" />
              <line x1="182" y1="350" x2="202" y2="350" stroke="#FFFFFF" strokeWidth="2.5" />
            </g>

            {/* 2. UPPER LANE (Y=270): TRAVELS FROM LEFT TO RIGHT (EASTBOUND) */}
            {/* West Road Upper Lane Arrow (pointing RIGHT ►) */}
            <g fill="#FFFFFF" opacity="0.9">
              <path d="M 292 270 L 280 265 L 280 275 Z" />
              <line x1="260" y1="270" x2="280" y2="270" stroke="#FFFFFF" strokeWidth="2.5" />
            </g>
            <g fill="#FFFFFF" opacity="0.9">
              <path d="M 390 270 L 378 265 L 378 275 Z" />
              <line x1="358" y1="270" x2="378" y2="270" stroke="#FFFFFF" strokeWidth="2.5" />
            </g>
            {/* East Road Upper Lane Arrow (pointing RIGHT ►) */}
            <g fill="#FFFFFF" opacity="0.9">
              <path d="M 742 270 L 730 265 L 730 275 Z" />
              <line x1="710" y1="270" x2="730" y2="270" stroke="#FFFFFF" strokeWidth="2.5" />
            </g>
            <g fill="#FFFFFF" opacity="0.9">
              <path d="M 842 270 L 830 265 L 830 275 Z" />
              <line x1="810" y1="270" x2="830" y2="270" stroke="#FFFFFF" strokeWidth="2.5" />
            </g>

            {/* 3. NORTH ROAD (UPPER HIGHWAY) ARROWS: Northbound (▲) on Left, Southbound (▼) on Right */}
            <g fill="#FFFFFF" opacity="0.9">
              {/* Left lane (Northbound out of junction): ▲ */}
              <path d="M 460 145 L 454 157 L 466 157 Z" />
              <line x1="460" y1="157" x2="460" y2="175" stroke="#FFFFFF" strokeWidth="2.5" />
              {/* Right lane (Southbound into junction): ▼ */}
              <path d="M 540 175 L 534 163 L 546 163 Z" />
              <line x1="540" y1="163" x2="540" y2="145" stroke="#FFFFFF" strokeWidth="2.5" />
            </g>

            {/* 4. SOUTH ROAD (LOWER HIGHWAY) ARROWS: Northbound (▲) on Left, Southbound (▼) on Right */}
            <g fill="#FFFFFF" opacity="0.9">
              {/* Left lane (Northbound into junction): ▲ */}
              <path d="M 460 445 L 454 457 L 466 457 Z" />
              <line x1="460" y1="457" x2="460" y2="475" stroke="#FFFFFF" strokeWidth="2.5" />
              {/* Right lane (Southbound out of junction): ▼ */}
              <path d="M 540 475 L 534 463 L 546 463 Z" />
              <line x1="540" y1="463" x2="540" y2="445" stroke="#FFFFFF" strokeWidth="2.5" />
            </g>

            {/* ============================================================= */}
            {/* F. DEMO VEHICLES ONLY ON UPPER AND LOWER HIGHWAYS */}
            {/* Strictly off horizontal road so they never collide with ambulance */}
            {/* ============================================================= */}
            
            {/* 1. Upper Highway (North Road): Red Car (Southbound lane, heading ▼) */}
            <g transform="translate(540, 95)">
              <rect x="-8" y="-15" width="16" height="30" rx="4" fill="#E53935" stroke="#B71C1C" strokeWidth="1" />
              <rect x="-6" y="2" width="12" height="8" rx="2" fill="#B71C1C" />
              <circle cx="-5" cy="13" r="2" fill="#FFF59D" />
              <circle cx="5" cy="13" r="2" fill="#FFF59D" />
              <circle cx="-5" cy="-13" r="1.5" fill="#7F1D1D" />
              <circle cx="5" cy="-13" r="1.5" fill="#7F1D1D" />
            </g>

            {/* 2. Upper Highway (North Road): White Car (Northbound lane, heading ▲) */}
            <g transform="translate(460, 135)">
              <rect x="-8" y="-15" width="16" height="30" rx="4" fill="#FFFFFF" stroke="#CFD8DC" strokeWidth="1" />
              <rect x="-6" y="-10" width="12" height="8" rx="2" fill="#90A4AE" />
              <circle cx="-5" cy="-13" r="2" fill="#FFF59D" />
              <circle cx="5" cy="-13" r="2" fill="#FFF59D" />
              <circle cx="-5" cy="13" r="1.5" fill="#FF5252" />
              <circle cx="5" cy="13" r="1.5" fill="#FF5252" />
            </g>

            {/* 3. Lower Highway (South Road): White Car (Northbound lane, heading ▲) */}
            <g transform="translate(460, 490)">
              <rect x="-8" y="-15" width="16" height="30" rx="4" fill="#FFFFFF" stroke="#CFD8DC" strokeWidth="1" />
              <rect x="-6" y="-10" width="12" height="8" rx="2" fill="#90A4AE" />
              <circle cx="-5" cy="-13" r="2" fill="#FFF59D" />
              <circle cx="5" cy="-13" r="2" fill="#FFF59D" />
              <circle cx="-5" cy="13" r="1.5" fill="#FF5252" />
              <circle cx="5" cy="13" r="1.5" fill="#FF5252" />
            </g>

            {/* 4. Lower Highway (South Road): Cyan/Blue Car (Southbound lane, heading ▼) */}
            <g transform="translate(540, 530)">
              <rect x="-8" y="-15" width="16" height="30" rx="4" fill="#0284C7" stroke="#0369A1" strokeWidth="1" />
              <rect x="-6" y="2" width="12" height="8" rx="2" fill="#0369A1" />
              <circle cx="-5" cy="13" r="2" fill="#FFF59D" />
              <circle cx="5" cy="13" r="2" fill="#FFF59D" />
              <circle cx="-5" cy="-13" r="1.5" fill="#EF4444" />
              <circle cx="5" cy="-13" r="1.5" fill="#EF4444" />
            </g>

            {/* ============================================================= */}
            {/* G. HOSPITAL CAMPUS IN BOTTOM-RIGHT CORNER */}
            {/* Starts here, connects directly to East road lower lane */}
            {/* ============================================================= */}
            <g transform="translate(760, 480)">
              {/* Hospital Building Perimeter */}
              <rect 
                x="-70" y="-65" width="140" height="95" 
                rx="12" 
                fill="#1C2D37" 
                stroke={isReturned ? '#00E676' : '#4CAF50'} 
                strokeWidth="2.5" 
              />
              {/* Medical Cross Graphic */}
              <rect x="-8" y="-45" width="16" height="36" rx="2" fill="#00E676" />
              <rect x="-18" y="-35" width="36" height="16" rx="2" fill="#00E676" />

              {/* Helipad Circle with 'H' */}
              <circle cx="36" cy="-28" r="14" fill="#15232B" stroke="#B0BEC5" strokeWidth="1.5" strokeDasharray="3 3" />
              <text x="36" y="-23" fill="#FFFFFF" fontSize="11" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">H</text>

              {/* Emergency Intake Bay / Driveway connecting north to East Road (Y=350) */}
              <path d="M -25 -65 L -25 -90 L 25 -90 L 25 -65 Z" fill="#253540" stroke="#00E676" strokeWidth="1.5" strokeDasharray="3 3" />

              {/* Label Card */}
              <rect x="-62" y="5" width="124" height="20" rx="4" fill="#0E1920" />
              <text x="0" y="18" fill="#FFFFFF" fontSize="8.5" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">
                APEX HOSPITAL
              </text>
              <text x="0" y="40" fill="#00A86B" fontSize="9" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                {isReturned ? '✓ AMBULANCE RETURNED' : 'AMBULANCE BASE BAY'}
              </text>
            </g>

            {/* ============================================================= */}
            {/* H. ACCIDENT LOCATION IN UPPER-LEFT AREA */}
            {/* Positioned at X=180, Y=270 (Upper lane of West Road) */}
            {/* ============================================================= */}
            <g transform="translate(180, 270)">
              {/* Active Hazard Sonar Waves */}
              <circle r="36" fill="none" stroke="#FF4D5A" strokeWidth="2" opacity="0.4" className="animate-ping" />
              <circle r="22" fill="#FF4D5A" fillOpacity="0.25" stroke="#FF4D5A" strokeWidth="2" />
              
              {/* Crashed Cars Indicator */}
              <rect x="-14" y="-8" width="28" height="16" rx="3" fill="#B71C1C" transform="rotate(-15)" />
              <rect x="-6" y="-12" width="22" height="14" rx="3" fill="#37474F" transform="rotate(25)" />
              
            {/* Accident Badge Tag */}
            <rect x="-60" y="-45" width="120" height="22" rx="5" fill={isAtAccident ? "#D97706" : "#D32F2F"} stroke="#FFFFFF" strokeWidth="1.5" />
            <text x="0" y="-30" fill="#FFFFFF" fontSize="8.5" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">
              {isAtAccident ? "PATIENT LOADING..." : "⚠ ACCIDENT DETECTED"}
            </text>
            </g>

            {/* ============================================================= */}
            {/* I. FOUR TRAFFIC LIGHT HEADS (EXACTLY AS IN REFERENCE IMAGE) */}
            {/* ============================================================= */}

            {/* 1. NORTH APPROACH TRAFFIC LIGHT (Top-Left of junction, facing South) */}
            <g transform="translate(390, 160)">
              <rect x="-10" y="-22" width="20" height="44" rx="5" fill="#111827" stroke="#374151" strokeWidth="1.5" />
              <circle cx="0" cy="-12" r="4.5" fill={northSignal === 'RED' ? '#FF4D5A' : '#451014'} filter={northSignal === 'RED' ? 'url(#glow-red-lamp)' : ''} />
              <circle cx="0" cy="0" r="4.5" fill={(northSignal as string) === 'AMBER' ? '#FFB300' : '#423005'} />
              <circle cx="0" cy="12" r="4.5" fill={(northSignal as string) === 'GREEN' ? '#00E676' : '#083818'} />
            </g>

            {/* 2. SOUTH APPROACH TRAFFIC LIGHT (Bottom-Right of junction, facing North) */}
            <g transform="translate(610, 460)">
              <rect x="-10" y="-22" width="20" height="44" rx="5" fill="#111827" stroke="#374151" strokeWidth="1.5" />
              <circle cx="0" cy="-12" r="4.5" fill={southSignal === 'RED' ? '#FF4D5A' : '#451014'} filter={southSignal === 'RED' ? 'url(#glow-red-lamp)' : ''} />
              <circle cx="0" cy="0" r="4.5" fill={(southSignal as string) === 'AMBER' ? '#FFB300' : '#423005'} />
              <circle cx="0" cy="12" r="4.5" fill={(southSignal as string) === 'GREEN' ? '#00E676' : '#083818'} />
            </g>

            {/* 3. EAST APPROACH TRAFFIC LIGHT (Right side, controlling Westbound ambulance approach) */}
            <g transform="translate(630, 240)">
              <rect x="-10" y="-22" width="20" height="44" rx="5" fill="#111827" stroke="#374151" strokeWidth="1.5" />
              <circle cx="0" cy="-12" r="4.5" fill={eastSignal === 'RED' ? '#FF4D5A' : '#451014'} filter={eastSignal === 'RED' ? 'url(#glow-red-lamp)' : ''} />
              <circle cx="0" cy="0" r="4.5" fill={(eastSignal as string) === 'AMBER' ? '#FFB300' : '#423005'} />
              <circle cx="0" cy="12" r="4.5" fill={eastSignal === 'GREEN' ? '#00E676' : '#083818'} filter={eastSignal === 'GREEN' ? 'url(#glow-green-lamp)' : ''} />
            </g>

            {/* 4. WEST APPROACH TRAFFIC LIGHT (Left side, controlling Eastbound return approach) */}
            <g transform="translate(370, 380)">
              <rect x="-10" y="-22" width="20" height="44" rx="5" fill="#111827" stroke="#374151" strokeWidth="1.5" />
              <circle cx="0" cy="-12" r="4.5" fill={westSignal === 'RED' ? '#FF4D5A' : '#451014'} filter={westSignal === 'RED' ? 'url(#glow-red-lamp)' : ''} />
              <circle cx="0" cy="0" r="4.5" fill={(westSignal as string) === 'AMBER' ? '#FFB300' : '#423005'} />
              <circle cx="0" cy="12" r="4.5" fill={westSignal === 'GREEN' ? '#00E676' : '#083818'} filter={westSignal === 'GREEN' ? 'url(#glow-green-lamp)' : ''} />
            </g>

            {/* ============================================================= */}
            {/* J. THE AMBULANCE: BUTTERY-SMOOTH CONTINUOUS KINEMATICS */}
            {/* Front of ambulance locked to movement vector with headlights & strobes */}
            {/* ============================================================= */}
            <g transform={`translate(${ambX}, ${ambY})`}>
              
              {/* Rotating group: front of ambulance faces exact direction of travel */}
              <g transform={`rotate(${ambAngle})`}>
                
                {/* Siren Glow Aura */}
                {isCorridorActive && (
                  <circle r="26" fill="#00E676" fillOpacity="0.25" className="animate-ping" />
                )}

                {/* Headlight Beams projecting forward (+X direction) */}
                <polygon 
                  points="20,-8 58,-16 58,16 20,8" 
                  fill="#FEF08A" 
                  fillOpacity={isCorridorActive ? "0.28" : "0.1"} 
                />

                {/* Ambulance Van Body */}
                <rect 
                  x="-20" y="-12" width="40" height="24" 
                  rx="5" 
                  fill="#FFFFFF" 
                  stroke="#334155" 
                  strokeWidth="1.5" 
                />

                {/* Windshield on Front (+X side) */}
                <rect x="8" y="-9" width="8" height="18" rx="2" fill="#38BDF8" fillOpacity="0.85" />

                {/* Dual Front Headlights (+X side) */}
                <circle cx="19" cy="-7" r="2.5" fill="#FEF08A" />
                <circle cx="19" cy="7" r="2.5" fill="#FEF08A" />

                {/* Dual Rear Brake Lights (-X side) */}
                <circle cx="-19" cy="-7" r="2" fill="#EF4444" />
                <circle cx="-19" cy="7" r="2" fill="#EF4444" />

                {/* Red Medical Cross on roof */}
                <rect x="-5" y="-3" width="10" height="6" fill="#DC2626" />
                <rect x="-3" y="-5" width="6" height="10" fill="#DC2626" />

                {/* Dual Emergency Strobes on Roof */}
                <circle cx="1" cy="-10" r="3" fill="#0284C7" className="animate-pulse" />
                <circle cx="-3" cy="-10" r="3" fill="#EF4444" className="animate-pulse" />

                {/* Forward Direction Arrow on Roof */}
                <path d="M 12 0 L 16 -3 L 16 3 Z" fill="#00A86B" />
              </g>

              {/* Telemetry Tag (Stays Upright) */}
              <g transform="translate(0, -25)">
                <rect 
                  x="-36" y="-9" width="72" height="18" 
                  rx="4" 
                  fill="rgba(15, 23, 42, 0.92)" 
                  stroke={isCorridorActive ? '#00E676' : '#94A3B8'} 
                  strokeWidth="1" 
                />
                <text x="0" y="3.5" fill="#FFFFFF" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                  {ambulance.id} • {Math.round(p)}%
                </text>
              </g>

            </g>

          </svg>
        </div>
      </div>

      {/* 3. Real-time Status Panel Placed in the Empty Area BELOW the Map (Current Phase above, Priority Mode on last line) */}
      <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-col gap-1.5 px-3.5 py-2.5 bg-slate-50/90 rounded-xl border border-[#E3EEE8] text-xs font-mono">
        {/* Line 1 (Above): Current Phase update */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-slate-400 shrink-0 font-medium">Current Phase:</span>
          <span className="font-bold text-[#00966a] truncate">
            {phaseDescription}
          </span>
        </div>

        {/* Line 2 (Last line, below): Priority Mode */}
        <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60">
          <ShieldCheck className="w-4 h-4 text-[#00966a] shrink-0" />
          <span className="text-slate-600 text-[11px] font-semibold">
            {isPriorityOn ? 'Priority Mode Active' : 'Priority Mode OFF'}
          </span>
        </div>
      </div>

    </div>
  );
};
