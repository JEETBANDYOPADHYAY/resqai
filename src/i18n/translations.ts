import { Language } from '../types';

export interface Translations {
  // Brand & Header
  appSubtitle: string;
  mlInferenceActive: string;
  scenarioLabel: string;
  streamOn: string;
  streamPaused: string;
  streamTooltipOn: string;
  streamTooltipOff: string;
  sirenMute: string;
  sirenEnable: string;
  pythonMlTooltip: string;
  liveClockLabel: string;

  // Profiles
  citizenView: string;
  emergencyView: string;
  authRequired: string;
  clearanceLevel: string;
  lockConsole: string;

  // Threat & Risk
  riskCritical: string;
  riskHigh: string;
  riskModerate: string;
  riskLow: string;
  riskSafe: string;

  // Telemetry Panel
  telemetryTitle: string;
  liveTelemetryDesc: string;
  rainfallMetric: string;
  waterLevelMetric: string;
  windSpeedMetric: string;
  flashFloodIndexMetric: string;
  soilSaturationMetric: string;
  damStorageMetric: string;
  lightningMetric: string;
  slopePoreMetric: string;

  // Navigation & Evacuation
  safeEvacuationNav: string;
  liveGuidance: string;
  dynamicPathingDesc: string;
  broadcastSos: string;
  sosTransmitting: string;
  sosSuccessMessage: string;
  yourLocation: string;
  destinationSafeZone: string;
  changeLocation: string;
  changeSafeShelter: string;
  aiRecommendedShelter: string;
  selectShelterHelp: string;
  revertToAiShelter: string;
  customShelterActive: string;
  relocateJunction: string;
  selectJunctionHelp: string;
  distanceKm: string;
  etaMinutes: string;
  routeSafetyScore: string;
  startLiveEvacuation: string;
  computingRoute: string;
  recenterMap: string;
  exitLiveGuidance: string;
  driveMode: string;
  walkMode: string;
  voiceNavigation: string;
  reportRoadBlocked: string;
  dangerAheadRerouting: string;
  routingAvoidsFlooded: string;

  // Emergency Command
  emergencyCommandTitle: string;
  tabDispatchQueue: string;
  tabFleetUnits: string;
  tabRoadNetwork: string;
  tabAiCommand: string;
  activeIncidents: string;
  autoTransmitting: string;
  dispatchUnit: string;
  unitFleetStatus: string;
  blockedCorridors: string;
  clearAllRoadblocks: string;
  aiIncidentCommander: string;
  generateTacticalPlan: string;
  synthesizingPlan: string;
  askSituationalQueryPlaceholder: string;
  askAiButton: string;

  // Map Controls & Legend
  layerRagZones: string;
  layerRoads: string;
  layerRescueUnits: string;
  layerDams: string;
  layerLightning: string;
  layerLandslides: string;
  focusRoute: string;
  legendRed: string;
  legendYellow: string;
  legendGreen: string;
  legendBlockedRoad: string;
  legendCitizenStart: string;

  // Early Warning Banners
  lightningAlertTitle: string;
  landslideAlertTitle: string;
  damRuptureTitle: string;
  immediateEvacuation: string;
  stayAlert: string;
  safeHaven: string;
  cancel: string;
  confirm: string;

  // Offline & Resilience
  offlineMode: string;
  offlineResilient: string;
  offlineDesc: string;
  offlineSmsBeacon: string;
  installApp: string;
  simulateOffline: string;
  onlineLive: string;
  smsDistressTitle: string;
  sendSms112: string;
  sendSms108: string;
  copiedSms: string;
  nearestHospital: string;
  nearestShelter: string;
  locationEmergencyContacts: string;
  callNow: string;
  sendSmsToFacility: string;
  allNearbyFacilities: string;
  casualtyTraumaDesk: string;
  reliefCampDesk: string;

  // Emergency Medical Help & Govt Doctors
  emergencyMedicalTitle: string;
  emergencyMedicalDesc: string;
  govtDoctorsTab: string;
  rescueTeamTab: string;
  firstAidTab: string;
  availableNowBadge: string;
  callDoctor: string;
  smsDoctor: string;
  dispatchRescueTeam: string;
  rescueEnRoute: string;
  rescueTeamHelpText: string;
  medicalUrgency: string;
  waterDepthLabel: string;
  requestMedicalRescueBtn: string;
}

