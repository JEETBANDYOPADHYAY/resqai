import { CitizenDisasterMediaReport, VerificationCheckResult } from '../types';

// High-fidelity SVG Data URLs depicting realistic disaster scenarios and non-disaster test cases
export const SAMPLE_FLOOD_PHOTO_DATA_URL = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="%231e293b"/>
      <stop offset="100%" stop-color="%23334155"/>
    </linearGradient>
    <linearGradient id="flood" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="%230284c7" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="%230369a1"/>
    </linearGradient>
    <linearGradient id="rain" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0%" stop-color="%2338bdf8" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="%230284c7" stop-opacity="0.1"/>
    </linearGradient>
  </defs>
  <rect width="600" height="400" fill="url(%23sky)"/>
  <!-- Submerged Buildings -->
  <rect x="60" y="90" width="110" height="190" fill="%230f172a" rx="4"/>
  <rect x="75" y="110" width="20" height="25" fill="%23facc15" opacity="0.8"/>
  <rect x="115" y="110" width="20" height="25" fill="%2394a3b8" opacity="0.3"/>
  <rect x="75" y="150" width="20" height="25" fill="%2394a3b8" opacity="0.3"/>
  <rect x="115" y="150" width="20" height="25" fill="%23facc15" opacity="0.7"/>
  
  <rect x="200" y="130" width="140" height="150" fill="%231e293b" rx="4"/>
  <rect x="360" y="100" width="180" height="180" fill="%230f172a" rx="4"/>

  <!-- Submerged Bridge and Road Structure -->
  <path d="M0 240 Q300 230 600 245 L600 280 Q300 265 0 280 Z" fill="%23334155"/>

  <!-- Muddy Torrential Floodwaters (1.5m depth) -->
  <rect x="0" y="250" width="600" height="150" fill="url(%23flood)"/>
  <path d="M0 250 Q150 240 300 255 T600 250 L600 400 L0 400 Z" fill="%23082f49" opacity="0.6"/>

  <!-- Submerged Car Roof Floating -->
  <g transform="translate(230, 235)">
    <rect x="0" y="15" width="120" height="25" rx="6" fill="%23dc2626"/>
    <path d="M25 15 L40 0 L85 0 L100 15 Z" fill="%23b91c1c"/>
    <rect x="42" y="3" width="18" height="10" fill="%23e2e8f0" opacity="0.7"/>
    <rect x="66" y="3" width="18" height="10" fill="%23e2e8f0" opacity="0.7"/>
    <!-- Water ripples around car -->
    <ellipse cx="60" cy="38" rx="75" ry="8" fill="none" stroke="%2338bdf8" stroke-width="2" opacity="0.7"/>
  </g>

  <!-- Heavy Downpour Lines -->
  <line x1="80" y1="20" x2="60" y2="120" stroke="%2393c5fd" stroke-width="1.5" stroke-dasharray="8 12" opacity="0.6"/>
  <line x1="220" y1="10" x2="200" y2="110" stroke="%2393c5fd" stroke-width="1.5" stroke-dasharray="8 12" opacity="0.6"/>
  <line x1="380" y1="30" x2="360" y2="130" stroke="%2393c5fd" stroke-width="1.5" stroke-dasharray="8 12" opacity="0.6"/>
  <line x1="500" y1="15" x2="480" y2="115" stroke="%2393c5fd" stroke-width="1.5" stroke-dasharray="8 12" opacity="0.6"/>

  <!-- Ground Evidence Watermark Tag -->
  <rect x="20" y="20" width="220" height="34" rx="6" fill="%23000000" opacity="0.75"/>
  <text x="32" y="42" fill="%23ef4444" font-family="monospace" font-weight="bold" font-size="12">⚠️ FIELD REPORT: VIP UNDERPASS</text>
  <rect x="440" y="20" width="140" height="34" rx="6" fill="%23000000" opacity="0.75"/>
  <text x="452" y="42" fill="%2338bdf8" font-family="monospace" font-size="11">WATER LEVEL: 1.4M</text>
