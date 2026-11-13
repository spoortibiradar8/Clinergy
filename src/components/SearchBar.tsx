import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, History, MapPin, AlertCircle, Wrench,
  Users, Zap, Home, Brain, BarChart3, ArrowUp, ArrowDown,
  CornerDownLeft, Loader2, FileText, Settings
} from "lucide-react";
import { supabase } from "@/lib/supabase";

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────
interface SearchResult {
  id: string;
  type: "zone" | "alert" | "equipment" | "user" | "page";
  title: string;
  subtitle?: string;
  navigateTo: string;
}

// ─────────────────────────────────────────────────────────
// Static page list
// ─────────────────────────────────────────────────────────
const ALL_PAGES: SearchResult[] = [
  { id: "p-home",       type: "page", title: "Home",          subtitle: "Dashboard overview",         navigateTo: "/" },
  { id: "p-live",       type: "page", title: "Live Monitor",  subtitle: "Real-time zone monitoring",  navigateTo: "/live" },
  { id: "p-zones",      type: "page", title: "Zones",         subtitle: "Hospital zone management",   navigateTo: "/zones" },
  { id: "p-maint",      type: "page", title: "Maintenance",   subtitle: "Equipment & scheduling",     navigateTo: "/maintenance" },
  { id: "p-reports",    type: "page", title: "Reports",       subtitle: "Energy analytics & exports", navigateTo: "/reports" },
  { id: "p-ai",         type: "page", title: "AI Insights",   subtitle: "Predictions & anomalies",    navigateTo: "/ai-insights" },
  { id: "p-admin",      type: "page", title: "Admin Portal",  subtitle: "User management",            navigateTo: "/admin/users" },
  { id: "p-settings",   type: "page", title: "Settings",      subtitle: "Preferences & configuration",navigateTo: "/settings" },
];

const CATEGORY_META: Record<string, { label: string; emoji: string; icon: React.ReactNode }> = {
  zone:      { label: "Zones",     emoji: "🏥", icon: <MapPin      className="h-4 w-4 text-blue-500" /> },
  alert:     { label: "Alerts",    emoji: "🔔", icon: <AlertCircle className="h-4 w-4 text-red-500" /> },
  equipment: { label: "Equipment", emoji: "🔧", icon: <Wrench      className="h-4 w-4 text-amber-500" /> },
  user:      { label: "Users",     emoji: "👤", icon: <Users       className="h-4 w-4 text-purple-500" /> },
  page:      { label: "Pages",     emoji: "📄", icon: <FileText    className="h-4 w-4 text-slate-500" /> },
};

const CATEGORIES = ["zone", "alert", "equipment", "user", "page"] as const;

const QUICK_LINKS = [
  { label: "Home",        icon: <Home      className="h-4 w-4 text-blue-500" />,    path: "/" },
  { label: "Live Monitor",icon: <Zap       className="h-4 w-4 text-yellow-500" />,  path: "/live" },
  { label: "Reports",     icon: <BarChart3 className="h-4 w-4 text-emerald-500" />, path: "/reports" },
  { label: "AI Insights", icon: <Brain     className="h-4 w-4 text-purple-500" />,  path: "/ai-insights" },
];

// ─────────────────────────────────────────────────────────
// Simple 30-second cache
// ─────────────────────────────────────────────────────────
const cache = new Map<string, { data: SearchResult[]; ts: number }>();
const CACHE_TTL = 30_000; // 30 seconds

function getCached(key: string): SearchResult[] | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) { cache.delete(key); return null; }
  return entry.data;
}
function setCached(key: string, data: SearchResult[]) {
  cache.set(key, { data, ts: Date.now() });
}

// ─────────────────────────────────────────────────────────
// Highlight matching text in bold
// ─────────────────────────────────────────────────────────
function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <span className="font-bold text-blue-600">{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </>
  );
}

