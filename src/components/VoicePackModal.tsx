import React, { useState, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  Square,
  CheckCircle2,
  AlertCircle,
  Settings2,
  X,
  Globe2,
  Radio,
  Sparkles,
} from 'lucide-react';
import {
  VoiceLanguage,
  getVoiceEngineDiagnostics,
  speakEmergencyVoice,
  findBestVoiceForLanguage,
  VOICE_SAMPLE_PHRASES,
  VoiceEngineStatus,
} from '../utils/voicePack';
import { audioEngine } from '../utils/audioAlert';
import { useLanguage } from '../context/LanguageContext';

interface VoicePackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VoicePackModal: React.FC<VoicePackModalProps> = ({ isOpen, onClose }) => {
  const { language, setLanguage, t } = useLanguage();
  const [diagnostics, setDiagnostics] = useState<Record<VoiceLanguage, VoiceEngineStatus> | null>(null);
  const [currentlySpeaking, setCurrentlySpeaking] = useState<VoiceLanguage | null>(null);
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      refreshDiagnostics();
    }
  }, [isOpen]);

  const refreshDiagnostics = () => {
    const diag = getVoiceEngineDiagnostics();
    setDiagnostics(diag);
  };

  if (!isOpen) return null;

  const handleTestVoice = async (lang: VoiceLanguage) => {
    audioEngine.playNavigationTurnChime();
    setCurrentlySpeaking(lang);
    setTestResult(null);

    const sample = VOICE_SAMPLE_PHRASES[lang];
    const voiceInfo = findBestVoiceForLanguage(lang);
    const textToSpeak = voiceInfo.isNative ? sample.native : sample.phonetic;

    const ok = await speakEmergencyVoice(textToSpeak, lang, {
      rate: speechRate,
      pitch: 1.0,
      volume: 1.0,
      onEnd: () => {
        setCurrentlySpeaking(null);
      },
    });

    if (ok) {
      setTestResult(`${lang.toUpperCase()} voice playback succeeded.`);
    } else {
      setTestResult(`Could not access audio output.`);
      setCurrentlySpeaking(null);
    }
  };

  const handleStopSpeaking = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setCurrentlySpeaking(null);
  };

  const languagesList: { code: VoiceLanguage; label: string; nativeName: string; flag: string }[] = [
    { code: 'en', label: 'English (India/UK/US)', nativeName: 'English', flag: '🌐' },
    { code: 'bn', label: 'Bengali (West Bengal / BD)', nativeName: 'বাংলা', flag: '🇮🇳' },
    { code: 'hi', label: 'Hindi (India)', nativeName: 'हिन्दी', flag: '🇮🇳' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div
        id="voice-pack-diagnostics-modal"
        className="w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Volume2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm flex items-center space-x-2">
                <span>Multi-Language Emergency Voice Pack System</span>
              </h3>
              <p className="text-xs text-slate-400">
                English, বাংলা (Bengali), and हिन्दी (Hindi) Turn-by-Turn Speech Engine
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Active Voice Info & Controls */}
          <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/50 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Current App & Guidance Language
              </div>
              <div className="text-sm font-bold text-white flex items-center space-x-2 mt-0.5">
                <Globe2 className="w-4 h-4 text-cyan-400" />
                <span>
                  {language === 'bn' ? 'বাংলা (Bengali)' : language === 'hi' ? 'हिन्दी (Hindi)' : 'English (English)'}
                </span>
              </div>
            </div>

            {/* Speech Rate Controls */}
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-400 font-mono text-[11px]">Pacing:</span>
              {[0.85, 1.0, 1.15].map((rate) => (
                <button
                  key={rate}
                  onClick={() => setSpeechRate(rate)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono border transition ${
                    speechRate === rate
                      ? 'bg-cyan-600 text-white border-cyan-500 font-bold'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>
          </div>

          {/* Language Voice Cards */}
          <div className="space-y-2.5">
            {languagesList.map(({ code, label, nativeName, flag }) => {
              const diag = diagnostics ? diagnostics[code] : null;
              const isSelectedLang = language === code;
              const isSpeakingThis = currentlySpeaking === code;
              const sample = VOICE_SAMPLE_PHRASES[code];

              return (
                <div
                  key={code}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isSelectedLang
                      ? 'bg-slate-800/80 border-cyan-500/60 shadow-lg shadow-cyan-950/20'
                      : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    {/* Language & Engine Info */}
                    <div className="flex items-start space-x-3">
                      <span className="text-xl leading-none mt-0.5">{flag}</span>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white text-sm">{nativeName}</span>
                          <span className="text-slate-400 text-xs">({label})</span>
                          {isSelectedLang && (
                            <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-bold">
                              Active
                            </span>
                          )}
                        </div>

                        {/* Engine Details */}
                        <div className="mt-1 flex items-center space-x-2 text-[11px]">
                          {diag?.hasNativeVoice ? (
                            <span className="flex items-center space-x-1 text-emerald-400 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Native TTS Engine ({diag.voiceName})</span>
                            </span>
                          ) : (
                            <span className="flex items-center space-x-1 text-amber-400 font-medium">
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Phonetic Audio Transliteration Active ({diag?.voiceName || 'System'})</span>
                            </span>
                          )}
                        </div>

                        {/* Sample Spoken Text Preview */}
                        <p className="mt-1.5 text-slate-300 italic bg-slate-900/80 px-2.5 py-1 rounded border border-slate-800 text-[11px] leading-relaxed">
                          "{diag?.hasNativeVoice ? sample.native : sample.phonetic}"
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col items-end space-y-1.5 shrink-0">
                      {isSpeakingThis ? (
                        <button
                          onClick={handleStopSpeaking}
                          className="flex items-center space-x-1 px-3 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow transition animate-pulse"
                        >
                          <Square className="w-3 h-3 fill-current" />
                          <span>Stop</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleTestVoice(code)}
                          className="flex items-center space-x-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Test Voice</span>
                        </button>
                      )}

                      {!isSelectedLang && (
                        <button
                          onClick={() => setLanguage(code)}
                          className="text-[11px] text-cyan-400 hover:text-cyan-300 underline font-medium"
                        >
                          Select Language
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Test Status Toast */}
          {testResult && (
            <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-[11px] flex items-center space-x-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{testResult}</span>
            </div>
          )}

          {/* Diagnostic Note */}
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-slate-400 text-[11px] leading-relaxed">
            <div className="font-semibold text-slate-300 mb-1 flex items-center space-x-1.5">
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              <span>Voice Pack System Architecture</span>
            </div>
            When native Bengali or Hindi speech packs are present in your browser/OS (Chrome, Edge Natural, Android TTS),
            ResQ AI delivers native Bengali (বাংলা) and Hindi (हिन्दी) audio. If your operating system lacks native South Asian language packs, our smart transliteration pipeline delivers clear, intelligible phonetic guidance so navigation instructions are never silent or corrupted.
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-mono">ResQ AI Web Speech API Synthesizer</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
