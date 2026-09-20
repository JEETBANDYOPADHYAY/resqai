import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  RoadNode,
  RoadSegment,
  ZonePolygon,
  RoutingResult,
  EmergencyUnit,
  DispatchIncident,
  UserViewProfile,
  LightningStrike,
  LandslideStation,
  DamBarrageStation,
} from '../types';
import { MAP_CENTER, MAP_DEFAULT_ZOOM } from '../data/mockDisasterData';
import {
  Layers,
  ShieldCheck,
  AlertOctagon,
  AlertTriangle,
  Ambulance,
  Building2,
  Home,
  Navigation,
  Crosshair,
  Ban,
  Radio,
  Zap,
  Mountain,
  Waves,
} from 'lucide-react';
interface MapViewProps {
  nodes: RoadNode[];
  segments: RoadSegment[];
  zones: ZonePolygon[];
  route: RoutingResult | null;
  units: EmergencyUnit[];
  incidents: DispatchIncident[];
  lightningStrikes?: LightningStrike[];
  landslideStations?: LandslideStation[];
  damStations?: DamBarrageStation[];
  navPosition?: [number, number] | null;
  navHeadingDeg?: number;
  profile: UserViewProfile;
  selectedScenarioId?: string;
  hazardFocus?: [number, number];
  onToggleRoadBlock: (segmentId: string) => void;
  onSelectNodeAsOrigin?: (nodeId: string) => void;
  onSelectNodeAsDestination?: (nodeId: string | null) => void;
  selectedTargetNodeId?: string | null;
}

