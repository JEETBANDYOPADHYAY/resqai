import React, { useState, useCallback, useMemo } from 'react';
import {
  Navigation,
  ShieldCheck,
  AlertTriangle,
  Radio,
  Clock,
  MapPin,
  CheckCircle2,
  PhoneCall,
  Flame,
  Waves,
  ArrowRight,
  Compass,
  Play,
  Share2,
  Volume2,
  Building2,
  Sparkles,
  RotateCcw,
  Check,
  Bot,
  Stethoscope,
  HeartPulse,
} from 'lucide-react';
import { RoutingResult, RoadNode, RoadSegment, ZonePolygon, MedicalRescueRequest } from '../types';
import { audioEngine } from '../utils/audioAlert';
import { GoogleMapsLiveGuidance } from './GoogleMapsLiveGuidance';
import { useLanguage } from '../context/LanguageContext';
import { VoicePackModal } from './VoicePackModal';
import { evaluateAllCandidateShelters } from '../utils/geoRouting';

interface CitizenNavigationCardProps {
  route: RoutingResult | null;
  originNode: RoadNode | null;
  allNodes: RoadNode[];
  shelters: RoadNode[];
  selectedTargetNodeId?: string | null;
  onTriggerSos: (notes: string) => Promise<boolean>;
  onSelectOrigin: (nodeId: string) => void;
  onSelectDestination: (nodeId: string | null) => void;
  onRerouteBlockCurrentRoad?: () => void;
  onUpdateNavPosition?: (coords: [number, number] | null, headingDeg: number) => void;
  onRecenterMap?: () => void;
  onOpenSmsBeacon?: () => void;
  onOpenAiCommander?: () => void;
  onOpenMedicalHelp?: () => void;
  activeRescueRequest?: MedicalRescueRequest | null;
  isOnline?: boolean;
  segments?: RoadSegment[];
  zones?: ZonePolygon[];
}

