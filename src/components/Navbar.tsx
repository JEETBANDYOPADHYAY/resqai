import React, { useState, useEffect } from 'react';
import {
  Activity,
  ShieldCheck,
  User,
  Radio,
  Volume2,
  VolumeX,
  Code2,
  Layers,
  Lock,
  LogOut,
  Clock,
  Globe,
  Menu,
  X,
  Bot,
  Stethoscope,
  HeartPulse,
} from 'lucide-react';
import { UserViewProfile, MLHazardEvaluation, AuthorizedPersonnel, MedicalRescueRequest } from '../types';
import { SCENARIO_PRESETS } from '../data/mockDisasterData';
import { useLanguage } from '../context/LanguageContext';
import { formatISTTimestamp } from '../i18n/translations';
import { PWAInstallButton } from './PWAInstallButton';
import { VoicePackModal } from './VoicePackModal';

interface NavbarProps {
  currentProfile: UserViewProfile;
  onProfileChange: (profile: UserViewProfile) => void;
  mlEvaluation: MLHazardEvaluation;
  selectedScenarioId: string;
  onSelectScenario: (scenarioId: string) => void;
  isStreaming: boolean;
  onToggleStreaming: () => void;
  isSirenActive: boolean;
  onToggleSiren: () => void;
  onOpenPythonModal: () => void;
  onOpenAiCommanderModal?: () => void;
  onOpenMedicalHelpModal?: () => void;
  activeRescueRequest?: MedicalRescueRequest | null;
  isEmergencyAuthorized: boolean;
  authorizedUser: AuthorizedPersonnel | null;
  onOpenAuthModal: () => void;
  onEmergencyLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentProfile,
  onProfileChange,
  mlEvaluation,
  selectedScenarioId,
  onSelectScenario,
  isStreaming,
  onToggleStreaming,
  isSirenActive,
  onToggleSiren,
  onOpenPythonModal,
  onOpenAiCommanderModal,
  onOpenMedicalHelpModal,
  activeRescueRequest = null,
  isEmergencyAuthorized,
  authorizedUser,
  onOpenAuthModal,
  onEmergencyLogout,
}) => {
  const { t, language, setLanguage } = useLanguage();
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [showVoiceModal, setShowVoiceModal] = useState<boolean>(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const timestamp = formatISTTimestamp(currentTime, language);

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'CRITICAL':
        return 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse';
      case 'HIGH':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case 'MODERATE':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      default:
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    }
  };

  const getRiskLabel = (risk: string) => {
    switch (risk) {
      case 'CRITICAL':
        return t('riskCritical');
      case 'HIGH':
        return t('riskHigh');
      case 'MODERATE':
        return t('riskModerate');
      case 'LOW':
        return t('riskLow');
      default:
        return t('riskSafe');
    }
  };

  const handleEmergencyClick = () => {
    if (!isEmergencyAuthorized) {
      onOpenAuthModal();
    } else {
      onProfileChange('AMBULANCE');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0C0C0E]/95 backdrop-blur-md border-b border-slate-800">
      <div className="w-full max-w-[1920px] mx-auto px-3 sm:px-4 lg:px-6 2xl:px-8">
        <div className="flex flex-wrap items-center justify-between py-2 sm:py-3 gap-y-2 gap-x-3 min-w-0">
          {/* Left: Brand Logo, Live Timestamp & Threat Badge */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0 min-w-0">
            {/* Logo */}
            <div className="flex items-center space-x-2 shrink-0">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-red-900/30 shrink-0">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <div className="shrink-0">
                <div className="flex items-center">
                  <h1 className="text-sm sm:text-base font-bold tracking-tight uppercase text-white font-mono">
                    ResQ<span className="text-red-500">AI</span>
                  </h1>
                  <span className="text-[9px] bg-slate-800 px-1.5 py-0.2 rounded ml-1 text-slate-400 font-mono tracking-widest hidden sm:inline">
                    V2.4
                  </span>
                </div>
                <div className="text-[9px] text-slate-400 font-mono tracking-wide hidden 2xl:block leading-tight max-w-[200px] truncate">
                  {t('appSubtitle')}
                </div>
              </div>
            </div>

            {/* Live Disaster Timestamp (IST) */}
            <div
              id="live-disaster-timestamp"
              className="hidden md:flex items-center space-x-1.5 px-2 py-1 rounded-md bg-slate-900/90 border border-slate-800 text-slate-300 font-mono text-[10px] sm:text-[11px] shadow-sm shrink-0"
              title={`Disaster Operations Time (IST): ${timestamp.fullStr}`}
            >
              <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0 animate-pulse" />
              <span className="text-[9px] text-cyan-400 font-bold tracking-wider hidden lg:inline">
                {t('liveClockLabel')}:
              </span>
              <span className="text-white font-semibold tabular-nums whitespace-nowrap">
                {timestamp.timeStr}
              </span>
              <span className="text-[9px] text-slate-400 hidden xl:inline">
                IST
              </span>
            </div>

            {/* Live ML Threat Badge */}
            <div
              className={`hidden xl:flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border shrink-0 ${getRiskBadgeColor(
                mlEvaluation.riskLevel
              )}`}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />
              <span className="font-mono whitespace-nowrap">{getRiskLabel(mlEvaluation.riskLevel)}</span>
              <span className="opacity-40 hidden 2xl:inline">•</span>
              <span className="text-[10px] font-sans truncate max-w-[120px] hidden 2xl:inline">
                {mlEvaluation.predictedDisaster.replace(/_/g, ' ')}
              </span>
              <span className="text-[9px] font-mono opacity-80 whitespace-nowrap">({mlEvaluation.confidence}%)</span>
            </div>
          </div>

          {/* Right: Language Selector, Profile Switcher & Action Controls */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 shrink-0 justify-end">
            {/* Multilingual Selector */}
            <div
              id="language-switcher"
              className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800 shrink-0 shadow-sm"
              title="Select Language / ভাষা নির্বাচন করুন / भाषा चुनें"
            >
              <Globe className="w-3.5 h-3.5 text-slate-400 mx-1 shrink-0 hidden sm:block" />
              <button
                id="btn-lang-en"
                onClick={() => setLanguage('en')}
                className={`px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[11px] font-mono rounded font-medium transition-all ${
                  language === 'en'
                    ? 'bg-blue-600 text-white font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="English"
              >
                EN
              </button>
              <button
                id="btn-lang-bn"
                onClick={() => setLanguage('bn')}
                className={`px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[11px] font-sans rounded font-medium transition-all ${
                  language === 'bn'
                    ? 'bg-emerald-600 text-white font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="বাংলা (Bengali)"
              >
                বাং
              </button>
              <button
                id="btn-lang-hi"
                onClick={() => setLanguage('hi')}
                className={`px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[11px] font-sans rounded font-medium transition-all ${
                  language === 'hi'
                    ? 'bg-amber-600 text-white font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="हिन्दी (Hindi)"
              >
                हिं
              </button>
            </div>

            {/* Voice Pack Test & Diagnostics Button */}
            <button
              id="btn-voice-pack-nav"
              onClick={() => setShowVoiceModal(true)}
              className="hidden sm:flex p-1 sm:p-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 transition shadow-sm shrink-0 items-center space-x-1"
              title="Voice Pack System (English, বাংলা, हिन्दी)"
            >
              <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[10px] font-mono text-slate-400 hidden 2xl:inline">Voice</span>
            </button>

            {/* View Profile Switcher */}
            <div className="flex bg-slate-900 rounded-lg p-0.5 border border-slate-800 items-center shrink-0">
              <button
                id="btn-emergency-view"
                onClick={handleEmergencyClick}
                className={`px-2 sm:px-2.5 py-1 text-[10px] sm:text-[11px] font-medium rounded-md transition-all flex items-center space-x-1 shrink-0 ${
                  currentProfile === 'AMBULANCE'
                    ? 'bg-red-600 text-white shadow-lg shadow-red-900/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title={isEmergencyAuthorized ? t('emergencyView') : t('authRequired')}
              >
                {isEmergencyAuthorized ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                )}
                <span className="hidden md:inline font-semibold whitespace-nowrap">{t('emergencyView')}</span>
                {!isEmergencyAuthorized && (
                  <span className="text-[8px] bg-red-950 text-red-300 px-1 rounded font-mono border border-red-900/50 hidden 2xl:inline">
                    {t('authRequired')}
                  </span>
                )}
              </button>

              <button
                id="btn-citizen-view"
                onClick={() => onProfileChange('CITIZEN')}
                className={`px-2 sm:px-2.5 py-1 text-[10px] sm:text-[11px] font-medium rounded-md transition-all flex items-center space-x-1 shrink-0 ${
                  currentProfile === 'CITIZEN'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <User className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden md:inline font-semibold whitespace-nowrap">{t('citizenView')}</span>
              </button>
            </div>

            {/* Officer Badge / Logout if Authorized (Wide screens) */}
            {isEmergencyAuthorized && authorizedUser && (
              <div className="hidden 2xl:flex items-center space-x-1.5 bg-red-950/30 border border-red-900/50 px-2 py-1 rounded-lg shrink-0">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <div className="text-left">
                  <div className="text-[10px] font-mono font-bold text-white leading-none whitespace-nowrap">
                    {authorizedUser.badgeId}
                  </div>
                  <div className="text-[8px] font-mono text-red-300 leading-none truncate max-w-[70px]">
                    {t('clearanceLevel')} {authorizedUser.clearanceLevel}
                  </div>
                </div>
                <button
                  onClick={onEmergencyLogout}
                  title={t('lockConsole')}
                  className="ml-1 p-0.5 rounded hover:bg-red-900/40 text-slate-400 hover:text-white transition-colors"
                >
                  <LogOut className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Scenario Selector (Desktop xl+) */}
            <div className="hidden xl:flex items-center space-x-1.5 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 shrink-0">
              <span className="text-[9px] text-slate-400 uppercase font-mono tracking-wider flex items-center gap-1 font-bold">
                <Layers className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="hidden 2xl:inline text-slate-300">{t('scenarioLabel')}:</span>
              </span>
              <select
                id="select-scenario-preset"
                value={selectedScenarioId}
                onChange={(e) => onSelectScenario(e.target.value)}
                className="bg-[#0C0C0E] text-slate-100 text-xs rounded px-2 py-0.5 border border-slate-700 focus:outline-none focus:border-cyan-500 font-medium cursor-pointer max-w-[210px] 2xl:max-w-[280px] truncate shadow-inner"
              >
                {SCENARIO_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id} className="bg-[#121316] text-slate-200 py-1">
                    {preset.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Live Sensor Ingestion Stream Button (sm+) */}
            <button
              id="btn-toggle-stream"
              onClick={onToggleStreaming}
              title={isStreaming ? t('streamTooltipOn') : t('streamTooltipOff')}
              className={`hidden sm:flex items-center space-x-1 px-2 py-1.5 rounded-lg border text-xs font-semibold transition-colors shrink-0 ${
                isStreaming
                  ? 'bg-cyan-950/40 text-cyan-400 border-cyan-800/60'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 shrink-0 ${isStreaming ? 'animate-pulse text-cyan-400' : ''}`} />
              <span className="font-mono text-[9px] sm:text-[10px] tracking-wider hidden 2xl:inline whitespace-nowrap">
                {isStreaming ? t('streamOn') : t('streamPaused')}
              </span>
            </button>

            {/* Siren Alert Toggle (Always visible quick action) */}
            <button
              id="btn-toggle-siren"
              onClick={onToggleSiren}
              title={isSirenActive ? t('sirenMute') : t('sirenEnable')}
              className={`p-1.5 sm:p-2 rounded-lg border transition-colors shrink-0 ${
                isSirenActive
                  ? 'bg-red-950/40 text-red-400 border-red-800/60 animate-pulse'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              {isSirenActive ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>

            {/* Emergency Medical Relief: Govt Doctors & Rescue Team (Desktop lg+) */}
            {onOpenMedicalHelpModal && (
              <button
                id="btn-navbar-medical-help"
                onClick={onOpenMedicalHelpModal}
                title="Emergency Medical Relief: On-Duty Govt Doctors & Rescue Team Dispatch"
                className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 hover:text-emerald-100 border border-emerald-700/60 text-xs font-semibold transition-all shadow-sm shrink-0"
              >
                <Stethoscope className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden 2xl:inline font-mono text-[10px] whitespace-nowrap">Govt Doctors & Rescue</span>
                {activeRescueRequest && activeRescueRequest.status !== 'RESOLVED' && (
                  <span className="w-2 h-2 rounded-full bg-red-400 animate-ping"></span>
                )}
              </button>
            )}

            {/* PWA Install Button (Desktop 2xl+) */}
            <div className="hidden 2xl:block shrink-0">
              <PWAInstallButton />
            </div>

            {/* AI Incident Commander Briefing Button (Desktop xl+) */}
            {onOpenAiCommanderModal && (
              <button
                id="btn-navbar-ai-commander"
                onClick={onOpenAiCommanderModal}
                title="Open AI Incident Commander Tactical Briefing & Situational Q&A"
                className="hidden xl:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 border border-purple-800/60 hover:border-purple-600 text-xs font-semibold transition-all shadow-sm shrink-0"
              >
                <Bot className="w-3.5 h-3.5 text-purple-400 animate-pulse shrink-0" />
                <span className="hidden 2xl:inline font-mono text-[10px] whitespace-nowrap">AI Commander</span>
              </button>
            )}

            {/* Inspect Python Model & Code Dev List (Desktop xl+) */}
            <button
              id="btn-python-modal"
              onClick={onOpenPythonModal}
              title="Inspect Code Dev List & Python ML Microservices"
              className="hidden xl:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 text-xs font-medium transition-colors shrink-0"
            >
              <Code2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="hidden 2xl:inline font-mono text-[10px] whitespace-nowrap">Code Dev List</span>
            </button>

            {/* Mobile & Tablet Drawer Toggle (screens < xl) */}
            <button
              id="btn-mobile-nav-toggle"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="xl:hidden p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white shrink-0 transition"
              title="More Options"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4 text-red-400" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Collapsible Mobile/Tablet Drawer for Secondary Controls */}
        {isMobileMenuOpen && (
          <div className="xl:hidden border-t border-slate-800/90 py-3 space-y-2.5 animate-fade-in">
            {/* Scenario Preset Selector */}
            <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-900/90 border border-slate-800 text-xs">
              <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider flex items-center gap-1 font-bold shrink-0">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                {t('scenarioLabel')}:
              </span>
              <select
                value={selectedScenarioId}
                onChange={(e) => {
                  onSelectScenario(e.target.value);
                  setIsMobileMenuOpen(false);
                }}
                className="bg-slate-950 text-slate-200 text-xs rounded px-2.5 py-1.5 border border-slate-700 font-medium cursor-pointer w-full"
              >
                {SCENARIO_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id} className="bg-[#121316] text-slate-200">
                    {preset.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Action Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* Stream Ingestion Button */}
              <button
                onClick={onToggleStreaming}
                className={`flex items-center justify-center space-x-1.5 py-2 px-2.5 rounded-lg border text-xs font-semibold ${
                  isStreaming
                    ? 'bg-cyan-950/60 text-cyan-300 border-cyan-700'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
              >
                <Radio className={`w-3.5 h-3.5 ${isStreaming ? 'animate-pulse text-cyan-400' : ''}`} />
                <span className="text-[11px] font-mono">{isStreaming ? t('streamOn') : t('streamPaused')}</span>
              </button>

              {/* Emergency Medical Relief: Govt Doctors & Rescue Team */}
              {onOpenMedicalHelpModal && (
                <button
                  onClick={() => {
                    onOpenMedicalHelpModal();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center justify-center space-x-1.5 py-2 px-2.5 rounded-lg bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/70 text-xs font-medium col-span-2"
                >
                  <Stethoscope className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[11px] font-mono">Emergency Doctors & Rescue Team</span>
                  {activeRescueRequest && activeRescueRequest.status !== 'RESOLVED' && (
                    <span className="ml-1 px-1.5 py-0.2 rounded text-[9px] bg-red-600 text-white font-bold animate-pulse">
                      MISSION ACTIVE
                    </span>
                  )}
                </button>
              )}

              {/* AI Commander Briefing */}
              {onOpenAiCommanderModal && (
                <button
                  onClick={() => {
                    onOpenAiCommanderModal();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center justify-center space-x-1.5 py-2 px-2.5 rounded-lg bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 border border-purple-800/60 text-xs font-medium col-span-2 sm:col-span-1"
                >
                  <Bot className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-[11px] font-mono">AI Commander</span>
                </button>
              )}

              {/* Inspect Python Model & Code Dev List */}
              <button
                onClick={() => {
                  onOpenPythonModal();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center justify-center space-x-1.5 py-2 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-medium"
              >
                <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] font-mono">Code Dev List</span>
              </button>

              {/* Voice Pack Settings */}
              <button
                onClick={() => {
                  setShowVoiceModal(true);
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center justify-center space-x-1.5 py-2 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-medium"
              >
                <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[11px] font-mono">Voice Packs</span>
              </button>

              {/* PWA Install */}
              <div className="col-span-2 sm:col-span-1 flex justify-center items-center">
                <PWAInstallButton />
              </div>
            </div>

            {/* Officer Status if Authorized */}
            {isEmergencyAuthorized && authorizedUser && (
              <div className="flex items-center justify-between p-2 rounded-lg bg-red-950/40 border border-red-900/60 text-xs">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="font-mono text-white font-bold">{authorizedUser.badgeId}</span>
                  <span className="text-[10px] text-red-300 font-mono">
                    ({t('clearanceLevel')} {authorizedUser.clearanceLevel})
                  </span>
                </div>
                <button
                  onClick={() => {
                    onEmergencyLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-xs text-red-400 hover:text-red-300 flex items-center space-x-1 font-semibold"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t('lockConsole')}</span>
                </button>
              </div>
            )}

            {/* Mobile Threat Assessment Info & Clock */}
            <div className="flex items-center justify-between text-[11px] pt-1 text-slate-400 border-t border-slate-800/80">
              <div className="flex items-center space-x-1.5">
                <Clock className="w-3 h-3 text-cyan-400" />
                <span className="font-mono text-slate-300">{timestamp.timeStr} IST</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="font-mono text-slate-400">Risk:</span>
                <span className={`font-bold font-mono px-2 py-0.5 rounded text-[10px] ${getRiskBadgeColor(mlEvaluation.riskLevel)}`}>
                  {getRiskLabel(mlEvaluation.riskLevel)} ({mlEvaluation.confidence}%)
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Voice Pack Diagnostics and Testing Modal */}
      <VoicePackModal isOpen={showVoiceModal} onClose={() => setShowVoiceModal(false)} />
    </header>
  );
};

