import React, { useState, useMemo } from 'react';
import {
  HeartPulse,
  Phone,
  PhoneCall,
  Radio,
  X,
  MapPin,
  Clock,
  ShieldCheck,
  Send,
  AlertTriangle,
  UserCheck,
  CheckCircle2,
  LifeBuoy,
  Stethoscope,
  Activity,
  Flame,
  Droplets,
  Search,
  Filter,
  Navigation,
  Check,
  Copy,
  Zap,
} from 'lucide-react';
import { GovtOnDutyDoctor, MedicalRescueRequest, RoadNode } from '../types';
import { GOVT_ON_DUTY_DOCTORS } from '../data/mockDisasterData';
import { useLanguage } from '../context/LanguageContext';
import { formatISTTimestamp } from '../i18n/translations';
import { getGeoDistanceKm } from '../utils/geoRouting';

interface EmergencyMedicalHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocationNode?: RoadNode | null;
  coordinates?: { lat: number; lng: number };
  activeRescueRequest?: MedicalRescueRequest | null;
  onRequestRescue?: (request: MedicalRescueRequest) => void;
  onResolveRescue?: (requestId: string) => void;
  onCancelRescue?: (requestId: string) => void;
}

type TabType = 'GOVT_DOCTORS' | 'RESCUE_TEAM' | 'FIRST_AID';

