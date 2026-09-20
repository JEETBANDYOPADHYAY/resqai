import React, { useState } from 'react';
import {
  CloudRain,
  Wind,
  Gauge,
  Droplets,
  Thermometer,
  Waves,
  Activity,
  Sliders,
  RotateCcw,
  Zap,
  Radio,
  Flame,
  Mountain,
  TrendingDown,
} from 'lucide-react';
import { SensorTelemetry, MLHazardEvaluation } from '../types';

interface TelemetryPanelProps {
  telemetry: SensorTelemetry;
  mlEvaluation: MLHazardEvaluation;
  onUpdateTelemetry: (updated: Partial<SensorTelemetry>) => void;
  onResetTelemetry: () => void;
}

export const TelemetryPanel: React.FC<TelemetryPanelProps> = ({
  telemetry,
  mlEvaluation,
  onUpdateTelemetry,
  onResetTelemetry,
}) => {
  const [isManualOverrideOpen, setIsManualOverrideOpen] = useState(false);

  const strikes = telemetry.lightningStrikesPerMin ?? 0;
  const distance = telemetry.lightningDistanceKm ?? 15;
  const cape = telemetry.capeIndex ?? 1200;
  const displacement = telemetry.slopeDisplacementRateMmPerHour ?? 1.2;
  const porePressure = telemetry.poreWaterPressureKPa ?? 18;
  const fos = telemetry.factorOfSafety ?? 1.58;
  const slopeAngle = telemetry.slopeAngleDeg ?? 35;
  const damInflow = telemetry.damInflowCusecs ?? 35000;
  const damOutflow = telemetry.damOutflowDischargeCusecs ?? 30000;
  const reservoirStorage = telemetry.reservoirCapacityPercent ?? 65;
  const damSeepage = telemetry.damStructuralSeepageRateLps ?? 3.5;

  return (
    <div className="bg-[#0C0C0E] rounded-xl border border-slate-800 p-4 sm:p-5 shadow-2xl flex flex-col space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-red-950/40 text-red-400 border border-red-900/50 shrink-0">
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Sensor Telemetry & Ingestion
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950/40 text-cyan-400 border border-blue-800/50 flex items-center gap-1 font-bold">
                <Waves className="w-2.5 h-2.5" />
                Dam Hydro-Vector
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live multi-hazard edge station telemetry for North 24 Parganas, Kolkata, DVC Dam Network & North Bengal
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsManualOverrideOpen(!isManualOverrideOpen)}
          className={`flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all shrink-0 ${
            isManualOverrideOpen
              ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-900/20'
              : 'bg-slate-900 text-slate-300 hover:text-white border-slate-800 hover:bg-slate-800'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span className="font-mono text-[11px]">
            {isManualOverrideOpen ? 'Hide Sliders' : 'Manual Override'}
          </span>
        </button>
      </div>

      {/* Grid of Key Telemetry Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 sm:gap-3">
        {/* Dam Inflow */}
        <div className={`p-3 rounded-lg border transition-all ${
          damInflow > 100000 ? 'bg-red-950/40 border-red-700 text-red-300 shadow-md' : 'bg-slate-900/50 border-slate-800 text-slate-200'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1 font-medium text-[11px] text-cyan-300 truncate">
              <Waves className="w-3.5 h-3.5 shrink-0" />
              Inflow Rate
            </span>
            <span className="text-[10px] font-mono text-slate-500">cfs</span>
          </div>
          <div className="text-base sm:text-lg font-bold font-mono tracking-tight text-white truncate">
            {Math.round(damInflow / 1000)}k cfs
          </div>
          <div className="text-[10px] mt-1 font-mono text-cyan-400 truncate">
            {reservoirStorage.toFixed(0)}% Capacity
          </div>
        </div>

        {/* Rainfall */}
        <div className={`p-3 rounded-lg border transition-all ${
          telemetry.rainfall > 50 ? 'bg-red-950/30 border-red-800/60 text-red-400' : 'bg-slate-900/50 border-slate-800 text-slate-200'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1 font-medium text-[11px] truncate">
              <CloudRain className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              Rainfall
            </span>
            <span className="text-[10px] font-mono text-slate-500">mm/h</span>
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono tracking-tight text-white">
            {telemetry.rainfall.toFixed(1)}
          </div>
          <div className="text-[10px] mt-1 font-mono text-slate-400 truncate">
            {telemetry.rainfall > 60 ? '⚠️ Flood Warning' : telemetry.rainfall > 25 ? 'Heavy Rain' : 'Normal'}
          </div>
        </div>

        {/* River Level */}
        <div className={`p-3 rounded-lg border transition-all ${
          telemetry.riverLevel > 3.5 ? 'bg-red-950/30 border-red-800/60 text-red-400' : 'bg-slate-900/50 border-slate-800 text-slate-200'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1 font-medium text-[11px] truncate">
              <Waves className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              River Stage
            </span>
            <span className="text-[10px] font-mono text-slate-500">meters</span>
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono tracking-tight text-white">
            {telemetry.riverLevel.toFixed(2)}m
          </div>
          <div className="text-[10px] mt-1 font-mono text-slate-400 truncate">
            Critical: <span className="font-mono text-red-400 font-bold">3.50m</span>
          </div>
        </div>

        {/* Landslide Factor of Safety (FoS) */}
        <div className={`p-3 rounded-lg border transition-all ${
          fos < 1.05
            ? 'bg-red-950/40 border-red-700 text-red-300 shadow-md'
            : fos < 1.3
            ? 'bg-amber-950/30 border-amber-700 text-amber-300'
            : 'bg-stone-900/70 border-stone-800 text-stone-200'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1 font-medium text-[11px] text-amber-300 truncate">
              <Mountain className="w-3.5 h-3.5 shrink-0" />
              Slope FoS
            </span>
            <span className="text-[10px] font-mono text-stone-500">Ratio</span>
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono tracking-tight text-white">
            {fos.toFixed(2)}
          </div>
          <div className="text-[10px] mt-1 font-mono text-stone-400 truncate">
            {fos < 1.05 ? '🚨 Imminent Slip' : fos < 1.3 ? 'Creep Alert' : 'Slope Stable'}
          </div>
        </div>

        {/* Landslide Inclinometer Creep */}
        <div className={`p-3 rounded-lg border transition-all ${
          displacement > 8.0 ? 'bg-red-950/40 border-red-700 text-red-300' : 'bg-slate-900/50 border-slate-800 text-slate-200'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1 font-medium text-[11px] text-red-300 truncate">
              <TrendingDown className="w-3.5 h-3.5 shrink-0" />
              Displacement
            </span>
            <span className="text-[10px] font-mono text-stone-500">mm/h</span>
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono tracking-tight text-white">
            {displacement.toFixed(1)}
          </div>
          <div className="text-[10px] mt-1 font-mono text-stone-400 truncate">
            {porePressure.toFixed(0)} kPa Pore Pres.
          </div>
        </div>

        {/* Foundation Piping Seepage */}
        <div className={`p-3 rounded-lg border transition-all ${
          damSeepage >= 25 ? 'bg-red-950/40 border-red-700 text-red-300' : 'bg-slate-900/50 border-slate-800 text-slate-200'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1 font-medium text-[11px] text-amber-300 truncate">
              <Gauge className="w-3.5 h-3.5 shrink-0" />
              Dam Seepage
            </span>
            <span className="text-[10px] font-mono text-slate-500">L/s</span>
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono tracking-tight text-white">
            {damSeepage.toFixed(1)}
          </div>
          <div className="text-[10px] mt-1 font-mono text-amber-400 truncate">
            {damSeepage >= 25 ? '🚨 Piping Hazard' : 'Embankment OK'}
          </div>
        </div>

        {/* Lightning Frequency */}
        <div className={`p-3 rounded-lg border transition-all ${
          strikes >= 15 ? 'bg-amber-950/40 border-amber-600/80 text-amber-300 shadow-md shadow-amber-950/40' : 'bg-slate-900/50 border-slate-800 text-slate-200'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1 font-medium text-[11px] text-amber-400 truncate">
              <Zap className="w-3.5 h-3.5 fill-current shrink-0" />
              Lightning
            </span>
            <span className="text-[10px] font-mono text-slate-500">/min</span>
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono tracking-tight text-amber-400">
            {strikes}
          </div>
          <div className="text-[10px] mt-1 font-mono text-slate-400 truncate">
            {strikes > 20 ? '⚡ Red Swarm' : strikes > 5 ? 'Active Flash' : 'Clear'}
          </div>
        </div>

        {/* Wind Speed */}
        <div className={`p-3 rounded-lg border transition-all ${
          telemetry.windSpeed > 80 ? 'bg-amber-950/30 border-amber-800/60 text-amber-400' : 'bg-slate-900/50 border-slate-800 text-slate-200'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1 font-medium text-[11px] truncate">
              <Wind className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              Wind Speed
            </span>
            <span className="text-[10px] font-mono text-slate-500">km/h</span>
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono tracking-tight text-white">
            {telemetry.windSpeed.toFixed(0)}
          </div>
          <div className="text-[10px] mt-1 font-mono text-slate-400 truncate">
            {telemetry.windSpeed > 90 ? '🌪️ Gale Gusts' : 'Breeze'}
          </div>
        </div>
      </div>

      {/* Manual Telemetry Override Sliders Drawer */}
      {isManualOverrideOpen && (
        <div className="p-4 rounded-lg bg-[#09090B] border border-slate-800 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="text-xs font-bold text-slate-200 flex items-center gap-2 font-mono">
              <Sliders className="w-4 h-4 text-red-400" />
              <span>Manual Telemetry Ingestion Override</span>
            </div>
            <button
              onClick={onResetTelemetry}
              className="flex items-center space-x-1 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="font-mono text-[11px]">Reset to Scenario</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* Dam Inflow Rate Slider */}
            <div className="p-2.5 rounded-lg bg-blue-950/40 border border-blue-800/60">
              <div className="flex justify-between mb-1 text-slate-300 font-medium">
                <span className="text-[11px] text-cyan-300 font-mono font-bold flex items-center gap-1">
                  <Waves className="w-3 h-3 text-cyan-400" />
                  Inflow Rate:
                </span>
                <span className="font-mono text-cyan-300 font-bold">{damInflow.toLocaleString()} cfs</span>
              </div>
              <input
                type="range"
                min="10000"
                max="220000"
                step="5000"
                value={damInflow}
                onChange={(e) => onUpdateTelemetry({ damInflowCusecs: parseInt(e.target.value, 10) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>

            {/* Reservoir Capacity Level Slider */}
            <div className="p-2.5 rounded-lg bg-blue-950/40 border border-blue-800/60">
              <div className="flex justify-between mb-1 text-slate-300 font-medium">
                <span className="text-[11px] text-cyan-300 font-mono font-bold flex items-center gap-1">
                  <Droplets className="w-3 h-3 text-blue-400" />
                  Reservoir Level:
                </span>
                <span className={`font-mono font-bold ${reservoirStorage >= 95 ? 'text-red-400' : 'text-cyan-300'}`}>
                  {reservoirStorage.toFixed(1)}%
                </span>
              </div>
              <input
                type="range"
                min="30"
                max="100"
                step="0.5"
                value={reservoirStorage}
                onChange={(e) => onUpdateTelemetry({ reservoirCapacityPercent: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            {/* Dam Foundation Seepage Rate Slider */}
            <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-800/60">
              <div className="flex justify-between mb-1 text-slate-300 font-medium">
                <span className="text-[11px] text-amber-300 font-mono font-bold flex items-center gap-1">
                  <Gauge className="w-3 h-3 text-amber-400" />
                  Dam Seepage:
                </span>
                <span className={`font-mono font-bold ${damSeepage >= 25 ? 'text-red-400' : 'text-amber-300'}`}>
                  {damSeepage.toFixed(1)} L/s
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="60.0"
                step="0.5"
                value={damSeepage}
                onChange={(e) => onUpdateTelemetry({ damStructuralSeepageRateLps: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            {/* Spillway Outflow Rate Slider */}
            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
              <div className="flex justify-between mb-1 text-slate-300 font-medium">
                <span className="text-[11px] text-slate-300 font-mono font-bold">
                  Spillway Discharge:
                </span>
                <span className="font-mono text-slate-200 font-bold">{damOutflow.toLocaleString()} cfs</span>
              </div>
              <input
                type="range"
                min="10000"
                max="180000"
                step="5000"
                value={damOutflow}
                onChange={(e) => onUpdateTelemetry({ damOutflowDischargeCusecs: parseInt(e.target.value, 10) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-slate-400"
              />
            </div>

            {/* Slope Inclination Angle Slider (Geotechnical DEM) */}
            <div className="p-2.5 rounded-lg bg-stone-900/80 border border-amber-800/50">
              <div className="flex justify-between mb-1 text-slate-300 font-medium">
                <span className="text-[11px] text-amber-300 font-mono font-bold flex items-center gap-1">
                  <Mountain className="w-3 h-3 text-amber-400" />
                  Terrain Slope Angle:
                </span>
                <span className="font-mono text-amber-400 font-bold">{((telemetry as any).slopeAngleDeg ?? 35).toFixed(0)}° {((telemetry as any).slopeAngleDeg ?? 35) < 15 ? '(Flat/Plains)' : ((telemetry as any).slopeAngleDeg ?? 35) < 30 ? '(Moderate Slope)' : '(Steep Escarpment)'}</span>
              </div>
              <input
                type="range"
                min="2"
                max="65"
                step="1"
                value={(telemetry as any).slopeAngleDeg ?? 35}
                onChange={(e) => onUpdateTelemetry({ slopeAngleDeg: parseInt(e.target.value, 10) } as any)}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            {/* Landslide Displacement Slider */}
            <div className="p-2.5 rounded-lg bg-stone-900/80 border border-amber-800/50">
              <div className="flex justify-between mb-1 text-slate-300 font-medium">
                <span className="text-[11px] text-amber-300 font-mono font-bold flex items-center gap-1">
                  <TrendingDown className="w-3 h-3 text-red-400" />
                  Displacement:
                </span>
                <span className="font-mono text-amber-400 font-bold">{displacement.toFixed(1)} mm/h</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="25.0"
                step="0.2"
                value={displacement}
                onChange={(e) => onUpdateTelemetry({ slopeDisplacementRateMmPerHour: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            {/* Factor of Safety Slider */}
            <div className="p-2.5 rounded-lg bg-stone-900/80 border border-amber-800/50">
              <div className="flex justify-between mb-1 text-slate-300 font-medium">
                <span className="text-[11px] text-amber-300 font-mono font-bold flex items-center gap-1">
                  <Mountain className="w-3 h-3 text-amber-400" />
                  Factor of Safety:
                </span>
                <span className={`font-mono font-bold ${fos < 1.05 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {fos.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0.60"
                max="2.20"
                step="0.02"
                value={fos}
                onChange={(e) => onUpdateTelemetry({ factorOfSafety: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-500"
              />
            </div>

            {/* Pore Water Pressure Slider */}
            <div className="p-2.5 rounded-lg bg-stone-900/80 border border-stone-800">
              <div className="flex justify-between mb-1 text-slate-300 font-medium">
                <span className="text-[11px] text-cyan-300 font-mono font-bold flex items-center gap-1">
                  <Droplets className="w-3 h-3 text-cyan-400" />
                  Pore Pressure:
                </span>
                <span className="font-mono text-cyan-400 font-bold">{porePressure.toFixed(0)} kPa</span>
              </div>
              <input
                type="range"
                min="0"
                max="80"
                step="1"
                value={porePressure}
                onChange={(e) => onUpdateTelemetry({ poreWaterPressureKPa: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>

            {/* Lightning Flash Rate Slider */}
            <div className="p-2.5 rounded-lg bg-amber-950/20 border border-amber-800/40">
              <div className="flex justify-between mb-1 text-slate-300 font-medium">
                <span className="text-[11px] text-amber-300 font-mono font-bold flex items-center gap-1">
                  <Zap className="w-3 h-3 fill-current" />
                  Lightning:
                </span>
                <span className="font-mono text-amber-400 font-bold">{strikes} strikes/min</span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                step="1"
                value={strikes}
                onChange={(e) => onUpdateTelemetry({ lightningStrikesPerMin: parseInt(e.target.value, 10) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            {/* Rainfall Slider */}
            <div>
              <div className="flex justify-between mb-1 text-slate-300 font-medium">
                <span className="text-[11px] text-slate-400">Rainfall:</span>
                <span className="font-mono text-cyan-400 font-bold">{(telemetry.rainfall ?? 0).toFixed(1)} mm/h</span>
              </div>
              <input
                type="range"
                min="0"
                max="150"
                step="1"
                value={telemetry.rainfall ?? 0}
                onChange={(e) => onUpdateTelemetry({ rainfall: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-500"
              />
            </div>

            {/* River Level Slider */}
            <div>
              <div className="flex justify-between mb-1 text-slate-300 font-medium">
                <span className="text-[11px] text-slate-400">River Stage:</span>
                <span className="font-mono text-blue-400 font-bold">{(telemetry.riverLevel ?? 1.5).toFixed(2)} m</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="6.0"
                step="0.05"
                value={telemetry.riverLevel ?? 1.5}
                onChange={(e) => onUpdateTelemetry({ riverLevel: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            {/* Wind Speed Slider */}
            <div>
              <div className="flex justify-between mb-1 text-slate-300 font-medium">
                <span className="text-[11px] text-slate-400">Wind Speed:</span>
                <span className="font-mono text-teal-400 font-bold">{(telemetry.windSpeed ?? 0).toFixed(0)} km/h</span>
              </div>
              <input
                type="range"
                min="0"
                max="180"
                step="2"
                value={telemetry.windSpeed ?? 0}
                onChange={(e) => onUpdateTelemetry({ windSpeed: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
              />
            </div>

            {/* Barometric Pressure Slider */}
            <div>
              <div className="flex justify-between mb-1 text-slate-300 font-medium">
                <span className="text-[11px] text-slate-400">Pressure:</span>
                <span className="font-mono text-indigo-400 font-bold">{(telemetry.pressure ?? 1013).toFixed(1)} hPa</span>
              </div>
              <input
                type="range"
                min="920"
                max="1035"
                step="1"
                value={telemetry.pressure ?? 1013}
                onChange={(e) => onUpdateTelemetry({ pressure: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
