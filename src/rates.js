/**
 * Currency conversion + exchange-rate freshness layer (PER-159).
 *
 * The estimate/ranking engine stores its cost assumptions in a single
 * reference currency (USD). When the user's budget is in another currency we
 * need to express results in that currency too, so the engine calls `convert`.
 *
 * Two modes are supported:
 *
 *  1. BUNDLED (default). A static, clearly-labeled reference rate shipped with
 *     the app. Deterministic and offline-safe — used by unit tests and as the
 *     final fallback. Always labeled as "not a live quote".
 *
 *  2. LIVE (opt-in). A periodically-refreshed open exchange-rate provider
 *     (frankfurter.dev, powered by European Central Bank reference rates).
 *     `enableLiveRates()` turns it on; the app does this at startup. Live
 *     responses are cached in memory with a TTL, and every result carries the
 *     provider's `last_checked`/`rate_as_of` timestamp. If the live provider
 *     is unreachable (offline, rate-limited, timeout) the previous cached
 *     value is used while it is fresh, otherwise it degrades to the bundled
 *     rate LABELED as a fallback so the user is never shown un-labelled data.
 *
 * All rates are estimates for planning — never live/bookable pricing.
 */

export const BASE_CURRENCY = 'USD';

export const BUNDLED_RATES = {
  'USD-EUR': 0.92,
  'EUR-USD': 1.09,
  'USD-USD': 1,
  'EUR-EUR': 1,
};

export const RATES_SOURCE = 'Bundled illustrative reference rate (not a live quote)';
export const RATES_LAST_CHECKED = '2026-07-01';

export const LIVE_RATES_URL = 'https://api.frankfurter.dev/v1/latest?base=USD&symbols=EUR';
export const LIVE_RATES_SOURCE = 'frankfurter.dev — European Central Bank reference rates';
export const FALLBACK_RATES_SOURCE = 'Bundled reference rate (live rate unavailable)';
/** How long a fetched live rate stays fresh before we refetch. */
export const RATES_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
export const RATES_FETCH_TIMEOUT_MS = 5000;

let liveEnabled = false;

/** Module-level cache of the latest live USD→EUR rate. */
let cachedLive = null; // { usdEur, asOf, fetchedAt }

/** Testable fetch seam (defaults to the platform fetch). */
let fetcher = null;

export function setRateFetcher(fn) {
  fetcher = fn;
  cachedLive = null;
}

/** Clear any cached live rate (used by tests). */
export function resetRateCache() {
  cachedLive = null;
}

/** Opt into the live, cached exchange-rate provider (app calls this at startup). */
export function enableLiveRates() {
  liveEnabled = true;
}

export function liveRatesEnabled() {
  return liveEnabled;
}

function fetchFn() {
  return fetcher || globalThis.fetch;
}

function findBundledRate(from, to) {
  const rate = BUNDLED_RATES[`${from}-${to}`];
  if (rate === undefined) {
    throw new Error(`No exchange rate available for ${from} → ${to}`);
  }
  return rate;
}

/**
 * Fetch the live USD→EUR rate with a timeout, caching the result under the TTL.
 * Returns `null` if unreachable or malformed so callers fall back gracefully.
 */
async function fetchLiveRate() {
  if (
    cachedLive &&
    Date.now() - cachedLive.fetchedAt < RATES_CACHE_TTL_MS
  ) {
    return cachedLive;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), RATES_FETCH_TIMEOUT_MS);
  try {
    const res = await fetchFn()(LIVE_RATES_URL, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const usdEur = data && data.rates && data.rates.EUR;
    if (typeof usdEur !== 'number' || !Number.isFinite(usdEur)) {
      throw new Error('Malformed rate payload');
    }
    cachedLive = {
      usdEur,
      asOf: (data.date && String(data.date)) || new Date().toISOString().slice(0, 10),
      fetchedAt: Date.now(),
    };
    return cachedLive;
  } catch {
    // Reuse a slightly-stale cache rather than dropping straight to bundled.
    if (cachedLive) return cachedLive;
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Resolve the conversion metadata (rate, source, last-checked, bundled flag)
 * for a `from` → `to` pair. This is the single source of truth for what the
 * app shows the user about a currency conversion.
 */
export async function getRateInfo(from, to) {
  if (from === to) {
    return {
      rate: 1,
      source: 'Same currency',
      lastChecked: RATES_LAST_CHECKED,
      bundled: false,
      provider: 'identity',
    };
  }

  if (liveEnabled) {
    const live = await fetchLiveRate();
    if (live) {
      // The live payload is EUR per 1 USD.
      const rate = from === 'USD' && to === 'EUR'
        ? live.usdEur
        : from === 'EUR' && to === 'USD'
          ? 1 / live.usdEur
          : null;
      if (rate !== null) {
        return {
          rate,
          source: LIVE_RATES_SOURCE,
          lastChecked: `ECB reference rate as of ${live.asOf}`,
          bundled: false,
          provider: 'live',
        };
      }
    }
    // Live unavailable → labeled bundled fallback.
    return {
      rate: findBundledRate(from, to),
      source: FALLBACK_RATES_SOURCE,
      lastChecked: RATES_LAST_CHECKED,
      bundled: true,
      provider: 'fallback',
    };
  }

  return {
    rate: findBundledRate(from, to),
    source: RATES_SOURCE,
    lastChecked: RATES_LAST_CHECKED,
    bundled: true,
    provider: 'bundled',
  };
}

/** Replace the conversion implementation (kept for backward-compatible seams). */
export function setRateConverter(fn) {
  converter = fn;
}

async function defaultConverter(amount, from, to) {
  const info = await getRateInfo(from, to);
  return {
    amount: amount * info.rate,
    rate: info.rate,
    source: info.source,
    lastChecked: info.lastChecked,
    bundled: info.bundled,
    provider: info.provider,
  };
}

let converter = defaultConverter;

/** Convert an amount from `from` to `to`. Returns { amount, rate, source, lastChecked }. */
export function convert(amount, from, to) {
  return converter(amount, from, to);
}
