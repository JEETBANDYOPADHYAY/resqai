import { RoadNode, RoadSegment, ZonePolygon, EmergencyUnit, RoutingResult } from '../types';

export interface CachedOfflineData {
  version: string;
  cachedAt: string;
  nodes: RoadNode[];
  segments: RoadSegment[];
  zones: ZonePolygon[];
  units: EmergencyUnit[];
  lastKnownOriginNodeId?: string;
  cachedRoute?: RoutingResult | null;
}

const STORAGE_KEY = 'resqai_offline_pack_v1';

/**
 * Save core operational data to localStorage for 100% autonomous offline routing
 */
export function saveToOfflineCache(data: {
  nodes: RoadNode[];
  segments: RoadSegment[];
  zones: ZonePolygon[];
  units?: EmergencyUnit[];
  lastKnownOriginNodeId?: string;
  cachedRoute?: RoutingResult | null;
}): boolean {
  try {
    const payload: CachedOfflineData = {
      version: '1.2.0',
      cachedAt: new Date().toISOString(),
      nodes: data.nodes,
      segments: data.segments,
      zones: data.zones,
      units: data.units || [],
      lastKnownOriginNodeId: data.lastKnownOriginNodeId,
      cachedRoute: data.cachedRoute,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch (err) {
    console.warn('[ResQAI Offline] Failed to persist data to localStorage:', err);
    return false;
  }
}

/**
 * Load offline disaster dataset from local cache
 */
export function loadFromOfflineCache(): CachedOfflineData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CachedOfflineData;
  } catch (err) {
    console.warn('[ResQAI Offline] Failed to read from localStorage:', err);
    return null;
  }
}

/**
 * Get offline cache statistics for display
 */
export function getOfflineCacheStatus(): {
  isCached: boolean;
  nodeCount: number;
  segmentCount: number;
  safeZoneCount: number;
  shelterCount: number;
  cachedAt: string | null;
} {
  const cached = loadFromOfflineCache();
  if (!cached) {
    return {
      isCached: false,
      nodeCount: 0,
      segmentCount: 0,
      safeZoneCount: 0,
      shelterCount: 0,
      cachedAt: null,
    };
  }
  const shelterCount = cached.nodes?.filter((n) => n.isShelter).length || 0;
  return {
    isCached: true,
    nodeCount: cached.nodes?.length || 0,
    segmentCount: cached.segments?.length || 0,
    safeZoneCount: cached.zones?.filter((z) => z.zoneType === 'GREEN').length || 0,
    shelterCount,
    cachedAt: cached.cachedAt || null,
  };
}
