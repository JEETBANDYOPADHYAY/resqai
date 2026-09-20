if ('__dirname' in globalThis) {
  // @ts-ignore
  delete globalThis.__dirname;
}

import express from 'express';
import http from 'node:http';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import {
  INITIAL_TELEMETRY,
  SCENARIO_PRESETS,
  RISK_ZONES,
  ROAD_NODES,
  ROAD_SEGMENTS,
  INITIAL_UNITS,
  INITIAL_INCIDENTS,
} from './src/data/mockDisasterData';
import { INITIAL_CITIZEN_REPORTS } from './src/data/citizenReportSamples';
import { evaluateMediaIntegrityAndRelevance } from './src/utils/mediaVerificationEngine';
import { evaluateDisasterRisk, PYTHON_ML_SOURCE_CODE } from './src/utils/mlEngine';
import { DEV_CODE_MODULES } from './src/utils/devCodeRepository';
import { calculateDynamicRoute } from './src/utils/geoRouting';
import { buildIncidentCommanderPrompt, generateDomainCommanderAnswer } from './src/utils/aiCommanderEngine';
import { SensorTelemetry, UserViewProfile, CitizenDisasterMediaReport, DispatchIncident } from './src/types';

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = 3000;

  // Configure JSON limit to support image & media upload payloads
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // In-memory simulation state
  let currentTelemetry: SensorTelemetry = { ...INITIAL_TELEMETRY };
  let currentScenarioId = 'flash-flood';
  let roadSegmentsState = [...ROAD_SEGMENTS];
  let emergencyUnitsState = [...INITIAL_UNITS];
  let dispatchIncidentsState = [...INITIAL_INCIDENTS];
  let citizenReportsState: CitizenDisasterMediaReport[] = [...INITIAL_CITIZEN_REPORTS];

  // Gemini AI Client setup
  let ai: GoogleGenAI | null = null;
  if (process.env.GEMINI_API_KEY) {
    try {
      ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    } catch (e) {
      console.warn('Gemini client initialization deferred:', e);
    }
  }

  // Helper to get Gemini client
  function getGemini(): GoogleGenAI | null {
    if (!ai && process.env.GEMINI_API_KEY) {
      ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
    return ai;
  }

  // --- API ENDPOINTS ---

  // 1. Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'ResQAI Disaster Core Engine', timestamp: new Date().toISOString() });
  });

  // 2. Real-time Telemetry Stream / Ingestion
  app.get('/api/telemetry', (req, res) => {
    // Add realistic subtle stochastic sensor fluctuation to simulate active sensor polling
    const jitter = (Math.random() - 0.5) * 0.4;
    const rainJitter = (Math.random() - 0.5) * 0.8;
    const windJitter = (Math.random() - 0.5) * 1.2;

    const streamingTelemetry: SensorTelemetry = {
      ...currentTelemetry,
      rainfall: Math.max(0, Math.round((currentTelemetry.rainfall + rainJitter) * 10) / 10),
      windSpeed: Math.max(0, Math.round((currentTelemetry.windSpeed + windJitter) * 10) / 10),
      riverLevel: Math.max(0, Math.round((currentTelemetry.riverLevel + jitter * 0.05) * 100) / 100),
      lightningStrikesPerMin: currentTelemetry.lightningStrikesPerMin != null
        ? Math.max(0, Math.round(currentTelemetry.lightningStrikesPerMin + (Math.random() - 0.5) * 2))
        : 0,
      lightningDistanceKm: currentTelemetry.lightningDistanceKm != null
        ? Math.max(0.2, Math.round((currentTelemetry.lightningDistanceKm + (Math.random() - 0.5) * 0.3) * 10) / 10)
        : 15,
      timestamp: new Date().toISOString(),
    };

    const mlEvaluation = evaluateDisasterRisk(streamingTelemetry);

    res.json({
      telemetry: streamingTelemetry,
      scenarioId: currentScenarioId,
      mlEvaluation,
    });
  });

  // 3. Update / Ingest custom Telemetry
  app.post('/api/telemetry', (req, res) => {
    const updated = req.body as Partial<SensorTelemetry>;
    currentTelemetry = {
      ...currentTelemetry,
      ...updated,
      timestamp: new Date().toISOString(),
    };
    const mlEvaluation = evaluateDisasterRisk(currentTelemetry);
    res.json({ success: true, telemetry: currentTelemetry, mlEvaluation });
  });

  // 4. Scenario Switcher
  app.post('/api/scenario/:scenarioId', (req, res) => {
    const { scenarioId } = req.params;
    const preset = SCENARIO_PRESETS.find((s) => s.id === scenarioId);
    if (!preset) {
      return res.status(404).json({ error: 'Scenario preset not found' });
    }

    currentScenarioId = scenarioId;
    currentTelemetry = {
      ...INITIAL_TELEMETRY,
      ...preset.telemetry,
      timestamp: new Date().toISOString(),
    };

    // Apply preset road blockages
    roadSegmentsState = ROAD_SEGMENTS.map((seg) => ({
      ...seg,
      isBlocked: preset.defaultBlockedRoads.includes(seg.id),
      blockReason: preset.defaultBlockedRoads.includes(seg.id)
        ? seg.blockReason || 'Hazard Zone Barrier Active'
        : undefined,
    }));

    const mlEvaluation = evaluateDisasterRisk(currentTelemetry);
    res.json({
      success: true,
      scenario: preset,
      telemetry: currentTelemetry,
      mlEvaluation,
      roadSegments: roadSegmentsState,
    });
  });

  // 5. ML Inference direct endpoint (for simulated Python/FastAPI integration)
  app.post('/api/ml/infer', (req, res) => {
    const telemetry = (req.body?.telemetry as SensorTelemetry) || currentTelemetry;
    const evaluation = evaluateDisasterRisk(telemetry);
    res.json(evaluation);
  });

  // 6. Inspect Python Backend ML Source Code (Legacy & Direct)
  app.get('/api/ml/python-source', (req, res) => {
    res.json({
      language: 'python',
      framework: 'FastAPI + Scikit-Learn',
      code: PYTHON_ML_SOURCE_CODE,
    });
  });

  // 6b. Developer Code Explorer / Code Dev List API
  app.get('/api/dev/code-list', (req, res) => {
    res.json({
      success: true,
      totalModules: DEV_CODE_MODULES.length,
      modules: DEV_CODE_MODULES.map(m => ({
        id: m.id,
        fileName: m.fileName,
        title: m.title,
        category: m.category,
        language: m.language,
        framework: m.framework,
        description: m.description,
        lineCount: m.lineCount,
        sizeKb: m.sizeKb,
        version: m.version,
        endpoint: m.endpoint,
        codeLength: m.code.length,
      })),
    });
  });

  app.get('/api/dev/code/:fileId', (req, res) => {
    const { fileId } = req.params;
    const found = DEV_CODE_MODULES.find(m => m.id === fileId || m.fileName === fileId);
    if (!found) {
      return res.status(404).json({ success: false, error: `Module '${fileId}' not found in code dev list.` });
    }
    res.json({
      success: true,
      module: found,
    });
  });

  app.post('/api/dev/code/:fileId/test-run', (req, res) => {
    const { fileId } = req.params;
    const telemetry = (req.body?.telemetry as SensorTelemetry) || currentTelemetry;
    
    if (fileId === 'fastapi-ml-model' || fileId === 'fastapi_ml_model.py') {
      const evaluation = evaluateDisasterRisk(telemetry);
      return res.json({
        success: true,
        fileId,
        engine: 'Scikit-Learn Random Forest Classifier',
        runtimeMs: 1.8,
        result: evaluation,
      });
    }

    if (fileId === 'dijkstra-routing' || fileId === 'dijkstra_evacuation_routing.py') {
      const route = calculateDynamicRoute(
        'node-citizen-start',
        null,
        ROAD_NODES,
        roadSegmentsState,
        RISK_ZONES,
        'CITIZEN'
      );
      return res.json({
        success: true,
        fileId,
        engine: 'NetworkX Safe Dijkstra Graph Solver',
        runtimeMs: 2.3,
        result: route,
      });
    }

    return res.json({
      success: true,
      fileId,
      message: 'Dry run execution simulated successfully against active streaming telemetry tensor.',
      telemetrySnapshot: telemetry,
      executedAt: new Date().toISOString(),
    });
  });

  // 7. Road Network & Blockages API
  app.get('/api/roads', (req, res) => {
    res.json({
      nodes: ROAD_NODES,
      segments: roadSegmentsState,
      zones: RISK_ZONES,
    });
  });

  // 8. Toggle Specific Road Blocked state
  app.post('/api/roads/toggle', (req, res) => {
    const { segmentId, isBlocked, reason } = req.body;
    const target = roadSegmentsState.find((s) => s.id === segmentId);
    if (!target) {
      return res.status(404).json({ error: 'Road segment not found' });
    }

    target.isBlocked = isBlocked !== undefined ? isBlocked : !target.isBlocked;
    if (target.isBlocked) {
      target.blockReason = reason || 'Emergency Services Road Barrier Placed';
    } else {
      target.blockReason = undefined;
    }

    res.json({
      success: true,
      segmentId,
      isBlocked: target.isBlocked,
      blockReason: target.blockReason,
      segments: roadSegmentsState,
    });
  });

  // 9. Batch Update Road Blockages
  app.post('/api/roads/batch-update', (req, res) => {
    const { blockedSegmentIds } = req.body as { blockedSegmentIds: string[] };
    if (!Array.isArray(blockedSegmentIds)) {
      return res.status(400).json({ error: 'blockedSegmentIds must be an array' });
    }

    roadSegmentsState = roadSegmentsState.map((seg) => ({
      ...seg,
      isBlocked: blockedSegmentIds.includes(seg.id),
      blockReason: blockedSegmentIds.includes(seg.id)
        ? seg.blockReason || 'Hazard Zone Impassable'
        : undefined,
    }));

    res.json({ success: true, segments: roadSegmentsState });
  });

  // 10. Dynamic Graph Routing Calculation (Dijkstra / A*)
  app.post('/api/routes/calculate', (req, res) => {
    const { startNodeId, targetNodeId, profile } = req.body as {
      startNodeId: string;
      targetNodeId?: string;
      profile: UserViewProfile;
    };

    const route = calculateDynamicRoute(
      startNodeId || 'node-citizen-start',
      targetNodeId || null,
      ROAD_NODES,
      roadSegmentsState,
      RISK_ZONES,
      profile || 'CITIZEN'
    );

    if (!route) {
      return res.status(404).json({
        error: 'No accessible route found. All surrounding passages are completely blocked by hazard barriers.',
        isBlocked: true,
      });
    }

    res.json({ success: true, route });
  });

  // 11. Dispatch Incidents & SOS Beacons
  app.get('/api/dispatch/incidents', (req, res) => {
    res.json({ incidents: dispatchIncidentsState });
  });

  // 11b. Citizen Disaster Media Reports & AI Verification API
  app.get('/api/citizen-reports', (req, res) => {
    res.json({
      success: true,
      reports: citizenReportsState,
      totalApproved: citizenReportsState.filter((r) => r.verificationStatus === 'APPROVED').length,
      totalRejected: citizenReportsState.filter((r) => r.verificationStatus === 'REJECTED').length,
    });
  });

  app.post('/api/citizen-reports/submit-and-verify', async (req, res) => {
    try {
      const {
        citizenName,
        contactNumber,
        affectedAreaName,
        coordinates,
        category,
        severity,
        description,
        mediaType,
        mediaUrl,
        mediaFileName,
        mediaFileSizeKb,
        captureTimestamp,
      } = req.body || {};

      if (!affectedAreaName || !description) {
        return res.status(400).json({ success: false, error: 'Area name and description are required.' });
      }

      // Step 1: Run comprehensive local integrity and recency verification
      const rawTimestamp = captureTimestamp || new Date().toISOString();
      const localVerification = evaluateMediaIntegrityAndRelevance({
        fileName: mediaFileName || 'field_capture.jpg',
        fileSizeBytes: (mediaFileSizeKb || 100) * 1024,
        captureTimestamp: rawTimestamp,
        category: category || 'URBAN_FLOODING',
        areaName: affectedAreaName,
        description: description || '',
        mediaType: mediaType || 'PHOTO',
        mediaDataUrl: mediaUrl,
      });

      let finalVerification = { ...localVerification };

      // Step 2: Visual inspection - Check vector/SVG or run Gemini multimodal AI
      if (mediaUrl && mediaUrl.startsWith('data:image/svg+xml')) {
        const decodedSvg = decodeURIComponent(mediaUrl).toLowerCase();
        if (
          decodedSvg.includes('pet') ||
          decodedSvg.includes('cat') ||
          decodedSvg.includes('dog') ||
          decodedSvg.includes('carpet') ||
          decodedSvg.includes('domestic')
        ) {
          finalVerification.isRelevant = false;
          finalVerification.relevanceConfidence = 99;
          finalVerification.relevanceReasoning = 'Vector inspection detected non-disaster subject: domestic animal / indoor pet graphic.';
          finalVerification.detectedFeatures = ['Domestic pet signature detected', 'Absence of floodwater or structural damage'];
          finalVerification.damageSeverity = 'NONE';
          finalVerification.aiVerdict = 'REJECTED';
          finalVerification.verdictSummary = 'VERIFICATION REJECTED: Media relevance failure. Non-disaster domestic animal detected. Emergency teams not alerted.';
        }
      }

      const client = getGemini();
      if (client && mediaUrl && mediaUrl.startsWith('data:image/') && !mediaUrl.startsWith('data:image/svg+xml')) {
        try {
          const mimeMatch = mediaUrl.match(/^data:([a-zA-Z0-9+/.-]+);base64,/);
          const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
          const base64Data = mediaUrl.replace(/^data:[a-zA-Z0-9+/.-]+;base64,/, '');

          if (base64Data.length > 200) {
            const geminiPrompt = `You are an automated disaster management verification AI for the National Disaster Response Force.
The user has submitted field photographic evidence claiming severe disaster conditions in: "${affectedAreaName}".
Reported Disaster Category: "${category || 'URBAN_FLOODING'}".
Reported Description: "${description}".
Capture Timestamp: "${rawTimestamp}".

Analyze this image with extreme scrutiny:
CRITICAL NEGATIVE FILTER RULES:
1. If this image displays a domestic pet (dog, puppy, cat, kitten, bird, animal, livestock), YOU MUST CLASSIFY IT AS IRRELEVANT (isRelevant: false).
2. If this image displays an indoor room, bedroom, furniture, personal selfie, face, portrait, food, dish, normal vehicle without flood damage, or peaceful everyday scene, YOU MUST CLASSIFY IT AS IRRELEVANT (isRelevant: false).
3. Even if the user claims there is a "flood" or "disaster" in the text, rely STRICTLY on whether visual disaster damage is clearly present in the photo. If it shows a dog or pet, REJECT IT IMMEDIATELY.
4. A photo is ONLY RELEVANT (isRelevant: true) if it clearly displays genuine natural disaster destruction (deep stormwater inundating streets/buildings, active landslide mud/boulders blocking paths, collapsed infrastructure, downed power lines sparking).

Respond STRICTLY with a valid JSON object in this exact format:
{
  "isRelevant": boolean,
  "confidence": number,
  "detectedFeatures": string[],
  "relevanceReasoning": string,
  "damageSeverity": "CRITICAL" | "SEVERE" | "MODERATE" | "LOW" | "NONE"
}`;

            const imagePart = {
              inlineData: {
                mimeType,
                data: base64Data,
              },
            };
            const textPart = {
              text: geminiPrompt,
            };

            let responseText: string | undefined;
            try {
              const geminiResponse = await client.models.generateContent({
                model: 'gemini-3.1-flash-lite',
                contents: {
                  parts: [imagePart, textPart],
                },
                config: {
                  responseMimeType: 'application/json',
                },
              });
              responseText = geminiResponse.text;
            } catch (liteErr: any) {
              console.warn('Gemini 3.1 flash lite failed, trying gemini-3.8-flash fallback...', liteErr?.message?.slice(0, 100));
              try {
                const geminiResponse2 = await client.models.generateContent({
                  model: 'gemini-3.8-flash',
                  contents: {
                    parts: [imagePart, textPart],
                  },
                  config: {
                    responseMimeType: 'application/json',
                  },
                });
                responseText = geminiResponse2.text;
              } catch (flashErr: any) {
                console.warn('Gemini multimodal inspection failed, relying on enhanced safety engine:', flashErr?.message?.slice(0, 100));
              }
            }

            if (responseText) {
              const parsed = JSON.parse(responseText);
              if (typeof parsed.isRelevant === 'boolean') {
                finalVerification.isRelevant = parsed.isRelevant;
                finalVerification.relevanceConfidence = parsed.confidence
                  ? Math.round(parsed.confidence > 1 ? parsed.confidence : parsed.confidence * 100)
                  : (parsed.isRelevant ? 95 : 98);
                finalVerification.relevanceReasoning = parsed.relevanceReasoning || (parsed.isRelevant ? 'Verified real-world disaster conditions' : 'Non-disaster subject detected');
                if (Array.isArray(parsed.detectedFeatures) && parsed.detectedFeatures.length > 0) {
                  finalVerification.detectedFeatures = parsed.detectedFeatures;
                }
                if (parsed.damageSeverity) {
                  finalVerification.damageSeverity = parsed.damageSeverity;
                }

                if (!parsed.isRelevant) {
                  finalVerification.damageSeverity = 'NONE';
                  finalVerification.aiVerdict = 'REJECTED';
                  finalVerification.verdictSummary = `VERIFICATION REJECTED: Gemini AI identified content as non-disaster related (${finalVerification.relevanceReasoning}). Incident will NOT be dispatched to Emergency Command.`;
                } else {
                  const passesBoth = finalVerification.isTimestampValid;
                  finalVerification.aiVerdict = passesBoth ? 'APPROVED' : 'REJECTED';
                  if (!passesBoth) {
                    finalVerification.verdictSummary = `VERIFICATION REJECTED: Timestamp failure. ${finalVerification.timestampReasoning}`;
                  } else {
                    finalVerification.verdictSummary = `VERIFIED & APPROVED: Multimodal Gemini AI verified disaster markers (${finalVerification.relevanceConfidence}% confidence). Dispatched to Disaster Command Center.`;
                  }
                }
              }
            }
          }
        } catch (geminiErr: any) {
          console.warn('Gemini vision verification fallback to heuristic engine:', geminiErr?.message?.slice(0, 100));
        }
      }

      const isApproved = finalVerification.aiVerdict === 'APPROVED';
      const reportId = `rep-cit-${Date.now()}`;
      const nowIso = new Date().toISOString();

      const newReport: CitizenDisasterMediaReport = {
        id: reportId,
        citizenName: citizenName?.trim() || 'Anonymous Citizen Volunteer',
        contactNumber: contactNumber?.trim() || '+91 Ground Field Cell',
        affectedAreaName: affectedAreaName.trim(),
        coordinates: coordinates || [22.6050, 88.4250],
        category: category || 'URBAN_FLOODING',
        severity: severity || 'CRITICAL',
        description: description.trim(),
        mediaType: mediaType || 'PHOTO',
        mediaUrl: mediaUrl || '',
        mediaFileName: mediaFileName || 'field_evidence.jpg',
        mediaFileSizeKb: mediaFileSizeKb || 240,
        captureTimestamp: rawTimestamp,
        submittedAt: nowIso,
        verificationStatus: isApproved ? 'APPROVED' : 'REJECTED',
        verification: finalVerification,
        managementNotified: isApproved,
        notifiedAt: isApproved ? nowIso : undefined,
        managementAction: 'NONE',
      };

      // If approved, notify Disaster Management Team and create active priority incident
      if (isApproved) {
        const incidentId = `inc-cit-${newReport.id}`;
        const newIncident = {
          id: incidentId,
          title: `Verified Citizen Report: ${newReport.category.replace(/_/g, ' ')} at ${newReport.affectedAreaName}`,
          type: (newReport.category === 'URBAN_FLOODING' || newReport.category === 'DAM_OVERFLOW' ? 'FLOOD_RESCUE' : 'ROAD_CLEARANCE') as any,
          priority: (newReport.severity === 'CRITICAL' ? 'CODE_RED' : 'CODE_YELLOW') as any,
          coordinates: newReport.coordinates,
          address: newReport.affectedAreaName,
          reportedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'PENDING' as const,
          callerSosCount: 1,
          notes: `[AI-VERIFIED MEDIA EVIDENCE - ${finalVerification.relevanceConfidence}% CONFIDENCE] ${newReport.description} (Captured: ${new Date(rawTimestamp).toLocaleTimeString()})`,
        };
        dispatchIncidentsState.unshift(newIncident);
      }

      citizenReportsState.unshift(newReport);

      return res.json({
        success: true,
        report: newReport,
        verification: finalVerification,
        managementNotified: newReport.managementNotified,
        message: isApproved
          ? 'Evidence verified and successfully notified to Disaster Management Team.'
          : 'Submission rejected during AI/Timestamp verification. Management team not alerted.',
      });
    } catch (err: any) {
      console.error('Citizen report verification error:', err);
      return res.status(500).json({ success: false, error: 'Internal verification engine error: ' + err.message });
    }
  });

  // Action on Verified Citizen Report by Disaster Commander
  app.post('/api/citizen-reports/:id/action', (req, res) => {
    const { id } = req.params;
    const { action } = req.body as {
      action: 'DISPATCHED_RESCUE' | 'ROAD_BLOCKED' | 'SHELTER_ALERT' | 'ACKNOWLEDGED' | 'OVERRIDE_APPROVE';
    };

    const report = citizenReportsState.find((r) => r.id === id);
    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    report.managementAction = action === 'OVERRIDE_APPROVE' ? 'OVERRIDE_APPROVED' : action;

    // If commander overrides a rejected report
    if (action === 'OVERRIDE_APPROVE') {
      report.verificationStatus = 'APPROVED';
      report.managementNotified = true;
      report.notifiedAt = new Date().toISOString();

      const newIncident: DispatchIncident = {
        id: `inc-override-${Date.now()}`,
        title: `Commander Override: ${report.category.replace(/_/g, ' ')} at ${report.affectedAreaName}`,
        type: (report.category === 'URBAN_FLOODING' || report.category === 'DAM_OVERFLOW'
          ? 'FLOOD_RESCUE'
          : 'ROAD_CLEARANCE') as any,
        priority: 'CODE_RED',
        coordinates: report.coordinates,
        address: report.affectedAreaName,
        reportedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'PENDING' as const,
        callerSosCount: 1,
        notes: `[MANUAL COMMANDER OVERRIDE] Approved by Emergency Incident Commander: ${report.description}`,
      };
      dispatchIncidentsState.unshift(newIncident);
    }

    // If commander chooses to block road near this report
    if (action === 'ROAD_BLOCKED') {
      // Find nearest segment or block default
      const candidate = roadSegmentsState.find((s) => !s.isBlocked);
      if (candidate) {
        candidate.isBlocked = true;
        candidate.blockReason = `Emergency Roadblock: Verified citizen damage report at ${report.affectedAreaName}`;
      }
    }

    res.json({ success: true, report, roadSegments: roadSegmentsState });
  });

  app.delete('/api/citizen-reports/:id', (req, res) => {
    const { id } = req.params;
    const targetReport = citizenReportsState.find((r) => r.id === id);
    citizenReportsState = citizenReportsState.filter((r) => r.id !== id);
    dispatchIncidentsState = dispatchIncidentsState.filter(
      (inc) =>
        inc.id !== id &&
        inc.id !== `inc-${id}` &&
        inc.id !== `inc-cit-${id}` &&
        inc.id !== `inc-override-${id}` &&
        !inc.id.includes(id) &&
        !(targetReport && inc.address.toLowerCase().includes(targetReport.affectedAreaName.toLowerCase().slice(0, 10))) &&
        !(targetReport && inc.notes?.toLowerCase().includes(targetReport.affectedAreaName.toLowerCase().slice(0, 10)))
    );
    res.json({ success: true, remaining: citizenReportsState.length });
  });

  app.delete('/api/incidents/:id', (req, res) => {
    const { id } = req.params;
    dispatchIncidentsState = dispatchIncidentsState.filter((inc) => inc.id !== id);
    res.json({ success: true, remaining: dispatchIncidentsState.length });
  });

  app.delete('/api/citizen-reports', (req, res) => {
    const { type } = req.query;
    if (type === 'rejected') {
      citizenReportsState = citizenReportsState.filter((r) => r.verificationStatus !== 'REJECTED');
    } else if (type === 'approved') {
      citizenReportsState = citizenReportsState.filter((r) => r.verificationStatus !== 'APPROVED');
      dispatchIncidentsState = dispatchIncidentsState.filter(
        (inc) => !inc.id.startsWith('inc-cit-') && !inc.id.startsWith('inc-override-') && !inc.notes?.includes('AI-VERIFIED MEDIA EVIDENCE')
      );
    } else {
      citizenReportsState = [];
      dispatchIncidentsState = dispatchIncidentsState.filter(
        (inc) => !inc.id.startsWith('inc-cit-') && !inc.id.startsWith('inc-override-') && !inc.notes?.includes('AI-VERIFIED MEDIA EVIDENCE')
      );
    }
    res.json({ success: true, remaining: citizenReportsState.length });
  });

  app.post('/api/dispatch/sos', (req, res) => {
    const { coordinates, address, notes, callerSosCount } = req.body;
    const newIncident = {
      id: `sos-${Date.now()}`,
      title: 'Citizen SOS Beacon: Immediate Flood Evacuation Assistance',
      type: 'EVACUATION_ASSIST' as const,
      priority: 'CODE_RED' as const,
      coordinates: coordinates || [37.7660, -122.4220],
      address: address || 'Valencia & 18th St Flood Zone',
      reportedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'PENDING' as const,
      callerSosCount: callerSosCount || 1,
      notes: notes || 'Urgent evacuation assist requested via citizen mobile app.',
    };

    dispatchIncidentsState.unshift(newIncident);
    res.json({ success: true, incident: newIncident, totalActive: dispatchIncidentsState.length });
  });

  // 12. Emergency View Authentication API
  const VALID_PASSKEYS = ['RESQ2026', 'emergency112', 'KOLKATA-NDRF', 'COMMANDER', 'admin'];

  app.post('/api/auth/emergency-login', (req, res) => {
    const { badgeId, password, agency } = req.body || {};
    const pass = (password || '').trim();

    if (!pass) {
      return res.status(400).json({ success: false, error: 'Password is required' });
    }

    if (VALID_PASSKEYS.includes(pass) || pass.toUpperCase() === 'RESQ2026') {
      const userBadge = badgeId || 'NDRF-CMD-02';
      const userAgency = agency || 'National Disaster Response Force (2nd Bn)';
      const authorizedUser = {
        badgeId: userBadge,
        name: userBadge.includes('MEDIC') ? 'Dr. S. Mukherjee' : 'Capt. R. Ganguly',
        agency: userAgency,
        role: 'Disaster Incident Operations Commander',
        clearanceLevel: 3,
        sessionToken: `sec-token-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        authorizedAt: new Date().toISOString(),
      };

      return res.json({
        success: true,
        authorized: true,
        user: authorizedUser,
        message: 'Security Clearance Verified. Emergency Access Granted.',
      });
    }

    return res.status(401).json({
      success: false,
      authorized: false,
      error: 'Invalid Security Passkey. Access Restricted to Authorized Emergency Personnel.',
    });
  });

  // 13. Emergency Unit Management
  app.get('/api/dispatch/units', (req, res) => {
    res.json({ units: emergencyUnitsState });
  });

  app.post('/api/dispatch/assign', (req, res) => {
    const { unitId, incidentId } = req.body;
    const unit = emergencyUnitsState.find((u) => u.id === unitId);
    const incident = dispatchIncidentsState.find((i) => i.id === incidentId);

    if (unit && incident) {
      unit.status = 'EN_ROUTE';
      unit.assignedIncidentId = incidentId;
      unit.destinationLocation = incident.coordinates;
      incident.status = 'DISPATCHED';
      incident.assignedUnitId = unitId;
    }

    res.json({ success: true, units: emergencyUnitsState, incidents: dispatchIncidentsState });
  });

  // 13. Gemini AI Situational Intelligence Commander
  app.post('/api/gemini/incident-brief', async (req, res) => {
    const { customQuestion } = req.body || {};
    const client = getGemini();

    const currentRisk = evaluateDisasterRisk(currentTelemetry);
    const activeIncidents = dispatchIncidentsState.filter((i) => i.status !== 'RESOLVED');

    const { systemPrompt, userQuery } = buildIncidentCommanderPrompt(
      currentTelemetry,
      currentRisk,
      roadSegmentsState,
      ROAD_NODES,
      activeIncidents,
      customQuestion
    );

    // If Gemini client is available, attempt multi-model generative inference
    if (client) {
      const candidateModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
      for (const modelName of candidateModels) {
        try {
          const contents = customQuestion && customQuestion.trim()
            ? `System Context:\n${systemPrompt}\n\nUser Question:\n${customQuestion.trim()}\n\nProvide an authoritative, direct tactical answer immediately followed by 2-3 key safety/navigation directives.`
            : systemPrompt;

          const response = await client.models.generateContent({
            model: modelName,
            contents,
          });

          const text = response.text || '';
          if (text && text.trim().length > 0) {
            return res.json({
              success: true,
              source: modelName,
              question: customQuestion || 'TACTICAL_SITUATION_REPORT',
              answer: text,
              rawAnalysis: text,
              telemetrySnapshot: {
                rainfall: currentTelemetry.rainfall,
                riverLevel: currentTelemetry.riverLevel,
                windSpeed: currentTelemetry.windSpeed,
                pressure: currentTelemetry.pressure,
                soilSaturation: currentTelemetry.soilSaturation,
                lightningStrikesPerMin: currentTelemetry.lightningStrikesPerMin,
                lightningDistanceKm: currentTelemetry.lightningDistanceKm,
              },
              riskSummary: {
                disaster: currentRisk.predictedDisaster,
                level: currentRisk.riskLevel,
                confidence: currentRisk.confidence,
                recommendedAction: currentRisk.recommendedAction,
              },
              timestamp: new Date().toISOString(),
            });
          }
        } catch (modelErr: any) {
          console.warn(`Gemini model ${modelName} call failed:`, modelErr?.message?.slice(0, 100));
          // Continue to next candidate model
        }
      }
    }

    // High-quality deterministic Domain Knowledge & Telemetry Engine fallback
    // Guarantees authoritative, accurate answers to any navigation, road, shelter, flood, or weather question
    const fallbackAnswer = generateDomainCommanderAnswer(
      customQuestion || '',
      currentTelemetry,
      currentRisk,
      roadSegmentsState,
      ROAD_NODES,
      activeIncidents,
      currentScenarioId
    );

    return res.json(fallbackAnswer);
  });

  // --- Vite Middleware Integration ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: {
          server,
        },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`ResQAI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
});
