import { prisma, type Suggestion } from "@workspace/db";

export type SuggestionRow = Suggestion;

export async function findSuggestionById(id: string): Promise<Suggestion | null> {
  return prisma.suggestion.findUnique({ where: { id } });
}

/**
 * Fetch suggestions within a bounding box around (lat, lng), then rank in JS
 * by haversine distance and click_count. We use a bounding box (cheap index
 * scan on (lat, lng)) and refine with the precise distance formula.
 */
export async function findNearbySuggestions(
  lat: number,
  lng: number,
  radiusKm: number,
  limit: number,
): Promise<Suggestion[]> {
  // Approx 1° latitude ≈ 111km; longitude varies with cos(lat).
  const latDelta = radiusKm / 111;
  const lngDelta = radiusKm / (111 * Math.max(Math.cos((lat * Math.PI) / 180), 0.01));

  return prisma.suggestion.findMany({
    where: {
      lat: { gte: lat - latDelta, lte: lat + latDelta },
      lng: { gte: lng - lngDelta, lte: lng + lngDelta },
    },
    orderBy: [{ clickCount: "desc" }],
    take: limit * 4, // overfetch for re-ranking; final slice happens in service
  });
}

/**
 * Search suggestions globally by text prefix (case-insensitive). Useful when
 * geolocation isn't available, or as a fallback for global trending.
 */
export async function searchSuggestionsByText(
  query: string,
  limit: number,
): Promise<Suggestion[]> {
  if (query.length < 1) return [];
  return prisma.suggestion.findMany({
    where: { text: { contains: query, mode: "insensitive" } },
    orderBy: [{ clickCount: "desc" }],
    take: limit,
  });
}

export async function findSuggestionByTextNearby(
  text: string,
  lat: number,
  lng: number,
  radiusKm: number,
): Promise<Suggestion | null> {
  const latDelta = radiusKm / 111;
  const lngDelta = radiusKm / (111 * Math.max(Math.cos((lat * Math.PI) / 180), 0.01));

  return prisma.suggestion.findFirst({
    where: {
      text: { equals: text, mode: "insensitive" },
      lat: { gte: lat - latDelta, lte: lat + latDelta },
      lng: { gte: lng - lngDelta, lte: lng + lngDelta },
    },
  });
}

export async function createSuggestion(data: {
  text: string;
  lat: number;
  lng: number;
}): Promise<Suggestion> {
  return prisma.suggestion.create({ data });
}

export async function incrementClickCount(id: string): Promise<Suggestion | null> {
  try {
    return await prisma.suggestion.update({
      where: { id },
      data: { clickCount: { increment: 1 } },
    });
  } catch {
    return null;
  }
}

export async function findTrendingSuggestions(limit: number): Promise<Suggestion[]> {
  return prisma.suggestion.findMany({
    orderBy: [{ clickCount: "desc" }, { createdAt: "desc" }],
    take: limit,
  });
}