export const MapView: React.FC<MapViewProps> = ({
  nodes,
  segments,
  zones,
  route,
  units,
  incidents,
  lightningStrikes = [],
  landslideStations = [],
  damStations = [],
  navPosition = null,
  navHeadingDeg = 0,
  profile,
  selectedScenarioId,
  hazardFocus,
  onToggleRoadBlock,
  onSelectNodeAsOrigin,
  onSelectNodeAsDestination,
  selectedTargetNodeId = null,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Tile layer ref for clean watermark-free basemaps
  const baseTileLayersRef = useRef<{ base: L.TileLayer; ref?: L.TileLayer } | null>(null);
  const [baseMapType, setBaseMapType] = useState<'dark' | 'satellite' | 'street'>('dark');

  // Layer groups refs
  const zonesLayerRef = useRef<L.LayerGroup | null>(null);
  const roadsLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const unitsLayerRef = useRef<L.LayerGroup | null>(null);
  const lightningLayerRef = useRef<L.LayerGroup | null>(null);
  const landslideLayerRef = useRef<L.LayerGroup | null>(null);
  const damLayerRef = useRef<L.LayerGroup | null>(null);
  const scenarioEpicenterLayerRef = useRef<L.LayerGroup | null>(null);
  const navLayerRef = useRef<L.LayerGroup | null>(null);
  const navMarkerRef = useRef<L.Marker | null>(null);
  const lastPanTimeRef = useRef<number>(0);

  // Toggles for layers
  const [showZones, setShowZones] = useState(true);
  const [showRoads, setShowRoads] = useState(true);
  const [showUnits, setShowUnits] = useState(true);
  const [showIncidents, setShowIncidents] = useState(true);
  const [showLightning, setShowLightning] = useState(true);
  const [showLandslides, setShowLandslides] = useState(true);
  const [showDams, setShowDams] = useState(true);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: hazardFocus || MAP_CENTER,
        zoom: MAP_DEFAULT_ZOOM,
        zoomControl: false,
      });

      // Unobstructed, clearly visible zoom controls (+ / -) in bottom-right corner
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Create Layer Groups
      zonesLayerRef.current = L.layerGroup().addTo(map);
      roadsLayerRef.current = L.layerGroup().addTo(map);
      routeLayerRef.current = L.layerGroup().addTo(map);
      markersLayerRef.current = L.layerGroup().addTo(map);
      unitsLayerRef.current = L.layerGroup().addTo(map);
      lightningLayerRef.current = L.layerGroup().addTo(map);
      landslideLayerRef.current = L.layerGroup().addTo(map);
      damLayerRef.current = L.layerGroup().addTo(map);
      scenarioEpicenterLayerRef.current = L.layerGroup().addTo(map);
      navLayerRef.current = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      // Clean up map on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 0. Basemap Tile Management (Free, high performance, zero watermarks, NO API key required)
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // Cleanly remove any existing basemap layers
    if (baseTileLayersRef.current) {
      try {
        map.removeLayer(baseTileLayersRef.current.base);
        if (baseTileLayersRef.current.ref) {
          map.removeLayer(baseTileLayersRef.current.ref);
        }
      } catch {
        // ignore
      }
      baseTileLayersRef.current = null;
    }

    if (baseMapType === 'satellite') {
      // Esri World Imagery (High-resolution aerial satellite, no API key required)
      const base = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: '&copy; Esri, Maxar, Earthstar Geographics',
          maxZoom: 19,
        }
      ).addTo(map);
      base.bringToBack();
      baseTileLayersRef.current = { base };
    } else if (baseMapType === 'street') {
      // OpenStreetMap standard raster tiles (100% free open street map, no API key)
      const base = L.tileLayer(
        'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }
      ).addTo(map);
      base.bringToBack();
      baseTileLayersRef.current = { base };
    } else {
      // Tactical Dark Gray Canvas: Esri World Dark Gray Base + Reference Labels
      // Zero watermarks, purpose-built for disaster & emergency overlays, no API key required
      const base = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: '&copy; Esri, HERE, Garmin &copy; OpenStreetMap',
          maxZoom: 19,
        }
      ).addTo(map);

      const ref = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: '',
          maxZoom: 19,
          pane: 'overlayPane',
        }
      ).addTo(map);

      base.bringToBack();
      baseTileLayersRef.current = { base, ref };
    }
  }, [baseMapType]);

  // 0.5 Scenario Hazard Epicenter & Camera Dynamic Relocation
  useEffect(() => {
    const layer = scenarioEpicenterLayerRef.current;
    if (!layer || !mapInstanceRef.current) return;
    layer.clearLayers();

    if (!selectedScenarioId || !hazardFocus) return;

    // Smoothly pan / fly the map to the selected scenario's hazard focus
    mapInstanceRef.current.flyTo(hazardFocus, 13.2, {
      duration: 1.3,
      easeLinearity: 0.25,
    });

    // Auto-enable disaster specific layers based on scenario
    if (selectedScenarioId === 'dam-rupture') {
      setShowDams(true);
    } else if (selectedScenarioId === 'thunder-lightning') {
      setShowLightning(true);
    } else if (selectedScenarioId === 'landslide') {
      setShowLandslides(true);
    }

    let epicenterLabel = 'HAZARD EPICENTER';
    let iconSymbol = '⚠️';
    let ringColor = '#ef4444';
    let pulseBgClass = 'border-red-500 bg-red-500/20';

    if (selectedScenarioId === 'thunder-lightning') {
      epicenterLabel = "NOR'WESTER SQUALL & LIGHTNING SWARM";
      iconSymbol = '⚡';
      ringColor = '#f59e0b';
      pulseBgClass = 'border-amber-400 bg-amber-400/25';
    } else if (selectedScenarioId === 'dam-rupture') {
      epicenterLabel = 'HOOGHLY RIVERFRONT & DAM INFLOW SURGE';
      iconSymbol = '🌊';
      ringColor = '#06b6d4';
      pulseBgClass = 'border-cyan-400 bg-cyan-400/25';
    } else if (selectedScenarioId === 'flash-flood') {
      epicenterLabel = 'KESTOPUR LOW CANAL BASIN INUNDATION';
      iconSymbol = '🌧️';
      ringColor = '#3b82f6';
      pulseBgClass = 'border-blue-500 bg-blue-500/25';
    } else if (selectedScenarioId === 'hurricane') {
      epicenterLabel = 'SUPER CYCLONE EYEWALL DEVASTATION';
      iconSymbol = '🌪️';
      ringColor = '#a855f7';
      pulseBgClass = 'border-purple-500 bg-purple-500/25';
    } else if (selectedScenarioId === 'wildfire') {
      epicenterLabel = 'BT ROAD HAZMAT FIRE CONFLAGRATION';
      iconSymbol = '🔥';
      ringColor = '#ea580c';
      pulseBgClass = 'border-orange-500 bg-orange-500/25';
    } else if (selectedScenarioId === 'landslide') {
      epicenterLabel = 'HOOGHLY 44° ESCARPMENT ROTATIONAL SLIP';
      iconSymbol = '⛰️';
      ringColor = '#d97706';
      pulseBgClass = 'border-amber-600 bg-amber-600/25';
    }

    // Outer hazard impact circle
    const circle = L.circle(hazardFocus, {
      radius: 1350,
      color: ringColor,
      weight: 2,
      dashArray: '5, 5',
      fillColor: ringColor,
      fillOpacity: 0.12,
    });
    circle.addTo(layer);

    // Inner epicenter pulsing divIcon marker
    const markerHtml = `
      <div class="relative flex items-center justify-center pointer-events-auto cursor-pointer">
        <div class="absolute -inset-4 rounded-full ${pulseBgClass} animate-ping opacity-75"></div>
        <div class="absolute -inset-2 rounded-full border-2 ${pulseBgClass} animate-pulse"></div>
        <div class="w-8 h-8 rounded-full bg-slate-950 border-2 border-white shadow-2xl flex items-center justify-center text-sm z-10">
          ${iconSymbol}
        </div>
        <div class="absolute top-9 left-1/2 -translate-x-1/2 whitespace-nowrap px-2.5 py-0.5 rounded bg-slate-950/95 border border-slate-700 text-[10px] font-mono font-bold text-white shadow-2xl pointer-events-none">
          ${epicenterLabel}
        </div>
      </div>
    `;

    const epicenterIcon = L.divIcon({
      html: markerHtml,
      className: 'scenario-epicenter-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const marker = L.marker(hazardFocus, { icon: epicenterIcon, zIndexOffset: 1600 });
    marker.bindPopup(`
      <div class="p-2 space-y-1.5 text-xs text-slate-100 min-w-[200px]">
        <div class="font-bold text-sm text-amber-400 flex items-center gap-1.5">
          <span>${iconSymbol}</span>
          <span>${epicenterLabel}</span>
        </div>
        <div class="text-[11px] text-slate-300">
          Epicenter Coordinates: <span class="font-mono text-white">[${hazardFocus[0].toFixed(4)}, ${hazardFocus[1].toFixed(4)}]</span>
        </div>
        <div class="text-[10px] text-slate-400 font-mono">
          Hazard telemetry, roadblock barriers, and safe evacuation routing dynamically recomputed for this scenario.
        </div>
      </div>
    `);
    marker.addTo(layer);
  }, [selectedScenarioId, hazardFocus]);

  // 1. Render RAG Risk Zones (Red, Yellow, Green)
  useEffect(() => {
    const layer = zonesLayerRef.current;
    if (!layer) return;
    layer.clearLayers();

    if (!showZones) return;

    zones.forEach((zone) => {
      let fillColor = '#10b981';
      let strokeColor = '#059669';
      let pulseBadge = 'SAFE SANCTUARY';

      if (zone.zoneType === 'RED') {
        fillColor = '#ef4444';
        strokeColor = '#dc2626';
        pulseBadge = 'IMMEDIATE EVACUATION';
      } else if (zone.zoneType === 'YELLOW') {
        fillColor = '#f59e0b';
        strokeColor = '#d97706';
        pulseBadge = 'POTENTIAL HAZARD';
      }

      const polygon = L.polygon(zone.coordinates, {
        color: strokeColor,
        weight: zone.zoneType === 'RED' ? 3 : 2,
        dashArray: zone.zoneType === 'RED' ? '6, 6' : undefined,
        fillColor,
        fillOpacity: zone.zoneType === 'RED' ? 0.35 : 0.25,
      });

      polygon.bindPopup(`
        <div class="p-2 space-y-1.5 text-xs text-slate-100 min-w-[200px]">
          <div class="flex items-center justify-between">
            <span class="font-bold text-sm tracking-tight ${
              zone.zoneType === 'RED' ? 'text-red-400' : zone.zoneType === 'YELLOW' ? 'text-amber-400' : 'text-emerald-400'
            }">${zone.name}</span>
          </div>
          <div class="text-[10px] font-mono px-2 py-0.5 rounded ${
            zone.zoneType === 'RED' ? 'bg-red-500/20 text-red-300' : zone.zoneType === 'YELLOW' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
          }">STATUS: ${pulseBadge}</div>
          <div class="text-slate-300 text-[11px]">Affected Pop: <span class="font-semibold text-white">${zone.affectedPopulation.toLocaleString()}</span></div>
          <div class="text-slate-400 text-[10px]">${zone.activeHazards.join(' • ')}</div>
        </div>
      `);

      polygon.addTo(layer);
    });
  }, [zones, showZones]);

  // 2. Render Road Network & Interactive Blockages
  useEffect(() => {
    const layer = roadsLayerRef.current;
    if (!layer) return;
    layer.clearLayers();

    if (!showRoads) return;

    segments.forEach((seg) => {
      const isBlocked = seg.isBlocked;

      const polyline = L.polyline(seg.coordinates, {
        color: isBlocked ? '#ef4444' : '#475569',
        weight: isBlocked ? 6 : 4,
        opacity: isBlocked ? 0.95 : 0.6,
        dashArray: isBlocked ? '8, 8' : undefined,
        lineCap: 'round',
      });

      // Hover / Click effects
      polyline.on('mouseover', function () {
        polyline.setStyle({
          weight: isBlocked ? 8 : 6,
          color: isBlocked ? '#f87171' : '#38bdf8',
          opacity: 1,
        });
      });

      polyline.on('mouseout', function () {
        polyline.setStyle({
          weight: isBlocked ? 6 : 4,
          color: isBlocked ? '#ef4444' : '#475569',
          opacity: isBlocked ? 0.95 : 0.6,
        });
      });

      polyline.on('click', () => {
        onToggleRoadBlock(seg.id);
      });

      polyline.bindPopup(`
        <div class="p-2 space-y-2 text-xs text-slate-100 min-w-[210px]">
          <div class="font-bold text-sm text-slate-200">${seg.name}</div>
          <div class="flex items-center space-x-2">
            <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
              isBlocked ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }">
              ${isBlocked ? '⛔ ROAD BLOCKED' : '✅ ROAD PASSABLE'}
            </span>
          </div>
          ${
            seg.blockReason
              ? `<div class="text-xs text-red-300 bg-red-950/50 p-1.5 rounded border border-red-800/40">${seg.blockReason}</div>`
              : ''
          }
          <div class="text-[11px] text-slate-400">
            Distance: ${seg.distanceKm} km • Lanes: ${seg.laneCount} ${
        seg.isFloodProne ? '• <span class="text-cyan-400 font-semibold">Flood Prone</span>' : ''
      }
          </div>
          <button id="popup-btn-toggle-${seg.id}" class="w-full py-1.5 px-3 rounded-lg text-xs font-bold transition-all shadow-md ${
        isBlocked
          ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
          : 'bg-red-600 hover:bg-red-500 text-white'
      }">
            ${isBlocked ? 'Clear Barrier (Unblock Road)' : 'Mark Road As Blocked'}
          </button>
        </div>
      `);

      polyline.addTo(layer);
    });
  }, [segments, showRoads, onToggleRoadBlock]);

  // 3. Render Calculated Dynamic Route
  useEffect(() => {
    const layer = routeLayerRef.current;
    if (!layer) return;
    layer.clearLayers();

    if (!route || route.path.length < 2) return;

    const isAmbulance = profile === 'AMBULANCE';

    // Route Outer Glow
    const glowLine = L.polyline(route.path, {
      color: isAmbulance ? '#06b6d4' : '#10b981',
      weight: isAmbulance ? 10 : 8,
      opacity: 0.4,
      lineCap: 'round',
    });
    glowLine.addTo(layer);

    // Route Core Line
    const coreLine = L.polyline(route.path, {
      color: isAmbulance ? '#22d3ee' : '#34d399',
      weight: isAmbulance ? 5 : 4,
      opacity: 0.95,
      dashArray: isAmbulance ? '10, 8' : undefined,
      lineCap: 'round',
    });

    coreLine.bindPopup(`
      <div class="p-2 space-y-1.5 text-xs text-slate-100 min-w-[220px]">
        <div class="font-bold text-sm ${isAmbulance ? 'text-cyan-400' : 'text-emerald-400'}">
          ${isAmbulance ? '🚑 EMERGENCY AMBULANCE BYPASS ROUTE' : '🛡️ CITIZEN SAFE EVACUATION ROUTE'}
        </div>
        <div class="text-[11px] text-slate-300 font-medium">
          Distance: <span class="font-bold text-white">${route.totalDistanceKm} km</span> • ETA: <span class="font-bold text-white">${route.estimatedTimeMin} min</span>
        </div>
        <div class="text-[11px] text-slate-300">
          Target: <span class="font-bold text-emerald-300">${route.destinationNode.name}</span>
        </div>
        <div class="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-emerald-400">
          Safety Score: ${route.safetyIndexScore}% (Avoided ${route.blockedRoadsAvoided} road blocks)
        </div>
      </div>
    `);

    coreLine.addTo(layer);
  }, [route, profile]);

  // 3.1 Render Live Google Maps Navigation GPS Marker & Heading Beam
  useEffect(() => {
    const layer = navLayerRef.current;
    if (!layer) return;

    if (!navPosition) {
      if (navMarkerRef.current) {
        layer.removeLayer(navMarkerRef.current);
        navMarkerRef.current = null;
      }
      return;
    }

    // Render Google Maps Style Navigation Dot with Heading Cone
    const navMarkerHtml = `
      <div class="relative flex items-center justify-center w-12 h-12 -ml-6 -mt-6">
        <!-- Forward Flashlight Heading Beam -->
        <div 
          class="nav-beam absolute w-16 h-16 origin-bottom pointer-events-none opacity-40 transition-transform duration-75"
          style="
            transform: rotate(${navHeadingDeg}deg) translateY(-28px);
            background: radial-gradient(circle at 50% 100%, rgba(56, 189, 248, 0.8) 0%, rgba(56, 189, 248, 0) 70%);
            clip-path: polygon(50% 100%, 0% 0%, 100% 0%);
          "
        ></div>

        <!-- Pulsing Aura -->
        <div class="w-10 h-10 rounded-full bg-cyan-400/30 animate-ping absolute"></div>
        <div class="w-8 h-8 rounded-full bg-cyan-500/20 absolute"></div>

        <!-- Inner Google Maps Blue Dot -->
        <div class="w-5 h-5 rounded-full bg-sky-500 border-2 border-white shadow-xl shadow-sky-500/80 flex items-center justify-center relative z-10">
          <div 
            class="nav-arrow w-2.5 h-2.5 text-white flex items-center justify-center transition-transform duration-75"
            style="transform: rotate(${navHeadingDeg}deg);"
          >
            ▲
          </div>
        </div>
      </div>
    `;

    if (!navMarkerRef.current) {
      const customNavIcon = L.divIcon({
        html: navMarkerHtml,
        className: 'google-maps-live-nav-marker',
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });
      const marker = L.marker(navPosition, { icon: customNavIcon, zIndexOffset: 2000 });
      marker.bindPopup(`
        <div class="p-2 text-xs text-slate-100 space-y-1">
          <div class="font-bold text-sky-400 flex items-center gap-1">
            <span>🔵 LIVE CITIZEN GPS LOCATION</span>
          </div>
          <div class="text-[11px] text-slate-300">
            Actively navigating via Google Maps Safe Evacuation Guidance.
          </div>
        </div>
      `);
      marker.addTo(layer);
      navMarkerRef.current = marker;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.panTo(navPosition, { animate: true, duration: 0.5 });
      }
    } else {
      navMarkerRef.current.setLatLng(navPosition);
      const markerEl = navMarkerRef.current.getElement();
      if (markerEl) {
        const beam = markerEl.querySelector('.nav-beam') as HTMLElement | null;
        if (beam) {
          beam.style.transform = `rotate(${navHeadingDeg}deg) translateY(-28px)`;
        }
        const arrow = markerEl.querySelector('.nav-arrow') as HTMLElement | null;
        if (arrow) {
          arrow.style.transform = `rotate(${navHeadingDeg}deg)`;
        }
      }

      // Throttled smooth camera follow so it does not cancel animations 25 times per second
      const now = Date.now();
      if (mapInstanceRef.current && now - lastPanTimeRef.current > 1200) {
        const center = mapInstanceRef.current.getCenter();
        const distToCenter = Math.hypot(center.lat - navPosition[0], center.lng - navPosition[1]);
        if (distToCenter > 0.0012 || now - lastPanTimeRef.current > 2500) {
          lastPanTimeRef.current = now;
          mapInstanceRef.current.panTo(navPosition, { animate: true, duration: 0.6 });
        }
      }
    }
  }, [navPosition, navHeadingDeg]);

  // Expose global click handlers for Leaflet HTML popups
  useEffect(() => {
    (window as any).__selectEvacuationShelter = (nodeId: string) => {
      onSelectNodeAsDestination?.(nodeId);
    };
    (window as any).__selectCitizenOrigin = (nodeId: string) => {
      onSelectNodeAsOrigin?.(nodeId);
    };
  }, [onSelectNodeAsDestination, onSelectNodeAsOrigin]);

  // 4. Render Nodes & Static Landmarks (Shelters, Hospitals, Citizen Origin, Depots)
  useEffect(() => {
    const layer = markersLayerRef.current;
    if (!layer) return;
    layer.clearLayers();

    nodes.forEach((node) => {
      let iconHtml = '';
      let popupContent = '';
      const isDestination =
        (route?.destinationNode?.id === node.id || selectedTargetNodeId === node.id) &&
        (node.isShelter || node.isHospital);

      if (node.isCitizenStart) {
        iconHtml = `
          <div class="relative flex items-center justify-center">
            <div class="w-8 h-8 rounded-full bg-rose-500/30 animate-ping absolute"></div>
            <div class="w-7 h-7 rounded-full bg-rose-600 border-2 border-white flex items-center justify-center shadow-lg shadow-rose-500/50">
              <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
        `;
        popupContent = `
          <div class="p-2 space-y-1 text-xs text-slate-100">
            <div class="font-bold text-rose-400 text-sm">📍 Citizen Evacuation Origin</div>
            <div class="text-[11px] text-slate-300">${node.name}</div>
            <div class="text-[10px] text-amber-400 font-mono">STATUS: Inside Active Hazard Perimeter</div>
          </div>
        `;
      } else if (node.isShelter) {
        iconHtml = isDestination
          ? `
            <div class="relative flex items-center justify-center">
              <div class="w-10 h-10 rounded-full bg-emerald-400/40 animate-ping absolute"></div>
              <div class="w-8 h-8 rounded-full bg-emerald-600 border-2 border-white flex items-center justify-center shadow-xl shadow-emerald-500/60 relative z-10">
                <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
            </div>
          `
          : `
            <div class="w-7 h-7 rounded-full bg-emerald-600 border-2 border-emerald-300 flex items-center justify-center shadow-lg shadow-emerald-600/40">
              <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
          `;
        popupContent = `
          <div class="p-2 space-y-1.5 text-xs text-slate-100 min-w-[210px]">
            <div class="flex items-center justify-between">
              <span class="font-bold text-emerald-400 text-sm">🛡️ Verified Safe Shelter</span>
              ${isDestination ? '<span class="text-[9px] bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500 font-bold">ACTIVE TARGET</span>' : ''}
            </div>
            <div class="font-semibold text-slate-200">${node.name}</div>
            <div class="text-[11px] text-slate-300">
              Capacity: <span class="text-white font-bold">${node.currentOccupancy} / ${node.capacity}</span>
            </div>
            <div class="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div class="bg-emerald-500 h-full" style="width: ${(node.currentOccupancy! / node.capacity!) * 100}%"></div>
            </div>
            <div class="text-[10px] text-slate-400">Elevation: ${node.elevationMeters ?? 11}m MSL • Supplies: ${node.supplyLevel}</div>
            ${
              isDestination
                ? '<div class="mt-2 py-1 px-2 rounded bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 font-bold text-center text-[10px]">✅ Destination Target Active</div>'
                : `<button onclick="window.__selectEvacuationShelter('${node.id}')" class="mt-2 w-full py-1.5 px-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-center text-[11px] shadow transition flex items-center justify-center gap-1 cursor-pointer">🧭 Evacuate Here (Safe Route)</button>`
            }
          </div>
        `;
      } else if (node.isHospital) {
        iconHtml = isDestination
          ? `
            <div class="relative flex items-center justify-center">
              <div class="w-10 h-10 rounded-full bg-blue-400/40 animate-ping absolute"></div>
              <div class="w-8 h-8 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center shadow-xl shadow-blue-500/60 relative z-10">
                <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          `
          : `
            <div class="w-7 h-7 rounded-full bg-blue-600 border-2 border-blue-300 flex items-center justify-center shadow-lg shadow-blue-600/40">
              <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          `;
        popupContent = `
          <div class="p-2 space-y-1 text-xs text-slate-100 min-w-[210px]">
            <div class="flex items-center justify-between">
              <span class="font-bold text-blue-400 text-sm">🏥 Trauma Hospital</span>
              ${isDestination ? '<span class="text-[9px] bg-blue-950 text-blue-300 px-1.5 py-0.5 rounded border border-blue-500 font-bold">ACTIVE TARGET</span>' : ''}
            </div>
            <div class="font-semibold text-slate-200">${node.name}</div>
            <div class="text-[11px] text-slate-300">Emergency Beds Available: <span class="text-white font-bold">${node.capacity! - node.currentOccupancy!}</span></div>
            <div class="text-[10px] text-slate-400">Elevation: ${node.elevationMeters ?? 11}m MSL • Trauma Staff: ${node.medicalStaff}</div>
            ${
              isDestination
                ? '<div class="mt-2 py-1 px-2 rounded bg-blue-950/80 border border-blue-500/60 text-blue-300 font-bold text-center text-[10px]">✅ Destination Target Active</div>'
                : `<button onclick="window.__selectEvacuationShelter('${node.id}')" class="mt-2 w-full py-1.5 px-2 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-center text-[11px] shadow transition flex items-center justify-center gap-1 cursor-pointer">🧭 Evacuate to Hospital</button>`
            }
          </div>
        `;
      } else if (node.isEmergencyDepot) {
        iconHtml = `
          <div class="w-7 h-7 rounded-full bg-purple-600 border-2 border-purple-300 flex items-center justify-center shadow-lg shadow-purple-600/40">
            <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
          </div>
        `;
        popupContent = `
          <div class="p-2 space-y-1 text-xs text-slate-100">
            <div class="font-bold text-purple-400 text-sm">📡 Rescue Command Base</div>
            <div class="font-semibold text-slate-200">${node.name}</div>
            <div class="text-[10px] text-slate-400">Emergency Fleet Dispatch Center</div>
          </div>
        `;
      } else {
        // Minor Intersection node
        iconHtml = `
          <div class="w-3 h-3 rounded-full bg-slate-600 border border-slate-400"></div>
        `;
        popupContent = `
          <div class="p-1 space-y-1 text-xs text-slate-300 font-medium">
            <div>${node.name}</div>
            <button onclick="window.__selectCitizenOrigin('${node.id}')" class="mt-1 w-full py-0.5 px-1.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 font-medium text-center text-[10px] border border-cyan-700/50 cursor-pointer">📍 Set as My Starting Location</button>
          </div>
        `;
      }

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-node-icon',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker(node.coordinates, { icon: customIcon });
      marker.bindPopup(popupContent);
      marker.addTo(layer);
    });
  }, [nodes, route, selectedTargetNodeId]);

  // 5. Render Emergency Fleet Units & Active SOS Incidents
  useEffect(() => {
    const layer = unitsLayerRef.current;
    if (!layer) return;
    layer.clearLayers();

    if (showUnits) {
      units.forEach((unit) => {
        let badgeColor = 'bg-cyan-600 border-cyan-300';
        let emoji = '🚑';

        if (unit.type === 'RESCUE_BOAT') {
          badgeColor = 'bg-blue-600 border-blue-300';
          emoji = '🚤';
        } else if (unit.type === 'DRONE_RECON') {
          badgeColor = 'bg-indigo-600 border-indigo-300';
          emoji = '🛸';
        } else if (unit.type === 'FIRE_ENGINE') {
          badgeColor = 'bg-red-600 border-red-300';
          emoji = '🚒';
        }

        const iconHtml = `
          <div class="relative flex items-center justify-center animate-bounce">
            <div class="w-8 h-8 rounded-full ${badgeColor} border-2 text-white flex items-center justify-center text-sm shadow-xl shadow-cyan-500/50">
              ${emoji}
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-unit-icon',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker(unit.currentLocation, { icon: customIcon });
        marker.bindPopup(`
          <div class="p-2 space-y-1.5 text-xs text-slate-100 min-w-[200px]">
            <div class="flex items-center justify-between">
              <span class="font-bold text-cyan-400 text-sm">${unit.name}</span>
              <span class="font-mono text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">${unit.callSign}</span>
            </div>
            <div class="text-[11px] text-slate-300">Status: <span class="font-bold text-white">${unit.status}</span></div>
            <div class="text-[11px] text-slate-300">Speed: <span class="font-bold text-white">${unit.speedKmh} km/h</span> • Battery: <span class="font-bold text-emerald-400">${unit.fuelOrBattery}%</span></div>
            ${unit.assignedIncidentId ? `<div class="text-[10px] text-amber-400">Assigned Call: ${unit.assignedIncidentId}</div>` : ''}
          </div>
        `);
        marker.addTo(layer);
      });
    }

    if (showIncidents) {
      incidents.forEach((inc) => {
        if (inc.status === 'RESOLVED') return;

        const iconHtml = `
          <div class="relative flex items-center justify-center">
            <div class="w-7 h-7 rounded-full bg-rose-600/40 animate-ping absolute"></div>
            <div class="w-6 h-6 rounded-full bg-rose-600 border border-white flex items-center justify-center text-white text-xs font-black shadow-lg">
              !
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-incident-icon',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const marker = L.marker(inc.coordinates, { icon: customIcon });
        marker.bindPopup(`
          <div class="p-2 space-y-1.5 text-xs text-slate-100 min-w-[220px]">
            <div class="font-bold text-rose-400 text-sm flex items-center justify-between">
              <span>🚨 ${inc.title}</span>
            </div>
            <div class="text-[11px] text-slate-300 font-semibold">${inc.address}</div>
            <div class="text-[10px] text-slate-400">${inc.notes}</div>
            <div class="flex items-center justify-between pt-1 border-t border-slate-800 text-[10px] font-mono">
              <span class="text-amber-400 font-bold">${inc.priority}</span>
              <span class="text-slate-400">SOS Callers: ${inc.callerSosCount}</span>
            </div>
          </div>
        `);
        marker.addTo(layer);
      });
    }
  }, [units, incidents, showUnits, showIncidents]);

  // Render Lightning Strikes Swarm
  useEffect(() => {
    if (!lightningLayerRef.current) return;
    const layer = lightningLayerRef.current;
    layer.clearLayers();

    if (!showLightning || !lightningStrikes || lightningStrikes.length === 0) return;

    lightningStrikes.forEach((strike) => {
      // Danger perimeter circle
      const radiusCircle = L.circle(strike.coordinates, {
        radius: strike.riskRadiusMeters || 700,
        color: strike.severity === 'CRITICAL' ? '#f59e0b' : '#38bdf8',
        weight: 1.5,
        opacity: 0.8,
        fillColor: strike.severity === 'CRITICAL' ? '#f59e0b' : '#38bdf8',
        fillOpacity: 0.15,
        dashArray: '4, 4',
      });
      radiusCircle.addTo(layer);

      // Flashing Lightning Marker Icon
      const lightningIcon = L.divIcon({
        className: 'custom-lightning-icon',
        html: `
          <div class="relative flex items-center justify-center w-8 h-8">
            <div class="absolute w-8 h-8 rounded-full bg-amber-500/30 animate-ping"></div>
            <div class="relative w-7 h-7 rounded-full bg-amber-500 border-2 border-amber-200 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/60 text-xs">
              ⚡
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker(strike.coordinates, { icon: lightningIcon });
      marker.bindPopup(`
        <div class="p-2 space-y-1.5 text-xs text-slate-100 min-w-[220px]">
          <div class="font-bold text-amber-400 text-sm flex items-center justify-between">
            <span>⚡ ${strike.locationName}</span>
          </div>
          <div class="text-[11px] text-slate-300">
            <strong>Discharge Type:</strong> ${strike.strikeType === 'CLOUD_TO_GROUND' ? 'Cloud-to-Ground (High Lethality)' : 'Intra-Cloud'}
          </div>
          <div class="text-[11px] text-slate-300">
            <strong>Peak Current:</strong> <span class="text-amber-400 font-mono font-bold">${strike.peakCurrentKA} kA</span>
          </div>
          <div class="text-[10px] text-slate-400">
            Detected ${strike.detectedAgoSec}s ago. High electrostatic voltage within ${strike.riskRadiusMeters}m perimeter.
          </div>
          <div class="pt-1 border-t border-slate-800 text-[10px] font-mono text-amber-300 font-bold">
            ⚠️ 30-30 RULE: AVOID OPEN FIELDS & TREES
          </div>
        </div>
      `);
      marker.addTo(layer);
    });
  }, [lightningStrikes, showLightning]);

  // Render Landslide Inclinometer Borehole Stations
  useEffect(() => {
    if (!landslideLayerRef.current) return;
    const layer = landslideLayerRef.current;
    layer.clearLayers();

    if (!showLandslides || !landslideStations || landslideStations.length === 0) return;

    landslideStations.forEach((st) => {
      const isCritical = st.factorOfSafety < 1.05 || st.displacementRateMmHr > 10.0;
      const isHighCreep = !isCritical && (st.factorOfSafety < 1.3 || st.displacementRateMmHr > 5.0);

      // Hazard Run-out Zone Circle
      const runoutCircle = L.circle(st.coordinates, {
        radius: isCritical ? 650 : 350,
        color: isCritical ? '#dc2626' : isHighCreep ? '#ea580c' : '#10b981',
        weight: 1.5,
        opacity: 0.85,
        fillColor: isCritical ? '#ef4444' : isHighCreep ? '#f97316' : '#10b981',
        fillOpacity: isCritical ? 0.22 : 0.12,
        dashArray: isCritical ? '6, 3' : undefined,
      });
      runoutCircle.addTo(layer);

      // Custom Inclinometer Borehole Marker
      const boreholeIcon = L.divIcon({
        className: 'custom-landslide-icon',
        html: `
          <div class="relative flex items-center justify-center w-8 h-8">
            ${isCritical ? '<div class="absolute w-8 h-8 rounded-full bg-red-600/40 animate-ping"></div>' : ''}
            <div class="relative w-7 h-7 rounded-lg ${
              isCritical
                ? 'bg-red-600 border-2 border-amber-300 text-white shadow-lg shadow-red-600/50'
                : isHighCreep
                ? 'bg-amber-600 border-2 border-amber-200 text-white shadow-md'
                : 'bg-emerald-700 border border-emerald-400 text-white'
            } flex items-center justify-center font-bold text-xs">
              ⛰️
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker(st.coordinates, { icon: boreholeIcon });
      marker.bindPopup(`
        <div class="p-2.5 space-y-2 text-xs text-slate-100 min-w-[240px]">
          <div class="flex items-center justify-between pb-1 border-b border-stone-700">
            <span class="font-bold text-amber-400 text-sm">⛰️ ${st.name}</span>
          </div>
          <div class="grid grid-cols-2 gap-1.5 text-[11px] font-mono bg-stone-900/80 p-2 rounded border border-stone-800">
            <div>
              <span class="text-stone-400">Factor of Safety:</span>
              <div class="font-bold ${(st.factorOfSafety ?? 1.5) < 1.05 ? 'text-red-400' : 'text-emerald-400'}">
                FoS ${(st.factorOfSafety ?? 1.5).toFixed(2)}
              </div>
            </div>
            <div>
              <span class="text-stone-400">Creep Rate:</span>
              <div class="font-bold text-white">${(st.displacementRateMmHr ?? 0).toFixed(1)} mm/h</div>
            </div>
            <div>
              <span class="text-stone-400">Pore Pressure:</span>
              <div class="font-bold text-cyan-400">${st.poreWaterPressureKPa ?? 15} kPa</div>
            </div>
            <div>
              <span class="text-stone-400">Slope Angle:</span>
              <div class="font-bold text-white">${st.slopeAngleDeg ?? 35}&deg;</div>
            </div>
          </div>
          <div class="text-[11px] text-stone-300">
            <strong>Geology:</strong> ${st.soilType}
          </div>
          ${
            st.estimatedFailureEtaMin
              ? `<div class="p-1.5 rounded bg-red-950/60 border border-red-800 text-[10px] text-red-200 font-mono">
                  🚨 Saito Creep Rupture ETA: ~${st.estimatedFailureEtaMin} mins. Immediate runout evacuation.
                </div>`
              : '<div class="text-[10px] text-emerald-400 font-mono">✅ Inclinometer baseline equilibrium stable.</div>'
          }
        </div>
      `);
      marker.addTo(layer);
    });
  }, [landslideStations, showLandslides]);

  // Render Dam & Barrage Hydraulic Nodes
  useEffect(() => {
    if (!damLayerRef.current) return;
    const layer = damLayerRef.current;
    layer.clearLayers();

    if (!showDams || !damStations || damStations.length === 0) return;

    damStations.forEach((dam) => {
      const isBreachRisk = dam.ruptureRiskScore >= 70 || (dam.storageCapacityPercent ?? 0) >= 95;
      const isWarning = !isBreachRisk && (dam.ruptureRiskScore >= 45 || (dam.storageCapacityPercent ?? 0) >= 85);

      // Hydraulic Inundation Buffer Circle
      const surgeCircle = L.circle(dam.coordinates, {
        radius: isBreachRisk ? 1200 : 600,
        color: isBreachRisk ? '#ef4444' : isWarning ? '#f59e0b' : '#06b6d4',
        weight: 1.5,
        opacity: 0.85,
        fillColor: isBreachRisk ? '#b91c1c' : isWarning ? '#d97706' : '#0284c7',
        fillOpacity: isBreachRisk ? 0.28 : 0.12,
        dashArray: isBreachRisk ? '6, 4' : undefined,
      });
      surgeCircle.addTo(layer);

      // Dam Marker
      const damIcon = L.divIcon({
        className: 'custom-dam-icon',
        html: `
          <div class="relative flex items-center justify-center w-8 h-8">
            ${isBreachRisk ? '<div class="absolute w-9 h-9 rounded-full bg-red-600/50 animate-ping"></div>' : ''}
            <div class="relative w-8 h-8 rounded-lg ${
              isBreachRisk
                ? 'bg-red-600 border-2 border-white text-white shadow-xl shadow-red-600/60'
                : isWarning
                ? 'bg-amber-600 border-2 border-amber-200 text-white shadow-md'
                : 'bg-blue-700 border-2 border-cyan-400 text-white shadow-md'
            } flex items-center justify-center font-bold text-sm">
              🌊
            </div>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      const marker = L.marker(dam.coordinates, { icon: damIcon });
      marker.bindPopup(`
        <div class="p-2.5 space-y-2 text-xs text-slate-100 min-w-[250px]">
          <div class="flex items-center justify-between pb-1 border-b border-blue-900/60">
            <span class="font-bold text-cyan-300 text-sm">🌊 ${dam.name}</span>
            <span class="font-mono text-[10px] px-1.5 py-0.5 rounded ${
              dam.alertLevel === 'CODE_RED_RUPTURE_IMMINENT'
                ? 'bg-red-950 text-red-300 border border-red-800'
                : dam.alertLevel === 'HIGH_SURGE_DISCHARGE'
                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                : 'bg-blue-950 text-cyan-300 border border-blue-800'
            }">${dam.alertLevel?.replace(/_/g, ' ') || 'ACTIVE'}</span>
          </div>
          <div class="grid grid-cols-2 gap-1.5 text-[11px] font-mono bg-blue-950/40 p-2 rounded border border-blue-900/50">
            <div>
              <span class="text-slate-400">Inflow Rate:</span>
              <div class="font-bold text-cyan-300">${((dam.inflowCusecs ?? 0) / 1000).toFixed(1)}k cfs</div>
            </div>
            <div>
              <span class="text-slate-400">Outflow Discharge:</span>
              <div class="font-bold text-white">${((dam.outflowCusecs ?? 0) / 1000).toFixed(1)}k cfs</div>
            </div>
            <div>
              <span class="text-slate-400">Storage (% FRL):</span>
              <div class="font-bold ${(dam.storageCapacityPercent ?? 0) >= 90 ? 'text-red-400' : 'text-cyan-400'}">${(dam.storageCapacityPercent ?? 0).toFixed(1)}%</div>
            </div>
            <div>
              <span class="text-slate-400">Spillway Gates:</span>
              <div class="font-bold text-white">${dam.spillwayGatesOpen ?? 0}/${dam.spillwayGatesTotal ?? 1} Open</div>
            </div>
          </div>
          <div class="text-[11px] text-slate-300">
            <strong>Foundation Seepage:</strong> <span class="font-mono ${(dam.seepageRateLps ?? 0) >= 20 ? 'text-red-400 font-bold' : 'text-slate-200'}">${(dam.seepageRateLps ?? 0).toFixed(1)} L/s</span>
          </div>
          ${
            dam.ruptureRiskScore >= 70
              ? `<div class="p-1.5 rounded bg-red-950/80 border border-red-700 text-[10px] text-red-200 font-mono">
                  🚨 FROELICH BREACH PEAK: ~${dam.estimatedBreachWaveEtaMin ?? 35} mins wave arrival downstream. Evacuate river floodplains.
                </div>`
              : '<div class="text-[10px] text-cyan-400 font-mono">✅ Embankment structural integrity monitored.</div>'
          }
        </div>
      `);
      marker.addTo(layer);
    });
  }, [damStations, showDams]);

  const fitBoundsToRoute = () => {
    if (mapInstanceRef.current && route && route.path.length > 0) {
      mapInstanceRef.current.fitBounds(L.latLngBounds(route.path), { padding: [40, 40] });
    }
  };

  return (
    <div
      id="map-view-wrapper"
      className="relative w-full h-full min-h-[480px] lg:min-h-[600px] rounded-xl overflow-hidden border border-slate-800 bg-[#09090B] shadow-2xl flex flex-col"
    >
      {/* Top Map Floating HUD Overlay */}
      <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2 pointer-events-auto">
        <div className="bg-[#0C0C0E]/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 shadow-2xl flex flex-wrap items-center space-x-2 text-xs font-mono">
          <Layers className="w-3.5 h-3.5 text-red-500" />
          <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">LAYERS:</span>

          <button
            onClick={() => setShowZones(!showZones)}
            className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
              showZones ? 'bg-red-950/40 text-red-400 border border-red-900/50' : 'bg-slate-900 text-slate-500 border border-slate-800'
            }`}
          >
            RAG Zones
          </button>

          <button
            onClick={() => setShowRoads(!showRoads)}
            className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
              showRoads ? 'bg-cyan-950/40 text-cyan-300 border border-cyan-800/40' : 'bg-slate-900 text-slate-500 border border-slate-800'
            }`}
          >
            Roads
          </button>

          <button
            onClick={() => setShowUnits(!showUnits)}
            className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
              showUnits ? 'bg-blue-950/40 text-blue-300 border border-blue-800/40' : 'bg-slate-900 text-slate-500 border border-slate-800'
            }`}
          >
            Rescue Units
          </button>

          <button
            onClick={() => setShowDams(!showDams)}
            className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors flex items-center gap-1 ${
              showDams ? 'bg-blue-950/60 text-cyan-300 border border-blue-700/60' : 'bg-slate-900 text-slate-500 border border-slate-800'
            }`}
          >
            <Waves className="w-2.5 h-2.5" />
            <span>Dams / Barrages ({damStations.length})</span>
          </button>

          <button
            onClick={() => setShowLightning(!showLightning)}
            className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors flex items-center gap-1 ${
              showLightning ? 'bg-amber-950/40 text-amber-300 border border-amber-800/50' : 'bg-slate-900 text-slate-500 border border-slate-800'
            }`}
          >
            <Zap className="w-2.5 h-2.5" />
            <span>Lightning Strikes ({lightningStrikes.length})</span>
          </button>

          <button
            onClick={() => setShowLandslides(!showLandslides)}
            className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors flex items-center gap-1 ${
              showLandslides ? 'bg-stone-800 text-amber-300 border border-amber-700/60' : 'bg-slate-900 text-slate-500 border border-slate-800'
            }`}
          >
            <Mountain className="w-2.5 h-2.5" />
            <span>Landslide Stations ({landslideStations.length})</span>
          </button>
        </div>

        {/* Basemap Switcher (Free, Watermark-Free Tiles) */}
        <div className="bg-[#0C0C0E]/95 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-slate-800 shadow-2xl flex items-center space-x-1 text-xs font-mono">
          <span className="text-slate-400 text-[10px] uppercase font-bold mr-1">BASEMAP:</span>
          <button
            id="btn-basemap-dark"
            onClick={() => setBaseMapType('dark')}
            className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
              baseMapType === 'dark'
                ? 'bg-slate-700 text-white font-bold border border-slate-600'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
            title="Tactical Dark Gray (Free, No API Key Required)"
          >
            Tactical Dark
          </button>
          <button
            id="btn-basemap-satellite"
            onClick={() => setBaseMapType('satellite')}
            className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
              baseMapType === 'satellite'
                ? 'bg-blue-900/60 text-cyan-300 font-bold border border-blue-600'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
            title="High Resolution Aerial Satellite"
          >
            Satellite
          </button>
          <button
            id="btn-basemap-street"
            onClick={() => setBaseMapType('street')}
            className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
              baseMapType === 'street'
                ? 'bg-emerald-950/60 text-emerald-300 font-bold border border-emerald-700'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
            title="OpenStreetMap Standard Street Map"
          >
            Streets
          </button>
        </div>

        {hazardFocus && (
          <button
            onClick={() => {
              if (mapInstanceRef.current && hazardFocus) {
                mapInstanceRef.current.flyTo(hazardFocus, 13.5, { duration: 1.0 });
              }
            }}
            className="bg-[#0C0C0E]/95 hover:bg-slate-900 backdrop-blur-md px-3 py-1.5 rounded-lg border border-red-900/60 text-red-400 hover:text-red-300 shadow-2xl flex items-center space-x-1.5 text-xs font-mono font-medium transition-colors"
            title="Focus camera directly on active disaster epicenter"
          >
            <Crosshair className="w-3.5 h-3.5 text-red-400 animate-pulse" />
            <span>Hazard Epicenter</span>
          </button>
        )}

        {route && (
          <button
            onClick={fitBoundsToRoute}
            className="bg-[#0C0C0E]/95 hover:bg-slate-900 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-slate-300 hover:text-white shadow-2xl flex items-center space-x-1.5 text-xs font-mono font-medium transition-colors"
          >
            <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
            <span>Focus Route</span>
          </button>
        )}
      </div>

      {/* Interactive Map Canvas Container */}
      <div ref={mapContainerRef} className="w-full h-full flex-1" />

      {/* Bottom Floating Legend (constrained to leave clear space for bottom-right zoom controls) */}
      <div className="absolute bottom-4 left-4 right-16 z-20 pointer-events-none flex items-center justify-start max-w-[calc(100%-4.5rem)]">
        <div className="bg-[#0C0C0E]/95 backdrop-blur-md px-3.5 py-2 rounded-lg border border-slate-800 shadow-2xl flex flex-wrap items-center gap-3 text-[11px] pointer-events-auto font-mono">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded bg-red-500/80 border border-red-500"></span>
            <span className="text-slate-400">RED (Immediate Evacuation)</span>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded bg-amber-500/80 border border-amber-500"></span>
            <span className="text-slate-400">YELLOW (Stay Alert / Warning)</span>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500/80 border border-emerald-500"></span>
            <span className="text-slate-400">GREEN (Safe Evacuation Zone)</span>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded bg-blue-600 border border-cyan-300 text-white font-bold text-[8px] flex items-center justify-center">🌊</span>
            <span className="text-cyan-300">Dams / Barrages</span>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded bg-amber-400 border border-amber-200 text-slate-950 font-bold text-[8px] flex items-center justify-center">⚡</span>
            <span className="text-amber-400">Lightning Strikes</span>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded bg-amber-700 border border-amber-400 text-white font-bold text-[8px] flex items-center justify-center">⛰️</span>
            <span className="text-amber-300">Landslide Stations</span>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="w-4 h-1 bg-red-500 border-b border-dashed border-red-300"></span>
            <span className="text-slate-400">Blocked Road</span>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className={`w-3.5 h-1.5 rounded-full ${profile === 'AMBULANCE' ? 'bg-cyan-400 shadow-sm shadow-cyan-400' : 'bg-emerald-400 shadow-sm shadow-emerald-400'}`}></span>
            <span className="text-white font-bold">{profile === 'AMBULANCE' ? 'PRIORITY BYPASS' : 'SAFE PATH'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
