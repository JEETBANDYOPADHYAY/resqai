import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Navigation,
  ArrowUp,
  ArrowUpRight,
  ArrowUpLeft,
  CornerUpRight,
  CornerUpLeft,
  RotateCcw,
  Flag,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCw,
  AlertTriangle,
  ShieldCheck,
  MapPin,
  X,
  Compass,
  Gauge,
  Footprints,
  Car,
  FastForward,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  List,
  Radio,
  CheckCircle2,
  Building2,
  Sparkles,
  Check,
} from 'lucide-react';
import { RoutingResult, RouteStep, RoadNode, NavigationManeuver } from '../types';
import { audioEngine } from '../utils/audioAlert';
import { useLanguage } from '../context/LanguageContext';
import { VoicePackModal } from './VoicePackModal';
import { getGeoDistanceKm } from '../utils/geoRouting';
import {
  buildSpokenInstruction,
  buildArrivalPhrase,
  buildReroutePhrase,
  findBestVoiceForLanguage,
} from '../utils/voicePack';

interface GoogleMapsLiveGuidanceProps {
  route: RoutingResult | null;
  originNode: RoadNode | null;
  allNodes: RoadNode[];
  shelters?: RoadNode[];
  selectedTargetNodeId?: string | null;
  onSelectOriginNode: (nodeId: string) => void;
  onSelectDestinationNode: (nodeId: string | null) => void;
  onRerouteBlockCurrentRoad?: () => void;
  onCloseNavigation: () => void;
  onUpdateNavPosition?: (coords: [number, number] | null, headingDeg: number) => void;
  onRecenterMap?: () => void;
}