</svg>`;

export const SAMPLE_LANDSLIDE_PHOTO_DATA_URL = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
  <defs>
    <linearGradient id="rock" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="%2378350f"/>
      <stop offset="100%" stop-color="%23451a03"/>
    </linearGradient>
  </defs>
  <rect width="600" height="400" fill="%231e293b"/>
  <!-- Mountain Slope -->
  <polygon points="0,0 450,0 600,280 0,380" fill="%23334155"/>
  <polygon points="120,40 500,200 420,380 0,380" fill="url(%23rock)"/>

  <!-- Crumbled Mud & Fallen Boulders on Asphalt Road -->
  <rect x="0" y="300" width="600" height="100" fill="%230f172a"/>
  <!-- Road Yellow Line Broken -->
  <line x1="0" y1="350" x2="220" y2="350" stroke="%23eab308" stroke-width="4" stroke-dasharray="14 10"/>
  <line x1="480" y1="350" x2="600" y2="350" stroke="%23eab308" stroke-width="4" stroke-dasharray="14 10"/>

  <!-- Boulder 1 -->
  <ellipse cx="280" cy="320" rx="65" ry="45" fill="%2357534e"/>
  <!-- Boulder 2 -->
  <ellipse cx="370" cy="345" rx="55" ry="38" fill="%2344403c"/>
  <!-- Uprooted Tree -->
  <path d="M190 280 L320 340" stroke="%23713f12" stroke-width="12" stroke-linecap="round"/>
  <circle cx="330" cy="345" r="28" fill="%2315803d" opacity="0.85"/>

  <!-- Text Badge -->
  <rect x="20" y="20" width="250" height="34" rx="6" fill="%23000000" opacity="0.8"/>
  <text x="32" y="42" fill="%23f97316" font-family="monospace" font-weight="bold" font-size="12">⛰️ ACTIVE LANDSLIDE BLOCKAGE</text>
</svg>`;

export const SAMPLE_IRRELEVANT_CAT_DATA_URL = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
  <rect width="600" height="400" fill="%23fef3c7"/>
  <!-- Cozy Indoor Room Carpet -->
  <rect x="40" y="240" width="520" height="140" fill="%23fed7aa" rx="16"/>
  <!-- Cat Body -->
  <ellipse cx="300" cy="270" rx="90" ry="60" fill="%23f97316"/>
  <ellipse cx="300" cy="265" rx="75" ry="50" fill="%23fb923c"/>
  <!-- Cat Head -->
  <circle cx="210" cy="240" r="45" fill="%23f97316"/>
  <!-- Ears -->
  <polygon points="175,210 190,170 215,205" fill="%23ea580c"/>
  <polygon points="215,205 240,170 250,212" fill="%23ea580c"/>
  <!-- Eyes -->
  <ellipse cx="195" cy="235" rx="6" ry="10" fill="%23059669"/>
  <ellipse cx="225" cy="235" rx="6" ry="10" fill="%23059669"/>
  <!-- Nose & Whiskers -->
  <polygon points="208,245 214,245 211,250" fill="%23f43f5e"/>
  <line x1="170" y1="248" x2="200" y2="248" stroke="%237c2d12" stroke-width="2"/>
  <line x1="170" y1="254" x2="200" y2="252" stroke="%237c2d12" stroke-width="2"/>
  <line x1="220" y1="248" x2="250" y2="248" stroke="%237c2d12" stroke-width="2"/>
  <line x1="220" y1="252" x2="250" y2="254" stroke="%237c2d12" stroke-width="2"/>
  <!-- Tail -->
  <path d="M380 270 Q430 250 420 200" fill="none" stroke="%23ea580c" stroke-width="18" stroke-linecap="round"/>
  <!-- Tag -->
  <rect x="20" y="20" width="310" height="34" rx="6" fill="%23000000" opacity="0.8"/>
  <text x="32" y="42" fill="%23e2e8f0" font-family="monospace" font-size="12">🐾 DOMESTIC PET PHOTO (NON-DISASTER)</text>
</svg>`;

export const SAMPLE_OLD_ARCHIVE_DATA_URL = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
  <rect width="600" height="400" fill="%2327272a"/>
  <!-- Sepia / Aged Flood Archive -->
  <rect x="0" y="150" width="600" height="250" fill="%23713f12" opacity="0.7"/>
  <text x="30" y="80" fill="%23fbbf24" font-family="monospace" font-weight="bold" font-size="22">HISTORIC MONSOON FLOOD 2019</text>
  <text x="30" y="110" fill="%2394a3b8" font-family="monospace" font-size="14">Archive Registry ID: WB-DM-2019-AUG-0412</text>
  <!-- Timestamp Stamp on Image -->
  <rect x="360" y="320" width="220" height="50" rx="4" fill="%23b91c1c"/>
  <text x="375" y="345" fill="%23ffffff" font-family="monospace" font-weight="bold" font-size="13">CLICKED: 14-AUG-2019</text>
  <text x="375" y="360" fill="%23fecaca" font-family="monospace" font-size="10">STALE: 7 YEARS OLD</text>
</svg>`;

