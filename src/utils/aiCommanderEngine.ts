import {
  SensorTelemetry,
  MLHazardEvaluation,
  RoadSegment,
  RoadNode,
  DispatchIncident,
} from '../types';

export interface AiBriefingResponse {
  success: boolean;
  source: string;
  question: string;
  answer: string;
  rawAnalysis: string;
  telemetrySnapshot?: Partial<SensorTelemetry>;
  riskSummary?: {
    disaster: string;
    level: string;
    confidence: number;
    recommendedAction: string;
  };
  brief?: {
    title: string;
    threatAssessment: string[];
    tacticalDirectives: string[];
    publicBroadcast: string;
    routingNotice: string;
  };
  timestamp: string;
}

/**
 * Builds system prompt for Gemini LLM with complete live city & sensor context
 */
export function buildIncidentCommanderPrompt(
  telemetry: SensorTelemetry,
  risk: MLHazardEvaluation,
  segments: RoadSegment[],
  nodes: RoadNode[],
  incidents: DispatchIncident[],
  customQuestion?: string
): { systemPrompt: string; userQuery: string } {
  const blockedRoads = segments.filter((s) => s.isBlocked);
  const openRoads = segments.filter((s) => !s.isBlocked);
  const shelters = nodes.filter((n) => n.isShelter || n.isHospital);
  const activeIncidents = incidents.filter((i) => i.status !== 'RESOLVED');

  const blockedListStr = blockedRoads.length > 0
    ? blockedRoads.map((s) => `- ${s.name}: BLOCKED (${s.blockReason || 'Hazard barrier active'})`).join('\n')
    : '- All major arterial corridors currently report clear.';

  const openListStr = openRoads.map((s) => `- ${s.name}: OPEN & NAVIGABLE`).join('\n');

  const shelterListStr = shelters
    .map(
      (sh) =>
        `- ${sh.name}: Capacity ${sh.capacity ?? 'N/A'}, Current Occupancy: ${sh.currentOccupancy ?? 'N/A'}, Medical Staff: ${sh.medicalStaff ?? 'Available'}`
    )
    .join('\n');

  const systemPrompt = `You are "ResQAI Incident Commander", the official emergency response disaster coordinator and tactical AI for Kolkata and the North 24 Parganas District, West Bengal, India.
You provide authoritative, clear, and direct answers to citizens, emergency field units (NDRF 2nd Battalion, West Bengal Fire & Emergency Service, Kolkata Police DMG), and ambulance dispatchers.

CURRENT REAL-TIME DISTRICT TELEMETRY & DISASTER STATE:
- Primary Threat Classification: ${risk.predictedDisaster}
- Threat Level: ${risk.riskLevel} (${risk.confidence}% ML confidence)
- Core Advisory: ${risk.recommendedAction}
- Atmospheric & Water Sensor Feeds:
  * Monsoon Rainfall Rate: ${telemetry.rainfall ?? 0} mm/h
  * River/Canal Water Stage (Kestopur & Baguiati drainage): ${telemetry.riverLevel ?? 1.5} m (CRITICAL BREACH THRESHOLD: 3.50 m)
  * Wind Velocity & Squall: ${telemetry.windSpeed ?? 15} km/h
  * Soil Saturation Index: ${telemetry.soilSaturation ?? 40} %
  * Barometric Pressure: ${telemetry.pressure ?? 1010} hPa
  * Lightning Swarm: ${telemetry.lightningStrikesPerMin ?? 0} strikes/min at estimated ${telemetry.lightningDistanceKm ?? 25} km
  * Upstream Dam / Barrage: Inflow ${telemetry.damInflowCusecs ?? 0} cusecs | Outflow ${telemetry.damOutflowDischargeCusecs ?? 0} cusecs | Storage ${telemetry.reservoirCapacityPercent ?? 0}%
  * Slope Stability / Landslide: Creep Rate ${telemetry.slopeDisplacementRateMmPerHour ?? 0} mm/h | Pore Pressure ${telemetry.poreWaterPressureKPa ?? 0} kPa | Factor of Safety ${telemetry.factorOfSafety ?? 1.5}

INFRASTRUCTURE CORRIDORS:
- Blocked / Impassable Corridors (${blockedRoads.length}):
${blockedListStr}

- Verified Open Corridors (${openRoads.length}):
${openListStr}

DESIGNATED SAFE SANCTUARIES & HOSPITALS:
${shelterListStr}

- Open Emergency / SOS Distress Beacons: ${activeIncidents.length} active calls

GUIDELINES FOR YOUR RESPONSE:
1. If the user asks a question, ALWAYS start by answering their specific question directly in the very first 1-2 sentences.
2. If asked about road navigation (e.g. Biswa Bangla Sarani, VIP Road, etc.), state clearly whether the road is OPEN or BLOCKED based on the live data above, and provide high-ground bypass advice.
3. If asked about shelters or where to go, recommend the nearest high-elevation shelter (e.g. Salt Lake Central Park or New Town Action Area) and specify safe approach roads.
4. If asked about flood, weather, dam, or lightning, provide the exact real-time sensor metrics and clear safety directives.
5. Use clean formatting with bold headers and concise bullet points. Avoid bureaucratic disclaimers or filler apologies. Keep the tone calm, decisive, authoritative, and life-saving.`;

  const userQuery = customQuestion && customQuestion.trim().length > 0
    ? customQuestion.trim()
    : 'Provide a comprehensive tactical situation briefing and multi-agency deployment order for current conditions.';

  return { systemPrompt, userQuery };
}

