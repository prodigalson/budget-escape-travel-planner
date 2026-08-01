import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  nightsForTripLength,
  currencySymbol,
  formatMoney,
  formatRange,
  buildEstimate,
  rankDestinations,
} from '../src/engine.js';
import { DESTINATIONS } from '../src/data/destinations.js';

const prague = DESTINATIONS.find((d) => d.id === 'prague');

function baseInputs(overrides = {}) {
  return {
    departure: 'Milan',
    budgetAmount: 3000,
    currency: 'USD',
    travelers: 1,
    tripLength: 'week',
    dates: { approximate: 'June', flexibility: 'flexible', flexDays: 3, start: '', end: '' },
    ...overrides,
  };
}

test('nightsForTripLength maps preset labels to nights', () => {
  assert.equal(nightsForTripLength('weekend'), 2);
  assert.equal(nightsForTripLength('short'), 5);
  assert.equal(nightsForTripLength('week'), 7);
  assert.equal(nightsForTripLength('two-weeks'), 14);
  assert.equal(nightsForTripLength('unknown'), null);
});

test('currency helpers format symbols and ranges', () => {
  assert.equal(currencySymbol('EUR'), '€');
  assert.equal(currencySymbol('USD'), '$');
  assert.equal(formatMoney(1234.5, 'EUR'), '€1,235');
  assert.equal(formatRange({ low: 1000, high: 1500 }, 'USD'), '$1,000–$1,500');
});

test('buildEstimate sums categories and applies contingency per travelers*nights', async () => {
  const estimate = await buildEstimate(prague, baseInputs()); // 1 traveler, 7 nights, USD

  assert.equal(estimate.nights, 7);
  assert.equal(estimate.currency, 'USD');

  // transport = per-person flight × travelers
  assert.equal(estimate.categories.transport.low, prague.costs.flightsPerPerson.low);
  assert.equal(estimate.categories.transport.low, 95);
  assert.equal(estimate.categories.transport.high, 220);

  // per-person-per-night × travelers × nights (room: single traveller = 1 room)
  assert.equal(estimate.categories.accommodation.low, 60 * 7);
  assert.equal(estimate.categories.meals.low, 35 * 7);

  // numbers verified against the recalibrated Prague costs
  assert.ok(Math.abs(estimate.subtotal.low - 947) < 0.01);
  assert.ok(Math.abs(estimate.subtotal.high - 1766) < 0.01);
  assert.equal(estimate.contingency.percent, 10);
  assert.ok(Math.abs(estimate.contingency.low - 94.7) < 0.01);
  assert.ok(Math.abs(estimate.total.low - 1041.7) < 0.01);
  assert.ok(Math.abs(estimate.total.high - 1942.6) < 0.01);
});

test('buildEstimate scales with travelers, sharing a room for the second traveler', async () => {
  const estimate = await buildEstimate(prague, baseInputs({ travelers: 2 }));
  // two travelers sleep in ONE room (rooms = ceil(2/2) = 1)
  assert.equal(estimate.rooms, 1);
  assert.ok(Math.abs(estimate.categories.accommodation.low - 60 * 1 * 7) < 0.01);
  // meals / activities scale per-person
  assert.ok(Math.abs(estimate.categories.meals.low - 35 * 2 * 7) < 0.01);
  // total deliberately less than 2x a single traveller (room is shared)
  assert.ok(Math.abs(estimate.total.low - 1474 * 1.1) < 0.01);
});

test('buildEstimate converts costs to the user currency via the rates seam', async () => {
  const estimate = await buildEstimate(prague, baseInputs({ currency: 'EUR' }));
  // USD -> EUR bundled rate is 0.92
  assert.equal(estimate.currency, 'EUR');
  assert.ok(Math.abs(estimate.categories.transport.low - 95 * 0.92) < 0.01);
  assert.ok(Math.abs(estimate.total.low - 1041.7 * 0.92) < 0.01);
});

test('affordability is decided by the central all-in estimate', async () => {
  const tight = await buildEstimate(prague, baseInputs({ budgetAmount: 1000 }));
  // Prague mid ≈ 1492 > 1000 -> not affordable
  assert.equal(tight.affordability.affordable, false);

  const roomy = await buildEstimate(prague, baseInputs({ budgetAmount: 2000 }));
  assert.equal(roomy.affordability.affordable, true);

  const remaining = await buildEstimate(prague, baseInputs({ budgetAmount: 2000 }));
  assert.ok(Math.abs(remaining.remaining.mid - (2000 - remaining.estimateMid)) < 0.01);
  assert.ok(remaining.bufferHigh >= 0);
});

test('rankDestinations keeps only affordable results and sorts by fit score desc', async () => {
  const inputs = baseInputs({ budgetAmount: 2500, currency: 'USD', travelers: 2 });
  const results = await rankDestinations(DESTINATIONS, inputs);

  assert.ok(results.length >= 1, 'expected at least one affordable result');
  assert.ok(results.length < DESTINATIONS.length, 'not every destination should fit');

  for (let i = 1; i < results.length; i += 1) {
    assert.ok(
      results[i - 1].fit.score >= results[i].fit.score,
      'results must be sorted by fit score descending',
    );
  }

  for (const r of results) {
    assert.equal(r.estimate.affordability.affordable, true);
    assert.ok(r.fit.badge, 'each result has a fit badge');
  }
});

test('rankDestinations returns an empty list when nothing fits', async () => {
  const results = await rankDestinations(DESTINATIONS, baseInputs({ budgetAmount: 200, travelers: 4 }));
  assert.deepEqual(results, []);
});

test('a couple at an ordinary budget still gets several affordable options (regression)', async () => {
  const couple = await rankDestinations(
    DESTINATIONS,
    baseInputs({ budgetAmount: 2500, currency: 'USD', travelers: 2, tripLength: 'week' }),
  );
  assert.ok(couple.length >= 3, 'couple, week, $2500 should return several');

  const singleDefault = await rankDestinations(
    DESTINATIONS,
    baseInputs({ budgetAmount: 1500, currency: 'USD', travelers: 1, tripLength: 'week' }),
  );
  assert.ok(singleDefault.length >= 3, 'default single, week, $1500 should return several');
});

test('all destination cost assumptions are in the reference currency model', () => {
  for (const d of DESTINATIONS) {
    const c = d.costs;
    const cat = [c.flightsPerPerson, c.accommodationPerRoomPerNight];
    const baseTagged = cat.every((r) => r.low >= 0 && r.high >= r.low);
    assert.ok(baseTagged, `${d.id}: base ranges are valid`);
    assert.ok(c.contingencyPercent >= 0 && c.contingencyPercent <= 30, `${d.id}: valid contingency`);
  }
});