export const CitizenNavigationCard: React.FC<CitizenNavigationCardProps> = ({
  route,
  originNode,
  allNodes,
  shelters,
  selectedTargetNodeId = null,
  onTriggerSos,
  onSelectOrigin,
  onSelectDestination,
  onRerouteBlockCurrentRoad,
  onUpdateNavPosition,
  onRecenterMap,
  onOpenSmsBeacon,
  onOpenAiCommander,
  onOpenMedicalHelp,
  activeRescueRequest = null,
  isOnline = true,
  segments = [],
  zones = [],
}) => {
  const { t, language } = useLanguage();
  const [isLiveNavActive, setIsLiveNavActive] = useState<boolean>(false);
  const [isSosTransmitting, setIsSosTransmitting] = useState(false);
  const [sosSentSuccess, setSosSentSuccess] = useState(false);
  const [customSosNote, setCustomSosNote] = useState('');
  const [showSosModal, setShowSosModal] = useState(false);
  const [showOriginPicker, setShowOriginPicker] = useState(false);
  const [showShelterPicker, setShowShelterPicker] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);

  const handleBroadcastSos = async () => {
    setIsSosTransmitting(true);
    audioEngine.playAlertChime();

    const ok = await onTriggerSos(
      customSosNote || 'Citizen stranded in flood zone requesting urgent evacuation assist.'
    );
    setIsSosTransmitting(false);

    if (ok) {
      setSosSentSuccess(true);
      audioEngine.playSosSuccess();
      setShowSosModal(false);
      setTimeout(() => setSosSentSuccess(false), 7000);
    }
  };

  const handleCloseNavigation = useCallback(() => {
    setIsLiveNavActive(false);
    onUpdateNavPosition?.(null, 0);
  }, [onUpdateNavPosition]);

  // Pre-evaluate distances, ETAs and safety scores for all safe shelters
  const evaluatedShelters = useMemo(() => {
    if (!originNode || !shelters.length) return [];
    return evaluateAllCandidateShelters(
      originNode.id,
      shelters,
      allNodes,
      segments,
      zones,
      'CITIZEN'
    );
  }, [originNode, shelters, allNodes, segments, zones]);

  // If live navigation mode is turned on, render the full Google Maps HUD
  if (isLiveNavActive) {
    return (
      <GoogleMapsLiveGuidance
        route={route}
        originNode={originNode}
        allNodes={allNodes}
        shelters={shelters}
        selectedTargetNodeId={selectedTargetNodeId}
        onSelectOriginNode={onSelectOrigin}
        onSelectDestinationNode={onSelectDestination}
        onRerouteBlockCurrentRoad={onRerouteBlockCurrentRoad}
        onCloseNavigation={handleCloseNavigation}
        onUpdateNavPosition={onUpdateNavPosition}
        onRecenterMap={onRecenterMap}
      />
    );
  }

  // Stranded origin candidates
  const strandedOptions = allNodes.filter(
    (n) => n.isCitizenStart || (!n.isShelter && !n.isHospital && !n.isEmergencyDepot)
  );

  return (
    <div className="bg-[#0C0C0E] rounded-xl border border-slate-800 p-4 sm:p-5 shadow-2xl flex flex-col space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-wrap border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-emerald-950/40 text-emerald-400 border border-emerald-900/50 shrink-0">
            <Navigation className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {t('safeEvacuationNav')}
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                {t('liveGuidance')}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {t('dynamicPathingDesc')}
            </p>
          </div>
        </div>

        {/* Action Buttons: Doctors & Rescue, 2G SMS Beacon & Live SOS */}
        <div className="flex items-center gap-2 flex-wrap sm:justify-end">
          {onOpenMedicalHelp && (
            <button
              id="btn-emergency-medical-help"
              onClick={onOpenMedicalHelp}
              className="flex items-center justify-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 hover:text-emerald-100 font-semibold text-xs transition-all border border-emerald-600/60 shadow-sm"
              title="Contact Available Govt Doctors or Request Rapid Medical Rescue Team"
            >
              <Stethoscope className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Govt Doctors & Rescue</span>
              <span className="sm:hidden">Doctors</span>
              {activeRescueRequest && activeRescueRequest.status !== 'RESOLVED' && (
                <span className="w-2 h-2 rounded-full bg-red-400 animate-ping"></span>
              )}
            </button>
          )}

          {onOpenSmsBeacon && (
            <button
              id="btn-offline-sms-beacon"
              onClick={onOpenSmsBeacon}
              className="flex items-center justify-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 hover:text-amber-200 font-semibold text-xs transition-all border border-amber-600/50 shadow-sm"
              title="Open Low-Bandwidth 2G SMS Distress Beacon (No Internet Needed)"
            >
              <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="hidden sm:inline">2G SMS Beacon</span>
              <span className="sm:hidden">2G SMS</span>
            </button>
          )}

          <button
            id="btn-broadcast-sos"
            onClick={() => setShowSosModal(true)}
            className="flex items-center justify-center space-x-2 px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-900/40 transition-all border border-red-500 animate-pulse shrink-0"
          >
            <PhoneCall className="w-4 h-4" />
            <span>{t('broadcastSos')}</span>
          </button>
        </div>
      </div>

      {/* Active Medical Rescue Unit Banner */}
      {activeRescueRequest && activeRescueRequest.status !== 'RESOLVED' && (
        <div
          onClick={onOpenMedicalHelp}
          className="p-3 rounded-lg bg-gradient-to-r from-red-950/80 via-slate-900 to-red-950/80 border border-red-600 text-xs flex items-center justify-between cursor-pointer hover:border-red-400 transition animate-fade-in shadow-md"
        >
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-red-600 text-white animate-pulse">
              <HeartPulse className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-red-200">
                  Rescue Medical Team En Route: {activeRescueRequest.assignedUnitName}
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-red-600 text-white font-mono font-bold">
                  ETA ~{activeRescueRequest.etaMinutes}m
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-mono mt-0.5">
                Lead: {activeRescueRequest.leadParamedicName} • Target: {activeRescueRequest.locationName}
              </p>
            </div>
          </div>
          <span className="text-[11px] text-red-300 font-semibold underline shrink-0">
            View Live Tracker →
          </span>
        </div>
      )}

      {/* SOS Success Message */}
      {sosSentSuccess && (
        <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center justify-between animate-fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              {t('sosSuccessMessage')}
            </span>
          </div>
        </div>
      )}

      {/* Origin & Destination Selector Bar */}
      <div className="flex flex-col gap-3 p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
        {/* Origin */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="w-3 h-3 rounded-full bg-cyan-400 ring-4 ring-cyan-950 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[10px] text-slate-400 font-mono uppercase">{t('yourLocation')}</div>
            <div className="font-semibold text-slate-200 truncate">
              {originNode ? originNode.name : 'VIP Road / Lake Town (Stranded Zone)'}
            </div>
          </div>
          <button
            onClick={() => {
              setShowOriginPicker(!showOriginPicker);
              if (showShelterPicker) setShowShelterPicker(false);
            }}
            className="text-[10px] text-cyan-400 hover:underline shrink-0 font-medium"
          >
            {showOriginPicker ? 'Done' : t('changeLocation')}
          </button>
        </div>

        {/* Destination Safe Haven */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="w-3 h-3 rounded-full bg-emerald-400 ring-4 ring-emerald-950 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-slate-400 font-mono uppercase">{t('destinationSafeZone')}</span>
              {selectedTargetNodeId ? (
                <span className="text-[9px] bg-cyan-950 text-cyan-300 px-1 py-0.2 rounded border border-cyan-800 font-mono">
                  {t('customShelterActive')}
                </span>
              ) : (
                <span className="text-[9px] bg-emerald-950 text-emerald-300 px-1 py-0.2 rounded border border-emerald-800 font-mono flex items-center gap-0.5">
                  <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                  <span>AI Nearest</span>
                </span>
              )}
            </div>
            <div className="font-semibold text-emerald-400 truncate">
              {route ? (route.destinationNode?.name || (route as any).destinationNodeId || 'RG Kar Medical College & Flood Relief Shelter') : 'RG Kar Medical College & Flood Relief Shelter'}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
            {selectedTargetNodeId && (
              <button
                id="btn-revert-ai-shelter"
                onClick={() => {
                  onSelectDestination(null);
                  audioEngine.playAlertChime();
                }}
                className="text-[10px] text-amber-300 hover:text-amber-200 flex items-center space-x-0.5 bg-amber-950/40 border border-amber-800/60 px-1.5 py-0.5 rounded font-mono"
                title={t('revertToAiShelter')}
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span className="hidden sm:inline">AI Nearest</span>
              </button>
            )}
            <button
              id="btn-choose-safe-shelter"
              onClick={() => {
                setShowShelterPicker(!showShelterPicker);
                if (showOriginPicker) setShowOriginPicker(false);
              }}
              className="text-[10px] text-emerald-400 hover:underline font-medium"
            >
              {showShelterPicker ? 'Done' : t('changeSafeShelter')}
            </button>
          </div>
        </div>
      </div>

      {/* Origin Picker Dropdown */}
      {showOriginPicker && (
        <div className="p-3 bg-slate-950 rounded-lg border border-cyan-900/60 space-y-2 animate-fade-in">
          <div className="text-xs font-bold text-cyan-400 flex items-center justify-between">
            <span>{t('relocateJunction')}</span>
            <span className="text-[10px] text-slate-400">{t('selectJunctionHelp')}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
            {strandedOptions.map((node) => (
              <button
                key={node.id}
                onClick={() => {
                  onSelectOrigin(node.id);
                  setShowOriginPicker(false);
                }}
                className={`p-2 rounded text-left text-xs transition-all border ${
                  originNode?.id === node.id
                    ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300 font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="truncate font-semibold">{node.name}</div>
                <div className="text-[10px] text-slate-400 font-mono">Elevation: {node.elevationMeters ?? 6}m</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Safe Shelter Selection Panel */}
      {showShelterPicker && (
        <div className="p-3 bg-slate-950 rounded-xl border border-emerald-800/60 space-y-3 animate-fade-in shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
            <div>
              <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-emerald-400" />
                <span>Verified Safe Shelters & Evacuation Centers</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {t('selectShelterHelp')}
              </p>
            </div>
            {selectedTargetNodeId && (
              <button
                onClick={() => {
                  onSelectDestination(null);
                  setShowShelterPicker(false);
                  audioEngine.playAlertChime();
                }}
                className="self-start sm:self-auto px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-600/40 text-[10px] font-bold flex items-center gap-1 shrink-0"
              >
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>{t('revertToAiShelter')}</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
            {evaluatedShelters.map((item) => {
              const isSelected =
                selectedTargetNodeId === item.shelter.id ||
                (!selectedTargetNodeId && route?.destinationNode?.id === item.shelter.id);
              const isAiAutoPick =
                !selectedTargetNodeId && route?.destinationNode?.id === item.shelter.id;
              const occupancyPct = item.shelter.capacity
                ? Math.round(((item.shelter.currentOccupancy || 0) / item.shelter.capacity) * 100)
                : 40;
              const freeBeds = item.shelter.capacity
                ? item.shelter.capacity - (item.shelter.currentOccupancy || 0)
                : 250;

              return (
                <div
                  key={item.shelter.id}
                  onClick={() => {
                    onSelectDestination(item.shelter.id);
                    audioEngine.playAlertChime();
                  }}
                  className={`p-3 rounded-lg border text-left text-xs transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                    isSelected
                      ? 'bg-emerald-950/70 border-emerald-400 shadow-md shadow-emerald-950/40 ring-1 ring-emerald-400/50'
                      : 'bg-slate-900/90 border-slate-800 hover:bg-slate-800/90 hover:border-slate-700'
                  }`}
                >
                  <div>
                    {/* Header: Title + Badges */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold text-slate-100 flex items-center gap-1.5 min-w-0">
                        {item.shelter.isHospital ? (
                          <span className="p-1 rounded bg-blue-950 text-blue-400 border border-blue-800 shrink-0 text-xs">
                            🏥
                          </span>
                        ) : (
                          <span className="p-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 shrink-0 text-xs">
                            🛡️
                          </span>
                        )}
                        <span className="truncate">{item.shelter.name}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {isAiAutoPick && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-900/80 text-emerald-200 border border-emerald-600 text-[9px] font-mono font-bold flex items-center gap-0.5">
                            <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                            <span>AI Nearest</span>
                          </span>
                        )}
                        {isSelected && (
                          <span className="px-1.5 py-0.5 rounded bg-cyan-900/80 text-cyan-200 border border-cyan-500 text-[9px] font-mono font-bold flex items-center gap-0.5">
                            <Check className="w-2.5 h-2.5" />
                            <span>Active Route</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Capacity and Flood-Safe Elevation */}
                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>
                        Capacity: <strong className="text-white">{freeBeds.toLocaleString()}</strong> slots open
                      </span>
                      <span>
                        Elevation: <strong className="text-emerald-400">{item.shelter.elevationMeters ?? 11}m</strong> MSL
                      </span>
                    </div>

                    {/* Capacity Bar */}
                    <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
                      <div
                        className={`h-full ${occupancyPct > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min(100, occupancyPct)}%` }}
                      />
                    </div>
                  </div>

                  {/* Route Metrics to this Shelter */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                    <div className="flex items-center space-x-2 font-mono">
                      <span className="text-white font-bold">
                        {item.distanceKm > 0 ? `${item.distanceKm.toFixed(1)} km` : 'Direct'}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-emerald-400 font-bold">
                        {item.etaMinutes > 0 ? `${item.etaMinutes} min` : '5 min'}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-cyan-400 font-semibold" title="Corridor Safety Index Score">
                        {item.safetyScore > 0 ? `${item.safetyScore}% Safe` : '95% Safe'}
                      </span>
                    </div>

                    <button
                      type="button"
                      className={`px-2 py-1 rounded text-[10px] font-bold transition ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow'
                          : 'bg-slate-800 text-slate-300 hover:bg-emerald-700 hover:text-white'
                      }`}
                    >
                      {isSelected ? 'Selected' : 'Choose Path'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Custom Shelter Notification Banner */}
      {selectedTargetNodeId && route?.destinationNode && (
        <div className="p-2.5 rounded-lg bg-cyan-950/40 border border-cyan-800/60 flex items-center justify-between text-xs animate-fade-in">
          <div className="flex items-center space-x-2 text-cyan-300 min-w-0">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="truncate">
              Routing to chosen safe haven: <strong className="text-white">{route.destinationNode.name}</strong>
            </span>
          </div>
          <button
            onClick={() => {
              onSelectDestination(null);
              audioEngine.playAlertChime();
            }}
            className="text-[10px] text-amber-300 hover:text-amber-200 underline font-mono ml-2 shrink-0"
          >
            Reset to AI Nearest
          </button>
        </div>
      )}

      {/* Route Metrics Summary Card */}
      {route ? (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            {/* Distance */}
            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-center">
              <div className="text-[10px] text-slate-400 font-mono uppercase mb-1">{t('distanceKm')}</div>
              <div className="text-lg sm:text-xl font-bold font-mono text-white">
                {(route.totalDistanceKm ?? 0).toFixed(1)}{' '}
                <span className="text-xs font-normal text-slate-400">km</span>
              </div>
            </div>

            {/* Estimated Time */}
            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-center">
              <div className="text-[10px] text-slate-400 font-mono uppercase mb-1">{t('etaMinutes')}</div>
              <div className="text-lg sm:text-xl font-bold font-mono text-emerald-400">
                {Math.round(route.estimatedTimeMin ?? (route as any).estimatedTimeMinutes ?? 12)}{' '}
                <span className="text-xs font-normal text-slate-400">mins</span>
              </div>
            </div>

            {/* Route Safety Score */}
            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-center">
              <div className="text-[10px] text-slate-400 font-mono uppercase mb-1">{t('routeSafetyScore')}</div>
              <div className="text-lg sm:text-xl font-bold font-mono text-cyan-400">
                {(route.safetyIndexScore ?? (route as any).safetyScore ?? 95).toFixed(0)}
                <span className="text-xs font-normal text-slate-400">/100</span>
              </div>
            </div>
          </div>

          {/* Turn-by-Turn Preview List */}
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {(route.turnByTurn || []).slice(0, 3).map((step, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded bg-slate-900/50 border border-slate-800/80 text-xs"
              >
                <div className="flex items-center space-x-2 min-w-0">
                  <div className="w-5 h-5 rounded bg-slate-800 text-cyan-400 flex items-center justify-center text-[10px] font-bold font-mono shrink-0">
                    {idx + 1}
                  </div>
                  <span className="text-slate-200 truncate">{step.instruction}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 shrink-0 ml-2">
                  {(step as any).distanceMeters ?? Math.round((step.distanceKm ?? 0.2) * 1000)}m
                </span>
              </div>
            ))}
          </div>

          {/* Ask AI Incident Commander Quick Action */}
          {onOpenAiCommander && (
            <button
              id="btn-ask-ai-commander"
              onClick={onOpenAiCommander}
              className="w-full py-2.5 px-3 rounded-lg bg-purple-950/40 hover:bg-purple-900/60 border border-purple-800/60 hover:border-purple-600 text-purple-300 hover:text-purple-200 text-xs font-semibold flex items-center justify-between transition-all group shadow-sm"
            >
              <div className="flex items-center space-x-2">
                <Bot className="w-4 h-4 text-purple-400 group-hover:animate-pulse shrink-0" />
                <span className="font-sans">Ask AI Incident Commander</span>
              </div>
              <span className="text-[10px] text-purple-400 font-mono underline flex items-center space-x-1 shrink-0">
                <span>Check Route & Hazards</span>
                <span>→</span>
              </span>
            </button>
          )}

          {/* Voice Pack Quick Bar */}
          <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
            <div className="flex items-center space-x-2 text-slate-300">
              <Volume2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-slate-400">Voice Pack:</span>
              <span className="font-bold text-white font-mono">
                {language === 'bn' ? 'বাংলা (Bengali)' : language === 'hi' ? 'हिन्दी (Hindi)' : 'English (EN)'}
              </span>
            </div>
            <button
              onClick={() => setShowVoiceModal(true)}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium underline flex items-center space-x-1"
            >
              <span>Test / Settings</span>
            </button>
          </div>

          {/* Large Start Navigation Call-to-Action */}
          <button
            id="btn-start-google-maps-guidance"
            onClick={() => {
              setIsLiveNavActive(true);
              audioEngine.playAlertChime();
            }}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-sm tracking-wide shadow-xl shadow-emerald-950/50 flex items-center justify-center space-x-2 transition-all transform hover:scale-[1.01]"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{t('startLiveEvacuation')}</span>
          </button>
        </div>
      ) : (
        <div className="p-6 rounded-lg bg-slate-900/30 border border-slate-800 border-dashed text-center text-slate-400 text-xs">
          {t('computingRoute')}
        </div>
      )}

      {/* SOS Modal Dialog */}
      {showSosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0C0C0E] border border-red-800 rounded-xl p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-red-500 font-bold text-sm">
                <AlertTriangle className="w-5 h-5" />
                <span>{t('broadcastSos')}</span>
              </div>
              <button
                onClick={() => setShowSosModal(false)}
                className="text-slate-400 hover:text-white text-xs font-mono"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              This high-priority SOS distress beacon will be transmitted directly to the NDRF Field Commander and West Bengal 108 Ambulance Dispatch desk with your real-time GPS coordinates.
            </p>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1 font-mono uppercase">
                Additional Distress Notes (Optional):
              </label>
              <textarea
                value={customSosNote}
                onChange={(e) => setCustomSosNote(e.target.value)}
                placeholder="e.g., Water rising rapidly near ground floor, 2 elderly civilians with us..."
                rows={3}
                className="w-full bg-slate-900 text-slate-100 rounded-lg p-2.5 border border-slate-700 text-xs focus:outline-none focus:border-red-500"
              />
            </div>

            {onOpenMedicalHelp && (
              <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/50 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 text-emerald-300 text-[11px]">
                  <Stethoscope className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Need On-Duty Govt Doctor or Rescue Team?</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowSosModal(false);
                    onOpenMedicalHelp();
                  }}
                  className="px-2.5 py-1 rounded bg-emerald-900/70 hover:bg-emerald-800 text-emerald-200 border border-emerald-600/60 text-[11px] font-semibold"
                >
                  Doctor / Rescue
                </button>
              </div>
            )}

            {onOpenSmsBeacon && (
              <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-800/50 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 text-amber-300 text-[11px]">
                  <Radio className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
                  <span>Cellular data down / offline?</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowSosModal(false);
                    onOpenSmsBeacon();
                  }}
                  className="px-2.5 py-1 rounded bg-amber-900/70 hover:bg-amber-800 text-amber-200 border border-amber-600/60 text-[11px] font-semibold"
                >
                  Use 2G SMS Beacon
                </button>
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowSosModal(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs hover:bg-slate-700"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleBroadcastSos}
                disabled={isSosTransmitting}
                className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center space-x-2"
              >
                {isSosTransmitting ? (
                  <>
                    <Radio className="w-3.5 h-3.5 animate-pulse" />
                    <span>{t('sosTransmitting')}</span>
                  </>
                ) : (
                  <>
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>{t('broadcastSos')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Voice Pack Diagnostics and Test Modal */}
      <VoicePackModal isOpen={showVoiceModal} onClose={() => setShowVoiceModal(false)} />
    </div>
  );
};

