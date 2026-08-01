import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  BUNDLED_RATES,
  RATES_SOURCE,
  FALLBACK_RATES_SOURCE,
  LIVE_RATES_SOURCE,
  LIVE_RATES_URL,
  convert,
  getRateInfo,
  enableLiveRates,
  setRateFetcher,
  resetRateCache,
} from '../src/rates.js';

function validPayload(usdEur = 0.92, date = '2026-07-15') {
  return { base: 'USD', date, rates: { EUR: usdEur } };
}

function fakeResponse(payload, ok = true) {
  return {
    ok,
    json: async () => payload,
  };
}

function goodFetcher(usdEur, date) {
  let calls = 0;
  const fn = async () => {
    calls += 1;
    return fakeResponse(validPayload(usdEur, date), true);
  };
  fn.calls = () => calls;
  return fn;
}

test('identity conversion returns rate 1 for the same currency', async () => {
  const info = await getRateInfo('USD', 'USD');
  assert.equal(info.rate, 1);
  assert.equal(info.provider, 'identity');
  assert.equal(info.bundled, false);
});

test('bundled (default) converter uses the labeled reference rate', async () => {
  const info = await getRateInfo('USD', 'EUR');
  assert.equal(info.rate, BUNDLED_RATES['USD-EUR']);
  assert.equal(info.source, RATES_SOURCE);
  assert.equal(info.bundled, true);

  const converted = await convert(100, 'USD', 'EUR');
  assert.equal(converted.amount, 100 * BUNDLED_RATES['USD-EUR']);
  assert.equal(converted.bundled, true);
});

test('live provider returns the fetched rate with a timestamp and is cached (TTL)', async () => {
  enableLiveRates();
  const fetcher = goodFetcher(0.9, '2026-07-20');
  setRateFetcher(fetcher);
  resetRateCache();

  const first = await getRateInfo('USD', 'EUR');
  assert.equal(first.rate, 0.9);
  assert.equal(first.provider, 'live');
  assert.equal(first.bundled, false);
  assert.ok(first.source.includes(LIVE_RATES_SOURCE));
  assert.ok(first.lastChecked.includes('as of 2026-07-20'));

  // Second call within the TTL must not hit the network again.
  await getRateInfo('USD', 'EUR');
  await getRateInfo('USD', 'EUR');
  assert.equal(fetcher.calls(), 1);
});

test('live conversion uses the ECB rate and inverts for EUR→USD', async () => {
  enableLiveRates();
  setRateFetcher(goodFetcher(0.9, '2026-07-20'));
  resetRateCache();

  const converted = await convert(100, 'USD', 'EUR');
  assert.equal(converted.amount, 90);
  assert.equal(converted.bundled, false);

  const inverse = await getRateInfo('EUR', 'USD');
  assert.ok(Math.abs(inverse.rate - 1 / 0.9) < 1e-9);
  assert.equal(inverse.bundled, false);
});

test('live provider falls back to a labeled bundled rate when unreachable', async () => {
  enableLiveRates();
  setRateFetcher(async () => {
    throw new Error('offline');
  });
  resetRateCache();

  const info = await getRateInfo('USD', 'EUR');
  assert.equal(info.rate, BUNDLED_RATES['USD-EUR']);
  assert.equal(info.source, FALLBACK_RATES_SOURCE);
  assert.equal(info.bundled, true);
  assert.equal(info.provider, 'fallback');
});

test('live provider falls back when the HTTP response is not ok', async () => {
  enableLiveRates();
  setRateFetcher(async () => fakeResponse(null, false));
  resetRateCache();

  const info = await getRateInfo('USD', 'EUR');
  assert.equal(info.provider, 'fallback');
  assert.equal(info.bundled, true);
});

test('live provider falls back on a malformed payload', async () => {
  enableLiveRates();
  setRateFetcher(async () => fakeResponse({ rates: {} }, true));
  resetRateCache();

  const info = await getRateInfo('USD', 'EUR');
  assert.equal(info.provider, 'fallback');
  assert.equal(info.bundled, true);
});

test('convert fetches from the configured live URL', async () => {
  enableLiveRates();
  let requestedUrl = null;
  setRateFetcher(async (url) => {
    requestedUrl = url;
    return fakeResponse(validPayload(0.9, '2026-07-20'), true);
  });
  resetRateCache();

  await convert(100, 'USD', 'EUR');
  assert.equal(requestedUrl, LIVE_RATES_URL);
});
