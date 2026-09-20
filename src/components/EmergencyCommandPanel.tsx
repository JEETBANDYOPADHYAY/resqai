import React, { useState } from 'react';
import {
  Ambulance,
  Radio,
  ShieldAlert,
  ShieldCheck,
  Send,
  Sparkles,
  Bot,
  AlertOctagon,
  CheckCircle,
  Truck,
  RotateCcw,
  Navigation,
  FileText,
  Activity,
  Layers,
  Lock,
  LogOut,
  UserCheck,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Compass,
  AlertTriangle,
  Building2,
  CloudRain,
  Zap,
  Loader2,
  Camera,
  Video,
  Trash2,
} from 'lucide-react';
import {
  DispatchIncident,
  EmergencyUnit,
  RoadSegment,
  RoutingResult,
  AuthorizedPersonnel,
  CitizenDisasterMediaReport,
} from '../types';
import { useLanguage } from '../context/LanguageContext';
import { audioEngine } from '../utils/audioAlert';

interface EmergencyCommandPanelProps {
  incidents: DispatchIncident[];
  units: EmergencyUnit[];
  segments: RoadSegment[];
  ambulanceRoute: RoutingResult | null;
  onToggleRoadBlock: (segmentId: string) => void;
  onAssignUnit: (unitId: string, incidentId: string) => void;
  onBatchClearRoads: () => void;
  authorizedPersonnel?: AuthorizedPersonnel | null;
  onLockConsole?: () => void;
  citizenReports?: CitizenDisasterMediaReport[];
  onCitizenReportAction?: (reportId: string, action: string) => void;
  onDismissIncident?: (incidentId: string) => void;
}