/**
 * Intelligent deterministic domain engine that generates authoritative answers
 * to disaster, navigation, shelter, and weather questions using real-time sensor telemetry.
 */
export function generateDomainCommanderAnswer(
  question: string,
  telemetry: SensorTelemetry,
  risk: MLHazardEvaluation,
  segments: RoadSegment[],
  nodes: RoadNode[],
  incidents: DispatchIncident[],
  scenarioId: string
): AiBriefingResponse {
  const q = question.toLowerCase();
  const blockedRoads = segments.filter((s) => s.isBlocked);
  const openRoads = segments.filter((s) => !s.isBlocked);
  const shelters = nodes.filter((n) => n.isShelter || n.isHospital);
  const canalStage = telemetry.riverLevel ?? 1.5;
  const rain = telemetry.rainfall ?? 0;
  const isFloodActive = canalStage > 3.5 || rain > 50 || scenarioId === 'flash-flood';

  let answerText = '';

  // 1. Specific Road: Biswa Bangla Sarani
  if (q.includes('biswa bangla') || q.includes('biswa bangla sarani') || q.includes('major arterial')) {
    const isBiswaBlocked = blockedRoads.some((s) => s.id === 'seg-biswa-bangla' || s.name.toLowerCase().includes('biswa bangla'));
    if (!isBiswaBlocked) {
      answerText = `### Biswa Bangla Sarani Navigation Status: **OPEN & SAFE** 🟢\n\n` +
        `* **Corridor Status:** Biswa Bangla Sarani is **fully open, elevated, and navigable**.\n` +
        `* **Recommended Use:** Highly recommended as the **primary high-ground evacuation corridor** connecting Baguiati and Lake Town towards Salt Lake Central Park and New Town safe sanctuaries.\n` +
        `* **Advisory:** Maintain speeds under 40 km/h due to wet pavement and emergency convoys. Follow NDRF traffic wardens at Chinar Park and Major Arterial crossings.`;
    } else {
      answerText = `### Biswa Bangla Sarani Navigation Status: **TEMPORARILY RESTRICTED** ⚠️\n\n` +
        `* **Corridor Status:** Portions of Biswa Bangla Sarani are currently barricaded for emergency response vehicles only.\n` +
        `* **Alternate Route:** Divert eastward through Rajarhat Expressway or utilize EM Bypass via Ultadanga Interchange.`;
    }
  }
  // 2. Specific Road: VIP Road or Jessore Road
  else if (q.includes('vip road') || q.includes('vip') || q.includes('jessore') || q.includes('lake town')) {
    const isVipBlocked = blockedRoads.some((s) => s.id === 'seg-vip-underpass' || s.name.toLowerCase().includes('vip'));
    const isJessoreBlocked = blockedRoads.some((s) => s.id === 'seg-jessore-submerged' || s.name.toLowerCase().includes('jessore'));

    answerText = `### VIP Road & Jessore Road Tactical Assessment:\n\n` +
      `* **VIP Road Underpass:** ${isVipBlocked ? '**BLOCKED (Impassable)** 🔴 — Waterlogging of approx 1.8m standing storm water near Kestopur canal basin.' : '**OPEN WITH HAZARD WARNING** ⚠️'}\n` +
      `* **Jessore Road Low Basin:** ${isJessoreBlocked ? '**BLOCKED (Impassable)** 🔴 — Low underpass inundated; physical barricades erected by Kolkata Police DMG.' : '**OPEN** 🟢'}\n` +
      `* **Evacuation Bypass Directive:** **Do NOT attempt to cross submerged canal underpasses.** Divert immediately to **Biswa Bangla Sarani** or **EM Bypass** which remain elevated above the flood plain.`;
  }
  // 3. General Road Closures / Blocked corridors
  else if (q.includes('road') || q.includes('blocked') || q.includes('closed') || q.includes('traffic') || q.includes('route') || q.includes('highway') || q.includes('street') || q.includes('passable')) {
    const blockedList = blockedRoads.length > 0
      ? blockedRoads.map((r) => `* **${r.name}:** BLOCKED (${r.blockReason || 'Hazard Zone Barrier Active'})`).join('\n')
      : '* Currently, no major arterial corridors are completely barricaded.';

    const openList = openRoads.slice(0, 4).map((r) => `* **${r.name}:** VERIFIED CLEAR 🟢`).join('\n');

    answerText = `### Real-Time Road & Corridor Clearance Report:\n\n` +
      `**Currently Blocked Corridors (${blockedRoads.length}):**\n${blockedList}\n\n` +
      `**Safe & Navigable Corridors:**\n${openList}\n\n` +
      `* **Key Guidance:** All civilian evacuation traffic should prioritize **Biswa Bangla Sarani** and the **EM Bypass** to access higher-elevation shelters in Salt Lake and New Town.`;
  }
  // 4. Safe Shelters & Where to go
  else if (q.includes('shelter') || q.includes('safe zone') || q.includes('where to go') || q.includes('where can i go') || q.includes('hospital') || q.includes('evacuate') || q.includes('sanctuary')) {
    answerText = `### Designated Safe Sanctuaries & Medical Relief Centers:\n\n` +
      `1. **Salt Lake Central Park Disaster Relief Stadium** (Sector 1, Bidhannagar)\n` +
      `   * **Status:** Operational | High-ground arena elevated +6m above canal floodplain.\n` +
      `   * **Facilities:** 4,500 citizen capacity, 28 medical staff, backup diesel gensets, fresh drinking water.\n` +
      `   * **Access Route:** Via Biswa Bangla Sarani and Karunamoyee arterial road.\n\n` +
      `2. **New Town Eco Space Civic Emergency Center** (Major Arterial Road, Action Area II)\n` +
      `   * **Status:** Operational | Multi-tier reinforced civic storm arena.\n` +
      `   * **Facilities:** 6,000 citizen capacity, NDRF Regional Helipad, uninterrupted telecom.\n` +
      `   * **Access Route:** Direct via Biswa Bangla Sarani east corridor.\n\n` +
      `3. **R.G. Kar Medical College Trauma Hospital** (Shyambazar)\n` +
      `   * **Status:** 24/7 Trauma Emergency Open for critical medical triaging and trauma transport.`;
  }
  // 5. Flood & Canal Water Level
  else if (q.includes('flood') || q.includes('water') || q.includes('canal') || q.includes('kestopur') || q.includes('baguiati') || q.includes('level') || q.includes('rain')) {
    const breachDiff = (canalStage - 3.5).toFixed(2);
    answerText = `### Kestopur Canal & Baguiati Flood Hydrology Report:\n\n` +
      `* **Current Canal Water Stage:** **${canalStage} meters** (Critical Bank Breach Threshold: **3.50 m**).\n` +
      `* **Stage Delta:** ${canalStage > 3.5 ? `Exceeding danger breach mark by **+${breachDiff}m**.` : `Currently **${Math.abs(parseFloat(breachDiff))}m below** breach stage.`}\n` +
      `* **Precipitation Accumulation:** **${rain} mm/h** severe monsoon rainfall rate.\n` +
      `* **Soil Saturation:** **${telemetry.soilSaturation ?? 85}%** (Extreme surface runoff conditions).\n` +
      `* **Threat Assessment:** Low-lying canal banks in Baguiati and Kestopur are under active inundation. Ground floor residents must relocate to second floor or above, or proceed via Biswa Bangla Sarani to Salt Lake Central Park.`;
  }
  // 6. Lightning / Thunderstorm / Storm
  else if (q.includes('lightning') || q.includes('thunder') || q.includes('storm') || q.includes('kalbaishakhi') || q.includes('damini') || q.includes('squall')) {
    answerText = `### Damini Lightning Swarm & Severe Thunderstorm Advisory:\n\n` +
      `* **Discharge Intensity:** **${telemetry.lightningStrikesPerMin ?? 24} strikes/minute** detected across North 24 Parganas.\n` +
      `* **Proximity to Urban Core:** **${telemetry.lightningDistanceKm ?? 1.8} km** (High-voltage ground strike perimeter).\n` +
      `* **Squall Velocity:** Peak gusts reaching **${telemetry.windSpeed ?? 70} km/h**.\n` +
      `* **Life-Safety Mandate:** Stay inside enclosed brick/concrete structures or enclosed metal vehicles. Do NOT seek shelter under isolated trees, tin roofs, metal lamp posts, or open agricultural fields. Disconnect high-voltage electronics.`;
  }
  // 7. Dam / Barrage Rupture
  else if (q.includes('dam') || q.includes('barrage') || q.includes('durgapur') || q.includes('reservoir') || q.includes('breach') || q.includes('cusecs')) {
    answerText = `### CWC & Upstream Dam Hydrological Surge Report:\n\n` +
      `* **Reservoir Storage Capacity:** **${telemetry.reservoirCapacityPercent ?? 92}%** of Full Reservoir Level (FRL).\n` +
      `* **Spillway Discharge:** **${(telemetry.damOutflowDischargeCusecs ?? 85000).toLocaleString()} cusecs** into downstream Hooghly channels.\n` +
      `* **Upstream Inflow:** **${(telemetry.damInflowCusecs ?? 110000).toLocaleString()} cusecs**.\n` +
      `* **Downstream Flood Wave Arrival:** Estimated downstream surge surge crest expected within 45–90 minutes. Embankment lowlands along river reaches must evacuate to designated high-ground stadiums immediately.`;
  }
  // 8. SOS / Help / Trapped
  else if (q.includes('sos') || q.includes('help') || q.includes('trapped') || q.includes('rescue') || q.includes('boat') || q.includes('ambulance') || q.includes('emergency')) {
    answerText = `### Emergency Rescue & SOS Assistance Directive:\n\n` +
      `* **Immediate Action:** Tap the red **"Broadcast SOS"** button in the app to transmit your live GPS coordinates directly to the NDRF 2nd Battalion and 108 Emergency Dispatch.\n` +
      `* **Offline / No Cellular Data:** Tap **"Use 2G SMS Beacon"** to generate an automated encoded distress text directly to the State Disaster Emergency Operations Center.\n` +
      `* **Active Inflatable Boats:** NDRF 2nd Bn Swift-Water Rescue Boats are deployed along the Baguiati/Kestopur canal perimeter for rooftop extractions.\n` +
      `* **Emergency Helplines:** State Disaster Control: **1070** | Emergency Services: **112** | Ambulance: **108**.`;
  }
  // 9. General Situation Briefing
  else {
    answerText = `### Tactical Incident Commander Briefing: ${risk.predictedDisaster.replace(/_/g, ' ')}\n\n` +
      `**1. Executive Threat Assessment:**\n` +
      `* Threat Classification: **${risk.predictedDisaster}** at **${risk.riskLevel}** urgency (${risk.confidence}% ML confidence).\n` +
      `* Environmental Triggers: Precipitation ${rain} mm/h, Kestopur canal water stage ${canalStage}m (danger mark 3.5m), Wind gusts ${telemetry.windSpeed ?? 45} km/h.\n` +
      `* Infrastructure Status: ${blockedRoads.length} arterial passages closed; ${openRoads.length} corridors verified clear.\n\n` +
      `**2. Multi-Agency Operational Orders:**\n` +
      `* **NDRF 2nd Battalion:** Maintain swift-water extraction patrols near Kestopur canal basin; deploy mobile dewatering pumps.\n` +
      `* **Kolkata Police DMG:** Enforce hard road barriers on VIP Road underpass and Jessore Road low cuttings; divert traffic to Biswa Bangla Sarani.\n` +
      `* **108 Medical Ambulance Services:** Position advanced life support vehicles at Salt Lake Central Park and Barasat Govt Hospital.\n\n` +
      `**3. Citizen Evacuation Directive:**\n` +
      `* Evacuate low-lying ground floor premises. Proceed eastward via **Biswa Bangla Sarani** to the **Salt Lake Central Park Stadium** or **New Town Eco Space Shelter**.`;
  }

  return {
    success: true,
    source: 'resqai_tactical_engine',
    question: question || 'TACTICAL_SITUATION_REPORT',
    answer: answerText,
    rawAnalysis: answerText,
    telemetrySnapshot: {
      rainfall: telemetry.rainfall,
      riverLevel: telemetry.riverLevel,
      windSpeed: telemetry.windSpeed,
      pressure: telemetry.pressure,
      soilSaturation: telemetry.soilSaturation,
      lightningStrikesPerMin: telemetry.lightningStrikesPerMin,
      lightningDistanceKm: telemetry.lightningDistanceKm,
    },
    riskSummary: {
      disaster: risk.predictedDisaster,
      level: risk.riskLevel,
      confidence: risk.confidence,
      recommendedAction: risk.recommendedAction,
    },
    brief: {
      title: `TACTICAL SITUATION REPORT: ${risk.predictedDisaster.replace(/_/g, ' ')}`,
      threatAssessment: [
        `Kestopur canal and Baguiati drainage stage measured at ${canalStage}m (danger threshold 3.5m).`,
        `Severe surface waterlogging accumulation driven by ${rain} mm/h precipitation and ${telemetry.soilSaturation ?? 85}% soil saturation.`,
        `${blockedRoads.length} arterial passages barricaded; VIP Road and low underpasses impassable.`,
      ],
      tacticalDirectives: [
        'Deploy NDRF 2nd Bn Inflatable Rescue Boat units to Baguiati/Kestopur canal basin for swift-water extractions.',
        'Reroute civilian evacuation eastward along elevated Biswa Bangla Sarani towards Salt Lake Central Park and New Town shelters.',
        'Direct Kolkata Police DMG to enforce physical barricades on all submerged canal underpasses.',
      ],
      publicBroadcast: `EMERGENCY ALERT: Mandatory evacuation advisory for low-lying Baguiati and Kestopur canal basin. Avoid VIP Road underpass. Move via Biswa Bangla Sarani to Salt Lake Central Park safe shelter.`,
      routingNotice: `Biswa Bangla Sarani and EM Bypass verified clear and navigable. Low-lying canal road underpasses strictly prohibited.`,
    },
    timestamp: new Date().toISOString(),
  };
}
