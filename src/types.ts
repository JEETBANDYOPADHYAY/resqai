export type DisasterType = 
  | 'FLASH_FLOOD'
  | 'HURRICANE'
  | 'WILDFIRE'
  | 'LANDSLIDE'
  | 'SEVERE_STORM'
  | 'THUNDER_LIGHTNING'
  | 'BASELINE_NORMAL';

export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';

export interface SensorTelemetry {
  temperature: number;      // °C
  humidity: number;         // %
  pressure: number;         // hPa (Barometric)
  windSpeed: number;        // km/h
  rainfall: number;         // mm/h accumulation
  riverLevel: number;       // meters stage (normal ~1.5m, flood >3.5m)
  seismic: number;          // Richter scale micro-tremors (0.0 - 6.0)
  soilSaturation: number;   // %
  lightningStrikesPerMin?: number; // Cloud-to-ground + intra-cloud strikes/min
  lightningDistanceKm?: number;    // Distance in km to nearest detected strike
  capeIndex?: number;              // Convective Available Potential Energy in J/kg (instability)
  slopeDisplacementRateMmPerHour?: number; // Inclinometer displacement creep rate (mm/h)
  poreWaterPressureKPa?: number;           // Hydrostatic pore water pressure in kPa
  slopeAngleDeg?: number;                  // Slope inclination angle in degrees
  factorOfSafety?: number;                 // Geotechnical FoS (<1.0 is active failure)
  damInflowCusecs?: number;                // Reservoir inflow rate (cusecs)
  damOutflowDischargeCusecs?: number;      // Spillway discharge rate (cusecs)
  reservoirCapacityPercent?: number;       // Reservoir storage capacity (% of FRL)
  damStructuralSeepageRateLps?: number;    // Embankment foundation seepage (Liters/sec)
  timestamp: string;
}

export interface MLFeatureWeights {
  rainfall: number;
  windSpeed: number;
  pressureDrop: number;
  riverLevel: number;
  soilSaturation: number;
  temperature: number;
  lightning?: number;
  slopeDisplacement?: number;
  porePressure?: number;
  damInflow?: number;
  reservoirStorage?: number;
  damSeepage?: number;
}

export interface MLHazardEvaluation {
  predictedDisaster: DisasterType;
  riskLevel: RiskLevel;
  confidence: number;      // 0 - 100%
  overallRiskScore: number; // 0 - 100
  probabilities: {
    flashFlood: number;
    hurricane: number;
    wildfire: number;
    landslide: number;
    severeStorm: number;
    thunderLightning?: number;
    normal: number;
  };
  triggerFactors: string[];
  recommendedAction: string;
  rationale: string;
  featureImportance: MLFeatureWeights;
  inferenceTimeMs: number;
}

export interface LightningStrike {
  id: string;
  coordinates: [number, number];
  locationName: string;
  strikeType: 'CLOUD_TO_GROUND' | 'INTRA_CLOUD';
  peakCurrentKA: number;     // e.g. -48 kA
  detectedAgoSec: number;
  riskRadiusMeters: number;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE';
}

export type ZoneType = 'RED' | 'YELLOW' | 'GREEN';

export interface ZonePolygon {
  id: string;
  name: string;
  zoneType: ZoneType;
  coordinates: [number, number][]; // [lat, lng] array forming polygon
  center: [number, number];
  severityScore: number;           // 0 to 10
  evacuationStatus: 'MANDATORY_EVACUATE' | 'PREPARE_SHELTER' | 'SAFE_VERIFIED';
  affectedPopulation: number;
  activeHazards: string[];
}

export interface RoadNode {
  id: string;
  name: string;
  coordinates: [number, number];
  isShelter?: boolean;
  isHospital?: boolean;
  isCitizenStart?: boolean;
  isEmergencyDepot?: boolean;
  capacity?: number;
  currentOccupancy?: number;
  medicalStaff?: number;
  supplyLevel?: 'HIGH' | 'MEDIUM' | 'CRITICAL';
  emergencyPhone?: string;
  helplinePhone?: string;
  contactPerson?: string;
  address?: string;
}