export const EmergencyCommandPanel: React.FC<EmergencyCommandPanelProps> = ({
  incidents,
  units,
  segments,
  ambulanceRoute,
  onToggleRoadBlock,
  onAssignUnit,
  onBatchClearRoads,
  authorizedPersonnel,
  onLockConsole,
  citizenReports = [],
  onCitizenReportAction,
  onDismissIncident,
}) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'DISPATCH' | 'FLEET' | 'ROADS' | 'AI_COMMAND' | 'CITIZEN_INTEL'>('DISPATCH');
  const [aiBriefing, setAiBriefing] = useState<any | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [customAiQuery, setCustomAiQuery] = useState('');
  const [qaHistory, setQaHistory] = useState<Array<{
    id: string;
    question: string;
    answer: string;
    source: string;
    timestamp: string;
  }>>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [citizenIntelTab, setCitizenIntelTab] = useState<'VERIFIED' | 'REJECTED'>('VERIFIED');

  const blockedCount = segments.filter((s) => s.isBlocked).length;
  const pendingIncidentsCount = incidents.filter((i) => i.status === 'PENDING').length;

  const handleGenerateGeminiBrief = async (queryOverride?: string) => {
    const questionText = queryOverride !== undefined ? queryOverride : customAiQuery;
    setIsGeneratingAi(true);
    try {
      const res = await fetch('/api/gemini/incident-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customQuestion: questionText }),
      });
      const data = await res.json();
      setAiBriefing(data);

      const answer = data.answer || data.rawAnalysis || 'Tactical update received.';
      if (questionText && questionText.trim().length > 0) {
        setQaHistory((prev) => [
          {
            id: `qa-${Date.now()}`,
            question: questionText.trim(),
            answer,
            source: data.source || 'ResQAI Intelligence',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
          ...prev,
        ]);
        if (queryOverride === undefined) {
          setCustomAiQuery('');
        }
      }
      audioEngine.playAlertChime();
    } catch (err) {
      console.error('Error generating AI brief:', err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSpeak = (id: string, text: string) => {
    if (speakingId === id) {
      audioEngine.stopAllAudio();
      setSpeakingId(null);
      return;
    }
    const cleanText = text
      .replace(/###/g, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/🟢|🔴|⚠️|⚡/g, '');
    audioEngine.speakNavigationGuidance(cleanText.slice(0, 350));
    setSpeakingId(id);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-[#0C0C0E] rounded-xl border border-slate-800 p-4 sm:p-5 shadow-2xl flex flex-col space-y-4">
      {/* Active Commander Authorization Strip */}
      {authorizedPersonnel && (
        <div className="bg-red-950/30 border border-red-900/40 rounded-lg p-2.5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold text-white">
                  {authorizedPersonnel.name} ({authorizedPersonnel.badgeId})
                </span>
                <span className="text-[9px] bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-800/60 font-mono">
                  {t('clearanceLevel')} {authorizedPersonnel.clearanceLevel}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate max-w-xs">
                {authorizedPersonnel.agency}
              </p>
            </div>
          </div>

          {onLockConsole && (
            <button
              onClick={onLockConsole}
              className="px-2.5 py-1 bg-slate-900 hover:bg-red-950 text-slate-300 hover:text-red-300 border border-slate-800 hover:border-red-800/60 rounded text-[11px] font-mono flex items-center space-x-1 transition-colors"
              title={t('lockConsole')}
            >
              <Lock className="w-3 h-3" />
              <span>{t('lockConsole')}</span>
            </button>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-red-950/40 text-red-400 border border-red-900/50 shrink-0">
            <Ambulance className="w-5 h-5 animate-siren" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {t('emergencyCommandTitle')}
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                PRIORITY SIREN
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Coordinating multi-agency fleet, road access permits, and live tactical routing
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap space-x-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('DISPATCH')}
            className={`px-3 py-1 rounded-md text-[11px] font-mono font-medium transition-all ${
              activeTab === 'DISPATCH'
                ? 'bg-red-600 text-white shadow-lg shadow-red-900/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t('tabDispatchQueue')} ({pendingIncidentsCount})
          </button>
          <button
            onClick={() => setActiveTab('FLEET')}
            className={`px-3 py-1 rounded-md text-[11px] font-mono font-medium transition-all ${
              activeTab === 'FLEET'
                ? 'bg-red-600 text-white shadow-lg shadow-red-900/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t('tabFleetUnits')} ({units.length})
          </button>
          <button
            onClick={() => setActiveTab('ROADS')}
            className={`px-3 py-1 rounded-md text-[11px] font-mono font-medium transition-all ${
              activeTab === 'ROADS'
                ? 'bg-red-600 text-white shadow-lg shadow-red-900/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t('tabRoadNetwork')} ({blockedCount})
          </button>
          <button
            onClick={() => setActiveTab('AI_COMMAND')}
            className={`flex items-center space-x-1 px-3 py-1 rounded-md text-[11px] font-mono font-medium transition-all ${
              activeTab === 'AI_COMMAND'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20'
                : 'text-purple-300 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('tabAiCommand')}</span>
          </button>
          <button
            onClick={() => setActiveTab('CITIZEN_INTEL')}
            className={`flex items-center space-x-1 px-3 py-1 rounded-md text-[11px] font-mono font-medium transition-all ${
              activeTab === 'CITIZEN_INTEL'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20'
                : 'text-emerald-400 hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>
              Citizen Intel ({citizenReports.filter((r) => r.verificationStatus === 'APPROVED').length} Ver / {citizenReports.filter((r) => r.verificationStatus === 'REJECTED').length} Rej)
            </span>
          </button>
        </div>
      </div>

      {/* Ambulance Priority Route Telemetry Banner */}
      {ambulanceRoute && (
        <div className="p-3.5 rounded-lg bg-cyan-950/20 border border-cyan-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <div className="text-[10px] uppercase font-mono font-bold text-cyan-400">
              ACTIVE PRIORITY SIREN BYPASS CORRIDOR
            </div>
            <div className="text-sm font-bold text-white flex items-center gap-1.5 mt-0.5 font-mono">
              <Navigation className="w-4 h-4 text-cyan-400" />
              Depot #1 ➔ {ambulanceRoute.destinationNode.name}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-mono">Total Dist.</div>
              <div className="text-sm font-bold text-white font-mono">{ambulanceRoute.totalDistanceKm} km</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-mono">ETA</div>
              <div className="text-sm font-bold text-cyan-400 font-mono">~{ambulanceRoute.estimatedTimeMin} min (Code 3)</div>
            </div>
            <div className="hidden md:block text-[10px] text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40 font-mono">
              Bypass Clearance Active
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: Dispatch Incidents Queue */}
      {activeTab === 'DISPATCH' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Active Incidents</span>
            <span className="text-[10px] text-slate-400">Auto-transmitting coordinates</span>
          </div>

          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {incidents.map((inc) => (
              <div
                key={inc.id}
                className="p-3 rounded-lg bg-[#09090B] border border-slate-800 space-y-2 text-xs transition-all hover:border-slate-700"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-950/40 text-red-400 border border-red-900/50">
                        {inc.priority}
                      </span>
                      <span className="font-bold text-slate-100">{inc.title}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 font-mono">{inc.address}</div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] font-mono text-slate-400">{inc.reportedAt}</div>
                    <div className="text-[10px] text-cyan-400 font-mono font-bold">
                      {inc.callerSosCount} Callers Registered
                    </div>
                  </div>
                </div>

                <div className="text-slate-300 text-[11px] bg-slate-900/60 p-2 rounded border border-slate-800/80">
                  {inc.notes}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-mono">
                    <span className="text-slate-400">Status:</span>
                    <span className={`font-bold ${inc.status === 'DISPATCHED' ? 'text-amber-400' : inc.status === 'ON_SCENE' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {inc.status}
                    </span>
                    {inc.assignedUnitId && <span className="text-slate-400">({inc.assignedUnitId})</span>}
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {onDismissIncident && (
                      <button
                        type="button"
                        title="Dismiss or resolve incident"
                        onClick={() => {
                          onDismissIncident(inc.id);
                          audioEngine.playAlertChime();
                        }}
                        className="px-2 py-1 rounded bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-800 text-[10px] font-mono flex items-center gap-1 transition-colors active:scale-95"
                      >
                        <Trash2 className="w-2.5 h-2.5 text-rose-400" />
                        Dismiss
                      </button>
                    )}
                    {inc.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => onAssignUnit('unit-amb-1', inc.id)}
                          className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-500 text-white text-[10px] font-mono font-bold transition-colors shadow shadow-red-900/20 active:scale-95"
                        >
                          Dispatch Unit (MEDIC)
                        </button>
                        <button
                          onClick={() => onAssignUnit('unit-boat-1', inc.id)}
                          className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-mono font-bold transition-colors shadow shadow-blue-900/20 active:scale-95"
                        >
                          Dispatch Unit (BOAT)
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: Fleet Units Management */}
      {activeTab === 'FLEET' && (
        <div className="space-y-3">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Fleet Units Status</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {units.map((unit) => (
              <div
                key={unit.id}
                className="p-3 rounded-lg bg-[#09090B] border border-slate-800 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-100 flex items-center gap-1.5">
                    <span>{unit.type === 'AMBULANCE' ? '🚑' : unit.type === 'RESCUE_BOAT' ? '🚤' : unit.type === 'DRONE_RECON' ? '🛸' : '🚒'}</span>
                    <span>{unit.name}</span>
                  </div>
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-300">
                    {unit.callSign}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 bg-slate-900/40 p-2 rounded border border-slate-800/60 font-mono">
                  <div>Status: <span className="text-white font-bold">{unit.status}</span></div>
                  <div>Speed: <span className="text-white font-bold">{unit.speedKmh} km/h</span></div>
                  <div>Power: <span className="text-emerald-400 font-bold">{unit.fuelOrBattery}%</span></div>
                  <div>GPS: <span className="text-[10px] text-slate-400">{(unit.currentLocation?.[0] ?? 22.635).toFixed(3)}, {(unit.currentLocation?.[1] ?? 88.435).toFixed(3)}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Road Network Control & Blockades */}
      {activeTab === 'ROADS' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Road Network Status</span>
            <button
              onClick={onBatchClearRoads}
              className="flex items-center space-x-1 px-3 py-1 rounded bg-slate-900 hover:bg-slate-800 text-emerald-400 text-xs font-mono font-medium border border-slate-800 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear All Roadblocks</span>
            </button>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {segments.map((seg) => (
              <div
                key={seg.id}
                className={`p-2.5 rounded-lg border text-xs flex items-center justify-between transition-all ${
                  seg.isBlocked
                    ? 'bg-red-950/20 border-red-900/50 text-red-300'
                    : 'bg-[#09090B] border-slate-800 text-slate-300'
                }`}
              >
                <div>
                  <div className="font-medium text-white flex items-center gap-1.5">
                    {seg.isBlocked && <AlertOctagon className="w-3.5 h-3.5 text-red-400 shrink-0" />}
                    <span>{seg.name}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {seg.distanceKm} km • {seg.laneCount} lanes {seg.isFloodProne && '• Flood Hazard'}
                    {seg.blockReason && <span className="text-red-400 ml-1">({seg.blockReason})</span>}
                  </div>
                </div>

                <button
                  onClick={() => onToggleRoadBlock(seg.id)}
                  className={`px-3 py-1 rounded text-xs font-mono font-bold transition-colors ${
                    seg.isBlocked
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-red-600 hover:bg-red-500 text-white'
                  }`}
                >
                  {seg.isBlocked ? 'OPEN ROAD' : 'BLOCK ROAD'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Gemini AI Incident Commander Briefing */}
      {activeTab === 'AI_COMMAND' && (
        <div className="space-y-3">
          <div className="p-3.5 bg-[#09090B] border border-purple-900/50 rounded-xl space-y-3 shadow-lg">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-lg bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300">
                  <Bot className="w-3.5 h-3.5 text-purple-400" />
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-purple-200 font-mono font-bold text-xs">
                    AI Incident Commander Briefing
                  </span>
                  <span className="text-[9px] bg-purple-950 text-purple-300 px-1.5 py-0.5 rounded border border-purple-800/60 font-mono">
                    LIVE TELEMETRY
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleGenerateGeminiBrief('')}
                disabled={isGeneratingAi}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-mono font-bold transition-all shadow-md shadow-purple-900/30 disabled:opacity-50"
              >
                {isGeneratingAi ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>SYNTHESIZING...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Full Situation Report</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Questions Chips */}
            <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none py-0.5 text-[11px]">
              <button
                type="button"
                onClick={() => handleGenerateGeminiBrief('Is Biswa Bangla Sarani open and safe for evacuation?')}
                disabled={isGeneratingAi}
                className="px-2 py-0.5 rounded-full bg-slate-900 hover:bg-purple-950/60 border border-slate-700 hover:border-purple-600 text-slate-300 hover:text-purple-200 shrink-0 transition-colors flex items-center space-x-1"
              >
                <Compass className="w-3 h-3 text-purple-400" />
                <span>Biswa Bangla Sarani open?</span>
              </button>
              <button
                type="button"
                onClick={() => handleGenerateGeminiBrief('Which roads are blocked right now?')}
                disabled={isGeneratingAi}
                className="px-2 py-0.5 rounded-full bg-slate-900 hover:bg-purple-950/60 border border-slate-700 hover:border-purple-600 text-slate-300 hover:text-purple-200 shrink-0 transition-colors flex items-center space-x-1"
              >
                <AlertTriangle className="w-3 h-3 text-red-400" />
                <span>Which roads blocked?</span>
              </button>
              <button
                type="button"
                onClick={() => handleGenerateGeminiBrief('Where is the nearest safe shelter for Baguiati?')}
                disabled={isGeneratingAi}
                className="px-2 py-0.5 rounded-full bg-slate-900 hover:bg-purple-950/60 border border-slate-700 hover:border-purple-600 text-slate-300 hover:text-purple-200 shrink-0 transition-colors flex items-center space-x-1"
              >
                <Building2 className="w-3 h-3 text-emerald-400" />
                <span>Nearest safe shelter?</span>
              </button>
              <button
                type="button"
                onClick={() => handleGenerateGeminiBrief('What is the current flood and canal water level?')}
                disabled={isGeneratingAi}
                className="px-2 py-0.5 rounded-full bg-slate-900 hover:bg-purple-950/60 border border-slate-700 hover:border-purple-600 text-slate-300 hover:text-purple-200 shrink-0 transition-colors flex items-center space-x-1"
              >
                <CloudRain className="w-3 h-3 text-cyan-400" />
                <span>Flood & canal level?</span>
              </button>
            </div>

            {/* Question Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleGenerateGeminiBrief();
              }}
              className="flex space-x-2"
            >
              <input
                type="text"
                value={customAiQuery}
                onChange={(e) => setCustomAiQuery(e.target.value)}
                placeholder="Ask situational query (e.g. 'Is Biswa Bangla Sarani open?', 'Where to evacuate?')..."
                className="flex-1 bg-[#0C0C0E] text-slate-200 placeholder-slate-500 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-purple-500 font-sans"
              />
              <button
                type="submit"
                disabled={isGeneratingAi || !customAiQuery.trim()}
                className="px-3 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-50 transition-colors flex items-center space-x-1 font-mono text-xs font-bold shrink-0"
              >
                {isGeneratingAi ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Ask</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Q&A Thread History (if questions were asked) */}
          {qaHistory.length > 0 && (
            <div className="space-y-2">
              <div className="text-[11px] font-mono text-slate-400 uppercase px-1">
                Recent Situational Answers:
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {qaHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg bg-[#09090B] border border-purple-900/40 text-xs text-slate-300 space-y-2"
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 border-b border-slate-800/80 pb-1.5">
                      <span className="text-purple-300 font-semibold truncate max-w-[70%]">
                        Q: {item.question}
                      </span>
                      <div className="flex items-center space-x-2 shrink-0">
                        <span className="text-slate-500">{item.timestamp}</span>
                        <span className="text-purple-400 font-bold">{item.source}</span>
                      </div>
                    </div>

                    <div className="text-slate-200 whitespace-pre-wrap leading-relaxed space-y-1">
                      {item.answer.split('\n\n').map((block, bIdx) => (
                        <p
                          key={bIdx}
                          dangerouslySetInnerHTML={{
                            __html: block.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>'),
                          }}
                        />
                      ))}
                    </div>

                    <div className="flex items-center justify-end space-x-2 pt-1">
                      <button
                        onClick={() => handleSpeak(item.id, item.answer)}
                        className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center space-x-1 px-1.5 py-0.5 rounded hover:bg-purple-950/40 font-mono"
                      >
                        {speakingId === item.id ? (
                          <>
                            <VolumeX className="w-3 h-3" />
                            <span>Stop Audio</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3 h-3" />
                            <span>Listen</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleCopy(item.id, item.answer)}
                        className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center space-x-1 px-1.5 py-0.5 rounded hover:bg-slate-800 font-mono"
                      >
                        {copiedId === item.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Output Content (Direct Report) */}
          {aiBriefing && qaHistory.length === 0 && (
            <div className="p-4 rounded-lg bg-[#09090B] border border-purple-900/40 text-xs text-slate-300 space-y-3 max-h-72 overflow-y-auto">
              <div className="flex items-center justify-between border-b border-purple-900/40 pb-2">
                <span className="text-[10px] font-mono text-purple-400 uppercase font-bold">
                  Source: {aiBriefing.source || 'ResQAI Intelligence'}
                </span>
                <button
                  onClick={() => handleSpeak('brief', aiBriefing.answer || aiBriefing.rawAnalysis || '')}
                  className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center space-x-1 font-mono"
                >
                  <Volume2 className="w-3 h-3" />
                  <span>Listen</span>
                </button>
              </div>

              {aiBriefing.answer || aiBriefing.rawAnalysis ? (
                <div className="whitespace-pre-wrap leading-relaxed font-sans text-slate-200">
                  {aiBriefing.answer || aiBriefing.rawAnalysis}
                </div>
              ) : aiBriefing.brief ? (
                <div className="space-y-3">
                  <div className="font-bold text-sm text-purple-400 font-mono">{aiBriefing.brief.title}</div>
                  <div>
                    <div className="font-bold text-slate-200 mb-1 font-mono text-[11px]">EXECUTIVE THREAT ASSESSMENT:</div>
                    <ul className="list-disc list-inside space-y-1 text-slate-300">
                      {aiBriefing.brief.threatAssessment.map((item: string, i: number) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <div className="font-bold text-slate-200 mb-1 font-mono text-[11px]">MULTI-AGENCY TACTICAL ORDERS:</div>
                    <ul className="list-disc list-inside space-y-1 text-slate-300">
                      {aiBriefing.brief.tacticalDirectives.map((item: string, i: number) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-2.5 bg-purple-950/20 border border-purple-900/40 rounded">
                    <div className="font-bold text-purple-300 mb-0.5 font-mono text-[11px]">PUBLIC BROADCAST DIRECTIVE:</div>
                    <p className="text-slate-200">{aiBriefing.brief.publicBroadcast}</p>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}

      {/* CITIZEN GROUND INTEL & VERIFIED MEDIA TAB (COMMAND ACCESS) */}
      {activeTab === 'CITIZEN_INTEL' && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <span className="text-slate-300 font-semibold flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-emerald-400" />
              Citizen Ground Intelligence & Media Center
            </span>
            {/* Sub-tab switcher */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-md border border-slate-800">
              <button
                type="button"
                onClick={() => setCitizenIntelTab('VERIFIED')}
                className={`px-2.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
                  citizenIntelTab === 'VERIFIED'
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Verified ({citizenReports.filter((r) => r.verificationStatus === 'APPROVED').length})
              </button>
              <button
                type="button"
                onClick={() => setCitizenIntelTab('REJECTED')}
                className={`px-2.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
                  citizenIntelTab === 'REJECTED'
                    ? 'bg-rose-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Rejected / Audit ({citizenReports.filter((r) => r.verificationStatus === 'REJECTED').length})
              </button>
            </div>
          </div>

          {citizenIntelTab === 'VERIFIED' && (
            <>
              {citizenReports.filter((r) => r.verificationStatus === 'APPROVED').length === 0 ? (
                <div className="p-6 text-center bg-slate-900/60 rounded-lg border border-slate-800 text-slate-400 text-xs">
                  No verified citizen reports currently awaiting dispatch action.
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] text-slate-400">
                      Disaster Ground Footage ({citizenReports.filter((r) => r.verificationStatus === 'APPROVED').length})
                    </span>
                    {onCitizenReportAction && citizenReports.some((r) => r.verificationStatus === 'APPROVED') && (
                      <button
                        type="button"
                        onClick={() => {
                          onCitizenReportAction('', 'CLEAR_ALL_VERIFIED');
                          audioEngine.playAlertChime();
                        }}
                        className="px-2 py-0.5 rounded bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/40 text-[10px] font-mono flex items-center gap-1 transition-colors active:scale-95"
                      >
                        <Trash2 className="w-3 h-3" />
                        Clear All Verified Media
                      </button>
                    )}
                  </div>
                  {citizenReports
                    .filter((r) => r.verificationStatus === 'APPROVED')
                    .map((report) => (
                      <div
                        key={report.id}
                        className="p-3.5 bg-slate-900/80 rounded-lg border border-slate-800 hover:border-slate-700 space-y-2.5 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-100 text-xs">{report.affectedAreaName}</span>
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-800">
                                {report.severity}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Eyewitness: {report.citizenName || 'Anonymous Citizen'} ({report.contactNumber || 'Field Cell'})
                            </div>
                          </div>
                          <span className="text-[10px] font-mono text-emerald-400 font-bold shrink-0">
                            {report.verification?.relevanceConfidence || 95}% AI Confirmed
                          </span>
                        </div>

                        {/* Media and description */}
                        <div className="flex gap-3">
                          <div className="relative group w-24 h-16 bg-black rounded overflow-hidden shrink-0 border border-slate-800 flex items-center justify-center">
                            {report.mediaType === 'VIDEO' ? (
                              <div className="flex flex-col items-center justify-center text-red-400">
                                <Video className="w-5 h-5 mb-0.5" />
                                <span className="text-[8px] font-mono">VIDEO</span>
                              </div>
                            ) : (
                              <img
                                src={report.mediaUrl}
                                alt="Disaster site"
                                className="w-full h-full object-cover"
                              />
                            )}
                            {onCitizenReportAction && (
                              <button
                                type="button"
                                title="Delete this citizen photo/video"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onCitizenReportAction(report.id, 'DELETE');
                                  audioEngine.playAlertChime();
                                }}
                                className="absolute top-0.5 right-0.5 bg-black/75 hover:bg-rose-900 text-rose-300 hover:text-white p-1 rounded transition-colors shadow active:scale-95"
                              >
                                <Trash2 className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </div>
                          <div className="flex-1 space-y-1 text-xs">
                            <p className="text-slate-300 text-[11px] leading-relaxed line-clamp-2">
                              {report.description}
                            </p>
                            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                              <span>Clicked: {new Date(report.captureTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              <span>•</span>
                              <span className="text-emerald-400">Integrity: Verified (&lt;24h)</span>
                            </div>
                          </div>
                        </div>

                        {/* Quick Response Actions for Disaster Commanders */}
                        <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-1.5">
                          <span className="text-[10px] font-mono text-slate-400">
                            Action: {report.managementAction && report.managementAction !== 'NONE' ? report.managementAction : 'Pending Dispatch'}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {onCitizenReportAction && (
                              <button
                                type="button"
                                title="Permanently delete this citizen sent photo/video"
                                onClick={() => {
                                  onCitizenReportAction(report.id, 'DELETE');
                                  audioEngine.playAlertChime();
                                }}
                                className="px-2 py-1 rounded bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-700/60 text-[10px] font-semibold transition-colors flex items-center gap-1 active:scale-95"
                              >
                                <Trash2 className="w-3 h-3 text-rose-400" />
                                Delete Media
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                const freeUnit = units.find((u) => u.status === 'AVAILABLE') || units[0];
                                if (freeUnit) {
                                  onAssignUnit(freeUnit.id, `inc-${report.id}`);
                                  audioEngine.playSosSuccess();
                                }
                                if (onCitizenReportAction) {
                                  onCitizenReportAction(report.id, 'DISPATCHED_RESCUE');
                                }
                              }}
                              className="px-2 py-1 rounded bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold font-mono transition-colors shadow"
                            >
                              Dispatch Response Unit
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const openSeg = segments.find((s) => !s.isBlocked);
                                if (openSeg) {
                                  onToggleRoadBlock(openSeg.id);
                                }
                                if (onCitizenReportAction) {
                                  onCitizenReportAction(report.id, 'ROAD_BLOCKED');
                                }
                              }}
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-semibold transition-colors"
                            >
                              Mark Roadblock
                            </button>
                            {onCitizenReportAction && (
                              <button
                                type="button"
                                title="Revoke false alert and demote to rejected audit"
                                onClick={() => {
                                  onCitizenReportAction(report.id, 'REVOKE_REJECT');
                                  audioEngine.playAlertChime();
                                }}
                                className="px-2 py-1 rounded bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/60 text-[10px] font-semibold transition-colors"
                              >
                                Revoke (Non-Disaster)
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </>
          )}

          {/* REJECTED / AUDIT VIEW */}
          {citizenIntelTab === 'REJECTED' && (
            <>
              {citizenReports.filter((r) => r.verificationStatus === 'REJECTED').length === 0 ? (
                <div className="p-6 text-center bg-slate-900/60 rounded-lg border border-slate-800 text-slate-400 text-xs">
                  No rejected citizen media records in the audit queue.
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] text-slate-400">
                      Quarantined non-disaster / stale submissions ({citizenReports.filter((r) => r.verificationStatus === 'REJECTED').length})
                    </span>
                    {onCitizenReportAction && (
                      <button
                        type="button"
                        onClick={() => {
                          onCitizenReportAction('', 'CLEAR_ALL_REJECTED');
                          audioEngine.playAlertChime();
                        }}
                        className="px-2 py-0.5 rounded bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/40 text-[10px] font-mono flex items-center gap-1 transition-colors active:scale-95"
                      >
                        <Trash2 className="w-3 h-3" />
                        Clear All Rejected
                      </button>
                    )}
                  </div>
                  {citizenReports
                    .filter((r) => r.verificationStatus === 'REJECTED')
                    .map((report) => (
                      <div
                        key={report.id}
                        className="p-3 bg-slate-900/80 rounded-lg border border-rose-900/40 space-y-2 text-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-bold text-slate-200 text-xs">{report.affectedAreaName}</span>
                            <div className="text-[10px] text-slate-400">
                              By: {report.citizenName || 'Citizen Volunteer'} • Clicked: {new Date(report.captureTimestamp).toLocaleDateString()}
                            </div>
                          </div>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                            REJECTED
                          </span>
                        </div>

                        <div className="flex gap-2.5">
                          <div className="relative group w-20 h-14 bg-black rounded overflow-hidden shrink-0 border border-slate-800 flex items-center justify-center">
                            {report.mediaType === 'VIDEO' ? (
                              <Video className="w-5 h-5 text-rose-400" />
                            ) : (
                              <img src={report.mediaUrl} alt="Rejected evidence" className="w-full h-full object-cover" />
                            )}
                            {onCitizenReportAction && (
                              <button
                                type="button"
                                title="Delete this rejected photo/video"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onCitizenReportAction(report.id, 'DELETE');
                                  audioEngine.playAlertChime();
                                }}
                                className="absolute top-0.5 right-0.5 bg-black/75 hover:bg-rose-900 text-rose-300 hover:text-white p-1 rounded transition-colors shadow active:scale-95"
                              >
                                <Trash2 className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </div>
                          <div className="flex-1 space-y-0.5 text-[11px]">
                            <p className="text-slate-400 line-clamp-1">{report.description}</p>
                            <p className="text-rose-300 font-mono text-[10px]">
                              Reason: {report.verification?.verdictSummary || 'Failed timestamp or relevance check.'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800">
                          {onCitizenReportAction && (
                            <>
                              <button
                                type="button"
                                title="Delete rejected citizen photo/video"
                                onClick={() => {
                                  onCitizenReportAction(report.id, 'DELETE');
                                  audioEngine.playAlertChime();
                                }}
                                className="px-2 py-0.5 rounded bg-slate-900 hover:bg-rose-950 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-800 text-[10px] font-mono transition-colors flex items-center gap-1 active:scale-95"
                              >
                                <Trash2 className="w-2.5 h-2.5 text-rose-400" />
                                Delete Media
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  onCitizenReportAction(report.id, 'OVERRIDE_APPROVE');
                                  audioEngine.playSosSuccess();
                                }}
                                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-[10px] font-mono transition-colors"
                              >
                                Commander Override & Approve
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