export const INITIAL_CITIZEN_REPORTS: CitizenDisasterMediaReport[] = [
  {
    id: 'report-cit-01',
    citizenName: 'Anirban Chatterjee',
    contactNumber: '+91 98301 24519',
    affectedAreaName: 'Baguiati VIP Road Underpass & Joramandir',
    coordinates: [22.6050, 88.4250],
    category: 'URBAN_FLOODING',
    severity: 'CRITICAL',
    description: 'Underpass completely submerged under 4.5 feet of swirling stormwater. Three commercial vans stuck with water rising to window level. People seeking refuge on concrete divider.',
    mediaType: 'PHOTO',
    mediaUrl: SAMPLE_FLOOD_PHOTO_DATA_URL,
    mediaFileName: 'baguiati_vip_underpass_submerged_2026.jpg',
    mediaFileSizeKb: 284,
    captureTimestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(), // 25 mins ago
    submittedAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    verificationStatus: 'APPROVED',
    verification: {
      isRelevant: true,
      relevanceConfidence: 97,
      relevanceReasoning: 'Confirmed extreme urban flooding with submerged transportation corridor, vehicle roof entrapment risk, and hazardous water depth exceeding 1.2 meters.',
      detectedFeatures: [
        'Rising murky stormwater inundation',
        'Submerged commercial vehicle',
        'Blocked arterial underpass corridor',
        'High entrapment risk',
      ],
      isTimestampValid: true,
      captureTimestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      mediaAgeMinutes: 25,
      timestampReasoning: 'Capture timestamp is within 25 minutes of active Cloudburst & Hooghly Flood Warning. Perfect recency match.',
      isStaleOrArchived: false,
      damageSeverity: 'CRITICAL',
      aiVerdict: 'APPROVED',
      verdictSummary: 'Verified authentic real-time ground evidence. Escalated to Disaster Command Center with priority rescue dispatch flag.',
    },
    managementNotified: true,
    notifiedAt: new Date(Date.now() - 19 * 60 * 1000).toISOString(),
    managementAction: 'DISPATCHED_RESCUE',
  },
  {
    id: 'report-cit-02',
    citizenName: 'Priyanka Das',
    contactNumber: '+91 94330 91823',
    affectedAreaName: 'Kestopur Circular Canal Embankment Breach Point',
    coordinates: [22.6120, 88.4310],
    category: 'DAM_OVERFLOW',
    severity: 'HIGH',
    description: 'Canal retaining wall collapsed near bridge pillar 4. Torrential water spilling uncontrollably into adjacent residential alleys. Local culvert washed away.',
    mediaType: 'VIDEO',
    mediaUrl: SAMPLE_FLOOD_PHOTO_DATA_URL,
    mediaFileName: 'kestopur_canal_breach_clip_1080p.mp4',
    mediaFileSizeKb: 3840,
    captureTimestamp: new Date(Date.now() - 48 * 60 * 1000).toISOString(), // 48 mins ago
    submittedAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    verificationStatus: 'APPROVED',
    verification: {
      isRelevant: true,
      relevanceConfidence: 94,
      relevanceReasoning: 'High-velocity water surge spilling over collapsed embankment wall into civilian residential area.',
      detectedFeatures: [
        'Active hydraulic embankment collapse',
        'Fast-flowing canal overspill',
        'Submerged municipal access path',
      ],
      isTimestampValid: true,
      captureTimestamp: new Date(Date.now() - 48 * 60 * 1000).toISOString(),
      mediaAgeMinutes: 48,
      timestampReasoning: 'Captured 48 minutes ago during active Dam Inflow Surge alert. Passes strict <24h integrity window.',
      isStaleOrArchived: false,
      damageSeverity: 'SEVERE',
      aiVerdict: 'APPROVED',
      verdictSummary: 'Verified high-severity infrastructure failure. Broadcast to NDRF and Municipal Drainage Division.',
    },
    managementNotified: true,
    notifiedAt: new Date(Date.now() - 39 * 60 * 1000).toISOString(),
    managementAction: 'ROAD_BLOCKED',
  },
];

