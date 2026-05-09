import {
  findNearbySuggestions,
  searchSuggestionsByText,
  findSuggestionByTextNearby,
  createSuggestion,
  incrementClickCount,
  findTrendingSuggestions,
  type SuggestionRow,
} from "../models/suggestion.model";
import { redis } from "../lib/redis";

const CACHE_TTL_SECONDS = 300; // 5 minutes
const DEFAULT_RADIUS_KM = 50;
const DEFAULT_LIMIT = 10;
const DEDUPE_RADIUS_KM = 5;

export interface RankedSuggestion {
  id: string;
  text: string;
  lat: number;
  lng: number;
  clickCount: number;
  distanceKm: number | null;
  createdAt: Date;
}

/** Haversine distance between two points, in kilometers. */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * Compose a sort score combining proximity and popularity.
 * Lower distance = higher rank. Higher click count = higher rank.
 * We invert distance into a "proximity score" so both dimensions are additive.
 */
function rankScore(distanceKm: number, clickCount: number, radiusKm: number): number {
  const proximity = Math.max(0, 1 - distanceKm / radiusKm); // 1 (here) → 0 (edge)
  const popularity = Math.log1p(clickCount); // diminishing returns
  return proximity * 2 + popularity;
}

function quantize(n: number, step = 0.5): number {
  return Math.round(n / step) * step;
}

function cacheKey(lat: number | null, lng: number | null): string {
  if (lat == null || lng == null) return "suggestions:global";
  return `suggestions:${quantize(lat)}:${quantize(lng)}`;
}

function toResponse(s: SuggestionRow, distanceKm: number | null): RankedSuggestion {
  return {
    id: s.id,
    text: s.text,
    lat: s.lat,
    lng: s.lng,
    clickCount: s.clickCount,
    distanceKm: distanceKm == null ? null : Math.round(distanceKm * 10) / 10,
    createdAt: s.createdAt,
  };
}

export async function getSuggestions(opts: {
  lat?: number | null;
  lng?: number | null;
  query?: string | null;
  limit?: number;
}): Promise<RankedSuggestion[]> {
  const limit = opts.limit ?? DEFAULT_LIMIT;
  const hasGeo = opts.lat != null && opts.lng != null;
  const queryTerm = (opts.query ?? "").trim().toLowerCase();

  // Cache only the focus-default case (no query). Text-filtered queries are
  // too varied and short-lived to benefit from caching.
  const useCache = !queryTerm;
  const key = cacheKey(opts.lat ?? null, opts.lng ?? null);

  if (useCache) {
    const cached = await redis.get(key);
    if (cached) {
      try {
        return JSON.parse(cached) as RankedSuggestion[];
      } catch {
        /* fall through */
      }
    }
  }

  let candidates: SuggestionRow[];
  if (hasGeo) {
    candidates = await findNearbySuggestions(opts.lat!, opts.lng!, DEFAULT_RADIUS_KM, limit);
    // If radius yields nothing, fall back to global trending (still useful).
    if (candidates.length === 0) {
      candidates = await findTrendingSuggestions(limit);
    }
  } else if (queryTerm.length >= 1) {
    candidates = await searchSuggestionsByText(queryTerm, limit * 4);
  } else {
    candidates = await findTrendingSuggestions(limit);
  }

  // Optional text filtering on top of geo candidates
  if (queryTerm) {
    candidates = candidates.filter((c) => c.text.toLowerCase().includes(queryTerm));
  }

  const ranked = candidates
    .map((c) => {
      const distance = hasGeo ? haversineKm(opts.lat!, opts.lng!, c.lat, c.lng) : null;
      return { row: c, distance };
    })
    .filter(({ distance }) => distance == null || distance <= DEFAULT_RADIUS_KM)
    .sort((a, b) => {
      if (a.distance != null && b.distance != null) {
        return (
          rankScore(b.distance, b.row.clickCount, DEFAULT_RADIUS_KM) -
          rankScore(a.distance, a.row.clickCount, DEFAULT_RADIUS_KM)
        );
      }
      return b.row.clickCount - a.row.clickCount;
    })
    .slice(0, limit)
    .map(({ row, distance }) => toResponse(row, distance));

  if (useCache) {
    await redis.set(key, JSON.stringify(ranked), CACHE_TTL_SECONDS);
  }

  return ranked;
}

export async function recordSuggestionClick(id: string): Promise<RankedSuggestion | null> {
  const updated = await incrementClickCount(id);
  if (!updated) return null;
  // Invalidate the broad regional cache for this point so the new click count
  // is reflected on next focus.
  await redis.del(cacheKey(updated.lat, updated.lng));
  return toResponse(updated, null);
}

export async function saveSearch(input: {
  text: string;
  lat?: number | null;
  lng?: number | null;
}): Promise<{ created: boolean; suggestion: RankedSuggestion | null }> {
  const text = input.text.trim();
  if (text.length < 3) return { created: false, suggestion: null };

  const sanitized = text.replace(/\s+/g, " ").slice(0, 100);
  const lat = input.lat ?? null;
  const lng = input.lng ?? null;

  // De-dupe nearby identical text. If geo missing, just check globally.
  if (lat != null && lng != null) {
    const existing = await findSuggestionByTextNearby(sanitized, lat, lng, DEDUPE_RADIUS_KM);
    if (existing) {
      const updated = await incrementClickCount(existing.id);
      await redis.del(cacheKey(existing.lat, existing.lng));
      return { created: false, suggestion: updated ? toResponse(updated, 0) : null };
    }
  }

  // Without geo we just create a global entry at (0,0). It'll surface via
  // global trending fallback.
  const created = await createSuggestion({
    text: sanitized,
    lat: lat ?? 0,
    lng: lng ?? 0,
  });

  if (lat != null && lng != null) {
    await redis.del(cacheKey(lat, lng));
  }

  return { created: true, suggestion: toResponse(created, 0) };
}
