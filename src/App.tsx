/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { MapView } from './components/MapView';
import { TelemetryPanel } from './components/TelemetryPanel';
import { ThunderLightningAlertBanner } from './components/ThunderLightningAlertBanner';
import { LandslideEarlyWarningBanner } from './components/LandslideEarlyWarningBanner';
import { DamRupturePredictionBanner } from './components/DamRupturePredictionBanner';
import { RiskEvaluationCard } from './components/RiskEvaluationCard';
import { CitizenNavigationCard } from './components/CitizenNavigationCard';
import { EmergencyCommandPanel } from './components/EmergencyCommandPanel';
import { CitizenDisasterReportHub } from './components/CitizenDisasterReportHub';
import { PythonModelModal } from './components/PythonModelModal';
import { EmergencyAuthModal } from './components/EmergencyAuthModal';
import { AiCommanderModal } from './components/AiCommanderModal';
import { EmergencyMedicalHelpModal } from './components/EmergencyMedicalHelpModal';
import {
  SensorTelemetry,
  MLHazardEvaluation,
  UserViewProfile,
  RoadNode,
  RoadSegment,
  ZonePolygon,
  EmergencyUnit,
  DispatchIncident,
  RoutingResult,
  AuthorizedPersonnel,
  LightningStrike,
  LandslideStation,
  DamBarrageStation,
  CitizenDisasterMediaReport,
  MedicalRescueRequest,
} from './types';
import {
  INITIAL_TELEMETRY,
  ROAD_NODES,
  ROAD_SEGMENTS,
  RISK_ZONES,
  INITIAL_UNITS,
  INITIAL_INCIDENTS,
  INITIAL_LIGHTNING_STRIKES,
  INITIAL_LANDSLIDE_STATIONS,
  INITIAL_DAM_STATIONS,
  SCENARIO_PRESETS,
  getScenarioRiskZones,
} from './data/mockDisasterData';
import { INITIAL_CITIZEN_REPORTS } from './data/citizenReportSamples';
import { evaluateDisasterRisk } from './utils/mlEngine';
import { calculateDynamicRoute } from './utils/geoRouting';
import { audioEngine } from './utils/audioAlert';
import { OfflineStatusBar } from './components/OfflineStatusBar';
import { OfflineSmsBeaconModal } from './components/OfflineSmsBeaconModal';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { saveToOfflineCache, loadFromOfflineCache } from './utils/offlineStorage';

