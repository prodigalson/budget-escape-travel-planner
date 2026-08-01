/**
 * Currency conversion seam.
 *
 * The estimate/ranking engine stores its cost assumptions in a single
 * reference currency (USD). When the user's budget is in another currency we
 * need to express results in that currency too, so the engine calls `convert`.
 *
 * This module provides a clean seam for the data-layer issue (PER-159) to plug
 * in a live, cached exchange-rate provider: callers use `convert`/`setRateConverter`
 * and never depend on the default implementation below.
 *
 * The default is a BUNDLED, illustrative reference rate — it is a snapshot, not
 * a live quote, and it is always labeled as such wherever it is shown.
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

let converter = defaultConverter;

function defaultConverter(amount, from, to) {
  if (from === to) {
    return Promise.resolve({
      amount,
      rate: 1,
      source: 'Same currency',
      lastChecked: RATES_LAST_CHECKED,
      bundled: false,
    });
  }
  const rate = BUNDLED_RATES[`${from}-${to}`];
  if (rate === undefined) {
    return Promise.reject(
      new Error(`No exchange rate available for ${from} → ${to}`),
    );
  }
  return Promise.resolve({
    amount: amount * rate,
    rate,
    source: RATES_SOURCE,
    lastChecked: RATES_LAST_CHECKED,
    bundled: true,
  });
}

/** Replace the conversion implementation (used by the data-layer issue). */
export function setRateConverter(fn) {
  converter = fn;
}

/** Convert an amount from `from` to `to`. Returns { amount, rate, source, lastChecked }. */
export function convert(amount, from, to) {
  return converter(amount, from, to);
}
