/**
 * LIVE MARKET PRICES
 *
 * Source: US Bureau of Labor Statistics, Average Price Data (AP survey),
 * US city average, not seasonally adjusted. Public API, no key required.
 *   https://api.bls.gov/publicAPI/v2/timeseries/data/<seriesId>
 *
 * These are REAL published average retail prices per pound. Nothing here is
 * simulated, interpolated, or drifted. If a number is on the board, BLS
 * published it — see `period` for which month.
 *
 * WHY SIX GETs AND NOT ONE POST
 * -----------------------------
 * BLS supports a batch POST that takes every series in one request, but the
 * CORS preflight for it returns 405, so a browser can't use it. A plain GET
 * carries `access-control-allow-origin: *` and needs no preflight, so we issue
 * one GET per anchor instead. That is why the anchor list is deliberately
 * short: the unregistered API allows 25 requests/day/IP, and six leaves room.
 * Do not add anchors casually — map new cuts onto an existing one with a
 * multiplier in menu.js instead.
 *
 * CADENCE
 * -------
 * The AP survey publishes MONTHLY, roughly two to three weeks after the month
 * closes. The board does not tick during a meal, and it is not supposed to —
 * a fake intraday wobble was considered and rejected, because every figure
 * here has to be one you could look up yourself.
 */

const API = "https://api.bls.gov/publicAPI/v2/timeseries/data/";
const CACHE_KEY = "gx.market.v1";
const TTL_MS = 24 * 60 * 60 * 1000; // prices move monthly; a daily pull is plenty

/**
 * REGISTRATION KEY (optional)
 *
 * Unregistered: 25 requests/day, counted PER IP. Six anchors per refresh and a
 * per-browser cache means a table of five on one restaurant wifi is thirty
 * requests — over the cap before the food lands. A free key raises that to 500
 * a day, counted per key instead of per IP.
 *
 * Set it in `.env.local` (gitignored — this repo is public):
 *   VITE_BLS_KEY=your_key_here
 * Get one at https://data.bls.gov/registrationEngine/
 *
 * It is NOT a secret in any meaningful sense: Vite inlines VITE_* vars at build
 * time, so the key ships inside the bundle and anyone can read it out of the
 * deployed site. That is acceptable here because BLS keys carry no billing and
 * unlock no private data — the only exposure is someone spending the daily
 * quota. Keeping it in `.env.local` keeps it out of git history, which is the
 * part that actually matters. If this ever needs a real secret, it needs a
 * backend, and that is a different app.
 *
 * The optional chain matters: `import.meta.env` is undefined under plain node,
 * and this module has to stay importable there so menu.js can be tested.
 */
const KEY = import.meta.env?.VITE_BLS_KEY || "";

/** Anchor URL, with the registration key attached when one is configured. */
const seriesUrl = (seriesId) =>
  API + encodeURIComponent(seriesId) +
  (KEY ? `?registrationkey=${encodeURIComponent(KEY)}` : "");

/**
 * The six anchors every market-linked menu item maps onto.
 * `label` is what we show a user asking where a number came from.
 */
export const ANCHORS = {
  BEEF_STEAK: { id: "APU0000FC3101", label: "All uncooked beef steaks" },
  BEEF_OTHER: { id: "APU0000FC4101", label: "All uncooked other beef" },
  PORK_BELLY: { id: "APU0000704111", label: "Bacon, sliced" },
  PORK_CHOP: { id: "APU0000FD3101", label: "All pork chops" },
  PORK_OTHER: { id: "APU0000FD4101", label: "All other pork" },
  CHICKEN_LEG: { id: "APU0000706212", label: "Chicken legs, bone-in" },
};

/**
 * Last known good values, baked in so the very first paint has real numbers
 * and an offline load still works. Verified against the BLS API directly.
 * Refresh these whenever you touch this file — they are a floor, not a guess.
 */
export const FALLBACK = {
  period: "July 2026",
  prices: {
    APU0000FC3101: 13.064,
    APU0000FC4101: 8.009,
    APU0000704111: 6.584,
    APU0000FD3101: 4.244,
    APU0000FD4101: 3.671,
    APU0000706212: 1.723,
  },
};

/** Snapshot used before any fetch resolves. Always real, possibly stale. */
export function fallbackMarket() {
  return {
    prices: { ...FALLBACK.prices },
    period: FALLBACK.period,
    source: "fallback",
    at: null,
  };
}

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw);
    if (!c || !c.prices || !c.at) return null;
    if (Date.now() - c.at > TTL_MS) return null;
    return { ...c, source: "cache" };
  } catch {
    // Private mode, disabled storage, corrupt entry — all mean "no cache".
    return null;
  }
}

function writeCache(snap) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(snap));
  } catch {
    // Storage full or blocked. The app works fine without a cache.
  }
}

/** Pull one series; resolves to [seriesId, price, periodLabel] or null. */
async function fetchOne(seriesId, signal) {
  const res = await fetch(seriesUrl(seriesId), { signal });
  if (!res.ok) return null;
  const body = await res.json();
  // Over quota comes back 200 with REQUEST_NOT_PROCESSED, not an HTTP error,
  // so the status field is the only reliable signal here.
  if (body.status !== "REQUEST_SUCCEEDED") return null;
  const series = body.Results && body.Results.series && body.Results.series[0];
  const point = series && series.data && series.data[0];
  if (!point) return null;
  const value = parseFloat(point.value);
  if (!isFinite(value) || value <= 0) return null;
  return [seriesId, value, `${point.periodName} ${point.year}`];
}

/**
 * Resolve the current market. Cache first, then network, then the baked-in
 * floor. Never rejects — a dead network degrades to real-but-stale prices
 * rather than an empty board.
 */
export async function loadMarket({ signal } = {}) {
  const cached = readCache();
  if (cached) return cached;

  const ids = Object.values(ANCHORS).map((a) => a.id);
  const settled = await Promise.allSettled(
    ids.map((id) => fetchOne(id, signal))
  );

  const prices = { ...FALLBACK.prices };
  const periods = [];
  let live = 0;

  for (const r of settled) {
    if (r.status !== "fulfilled" || !r.value) continue;
    const [id, value, period] = r.value;
    prices[id] = value;
    periods.push(period);
    live++;
  }

  // A partial pull is still better than the floor, but if nothing landed we
  // are simply offline — say so rather than claiming a fresh read.
  if (live === 0) return fallbackMarket();

  const snap = {
    prices,
    period: periods[0] || FALLBACK.period,
    at: Date.now(),
    live,
    total: ids.length,
    keyed: Boolean(KEY), // for debugging which quota tier a session ran under
    source: "live",
  };
  writeCache(snap);
  return snap;
}

/** Human-readable provenance for the status line. */
export function marketLabel(market) {
  if (!market) return "loading market…";
  const base = `BLS avg retail · ${market.period}`;
  if (market.source === "fallback") return `${base} · offline`;
  if (market.source === "cache") return `${base} · cached`;
  if (market.live && market.live < market.total) {
    return `${base} · ${market.live}/${market.total} live`;
  }
  return base;
}
