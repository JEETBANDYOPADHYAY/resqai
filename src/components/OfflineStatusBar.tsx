import React from 'react';
import { Wifi, WifiOff, Radio, ShieldCheck, DownloadCloud } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { getOfflineCacheStatus } from '../utils/offlineStorage';

interface OfflineStatusBarProps {
  isOnline: boolean;
  isSimulatingOffline: boolean;
  onToggleSimulateOffline: () => void;
  onOpenSmsBeacon: () => void;
}

export const OfflineStatusBar: React.FC<OfflineStatusBarProps> = ({
  isOnline,
  isSimulatingOffline,
  onToggleSimulateOffline,
  onOpenSmsBeacon,
}) => {
  const { t } = useLanguage();
  const cacheStatus = getOfflineCacheStatus();

  return (
    <div
      id="offline-resilience-bar"
      className={`w-full py-1.5 px-3 sm:px-4 text-xs font-mono transition-colors border-b flex flex-wrap items-center justify-between gap-2 z-20 ${
        !isOnline
          ? 'bg-amber-950/90 border-amber-600/60 text-amber-200 shadow-md shadow-amber-950/40'
          : 'bg-slate-950/90 border-slate-800/80 text-slate-400'
      }`}
    >
      {/* Left: Connectivity Status & Cache indicator */}
      <div className="flex items-center space-x-2.5">
        {!isOnline ? (
          <div className="flex items-center space-x-1.5 text-amber-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <WifiOff className="w-3.5 h-3.5 text-amber-400" />
            <span>{t('offlineResilient')}</span>
          </div>
        ) : (
          <div className="flex items-center space-x-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t('onlineLive')}</span>
          </div>
        )}

        <span className="text-slate-600 hidden sm:inline">•</span>

        <div className="hidden md:flex items-center space-x-1 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>
            {cacheStatus.nodeCount} road junctions & {cacheStatus.safeZoneCount} evacuation havens cached
          </span>
        </div>
      </div>

      {/* Right: Quick actions (2G SMS Beacon trigger & Offline Test Simulation toggle) */}
      <div className="flex items-center space-x-2 shrink-0">
        {/* 2G SMS Beacon Trigger */}
        <button
          onClick={onOpenSmsBeacon}
          className="flex items-center space-x-1 px-2 py-0.5 rounded bg-red-900/60 hover:bg-red-800/80 text-red-200 border border-red-700/60 text-[11px] transition font-bold whitespace-nowrap shrink-0"
          title="Open Low-Bandwidth 2G SMS Emergency Beacon"
        >
          <Radio className="w-3 h-3 text-red-400 animate-pulse" />
          <span>{t('offlineSmsBeacon')}</span>
        </button>

        {/* Offline Simulation Toggle */}
        <button
          onClick={onToggleSimulateOffline}
          className={`flex items-center space-x-1 px-2 py-0.5 rounded border text-[11px] transition whitespace-nowrap shrink-0 ${
            isSimulatingOffline
              ? 'bg-amber-600 text-white border-amber-500 font-bold'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-700'
          }`}
          title="Toggle simulated offline mode to test autonomous offline routing"
        >
          <DownloadCloud className="w-3 h-3" />
          <span>{isSimulatingOffline ? 'Exit Offline Sim' : t('simulateOffline')}</span>
        </button>
      </div>
    </div>
  );
};
