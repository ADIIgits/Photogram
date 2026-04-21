import type { Request, Response } from "express";
import {
  getSuggestions as getSuggestionsService,
  recordSuggestionClick,
  saveSearch as saveSearchService,
} from "../services/suggestion.service";

function parseFloatOrNull(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
}

export async function getSuggestions(req: Request, res: Response): Promise<void> {
  const lat = parseFloatOrNull(req.query.lat);
  const lng = parseFloatOrNull(req.query.lng);
  const q = typeof req.query.q === "string" ? req.query.q : null;
  const limitRaw = parseFloatOrNull(req.query.limit);
  const limit = limitRaw ? Math.min(Math.max(Math.floor(limitRaw), 1), 25) : 10;

  const suggestions = await getSuggestionsService({ lat, lng, query: q, limit });
  res.json({ suggestions });
}

export async function clickSuggestion(req: Request, res: Response): Promise<void> {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!id || typeof id !== "string") throw Object.assign(new Error("Missing id"), { status: 400 });

  const updated = await recordSuggestionClick(id);
  if (!updated) throw Object.assign(new Error("Suggestion not found"), { status: 404 });

  res.json(updated);
}

export async function saveSearch(req: Request, res: Response): Promise<void> {
  const text = typeof req.body?.text === "string" ? req.body.text : "";
  const lat = parseFloatOrNull(req.body?.lat);
  const lng = parseFloatOrNull(req.body?.lng);

  const result = await saveSearchService({ text, lat, lng });
  res.json(result);
}