export default function App() {
  // Application State
  const [currentProfile, setCurrentProfile] = useState<UserViewProfile>('CITIZEN');
  const [isEmergencyAuthorized, setIsEmergencyAuthorized] = useState<boolean>(() => {
    try {
      return !!localStorage.getItem('resqai_emergency_auth');
    } catch {
      return false;
    }
  });
  const [authorizedUser, setAuthorizedUser] = useState<AuthorizedPersonnel | null>(() => {
    try {
      const saved = localStorage.getItem('resqai_emergency_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [savedPasskey, setSavedPasskey] = useState<string>(() => {
    try {
      return localStorage.getItem('resqai_emergency_passkey') || 'RESQ2026';
    } catch {
      return 'RESQ2026';
    }
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  const [telemetry, setTelemetry] = useState<SensorTelemetry>(INITIAL_TELEMETRY);
  const [mlEvaluation, setMlEvaluation] = useState<MLHazardEvaluation>(() =>
    evaluateDisasterRisk(INITIAL_TELEMETRY)
  );
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('thunder-lightning');
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [isSirenActive, setIsSirenActive] = useState<boolean>(false);
  const [isPythonModalOpen, setIsPythonModalOpen] = useState<boolean>(false);
  const [isAiCommanderModalOpen, setIsAiCommanderModalOpen] = useState<boolean>(false);
  const [isMedicalHelpModalOpen, setIsMedicalHelpModalOpen] = useState<boolean>(false);
  const [activeRescueRequest, setActiveRescueRequest] = useState<MedicalRescueRequest | null>(null);
  const [isFlashActive, setIsFlashActive] = useState<boolean>(false);

  // Geo & Infrastructure State
  const [nodes, setNodes] = useState<RoadNode[]>(ROAD_NODES);
  const [segments, setSegments] = useState<RoadSegment[]>(ROAD_SEGMENTS);
  const [zones, setZones] = useState<ZonePolygon[]>(RISK_ZONES);
  const [units, setUnits] = useState<EmergencyUnit[]>(INITIAL_UNITS);
  const [incidents, setIncidents] = useState<DispatchIncident[]>(INITIAL_INCIDENTS);
  const [lightningStrikes, setLightningStrikes] = useState<LightningStrike[]>(INITIAL_LIGHTNING_STRIKES);
  const [landslideStations, setLandslideStations] = useState<LandslideStation[]>(INITIAL_LANDSLIDE_STATIONS);
  const [damStations, setDamStations] = useState<DamBarrageStation[]>(INITIAL_DAM_STATIONS);
  const [citizenReports, setCitizenReports] = useState<CitizenDisasterMediaReport[]>(INITIAL_CITIZEN_REPORTS);

  // Sync citizen reports from server API
  useEffect(() => {
    fetch('/api/citizen-reports')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.reports)) {
          setCitizenReports(data.reports);
        }
      })
      .catch(() => {
        // Fallback to offline / initial cache
      });
  }, []);

  const handleSubmitVerifiedReport = (newReport: CitizenDisasterMediaReport) => {
    setCitizenReports((prev) => [newReport, ...prev.filter((r) => r.id !== newReport.id)]);

    if (newReport.verificationStatus === 'APPROVED') {
      const newInc: DispatchIncident = {
        id: `inc-cit-${newReport.id}`,
        title: `Verified Ground Report: ${newReport.category.replace(/_/g, ' ')} at ${newReport.affectedAreaName}`,
        type: newReport.category === 'URBAN_FLOODING' || newReport.category === 'DAM_OVERFLOW' ? 'FLOOD_RESCUE' : 'ROAD_CLEARANCE',
        priority: newReport.severity === 'CRITICAL' ? 'CODE_RED' : 'CODE_YELLOW',
        coordinates: newReport.coordinates,
        address: newReport.affectedAreaName,
        reportedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'PENDING',
        callerSosCount: 1,
        notes: `[AI-VERIFIED MEDIA EVIDENCE - ${newReport.verification?.relevanceConfidence || 96}% Conf.] ${newReport.description} (Clicked: ${new Date(newReport.captureTimestamp).toLocaleTimeString()})`,
      };
      setIncidents((prev) => [newInc, ...prev]);
    }
  };

  const handleDismissIncident = (incidentId: string) => {
    setIncidents((prev) => prev.filter((inc) => inc.id !== incidentId));
    fetch(`/api/incidents/${incidentId}`, { method: 'DELETE' }).catch(() => {});
  };

  const handleCitizenReportAction = (reportId: string, action: string) => {
    if (action === 'CLEAR_ALL_REJECTED') {
      setCitizenReports((prev) => prev.filter((r) => r.verificationStatus !== 'REJECTED'));
      fetch('/api/citizen-reports?type=rejected', { method: 'DELETE' }).catch(() => {});
      return;
    }

    if (action === 'CLEAR_ALL_VERIFIED') {
      setCitizenReports((prev) => prev.filter((r) => r.verificationStatus !== 'APPROVED'));
      setIncidents((prev) =>
        prev.filter((inc) => !inc.id.startsWith('inc-cit-') && !inc.id.startsWith('inc-override-') && !inc.notes?.includes('AI-VERIFIED MEDIA EVIDENCE'))
      );
      fetch('/api/citizen-reports?type=approved', { method: 'DELETE' }).catch(() => {});
      return;
    }

    if (action === 'DELETE') {
      const targetReport = citizenReports.find((r) => r.id === reportId);
      setCitizenReports((prev) => prev.filter((r) => r.id !== reportId));
      setIncidents((prev) =>
        prev.filter(
          (inc) =>
            inc.id !== reportId &&
            inc.id !== `inc-${reportId}` &&
            inc.id !== `inc-cit-${reportId}` &&
            inc.id !== `inc-override-${reportId}` &&
            !inc.id.includes(reportId) &&
            !(targetReport && inc.address.toLowerCase().includes(targetReport.affectedAreaName.toLowerCase().slice(0, 10))) &&
            !(targetReport && inc.notes?.toLowerCase().includes(targetReport.affectedAreaName.toLowerCase().slice(0, 10)))
        )
      );
      fetch(`/api/citizen-reports/${reportId}`, { method: 'DELETE' }).catch(() => {});
      return;
    }

    if (action === 'REVOKE_REJECT') {
      const rep = citizenReports.find((r) => r.id === reportId);
      setCitizenReports((prev) =>
        prev.map((r) => {
          if (r.id === reportId) {
            return {
              ...r,
              verificationStatus: 'REJECTED' as const,
              managementAction: 'REVOKED_AS_NON_DISASTER' as any,
              verification: r.verification ? {
                ...r.verification,
                aiVerdict: 'REJECTED',
                verdictSummary: 'VERIFICATION REVOKED: Marked as non-disaster / irrelevant by Incident Commander.',
              } : undefined,
            };
          }
          return r;
        })
      );
      if (rep) {
        setIncidents((prev) =>
          prev.filter(
            (inc) =>
              inc.id !== `inc-${reportId}` &&
              inc.id !== `inc-cit-${reportId}` &&
              !inc.title.includes(rep.affectedAreaName)
          )
        );
      }
      fetch(`/api/citizen-reports/${reportId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REVOKE_REJECT' }),
      }).catch(() => {});
      return;
    }

    setCitizenReports((prev) =>
      prev.map((r) => {
        if (r.id === reportId) {
          if (action === 'OVERRIDE_APPROVE') {
            return {
              ...r,
              verificationStatus: 'APPROVED' as const,
              managementNotified: true,
              notifiedAt: new Date().toISOString(),
              managementAction: 'OVERRIDE_APPROVED' as any,
            };
          }
          return { ...r, managementAction: action as any };
        }
        return r;
      })
    );

    if (action === 'OVERRIDE_APPROVE') {
      const rep = citizenReports.find((r) => r.id === reportId);
      if (rep) {
        const newInc: DispatchIncident = {
          id: `inc-override-${Date.now()}`,
          title: `Commander Override: ${rep.category.replace(/_/g, ' ')} at ${rep.affectedAreaName}`,
          type: rep.category === 'URBAN_FLOODING' || rep.category === 'DAM_OVERFLOW' ? 'FLOOD_RESCUE' : 'ROAD_CLEARANCE',
          priority: 'CODE_RED',
          coordinates: rep.coordinates,
          address: rep.affectedAreaName,
          reportedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'PENDING',
          callerSosCount: 1,
          notes: `[COMMANDER OVERRIDE] Approved from audit queue by Incident Commander: ${rep.description}`,
        };
        setIncidents((prev) => [newInc, ...prev]);
        audioEngine.playSosSuccess();
      }
    }

    fetch(`/api/citizen-reports/${reportId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    }).catch(() => {});
  };

  // Selected Target & Origin for citizen or ambulance
  const [selectedOriginNodeId, setSelectedOriginNodeId] = useState<string>('node-citizen-start');
  const [selectedTargetNodeId, setSelectedTargetNodeId] = useState<string | null>(null);
  const [calculatedRoute, setCalculatedRoute] = useState<RoutingResult | null>(null);

  // Live Navigation GPS State
  const [navPosition, setNavPosition] = useState<[number, number] | null>(null);
  const [navHeadingDeg, setNavHeadingDeg] = useState<number>(0);

  // Offline Resilience & 2G SMS Beacon State
  const { isOnline, isSimulatingOffline, toggleSimulateOffline } = useOnlineStatus();
  const [isSmsBeaconOpen, setIsSmsBeaconOpen] = useState<boolean>(false);

  // Auto-persist core evacuation graph & state into offline storage
  useEffect(() => {
    saveToOfflineCache({
      nodes,
      segments,
      zones,
      units,
      lastKnownOriginNodeId: selectedOriginNodeId,
      cachedRoute: calculatedRoute,
    });
  }, [nodes, segments, zones, units, selectedOriginNodeId, calculatedRoute]);

  // Trigger Realistic Screen Lightning Flash
  const triggerScreenFlash = useCallback(() => {
    setIsFlashActive(true);
    setTimeout(() => {
      setIsFlashActive(false);
      setTimeout(() => {
        setIsFlashActive(true);
        setTimeout(() => setIsFlashActive(false), 90);
      }, 70);
    }, 120);
  }, []);

  // Recalculate dynamic route whenever nodes, segments, zones, profile, or target changes
  const recomputeRoute = useCallback(() => {
    const originNodeId =
      currentProfile === 'CITIZEN' ? selectedOriginNodeId : 'node-depot-main';
    const targetId =
      selectedTargetNodeId ||
      (currentProfile === 'CITIZEN' ? null : 'node-hospital-memorial');

    const result = calculateDynamicRoute(
      originNodeId,
      targetId,
      nodes,
      segments,
      zones,
      currentProfile
    );
    setCalculatedRoute(result);
  }, [nodes, segments, zones, currentProfile, selectedOriginNodeId, selectedTargetNodeId]);

  useEffect(() => {
    recomputeRoute();
  }, [recomputeRoute]);

  const telemetryRef = useRef<SensorTelemetry>(telemetry);
  telemetryRef.current = telemetry;

  // Stable navigation GPS position handler with coordinate change detection
  const handleUpdateNavPosition = useCallback((pos: [number, number] | null, heading: number) => {
    setNavPosition((prev) => {
      if (!pos && !prev) return prev;
      if (pos && prev && prev[0] === pos[0] && prev[1] === pos[1]) return prev;
      return pos;
    });
    setNavHeadingDeg((prev) => (Math.abs(prev - heading) < 0.5 ? prev : heading));
  }, []);

  const handleRecenterMap = useCallback(() => {
    setNavPosition((prev) => (prev ? [prev[0], prev[1]] : null));
  }, []);

  // Real-time sensor telemetry streaming polling
  useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(async () => {
      if (isOnline) {
        try {
          const res = await fetch('/api/telemetry');
          if (res.ok) {
            const data = await res.json();
            if (data.telemetry) {
              setTelemetry(data.telemetry);
              setMlEvaluation(data.mlEvaluation || evaluateDisasterRisk(data.telemetry));
              return;
            }
          }
        } catch {
          // Fall through to offline jitter
        }
      }

      // Offline / network failure in-browser subtle stochastic jitter
      const prev = telemetryRef.current;
      const jitter = (Math.random() - 0.5) * 0.4;
      const updated: SensorTelemetry = {
        ...prev,
        rainfall: Math.max(0, Math.round((prev.rainfall + (Math.random() - 0.5) * 0.8) * 10) / 10),
        riverLevel: Math.max(0, Math.round((prev.riverLevel + jitter * 0.05) * 100) / 100),
        windSpeed: Math.max(0, Math.round((prev.windSpeed + (Math.random() - 0.5) * 1.2) * 10) / 10),
        timestamp: new Date().toISOString(),
      };
      setTelemetry(updated);
      setMlEvaluation(evaluateDisasterRisk(updated));
    }, 2500);

    return () => clearInterval(interval);
  }, [isStreaming, isOnline]);

  // Handle Road Blockade Toggle
  const handleToggleRoadBlock = async (segmentId: string) => {
    audioEngine.playAlertChime();

    // Optimistic local update
    setSegments((prev) =>
      prev.map((s) => {
        if (s.id === segmentId) {
          const nextBlocked = !s.isBlocked;
          return {
            ...s,
            isBlocked: nextBlocked,
            blockReason: nextBlocked
              ? s.blockReason || 'Emergency Barrier Deployed'
              : undefined,
          };
        }
        return s;
      })
    );

    try {
      await fetch('/api/roads/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ segmentId }),
      });
    } catch {
      // Handled by local state
    }
  };

  // Batch clear all road blockades
  const handleBatchClearRoads = async () => {
    audioEngine.playAlertChime();
    setSegments((prev) =>
      prev.map((s) => ({
        ...s,
        isBlocked: false,
        blockReason: undefined,
      }))
    );

    try {
      await fetch('/api/roads/batch-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockedSegmentIds: [] }),
      });
    } catch {
      // Local state active
    }
  };

  // Handle Scenario Preset Switch
  const handleSelectScenario = async (scenarioId: string) => {
    setSelectedScenarioId(scenarioId);
    audioEngine.playAlertChime();

    // 1. Immediate optimistic update of scenario disaster state
    const preset = SCENARIO_PRESETS.find((s) => s.id === scenarioId);
    if (preset) {
      // Audio-visual cues tailored to scenario
      if (scenarioId === 'thunder-lightning') {
        triggerScreenFlash();
        setTimeout(() => {
          audioEngine.playThunderAlertSound();
        }, 350);
      } else if (scenarioId === 'dam-rupture') {
        audioEngine.playHydroSurgeSound();
      } else if (scenarioId === 'landslide') {
        audioEngine.playLandslideRumbleSound();
      } else {
        audioEngine.playRerouteChime();
      }

      // Update telemetry
      const newTelem: SensorTelemetry = {
        ...INITIAL_TELEMETRY,
        ...preset.telemetry,
        timestamp: new Date().toISOString(),
      };
      setTelemetry(newTelem);
      setMlEvaluation(evaluateDisasterRisk(newTelem));

      // Dynamically adjust road segment blocks according to scenario preset
      setSegments((prev) =>
        prev.map((seg) => {
          const isBlocked = preset.defaultBlockedRoads.includes(seg.id);
          return {
            ...seg,
            isBlocked,
            blockReason: isBlocked
              ? seg.blockReason || `${preset.name} Closure`
              : undefined,
          };
        })
      );

      // Dynamically load tailored scenario risk zones
      setZones(getScenarioRiskZones(scenarioId));
    }

    // 2. Synchronize with backend API
    try {
      const res = await fetch(`/api/scenario/${scenarioId}`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.telemetry) {
          setTelemetry((prev) => ({ ...prev, ...data.telemetry }));
        }
        if (data.mlEvaluation) {
          setMlEvaluation(data.mlEvaluation);
        }
        if (data.roadSegments) {
          setSegments(data.roadSegments);
        }
      }
    } catch (err) {
      console.error('Error switching scenario:', err);
    }
  };

  // Handle Manual Telemetry Adjustment
  const handleUpdateTelemetry = async (updated: Partial<SensorTelemetry>) => {
    const newTelem = { ...telemetry, ...updated, timestamp: new Date().toISOString() };
    setTelemetry(newTelem);
    setMlEvaluation(evaluateDisasterRisk(newTelem));

    try {
      await fetch('/api/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch {
      // Local evaluation active
    }
  };

  // Handle SOS Beacon Broadcast
  const handleTriggerSos = async (notes: string): Promise<boolean> => {
    const citizenNode = nodes.find((n) => n.isCitizenStart);
    const coords = citizenNode?.coordinates || [37.7660, -122.4220];

    const newInc: DispatchIncident = {
      id: `sos-${Date.now()}`,
      title: 'Citizen SOS Beacon: Flood Evacuation Request',
      type: 'EVACUATION_ASSIST',
      priority: 'CODE_RED',
      coordinates: coords,
      address: 'Valencia Floodway Corridor',
      reportedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'PENDING',
      callerSosCount: 1,
      notes,
    };

    setIncidents((prev) => [newInc, ...prev]);

    try {
      await fetch('/api/dispatch/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coordinates: coords,
          notes,
        }),
      });
      return true;
    } catch {
      return true;
    }
  };

  // Handle Unit Dispatch Assignment
  const handleAssignUnit = async (unitId: string, incidentId: string) => {
    audioEngine.playAlertChime();
    setUnits((prev) =>
      prev.map((u) => (u.id === unitId ? { ...u, status: 'EN_ROUTE', assignedIncidentId: incidentId } : u))
    );
    setIncidents((prev) =>
      prev.map((i) => (i.id === incidentId ? { ...i, status: 'DISPATCHED', assignedUnitId: unitId } : i))
    );

    try {
      await fetch('/api/dispatch/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unitId, incidentId }),
      });
    } catch {
      // Handled
    }
  };

  const handleToggleSiren = () => {
    const next = !isSirenActive;
    setIsSirenActive(next);
    audioEngine.toggleSiren(next);
  };

  // Emergency Medical Rescue Dispatch Handlers
  const handleRequestMedicalRescue = (request: MedicalRescueRequest) => {
    setActiveRescueRequest(request);

    // Register active incident in Emergency Command Panel & Map
    const newRescueIncident: DispatchIncident = {
      id: `inc-rescue-${request.id}`,
      title: `URGENT MEDICAL RESCUE: ${request.emergencyCategory.replace(/_/g, ' ')} (${request.patientCount} Px)`,
      type: 'MEDICAL_EMERGENCY',
      priority: 'CODE_RED',
      coordinates: request.coordinates,
      address: `${request.locationName} [Water: ${request.waterDepth.replace(/_/g, ' ')}]`,
      reportedAt: request.requestedAt,
      status: 'DISPATCHED',
      assignedUnitId: request.assignedUnitId,
      callerSosCount: 1,
      notes: `[DIRECT MEDICAL RESCUE REQUEST] ${request.notes || 'Emergency on-site triage required'}. Unit: ${request.assignedUnitName}, Lead: ${request.leadParamedicName}, ETA: ~${request.etaMinutes}m, Contact: ${request.contactNumber || 'N/A'}`,
    };

    setIncidents((prev) => [newRescueIncident, ...prev]);

    // Update assigned unit status to EN_ROUTE
    setUnits((prev) =>
      prev.map((u) =>
        u.id === request.assignedUnitId
          ? { ...u, status: 'EN_ROUTE' as const, assignedIncidentId: newRescueIncident.id }
          : u
      )
    );

    audioEngine.playSosSuccess();
  };

  const handleResolveMedicalRescue = (requestId: string) => {
    setActiveRescueRequest((prev) =>
      prev && prev.id === requestId ? { ...prev, status: 'RESOLVED' } : prev
    );
    audioEngine.playAlertChime();
  };

  const handleCancelMedicalRescue = (_requestId: string) => {
    setActiveRescueRequest(null);
  };

  // Emergency Authentication Handlers
  const handleProfileChange = (profile: UserViewProfile) => {
    if (profile === 'AMBULANCE' && !isEmergencyAuthorized) {
      setIsAuthModalOpen(true);
      return;
    }
    setCurrentProfile(profile);
  };

  const handleAuthSuccess = (personnel: AuthorizedPersonnel) => {
    setIsEmergencyAuthorized(true);
    setAuthorizedUser(personnel);
    try {
      localStorage.setItem('resqai_emergency_auth', 'true');
      localStorage.setItem('resqai_emergency_user', JSON.stringify(personnel));
    } catch {
      // Ignored
    }
    setIsAuthModalOpen(false);
    setCurrentProfile('AMBULANCE');
    audioEngine.playAlertChime();
  };

  const handleEmergencyLogout = () => {
    setIsEmergencyAuthorized(false);
    setAuthorizedUser(null);
    try {
      localStorage.removeItem('resqai_emergency_auth');
      localStorage.removeItem('resqai_emergency_user');
    } catch {
      // Ignored
    }
    setCurrentProfile('CITIZEN');
  };

  const handleUpdatePasskey = (newPasskey: string) => {
    setSavedPasskey(newPasskey);
    try {
      localStorage.setItem('resqai_emergency_passkey', newPasskey);
    } catch {
      // Ignored
    }
  };

  const safeShelters = nodes.filter((n) => n.isShelter || n.isHospital);

  // Handle dynamic road blockage and rerouting reported by stranded citizen
  const handleCitizenReportRoadblock = () => {
    if (!calculatedRoute || calculatedRoute.segmentIds.length === 0) return;
    const targetSegmentId = calculatedRoute.segmentIds[0];
    if (targetSegmentId) {
      handleToggleRoadBlock(targetSegmentId);
    }
  };

  const currentOriginNode =
    nodes.find((n) => n.id === selectedOriginNodeId) ||
    nodes.find((n) => n.isCitizenStart) ||
    nodes[0];

  const activeScenarioPreset = SCENARIO_PRESETS.find((s) => s.id === selectedScenarioId);

  return (
    <div className="min-h-screen bg-[#09090B] text-slate-200 flex flex-col selection:bg-red-600 selection:text-white">
      {/* Screen Lightning Flash Overlay */}
      {isFlashActive && (
        <div className="fixed inset-0 z-50 pointer-events-none bg-white/40 mix-blend-screen transition-opacity duration-75 animate-pulse" />
      )}

      {/* Tactical Navbar */}
      <Navbar
        currentProfile={currentProfile}
        onProfileChange={handleProfileChange}
        mlEvaluation={mlEvaluation}
        selectedScenarioId={selectedScenarioId}
        onSelectScenario={handleSelectScenario}
        isStreaming={isStreaming}
        onToggleStreaming={() => setIsStreaming(!isStreaming)}
        isSirenActive={isSirenActive}
        onToggleSiren={handleToggleSiren}
        onOpenPythonModal={() => setIsPythonModalOpen(true)}
        onOpenAiCommanderModal={() => setIsAiCommanderModalOpen(true)}
        onOpenMedicalHelpModal={() => setIsMedicalHelpModalOpen(true)}
        activeRescueRequest={activeRescueRequest}
        isEmergencyAuthorized={isEmergencyAuthorized}
        authorizedUser={authorizedUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onEmergencyLogout={handleEmergencyLogout}
      />

      {/* Offline Connectivity & Resilience Bar */}
      <OfflineStatusBar
        isOnline={isOnline}
        isSimulatingOffline={isSimulatingOffline}
        onToggleSimulateOffline={toggleSimulateOffline}
        onOpenSmsBeacon={() => setIsSmsBeaconOpen(true)}
      />

      {/* Main Dashboard Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5 sm:space-y-6 overflow-x-hidden">
        {/* Thunder & Lightning Active Warning Banner */}
        <ThunderLightningAlertBanner
          telemetry={telemetry}
          mlEvaluation={mlEvaluation}
          lightningStrikes={lightningStrikes}
          onTriggerFlashEffect={triggerScreenFlash}
        />

        {/* Landslide Early Warning System Banner */}
        <LandslideEarlyWarningBanner
          telemetry={telemetry}
          mlEvaluation={mlEvaluation}
          stations={landslideStations}
        />

        {/* Dam Rupture & Hydro-Surge Early Warning System Banner */}
        <DamRupturePredictionBanner
          telemetry={telemetry}
          mlEvaluation={mlEvaluation}
          stations={damStations}
        />

        {/* Real-time Telemetry Ingestion Bar */}
        <TelemetryPanel
          telemetry={telemetry}
          mlEvaluation={mlEvaluation}
          onUpdateTelemetry={handleUpdateTelemetry}
          onResetTelemetry={() => handleSelectScenario(selectedScenarioId)}
        />

        {/* Primary Operational Stage: Interactive Map & Tactical Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
          {/* Map & Ground Intelligence Column (7 cols on desktop) */}
          <div className="lg:col-span-7 flex flex-col space-y-5">
            {/* Interactive Map View */}
            <div className="h-[480px] sm:h-[540px] lg:h-[620px] flex flex-col">
              <MapView
                nodes={nodes}
                segments={segments}
                zones={zones}
                route={calculatedRoute}
                units={units}
                incidents={incidents}
                lightningStrikes={lightningStrikes}
                landslideStations={landslideStations}
                damStations={damStations}
                navPosition={navPosition}
                navHeadingDeg={navHeadingDeg}
                profile={currentProfile}
                selectedScenarioId={selectedScenarioId}
                hazardFocus={activeScenarioPreset?.hazardFocus}
                onToggleRoadBlock={handleToggleRoadBlock}
                onSelectNodeAsOrigin={(nodeId) => {
                  setSelectedOriginNodeId(nodeId);
                  audioEngine.playAlertChime();
                }}
                onSelectNodeAsDestination={(nodeId) => {
                  setSelectedTargetNodeId(nodeId);
                  audioEngine.playAlertChime();
                }}
                selectedTargetNodeId={selectedTargetNodeId}
              />
            </div>

            {/* Citizen Disaster Media Intelligence & Automated AI Verification Hub */}
            <CitizenDisasterReportHub
              reports={citizenReports}
              onSubmitVerifiedReport={handleSubmitVerifiedReport}
              onFocusCoordinates={(coords) => {
                setNavPosition(coords);
                audioEngine.playAlertChime();
              }}
              onToggleRoadBlockAtLocation={(locName) => {
                const targetSeg =
                  segments.find((s) => s.name.toLowerCase().includes(locName.toLowerCase().slice(0, 5))) ||
                  segments[0];
                if (targetSeg) {
                  handleToggleRoadBlock(targetSeg.id);
                }
              }}
              currentProfile={currentProfile}
              onCitizenReportAction={handleCitizenReportAction}
              onAssignUnit={handleAssignUnit}
              units={units}
            />
          </div>

          {/* Tactical View Profile Column (5 cols on desktop) */}
          <div className="lg:col-span-5 flex flex-col space-y-5">
            {currentProfile === 'CITIZEN' ? (
              <CitizenNavigationCard
                route={calculatedRoute}
                originNode={currentOriginNode}
                allNodes={nodes}
                shelters={safeShelters}
                selectedTargetNodeId={selectedTargetNodeId}
                segments={segments}
                zones={zones}
                onTriggerSos={handleTriggerSos}
                onSelectOrigin={setSelectedOriginNodeId}
                onSelectDestination={setSelectedTargetNodeId}
                onRerouteBlockCurrentRoad={handleCitizenReportRoadblock}
                onUpdateNavPosition={handleUpdateNavPosition}
                onRecenterMap={handleRecenterMap}
                onOpenSmsBeacon={() => setIsSmsBeaconOpen(true)}
                onOpenAiCommander={() => setIsAiCommanderModalOpen(true)}
                onOpenMedicalHelp={() => setIsMedicalHelpModalOpen(true)}
                activeRescueRequest={activeRescueRequest}
                isOnline={isOnline}
              />
            ) : (
              <EmergencyCommandPanel
                incidents={incidents}
                units={units}
                segments={segments}
                ambulanceRoute={calculatedRoute}
                onToggleRoadBlock={handleToggleRoadBlock}
                onAssignUnit={handleAssignUnit}
                onBatchClearRoads={handleBatchClearRoads}
                authorizedPersonnel={authorizedUser}
                onLockConsole={handleEmergencyLogout}
                citizenReports={citizenReports}
                onCitizenReportAction={handleCitizenReportAction}
                onDismissIncident={handleDismissIncident}
              />
            )}

            {/* Pre-Trained ML Risk Evaluation Card */}
            <RiskEvaluationCard
              mlEvaluation={mlEvaluation}
              onOpenPythonModal={() => setIsPythonModalOpen(true)}
            />
          </div>
        </div>
      </main>

      {/* Low-Bandwidth 2G SMS Distress Beacon Modal */}
      <OfflineSmsBeaconModal
        isOpen={isSmsBeaconOpen}
        onClose={() => setIsSmsBeaconOpen(false)}
        currentLocationNode={currentOriginNode}
        coordinates={
          currentOriginNode?.coordinates
            ? { lat: currentOriginNode.coordinates[0], lng: currentOriginNode.coordinates[1] }
            : undefined
        }
        allNodes={nodes}
        onOpenMedicalHelp={() => setIsMedicalHelpModalOpen(true)}
      />

      {/* Emergency Medical Help & Govt Doctor Consultation / Rescue Team Modal */}
      <EmergencyMedicalHelpModal
        isOpen={isMedicalHelpModalOpen}
        onClose={() => setIsMedicalHelpModalOpen(false)}
        currentLocationNode={currentOriginNode}
        coordinates={
          currentOriginNode?.coordinates
            ? { lat: currentOriginNode.coordinates[0], lng: currentOriginNode.coordinates[1] }
            : undefined
        }
        activeRescueRequest={activeRescueRequest}
        onRequestRescue={handleRequestMedicalRescue}
        onResolveRescue={handleResolveMedicalRescue}
        onCancelRescue={handleCancelMedicalRescue}
      />

      {/* Emergency View Authorization Gate Modal */}
      <EmergencyAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        savedPasskey={savedPasskey}
        onUpdatePasskey={handleUpdatePasskey}
      />

      {/* Python / FastAPI ML Model Inspector Modal */}
      <PythonModelModal
        isOpen={isPythonModalOpen}
        onClose={() => setIsPythonModalOpen(false)}
        currentTelemetry={telemetry}
      />

      {/* AI Incident Commander Briefing & Situational Q&A Modal */}
      <AiCommanderModal
        isOpen={isAiCommanderModalOpen}
        onClose={() => setIsAiCommanderModalOpen(false)}
      />
    </div>
  );
}
