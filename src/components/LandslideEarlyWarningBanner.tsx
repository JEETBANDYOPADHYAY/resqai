import React, { useState } from 'react';
import {
  Mountain,
  AlertTriangle,
  TrendingDown,
  Gauge,
  Droplets,
  Clock,
  Volume2,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Activity,
  Layers,
  HelpCircle,
  Radio,
  ExternalLink,
} from 'lucide-react';
import { SensorTelemetry, MLHazardEvaluation, LandslideStation } from '../types';
import { audioEngine } from '../utils/audioAlert';

interface LandslideEarlyWarningBannerProps {
  telemetry: SensorTelemetry;
  mlEvaluation: MLHazardEvaluation;
  stations: LandslideStation[];
  onFocusStation?: (stationId: string) => void;
}

export const LandslideEarlyWarningBanner: React.FC<LandslideEarlyWarningBannerProps> = ({
  telemetry,
  mlEvaluation,
  stations,
  onFocusStation,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isRumblePlaying, setIsRumblePlaying] = useState<boolean>(false);
  const [selectedStationId, setSelectedStationId] = useState<string>(stations[0]?.id || 'station-ls-01');

  const displacement = telemetry.slopeDisplacementRateMmPerHour ?? 1.8;
  const porePressure = telemetry.poreWaterPressureKPa ?? 22;
  const fos = telemetry.factorOfSafety ?? 1.42;
  const slopeAngle = telemetry.slopeAngleDeg ?? 38;
  const soilSat = telemetry.soilSaturation ?? 85;

  const isCritical = fos < 1.05 || displacement > 8.0 || mlEvaluation.predictedDisaster === 'LANDSLIDE';
  const isWarning = !isCritical && (fos < 1.25 || displacement > 4.5 || (soilSat > 90 && porePressure > 40));
  const isDetected = isCritical || isWarning || mlEvaluation.predictedDisaster === 'LANDSLIDE';

  if (!isDetected) {
    return null;
  }

  const activeStation = stations.find((s) => s.id === selectedStationId) || stations[0];

  const handlePlayRumble = () => {
    setIsRumblePlaying(true);
    audioEngine.playLandslideRumbleSound();
    setTimeout(() => setIsRumblePlaying(false), 3000);
  };

  const handlePlayAlarm = () => {
    audioEngine.playLandslideWarningTone();
  };

  return (
    <div
      id="landslide-early-warning-banner"
      className={`rounded-xl border transition-all duration-300 shadow-2xl relative overflow-hidden ${
        isCritical
          ? 'bg-gradient-to-r from-stone-950 via-amber-950/40 to-stone-950 border-amber-500/80 shadow-amber-950/30'
          : isWarning
          ? 'bg-gradient-to-r from-stone-950 via-orange-950/30 to-stone-950 border-orange-600/50'
          : 'bg-[#0E0E11] border-slate-800 text-slate-300'
      }`}
    >
      {/* Top Header Bar */}
      <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-800/80">
        <div className="flex items-start sm:items-center gap-3.5">
          <div
            className={`p-3 rounded-xl border flex items-center justify-center shrink-0 ${
              isCritical
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse'
                : isWarning
                ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                : 'bg-stone-800 text-stone-300 border-stone-700'
            }`}
          >
            <Mountain className="w-6 h-6" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-stone-800 border border-stone-700 text-stone-300 font-mono flex items-center gap-1">
                <Radio className="w-3 h-3 text-amber-400 animate-pulse" />
                GSI / NDMA EARLY WARNING (LEWS)
              </span>

              {isCritical ? (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-600 text-white font-mono flex items-center gap-1 animate-bounce">
                  <AlertTriangle className="w-3 h-3" />
                  CODE RED: IMMINENT SLOPE RUPTURE
                </span>
              ) : isWarning ? (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/60 text-amber-300 font-mono">
                  LEVEL-2 TERTIARY CREEP WATCH
                </span>
              ) : (
                <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 font-mono">
                  EQUILIBRIUM STABLE
                </span>
              )}

              <span className="text-xs font-mono text-stone-400">
                5 Telemetry Inclinometer Boreholes Active
              </span>
            </div>

            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight mt-1 flex items-center gap-2">
              Landslide & Slope Stability Detection System
              {isCritical && (
                <span className="text-xs font-normal text-amber-400 font-mono bg-amber-950/50 px-2 py-0.5 rounded border border-amber-800/50">
                  FoS &lt; 1.0 Threshold Breached
                </span>
              )}
            </h2>
          </div>
        </div>

        {/* Action Controls & Sound Simulators */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 self-end lg:self-center">
          <button
            id="play-landslide-rumble-btn"
            onClick={handlePlayRumble}
            disabled={isRumblePlaying}
            className="px-3 py-1.5 rounded-lg bg-stone-800/90 hover:bg-stone-700 active:scale-95 border border-stone-700 text-xs font-mono text-stone-200 transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            title="Simulate acoustic seismic earth grinding and slope fracture audio"
          >
            <Volume2 className={`w-3.5 h-3.5 ${isRumblePlaying ? 'text-amber-400 animate-spin' : 'text-stone-400'}`} />
            {isRumblePlaying ? 'Rumbling...' : 'Test Earth Rumble Audio'}
          </button>

          <button
            id="play-landslide-alarm-btn"
            onClick={handlePlayAlarm}
            className="px-3 py-1.5 rounded-lg bg-amber-950/50 hover:bg-amber-900/60 active:scale-95 border border-amber-700/60 text-xs font-mono text-amber-300 transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Activity className="w-3.5 h-3.5" />
            Shear Alarm Tone
          </button>

          <button
            id="toggle-landslide-directives-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 active:scale-95 border border-stone-700 text-xs font-mono text-stone-200 transition-all flex items-center gap-1"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Hide NDMA Protocol
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                NDMA Directives ({isCritical ? 'Mandatory' : 'Advisory'})
              </>
            )}
          </button>
        </div>
      </div>

      {/* Primary Metrics Grid (4 Core Geotechnical Indices) */}
      <div className="p-4 sm:p-5 grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4 bg-stone-950/60">
        {/* Metric 1: Factor of Safety (FoS) */}
        <div
          className={`p-3.5 rounded-lg border transition-all ${
            fos < 1.05
              ? 'bg-red-950/40 border-red-700 text-red-300 shadow-md shadow-red-950/40'
              : fos < 1.3
              ? 'bg-amber-950/30 border-amber-700 text-amber-300'
              : 'bg-stone-900/70 border-stone-800 text-stone-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-stone-400 mb-1">
            <span className="flex items-center gap-1 font-semibold text-[11px]">
              <Gauge className="w-3.5 h-3.5 text-amber-400" />
              Factor of Safety (FoS)
            </span>
            <span className="text-[10px] font-mono">&tau;<sub>f</sub> / &tau;<sub>d</sub></span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
              {fos.toFixed(2)}
            </span>
            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
              fos < 1.05 ? 'bg-red-600 text-white' : fos < 1.3 ? 'bg-amber-500/30 text-amber-300' : 'bg-emerald-950 text-emerald-400'
            }`}>
              {fos < 1.05 ? 'CRITICAL SLIP' : fos < 1.3 ? 'CREEP ALERT' : 'SAFE'}
            </span>
          </div>
          <p className="text-[10px] text-stone-400 mt-1 font-mono">
            {fos < 1.05 ? '⚠️ Shear stress exceeds soil shear resistance' : 'Threshold failure limit: 1.05'}
          </p>
        </div>

        {/* Metric 2: Inclinometer Shear Displacement Rate */}
        <div
          className={`p-3.5 rounded-lg border transition-all ${
            displacement >= 10.0
              ? 'bg-red-950/40 border-red-700 text-red-300 shadow-md'
              : displacement >= 4.0
              ? 'bg-amber-950/30 border-amber-700 text-amber-300'
              : 'bg-stone-900/70 border-stone-800 text-stone-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-stone-400 mb-1">
            <span className="flex items-center gap-1 font-semibold text-[11px]">
              <TrendingDown className="w-3.5 h-3.5 text-red-400" />
              Creep Displacement Rate
            </span>
            <span className="text-[10px] font-mono">mm / h</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
              {displacement.toFixed(1)}
            </span>
            <span className="text-xs font-mono text-stone-400">mm/hr</span>
          </div>
          <p className="text-[10px] text-stone-400 mt-1 font-mono">
            {displacement > 10.0 ? '⚡ Tertiary Creep: Imminent Rupture' : displacement > 4.0 ? 'Accelerated sub-surface shear' : 'Normal basal settling (<2mm/h)'}
          </p>
        </div>

        {/* Metric 3: Hydrostatic Pore Water Pressure & Moisture */}
        <div
          className={`p-3.5 rounded-lg border transition-all ${
            porePressure > 40 || soilSat > 90
              ? 'bg-amber-950/30 border-amber-700 text-amber-300'
              : 'bg-stone-900/70 border-stone-800 text-stone-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-stone-400 mb-1">
            <span className="flex items-center gap-1 font-semibold text-[11px]">
              <Droplets className="w-3.5 h-3.5 text-cyan-400" />
              Pore Water Pressure (u)
            </span>
            <span className="text-[10px] font-mono">kPa</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
              {porePressure.toFixed(0)}
            </span>
            <span className="text-xs font-mono text-stone-400">kPa / {soilSat.toFixed(0)}% Sat</span>
          </div>
          <p className="text-[10px] text-stone-400 mt-1 font-mono">
            {porePressure > 40 ? '⚠️ High buoyancy destroys effective stress' : 'Hydrostatic baseline < 25 kPa'}
          </p>
        </div>

        {/* Metric 4: Saito Creep Rupture ETA Window */}
        <div
          className={`p-3.5 rounded-lg border transition-all ${
            isCritical
              ? 'bg-red-950/50 border-red-600 text-red-300'
              : 'bg-stone-900/70 border-stone-800 text-stone-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-stone-400 mb-1">
            <span className="flex items-center gap-1 font-semibold text-[11px]">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Saito Rupture ETA Window
            </span>
            <span className="text-[10px] font-mono">t<sub>f</sub> Model</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-amber-400">
              {isCritical ? '18 - 40 min' : isWarning ? '~2 - 4 hrs' : 'Stable'}
            </span>
          </div>
          <p className="text-[10px] text-stone-400 mt-1 font-mono">
            {isCritical ? '🚨 Complete slope toe evacuation window' : 'Inverse velocity curve normal'}
          </p>
        </div>
      </div>

      {/* Real-time Inclinometer Station Selector */}
      <div className="p-3.5 sm:p-4 bg-stone-900/80 border-t border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            Monitoring Borehole Stations:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {stations.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setSelectedStationId(s.id);
                  onFocusStation?.(s.id);
                }}
                className={`px-2.5 py-1 rounded text-[11px] font-mono transition-all flex items-center gap-1 border ${
                  selectedStationId === s.id
                    ? 'bg-amber-600 text-white border-amber-400 font-bold shadow'
                    : s.criticalThresholdMet
                    ? 'bg-red-950/60 text-red-300 border-red-800/80 hover:bg-red-900/80'
                    : 'bg-stone-800 text-stone-400 border-stone-700 hover:bg-stone-700'
                }`}
              >
                {s.criticalThresholdMet && <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />}
                {s.name.split(' ')[0]} (FoS {(s.factorOfSafety ?? 1.5).toFixed(2)})
              </button>
            ))}
          </div>
        </div>

        {activeStation && (
          <div className="text-[11px] font-mono text-stone-300 flex items-center gap-2 shrink-0">
            <span className="text-stone-400">Strata:</span>
            <span className="text-amber-300 font-semibold">{activeStation.soilType}</span>
            <span className="text-stone-500">|</span>
            <span className="text-stone-400">Angle:</span>
            <span className="text-white font-bold">{activeStation.slopeAngleDeg}&deg;</span>
          </div>
        )}
      </div>

      {/* Expandable NDMA & Geological Survey of India Evacuation Protocols */}
      {isExpanded && (
        <div className="p-4 sm:p-5 bg-[#09090C] border-t border-stone-800 space-y-4 text-xs animate-fadeIn">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>National Disaster Management Authority (NDMA) & GSI Landslide Directives</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* Directive 1 */}
            <div className="p-3.5 rounded-lg bg-stone-900/60 border border-stone-800 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-amber-400">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-xs font-mono">1</span>
                <span>Immediate Run-Out Zone Clearance</span>
              </div>
              <p className="text-stone-400 text-[11px] leading-relaxed">
                Evacuate all settlements located at the toe or base of steep embankments, river bluffs, and highway cuttings. Debris flows travel at 25-45 km/h with catastrophic kinetic impact.
              </p>
            </div>

            {/* Directive 2 */}
            <div className="p-3.5 rounded-lg bg-stone-900/60 border border-stone-800 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-cyan-400">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center text-xs font-mono">2</span>
                <span>Move Perpendicular to Debris Paths</span>
              </div>
              <p className="text-stone-400 text-[11px] leading-relaxed">
                If caught in an active slide area, run lateral/perpendicular to the flow path towards stable bedrock ridges. Never run downstream in natural drainage gullies or culverts.
              </p>
            </div>

            {/* Directive 3 */}
            <div className="p-3.5 rounded-lg bg-stone-900/60 border border-stone-800 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-rose-400">
                <span className="w-5 h-5 rounded-full bg-rose-500/20 flex items-center justify-center text-xs font-mono">3</span>
                <span>Precursor Creep Warning Indicators</span>
              </div>
              <p className="text-stone-400 text-[11px] leading-relaxed">
                Watch for tension cracks in tarmac/pavements, tilting utility poles, leaning trees (pistol-butt curvature), jamming doors/windows, and sudden muddiness in hillside springs.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-stone-900/40 border border-stone-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] font-mono text-stone-400">
            <span>
              Calculated Geotechnical Criterion: Coulomb-Terzaghi Shear Criterion &tau; = c' + (&sigma; - u) tan &phi;'
            </span>
            <span className="text-amber-400 flex items-center gap-1">
              Active Inclinometer Network: 5 Core Boreholes Ingesting
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
