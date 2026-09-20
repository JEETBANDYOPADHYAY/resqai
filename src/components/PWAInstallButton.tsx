import React, { useState } from 'react';
import { Download, Smartphone, X, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useLanguage } from '../context/LanguageContext';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const { t } = useLanguage();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        id="pwa-install-btn"
        onClick={install}
        className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-[11px] font-semibold shadow-sm transition border border-emerald-400/40"
        title="Install ResQAI for 100% Offline Access"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="whitespace-nowrap">{t('installApp')}</span>
      </button>
    );
  }

  // iOS Safari flow (beforeinstallprompt is not supported by WebKit)
  if (isIOS) {
    return (
      <>
        <button
          id="pwa-install-ios-btn"
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-200 text-[11px] font-semibold border border-slate-700 transition"
          title="Install ResQAI on iOS"
        >
          <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
          <span className="whitespace-nowrap">{t('installApp')}</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-sm rounded-xl bg-slate-900 border border-slate-700 p-5 shadow-2xl text-slate-100">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <Smartphone className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white">Install ResQAI on iPhone / iPad</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-xs text-slate-300">
                <p className="text-slate-400">
                  Enables 100% autonomous offline evacuation routing and offline 2G SMS emergency distress beacon without cellular data.
                </p>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                  <div className="flex items-start space-x-2">
                    <span className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-400 font-mono text-[10px] flex items-center justify-center font-bold shrink-0">1</span>
                    <span>Tap the <strong>Share</strong> button (box with upward arrow) in the Safari toolbar.</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-400 font-mono text-[10px] flex items-center justify-center font-bold shrink-0">2</span>
                    <span>Scroll down and tap <strong>Add to Home Screen</strong>.</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 font-mono text-[10px] flex items-center justify-center font-bold shrink-0">✓</span>
                    <span>Launch directly from Home Screen even when network towers collapse.</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs transition"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