export interface GovtOnDutyDoctor {
  id: string;
  name: string;
  qualification: string;
  specialization: string;
  specialtyKey: 'TRAUMA' | 'ORTHO' | 'PEDIATRICS' | 'SNAKEBITE' | 'SURGERY' | 'GENERAL';
  designation: string;
  hospitalName: string;
  hospitalNodeId?: string;
  coordinates: [number, number];
  availabilityStatus: 'AVAILABLE_NOW' | 'ON_CALL_TELE_TRIAGE' | 'IN_SURGERY';
  shiftTime: string;
  directPhone: string;
  emergencyHelpline: string;
  languages: string[];
  currentLocationDesc: string;
  bio: string;
}

export interface MedicalRescueRequest {
  id: string;
  citizenName?: string;
  contactNumber?: string;
  coordinates: [number, number];
  locationName: string;
  patientCount: number;
  emergencyCategory: 
    | 'CRITICAL_TRAUMA'
    | 'FLOOD_SUBMERSION'
    | 'FRACTURE_STRETCHER'
    | 'SNAKEBITE_POISON'
    | 'OXYGEN_RESPIRATORY'
    | 'PEDIATRIC_MATERNAL'
    | 'CRITICAL_MEDICATION';
  waterDepth: 'DRY' | 'KNEE_DEEP' | 'WAIST_DEEP' | 'ROOFTOP_STRANDED';
  notes: string;
  preferredModality: 'WATER_AMBULANCE_BOAT' | 'ALS_ROAD_AMBULANCE' | 'AMPHIBIOUS_EXTRACTION';
  requestedAt: string;
  status: 'DISPATCHED' | 'EN_ROUTE' | 'ON_SCENE' | 'RESOLVED' | 'CANCELLED';
  assignedUnitName: string;
  assignedUnitId: string;
  etaMinutes: number;
  leadParamedicName: string;
  rescueContactPhone: string;
}

export interface RoadSegment {
  id: string;
  name: string;
  fromNode: string;
  toNode: string;
  coordinates: [number, number][]; // line string coords
  distanceKm: number;
  isBlocked: boolean;
  blockReason?: string;
  isBridge?: boolean;
  isFloodProne?: boolean;
  elevationRisk?: 'LOW' | 'MED' | 'HIGH';
  speedLimitKmh: number;
  laneCount: number;
}

export type NavigationManeuver = 
  | 'TURN_LEFT' 
  | 'TURN_RIGHT' 
  | 'SLIGHT_LEFT' 
  | 'SLIGHT_RIGHT' 
  | 'CONTINUE_STRAIGHT' 
  | 'U_TURN' 
  | 'DEPART' 
  | 'ARRIVE';

export interface RouteStep {
  instruction: string;
  distanceKm: number;
  estimatedSec: number;
  maneuver?: NavigationManeuver;
  streetName?: string;
  hazardAlert?: string;
  isBypass?: boolean;
  coordinates?: [number, number];
}

export interface RoutingResult {
  path: [number, number][];
  nodeIds: string[];
  segmentIds: string[];
  totalDistanceKm: number;
  estimatedTimeMin: number;
  safetyIndexScore: number; // 0 - 100%
  blockedRoadsAvoided: number;
  hazardsBypassed: string[];
  destinationNode: RoadNode;
  turnByTurn: RouteStep[];
}

export type UserViewProfile = 'CITIZEN' | 'AMBULANCE' | 'COMMAND_CENTER';

export interface DispatchIncident {
  id: string;
  title: string;
  type: 'MEDICAL_EMERGENCY' | 'STRUCTURAL_COLLAPSE' | 'FLOOD_RESCUE' | 'ROAD_CLEARANCE' | 'EVACUATION_ASSIST';
  priority: 'CODE_RED' | 'CODE_YELLOW' | 'CODE_BLUE';
  coordinates: [number, number];
  address: string;
  reportedAt: string;
  status: 'PENDING' | 'DISPATCHED' | 'ON_SCENE' | 'RESOLVED';
  assignedUnitId?: string;
  callerSosCount: number;
  notes: string;
}

