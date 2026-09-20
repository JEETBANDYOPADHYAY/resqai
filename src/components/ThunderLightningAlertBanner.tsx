import React, { useState } from 'react';
import {
  Zap,
  Volume2,
  ShieldAlert,
  Radio,
  AlertTriangle,
  Clock,
  Compass,
  Flame,
  Info,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import { SensorTelemetry, MLHazardEvaluation, LightningStrike } from '../types';
import { audioEngine } from '../utils/audioAlert';

interface ThunderLightningAlertBannerProps {
  telemetry: SensorTelemetry;
  mlEvaluation: MLHazardEvaluation;
  lightningStrikes: LightningStrike[];
  onTriggerFlashEffect?: () => void;
}

export const ThunderLightningAlertBanner: React.FC<ThunderLightningAlertBannerProps> = ({
  telemetry,
  mlEvaluation,
  lightningStrikes,
  onTriggerFlashEffect,
}) => {
  const [isRulesExpanded, setIsRulesExpanded] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const strikesPerMin = telemetry.lightningStrikesPerMin ?? 0;
  const distanceKm = telemetry.lightningDistanceKm ?? 15;
  const cape = telemetry.capeIndex ?? 1200;

  // Determine alert level based on strike frequency and proximity
  const isCritical = strikesPerMin >= 20 || distanceKm <= 2.5 || mlEvaluation.predictedDisaster === 'THUNDER_LIGHTNING';
  const isElevated = strikesPerMin > 5 || distanceKm <= 8.0 || cape > 2000;

  // Flash to Bang approximation (Sound travels ~343 m/s -> ~3 seconds per km)
  const flashToThunderSec = Math.max(1, Math.round(distanceKm * 3));

  const handleTestThunder = () => {
    setIsPlayingAudio(true);
    audioEngine.playThunderAlertSound();
    if (onTriggerFlashEffect) {
      onTriggerFlashEffect();
    }
    setTimeout(() => setIsPlayingAudio(false), 2600);
  };

  const handleTestWarningBeep = () => {
    audioEngine.playLightningWarningTone();
  };

  return (
    <div
      className={`rounded-xl border transition-all duration-300 shadow-2xl overflow-hidden ${
        isCritical
          ? 'bg-gradient-to-r from-amber-950/70 via-red-950/60 to-purple-950/70 border-amber-500/60 shadow-amber-950/40'
          : isElevated
          ? 'bg-gradient-to-r from-slate-900/90 via-amber-950/30 to-slate-900/90 border-amber-700/50'
          : 'bg-[#0C0C0E] border-slate-800'
      }`}
    >
      {/* Top Banner Header */}
      <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left Side: Badge & Title */}
        <div className="flex items-start sm:items-center space-x-3">
          <div
            className={`p-2.5 rounded-xl border flex items-center justify-center shrink-0 ${
              isCritical
                ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-lg shadow-amber-500/40 animate-pulse'
                : 'bg-amber-950/40 text-amber-400 border-amber-800/60'
            }`}
          >
            <Zap className="w-5 h-5 fill-current" />
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold tracking-wider uppercase border ${
                  isCritical
                    ? 'bg-red-500/30 text-amber-300 border-red-500/50 animate-pulse'
                    : isElevated
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {isCritical
                  ? '⚡ DAMINI / IMD RED LIGHTNING ALERT'
                  : isElevated
                  ? '⚠️ THUNDERSTORM INSTABILITY WATCH'
                  : '🟢 LIGHTNING SENSOR STANDBY'}
              </span>
              <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                <Radio className="w-3 h-3 text-cyan-400 animate-ping" />
                DOPPLER & ELECTROSTATIC INGESTION
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-black tracking-tight text-white font-mono flex items-center gap-2">
              {isCritical ? (
                <>
                  <span className="text-amber-400">KALBAISHAKHI</span> SEVERE LIGHTNING SWARM DETECTED
                </>
              ) : (
                'ATMOSPHERIC CONVECTION & THUNDER TRACKER'
              )}
            </h3>

            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              {isCritical
                ? `Immediate hazard for North 24 Parganas & Kolkata: Ground flash registered within ${distanceKm.toFixed(
                    1
                  )} km. Enforce 30-30 Safety Directive immediately.`
                : 'Automated lightning detection network monitoring cloud-to-ground strikes and convective CAPE energy.'}
            </p>
          </div>
        </div>

        {/* Right Side: Quick Action Controls */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
          <button
            onClick={handleTestThunder}
            disabled={isPlayingAudio}
            className={`px-3 py-2 rounded-lg text-xs font-mono font-bold flex items-center space-x-1.5 border transition-all ${
              isPlayingAudio
                ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-lg shadow-amber-500/30 scale-95'
                : 'bg-slate-900 hover:bg-slate-800 text-amber-300 hover:text-white border-amber-700/50 hover:border-amber-500'
            }`}
          >
            <Volume2 className={`w-4 h-4 ${isPlayingAudio ? 'animate-bounce text-slate-950' : 'text-amber-400'}`} />
            <span>{isPlayingAudio ? 'SIMULATING THUNDER...' : 'PLAY THUNDER RUMBLE'}</span>
          </button>

          <button
            onClick={handleTestWarningBeep}
            className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-mono font-medium transition-colors flex items-center space-x-1.5"
          >
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span>PROXIMITY CHIME</span>
          </button>

          <button
            onClick={() => setIsRulesExpanded(!isRulesExpanded)}
            className="px-3 py-2 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-mono font-medium transition-colors flex items-center space-x-1"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>30-30 RULES</span>
            {isRulesExpanded ? <ChevronUp className="w-3.5 h-3.5 ml-0.5" /> : <ChevronDown className="w-3.5 h-3.5 ml-0.5" />}
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-slate-800/80 divide-x divide-slate-800/80 bg-black/40 text-xs font-mono">
        {/* Metric 1: Flash Rate */}
        <div className="p-3 sm:p-4 space-y-1">
          <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>Strike Frequency</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono flex items-baseline gap-1">
            <span className={strikesPerMin > 15 ? 'text-amber-400' : 'text-white'}>{strikesPerMin}</span>
            <span className="text-[10px] font-normal text-slate-400">strikes/min</span>
          </div>
          <div className="text-[10px] text-slate-400">
            {strikesPerMin >= 30 ? '🔴 Extreme Flash Density' : strikesPerMin >= 10 ? '🟠 Frequent Discharges' : '🟢 Low Activity'}
          </div>
        </div>

        {/* Metric 2: Proximity Distance */}
        <div className="p-3 sm:p-4 space-y-1">
          <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1.5">
            <Compass className="w-3 h-3 text-cyan-400" />
            <span>Nearest Strike Epicenter</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono flex items-baseline gap-1">
            <span className={distanceKm <= 3.0 ? 'text-red-400 font-black' : 'text-white'}>{distanceKm.toFixed(1)}</span>
            <span className="text-[10px] font-normal text-slate-400">km</span>
          </div>
          <div className="text-[10px] text-slate-400">
            {distanceKm <= 2.0 ? '⚠️ Immediate Danger Zone' : distanceKm <= 6.0 ? '⚡ High Alert Perimeter' : 'Safe Distance'}
          </div>
        </div>

        {/* Metric 3: Flash to Thunder Delay */}
        <div className="p-3 sm:p-4 space-y-1">
          <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-purple-400" />
            <span>Flash-to-Thunder Delay</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-purple-300 font-mono flex items-baseline gap-1">
            <span>~{flashToThunderSec}</span>
            <span className="text-[10px] font-normal text-slate-400">seconds</span>
          </div>
          <div className="text-[10px] text-slate-400">
            {flashToThunderSec < 30 ? '⚡ Rule Active (< 30s)' : 'Thunder lag > 30s'}
          </div>
        </div>

        {/* Metric 4: CAPE Convective Instability */}
        <div className="p-3 sm:p-4 space-y-1">
          <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1.5">
            <Flame className="w-3 h-3 text-rose-400" />
            <span>CAPE Instability</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-400 font-mono flex items-baseline gap-1">
            <span>{cape}</span>
            <span className="text-[10px] font-normal text-slate-400">J/kg</span>
          </div>
          <div className="text-[10px] text-slate-400">
            {cape >= 3000 ? '🌪️ Explosive Supercell' : cape >= 2000 ? '⚡ Severe Thunderstorm' : 'Moderate'}
          </div>
        </div>
      </div>

      {/* Expandable 30-30 Safety Protocol & Guidelines Drawer */}
      {isRulesExpanded && (
        <div className="p-4 sm:p-5 bg-[#08080A] border-t border-slate-800 space-y-4 animate-fade-in text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="font-bold text-amber-400 flex items-center gap-2 font-mono text-sm">
              <ShieldAlert className="w-4 h-4" />
              <span>IMD & NATIONAL DISASTER MANAGEMENT (NDMA) 30-30 LIGHTNING PROTOCOL</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/50 text-amber-300 border border-amber-800/40">
              LIFE SAFETY DIRECTIVE
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-slate-300">
            {/* Rule 1 */}
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1.5">
              <div className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5 font-mono">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-[10px] text-amber-400 font-black">
                  1
                </span>
                <span>THE 30-SECOND RULE</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                Count the seconds between seeing a lightning flash and hearing thunder. If it is <strong>less than 30 seconds</strong>, the lightning is within 10 km. Seek indoor shelter immediately.
              </p>
            </div>

            {/* Rule 2 */}
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1.5">
              <div className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5 font-mono">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-[10px] text-amber-400 font-black">
                  2
                </span>
                <span>THE 30-MINUTE CLEARANCE</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                Stay inside a substantial building or enclosed metal-roof vehicle for at least <strong>30 minutes after hearing the last thunderclap</strong>.
              </p>
            </div>

            {/* Rule 3 */}
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1.5">
              <div className="text-[11px] font-bold text-red-300 flex items-center gap-1.5 font-mono">
                <span className="w-5 h-5 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center text-[10px] text-red-400 font-black">
                  3
                </span>
                <span>STRICTLY PROHIBITED LOCATIONS</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                Never shelter under solitary trees, tin sheds, mobile towers, open fields, water bodies, or open balconies. Avoid high metal fixtures.
              </p>
            </div>

            {/* Rule 4 */}
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1.5">
              <div className="text-[11px] font-bold text-cyan-300 flex items-center gap-1.5 font-mono">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-[10px] text-cyan-400 font-black">
                  4
                </span>
                <span>INDOOR PRECAUTIONS</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                Stay away from wired electrical appliances, corded landlines, plumbing/taps, and concrete walls with reinforcement bars.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