export const EmergencyMedicalHelpModal: React.FC<EmergencyMedicalHelpModalProps> = ({
  isOpen,
  onClose,
  currentLocationNode,
  coordinates,
  activeRescueRequest,
  onRequestRescue,
  onResolveRescue,
  onCancelRescue,
}) => {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabType>('GOVT_DOCTORS');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('ALL');
  const [doctorSearchQuery, setDoctorSearchQuery] = useState<string>('');
  const [copiedDocId, setCopiedDocId] = useState<string | null>(null);

  // Rescue request form state
  const [patientCount, setPatientCount] = useState<number>(1);
  const [selectedCategory, setSelectedCategory] =
    useState<MedicalRescueRequest['emergencyCategory']>('CRITICAL_TRAUMA');
  const [waterDepth, setWaterDepth] =
    useState<MedicalRescueRequest['waterDepth']>('WAIST_DEEP');
  const [preferredModality, setPreferredModality] =
    useState<MedicalRescueRequest['preferredModality']>('WATER_AMBULANCE_BOAT');
  const [citizenContact, setCitizenContact] = useState<string>('+91 98300-11200');
  const [landmarkNotes, setLandmarkNotes] = useState<string>('');
  const [isSubmittingRescue, setIsSubmittingRescue] = useState<boolean>(false);
  const [rescueSuccessMessage, setRescueSuccessMessage] = useState<string | null>(null);

  // Selected First Aid protocol expansion
  const [expandedProtocol, setExpandedProtocol] = useState<string>('bleeding');

  // Compute citizen coordinates
  const currentCoords: [number, number] = useMemo(() => {
    if (coordinates?.lat && coordinates?.lng) {
      return [coordinates.lat, coordinates.lng];
    }
    if (currentLocationNode?.coordinates) {
      return currentLocationNode.coordinates;
    }
    return [22.6050, 88.4250]; // Baguiati VIP flood basin default
  }, [coordinates, currentLocationNode]);

  const locationLabel = currentLocationNode?.name || 'Current GPS Location';
  const istTime = formatISTTimestamp(new Date(), language).timeStr;

  // Format distance in meters or km
  const formatDistance = (km: number) => {
    if (km < 1) {
      return `${Math.round(km * 1000)} m`;
    }
    return `${km.toFixed(1)} km`;
  };

  // Compute doctors ranked by real-time distance from user
  const rankedDoctors = useMemo(() => {
    const list = GOVT_ON_DUTY_DOCTORS.map((doc) => {
      const dist = getGeoDistanceKm(currentCoords, doc.coordinates);
      return {
        ...doc,
        distanceKm: dist,
        distanceFormatted: formatDistance(dist),
      };
    });

    list.sort((a, b) => a.distanceKm - b.distanceKm);
    return list;
  }, [currentCoords]);

  // Filter doctors by specialty and search query
  const filteredDoctors = useMemo(() => {
    return rankedDoctors.filter((doc) => {
      const matchesSpecialty =
        selectedSpecialty === 'ALL' || doc.specialtyKey === selectedSpecialty;
      const q = doctorSearchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        doc.name.toLowerCase().includes(q) ||
        doc.specialization.toLowerCase().includes(q) ||
        doc.hospitalName.toLowerCase().includes(q) ||
        doc.designation.toLowerCase().includes(q);
      return matchesSpecialty && matchesQuery;
    });
  }, [rankedDoctors, selectedSpecialty, doctorSearchQuery]);

  if (!isOpen) return null;

  // Handle copy doctor phone
  const handleCopyPhone = (docId: string, phone: string) => {
    navigator.clipboard?.writeText(phone);
    setCopiedDocId(docId);
    setTimeout(() => setCopiedDocId(null), 2500);
  };

  // Generate 2G SMS body for doctor
  const generateDoctorSms = (doc: GovtOnDutyDoctor) => {
    const latStr = currentCoords[0].toFixed(4);
    const lngStr = currentCoords[1].toFixed(4);
    const text = `URGENT MEDICAL HELP: Patient at [${latStr},${lngStr}] (${locationLabel}) needs immediate triage from ${doc.name}. Ph:${citizenContact}. ShiftTime:${istTime}`;
    return `sms:${doc.emergencyHelpline || doc.directPhone}?body=${encodeURIComponent(text)}`;
  };

  // Submit Rescue Request
  const handleSubmitRescue = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingRescue(true);

    const newRequest: MedicalRescueRequest = {
      id: `rescue-${Date.now()}`,
      contactNumber: citizenContact,
      coordinates: currentCoords,
      locationName: locationLabel,
      patientCount,
      emergencyCategory: selectedCategory,
      waterDepth,
      notes: landmarkNotes.trim() || 'Urgent medical assistance required at location.',
      preferredModality,
      requestedAt: istTime,
      status: 'DISPATCHED',
      assignedUnitName:
        preferredModality === 'WATER_AMBULANCE_BOAT'
          ? 'QMRT Unit-04: High-Buoyancy Rapid Medical Boat'
          : preferredModality === 'ALS_ROAD_AMBULANCE'
          ? 'WB-108 Advanced Life Support (ALS) Trauma Ambulance #12'
          : 'NDRF Amphibious All-Terrain Medical Extraction Carrier',
      assignedUnitId:
        preferredModality === 'WATER_AMBULANCE_BOAT' ? 'unit-boat-1' : 'unit-amb-1',
      etaMinutes: preferredModality === 'WATER_AMBULANCE_BOAT' ? 7 : 11,
      leadParamedicName: 'SI Paramedic A. Roy & Dr. P. Dey',
      rescueContactPhone: '+91-98301-10800',
    };

    setTimeout(() => {
      if (onRequestRescue) {
        onRequestRescue(newRequest);
      }
      setIsSubmittingRescue(false);
      setRescueSuccessMessage(
        `Rescue Medical Team Dispatched! ${newRequest.assignedUnitName} is en route. ETA: ~${newRequest.etaMinutes} mins.`
      );
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 animate-fade-in overflow-y-auto">
      <div className="bg-[#0b0f17] border border-red-800/80 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-950/80 via-slate-900 to-red-950/80 p-4 border-b border-red-900/60 flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="p-2.5 rounded-xl bg-red-600/20 border border-red-500/50 text-red-400 shrink-0 mt-0.5 shadow-inner">
              <HeartPulse className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide flex items-center gap-2">
                  {t('emergencyMedicalTitle')}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-red-500/20 text-red-300 border border-red-500/40 uppercase font-semibold">
                  24/7 Red Alert
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                {t('emergencyMedicalDesc')}
              </p>
              <div className="flex items-center space-x-3 mt-2 text-[11px] text-slate-400 font-mono">
                <span className="flex items-center gap-1 text-amber-300">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  {locationLabel} [{currentCoords[0].toFixed(3)}, {currentCoords[1].toFixed(3)}]
                </span>
                <span className="text-slate-500">•</span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <Clock className="w-3.5 h-3.5" />
                  {istTime} IST
                </span>
              </div>
            </div>
          </div>
          <button
            id="btn-close-medical-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-slate-800 bg-slate-950/60 px-4 pt-2 gap-2 overflow-x-auto shrink-0">
          <button
            id="tab-btn-doctors"
            onClick={() => setActiveTab('GOVT_DOCTORS')}
            className={`flex items-center space-x-2 px-3.5 py-2.5 text-xs font-semibold rounded-t-lg transition border-b-2 whitespace-nowrap ${
              activeTab === 'GOVT_DOCTORS'
                ? 'text-cyan-300 border-cyan-400 bg-cyan-950/30'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <Stethoscope className="w-4 h-4 text-cyan-400" />
            <span>{t('govtDoctorsTab')}</span>
            <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] bg-emerald-900/60 text-emerald-300 border border-emerald-700/50">
              {GOVT_ON_DUTY_DOCTORS.length} Available
            </span>
          </button>

          <button
            id="tab-btn-rescue-team"
            onClick={() => setActiveTab('RESCUE_TEAM')}
            className={`flex items-center space-x-2 px-3.5 py-2.5 text-xs font-semibold rounded-t-lg transition border-b-2 whitespace-nowrap ${
              activeTab === 'RESCUE_TEAM'
                ? 'text-red-400 border-red-500 bg-red-950/30'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <LifeBuoy className="w-4 h-4 text-red-400" />
            <span>{t('rescueTeamTab')}</span>
            {activeRescueRequest && activeRescueRequest.status !== 'RESOLVED' && (
              <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] bg-red-600 text-white font-bold animate-pulse">
                Active Mission
              </span>
            )}
          </button>

          <button
            id="tab-btn-first-aid"
            onClick={() => setActiveTab('FIRST_AID')}
            className={`flex items-center space-x-2 px-3.5 py-2.5 text-xs font-semibold rounded-t-lg transition border-b-2 whitespace-nowrap ${
              activeTab === 'FIRST_AID'
                ? 'text-amber-300 border-amber-400 bg-amber-950/30'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <Activity className="w-4 h-4 text-amber-400" />
            <span>{t('firstAidTab')}</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* ================= TAB 1: GOVT DOCTORS ON DUTY ================= */}
          {activeTab === 'GOVT_DOCTORS' && (
            <div className="space-y-4">
              {/* Info banner */}
              <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center space-x-2 text-cyan-200">
                  <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>
                    Government doctors listed below are physically present or on emergency casualty shift at Swasthya Bhawan disaster medical hubs. Distance is calculated live from your GPS.
                  </span>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 font-mono text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    Live Roster Verified
                  </span>
                </div>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search doctor name, hospital, trauma specialization..."
                    value={doctorSearchQuery}
                    onChange={(e) => setDoctorSearchQuery(e.target.value)}
                    className="w-full bg-slate-900 text-slate-100 pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-800 focus:outline-none focus:border-cyan-500 placeholder-slate-500"
                  />
                  {doctorSearchQuery && (
                    <button
                      onClick={() => setDoctorSearchQuery('')}
                      className="absolute right-2.5 top-2 text-slate-500 hover:text-white text-xs font-mono"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Specialty Filter Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-[11px]">
                  {[
                    { key: 'ALL', label: 'All Specialties' },
                    { key: 'TRAUMA', label: '🚨 Trauma & Triage' },
                    { key: 'SNAKEBITE', label: '🐍 Snakebite / ASV' },
                    { key: 'ORTHO', label: '🦴 Orthopedic & Fractures' },
                    { key: 'PEDIATRICS', label: '👶 Pediatrics' },
                    { key: 'SURGERY', label: '🔥 Burns & Surgery' },
                  ].map((chip) => (
                    <button
                      key={chip.key}
                      onClick={() => setSelectedSpecialty(chip.key)}
                      className={`px-2.5 py-1 rounded-md font-medium transition whitespace-nowrap border ${
                        selectedSpecialty === chip.key
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/80 font-bold'
                          : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Doctors List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredDoctors.map((doc, idx) => (
                  <div
                    key={doc.id}
                    className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-cyan-700/60 transition flex flex-col justify-between space-y-3 relative group shadow-sm"
                  >
                    {/* Top row: Name & Live Status */}
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition">
                              {doc.name}
                            </h3>
                            {idx === 0 && selectedSpecialty === 'ALL' && !doctorSearchQuery && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-700 uppercase font-semibold">
                                Closest
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-cyan-400 font-mono mt-0.5">
                            {doc.qualification}
                          </p>
                        </div>

                        {/* Distance Badge */}
                        <div className="flex flex-col items-end shrink-0">
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-700/70 flex items-center gap-1">
                            <Navigation className="w-3 h-3 text-cyan-400" />
                            {doc.distanceFormatted}
                          </span>
                        </div>
                      </div>

                      {/* Designation and Posting Hospital */}
                      <div className="mt-2 space-y-1 text-xs">
                        <div className="text-slate-300 font-medium flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0"></span>
                          <span>{doc.designation}</span>
                        </div>
                        <div className="text-slate-400 text-[11px] flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-red-400 shrink-0" />
                          <span>{doc.hospitalName}</span>
                        </div>
                      </div>

                      {/* Specialization & Bio */}
                      <div className="mt-2.5 p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 text-[11px] space-y-1">
                        <div className="text-amber-300 font-semibold flex items-center gap-1">
                          <Stethoscope className="w-3 h-3 text-amber-400 shrink-0" />
                          <span>Specialization: {doc.specialization}</span>
                        </div>
                        <p className="text-slate-400 leading-snug">
                          {doc.bio}
                        </p>
                      </div>

                      {/* Shift & Languages */}
                      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span className="flex items-center gap-1 text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          {doc.shiftTime}
                        </span>
                        <span className="text-slate-500">
                          Lang: {doc.languages.join(', ')}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2">
                      <a
                        href={`tel:${doc.directPhone}`}
                        className="flex items-center justify-center space-x-1.5 py-2 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>{t('callDoctor')}</span>
                      </a>

                      <a
                        href={generateDoctorSms(doc)}
                        className="flex items-center justify-center space-x-1.5 py-2 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white text-xs font-semibold transition border border-slate-700"
                        title="Send 2G SMS with your GPS coordinates and condition"
                      >
                        <Send className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{t('smsDoctor')}</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              {filteredDoctors.length === 0 && (
                <div className="p-8 text-center rounded-xl bg-slate-900/30 border border-slate-800 text-slate-400 text-xs">
                  No government doctors found matching your query. Switch filter to "All Specialties".
                </div>
              )}
            </div>
          )}

          {/* ================= TAB 2: RESCUE TEAM MEDICAL DISPATCH ================= */}
          {activeTab === 'RESCUE_TEAM' && (
            <div className="space-y-4">
              {/* Success notification */}
              {rescueSuccessMessage && (
                <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-700 text-emerald-200 text-xs flex items-center justify-between animate-fade-in shadow-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>{rescueSuccessMessage}</span>
                  </div>
                  <button
                    onClick={() => setRescueSuccessMessage(null)}
                    className="text-slate-400 hover:text-white font-mono ml-2 text-xs"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Active Mission Card (if one already exists) */}
              {activeRescueRequest && activeRescueRequest.status !== 'RESOLVED' && (
                <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-br from-red-950/60 to-slate-900 border-2 border-red-600/80 shadow-xl space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 rounded-lg bg-red-600 text-white animate-pulse">
                        <LifeBuoy className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                            {t('rescueEnRoute')}
                          </h3>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-red-600 text-white font-bold animate-pulse">
                            CODE RED RESCUE
                          </span>
                        </div>
                        <p className="text-xs text-red-200 font-mono mt-0.5">
                          Mission ID: #{activeRescueRequest.id.toUpperCase()} • Requested at {activeRescueRequest.requestedAt}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-2xl font-black text-amber-400 font-mono">
                        ~{activeRescueRequest.etaMinutes}m
                      </span>
                      <span className="block text-[10px] text-slate-400 uppercase font-mono">
                        Estimated ETA
                      </span>
                    </div>
                  </div>

                  {/* Dispatch details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono block">
                        Assigned Rescue Unit:
                      </span>
                      <span className="text-white font-bold">
                        {activeRescueRequest.assignedUnitName}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono block">
                        Medical Personnel On Board:
                      </span>
                      <span className="text-emerald-300 font-semibold">
                        {activeRescueRequest.leadParamedicName}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono block">
                        Target Rendezvous:
                      </span>
                      <span className="text-slate-200">
                        {activeRescueRequest.locationName} [{activeRescueRequest.coordinates[0].toFixed(4)}, {activeRescueRequest.coordinates[1].toFixed(4)}]
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono block">
                        Emergency Triage Profile:
                      </span>
                      <span className="text-amber-300 font-semibold">
                        {activeRescueRequest.emergencyCategory.replace(/_/g, ' ')} ({activeRescueRequest.patientCount} Patient{activeRescueRequest.patientCount > 1 ? 's' : ''})
                      </span>
                    </div>
                  </div>

                  {/* Operational Notes */}
                  {activeRescueRequest.notes && (
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
                      <span className="text-[10px] text-slate-500 font-mono uppercase block mb-0.5">
                        Access Notes & Patient Situation:
                      </span>
                      "{activeRescueRequest.notes}"
                    </div>
                  )}

                  {/* Actions for active rescue */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-red-900/60">
                    <a
                      href={`tel:${activeRescueRequest.rescueContactPhone}`}
                      className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>Call Rescue Boat / Ambulance ({activeRescueRequest.rescueContactPhone})</span>
                    </a>

                    <div className="flex items-center space-x-2">
                      {onCancelRescue && (
                        <button
                          onClick={() => onCancelRescue(activeRescueRequest.id)}
                          className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
                        >
                          Cancel Dispatch
                        </button>
                      )}
                      {onResolveRescue && (
                        <button
                          onClick={() => onResolveRescue(activeRescueRequest.id)}
                          className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center space-x-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Mark Evacuated & Safe</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Rescue Dispatch Form */}
              <div className="p-4 sm:p-5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-4">
                <div className="border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <LifeBuoy className="w-4 h-4 text-red-500" />
                    <h3 className="text-sm font-bold text-white">
                      Request Field Medical Rescue Team (QMRT) Dispatch
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {t('rescueTeamHelpText')}
                  </p>
                </div>

                <form onSubmit={handleSubmitRescue} className="space-y-4">
                  {/* Row 1: Urgency Category */}
                  <div>
                    <label className="text-[11px] text-slate-300 font-mono uppercase block mb-1.5 font-bold">
                      1. {t('medicalUrgency')} *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {[
                        {
                          id: 'CRITICAL_TRAUMA',
                          label: '🚨 Severe Bleeding / Polytrauma / Crush Injury',
                          desc: 'Arterial bleeding, deep lacerations, head trauma',
                        },
                        {
                          id: 'FLOOD_SUBMERSION',
                          label: '🌊 Flood Submersion / Near Drowning / Hypothermia',
                          desc: 'Inhaled water, severe shivering, unconscious',
                        },
                        {
                          id: 'SNAKEBITE_POISON',
                          label: '🐍 Floodwater Snakebite / Anti-Venom Required',
                          desc: 'Bitten by snake in submerged floodwaters',
                        },
                        {
                          id: 'FRACTURE_STRETCHER',
                          label: '🦴 Bone Fracture / Stretcher Evacuation Needed',
                          desc: 'Inability to walk, structural collapse entrapment',
                        },
                        {
                          id: 'OXYGEN_RESPIRATORY',
                          label: '🫁 Acute Respiratory / Severe Asthma / O2 Depleted',
                          desc: 'Patient breathless, oxygen cylinder required',
                        },
                        {
                          id: 'PEDIATRIC_MATERNAL',
                          label: '👶 Infant Emergency / In-Labor Pregnant Mother',
                          desc: 'High fever, acute dehydration, labor pains',
                        },
                      ].map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() =>
                            setSelectedCategory(
                              cat.id as MedicalRescueRequest['emergencyCategory']
                            )
                          }
                          className={`p-2.5 rounded-lg border text-left transition flex flex-col justify-between ${
                            selectedCategory === cat.id
                              ? 'bg-red-950/60 border-red-500 text-white shadow-sm'
                              : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                          }`}
                        >
                          <span className="font-semibold text-[11px] block text-red-200">
                            {cat.label}
                          </span>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {cat.desc}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Row 2: Number of patients & Water depth */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-300 font-mono uppercase block mb-1 font-bold">
                        2. Number of Affected Patients
                      </label>
                      <div className="flex items-center space-x-2">
                        {[1, 2, 3, 4, '5+'].map((num) => (
                          <button
                            key={String(num)}
                            type="button"
                            onClick={() => setPatientCount(typeof num === 'number' ? num : 5)}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition border ${
                              (num === '5+' && patientCount >= 5) || patientCount === num
                                ? 'bg-red-600 text-white border-red-500'
                                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-300 font-mono uppercase block mb-1 font-bold">
                        3. {t('waterDepthLabel')}
                      </label>
                      <select
                        value={waterDepth}
                        onChange={(e) =>
                          setWaterDepth(
                            e.target.value as MedicalRescueRequest['waterDepth']
                          )
                        }
                        className="w-full bg-slate-950 text-slate-100 p-2 text-xs rounded-lg border border-slate-800 focus:outline-none focus:border-red-500"
                      >
                        <option value="DRY">Dry Ground / First Floor Safe</option>
                        <option value="KNEE_DEEP">Knee Deep Water (1 - 2 ft)</option>
                        <option value="WAIST_DEEP">Waist Deep Water (3 - 4 ft)</option>
                        <option value="ROOFTOP_STRANDED">Rooftop Stranded / Deep Submersion (&gt;5 ft)</option>
                      </select>
                    </div>
                  </div>

                  {/* Row 3: Preferred Rescue Vehicle Modality */}
                  <div>
                    <label className="text-[11px] text-slate-300 font-mono uppercase block mb-1 font-bold">
                      4. Preferred Rescue Team Modality
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      {[
                        {
                          id: 'WATER_AMBULANCE_BOAT',
                          name: '🚤 Rapid Water Ambulance Boat',
                          desc: 'Best for flooded lanes, canals & waterlogged areas',
                        },
                        {
                          id: 'ALS_ROAD_AMBULANCE',
                          name: '🚑 Advanced Life Support Ambulance',
                          desc: 'For elevated road corridors & bypass routes',
                        },
                        {
                          id: 'AMPHIBIOUS_EXTRACTION',
                          name: '🛟 Amphibious / High-Clearance Truck',
                          desc: 'Heavy flood debris & extreme water crossing',
                        },
                      ].map((mod) => (
                        <button
                          key={mod.id}
                          type="button"
                          onClick={() =>
                            setPreferredModality(
                              mod.id as MedicalRescueRequest['preferredModality']
                            )
                          }
                          className={`p-2.5 rounded-lg border text-left transition ${
                            preferredModality === mod.id
                              ? 'bg-cyan-950/60 border-cyan-500 text-white font-medium'
                              : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <span className="font-bold text-[11px] block text-cyan-300">
                            {mod.name}
                          </span>
                          <span className="text-[10px] text-slate-400 mt-0.5 block">
                            {mod.desc}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Row 4: Phone & Specific Notes */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-300 font-mono uppercase block mb-1 font-bold">
                        5. Citizen Contact Number
                      </label>
                      <input
                        type="tel"
                        value={citizenContact}
                        onChange={(e) => setCitizenContact(e.target.value)}
                        placeholder="+91 98300-XXXXX"
                        className="w-full bg-slate-950 text-slate-100 p-2 text-xs rounded-lg border border-slate-800 focus:outline-none focus:border-red-500 font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-300 font-mono uppercase block mb-1 font-bold">
                        6. Landmark & Physical Location Clues
                      </label>
                      <input
                        type="text"
                        value={landmarkNotes}
                        onChange={(e) => setLandmarkNotes(e.target.value)}
                        placeholder="e.g. Opposite Kali temple, 2nd floor balcony, waving yellow towel"
                        className="w-full bg-slate-950 text-slate-100 p-2 text-xs rounded-lg border border-slate-800 focus:outline-none focus:border-red-500"
                      />
                    </div>
                  </div>

                  {/* Submit CTA */}
                  <div className="pt-2">
                    <button
                      id="btn-submit-medical-rescue"
                      type="submit"
                      disabled={isSubmittingRescue}
                      className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm shadow-xl shadow-red-950/50 transition-all flex items-center justify-center space-x-2 border border-red-500 animate-pulse"
                    >
                      {isSubmittingRescue ? (
                        <>
                          <Radio className="w-4 h-4 animate-spin text-white" />
                          <span>Broadcasting Distress to NDRF & State Medical Rescue Desk...</span>
                        </>
                      ) : (
                        <>
                          <LifeBuoy className="w-5 h-5" />
                          <span>{t('dispatchRescueTeam')}</span>
                        </>
                      )}
                    </button>
                    <p className="text-[10px] text-slate-400 text-center mt-2 font-mono">
                      Your GPS coordinates [{currentCoords[0].toFixed(4)}, {currentCoords[1].toFixed(4)}] will be transmitted directly to the State Disaster Medical Control Room.
                    </p>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ================= TAB 3: FIRST AID & LIFE SAVING PROTOCOLS ================= */}
          {activeTab === 'FIRST_AID' && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/50 text-xs text-amber-200">
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="font-semibold">
                    Immediate Life-Saving Procedures (While awaiting Doctor or Rescue Team Arrival)
                  </span>
                </div>
              </div>

              {/* Accordion protocols */}
              {[
                {
                  id: 'bleeding',
                  title: '1. Severe Hemorrhage & Arterial Bleeding Control',
                  badge: 'CRITICAL',
                  badgeColor: 'bg-red-900/60 text-red-300 border-red-700',
                  steps: [
                    'Apply immediate, firm, direct pressure over the bleeding site using the cleanest available cloth or gauze pad.',
                    'Keep continuous pressure for a minimum of 10 uninterrupted minutes without peeking.',
                    'If bleeding persists through the cloth, DO NOT remove the first cloth. Stack fresh cloth on top and press harder.',
                    'Elevate the wounded limb above the victim’s heart level if there are no signs of bone fracture.',
                    'If life-threatening arterial spurting continues from an arm or leg, apply an improvised tourniquet (broad cloth strip & sturdy stick) 2 to 3 inches above the wound. Note the exact time applied.',
                  ],
                },
                {
                  id: 'submersion',
                  title: '2. Floodwater Submersion & CPR Protocol',
                  badge: 'LIFE SUPPORT',
                  badgeColor: 'bg-blue-900/60 text-blue-300 border-blue-700',
                  steps: [
                    'Extract patient from water immediately to a dry, stable surface.',
                    'Check for responsiveness and normal breathing. If unresponsive and not breathing normally, begin CPR immediately.',
                    'Chest Compressions: Place heels of hands on center of chest. Push hard and fast (100–120 compressions/minute, 2 inches deep). Complete 30 compressions.',
                    'Rescue Breaths: Tilt head back, lift chin, pinch nose, and deliver 2 gentle rescue breaths watching chest rise.',
                    'Continue cycles of 30 compressions and 2 breaths until victim moves or rescue paramedics take over.',
                    'If victim vomits silt or water, turn them onto their side (recovery position) to prevent airway choking.',
                  ],
                },
                {
                  id: 'snakebite',
                  title: '3. Floodwater Snakebite Protocol (Anti-Venom Pre-Care)',
                  badge: 'TOXIN ALERT',
                  badgeColor: 'bg-amber-900/60 text-amber-300 border-amber-700',
                  steps: [
                    'DO: Keep the victim calm and strictly still. Movement accelerates venom absorption into the bloodstream.',
                    'DO: Immobilize the bitten limb using a splint or firm cardboard below heart level.',
                    'DO: Remove tight rings, bangles, watches, or tight footwear immediately before swelling starts.',
                    'DO NOT: NEVER cut the bite wound with razors or attempt to suck out venom (this causes severe infection and tissue necrosis).',
                    'DO NOT: NEVER apply ice or tight arterial tourniquets (which cause limb gangrene).',
                    'Contact on-duty Dr. Ruma Chakraborty (Apollo / Swasthya Bhawan) or 108 for emergency Polyvalent Anti-Snake Venom (ASV).',
                  ],
                },
                {
                  id: 'hypothermia',
                  title: '4. Hypothermia & Shivering Shock in Cold Floodwaters',
                  badge: 'WATER SHOCK',
                  badgeColor: 'bg-cyan-900/60 text-cyan-300 border-cyan-700',
                  steps: [
                    'Remove soaked clothing immediately. Water conducts body heat away 25 times faster than air.',
                    'Wrap patient in dry blankets, towels, or clean plastic tarps/bubble wrap to trap core heat.',
                    'Insulate patient from the cold, wet floor using cardboard, wooden planks, or mattress.',
                    'Provide warm, sweet drinks (ORS, warm tea) ONLY if the patient is fully awake and swallows easily. Never give alcohol.',
                    'Avoid rapid direct heat (like boiling water or open flames), which triggers fatal cardiac arrhythmia.',
                  ],
                },
                {
                  id: 'electric',
                  title: '5. Submerged Electrical Wire Hazards',
                  badge: 'HAZARD',
                  badgeColor: 'bg-yellow-900/60 text-yellow-300 border-yellow-700',
                  steps: [
                    'DO NOT enter standing water if you observe downed electrical wires or sparks.',
                    'If tingling is felt in your legs, STOP immediately. Do NOT take steps. Hop away on one foot or shuffle with feet touching.',
                    'Maintain at least a 10-meter (33 feet) safe boundary from snapped power lines.',
                    'If a person is in electrical contact with submerged wire, DO NOT touch them directly. Use a dry non-conductive wooden pole.',
                  ],
                },
              ].map((proto) => (
                <div
                  key={proto.id}
                  className="rounded-xl bg-slate-900/70 border border-slate-800 overflow-hidden"
                >
                  <button
                    onClick={() =>
                      setExpandedProtocol(
                        expandedProtocol === proto.id ? '' : proto.id
                      )
                    }
                    className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-850 transition"
                  >
                    <div className="flex items-center space-x-2.5">
                      <span className="font-bold text-xs text-white">
                        {proto.title}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono border ${proto.badgeColor}`}
                      >
                        {proto.badge}
                      </span>
                    </div>
                    <span className="text-slate-400 font-mono text-xs">
                      {expandedProtocol === proto.id ? '▲' : '▼'}
                    </span>
                  </button>

                  {expandedProtocol === proto.id && (
                    <div className="p-4 bg-slate-950/60 border-t border-slate-800/80 space-y-2 text-xs text-slate-300">
                      <ul className="space-y-1.5 list-disc list-inside">
                        {proto.steps.map((step, sIdx) => (
                          <li key={sIdx} className="leading-relaxed text-slate-300">
                            {step}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Swasthya Bhawan Disaster Medical Cell & NDRF Dispatch</span>
          </div>

          <div className="flex items-center space-x-3">
            <a
              href="tel:108"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800/80 font-bold font-mono transition"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call 108 Ambulance</span>
            </a>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
