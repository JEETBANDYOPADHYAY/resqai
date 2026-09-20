import React, { useState } from 'react';
import {
  Waves,
  AlertTriangle,
  ShieldAlert,
  Volume2,
  VolumeX,
  Gauge,
  Droplets,
  ArrowUpRight,
  TrendingUp,
  Activity,
  ChevronDown,
  ChevronUp,
  Radio,
  Sliders,
  CheckCircle2,
  Clock,
  Compass,
  Layers,
} from 'lucide-react';
import { SensorTelemetry, MLHazardEvaluation, DamBarrageStation } from '../types';
import { calculateDamRuptureForecast } from '../utils/mlEngine';
import { audioEngine } from '../utils/audioAlert';

interface DamRupturePredictionBannerProps {
  telemetry: SensorTelemetry;
  mlEvaluation: MLHazardEvaluation;
  stations?: DamBarrageStation[];
  dams?: DamBarrageStation[];
  onOpenSpillwayGates?: (stationId: string, gatesToOpen: number) => void;
}

export const DamRupturePredictionBanner: React.FC<DamRupturePredictionBannerProps> = ({
  telemetry,
  mlEvaluation,
  stations,
  dams,
  onOpenSpillwayGates,
}) => {
  const damList = stations || dams || [];
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [selectedStationId, setSelectedStationId] = useState<string>(damList[0]?.id || 'dam-01');
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [activeHydroTab, setActiveHydroTab] = useState<'METRICS' | 'HYDROGRAPH' | 'STATIONS' | 'ACTION_PLAN'>('METRICS');
  const [spillwayOverrideOpen, setSpillwayOverrideOpen] = useState<boolean>(false);

  const forecast = calculateDamRuptureForecast(telemetry);

  // STRICT CONDITIONAL VISIBILITY:
  // ONLY render when dam rupture, severe inflow surge, or flood surcharge is actively detected
  const isFloodScenario = mlEvaluation.predictedDisaster === 'FLASH_FLOOD';
  const isCriticalSurge =
    forecast.isBreachImminent ||
    forecast.isHighSurgeWarning ||
    forecast.ruptureRiskScore >= 60 ||
    (telemetry.damInflowCusecs && telemetry.damInflowCusecs >= 75000) ||
    (telemetry.reservoirCapacityPercent && telemetry.reservoirCapacityPercent >= 88) ||
    (telemetry.damStructuralSeepageRateLps && telemetry.damStructuralSeepageRateLps >= 20) ||
    (isFloodScenario && (telemetry.riverLevel >= 3.6 || telemetry.rainfall >= 65));

  if (!isCriticalSurge) {
    return null;
  }

  const activeStation = damList.find((s) => s.id === selectedStationId) || damList[0];

  const handlePlayAudioWarning = () => {
    if (isAudioMuted) return;
    audioEngine.playDamBreachAlarm();
    setTimeout(() => {
      audioEngine.playHydroSurgeSound();
    }, 600);
  };

  const getAlertColor = () => {
    if (forecast.isBreachImminent) {
      return {
        bg: 'bg-gradient-to-r from-red-950/95 via-rose-950/90 to-blue-950/90',
        border: 'border-red-600/80',
        badge: 'bg-red-600 text-white',
        text: 'text-red-400',
        glow: 'shadow-[0_0_30px_rgba(220,38,38,0.25)]',
      };
    }
    return {
      bg: 'bg-gradient-to-r from-amber-950/90 via-sky-950/85 to-slate-900/90',
      border: 'border-amber-600/70',
      badge: 'bg-amber-600 text-white',
      text: 'text-amber-400',
      glow: 'shadow-[0_0_20px_rgba(217,119,6,0.2)]',
    };
  };

  const colors = getAlertColor();

  return (
    <div
      id="dam-rupture-early-warning"
      className={`w-full rounded-xl border ${colors.border} ${colors.bg} ${colors.glow} backdrop-blur-md transition-all duration-300 overflow-hidden text-slate-100 mb-4 animate-in fade-in slide-in-from-top-4`}
    >
      {/* Header Bar */}
      <div className="p-3.5 sm:p-4.5 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              className={`p-2.5 rounded-lg ${
                forecast.isBreachImminent ? 'bg-red-600 text-white animate-pulse' : 'bg-amber-600 text-white'
              }`}
            >
              <Waves className="w-6 h-6" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-[11px] font-mono uppercase font-black px-2.5 py-0.5 rounded tracking-wider ${colors.badge}`}
              >
                {forecast.isBreachImminent
                  ? 'CWC & NDMA CODE RED: DAM BREACH & SURGE RUPTURE IMMINENT'
                  : 'CWC HYDRO-SURGE WATCH: RESERVOIR SURCHARGE ALERT'}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950/60 border border-blue-700/50 text-blue-300 font-bold flex items-center gap-1">
                <Gauge className="w-3 h-3" />
                FROEHLICH HYDRODYNAMIC MODEL
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2 mt-0.5">
              <span>{activeStation?.name || 'Dam & Barrage Flood Surge Network'}</span>
              <span className="text-xs font-mono font-normal text-slate-400 hidden sm:inline">
                ({activeStation?.riverBasin || 'Hooghly & Damodar River Basin'})
              </span>
            </h3>
          </div>
        </div>

        {/* Action Buttons & Breach Wave ETA Pill */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {forecast.estimatedWaveArrivalMins !== null && (
            <div className="bg-red-950/80 border border-red-700/80 px-3 py-1 rounded-lg flex items-center gap-2">
              <Clock className="w-4 h-4 text-red-400 animate-spin" />
              <div>
                <div className="text-[9px] font-mono text-slate-400 leading-none uppercase">Breach Wave ETA</div>
                <div className="text-xs sm:text-sm font-mono font-black text-red-300">
                  {forecast.estimatedWaveArrivalMins} MINS TO URBAN SECTORS
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handlePlayAudioWarning}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs font-mono flex items-center gap-1.5 text-slate-200 transition-colors"
            title="Sound Hydrodynamic Surge & Breach Alarm"
          >
            {isAudioMuted ? <VolumeX className="w-3.5 h-3.5 text-slate-400" /> : <Volume2 className="w-3.5 h-3.5 text-blue-400" />}
            <span className="hidden xs:inline">Alarm</span>
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors"
            aria-label="Toggle Dam Forecast Panel"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Collapsible Hydrodynamic Dashboard */}
      {isExpanded && (
        <div className="p-3.5 sm:p-5 space-y-4">
          {/* Quick Tab Selector */}
          <div className="flex items-center gap-1 sm:gap-2 border-b border-white/10 pb-2 overflow-x-auto text-xs font-mono">
            <button
              onClick={() => setActiveHydroTab('METRICS')}
              className={`px-3 py-1 rounded-t-md font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeHydroTab === 'METRICS'
                  ? 'bg-white/15 text-white border-b-2 border-cyan-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              Real-time Inflow & Breach Metrics
            </button>
            <button
              onClick={() => setActiveHydroTab('HYDROGRAPH')}
              className={`px-3 py-1 rounded-t-md font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeHydroTab === 'HYDROGRAPH'
                  ? 'bg-white/15 text-white border-b-2 border-cyan-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
              60-Min Inundation Hydrograph
            </button>
            <button
              onClick={() => setActiveHydroTab('STATIONS')}
              className={`px-3 py-1 rounded-t-md font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeHydroTab === 'STATIONS'
                  ? 'bg-white/15 text-white border-b-2 border-cyan-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              Barrage Network ({damList.length})
            </button>
            <button
              onClick={() => setActiveHydroTab('ACTION_PLAN')}
              className={`px-3 py-1 rounded-t-md font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeHydroTab === 'ACTION_PLAN'
                  ? 'bg-white/15 text-white border-b-2 border-cyan-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
              Spillway Release & Evacuation Plan
            </button>
          </div>

          {/* TAB 1: METRICS */}
          {activeHydroTab === 'METRICS' && (
            <div className="space-y-4">
              {/* 4 Core Parameter Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-slate-100">
                {/* 1. Reservoir Surcharge Capacity % */}
                <div
                  className={`p-3 rounded-lg border transition-all ${
                    forecast.reservoirStoragePercent >= 95
                      ? 'bg-red-950/60 border-red-700/80 shadow-md'
                      : forecast.reservoirStoragePercent >= 88
                      ? 'bg-amber-950/40 border-amber-700/60'
                      : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span className="flex items-center gap-1 font-medium text-cyan-300">
                      <Droplets className="w-3.5 h-3.5" />
                      Reservoir Level (FRL)
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">% of FRL</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <div className="text-2xl font-black font-mono tracking-tight text-white">
                      {forecast.reservoirStoragePercent.toFixed(1)}%
                    </div>
                    {forecast.reservoirStoragePercent >= 95 && (
                      <span className="text-[10px] font-mono font-bold text-red-400 px-1.5 py-0.5 rounded bg-red-950 border border-red-800">
                        OVERTOPPING
                      </span>
                    )}
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        forecast.reservoirStoragePercent >= 95
                          ? 'bg-red-500'
                          : forecast.reservoirStoragePercent >= 88
                          ? 'bg-amber-500'
                          : 'bg-cyan-500'
                      }`}
                      style={{ width: `${Math.min(100, forecast.reservoirStoragePercent)}%` }}
                    />
                  </div>
                </div>

                {/* 2. Inflow vs Outflow Deficit */}
                <div
                  className={`p-3 rounded-lg border transition-all ${
                    forecast.netInflowSurgeCusecs > 30000
                      ? 'bg-red-950/60 border-red-700/80'
                      : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span className="flex items-center gap-1 font-medium text-blue-300">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      Inflow / Outflow
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">cusecs</span>
                  </div>
                  <div className="text-xl font-bold font-mono tracking-tight text-white truncate">
                    {forecast.inflowCusecs.toLocaleString()} / {forecast.outflowCusecs.toLocaleString()}
                  </div>
                  <div className="text-[10px] mt-1 font-mono flex items-center justify-between">
                    <span className="text-slate-400">Net Surcharge:</span>
                    <span
                      className={`font-bold ${
                        forecast.netInflowSurgeCusecs > 0 ? 'text-red-400' : 'text-emerald-400'
                      }`}
                    >
                      {forecast.netInflowSurgeCusecs > 0 ? `+${forecast.netInflowSurgeCusecs.toLocaleString()} cusecs` : 'Balanced'}
                    </span>
                  </div>
                </div>

                {/* 3. Embankment Foundation Piping Seepage */}
                <div
                  className={`p-3 rounded-lg border transition-all ${
                    forecast.seepageRateLps >= 25
                      ? 'bg-red-950/60 border-red-700/80 text-red-300'
                      : forecast.seepageRateLps >= 15
                      ? 'bg-amber-950/40 border-amber-700/60'
                      : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span className="flex items-center gap-1 font-medium text-amber-300">
                      <Gauge className="w-3.5 h-3.5" />
                      Foundation Seepage
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">Liters/sec</span>
                  </div>
                  <div className="text-2xl font-black font-mono tracking-tight text-white">
                    {forecast.seepageRateLps.toFixed(1)} <span className="text-xs font-normal text-slate-400">L/s</span>
                  </div>
                  <div className="text-[10px] mt-1 font-mono text-slate-400 truncate">
                    {forecast.seepageRateLps >= 35
                      ? '🚨 Internal Piping Void Detected'
                      : forecast.seepageRateLps >= 18
                      ? 'Piezometric Pressure Elevated'
                      : 'Embankment Core Stable'}
                  </div>
                </div>

                {/* 4. Rupture Risk Score & Failure Mode */}
                <div
                  className={`p-3 rounded-lg border transition-all ${
                    forecast.ruptureRiskScore >= 75
                      ? 'bg-red-950/70 border-red-700 shadow-md'
                      : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span className="flex items-center gap-1 font-medium text-rose-300">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      Breach Probability
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">AI Risk</span>
                  </div>
                  <div className="text-2xl font-black font-mono tracking-tight text-white">
                    {forecast.ruptureRiskScore}%
                  </div>
                  <div className="text-[10px] mt-1 font-mono text-rose-300 font-bold truncate">
                    Mode: {forecast.primaryFailureMechanism.replace(/_/g, ' ')}
                  </div>
                </div>
              </div>

              {/* Dynamic Assessment Banner */}
              <div className="p-3.5 rounded-lg bg-black/40 border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white font-mono uppercase tracking-wider block">
                      HYDROLOGICAL SURGE IMPACT ANALYSIS:
                    </span>
                    <p className="text-slate-300 mt-0.5 leading-relaxed">
                      {forecast.ndmaAdvisory}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 bg-slate-900/90 border border-slate-700/80 px-3 py-2 rounded-lg font-mono text-[11px] text-right">
                  <div className="text-slate-400">Peak Breach Wave Flow:</div>
                  <div className="text-sm font-bold text-cyan-300">
                    ~{forecast.predictedPeakBreachDischargeCusecs.toLocaleString()} cusecs
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Downstream Depth: <span className="text-amber-400 font-bold">+{forecast.downstreamInundationDepthMeters}m</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: HYDROGRAPH */}
          {activeHydroTab === 'HYDROGRAPH' && (
            <div className="space-y-3 bg-black/40 p-4 rounded-lg border border-white/10 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white font-mono flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-400" />
                    Hydrodynamic Dam-Break Inundation Hydrograph (Froehlich Formulation)
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Modeled flood wave attenuation, surge peak timing, and downstream channel water stage across 90-minute timeline.
                  </p>
                </div>
                <div className="text-right font-mono text-[10px] text-slate-400">
                  <span>Downstream Inundation Depth: </span>
                  <span className="text-cyan-300 font-bold">+{forecast.downstreamInundationDepthMeters}m</span>
                </div>
              </div>

              {/* Hydrograph Timeline Chart Bars */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-2">
                {forecast.hydrographPoints.map((pt, idx) => {
                  const maxFlow = Math.max(...forecast.hydrographPoints.map((p) => p.flowCusecs), 200000);
                  const barHeightPercent = Math.round((pt.flowCusecs / maxFlow) * 100);

                  return (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span>T +{pt.timeOffsetMin}m</span>
                        <span className="text-cyan-400 font-bold">{pt.stageMeters}m</span>
                      </div>

                      <div className="h-16 flex items-end my-2 bg-slate-950/60 rounded px-1 py-1">
                        <div
                          className={`w-full rounded transition-all duration-500 ${
                            pt.flowCusecs > 180000 ? 'bg-red-500' : pt.flowCusecs > 100000 ? 'bg-amber-500' : 'bg-blue-500'
                          }`}
                          style={{ height: `${Math.max(15, barHeightPercent)}%` }}
                        />
                      </div>

                      <div className="text-[10px] font-mono text-center font-bold text-slate-200">
                        {Math.round(pt.flowCusecs / 1000)}k cfs
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: STATIONS */}
          {activeHydroTab === 'STATIONS' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {damList.map((st) => {
                  const isStActive = st.id === selectedStationId;
                  const isStCritical = st.alertLevel === 'CODE_RED_RUPTURE_IMMINENT';

                  return (
                    <div
                      key={st.id}
                      onClick={() => setSelectedStationId(st.id)}
                      className={`p-3 rounded-lg border transition-all cursor-pointer text-xs ${
                        isStActive
                          ? 'bg-blue-950/50 border-cyan-400 shadow-md ring-1 ring-cyan-400/50'
                          : isStCritical
                          ? 'bg-red-950/30 border-red-800/60 hover:bg-red-950/50'
                          : 'bg-slate-900/50 border-slate-800 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center justify-between font-mono mb-1">
                        <span className="font-bold text-white text-xs truncate">{st.name}</span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            isStCritical ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {st.alertLevel.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between mt-1">
                        <span>Storage: {st.storageCapacityPercent}% FRL</span>
                        <span className="text-cyan-300 font-bold">
                          Gates: {st.spillwayGatesOpen}/{st.spillwayGatesTotal} Open
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-1 flex items-center justify-between">
                        <span>Inflow: {st.inflowCusecs.toLocaleString()} cfs</span>
                        <span className="text-amber-300">Seepage: {st.seepageRateLps} L/s</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: ACTION PLAN */}
          {activeHydroTab === 'ACTION_PLAN' && (
            <div className="space-y-3 bg-black/40 p-4 rounded-lg border border-white/10 text-xs">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h4 className="font-bold text-white font-mono flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-red-400" />
                    CWC & NDMA Hydraulic Discharge & Evacuation Advisory
                  </h4>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    {forecast.spillwayActionRequired}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setSpillwayOverrideOpen(!spillwayOverrideOpen);
                    if (onOpenSpillwayGates && activeStation) {
                      onOpenSpillwayGates(activeStation.id, activeStation.spillwayGatesTotal);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
                    spillwayOverrideOpen
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40'
                      : 'bg-red-700 hover:bg-red-600 text-white'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  {spillwayOverrideOpen ? 'All 34 Radial Gates 100% Open' : 'Trigger Emergency Gate Release'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] font-mono text-cyan-300 font-bold uppercase mb-1">
                    1. Channel Clear Zone
                  </div>
                  <p className="text-slate-300 text-[11px]">
                    Evacuate all riparian settlements, boat landings, and VIP Road underpasses within 3.5 km of main canal corridor.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] font-mono text-amber-300 font-bold uppercase mb-1">
                    2. High-Ground Shelters
                  </div>
                  <p className="text-slate-300 text-[11px]">
                    Direct all affected population ({forecast.threatenedPopulation.toLocaleString()} citizens) to verified flood shelters above 8m elevation.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] font-mono text-emerald-300 font-bold uppercase mb-1">
                    3. Emergency Inundation Routing
                  </div>
                  <p className="text-slate-300 text-[11px]">
                    Dynamic route planner has automatically blocked low-elevation underpasses and rerouted rescue units to elevated flyovers.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