export const GoogleMapsLiveGuidance: React.FC<GoogleMapsLiveGuidanceProps> = ({
  route,
  originNode,
  allNodes,
  shelters = [],
  selectedTargetNodeId = null,
  onSelectOriginNode,
  onSelectDestinationNode,
  onRerouteBlockCurrentRoad,
  onCloseNavigation,
  onUpdateNavPosition,
  onRecenterMap,
}) => {
  const { language } = useLanguage();
  const [showVoiceModal, setShowVoiceModal] = useState<boolean>(false);
  const [showShelterSelector, setShowShelterSelector] = useState<boolean>(false);
  const [showAllSteps, setShowAllSteps] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simSpeed, setSimSpeed] = useState<number>(1); // 0.5x, 1x, 2x, 4x
  const [travelMode, setTravelMode] = useState<'DRIVE' | 'WALK'>('DRIVE');
  const [isVoiceMuted, setIsVoiceMuted] = useState<boolean>(false);
  const [simDistanceTraveled, setSimDistanceTraveled] = useState<number>(0); // in meters along the polyline path
  const [showRerouteNotice, setShowRerouteNotice] = useState<boolean>(false);

  const simulationTimerRef = useRef<any>(null);
  const lastSpokenStepRef = useRef<number>(-1);
  const lastSpokenTimeRef = useRef<number>(0);
  const onUpdateNavPositionRef = useRef(onUpdateNavPosition);

  useEffect(() => {
    onUpdateNavPositionRef.current = onUpdateNavPosition;
  });

  // Clear nav position and stop speech when unmounting
  useEffect(() => {
    return () => {
      onUpdateNavPositionRef.current?.(null, 0);
      audioEngine.stopAllAudio();
    };
  }, []);

  // Filter possible stuck locations (non-shelter and start nodes)
  const strandedHotspots = allNodes.filter(
    (n) => n.isCitizenStart || (!n.isShelter && !n.isHospital && !n.isEmergencyDepot)
  );
  const shelterTargets = allNodes.filter((n) => n.isShelter || n.isHospital);

  const steps = route?.turnByTurn || [];
  const currentStep: RouteStep | undefined = steps[currentStepIndex] || steps[0];
  const nextStep: RouteStep | undefined = steps[currentStepIndex + 1];
  const isArrived = currentStepIndex === steps.length - 1 && steps.length > 0;

  // 1. Calculate cumulative distance array for each vertex in route.path
  const pathDistances = useMemo(() => {
    if (!route?.path || route.path.length < 2) return [];
    const dists: number[] = [0];
    let sum = 0;
    for (let i = 1; i < route.path.length; i++) {
      const dKm = getGeoDistanceKm(route.path[i - 1], route.path[i]);
      sum += dKm * 1000;
      dists.push(sum);
    }
    return dists;
  }, [route?.path]);

  const totalPathDistanceMeters =
    pathDistances.length > 0 ? pathDistances[pathDistances.length - 1] : 0;

  // 2. Map each turn-by-turn step to its distance along route.path
  const stepDistances = useMemo(() => {
    if (!route?.path || steps.length === 0 || pathDistances.length === 0) return [];
    return steps.map((step, idx) => {
      if (idx === 0) return 0;
      if (idx === steps.length - 1) return totalPathDistanceMeters;
      if (!step.coordinates) {
        return (idx / Math.max(1, steps.length - 1)) * totalPathDistanceMeters;
      }
      // Locate closest vertex along route.path
      let minD = Infinity;
      let closestIdx = 0;
      for (let i = 0; i < route.path.length; i++) {
        const d = getGeoDistanceKm(step.coordinates, route.path[i]);
        if (d < minD) {
          minD = d;
          closestIdx = i;
        }
      }
      return pathDistances[closestIdx] ?? 0;
    });
  }, [route?.path, steps, pathDistances, totalPathDistanceMeters]);

  // Reset navigation progress when active route changes or new destination shelter is chosen
  const routeKey = `${originNode?.id}-${route?.destinationNode?.id}-${route?.turnByTurn?.length}`;
  useEffect(() => {
    setCurrentStepIndex(0);
    setSimDistanceTraveled(0);
    setIsSimulating(false);
    lastSpokenStepRef.current = -1;
  }, [routeKey]);

  // Keep currentStepIndex synchronized with continuous simDistanceTraveled
  useEffect(() => {
    if (stepDistances.length === 0 || totalPathDistanceMeters <= 0) return;

    if (simDistanceTraveled >= totalPathDistanceMeters - 5) {
      setCurrentStepIndex(steps.length - 1);
      return;
    }

    for (let i = steps.length - 2; i >= 0; i--) {
      const stepStart = stepDistances[i] ?? 0;
      if (simDistanceTraveled >= stepStart - 2) {
        setCurrentStepIndex(i);
        break;
      }
    }
  }, [simDistanceTraveled, stepDistances, totalPathDistanceMeters, steps.length]);

  // Speak when step changes - centralized single-source voice guidance with cooldown
  useEffect(() => {
    if (!currentStep || isVoiceMuted || steps.length === 0) return;

    if (lastSpokenStepRef.current !== currentStepIndex) {
      const now = Date.now();
      const timeSinceLastSpoken = now - lastSpokenTimeRef.current;
      const isInitialOrArrival = lastSpokenStepRef.current === -1 || isArrived;

      // Throttle voice updates to prevent repeating instructions every couple seconds
      if (!isInitialOrArrival && timeSinceLastSpoken < 4500) {
        lastSpokenStepRef.current = currentStepIndex;
        return;
      }

      lastSpokenStepRef.current = currentStepIndex;
      lastSpokenTimeRef.current = now;

      if (isArrived) {
        // Physical safe arrival at evacuation shelter
        audioEngine.playSosSuccess();
        const voiceInfo = findBestVoiceForLanguage(language);
        const arrivalText = buildArrivalPhrase(
          language,
          voiceInfo.isNative,
          route?.destinationNode?.name
        );
        const fallbackArrival = buildArrivalPhrase(
          language,
          false,
          route?.destinationNode?.name
        );
        audioEngine.speakNavigationGuidance(arrivalText, language, fallbackArrival);
      } else {
        // En-route turn instruction
        audioEngine.playNavigationTurnChime();
        const voiceInfo = findBestVoiceForLanguage(language);
        const textToSpeak = buildSpokenInstruction(currentStep, language, voiceInfo.isNative);
        const fallbackText = buildSpokenInstruction(currentStep, language, false);
        audioEngine.speakNavigationGuidance(textToSpeak, language, fallbackText);
      }
    }
  }, [currentStepIndex, isVoiceMuted, language, currentStep, isArrived, steps.length, route?.destinationNode?.name]);

  // Compute live coordinates along current continuous polyline
  useEffect(() => {
    if (!route || !route.path || route.path.length < 2 || pathDistances.length < 2) return;

    const path = route.path;
    const clampedDist = Math.min(Math.max(0, simDistanceTraveled), totalPathDistanceMeters);

    // Locate polyline segment
    let segIdx = 0;
    for (let i = 0; i < pathDistances.length - 1; i++) {
      if (clampedDist >= pathDistances[i] && clampedDist <= pathDistances[i + 1]) {
        segIdx = i;
        break;
      }
      if (i === pathDistances.length - 2) {
        segIdx = i;
      }
    }

    const p1 = path[segIdx];
    const p2 = path[segIdx + 1] || p1;
    const segLen = pathDistances[segIdx + 1] - pathDistances[segIdx];
    const segFraction = segLen > 0 ? (clampedDist - pathDistances[segIdx]) / segLen : 0;

    const currentLat = p1[0] + (p2[0] - p1[0]) * segFraction;
    const currentLng = p1[1] + (p2[1] - p1[1]) * segFraction;

    const dLat = p2[0] - p1[0];
    const dLng = p2[1] - p1[1];
    let heading = (Math.atan2(dLng, dLat) * 180) / Math.PI;
    if (heading < 0) heading += 360;

    onUpdateNavPositionRef.current?.([currentLat, currentLng], heading);
  }, [simDistanceTraveled, route?.path, pathDistances, totalPathDistanceMeters]);

  // Manual Step Turn Handlers - clean state transitions without duplicate voice calls
  const handleNextTurn = useCallback(() => {
    if (currentStepIndex < steps.length - 1) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      if (stepDistances[nextIdx] !== undefined) {
        setSimDistanceTraveled(stepDistances[nextIdx]);
      }
    }
  }, [currentStepIndex, steps.length, stepDistances]);

  const handlePrevTurn = useCallback(() => {
    if (currentStepIndex > 0) {
      const prevIdx = currentStepIndex - 1;
      setCurrentStepIndex(prevIdx);
      if (stepDistances[prevIdx] !== undefined) {
        setSimDistanceTraveled(stepDistances[prevIdx]);
      }
    }
  }, [currentStepIndex, stepDistances]);

  const handleJumpToStep = useCallback(
    (stepIdx: number) => {
      if (stepIdx >= 0 && stepIdx < steps.length) {
        setCurrentStepIndex(stepIdx);
        if (stepDistances[stepIdx] !== undefined) {
          setSimDistanceTraveled(stepDistances[stepIdx]);
        }
      }
    },
    [steps.length, stepDistances]
  );

  // Live Continuous Auto-Drive / Walk Simulation Loop (20 FPS smooth continuous animation)
  useEffect(() => {
    if (!isSimulating) {
      if (simulationTimerRef.current) {
        clearInterval(simulationTimerRef.current);
        simulationTimerRef.current = null;
      }
      return;
    }

    if (totalPathDistanceMeters <= 0) return;

    // 50ms interval = 20 FPS smooth animation with minimal CPU overhead
    const intervalMs = 50;
    const dt = intervalMs / 1000;

    // Speeds in meters per second:
    // DRIVE at 1x: 28 m/s (takes ~20-25s for typical evacuation corridor)
    // WALK at 1x: 14 m/s (takes ~40-45s for typical corridor, clearly progressing)
    // simSpeed multipliers: 0.5x, 1x, 2x, 4x
    const baseSpeed = travelMode === 'DRIVE' ? 28 : 14;
    const speedMps = baseSpeed * simSpeed;
    const stepDeltaMeters = speedMps * dt;

    simulationTimerRef.current = setInterval(() => {
      setSimDistanceTraveled((prev) => {
        const next = prev + stepDeltaMeters;
        if (next >= totalPathDistanceMeters - 2) {
          setIsSimulating(false);
          return totalPathDistanceMeters;
        }
        return next;
      });
    }, intervalMs);

    return () => {
      if (simulationTimerRef.current) {
        clearInterval(simulationTimerRef.current);
        simulationTimerRef.current = null;
      }
    };
  }, [isSimulating, simSpeed, travelMode, totalPathDistanceMeters]);

  // Travel mode switcher with auto-restart if reached destination
  const handleSelectTravelMode = useCallback(
    (mode: 'DRIVE' | 'WALK') => {
      setTravelMode(mode);
      if (isArrived || simDistanceTraveled >= totalPathDistanceMeters - 10) {
        setSimDistanceTraveled(0);
        setCurrentStepIndex(0);
        lastSpokenStepRef.current = -1;
        setIsSimulating(true);
      }
    },
    [isArrived, simDistanceTraveled, totalPathDistanceMeters]
  );

  // Toggle Simulation (restarts from step 0 if already arrived)
  const handleToggleSimulation = useCallback(() => {
    if (!isSimulating && (isArrived || simDistanceTraveled >= totalPathDistanceMeters - 10)) {
      setSimDistanceTraveled(0);
      setCurrentStepIndex(0);
      lastSpokenStepRef.current = -1;
    }
    setIsSimulating((prev) => !prev);
  }, [isSimulating, isArrived, simDistanceTraveled, totalPathDistanceMeters]);

  // Handle Reroute Trigger (Report sudden roadblock ahead)
  const handleTriggerReroute = () => {
    audioEngine.playRerouteChime();
    setShowRerouteNotice(true);
    setTimeout(() => setShowRerouteNotice(false), 5000);

    if (!isVoiceMuted) {
      const voiceInfo = findBestVoiceForLanguage(language);
      const rerouteText = buildReroutePhrase(language, voiceInfo.isNative);
      const fallbackReroute = buildReroutePhrase(language, false);
      audioEngine.speakNavigationGuidance(rerouteText, language, fallbackReroute);
    }

    if (onRerouteBlockCurrentRoad) {
      onRerouteBlockCurrentRoad();
    }
    // Reset simulation progress smoothly
    setSimDistanceTraveled(0);
  };

  const handleToggleVoiceMute = () => {
    setIsVoiceMuted((prev) => {
      const next = !prev;
      if (next) {
        audioEngine.stopAllAudio();
      }
      return next;
    });
  };

  // Maneuver Icon Renderer
  const renderManeuverIcon = (maneuver?: NavigationManeuver) => {
    switch (maneuver) {
      case 'TURN_LEFT':
        return <CornerUpLeft className="w-8 h-8 text-white stroke-[2.5]" />;
      case 'TURN_RIGHT':
        return <CornerUpRight className="w-8 h-8 text-white stroke-[2.5]" />;
      case 'SLIGHT_LEFT':
        return <ArrowUpLeft className="w-8 h-8 text-white stroke-[2.5]" />;
      case 'SLIGHT_RIGHT':
        return <ArrowUpRight className="w-8 h-8 text-white stroke-[2.5]" />;
      case 'U_TURN':
        return <RotateCcw className="w-8 h-8 text-white stroke-[2.5]" />;
      case 'ARRIVE':
        return <Flag className="w-8 h-8 text-emerald-400 stroke-[2.5]" />;
      default:
        return <ArrowUp className="w-8 h-8 text-white stroke-[2.5]" />;
    }
  };

  // Remaining Distance and ETA based on continuous meters traveled
  const remainingMeters = isArrived ? 0 : Math.max(0, totalPathDistanceMeters - simDistanceTraveled);
  const remainingKm = isArrived ? 0 : Math.round((remainingMeters / 1000) * 10) / 10;
  const remainingMinutes = isArrived
    ? 0
    : Math.max(1, Math.round((remainingMeters / 1000) / (travelMode === 'DRIVE' ? 35 : 5) * 60));

  // Distance to next turn or arrival in meters
  const nextStepStartDistance =
    currentStepIndex < steps.length - 1 && stepDistances[currentStepIndex + 1] !== undefined
      ? stepDistances[currentStepIndex + 1]
      : totalPathDistanceMeters;

  const distToNextTurnMeters = isArrived
    ? 0
    : Math.max(0, Math.round(nextStepStartDistance - simDistanceTraveled));

  const now = new Date();
  const arrivalTimeStr = isArrived
    ? 'ARRIVED'
    : new Date(now.getTime() + remainingMinutes * 60000).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });

  return (
    <div className="flex flex-col space-y-3 font-sans">
      {/* 1. TOP GOOGLE MAPS NAVIGATION BANNER (Green Header HUD) */}
      <div className="relative rounded-2xl bg-[#0F5132] border-2 border-emerald-500/70 shadow-2xl p-4 text-white overflow-hidden">
        {/* Subtle Ambient Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/90 via-[#0F5132] to-emerald-950/80 pointer-events-none" />

        <div className="relative z-10 space-y-3">
          {/* Top Info Bar */}
          <div className="flex items-center justify-between border-b border-emerald-400/30 pb-2.5">
            <div className="flex items-center space-x-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-300"></span>
              </span>
              <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-emerald-200">
                LIVE GPS EVACUATION HUD
              </span>
            </div>

            {/* Close & Recenter Controls */}
            <div className="flex items-center space-x-2">
              {onRecenterMap && (
                <button
                  onClick={onRecenterMap}
                  title="Recenter Map"
                  className="px-2 py-1 rounded bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 text-[10px] font-mono flex items-center space-x-1 border border-emerald-400/40"
                >
                  <Compass className="w-3 h-3 text-cyan-300" />
                  <span>Recenter Map</span>
                </button>
              )}
              <button
                onClick={onCloseNavigation}
                className="p-1 rounded-full bg-emerald-950/80 hover:bg-red-600 text-emerald-200 hover:text-white transition-colors"
                title="Exit Navigation Mode"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Primary Next-Maneuver Big Graphic */}
          <div className="flex items-center space-x-4">
            <div
              className={`p-3 rounded-2xl border-2 shadow-lg shrink-0 ${
                isArrived
                  ? 'bg-cyan-950/90 border-cyan-400 text-cyan-300'
                  : 'bg-emerald-950/90 border-emerald-400/80 text-white'
              }`}
            >
              {isArrived ? (
                <ShieldCheck className="w-8 h-8 text-cyan-300 stroke-[2.5]" />
              ) : (
                renderManeuverIcon(currentStep?.maneuver)
              )}
            </div>
            {isArrived ? (
              <div className="flex-1 min-w-0">
                <div className="text-xl sm:text-2xl font-extrabold text-cyan-300 flex items-center space-x-2">
                  <CheckCircle2 className="w-6 h-6 text-cyan-400 shrink-0" />
                  <span>SAFELY ARRIVED</span>
                </div>
                <div className="text-sm font-bold text-white truncate">
                  {route?.destinationNode?.name || 'Verified Safe Sanctuary'}
                </div>
                <div className="text-xs text-emerald-300/90 font-mono">
                  Flood-free ground reached • Medical triage & dry beds active
                </div>
              </div>
            ) : (
              <div className="flex-1 min-w-0">
                <div className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-white flex items-baseline gap-1">
                  <span>{distToNextTurnMeters}</span>
                  <span className="text-sm font-sans font-semibold text-emerald-200">meters</span>
                </div>
                <div className="text-sm sm:text-base font-bold text-emerald-100 truncate">
                  {currentStep?.instruction || 'Proceed safely along elevated bypass'}
                </div>
                <div className="text-xs text-emerald-300/80 truncate font-mono">
                  {currentStep?.streetName ? `Onto ${currentStep.streetName}` : 'Designated disaster evacuation road'}
                </div>
              </div>
            )}
          </div>

          {/* Next Turn Preview */}
          {!isArrived && nextStep && (
            <div className="flex items-center space-x-2 pt-1 border-t border-emerald-400/20 text-xs text-emerald-200">
              <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-300/80">
                Then:
              </span>
              <span className="truncate font-semibold">{nextStep.instruction}</span>
            </div>
          )}

          {/* MANUAL TURN-BY-TURN GUIDANCE CONTROLS */}
          <div className="bg-emerald-950/80 border border-emerald-400/40 rounded-xl p-2.5 flex flex-col gap-2 shadow-inner">
            <div className="flex items-center justify-between gap-2">
              <button
                id="btn-prev-turn"
                onClick={handlePrevTurn}
                disabled={currentStepIndex === 0}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition ${
                  currentStepIndex === 0
                    ? 'opacity-35 cursor-not-allowed text-emerald-300/50 bg-emerald-900/20'
                    : 'bg-emerald-900/90 hover:bg-emerald-800 text-white shadow cursor-pointer border border-emerald-600/50 active:scale-95'
                }`}
                title="Go to previous turn"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev Turn</span>
              </button>

              {/* Turn Counter & Visual Progress */}
              <div className="flex flex-col items-center justify-center px-1 min-w-0">
                <div className="flex items-center space-x-1 text-xs font-mono font-bold text-white">
                  {isArrived ? (
                    <span className="text-cyan-300 flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Sanctuary Reached</span>
                    </span>
                  ) : (
                    <>
                      <span className="text-emerald-300">Turn {currentStepIndex + 1}</span>
                      <span className="text-emerald-400/70">/</span>
                      <span>{Math.max(1, steps.length - 1)}</span>
                    </>
                  )}
                </div>
                <div className="w-20 sm:w-28 bg-emerald-900/80 rounded-full h-1.5 mt-1 overflow-hidden">
                  <div
                    className="bg-cyan-300 h-full transition-all duration-300 rounded-full"
                    style={{
                      width: `${
                        isArrived
                          ? 100
                          : totalPathDistanceMeters > 0
                          ? Math.min(100, Math.round((simDistanceTraveled / totalPathDistanceMeters) * 100))
                          : Math.min(
                              100,
                              Math.round(((currentStepIndex + 1) / Math.max(1, steps.length)) * 100)
                            )
                      }%`,
                    }}
                  />
                </div>
              </div>

              {/* Next Turn / Arrive Button */}
              {currentStepIndex < steps.length - 2 ? (
                <button
                  id="btn-next-turn"
                  onClick={handleNextTurn}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center space-x-1.5 shadow-lg shadow-emerald-500/40 cursor-pointer transition transform active:scale-95"
                  title="Reached this turn? Click to view and hear next turn instruction"
                >
                  <span>Next Turn</span>
                  <ChevronRight className="w-4 h-4 stroke-[3]" />
                </button>
              ) : currentStepIndex === steps.length - 2 ? (
                <button
                  id="btn-arrive-sanctuary"
                  onClick={handleNextTurn}
                  className="px-3.5 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-extrabold text-xs flex items-center space-x-1.5 shadow-lg shadow-cyan-400/40 cursor-pointer transition transform active:scale-95 animate-pulse"
                  title="Completed final road - tap to enter safe sanctuary"
                >
                  <span>Arrive at Shelter</span>
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                </button>
              ) : (
                <button
                  id="btn-arrived-turn"
                  disabled
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-800/80 text-cyan-200 font-extrabold text-xs flex items-center space-x-1 shadow-md cursor-default border border-cyan-400/40"
                  title="Destination safely reached!"
                >
                  <CheckCircle2 className="w-4 h-4 text-cyan-300" />
                  <span>Safely Arrived!</span>
                </button>
              )}
            </div>

            {/* Toggle All Turns List */}
            {steps.length > 1 && (
              <button
                id="btn-toggle-all-turns"
                onClick={() => setShowAllSteps(!showAllSteps)}
                className="w-full pt-1 border-t border-emerald-800/60 flex items-center justify-center space-x-1 text-[11px] font-mono text-emerald-200/90 hover:text-white transition cursor-pointer"
              >
                <List className="w-3 h-3 text-cyan-300" />
                <span>{showAllSteps ? 'Hide All Turns' : `View All Turns (${steps.length} steps)`}</span>
                {showAllSteps ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
          </div>

          {/* Expandable All Turns Step-by-Step List */}
          {showAllSteps && steps.length > 0 && (
            <div className="p-2 bg-emerald-950/90 rounded-xl border border-emerald-600/40 max-h-48 overflow-y-auto space-y-1.5 text-xs">
              <div className="text-[10px] uppercase font-mono text-emerald-300 tracking-wider pb-1 border-b border-emerald-800/60 flex items-center justify-between">
                <span>Turn-by-Turn Route Preview</span>
                <span>Click turn to inspect</span>
              </div>
              {steps.map((st, idx) => {
                const isActive = idx === currentStepIndex;
                return (
                  <button
                    key={idx}
                    onClick={() => handleJumpToStep(idx)}
                    className={`w-full text-left p-2 rounded-lg transition flex items-center justify-between gap-2 cursor-pointer ${
                      isActive
                        ? 'bg-emerald-600 text-white font-bold shadow'
                        : 'bg-emerald-900/40 hover:bg-emerald-900/80 text-emerald-100'
                    }`}
                  >
                    <div className="flex items-center space-x-2 min-w-0">
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold shrink-0 ${
                          isActive ? 'bg-slate-950 text-emerald-300' : 'bg-emerald-800 text-white'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <div className="truncate">
                        <div className="truncate">{st.instruction}</div>
                        {st.streetName && (
                          <div className="text-[10px] opacity-75 truncate">{st.streetName}</div>
                        )}
                      </div>
                    </div>
                    <span className="font-mono text-[10px] shrink-0 opacity-90">
                      {Math.round((st.distanceKm ?? 0.3) * 1000)}m
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Active Destination & Switch Shelter HUD Bar */}
          <div className="flex items-center justify-between pt-2 border-t border-emerald-400/20 text-xs">
            <div className="flex items-center space-x-1.5 min-w-0">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
              <span className="text-[10px] text-emerald-200/80 uppercase font-mono">Dest:</span>
              <span className="font-bold text-white truncate text-xs">
                {route?.destinationNode?.name || 'Safe Evacuation Shelter'}
              </span>
              {selectedTargetNodeId ? (
                <span className="text-[9px] bg-cyan-950/90 text-cyan-200 border border-cyan-400/50 px-1 py-0.2 rounded font-mono shrink-0">
                  Custom
                </span>
              ) : (
                <span className="text-[9px] bg-emerald-950/90 text-emerald-200 border border-emerald-400/50 px-1 py-0.2 rounded font-mono shrink-0">
                  AI Nearest
                </span>
              )}
            </div>
            {shelters.length > 0 && (
              <button
                id="btn-hud-change-shelter"
                onClick={() => setShowShelterSelector(true)}
                className="text-[11px] text-cyan-200 hover:text-white font-bold underline shrink-0 ml-2 flex items-center space-x-1"
              >
                <Building2 className="w-3 h-3" />
                <span>Change Shelter</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. REROUTE ALERT NOTIFICATION */}
      {showRerouteNotice && (
        <div className="p-3 rounded-xl bg-amber-950/90 border-2 border-amber-500 text-amber-200 flex items-center space-x-3 animate-bounce shadow-xl">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="text-xs">
            <span className="font-bold font-mono uppercase block">Danger Ahead - Rerouting Safe Path</span>
            <span className="text-[11px] opacity-90">Rerouted through higher elevation to avoid inundated sector.</span>
          </div>
        </div>
      )}

      {/* 3. SIMULATION & INTERACTIVE CONTROLS BAR */}
      <div className="p-3 bg-[#0C0C0E] rounded-xl border border-slate-800 space-y-3 shadow-xl">
        {/* Travel Mode & Voice Selectors */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
          {/* Drive vs Walk Mode */}
          <div className="flex items-center bg-slate-900 rounded-lg p-1 border border-slate-800">
            <button
              id="btn-nav-mode-drive"
              onClick={() => handleSelectTravelMode('DRIVE')}
              className={`px-3 py-1 text-xs font-semibold rounded-md flex items-center space-x-1.5 transition-all ${
                travelMode === 'DRIVE' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              <span>DRIVE</span>
            </button>
            <button
              id="btn-nav-mode-walk"
              onClick={() => handleSelectTravelMode('WALK')}
              className={`px-3 py-1 text-xs font-semibold rounded-md flex items-center space-x-1.5 transition-all ${
                travelMode === 'WALK' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Footprints className="w-3.5 h-3.5" />
              <span>WALK</span>
            </button>
          </div>

          {/* Voice Mute & Voice Pack Selector */}
          <div className="flex items-center space-x-1.5">
            <button
              onClick={handleToggleVoiceMute}
              title={isVoiceMuted ? 'Unmute voice navigation' : 'Mute voice navigation'}
              className={`p-1.5 rounded-lg border transition-colors ${
                isVoiceMuted
                  ? 'bg-red-950/40 border-red-900/60 text-red-400'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              {isVoiceMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>

            <button
              onClick={() => setShowVoiceModal(true)}
              title="Configure & Test Voice Packs (English, বাংলা, हिन्दी)"
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg border border-emerald-500/40 bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 text-xs transition font-mono font-bold shadow-sm"
            >
              <span className="text-[10px] text-emerald-400">VOICE:</span>
              <span className="text-[11px] text-white">
                {language === 'bn' ? 'বাংলা' : language === 'hi' ? 'हिन्दी' : 'EN'}
              </span>
            </button>
          </div>
        </div>

        {/* Live Drive Simulation Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleToggleSimulation}
              className={`px-3.5 py-1.5 rounded-lg font-bold text-xs flex items-center space-x-1.5 transition-all shadow-md ${
                isSimulating
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>
                {isSimulating
                  ? travelMode === 'DRIVE'
                    ? 'PAUSE DRIVE'
                    : 'PAUSE WALK'
                  : travelMode === 'DRIVE'
                  ? 'START AUTO-DRIVE SIMULATION'
                  : 'START AUTO-WALK SIMULATION'}
              </span>
            </button>

            {/* Speed Multiplier Pills */}
            <div className="flex items-center space-x-1 text-[11px] font-mono text-slate-300 bg-slate-900 p-1 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 px-1 font-sans">Speed:</span>
              {[0.5, 1, 2, 4].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setSimSpeed(spd)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                    simSpeed === spd
                      ? 'bg-cyan-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                  title={`${spd}x pace`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>

          {/* Trigger Roadblock / Reroute Action */}
          <button
            onClick={handleTriggerReroute}
            className="px-3 py-1.5 rounded-lg bg-red-950/50 hover:bg-red-900/60 text-red-300 border border-red-800/80 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            <span>REPORT ROAD BLOCKED AHEAD</span>
          </button>
        </div>

        {/* 4. BOTTOM TRIP METRICS HUD (White / Slate Bottom Panel) */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-center">
          {/* Arrival Time */}
          <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
            <div className="text-[10px] font-mono uppercase text-slate-400">ETA Arrival</div>
            <div className="text-base sm:text-lg font-bold font-mono text-emerald-400">
              {arrivalTimeStr}
            </div>
          </div>

          {/* Remaining Minutes */}
          <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
            <div className="text-[10px] font-mono uppercase text-slate-400">Est. Time</div>
            <div className="text-base sm:text-lg font-bold font-mono text-white">
              {remainingMinutes} <span className="text-xs text-slate-400 font-sans">min</span>
            </div>
          </div>

          {/* Remaining Distance */}
          <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
            <div className="text-[10px] font-mono uppercase text-slate-400">Distance</div>
            <div className="text-base sm:text-lg font-bold font-mono text-cyan-400">
              {(remainingKm ?? 0).toFixed(1)} <span className="text-xs text-slate-400 font-sans">km</span>
            </div>
          </div>
        </div>
      </div>

      {/* HUD Safe Shelter Selection Modal */}
      {showShelterSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="bg-[#0C0C0E] border border-emerald-700/80 rounded-2xl p-5 max-w-lg w-full shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
                <Building2 className="w-5 h-5" />
                <span>Change Evacuation Destination Shelter</span>
              </div>
              <button
                onClick={() => setShowShelterSelector(false)}
                className="text-slate-400 hover:text-white text-xs font-mono"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Select any verified safe high-ground shelter or hospital. Live navigation will immediately calculate and guide you along the shortest, safest flood-avoiding corridor.
            </p>

            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  onSelectDestinationNode(null);
                  setCurrentStepIndex(0);
                  setSimDistanceTraveled(0);
                  setShowShelterSelector(false);
                  audioEngine.playAlertChime();
                  audioEngine.speakNavigationGuidance(
                    'Rerouting to nearest AI recommended safe shelter.',
                    language,
                    'Rerouting to nearest AI recommended safe shelter'
                  );
                }}
                className="px-3 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-600/60 text-emerald-200 text-xs font-bold flex items-center space-x-1.5 transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Reset to AI Nearest Safe Shelter</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-1">
              {shelters.map((sh) => {
                const isCurrent =
                  selectedTargetNodeId === sh.id ||
                  (!selectedTargetNodeId && route?.destinationNode?.id === sh.id);
                const freeSlots = sh.capacity ? sh.capacity - (sh.currentOccupancy || 0) : 200;

                return (
                  <button
                    key={sh.id}
                    onClick={() => {
                      onSelectDestinationNode(sh.id);
                      setCurrentStepIndex(0);
                      setSimDistanceTraveled(0);
                      setShowShelterSelector(false);
                      audioEngine.playAlertChime();
                      audioEngine.speakNavigationGuidance(
                        `Rerouting to ${sh.name}. Calculating safest path.`,
                        language,
                        `Rerouting to ${sh.name}`
                      );
                    }}
                    className={`p-3 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                      isCurrent
                        ? 'bg-emerald-950/80 border-emerald-400 ring-1 ring-emerald-400 text-emerald-200'
                        : 'bg-slate-900/80 border-slate-800 hover:bg-slate-800 text-slate-200'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-bold flex items-center space-x-1.5 truncate">
                        <span>{sh.isHospital ? '🏥' : '🛡️'}</span>
                        <span className="truncate">{sh.name}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Elevation: {sh.elevationMeters ?? 11}m MSL • Available Beds: {freeSlots}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center space-x-1">
                      {isCurrent ? (
                        <span className="px-2 py-1 rounded bg-emerald-600 text-white font-bold text-[10px] flex items-center space-x-1">
                          <Check className="w-3 h-3" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded bg-slate-800 hover:bg-emerald-700 text-slate-300 hover:text-white font-semibold text-[10px]">
                          Select
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Voice Pack Diagnostics and Test Modal */}
      <VoicePackModal isOpen={showVoiceModal} onClose={() => setShowVoiceModal(false)} />
    </div>
  );
};
