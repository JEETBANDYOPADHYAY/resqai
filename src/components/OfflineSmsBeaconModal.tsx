import React, { useState, useMemo } from 'react';
import {
  Radio,
  Phone,
  PhoneCall,
  Copy,
  CheckCircle2,
  AlertTriangle,
  X,
  Users,
  HeartPulse,
  Droplets,
  LifeBuoy,
  Send,
  WifiOff,
  MapPin,
  Building2,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Hospital,
  Flame,
  Stethoscope,
} from 'lucide-react';
import { RoadNode } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { formatISTTimestamp } from '../i18n/translations';
import { getGeoDistanceKm } from '../utils/geoRouting';
import { ROAD_NODES } from '../data/mockDisasterData';

interface OfflineSmsBeaconModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocationNode?: RoadNode | null;
  coordinates?: { lat: number; lng: number };
  allNodes?: RoadNode[];
  onOpenMedicalHelp?: () => void;
}

interface FacilityDistanceInfo {
  node: RoadNode;
  distanceKm: number;
  distanceFormatted: string;
  isNearest: boolean;
}

export const OfflineSmsBeaconModal: React.FC<OfflineSmsBeaconModalProps> = ({
  isOpen,
  onClose,
  currentLocationNode,
  coordinates,
  allNodes = ROAD_NODES,
  onOpenMedicalHelp,
}) => {
  const { t, language } = useLanguage();
  const [personsCount, setPersonsCount] = useState<number>(2);
  const [needMedical, setNeedMedical] = useState<boolean>(true);
  const [needWater, setNeedWater] = useState<boolean>(true);
  const [hasElderly, setHasElderly] = useState<boolean>(false);
  const [needBoat, setNeedBoat] = useState<boolean>(true);
  const [customPhone, setCustomPhone] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [showAllFacilities, setShowAllFacilities] = useState<boolean>(false);

  // Compute citizen current coordinates
  const currentCoords: [number, number] = useMemo(() => {
    if (coordinates?.lat && coordinates?.lng) {
      return [coordinates.lat, coordinates.lng];
    }
    if (currentLocationNode?.coordinates) {
      return currentLocationNode.coordinates;
    }
    return [22.6050, 88.4250]; // Baguiati VIP default
  }, [coordinates, currentLocationNode]);

  const latStr = currentCoords[0].toFixed(4);
  const lngStr = currentCoords[1].toFixed(4);
  const locName = currentLocationNode?.name || 'Citizen Location (Current GPS)';
  const istTime = formatISTTimestamp(new Date(), language).timeStr;

  // Format distance helper
  const formatDistance = (km: number) => {
    if (km < 1) {
      return `${Math.round(km * 1000)} m`;
    }
    return `${km.toFixed(1)} km`;
  };

  // Discover and rank all hospitals by distance from citizen's current location
  const hospitalsRanked = useMemo<FacilityDistanceInfo[]>(() => {
    const pool = (allNodes && allNodes.length > 0 ? allNodes : ROAD_NODES).filter(
      (n) => n.isHospital
    );
    const withDist = pool.map((n) => {
      const dist = getGeoDistanceKm(currentCoords, n.coordinates);
      return {
        node: n,
        distanceKm: dist,
        distanceFormatted: formatDistance(dist),
        isNearest: false,
      };
    });
    withDist.sort((a, b) => a.distanceKm - b.distanceKm);
    if (withDist.length > 0) {
      withDist[0].isNearest = true;
    }
    return withDist;
  }, [allNodes, currentCoords]);

  // Discover and rank all safe shelters by distance from citizen's current location
  const sheltersRanked = useMemo<FacilityDistanceInfo[]>(() => {
    const pool = (allNodes && allNodes.length > 0 ? allNodes : ROAD_NODES).filter(
      (n) => n.isShelter
    );
    const withDist = pool.map((n) => {
      const dist = getGeoDistanceKm(currentCoords, n.coordinates);
      return {
        node: n,
        distanceKm: dist,
        distanceFormatted: formatDistance(dist),
        isNearest: false,
      };
    });
    withDist.sort((a, b) => a.distanceKm - b.distanceKm);
    if (withDist.length > 0) {
      withDist[0].isNearest = true;
    }
    return withDist;
  }, [allNodes, currentCoords]);

  // Discover emergency response depot if available
  const depotsRanked = useMemo<FacilityDistanceInfo[]>(() => {
    const pool = (allNodes && allNodes.length > 0 ? allNodes : ROAD_NODES).filter(
      (n) => n.isEmergencyDepot
    );
    return pool.map((n) => {
      const dist = getGeoDistanceKm(currentCoords, n.coordinates);
      return {
        node: n,
        distanceKm: dist,
        distanceFormatted: formatDistance(dist),
        isNearest: true,
      };
    });
  }, [allNodes, currentCoords]);

  const nearestHospital = hospitalsRanked[0] || null;
  const nearestShelter = sheltersRanked[0] || null;

  const tags: string[] = [];
  if (needMedical) tags.push('MEDIC_REQ');
  if (needBoat) tags.push('BOAT_RESCUE');
  if (needWater) tags.push('WATER_FOOD');
  if (hasElderly) tags.push('ELDERLY_INFANT');

  // Compressed standard 2G SMS payload (under 160 characters to fit single standard SMS packet)
  const hospTag = nearestHospital
    ? `|HOSP:${nearestHospital.node.name.split(' ')[0]}(${nearestHospital.distanceFormatted})`
    : '';
  const shelterTag = nearestShelter
    ? `|SHELTER:${nearestShelter.node.name.split(' ')[0]}(${nearestShelter.distanceFormatted})`
    : '';

  const smsPayload = `RESQ-SOS|LOC:${locName.substring(0, 20)}|GPS:${latStr},${lngStr}|P:${personsCount}|TAGS:${tags.join(',')}${hospTag}${shelterTag}|T:${istTime}IST`;

  if (!isOpen) return null;

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(smsPayload);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const cleanTel = (num?: string) => {
    if (!num) return '';
    return num.replace(/[^0-9+]/g, '');
  };

  const getSmsHref = (number: string) => {
    const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
    const separator = isIOS ? '&' : '?';
    return `sms:${cleanTel(number)}${separator}body=${encodeURIComponent(smsPayload)}`;
  };

  const getTelHref = (number: string) => {
    return `tel:${cleanTel(number)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 sm:p-4 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-red-500/50 p-4 sm:p-6 shadow-2xl shadow-red-950/60 text-slate-100 flex flex-col max-h-[92vh] overflow-y-auto my-auto">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-red-950/80 border border-red-600/60 text-red-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
                  {t('smsDistressTitle')}
                </h3>
              </div>
              <p className="text-[11px] text-slate-400">
                Zero-internet 2G cellular fallback for tower blackouts • Auto-targeted to nearby facilities
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title={t('cancel')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2G Resilience Explainer Banner */}
        <div className="mt-3 p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start space-x-2.5 text-[11px] shrink-0">
          <WifiOff className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-slate-300">
            <span className="font-semibold text-amber-300">Why 2G SMS Works: </span>
            When mobile 4G/5G data towers collapse, basic 2G SMS signaling channels
            (SDCCH) penetrate over weak carrier signals directly to nearby emergency helplines and dispatchers.
          </div>
        </div>

        {/* Active Citizen Location Pin Banner */}
        <div className="mt-3 p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
            <div>
              <div className="text-[10px] uppercase font-mono tracking-wider text-cyan-400 font-bold">
                Your Current Origin Location:
              </div>
              <div className="text-xs font-semibold text-white truncate max-w-sm" title={locName}>
                {locName}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2 self-start sm:self-auto font-mono text-xs bg-slate-900/80 px-2.5 py-1 rounded-lg border border-cyan-800/40 text-cyan-300">
            <span>GPS:</span>
            <span>{latStr}, {lngStr}</span>
          </div>
        </div>

        {/* Doctor & Rescue Team Direct Banner */}
        {onOpenMedicalHelp && (
          <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-emerald-950/70 border border-emerald-600/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs shadow-md">
            <div className="flex items-center space-x-2.5 text-emerald-300">
              <div className="p-1.5 rounded-lg bg-emerald-900/60 border border-emerald-500/50 text-emerald-400">
                <Stethoscope className="w-4 h-4 text-emerald-400 shrink-0" />
              </div>
              <div>
                <span className="font-bold text-white block">Need On-Duty Government Doctor or Medical Rescue Team?</span>
                <span className="text-[11px] text-slate-300">Directly contact available trauma doctors, pediatricians & dispatch QMRT rescue boats</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenMedicalHelp();
              }}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition border border-emerald-400 shrink-0 shadow-sm"
            >
              Govt Doctors & Rescue →
            </button>
          </div>
        )}

        {/* =========================================================
            SECTION 1: LOCATION-BASED EMERGENCY CONTACTS (NEAREST TO YOU)
           ========================================================= */}
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-mono uppercase text-red-400 font-bold tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              <span>{t('locationEmergencyContacts')}</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              Calculated dynamically from your coordinates
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* NEAREST HOSPITAL CARD */}
            {nearestHospital && (
              <div className="rounded-xl bg-gradient-to-b from-red-950/30 to-slate-950 border border-red-500/40 p-3.5 flex flex-col justify-between shadow-lg shadow-red-950/20">
                <div className="space-y-2">
                  {/* Top Badge Row */}
                  <div className="flex items-center justify-between gap-1">
                    <span className="px-2 py-0.5 rounded-full bg-red-900/40 border border-red-600/50 text-red-300 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                      <Hospital className="w-3 h-3 text-red-400" />
                      <span>{t('nearestHospital')}</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-red-600 text-white text-[11px] font-mono font-bold shadow-sm">
                      {nearestHospital.distanceFormatted} away
                    </span>
                  </div>

                  {/* Hospital Name & Address */}
                  <div>
                    <h4 className="text-xs font-bold text-white leading-snug">
                      {nearestHospital.node.name}
                    </h4>
                    {nearestHospital.node.address && (
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                        {nearestHospital.node.address}
                      </p>
                    )}
                  </div>

                  {/* Bed & Staff status */}
                  <div className="flex items-center space-x-2 text-[10px] text-slate-300 font-mono pt-1">
                    {nearestHospital.node.capacity && (
                      <span className="px-1.5 py-0.5 bg-slate-900 rounded border border-slate-800">
                        Beds: {nearestHospital.node.capacity - (nearestHospital.node.currentOccupancy || 0)} free
                      </span>
                    )}
                    {nearestHospital.node.medicalStaff && (
                      <span className="px-1.5 py-0.5 bg-slate-900 rounded border border-slate-800 text-emerald-300">
                        👨‍⚕️ {nearestHospital.node.medicalStaff} Staff Active
                      </span>
                    )}
                  </div>

                  {/* Contact Numbers Display */}
                  <div className="space-y-1 pt-1 text-[11px]">
                    {nearestHospital.node.emergencyPhone && (
                      <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900/80 border border-slate-800">
                        <div className="flex flex-col">
                          <span className="text-[9px] text-slate-400 uppercase font-mono">
                            {nearestHospital.node.contactPerson || t('casualtyTraumaDesk')}:
                          </span>
                          <span className="font-mono font-bold text-red-300">
                            {nearestHospital.node.emergencyPhone}
                          </span>
                        </div>
                        <a
                          href={getTelHref(nearestHospital.node.emergencyPhone)}
                          className="px-2 py-1 rounded bg-red-900/50 hover:bg-red-800 text-red-200 text-[10px] font-bold border border-red-700/50 flex items-center gap-1 transition"
                          title="Call Trauma Casualty Directly"
                        >
                          <PhoneCall className="w-3 h-3 text-red-300" />
                          <span>{t('callNow')}</span>
                        </a>
                      </div>
                    )}

                    {nearestHospital.node.helplinePhone && (
                      <div className="flex items-center justify-between px-2 py-1 text-[10.5px] text-slate-400 font-mono">
                        <span>Ambulance / Helpline:</span>
                        <a
                          href={getTelHref(nearestHospital.node.helplinePhone)}
                          className="text-red-400 hover:underline font-bold"
                        >
                          {nearestHospital.node.helplinePhone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* 1-Tap Action: Transmit 2G SMS to this hospital */}
                <div className="mt-3 pt-2 border-t border-slate-800/80">
                  <a
                    href={getSmsHref(nearestHospital.node.emergencyPhone || '108')}
                    className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-xl bg-red-700 hover:bg-red-600 text-white font-bold text-xs shadow-md shadow-red-950/60 border border-red-500/40 transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send 2G SMS to Nearest Hospital</span>
                  </a>
                </div>
              </div>
            )}

            {/* NEAREST SAFE SHELTER CARD */}
            {nearestShelter && (
              <div className="rounded-xl bg-gradient-to-b from-emerald-950/30 to-slate-950 border border-emerald-500/40 p-3.5 flex flex-col justify-between shadow-lg shadow-emerald-950/20">
                <div className="space-y-2">
                  {/* Top Badge Row */}
                  <div className="flex items-center justify-between gap-1">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-900/40 border border-emerald-600/50 text-emerald-300 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      <span>{t('nearestShelter')}</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[11px] font-mono font-bold shadow-sm">
                      {nearestShelter.distanceFormatted} away
                    </span>
                  </div>

                  {/* Shelter Name & Address */}
                  <div>
                    <h4 className="text-xs font-bold text-white leading-snug">
                      {nearestShelter.node.name}
                    </h4>
                    {nearestShelter.node.address && (
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                        {nearestShelter.node.address}
                      </p>
                    )}
                  </div>

                  {/* Capacity & Relief Supplies */}
                  <div className="flex items-center space-x-2 text-[10px] text-slate-300 font-mono pt-1">
                    {nearestShelter.node.capacity && (
                      <span className="px-1.5 py-0.5 bg-slate-900 rounded border border-slate-800">
                        Shelter Space: {nearestShelter.node.capacity - (nearestShelter.node.currentOccupancy || 0)} slots
                      </span>
                    )}
                    <span className="px-1.5 py-0.5 bg-slate-900 rounded border border-slate-800 text-cyan-300">
                      💧 High Water & Food
                    </span>
                  </div>

                  {/* Contact Numbers Display */}
                  <div className="space-y-1 pt-1 text-[11px]">
                    {nearestShelter.node.emergencyPhone && (
                      <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900/80 border border-slate-800">
                        <div className="flex flex-col">
                          <span className="text-[9px] text-slate-400 uppercase font-mono">
                            {nearestShelter.node.contactPerson || t('reliefCampDesk')}:
                          </span>
                          <span className="font-mono font-bold text-emerald-300">
                            {nearestShelter.node.emergencyPhone}
                          </span>
                        </div>
                        <a
                          href={getTelHref(nearestShelter.node.emergencyPhone)}
                          className="px-2 py-1 rounded bg-emerald-900/50 hover:bg-emerald-800 text-emerald-200 text-[10px] font-bold border border-emerald-700/50 flex items-center gap-1 transition"
                          title="Call Relief Shelter Desk"
                        >
                          <PhoneCall className="w-3 h-3 text-emerald-300" />
                          <span>{t('callNow')}</span>
                        </a>
                      </div>
                    )}

                    {nearestShelter.node.helplinePhone && (
                      <div className="flex items-center justify-between px-2 py-1 text-[10.5px] text-slate-400 font-mono">
                        <span>Camp Control Mobile:</span>
                        <a
                          href={getTelHref(nearestShelter.node.helplinePhone)}
                          className="text-emerald-400 hover:underline font-bold"
                        >
                          {nearestShelter.node.helplinePhone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* 1-Tap Action: Transmit 2G SMS to this shelter */}
                <div className="mt-3 pt-2 border-t border-slate-800/80">
                  <a
                    href={getSmsHref(nearestShelter.node.emergencyPhone || '112')}
                    className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-950/60 border border-emerald-500/40 transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send 2G SMS to Nearest Shelter</span>
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Toggle All Nearby Facilities in District */}
          <div className="pt-1">
            <button
              onClick={() => setShowAllFacilities(!showAllFacilities)}
              className="w-full py-2 px-3 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-[11px] text-slate-300 font-mono flex items-center justify-between transition cursor-pointer"
            >
              <div className="flex items-center space-x-2">
                <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>{t('allNearbyFacilities')}</span>
                <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-slate-400">
                  {hospitalsRanked.length + sheltersRanked.length + depotsRanked.length} facilities
                </span>
              </div>
              {showAllFacilities ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {/* Expandable facilities list */}
            {showAllFacilities && (
              <div className="mt-2 p-3 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2 text-xs">
                {/* All Hospitals */}
                <div>
                  <div className="text-[10px] font-mono text-red-400 uppercase font-bold tracking-wider mb-1.5">
                    Hospitals & Trauma Centers:
                  </div>
                  <div className="space-y-1.5">
                    {hospitalsRanked.map((item) => (
                      <div
                        key={item.node.id}
                        className="p-2 rounded-lg bg-slate-900 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white">{item.node.name}</span>
                            <span className="text-[10px] font-mono text-red-400 bg-red-950/60 px-1.5 py-0.5 rounded border border-red-800/40">
                              {item.distanceFormatted}
                            </span>
                          </div>
                          {item.node.address && (
                            <div className="text-[10px] text-slate-400">{item.node.address}</div>
                          )}
                        </div>
                        <div className="flex items-center space-x-1.5 shrink-0 self-end sm:self-auto">
                          {item.node.emergencyPhone && (
                            <>
                              <a
                                href={getTelHref(item.node.emergencyPhone)}
                                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-mono flex items-center gap-1 border border-slate-700"
                                title={`Call ${item.node.emergencyPhone}`}
                              >
                                <Phone className="w-3 h-3 text-emerald-400" />
                                <span>{item.node.emergencyPhone}</span>
                              </a>
                              <a
                                href={getSmsHref(item.node.emergencyPhone)}
                                className="px-2 py-1 rounded bg-red-800 hover:bg-red-700 text-white text-[10px] font-mono font-bold flex items-center gap-1"
                                title="Send SMS"
                              >
                                <Send className="w-3 h-3" />
                                <span>SMS</span>
                              </a>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* All Shelters */}
                <div className="pt-2 border-t border-slate-800">
                  <div className="text-[10px] font-mono text-emerald-400 uppercase font-bold tracking-wider mb-1.5">
                    Safe Evacuation Shelters & Relief Stadiums:
                  </div>
                  <div className="space-y-1.5">
                    {sheltersRanked.map((item) => (
                      <div
                        key={item.node.id}
                        className="p-2 rounded-lg bg-slate-900 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white">{item.node.name}</span>
                            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
                              {item.distanceFormatted}
                            </span>
                          </div>
                          {item.node.address && (
                            <div className="text-[10px] text-slate-400">{item.node.address}</div>
                          )}
                        </div>
                        <div className="flex items-center space-x-1.5 shrink-0 self-end sm:self-auto">
                          {item.node.emergencyPhone && (
                            <>
                              <a
                                href={getTelHref(item.node.emergencyPhone)}
                                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-mono flex items-center gap-1 border border-slate-700"
                                title={`Call ${item.node.emergencyPhone}`}
                              >
                                <Phone className="w-3 h-3 text-emerald-400" />
                                <span>{item.node.emergencyPhone}</span>
                              </a>
                              <a
                                href={getSmsHref(item.node.emergencyPhone)}
                                className="px-2 py-1 rounded bg-emerald-800 hover:bg-emerald-700 text-white text-[10px] font-mono font-bold flex items-center gap-1"
                                title="Send SMS"
                              >
                                <Send className="w-3 h-3" />
                                <span>SMS</span>
                              </a>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Emergency Depots / NDRF */}
                {depotsRanked.length > 0 && (
                  <div className="pt-2 border-t border-slate-800">
                    <div className="text-[10px] font-mono text-cyan-400 uppercase font-bold tracking-wider mb-1.5">
                      Disaster Management & NDRF Battalion HQ:
                    </div>
                    <div className="space-y-1.5">
                      {depotsRanked.map((item) => (
                        <div
                          key={item.node.id}
                          className="p-2 rounded-lg bg-slate-900 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white">{item.node.name}</span>
                              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">
                                {item.distanceFormatted}
                              </span>
                            </div>
                            {item.node.address && (
                              <div className="text-[10px] text-slate-400">{item.node.address}</div>
                            )}
                          </div>
                          <div className="flex items-center space-x-1.5 shrink-0 self-end sm:self-auto">
                            {item.node.emergencyPhone && (
                              <>
                                <a
                                  href={getTelHref(item.node.emergencyPhone)}
                                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-mono flex items-center gap-1 border border-slate-700"
                                >
                                  <Phone className="w-3 h-3 text-cyan-400" />
                                  <span>{item.node.emergencyPhone}</span>
                                </a>
                                <a
                                  href={getSmsHref(item.node.emergencyPhone)}
                                  className="px-2 py-1 rounded bg-cyan-800 hover:bg-cyan-700 text-white text-[10px] font-mono font-bold flex items-center gap-1"
                                >
                                  <Send className="w-3 h-3" />
                                  <span>SMS</span>
                                </a>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* =========================================================
            SECTION 2: TRIAGE PAYLOAD DETAILS
           ========================================================= */}
        <div className="mt-4 space-y-3">
          <div className="text-[11px] font-mono uppercase text-slate-400 font-bold tracking-wider">
            2. Triage Payload Details
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Persons Count */}
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs text-slate-300">
                <Users className="w-4 h-4 text-cyan-400" />
                <span>Stranded Persons:</span>
              </div>
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 5].map((cnt) => (
                  <button
                    key={cnt}
                    onClick={() => setPersonsCount(cnt)}
                    className={`px-2 py-0.5 text-xs font-mono rounded transition ${
                      personsCount === cnt
                        ? 'bg-cyan-600 text-white font-bold'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cnt === 5 ? '5+' : cnt}
                  </button>
                ))}
              </div>
            </div>

            {/* GPS Location Summary */}
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Targeting Radius:</span>
              <span className="font-mono text-emerald-300 font-medium truncate max-w-[170px]" title={locName}>
                Hosp: {nearestHospital?.distanceFormatted || 'N/A'} • Shlt: {nearestShelter?.distanceFormatted || 'N/A'}
              </span>
            </div>
          </div>

          {/* Rapid Triage Toggles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => setNeedMedical(!needMedical)}
              className={`p-2 rounded-lg border text-left text-[11px] flex flex-col justify-between transition cursor-pointer ${
                needMedical
                  ? 'bg-red-950/70 border-red-500 text-red-200'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <HeartPulse className="w-3.5 h-3.5 mb-1 text-red-400" />
              <span className="font-semibold">Medical Care</span>
            </button>

            <button
              onClick={() => setNeedBoat(!needBoat)}
              className={`p-2 rounded-lg border text-left text-[11px] flex flex-col justify-between transition cursor-pointer ${
                needBoat
                  ? 'bg-cyan-950/70 border-cyan-500 text-cyan-200'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <LifeBuoy className="w-3.5 h-3.5 mb-1 text-cyan-400" />
              <span className="font-semibold">Boat Rescue</span>
            </button>

            <button
              onClick={() => setNeedWater(!needWater)}
              className={`p-2 rounded-lg border text-left text-[11px] flex flex-col justify-between transition cursor-pointer ${
                needWater
                  ? 'bg-blue-950/70 border-blue-500 text-blue-200'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <Droplets className="w-3.5 h-3.5 mb-1 text-blue-400" />
              <span className="font-semibold">Water / Food</span>
            </button>

            <button
              onClick={() => setHasElderly(!hasElderly)}
              className={`p-2 rounded-lg border text-left text-[11px] flex flex-col justify-between transition cursor-pointer ${
                hasElderly
                  ? 'bg-amber-950/70 border-amber-500 text-amber-200'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 mb-1 text-amber-400" />
              <span className="font-semibold">Elderly / Infant</span>
            </button>
          </div>
        </div>

        {/* =========================================================
            SECTION 3: PRE-COMPILED 2G SMS STRING
           ========================================================= */}
        <div className="mt-4 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>PRE-COMPILED 2G SMS STRING ({smsPayload.length} / 160 chars):</span>
            <button
              onClick={handleCopyPayload}
              className="text-cyan-400 hover:underline flex items-center space-x-1 cursor-pointer"
            >
              {isCopied ? (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">{t('copiedSms')}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy Payload</span>
                </>
              )}
            </button>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-300 break-all select-all leading-relaxed">
            {smsPayload}
          </div>
        </div>

        {/* =========================================================
            SECTION 4: UNIVERSAL EMERGENCY & CUSTOM NUMBERS
           ========================================================= */}
        <div className="mt-4 space-y-2">
          <div className="text-[11px] font-mono uppercase text-slate-400 font-bold tracking-wider">
            3. Universal National & State Emergency Lines
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* SMS to 112 */}
            <div className="flex items-center space-x-1.5">
              <a
                href={getSmsHref('112')}
                className="flex-1 flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-950/60 border border-red-400/40 transition"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{t('sendSms112')}</span>
              </a>
              <a
                href={getTelHref('112')}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition"
                title="Direct Call 112"
              >
                <PhoneCall className="w-4 h-4 text-red-400" />
              </a>
            </div>

            {/* SMS to 108 */}
            <div className="flex items-center space-x-1.5">
              <a
                href={getSmsHref('108')}
                className="flex-1 flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-950/60 border border-cyan-400/40 transition"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{t('sendSms108')}</span>
              </a>
              <a
                href={getTelHref('108')}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition"
                title="Direct Call 108"
              >
                <PhoneCall className="w-4 h-4 text-cyan-400" />
              </a>
            </div>
          </div>

          {/* Custom Family Number Form */}
          <div className="pt-2 flex items-center space-x-2">
            <input
              type="tel"
              placeholder="Send to Family / Ham Operator Phone Number"
              value={customPhone}
              onChange={(e) => setCustomPhone(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
            />
            {customPhone.trim() && (
              <div className="flex items-center space-x-1 shrink-0">
                <a
                  href={getSmsHref(customPhone.trim())}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send SMS</span>
                </a>
                <a
                  href={getTelHref(customPhone.trim())}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition"
                  title={`Direct Call ${customPhone.trim()}`}
                >
                  <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-[10px] text-slate-500 font-mono">
            Standard SMS carrier charges apply • No mobile data / internet needed
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs hover:bg-slate-700 transition cursor-pointer"
          >
            {t('cancel')}
          </button>
        </div>
      </div>
    </div>
  );
};
