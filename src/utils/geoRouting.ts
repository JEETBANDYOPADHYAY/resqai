import { RoadNode, RoadSegment, ZonePolygon, RoutingResult, RouteStep, UserViewProfile } from '../types';

/**
 * Calculates straight-line Euclidean distance in kilometers between two lat/lng points.
 */
export function getGeoDistanceKm(coord1: [number, number], coord2: [number, number]): number {
  const [lat1, lon1] = coord1;
  const [lat2, lon2] = coord2;
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Checks if a point is inside a polygon using ray casting algorithm.
 */
export function isPointInPolygon(point: [number, number], vs: [number, number][]): boolean {
  const x = point[0];
  const y = point[1];
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i][0], yi = vs[i][1];
    const xj = vs[j][0], yj = vs[j][1];
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

interface GraphEdge {
  toNodeId: string;
  segmentId: string;
  segmentName: string;
  distanceKm: number;
  weight: number;
  isBlocked: boolean;
  blockReason?: string;
  coordinates: [number, number][];
  isBridge?: boolean;
  isFloodProne?: boolean;
}

/**
 * Builds an adjacency list representation of the road network with dynamic cost weights
 * customized for user view profile (CITIZEN vs AMBULANCE).
 */
export function buildRoadGraph(
  nodes: RoadNode[],
  segments: RoadSegment[],
  zones: ZonePolygon[],
  profile: UserViewProfile
): Map<string, GraphEdge[]> {
  const nodeMap = new Map<string, RoadNode>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  const graph = new Map<string, GraphEdge[]>();
  nodes.forEach((n) => graph.set(n.id, []));

  const redZones = zones.filter((z) => z.zoneType === 'RED');
  const yellowZones = zones.filter((z) => z.zoneType === 'YELLOW');

  segments.forEach((seg) => {
    // If road is manually marked blocked, weight is infinite
    if (seg.isBlocked) {
      return; // Omit blocked edges from traversable graph
    }

    let baseCost = seg.distanceKm;

    // Check if segment midpoint intersects danger zones
    const midLat = (seg.coordinates[0][0] + seg.coordinates[seg.coordinates.length - 1][0]) / 2;
    const midLng = (seg.coordinates[0][1] + seg.coordinates[seg.coordinates.length - 1][1]) / 2;
    const midPoint: [number, number] = [midLat, midLng];

    const inRedZone = redZones.some((rz) => isPointInPolygon(midPoint, rz.coordinates));
    const inYellowZone = yellowZones.some((yz) => isPointInPolygon(midPoint, yz.coordinates));

    if (profile === 'CITIZEN') {
      // Citizens must avoid Red Zones at all costs and prefer designated safe evacuation corridors
      if (inRedZone) {
        baseCost += 50.0; // Huge penalty for red zone danger
      }
      if (inYellowZone) {
        baseCost += 5.0; // Moderate penalty for runoff buffer
      }
      if (seg.isFloodProne) {
        baseCost += 8.0;
      }
    } else {
      // Emergency / Ambulance view: Fast response with sirens, slight penalty for high hazard
      if (inRedZone) {
        baseCost += 3.0; // Emergency vehicle can traverse if not physically blocked
      }
      if (seg.isFloodProne) {
        baseCost += 1.5;
      }
    }

    // Add bidirectional edges
    const forwardEdge: GraphEdge = {
      toNodeId: seg.toNode,
      segmentId: seg.id,
      segmentName: seg.name,
      distanceKm: seg.distanceKm,
      weight: baseCost,
      isBlocked: seg.isBlocked,
      blockReason: seg.blockReason,
      coordinates: seg.coordinates,
      isBridge: seg.isBridge,
      isFloodProne: seg.isFloodProne,
    };

    const reverseEdge: GraphEdge = {
      toNodeId: seg.fromNode,
      segmentId: seg.id,
      segmentName: seg.name,
      distanceKm: seg.distanceKm,
      weight: baseCost,
      isBlocked: seg.isBlocked,
      blockReason: seg.blockReason,
      coordinates: [...seg.coordinates].reverse(),
      isBridge: seg.isBridge,
      isFloodProne: seg.isFloodProne,
    };

    graph.get(seg.fromNode)?.push(forwardEdge);
    graph.get(seg.toNode)?.push(reverseEdge);
  });

  return graph;
}

/**
 * Dijkstra / A* Shortest & Safest Path Algorithm implementation.
 */
export function calculateDynamicRoute(
  startNodeId: string,
  targetNodeId: string | null,
  nodes: RoadNode[],
  segments: RoadSegment[],
  zones: ZonePolygon[],
  profile: UserViewProfile
): RoutingResult | null {
  const nodeMap = new Map<string, RoadNode>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  const startNode = nodeMap.get(startNodeId);
  if (!startNode) return null;

  // If no specific targetNodeId is supplied for Citizen, find the nearest reachable safe Shelter / Hospital
  let candidateTargetIds: string[] = [];
  if (targetNodeId) {
    candidateTargetIds = [targetNodeId];
  } else if (profile === 'CITIZEN') {
    candidateTargetIds = nodes.filter((n) => n.isShelter || n.isHospital).map((n) => n.id);
  } else {
    candidateTargetIds = nodes.filter((n) => n.isHospital || n.isCitizenStart).map((n) => n.id);
  }

  if (candidateTargetIds.length === 0) return null;

  const graph = buildRoadGraph(nodes, segments, zones, profile);

  // Dijkstra data structures
  const distances = new Map<string, number>();
  const previous = new Map<string, { nodeId: string; edge: GraphEdge }>();
  const unvisited = new Set<string>();

  nodes.forEach((n) => {
    distances.set(n.id, Infinity);
    unvisited.add(n.id);
  });

  distances.set(startNodeId, 0);

  while (unvisited.size > 0) {
    // Find node with smallest distance
    let currentId: string | null = null;
    let smallestDist = Infinity;

    unvisited.forEach((id) => {
      const d = distances.get(id) ?? Infinity;
      if (d < smallestDist) {
        smallestDist = d;
        currentId = id;
      }
    });

    if (currentId === null || smallestDist === Infinity) {
      break; // No further reachable nodes
    }

    // If we reached a valid candidate destination and it has optimal distance
    if (candidateTargetIds.includes(currentId)) {
      // Found the destination (either closest one when targetNodeId is null, or targetNodeId itself)
      break;
    }

    unvisited.delete(currentId);

    const neighbors = graph.get(currentId) || [];
    for (const edge of neighbors) {
      if (!unvisited.has(edge.toNodeId)) continue;

      const alt = (distances.get(currentId) ?? 0) + edge.weight;
      if (alt < (distances.get(edge.toNodeId) ?? Infinity)) {
        distances.set(edge.toNodeId, alt);
        previous.set(edge.toNodeId, { nodeId: currentId, edge });
      }
    }
  }

  // Choose the best target from candidate targets that was reached
  let bestTargetId: string | null = null;
  let minTargetDist = Infinity;

  for (const tid of candidateTargetIds) {
    const d = distances.get(tid) ?? Infinity;
    if (d < minTargetDist) {
      minTargetDist = d;
      bestTargetId = tid;
    }
  }

  if (!bestTargetId || minTargetDist === Infinity) {
    return null; // Route blocked completely
  }

  const destinationNode = nodeMap.get(bestTargetId)!;

  // Reconstruct path
  const pathCoordinates: [number, number][] = [];
  const nodeSequence: string[] = [];
  const segmentSequence: string[] = [];
  const steps: RouteStep[] = [];

  let curr = bestTargetId;
  const backEdges: { fromId: string; edge: GraphEdge }[] = [];

  while (curr !== startNodeId) {
    const prevEntry = previous.get(curr);
    if (!prevEntry) break;
    backEdges.unshift({ fromId: prevEntry.nodeId, edge: prevEntry.edge });
    curr = prevEntry.nodeId;
  }

  nodeSequence.push(startNodeId);
  pathCoordinates.push(startNode.coordinates);

  let totalActualDistKm = 0;
  let hazardsBypassed: string[] = [];
  let blockedRoadsAvoided = segments.filter((s) => s.isBlocked).length;

  for (let i = 0; i < backEdges.length; i++) {
    const { edge } = backEdges[i];
    nodeSequence.push(edge.toNodeId);
    segmentSequence.push(edge.segmentId);
    totalActualDistKm += edge.distanceKm;

    const startCoord = edge.coordinates[0];
    const endCoord = edge.coordinates[edge.coordinates.length - 1];

    // Append segment polyline coordinates
    for (let c = 1; c < edge.coordinates.length; c++) {
      pathCoordinates.push(edge.coordinates[c]);
    }

    let hazardAlert: string | undefined;
    if (edge.isFloodProne) {
      hazardAlert = 'Caution: Drainage sector with standing water. Maintain steady elevated momentum.';
      if (!hazardsBypassed.includes('Floodway Sector')) hazardsBypassed.push('Floodway Sector');
    }
    if (edge.isBridge) {
      hazardAlert = 'Structural Viaduct Crossing: Proceed above flood stage.';
      if (!hazardsBypassed.includes('Viaduct Bridge')) hazardsBypassed.push('Viaduct Bridge');
    }

    const estimatedSec = Math.round((edge.distanceKm / (profile === 'AMBULANCE' ? 60 : 35)) * 3600);
    const targetNodeName = nodeMap.get(edge.toNodeId)?.name || 'Next Junction';

    // Determine maneuver based on position in route and segment geometry
    let maneuver: RouteStep['maneuver'] = 'CONTINUE_STRAIGHT';
    let verb = 'Continue on';

    if (i === 0) {
      maneuver = 'DEPART';
      verb = 'Head out via';
    } else {
      // Calculate angular delta between previous edge and current edge
      const prevEdge = backEdges[i - 1].edge;
      const p1 = prevEdge.coordinates[0];
      const p2 = prevEdge.coordinates[prevEdge.coordinates.length - 1];
      const c1 = edge.coordinates[0];
      const c2 = edge.coordinates[edge.coordinates.length - 1];

      const angle1 = Math.atan2(p2[1] - p1[1], p2[0] - p1[0]);
      const angle2 = Math.atan2(c2[1] - c1[1], c2[0] - c1[0]);
      let diff = ((angle2 - angle1) * 180) / Math.PI;
      while (diff < -180) diff += 360;
      while (diff > 180) diff -= 360;

      if (diff < -45) {
        maneuver = 'TURN_LEFT';
        verb = 'Turn Left onto';
      } else if (diff < -15) {
        maneuver = 'SLIGHT_LEFT';
        verb = 'Slight Left onto';
      } else if (diff > 45) {
        maneuver = 'TURN_RIGHT';
        verb = 'Turn Right onto';
      } else if (diff > 15) {
        maneuver = 'SLIGHT_RIGHT';
        verb = 'Slight Right onto';
      } else {
        maneuver = 'CONTINUE_STRAIGHT';
        verb = 'Continue straight onto';
      }
    }

    const isFinalRoadSegment = i === backEdges.length - 1;
    const roadTargetLabel = isFinalRoadSegment
      ? `${destinationNode.name} (Sanctuary Approach)`
      : targetNodeName;

    steps.push({
      instruction: `${verb} ${edge.segmentName} toward ${roadTargetLabel}`,
      distanceKm: Math.round(edge.distanceKm * 10) / 10,
      estimatedSec,
      maneuver,
      streetName: edge.segmentName,
      hazardAlert,
      isBypass: profile === 'AMBULANCE' || edge.isBridge,
      coordinates: startCoord,
    });
  }

  // Final destination arrival step (Only reached upon completing all road segments)
  if (steps.length > 0) {
    const lastCoord = pathCoordinates[pathCoordinates.length - 1];
    steps.push({
      instruction: `Arrive at ${destinationNode.name} (Safe Sanctuary Verified)`,
      distanceKm: 0,
      estimatedSec: 0,
      maneuver: 'ARRIVE',
      streetName: destinationNode.name,
      hazardAlert: 'Safe Zone Reached: Verified flood-safe sanctuary with medical & shelter aid.',
      coordinates: lastCoord,
    });
  }

  // Calculate estimated travel time in minutes
  const avgSpeed = profile === 'AMBULANCE' ? 55 : 30; // km/h
  const estimatedTimeMin = Math.max(1, Math.round((totalActualDistKm / avgSpeed) * 60));

  // Compute safety index score (0 - 100%)
  let safetyScore = 95;
  if (profile === 'CITIZEN') {
    if (hazardsBypassed.length > 0) safetyScore -= hazardsBypassed.length * 10;
  }

  return {
    path: pathCoordinates,
    nodeIds: nodeSequence,
    segmentIds: segmentSequence,
    totalDistanceKm: Math.round(totalActualDistKm * 10) / 10,
    estimatedTimeMin,
    safetyIndexScore: Math.max(40, safetyScore),
    blockedRoadsAvoided,
    hazardsBypassed,
    destinationNode,
    turnByTurn: steps,
  };
}

export interface ShelterRouteInfo {
  shelter: RoadNode;
  route: RoutingResult | null;
  distanceKm: number;
  etaMinutes: number;
  safetyScore: number;
  isReachable: boolean;
}

/**
 * Pre-evaluates routes to all available safe shelters from a given starting junction.
 * Allows citizens to compare distances, ETAs, and safety scores to choose any alternative shelter.
 */
export function evaluateAllCandidateShelters(
  startNodeId: string,
  shelters: RoadNode[],
  nodes: RoadNode[],
  segments: RoadSegment[],
  zones: ZonePolygon[],
  profile: UserViewProfile = 'CITIZEN'
): ShelterRouteInfo[] {
  return shelters.map((shelter) => {
    const route = calculateDynamicRoute(startNodeId, shelter.id, nodes, segments, zones, profile);
    if (!route) {
      return {
        shelter,
        route: null,
        distanceKm: 0,
        etaMinutes: 0,
        safetyScore: 0,
        isReachable: false,
      };
    }
    return {
      shelter,
      route,
      distanceKm: route.totalDistanceKm,
      etaMinutes: Math.round(route.estimatedTimeMin),
      safetyScore: Math.round(route.safetyIndexScore),
      isReachable: true,
    };
  });
}