// ═══════════════════════════════════════════════════════════
export function SearchBar() {
  const [open, setOpen]               = useState(false);
  const [query, setQuery]             = useState("");
  const [activeIdx, setActiveIdx]     = useState(-1);
  const [loading, setLoading]         = useState(false);
  const [results, setResults]         = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef  = useRef<HTMLInputElement>(null);
  const listRef   = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate  = useNavigate();

  // ── Load recent searches ───────────────────────────────
  useEffect(() => {
    try {
      const stored = localStorage.getItem("clinergy_recent_searches");
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  // ── ⌘K / Ctrl+K shortcut ──────────────────────────────
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // ── Focus input when opened ────────────────────────────
  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIdx(-1);
      setResults([]);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // ── Escape to close ────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); setOpen(false); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  // ── Supabase search (debounced 300ms, cached 30s) ──────
  const runSearch = useCallback(async (q: string) => {
    const trimmed = q.trim().toLowerCase();
    if (!trimmed) { setResults([]); setLoading(false); return; }

    const cacheKey = `search:${trimmed}`;
    const hit = getCached(cacheKey);
    if (hit) { setResults(hit); setLoading(false); return; }

    setLoading(true);
    try {
      const dbResults: SearchResult[] = [];

      // 1. Zones — latest record per zone_name
      const { data: zones } = await supabase
        .from("zone_readings")
        .select("zone_name, status, current_power_kw")
        .ilike("zone_name", `%${trimmed}%`)
        .order("recorded_at", { ascending: false })
        .limit(5);

      if (zones) {
        const seen = new Set<string>();
        for (const z of zones) {
          if (!seen.has(z.zone_name)) {
            seen.add(z.zone_name);
            dbResults.push({
              id: `zone-${z.zone_name}`,
              type: "zone",
              title: z.zone_name,
              subtitle: `${z.status ?? "Active"} • ${z.current_power_kw ?? "—"} kW`,
              navigateTo: `/zones/${encodeURIComponent(z.zone_name)}`,
            });
          }
        }
      }

      // 2. Alerts
      const { data: alerts } = await supabase
        .from("alerts")
        .select("id, alert_type, message, zone_name")
        .ilike("message", `%${trimmed}%`)
        .limit(5);

      if (alerts) {
        for (const a of alerts) {
          dbResults.push({
            id: `alert-${a.id}`,
            type: "alert",
            title: a.alert_type ?? "Alert",
            subtitle: a.message,
            navigateTo: "/live",
          });
        }
      }

      // 3. Equipment
      const { data: equip } = await supabase
        .from("maintenance_equipment")
        .select("id, equipment_name, status, health_score")
        .ilike("equipment_name", `%${trimmed}%`)
        .limit(5);

      if (equip) {
        for (const e of equip) {
          dbResults.push({
            id: `equip-${e.id}`,
            type: "equipment",
            title: e.equipment_name ?? "Equipment",
            subtitle: `${e.status ?? "Unknown"} • Health: ${Math.round(e.health_score ?? 0)}%`,
            navigateTo: "/maintenance",
          });
        }
      }

      // 4. Users
      const { data: users } = await supabase
        .from("users")
        .select("id, full_name, email, role")
        .or(`full_name.ilike.%${trimmed}%,email.ilike.%${trimmed}%`)
        .limit(3);

      if (users) {
        for (const u of users) {
          dbResults.push({
            id: `user-${u.id}`,
            type: "user",
            title: u.full_name ?? "User",
            subtitle: `${u.role ?? "User"} • ${u.email ?? ""}`,
            navigateTo: "/admin/users",
          });
        }
      }

      // 5. Pages — always filter statically
      const matchingPages = ALL_PAGES.filter(p =>
        p.title.toLowerCase().includes(trimmed) ||
        (p.subtitle ?? "").toLowerCase().includes(trimmed)
      ).map(p => ({ ...p }));
      dbResults.push(...matchingPages);

      setCached(cacheKey, dbResults);
      setResults(dbResults);
    } catch (err) {
      console.error("Search error:", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Debounce query input ───────────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) { setResults([]); setLoading(false); return; }
    setLoading(true);
    debounceRef.current = setTimeout(() => runSearch(query), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, runSearch]);

  // Reset active index on new results
  useEffect(() => { setActiveIdx(-1); }, [results]);

  // ── Save to recent searches ────────────────────────────
  const saveRecentSearch = useCallback((term: string) => {
    if (!term.trim()) return;
    const updated = [term, ...recentSearches.filter(t => t !== term)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("clinergy_recent_searches", JSON.stringify(updated));
  }, [recentSearches]);

  // ── Handle result selection ────────────────────────────
  const handleSelect = useCallback((title: string, path: string) => {
    setOpen(false);
    saveRecentSearch(title);
    navigate(path);
  }, [navigate, saveRecentSearch]);

  // ── Group results by category ──────────────────────────
  const q = query.trim().toLowerCase();
  const grouped = useMemo(() => {
    return CATEGORIES
      .map(cat => ({ cat, items: results.filter(r => r.type === cat) }))
      .filter(g => g.items.length > 0);
  }, [results]);

  // ── Flat item list for keyboard navigation ─────────────
  const flatItems = useMemo(() => {
    if (!q) {
      const items: { id: string; title: string; path: string }[] = [];
      recentSearches.forEach((term, i) => items.push({ id: `recent-${i}`, title: term, path: "" }));
      QUICK_LINKS.forEach(l => items.push({ id: `quick-${l.path}`, title: l.label, path: l.path }));
      return items;
    }
    return results.map(r => ({ id: r.id, title: r.title, path: r.navigateTo }));
  }, [q, results, recentSearches]);

  // ── Keyboard navigation ────────────────────────────────
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx(prev => Math.min(prev + 1, flatItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx(prev => Math.max(prev - 1, -1));
    } else if (e.key === "Enter" && activeIdx >= 0 && activeIdx < flatItems.length) {
      e.preventDefault();
      const item = flatItems[activeIdx];
      if (item.path) handleSelect(item.title, item.path);
      else { setQuery(item.title); setActiveIdx(-1); }
    }
  }, [flatItems, activeIdx, handleSelect]);

  // Scroll active item into view
  useEffect(() => {
    if (activeIdx >= 0 && listRef.current) {
      listRef.current.querySelector(`[data-idx="${activeIdx}"]`)?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIdx]);

  // Track flat-item index for rendering
  let flatIdx = -1;
  const nextIdx = () => ++flatIdx;

  // ═══════════════════════════════════════════════════════
  return (
    <>
      {/* ── Trigger Button ─────────────────────────────── */}
      <button
        onClick={() => setOpen(true)}
        style={{
          width: '100%',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          gap: '8px',
          borderRadius: '12px',
          border: '1px solid #c8e6d8',
          backgroundColor: '#f0f7f4',
          padding: '8px 12px',
          fontSize: '14px',
          color: '#5a7a6e',
          cursor: 'pointer',
          transition: 'background-color 0.2s'
        }}
        className="hover:bg-[#d9efe8] transition-colors"
      >
        <Search className="h-4 w-4 shrink-0 text-[#2d6a56]" />
        <span className="hidden lg:inline text-[#6b7280]">Search zones, alerts, reports...</span>
        <span className="inline lg:hidden text-[#6b7280]">Search...</span>
        <kbd 
          className="mobile-kbd-hidden"
          style={{
            marginLeft: 'auto',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '2px',
            borderRadius: '4px',
            border: '1px solid #f0ebff',
            backgroundColor: '#ffffff',
            padding: '2px 6px',
            fontSize: '10px',
            fontFamily: 'monospace',
            color: '#8b5cf6'
          }}
        >
          <span style={{ fontSize: '10px' }}>⌘</span>K
        </kbd>
      </button>

      {/* ── Search Overlay ─────────────────────────────── */}
      {open && (
        <div className="fixed inset-0 z-[9999]">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/55 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Modal */}
          <div className="relative mx-auto mt-[10vh] w-full max-w-[600px] px-4">
            <div className="rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden">

              {/* ── Search Input ─────────────────────── */}
              <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
                <Search className="h-5 w-5 text-slate-400 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search zones, equipment, alerts, users..."
                  className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none"
                  autoComplete="off"
                />
                {loading && <Loader2 className="h-4 w-4 text-blue-500 animate-spin shrink-0" />}
                {query && !loading && (
                  <button
                    onClick={() => { setQuery(""); inputRef.current?.focus(); }}
                    className="text-xs text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded px-1.5 py-0.5 transition-colors"
                  >
                    Clear
                  </button>
                )}
                <kbd className="hidden sm:inline-flex text-[10px] text-slate-400 border border-slate-200 rounded px-1.5 py-0.5">ESC</kbd>
              </div>

              {/* ── Results ──────────────────────────── */}
              <div ref={listRef} className="max-h-[55vh] overflow-y-auto overscroll-contain p-1">

                {/* Empty state: no query typed */}
                {!q && (
                  <>
                    {recentSearches.length > 0 && (
                      <div className="px-3 pt-2 pb-1">
                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Recent Searches</p>
                      </div>
                    )}
                    {recentSearches.map((term, i) => {
                      const idx = nextIdx();
                      return (
                        <button
                          key={`recent-${i}`}
                          data-idx={idx}
                          onClick={() => { setQuery(term); setActiveIdx(-1); }}
                          className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-left transition-colors ${
                            activeIdx === idx ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <History className="h-4 w-4 text-slate-400 shrink-0" />
                          <span>{term}</span>
                        </button>
                      );
                    })}

                    <div className="px-3 pt-3 pb-1">
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Quick Links</p>
                    </div>
                    {QUICK_LINKS.map(link => {
                      const idx = nextIdx();
                      return (
                        <button
                          key={link.path}
                          data-idx={idx}
                          onClick={() => handleSelect(link.label, link.path)}
                          className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-left transition-colors ${
                            activeIdx === idx ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {link.icon}
                          <span>{link.label}</span>
                        </button>
                      );
                    })}
                  </>
                )}

                {/* Grouped results */}
                {q && !loading && grouped.length > 0 && (
                  <>
                    {grouped.map(({ cat, items }) => {
                      const meta = CATEGORY_META[cat];
                      return (
                        <div key={cat}>
                          <div className="px-3 pt-2 pb-1">
                            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                              {meta.emoji} {meta.label} ({items.length})
                            </p>
                          </div>
                          {items.map(result => {
                            const idx = nextIdx();
                            return (
                              <button
                                key={result.id}
                                data-idx={idx}
                                onClick={() => handleSelect(result.title, result.navigateTo)}
                                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-left transition-colors group ${
                                  activeIdx === idx ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-50"
                                }`}
                              >
                                <span className="shrink-0">{meta.icon}</span>
                                <div className="flex-1 min-w-0">
                                  <div className="truncate">
                                    <HighlightMatch text={result.title} query={query.trim()} />
                                  </div>
                                  {result.subtitle && (
                                    <p className="text-xs text-slate-400 truncate mt-0.5">
                                      <HighlightMatch text={result.subtitle} query={query.trim()} />
                                    </p>
                                  )}
                                </div>
                                <CornerDownLeft className={`h-3.5 w-3.5 shrink-0 transition-opacity ${
                                  activeIdx === idx ? "text-blue-400 opacity-100" : "opacity-0 group-hover:opacity-40"
                                }`} />
                              </button>
                            );
                          })}
                        </div>
                      );
                    })}
                  </>
                )}

                {/* Loading state */}
                {q && loading && (
                  <div className="py-10 flex flex-col items-center gap-3 text-slate-400">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                    <p className="text-sm font-medium">Searching...</p>
                  </div>
                )}

                {/* No results */}
                {q && !loading && grouped.length === 0 && (
                  <div className="py-10 text-center">
                    <Search className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-sm font-medium text-slate-500">No results for "{query}"</p>
                    <p className="text-xs text-slate-400 mt-1">Try searching for zones, alerts, or equipment.</p>
                  </div>
                )}

              </div>

              {/* ── Footer hints ─────────────────────── */}
              <div className="flex items-center gap-4 border-t border-slate-100 px-4 py-2 text-[11px] text-slate-400">
                <span className="flex items-center gap-1"><ArrowUp className="h-3 w-3" /><ArrowDown className="h-3 w-3" /> Navigate</span>
                <span className="flex items-center gap-1"><CornerDownLeft className="h-3 w-3" /> Select</span>
                <span className="flex items-center gap-1"><kbd className="border border-slate-200 rounded px-1 text-[10px]">ESC</kbd> Close</span>
                <span className="ml-auto flex items-center gap-1 text-blue-400 font-medium">
                  <Loader2 className={`h-3 w-3 ${loading ? "animate-spin" : "opacity-0"}`} />
                  {loading ? "Searching Supabase..." : "Live results"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