export interface EmergencyUnit {
  id: string;
  name: string;
  callSign: string;
  type: 'AMBULANCE' | 'RESCUE_BOAT' | 'FIRE_ENGINE' | 'DRONE_RECON';
  status: 'AVAILABLE' | 'EN_ROUTE' | 'ON_SCENE' | 'RETURNING';
  currentLocation: [number, number];
  speedKmh: number;
  destinationLocation?: [number, number];
  assignedIncidentId?: string;
  etaMinutes?: number;
  fuelOrBattery: number;
}

export interface ScenarioPreset {
  id: string;
  name: string;
  badge: string;
  description: string;
  telemetry: SensorTelemetry;
  defaultBlockedRoads: string[];
  hazardFocus: [number, number];
}

export interface AuthorizedPersonnel {
  badgeId: string;
  name: string;
  agency: string;
  role: string;
  clearanceLevel: number;
  sessionToken?: string;
  authorizedAt: string;
}

export interface LandslideStation {
  id: string;
  name: string;
  coordinates: [number, number];
  slopeAngleDeg: number;
  displacementRateMmHr: number;
  poreWaterPressureKPa: number;
  factorOfSafety: number;
  soilType: string;
  estimatedFailureEtaMin: number | null;
  alertLevel: 'CRITICAL_RUPTURE' | 'HIGH_CREEP' | 'MODERATE_WATCH' | 'STABLE';
  historicalFailuresCount: number;
  criticalThresholdMet: boolean;
}

export interface DamBarrageStation {
  id: string;
  name: string;
  riverBasin: string;
  coordinates: [number, number];
  reservoirLevelMeters: number;
  fullReservoirLevelMeters: number; // FRL
  storageCapacityPercent: number;
  inflowCusecs: number;
  outflowCusecs: number;
  spillwayGatesOpen: number;
  spillwayGatesTotal: number;
  seepageRateLps: number;
  ruptureRiskScore: number; // 0 - 100
  failureMode: 'OVERTOPPING' | 'PIPING_SEEPAGE' | 'GATE_JAM' | 'STRUCTURAL_SHEAR' | 'SAFE_REGULATED';
  estimatedBreachWaveEtaMin: number | null; // minutes to downstream populated node
  peakBreachDischargeCusecs: number;
  alertLevel: 'CODE_RED_RUPTURE_IMMINENT' | 'HIGH_SURGE_DISCHARGE' | 'MODERATE_WATCH' | 'STABLE_STORAGE';
  downstreamInundationRiskZones: string[];
}

export type Language = 'en' | 'bn' | 'hi';

export type MediaReportStatus = 'PENDING_VERIFICATION' | 'APPROVED' | 'REJECTED';

export type DisasterHazardCategory = 
  | 'URBAN_FLOODING'
  | 'DAM_OVERFLOW'
  | 'LANDSLIDE_DEBRIS'
  | 'STRUCTURAL_COLLAPSE'
  | 'ROAD_SUBMERGED'
  | 'ELECTRICAL_HAZARD'
  | 'STRANDED_CITIZENS';

export interface VerificationCheckResult {
  isRelevant: boolean;
  relevanceConfidence: number; // 0 - 100%
  relevanceReasoning: string;
  detectedFeatures: string[];
  isTimestampValid: boolean;
  captureTimestamp: string;
  mediaAgeMinutes: number;
  timestampReasoning: string;
  isStaleOrArchived: boolean;
  damageSeverity: 'CRITICAL' | 'SEVERE' | 'MODERATE' | 'LOW' | 'NONE';
  aiVerdict: 'APPROVED' | 'REJECTED';
  verdictSummary: string;
}

export interface CitizenDisasterMediaReport {
  id: string;
  citizenName: string;
  contactNumber?: string;
  affectedAreaName: string;
  coordinates: [number, number];
  category: DisasterHazardCategory;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE';
  description: string;
  mediaType: 'PHOTO' | 'VIDEO';
  mediaUrl: string;
  mediaFileName: string;
  mediaFileSizeKb: number;
  captureTimestamp: string;
  submittedAt: string;
  verificationStatus: MediaReportStatus;
  verification?: VerificationCheckResult;
  managementNotified: boolean;
  notifiedAt?: string;
  managementAction?: 'DISPATCHED_RESCUE' | 'ROAD_BLOCKED' | 'SHELTER_ALERT' | 'ACKNOWLEDGED' | 'OVERRIDE_APPROVED' | 'NONE';
}
