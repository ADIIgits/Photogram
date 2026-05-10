/* SearchBar.tsx — search input with live autocomplete suggestions.
 *
 * How it works:
 *   1. On focus, requests geolocation permission (optional — used to sort
 *      nearby location suggestions higher).
 *   2. As the user types, waits 300 ms (debounce) then fetches suggestions
 *      from GET /search/suggestions?q=... via the API client.
 *   3. Clicking a suggestion records the click (for popularity ranking), then
 *      navigates to /discover?q=<text>.
 *   4. Submitting the form saves the search to history and navigates.
 *   5. Clicking outside the container closes the dropdown.
 *
 * Z-index: the suggestion dropdown is position:absolute and rendered inside
 * this component. The parent page must NOT use overflow:hidden on any ancestor
 * of this component or the dropdown will be clipped. */

import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { Search, MapPin, Loader2, TrendingUp } from "lucide-react";
import {
  getSuggestions,
  clickSuggestion,
  saveSearch,
  type Suggestion,
} from "@workspace/api-client-react";

interface UserLocation {
  lat: number;
  lng: number;
}

/* Generic debounce hook — delays emitting a new value until the input settles */
function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/* Lazily requests the browser's geolocation.
 * Only asks once; subsequent calls are no-ops.
 * Permission denied is silently ignored — geo is optional. */
function useGeolocation() {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [requested, setRequested] = useState(false);

  const request = useCallback(() => {
    if (requested || !navigator.geolocation) {
      setRequested(true);
      return;
    }
    setRequested(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => { /* permission denied — proceed without geo */ },
      { timeout: 5000, maximumAge: 60_000 * 10 },
    );
  }, [requested]);

  return { location, request };
}

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  /* Sequence counter prevents stale responses from overwriting newer ones */
  const requestSeq = useRef(0);

  const { location: userLocation, request: requestGeo } = useGeolocation();
  const debouncedQuery = useDebouncedValue(query, 300);

  /* Fetch suggestions from the API, ignoring out-of-order responses */
  const fetchSuggestions = useCallback(
    async (q: string) => {
      const seq = ++requestSeq.current;
      setLoading(true);
      try {
        const params: Record<string, string> = {};
        if (userLocation) {
          params.lat = String(userLocation.lat);
          params.lng = String(userLocation.lng);
        }
        if (q.trim()) params.q = q.trim();
        const res = await getSuggestions(Object.keys(params).length ? params : undefined);
        /* Only apply results if this response is still the latest */
        if (seq === requestSeq.current) {
          setSuggestions(res.suggestions);
        }
      } catch {
        if (seq === requestSeq.current) setSuggestions([]);
      } finally {
        if (seq === requestSeq.current) setLoading(false);
      }
    },
    [userLocation],
  );

  /* Re-fetch whenever the panel opens, the query changes, or geo arrives */
  useEffect(() => {
    if (!open) return;
    fetchSuggestions(debouncedQuery);
  }, [open, debouncedQuery, fetchSuggestions]);

  /* Close the dropdown when the user clicks outside the component */
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  /* Open the dropdown and trigger geo permission on first focus */
  const handleFocus = () => {
    requestGeo();
    setOpen(true);
  };

  /* Record the click for ranking, then navigate to discover results */
  const handleSuggestionClick = async (s: Suggestion) => {
    setQuery(s.text);
    setOpen(false);
    inputRef.current?.blur();
    clickSuggestion(s.id).catch(() => undefined);
    setLocation(`/discover?q=${encodeURIComponent(s.text)}`);
  };

  /* Save search to history (if >= 3 chars), then navigate */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = query.trim();
    if (text.length < 1) return;

    setOpen(false);
    inputRef.current?.blur();

    if (text.length >= 3) {
      saveSearch({
        text,
        lat: userLocation?.lat ?? null,
        lng: userLocation?.lng ?? null,
      }).catch(() => undefined);
    }

    setLocation(`/discover?q=${encodeURIComponent(text)}`);
  };

  return (
    /* position:relative container — the dropdown is absolute inside this */
    <div ref={containerRef} className="relative w-full max-w-md">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={handleFocus}
            placeholder="Search photographs, places..."
            className="w-full bg-muted/30 border border-border focus:border-foreground/40 outline-none rounded-none pl-9 pr-9 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors"
            autoComplete="off"
          />
          {loading && (
            <Loader2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 animate-spin" />
          )}
        </div>
      </form>

      {/* ── Suggestion dropdown — z-50 so it renders above any sibling content.
           The parent must NOT have overflow:hidden or this will be clipped. ── */}
      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-card border border-border shadow-2xl z-50 max-h-96 overflow-y-auto">
          {!loading && suggestions.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs text-muted-foreground/60 font-mono uppercase tracking-widest">
              {query.trim() ? "No matches" : "Start typing to search"}
            </div>
          ) : (
            <ul className="py-1">
              {suggestions.map((s) => {
                const showDistance = s.distanceKm != null;
                /* Popular = has click history but no geo distance available */
                const isPopular = !showDistance && s.clickCount > 0;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      /* onMouseDown + e.preventDefault() prevents the input from
                         losing focus before the click is registered */
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSuggestionClick(s);
                      }}
                      className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-muted/50 group transition-colors"
                    >
                      {/* Icon indicates why the suggestion is shown */}
                      {showDistance ? (
                        <MapPin className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                      ) : isPopular ? (
                        <TrendingUp className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                      ) : (
                        <Search className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                      )}
                      <span className="flex-1 text-sm text-foreground truncate">{s.text}</span>
                      {showDistance && (
                        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60 shrink-0">
                          {s.distanceKm! < 1
                            ? `${Math.round(s.distanceKm! * 1000)}m`
                            : `${s.distanceKm}km`}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