export const TRANSLATIONS: Record<Language, Translations> = {
  en: {
    appSubtitle: 'Real-Time AI Hazard Early Warning & Evacuation Routing',
    mlInferenceActive: 'ML Inference Active',
    scenarioLabel: 'Scenario:',
    streamOn: 'Stream ON',
    streamPaused: 'Stream PAUSED',
    streamTooltipOn: 'Pause Real-Time Telemetry Simulation',
    streamTooltipOff: 'Simulate Live Telemetry Ingestion',
    sirenMute: 'Mute Alert Siren',
    sirenEnable: 'Enable Audio Alert Siren',
    pythonMlTooltip: 'Inspect Python / FastAPI ML Pipeline',
    liveClockLabel: 'LIVE IST',

    citizenView: 'Citizen View',
    emergencyView: 'Emergency View',
    authRequired: 'Auth Required',
    clearanceLevel: 'Clearance Level',
    lockConsole: 'Lock Console',

    riskCritical: 'CRITICAL',
    riskHigh: 'HIGH',
    riskModerate: 'MODERATE',
    riskLow: 'LOW',
    riskSafe: 'SAFE',

    telemetryTitle: 'Real-Time Sensor Telemetry',
    liveTelemetryDesc: 'Live IoT telemetry stream monitoring Kolkata metropolitan basin',
    rainfallMetric: 'Precipitation Rate',
    waterLevelMetric: 'Hooghly River Stage',
    windSpeedMetric: 'Sustained Gust',
    flashFloodIndexMetric: 'Flash Flood Severity',
    soilSaturationMetric: 'Soil Saturation',
    damStorageMetric: 'Dam Inflow / Surge',
    lightningMetric: 'Lightning Strikes (15m)',
    slopePoreMetric: 'Slope Pore Pressure',

    safeEvacuationNav: 'Safe Evacuation Route',
    liveGuidance: 'LIVE GUIDANCE',
    dynamicPathingDesc: 'Dynamic multi-objective pathing avoiding blocked roads & inundated corridors',
    broadcastSos: 'BROADCAST SOS',
    sosTransmitting: 'TRANSMITTING...',
    sosSuccessMessage: 'Emergency SOS Broadcasted! Closest rescue unit and 108 medical dispatcher notified.',
    yourLocation: 'Current Location',
    destinationSafeZone: 'Destination Haven',
    changeLocation: 'Change Location',
    changeSafeShelter: 'Change Safe Shelter',
    aiRecommendedShelter: 'AI Recommended (Nearest Safe Haven)',
    selectShelterHelp: 'Select any verified safe shelter or hospital to compute the safest, shortest evacuation path.',
    revertToAiShelter: 'Reset to AI Nearest Shelter',
    customShelterActive: 'Custom Safe Shelter Active',
    relocateJunction: 'Relocate My Starting Junction',
    selectJunctionHelp: 'Select any road junction to relocate GPS origin',
    distanceKm: 'Distance',
    etaMinutes: 'Estimated Time',
    routeSafetyScore: 'Safety Index',
    startLiveEvacuation: 'START LIVE EVACUATION GUIDANCE',
    computingRoute: 'Computing optimal evacuation corridor...',
    recenterMap: 'Recenter Map',
    exitLiveGuidance: 'Exit Live Navigation',
    driveMode: 'DRIVE',
    walkMode: 'WALK',
    voiceNavigation: 'Voice Guidance',
    reportRoadBlocked: 'REPORT ROAD BLOCKED AHEAD',
    dangerAheadRerouting: 'Danger Ahead - Rerouting Safe Path',
    routingAvoidsFlooded: 'Rerouted through higher elevation to avoid inundated sector.',

    emergencyCommandTitle: 'Emergency Command & Dispatch',
    tabDispatchQueue: 'Dispatch Queue',
    tabFleetUnits: 'Fleet Units',
    tabRoadNetwork: 'Roads & Blockades',
    tabAiCommand: 'AI Incident Brief',
    activeIncidents: 'Active Incidents',
    autoTransmitting: 'Auto-transmitting coordinates',
    dispatchUnit: 'Dispatch Unit',
    unitFleetStatus: 'Fleet Units Status',
    blockedCorridors: 'Road Network Status',
    clearAllRoadblocks: 'Clear All Roadblocks',
    aiIncidentCommander: 'AI Incident Commander Briefing',
    generateTacticalPlan: 'Generate Tactical Plan',
    synthesizingPlan: 'SYNTHESIZING...',
    askSituationalQueryPlaceholder: "Ask situational query (e.g. 'Should we redirect hospital traffic via Biswa Bangla Sarani?')...",
    askAiButton: 'Ask AI Command',

    layerRagZones: 'RAG Zones',
    layerRoads: 'Roads',
    layerRescueUnits: 'Rescue Units',
    layerDams: 'Dams / Barrages',
    layerLightning: 'Lightning Strikes',
    layerLandslides: 'Landslide Stations',
    focusRoute: 'Focus Route',
    legendRed: 'RED (Immediate Evacuation)',
    legendYellow: 'YELLOW (Stay Alert / Warning)',
    legendGreen: 'GREEN (Safe Evacuation Zone)',
    legendBlockedRoad: 'Blocked Road',
    legendCitizenStart: 'Citizen Origin',

    lightningAlertTitle: 'Severe Lightning & Thunderstorm Warning',
    landslideAlertTitle: 'Slope Instability & Landslide Early Warning',
    damRuptureTitle: 'Dam / Barrage Breach & Surge Discharge Alert',
    immediateEvacuation: 'Immediate Evacuation Required',
    stayAlert: 'Stay Alert',
    safeHaven: 'Safe Haven Available',
    cancel: 'Cancel',
    confirm: 'Confirm',

    // Offline & Resilience
    offlineMode: 'Offline Mode',
    offlineResilient: 'Offline Resilience Active',
    offlineDesc: 'Autonomous road graph, haven routing & 2G SMS distress beacon cached locally',
    offlineSmsBeacon: '2G SMS Distress Beacon',
    installApp: 'Install App',
    simulateOffline: 'Simulate Offline',
    onlineLive: 'Live Connected',
    smsDistressTitle: 'Offline Low-Bandwidth 2G SMS Distress Beacon',
    sendSms112: 'Transmit 2G SMS to 112 (Emergency)',
    sendSms108: 'Transmit 2G SMS to 108 (Ambulance)',
    copiedSms: 'Distress Payload Copied!',
    nearestHospital: 'Nearest Trauma Hospital',
    nearestShelter: 'Nearest Safe Evacuation Shelter',
    locationEmergencyContacts: 'Location-Based Emergency Helplines (Nearest to You)',
    callNow: 'Direct Call',
    sendSmsToFacility: 'Send 2G SMS to Facility',
    allNearbyFacilities: 'All Nearby Hospitals & Relief Centers (Ranked by Distance)',
    casualtyTraumaDesk: 'Casualty / Trauma Desk',
    reliefCampDesk: 'Relief Camp Command Desk',

    // Emergency Medical Help & Govt Doctors
    emergencyMedicalTitle: 'Emergency Medical Relief & Govt Doctor Support',
    emergencyMedicalDesc: 'Connect directly with on-duty government doctors or request our Quick Medical Rescue Team (QMRT) for on-site field intervention.',
    govtDoctorsTab: 'On-Duty Govt Doctors',
    rescueTeamTab: 'Rescue Team Medical Dispatch',
    firstAidTab: 'Disaster First-Aid Guide',
    availableNowBadge: 'Available Now (Disaster Duty)',
    callDoctor: 'Direct Doctor Call',
    smsDoctor: 'Send 2G SMS to Doctor',
    dispatchRescueTeam: 'Dispatch Medical Rescue Team to My GPS',
    rescueEnRoute: 'Rescue Medical Unit Dispatched & En Route',
    rescueTeamHelpText: 'If you or someone nearby is injured, stranded, or in critical distress, our Rapid Medical Rescue Team will deploy by water ambulance boat or rescue vehicle with paramedics, oxygen, and emergency trauma kits.',
    medicalUrgency: 'Medical Urgency Category',
    waterDepthLabel: 'Water Depth at Location',
    requestMedicalRescueBtn: 'Request Rapid Medical Rescue Intervention',
  },

  bn: {
    appSubtitle: 'রিয়েল-টাইম এআই দুর্যোগ পূর্বাভাস ও নিরাপদ স্থানান্তর রুট',
    mlInferenceActive: 'এমএল পূর্বাভাস সক্রিয়',
    scenarioLabel: 'পরিস্থিতি:',
    streamOn: 'লাইভ স্ট্রিম চালু',
    streamPaused: 'স্ট্রিম স্থগিত',
    streamTooltipOn: 'রিয়েল-টাইম ডেটা স্ট্রিম বিরতি দিন',
    streamTooltipOff: 'লাইভ সেন্সর ডেটা অনুকরণ শুরু করুন',
    sirenMute: 'সাইরেন নিঃশব্দ করুন',
    sirenEnable: 'জরুরি অ্যালার্ট সাইরেন চালু করুন',
    pythonMlTooltip: 'পাইথন / ফাস্টএপিআই এমএল পাইপলাইন দেখুন',
    liveClockLabel: 'লাইভ IST',

    citizenView: 'নাগরিক ভিউ',
    emergencyView: 'জরুরি কমান্ড ভিউ',
    authRequired: 'অনুমতি আবশ্যক',
    clearanceLevel: 'ক্লিয়ারেন্স লেভেল',
    lockConsole: 'কনসোল লক করুন',

    riskCritical: 'মারাত্মক ঝুঁকিপূর্ণ',
    riskHigh: 'উচ্চ ঝুঁকি',
    riskModerate: 'মাঝারি ঝুঁকি',
    riskLow: 'কম ঝুঁকি',
    riskSafe: 'নিরাপদ',

    telemetryTitle: 'রিয়েল-টাইম সেন্সর টেলিমেট্রি',
    liveTelemetryDesc: 'কলকাতা ও পার্শ্ববর্তী অঞ্চলের সরাসরি আইওটি সেন্সর ডেটা স্ট্রিম',
    rainfallMetric: 'বৃষ্টিপাতের মাত্রা',
    waterLevelMetric: 'হুগলি নদীর জলস্তর',
    windSpeedMetric: 'বায়ুর বেগ',
    flashFloodIndexMetric: 'আকস্মিক বন্যা সূচক',
    soilSaturationMetric: 'মাটির আর্দ্রতা',
    damStorageMetric: 'বাঁধের জলপ্রবাহ',
    lightningMetric: 'বজ্রপাত (১৫ মিনিটে)',
    slopePoreMetric: 'মাটির ছিদ্রস্থ জলচাপ',

    safeEvacuationNav: 'নিরাপদ স্থানান্তর রুট',
    liveGuidance: 'লাইভ গাইডেন্স',
    dynamicPathingDesc: 'জলমগ্ন ও বন্ধ রাস্তা পরিহার করে রিয়েল-টাইম নিরাপদ রুট নির্ধারণ',
    broadcastSos: 'জরুরি এসওএস পাঠান',
    sosTransmitting: 'পাঠানো হচ্ছে...',
    sosSuccessMessage: 'জরুরি এসওএস পাঠানো হয়েছে! নিকটস্থ এনডিআরএফ এবং ১০৮ অ্যাম্বুলেন্সকে জানানো হয়েছে।',
    yourLocation: 'বর্তমান অবস্থান',
    destinationSafeZone: 'নিরাপদ আশ্রয় কেন্দ্র',
    changeLocation: 'অবস্থান পরিবর্তন',
    changeSafeShelter: 'আশ্রয় কেন্দ্র পরিবর্তন',
    aiRecommendedShelter: 'এআই প্রস্তাবিত (নিকটতম নিরাপদ আশ্রয়)',
    selectShelterHelp: 'ক্ষতিগ্রস্ত প্লাবিত এলাকা এড়িয়ে সবচেয়ে নিরাপদ ও সংক্ষিপ্ত পথ পেতে যে কোনো আশ্রয় কেন্দ্র বা হাসপাতাল নির্বাচন করুন।',
    revertToAiShelter: 'পুনরায় এআই নিকটতম আশ্রয়ে ফিরুন',
    customShelterActive: 'পছন্দসই নিরাপদ আশ্রয় সক্রিয়',
    relocateJunction: 'আমার প্রাথমিক মোড় পরিবর্তন করুন',
    selectJunctionHelp: 'জিপিএস শুরুর স্থান পুনরায় নির্ধারণ করতে যেকোনো মোড় বেছে নিন',
    distanceKm: 'দূরত্ব',
    etaMinutes: 'আনুমানিক সময়',
    routeSafetyScore: 'নিরাপত্তা সূচক',
    startLiveEvacuation: 'লাইভ স্থানান্তর গাইডেন্স শুরু করুন',
    computingRoute: 'সর্বোত্তম নিরাপদ পথ গণনা করা হচ্ছে...',
    recenterMap: 'মানচিত্র পুনরায় কেন্দ্র করুন',
    exitLiveGuidance: 'লাইভ নেভিগেশন বন্ধ করুন',
    driveMode: 'গাড়ি',
    walkMode: 'হাঁটা',
    voiceNavigation: 'ভয়েস নির্দেশিকা',
    reportRoadBlocked: 'সামনে রাস্তা বন্ধ রিপোর্ট করুন',
    dangerAheadRerouting: 'সামনে বিপদ - বিকল্প নিরাপদ পথ নির্বাচন',
    routingAvoidsFlooded: 'বন্যা এলাকা এড়িয়ে উঁচু রাস্তা দিয়ে রুট পুনরায় নির্ধারিত করা হয়েছে।',

    emergencyCommandTitle: 'জরুরি কমান্ড ও উদ্ধার নিয়ন্ত্রণ',
    tabDispatchQueue: 'প্রেরণ তালিকা',
    tabFleetUnits: 'উদ্ধারকারী বহর',
    tabRoadNetwork: 'রাস্তা ও অবরোধ',
    tabAiCommand: 'এআই পরিস্থিতি ব্রিফিং',
    activeIncidents: 'সক্রিয় ঘটনা',
    autoTransmitting: 'স্বয়ংক্রিয় জিপিএস পাঠানো হচ্ছে',
    dispatchUnit: 'ইউনিট পাঠান',
    unitFleetStatus: 'উদ্ধারকারী দলের অবস্থা',
    blockedCorridors: 'সড়ক নেটওয়ার্কের অবস্থা',
    clearAllRoadblocks: 'সব অবরোধ মুক্ত করুন',
    aiIncidentCommander: 'এআই ইনসিডেন্ট কমান্ডার ব্রিফিং',
    generateTacticalPlan: 'কৌশলগত পরিকল্পনা তৈরি করুন',
    synthesizingPlan: 'পরিকল্পনা তৈরি হচ্ছে...',
    askSituationalQueryPlaceholder: 'কৌশলগত প্রশ্ন জিজ্ঞাসা করুন (যেমন: বিশ্ব বাংলা সরণি দিয়ে ট্র্যাফিক পাঠানো কি নিরাপদ?)...',
    askAiButton: 'এআই কমান্ডে জিজ্ঞাসা করুন',

    layerRagZones: 'ঝুঁকি অঞ্চল (RAG)',
    layerRoads: 'সড়ক',
    layerRescueUnits: 'উদ্ধারকারী দল',
    layerDams: 'বাঁধ / ব্যারেজ',
    layerLightning: 'বজ্রপাত পর্যবেক্ষণ',
    layerLandslides: 'ভূমিধস স্টেশন',
    focusRoute: 'রুটে ফোকাস করুন',
    legendRed: 'লাল (তাত্ক্ষণিক স্থানান্তর)',
    legendYellow: 'হলুদ (সতর্ক থাকুন)',
    legendGreen: 'সবুজ (নিরাপদ আশ্রয় কেন্দ্র)',
    legendBlockedRoad: 'বন্ধ রাস্তা',
    legendCitizenStart: 'নাগরিক অবস্থান',

    lightningAlertTitle: 'তীব্র বজ্রপাত ও কালবৈশাখীর সতর্কতা',
    landslideAlertTitle: 'ভূমিধস ও ঢাল অস্থিতিশীলতার আগাম সতর্কতা',
    damRuptureTitle: 'বাঁধ বা ব্যারেজ প্লাবন ও জল নিঃসরণ সতর্কতা',
    immediateEvacuation: 'অবিলম্বে নিরাপদ আশ্রয়ে যান',
    stayAlert: 'সতর্ক থাকুন',
    safeHaven: 'নিরাপদ আশ্রয় কেন্দ্র প্রস্তুত',
    cancel: 'বাতিল',
    confirm: 'নিশ্চিত করুন',

    // Offline & Resilience
    offlineMode: 'অফলাইন মোড',
    offlineResilient: 'অফলাইন রেজিলিয়েন্স সক্রিয়',
    offlineDesc: 'স্থানীয় রোড গ্রাফ, নিরাপদ আশ্রয় রুট ও ২জি এসএমএস সংকেত সংরক্ষিত',
    offlineSmsBeacon: '২জি এসএমএস জরুরি সংকেত',
    installApp: 'অ্যাপ ইনস্টল করুন',
    simulateOffline: 'অফলাইন পরীক্ষা করুন',
    onlineLive: 'সরাসরি সংযুক্ত',
    smsDistressTitle: 'অফলাইন স্বল্প-ব্যান্ডউইথ ২জি এসএমএস জরুরি সংকেত',
    sendSms112: '১১২-তে ২জি এসএমএস পাঠান (জাতীয় জরুরি)',
    sendSms108: '১০৮-এ ২জি এসএমএস পাঠান (অ্যাম্বুলেন্স)',
    copiedSms: 'জরুরি বার্তা কপি করা হয়েছে!',
    nearestHospital: 'নিকটতম ট্রমা হাসপাতাল',
    nearestShelter: 'নিকটতম নিরাপদ আশ্রয় কেন্দ্র',
    locationEmergencyContacts: 'অবস্থানভিত্তিক জরুরি হেল্পলাইন (আপনার সবচেয়ে কাছে)',
    callNow: 'সরাসরি কল',
    sendSmsToFacility: 'আশ্রয়/হাসপাতালে ২জি এসএমএস পাঠান',
    allNearbyFacilities: 'কাছের সব হাসপাতাল ও ত্রাণ কেন্দ্র (দূরত্ব অনুযায়ী)',
    casualtyTraumaDesk: 'জরুরি ক্যাজুয়াল্টি ডেস্ক',
    reliefCampDesk: 'ত্রাণ শিবির কন্ট্রোল ডেস্ক',

    // Emergency Medical Help & Govt Doctors
    emergencyMedicalTitle: 'জরুরি চিকিৎসা সহায়তা ও সরকারি ডাক্তার পরিষেবা',
    emergencyMedicalDesc: 'দুর্যোগের সময়ে কর্মরত সরকারি চিকিৎসকদের সাথে সরাসরি যোগাযোগ করুন বা উদ্ধারকারী মেডিকেল টিম (QMRT) ডাকুন।',
    govtDoctorsTab: 'কর্মরত সরকারি ডাক্তার',
    rescueTeamTab: 'উদ্ধারকারী মেডিকেল দল প্রেরণ',
    firstAidTab: 'দুর্যোগকালীন প্রাথমিক চিকিৎসা গাইড',
    availableNowBadge: 'বর্তমানে দায়িত্বে উপস্থিত (জরুরি ডিউটি)',
    callDoctor: 'ডাক্তারকে সরাসরি কল করুন',
    smsDoctor: 'ডাক্তারকে ২জি এসএমএস পাঠান',
    dispatchRescueTeam: 'আমার জিপিএস-এ উদ্ধারকারী মেডিকেল টিম পাঠান',
    rescueEnRoute: 'মেডিকেল রেসকিউ টিম রওনা হয়েছে',
    rescueTeamHelpText: 'আপনি বা আশেপাশে কেউ আহত হলে বা জরুরি চিকিৎসা প্রয়োজন হলে আমাদের রেসকিউ টিম স্পিডবোট বা অ্যাম্বুলেন্সে প্যারামেডিক ও লাইফ-সাপোর্ট সরঞ্জাম নিয়ে পৌঁছাবে।',
    medicalUrgency: 'চিকিৎসার জরুরি অবস্থা বিভাগ',
    waterDepthLabel: 'ঘটনাস্থলে জলের গভীরতা',
    requestMedicalRescueBtn: 'জরুরি মেডিকেল রেসকিউ প্রেরণ অনুরোধ করুন',
  },

  hi: {
    appSubtitle: 'रीयल-टाइम एआई आपदा पूर्व चेतावनी और सुरक्षित निकासी मार्ग',
    mlInferenceActive: 'एमएल इंफरेंस सक्रिय',
    scenarioLabel: 'परिदृश्य:',
    streamOn: 'लाइव स्ट्रीम चालू',
    streamPaused: 'स्ट्रीम रुकी हुई',
    streamTooltipOn: 'रीयल-टाइम टेलीमेट्री रोकें',
    streamTooltipOff: 'लाइव सेंसर डेटा अनुकरण शुरू करें',
    sirenMute: 'सायरन म्यूट करें',
    sirenEnable: 'अलर्ट सायरन चालू करें',
    pythonMlTooltip: 'पायथन / फास्टएपीआई एमएल पाइपलाइन देखें',
    liveClockLabel: 'लाइव IST',

    citizenView: 'नागरिक दृश्य',
    emergencyView: 'आपातकालीन कमांड',
    authRequired: 'अनुमति आवश्यक',
    clearanceLevel: 'निकासी स्तर',
    lockConsole: 'कंसोल लॉक करें',

    riskCritical: 'गंभीर खतरा',
    riskHigh: 'उच्च जोखिम',
    riskModerate: 'मध्यम जोखिम',
    riskLow: 'कम जोखिम',
    riskSafe: 'सुरक्षित',

    telemetryTitle: 'रीयल-टाइम सेंसर टेलीमेट्री',
    liveTelemetryDesc: 'कोलकाता महानगरीय बेसिन की लाइव आईओटी टेलीमेट्री स्ट्रीम',
    rainfallMetric: 'वर्षा दर',
    waterLevelMetric: 'हुगली नदी का जलस्तर',
    windSpeedMetric: 'हवा की गति',
    flashFloodIndexMetric: 'अचानक बाढ़ सूचकांक',
    soilSaturationMetric: 'मृदा संतृप्ति',
    damStorageMetric: 'बांध अंतर्वाह / उछाल',
    lightningMetric: 'वज्रपात (१५ मिनट में)',
    slopePoreMetric: 'ढलान छिद्र जल दबाव',

    safeEvacuationNav: 'सुरक्षित निकासी मार्ग',
    liveGuidance: 'लाइव मार्गदर्शन',
    dynamicPathingDesc: 'अवरुद्ध सड़कों और जलमग्न क्षेत्रों से बचते हुए गतिशील सुरक्षित मार्ग',
    broadcastSos: 'आपातकालीन एसओएस भेजें',
    sosTransmitting: 'भेजा जा रहा है...',
    sosSuccessMessage: 'आपातकालीन एसओएस प्रसारित! निकटतम एनडीआरएफ और 108 एम्बुलेंस को सूचित किया गया।',
    yourLocation: 'वर्तमान स्थान',
    destinationSafeZone: 'सुरक्षित शरण स्थल',
    changeLocation: 'स्थान बदलें',
    changeSafeShelter: 'सुरक्षित आश्रय बदलें',
    aiRecommendedShelter: 'एआई अनुशंसित (निकटतम सुरक्षित आश्रय)',
    selectShelterHelp: 'बाढ़ क्षेत्रों से बचते हुए सबसे सुरक्षित और छोटा रास्ता खोजने के लिए कोई भी आश्रय या अस्पताल चुनें।',
    revertToAiShelter: 'पुनः एआई निकटतम आश्रय पर रीसेट करें',
    customShelterActive: 'पसंदीदा सुरक्षित आश्रय सक्रिय',
    relocateJunction: 'मेरा शुरुआती जंक्शन बदलें',
    selectJunctionHelp: 'जीपीएस प्रस्थान बिंदु स्थानांतरित करने के लिए कोई जंक्शन चुनें',
    distanceKm: 'दूरी',
    etaMinutes: 'अनुमानित समय',
    routeSafetyScore: 'सुरक्षा सूचकांक',
    startLiveEvacuation: 'लाइव निकासी मार्गदर्शन शुरू करें',
    computingRoute: 'इष्टतम सुरक्षित मार्ग की गणना की जा रही है...',
    recenterMap: 'नक्शा पुनः केंद्रित करें',
    exitLiveGuidance: 'लाइव नेविगेशन से बाहर निकलें',
    driveMode: 'गाड़ी',
    walkMode: 'पैदल',
    voiceNavigation: 'आवाज मार्गदर्शन',
    reportRoadBlocked: 'आगे सड़क बंद होने की सूचना दें',
    dangerAheadRerouting: 'आगे खतरा - नया सुरक्षित मार्ग चुना जा रहा है',
    routingAvoidsFlooded: 'बाढ़ वाले क्षेत्र से बचने के लिए ऊंचाई वाले मार्ग से पुनः रूट किया गया।',

    emergencyCommandTitle: 'आपातकालीन कमांड और प्रेषण',
    tabDispatchQueue: 'प्रेषण कतार',
    tabFleetUnits: 'राहत दल वाहन',
    tabRoadNetwork: 'सड़कें और अवरोध',
    tabAiCommand: 'एआई घटना समीक्षा',
    activeIncidents: 'सक्रिय घटनाएं',
    autoTransmitting: 'जीपीएस स्वचालित भेजा जा रहा है',
    dispatchUnit: 'इकाई रवाना करें',
    unitFleetStatus: 'राहत दल की स्थिति',
    blockedCorridors: 'सड़क नेटवर्क की स्थिति',
    clearAllRoadblocks: 'सभी अवरोध हटाएं',
    aiIncidentCommander: 'एआई इंसीडेंट कमांडर ब्रीफिंग',
    generateTacticalPlan: 'रणनीतिक योजना बनाएं',
    synthesizingPlan: 'योजना तैयार हो रही है...',
    askSituationalQueryPlaceholder: 'परिस्थिति संबंधित प्रश्न पूछें (उदा: क्या विश्व बांग्ला सरणी से अस्पताल यातायात मोड़ना सुरक्षित है?)...',
    askAiButton: 'एआई कमांड से पूछें',

    layerRagZones: 'आरएजी क्षेत्र',
    layerRoads: 'सड़कें',
    layerRescueUnits: 'बचाव दल',
    layerDams: 'बांध / बैराज',
    layerLightning: 'वज्रपात चेतावनी',
    layerLandslides: 'भूस्खलन केंद्र',
    focusRoute: 'मार्ग पर ध्यान केंद्रित करें',
    legendRed: 'लाल (तत्काल निकासी आवश्यक)',
    legendYellow: 'पीला (सावधान रहें / चेतावनी)',
    legendGreen: 'हरा (सुरक्षित निकासी क्षेत्र)',
    legendBlockedRoad: 'अवरुद्ध सड़क',
    legendCitizenStart: 'नागरिक मूल स्थान',

    lightningAlertTitle: 'गंभीर वज्रपात और आंधी की चेतावनी',
    landslideAlertTitle: 'ढलान अस्थिरता और भूस्खलन पूर्व चेतावनी',
    damRuptureTitle: 'बांध / बैराज दरार और अतिरिक्त जल रिहाई चेतावनी',
    immediateEvacuation: 'तत्काल सुरक्षित स्थान पर जाएं',
    stayAlert: 'सावधान रहें',
    safeHaven: 'सुरक्षित आश्रय उपलब्ध',
    cancel: 'रद्द करें',
    confirm: 'पुष्टि करें',

    // Offline & Resilience
    offlineMode: 'ऑफ़लाइन मोड',
    offlineResilient: 'ऑफ़लाइन लचीलापन सक्रिय',
    offlineDesc: 'स्थानीय सड़क नेटवर्क, सुरक्षित आश्रय रूट और 2G एसएमएस बीकन कैश्ड हैं',
    offlineSmsBeacon: '2G एसएमएस आपातकालीन बीकन',
    installApp: 'ऐप इंस्टॉल करें',
    simulateOffline: 'ऑफ़लाइन अनुकरण करें',
    onlineLive: 'लाइव कनेक्टेड',
    smsDistressTitle: 'ऑफ़लाइन कम-बैंडविड्थ 2G एसएमएस आपातकालीन बीकन',
    sendSms112: '112 पर 2G एसएमएस भेजें (राष्ट्रीय आपातकाल)',
    sendSms108: '108 पर 2G एसएमएस भेजें (एम्बुलेंस)',
    copiedSms: 'आपातकालीन पेलोड कॉपी किया गया!',
    nearestHospital: 'निकटतम ट्रॉमा अस्पताल',
    nearestShelter: 'निकटतम सुरक्षित निकासी आश्रय',
    locationEmergencyContacts: 'स्थान-आधारित आपातकालीन हेल्पलाइन (आपके निकटतम)',
    callNow: 'सीधा कॉल करें',
    sendSmsToFacility: 'सुविधा केंद्र को 2G एसएमएस भेजें',
    allNearbyFacilities: 'सभी निकटतम अस्पताल और राहत केंद्र (दूरी के अनुसार)',
    casualtyTraumaDesk: 'आपातकालीन कैजुअल्टी डेस्क',
    reliefCampDesk: 'राहत शिविर नियंत्रण डेस्क',

    // Emergency Medical Help & Govt Doctors
    emergencyMedicalTitle: 'आपातकालीन चिकित्सा सहायता और सरकारी डॉक्टर सेवा',
    emergencyMedicalDesc: 'ड्यूटी पर मौजूद सरकारी डॉक्टरों से तुरंत संपर्क करें या अपने स्थान पर त्वरित चिकित्सा बचाव दल (QMRT) बुलाएं।',
    govtDoctorsTab: 'ड्यूटी पर सरकारी डॉक्टर',
    rescueTeamTab: 'बचाव दल चिकित्सा प्रेषण',
    firstAidTab: 'आपदा प्राथमिक चिकित्सा गाइड',
    availableNowBadge: 'उपलब्ध हैं (सक्रिय आपदा ड्यूटी)',
    callDoctor: 'डॉक्टर को सीधा कॉल करें',
    smsDoctor: 'डॉक्टर को 2G एसएमएस भेजें',
    dispatchRescueTeam: 'मेरे जीपीएस पर मेडिकल रेस्क्यू टीम भेजें',
    rescueEnRoute: 'मेडिकल बचाव दल रवाना हो गया है',
    rescueTeamHelpText: 'यदि आप या आसपास कोई घायल है या गंभीर स्थिति में है, तो हमारी त्वरित बचाव टीम वॉटर एम्बुलेंस बोट या वाहन द्वारा पैरामेडिक्स और जीवन-रक्षक किट के साथ पहुंचेगी।',
    medicalUrgency: 'चिकित्सा आपातकालीन श्रेणी',
    waterDepthLabel: 'स्थान पर जलभराव की गहराई',
    requestMedicalRescueBtn: 'त्वरित चिकित्सा बचाव दल का अनुरोध करें',
  },
};

/**
 * Get translation for a key and language with fallback to English
 */
export function getTranslation<K extends keyof Translations>(key: K, lang: Language = 'en'): string {
  const dictionary = TRANSLATIONS[lang] || TRANSLATIONS.en;
  return dictionary[key] || TRANSLATIONS.en[key] || String(key);
}

/**
 * Format Indian Standard Time (IST) timestamp cleanly
 */
export function formatISTTimestamp(date: Date = new Date(), lang: Language = 'en'): {
  timeStr: string;
  dateStr: string;
  fullStr: string;
} {
  try {
    // Format in Asia/Kolkata timezone
    const timeFormatter = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    const dateFormatter = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    const timeStr = timeFormatter.format(date);
    const dateStr = dateFormatter.format(date);

    return {
      timeStr,
      dateStr,
      fullStr: `${dateStr} • ${timeStr} IST`,
    };
  } catch {
    // Fallback if Intl fails
    const timeStr = date.toTimeString().split(' ')[0];
    const dateStr = date.toDateString();
    return {
      timeStr,
      dateStr,
      fullStr: `${dateStr} • ${timeStr} IST`,
    };
  }
}
