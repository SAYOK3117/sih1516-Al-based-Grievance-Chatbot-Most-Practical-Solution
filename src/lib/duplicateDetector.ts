// Configurable search radius in meters for duplicate detection
export const DEFAULT_DUPLICATE_RADIUS_METERS = 500;

/**
 * Haversine formula to compute distance between two geographical points in meters.
 */
export function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Token-based Jaccard similarity score between two text strings (0 to 1).
 */
export function calculateTextSimilarity(text1: string, text2: string): number {
  const tokenize = (str: string) => {
    return new Set(
      str.toLowerCase()
         .replace(/[^\w\s]/g, '')
         .split(/\s+/)
         .filter(w => w.length > 2)
    );
  };

  const tokens1 = tokenize(text1);
  const tokens2 = tokenize(text2);

  if (tokens1.size === 0 || tokens2.size === 0) return 0;

  let intersection = 0;
  tokens1.forEach(t => {
    if (tokens2.has(t)) intersection++;
  });

  const union = new Set([...tokens1, ...tokens2]).size;
  return union > 0 ? intersection / union : 0;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  confidenceScore: number; // 0 to 100
  matchedMasterIssueId?: string;
  matchedGrievanceId?: string;
  matchedTitle?: string;
  distanceMeters: number;
  reason: string;
}

/**
 * Analyze a candidate grievance against existing Master Issues and Grievances.
 */
export function detectDuplicates(
  candidate: { title: string; description: string; dept: string; lat: number; lng: number },
  existingMasterIssues: Array<{ id: string; title: string; dept: string; lat: number; lng: number; status: string }>,
  existingGrievances: Array<{ id: string; title: string; dept: string; lat: number; lng: number; status: string; masterIssueId?: string }>,
  radiusMeters: number = DEFAULT_DUPLICATE_RADIUS_METERS
): DuplicateCheckResult {
  let bestMatch: DuplicateCheckResult = {
    isDuplicate: false,
    confidenceScore: 0,
    distanceMeters: Infinity,
    reason: 'No spatial or semantic duplicates found.'
  };

  if (!candidate.lat || !candidate.lng) {
    return bestMatch;
  }

  // 1. Check against active Master Issues
  for (const mi of existingMasterIssues) {
    if (mi.status === 'Resolved') continue;
    if (!mi.lat || !mi.lng) continue;

    const dist = calculateDistanceMeters(candidate.lat, candidate.lng, mi.lat, mi.lng);

    if (dist <= radiusMeters) {
      const deptMatch = candidate.dept === mi.dept;
      const textSim = calculateTextSimilarity(candidate.title + ' ' + candidate.description, mi.title);
      
      // Calculate weighted score: Spatial (50%) + Category/Dept (20%) + Text Similarity (30%)
      const spatialScore = Math.max(0, 1 - (dist / radiusMeters));
      const deptScore = deptMatch ? 1 : 0.3;
      
      let confidence = (spatialScore * 50) + (deptScore * 20) + (textSim * 30);
      confidence = Math.min(98, Math.round(confidence));

      if (confidence > bestMatch.confidenceScore) {
        bestMatch = {
          isDuplicate: confidence >= 75,
          confidenceScore: confidence,
          matchedMasterIssueId: mi.id,
          matchedTitle: mi.title,
          distanceMeters: Math.round(dist),
          reason: `High spatial proximity (${Math.round(dist)}m away) and matching problem category (${mi.dept}).`
        };
      }
    }
  }

  // 2. Check against individual existing grievances if no high-confidence Master Issue matched yet
  if (bestMatch.confidenceScore < 90) {
    for (const g of existingGrievances) {
      if (g.status === 'Resolved') continue;
      if (!g.lat || !g.lng) continue;

      const dist = calculateDistanceMeters(candidate.lat, candidate.lng, g.lat, g.lng);

      if (dist <= radiusMeters) {
        const deptMatch = candidate.dept === g.dept;
        const textSim = calculateTextSimilarity(candidate.title + ' ' + candidate.description, g.title);

        const spatialScore = Math.max(0, 1 - (dist / radiusMeters));
        const deptScore = deptMatch ? 1 : 0.3;

        let confidence = (spatialScore * 50) + (deptScore * 20) + (textSim * 30);
        confidence = Math.min(95, Math.round(confidence));

        if (confidence > bestMatch.confidenceScore) {
          bestMatch = {
            isDuplicate: confidence >= 75,
            confidenceScore: confidence,
            matchedGrievanceId: g.id,
            matchedMasterIssueId: g.masterIssueId,
            matchedTitle: g.title,
            distanceMeters: Math.round(dist),
            reason: `Direct spatial overlap (${Math.round(dist)}m away) with report ${g.id}.`
          };
        }
      }
    }
  }

  return bestMatch;
}