export interface DemoPreset {
  id: string;
  name: string;
  badge: string;
  category: any;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE';
  areaName: string;
  coordinates: [number, number];
  description: string;
  mediaType: 'PHOTO' | 'VIDEO';
  mediaUrl: string;
  fileName: string;
  fileSizeKb: number;
  captureTimestamp: string;
  expectedVerdict: 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
}

export const DEMO_PRESETS: DemoPreset[] = [
  {
    id: 'preset-flood-valid',
    name: 'Fresh Flash Flood Video / Photo (Real-Time)',
    badge: 'VERIFIED APPROVAL DEMO',
    category: 'URBAN_FLOODING',
    severity: 'CRITICAL',
    areaName: 'College Street & MG Road Crossing',
    coordinates: [22.5760, 88.3630],
    description: 'Water depth over 3.5 feet. Stagnant flood blocking all ambulance passage toward Medical College. Electrical transformer sparking nearby.',
    mediaType: 'PHOTO',
    mediaUrl: SAMPLE_FLOOD_PHOTO_DATA_URL,
    fileName: 'college_st_severe_flood_live.jpg',
    fileSizeKb: 412,
    captureTimestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 mins ago
    expectedVerdict: 'APPROVED',
  },
  {
    id: 'preset-landslide-valid',
    name: 'Active Landslide & Debris (Recent 35m)',
    badge: 'VERIFIED APPROVAL DEMO',
    category: 'LANDSLIDE_DEBRIS',
    severity: 'HIGH',
    areaName: 'Belghoria Expressway Hillside Slope',
    coordinates: [22.6520, 88.3880],
    description: 'Mudslide collapsed onto northern lane. Massive boulders blocking two lanes, vehicles forced to turn back.',
    mediaType: 'PHOTO',
    mediaUrl: SAMPLE_LANDSLIDE_PHOTO_DATA_URL,
    fileName: 'belghoria_landslide_debris_live.jpg',
    fileSizeKb: 680,
    captureTimestamp: new Date(Date.now() - 35 * 60 * 1000).toISOString(), // 35 mins ago
    expectedVerdict: 'APPROVED',
  },
  {
    id: 'preset-irrelevant-pet',
    name: 'Irrelevant Pet / Meme Photo (Non-Disaster)',
    badge: 'TEST REJECTION: IRRELEVANT',
    category: 'URBAN_FLOODING',
    severity: 'LOW' as any,
    areaName: 'Salt Lake Sector V',
    coordinates: [22.5850, 88.4320],
    description: 'Sending a picture of my pet sitting on the carpet.',
    mediaType: 'PHOTO',
    mediaUrl: SAMPLE_IRRELEVANT_CAT_DATA_URL,
    fileName: 'cute_orange_cat_bedroom.jpg',
    fileSizeKb: 145,
    captureTimestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    expectedVerdict: 'REJECTED',
    rejectionReason: 'Content Irrelevant: Image shows a domestic pet indoors. No floodwaters, structural damage, debris, or disaster conditions detected.',
  },
  {
    id: 'preset-stale-archive',
    name: 'Old 2019 Archived Flood Photo (Stale Timestamp)',
    badge: 'TEST REJECTION: STALE TIMESTAMP',
    category: 'URBAN_FLOODING',
    severity: 'CRITICAL',
    areaName: 'Howrah Foreshore Ghat',
    coordinates: [22.5890, 88.3410],
    description: 'Found this picture of heavy flooding from an old social media post.',
    mediaType: 'PHOTO',
    mediaUrl: SAMPLE_OLD_ARCHIVE_DATA_URL,
    fileName: 'archive_hooghly_flood_august_2019.jpg',
    fileSizeKb: 520,
    // Captured 7 years ago!
    captureTimestamp: '2019-08-14T09:30:00.000Z',
    expectedVerdict: 'REJECTED',
    rejectionReason: 'Timestamp Verification Failed: Photo metadata shows it was taken in August 2019 (>7 years ago). The system strictly discards archived media to prevent emergency resource diversion.',
  },
];
