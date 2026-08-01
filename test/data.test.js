import { test } from 'node:test';
import assert from 'node:assert/strict';

import { DESTINATIONS, getDestination } from '../src/data/destinations.js';
import { SHARED_ASSUMPTIONS } from '../src/data/destinations.js';

const CATEGORIES = [
  'flightsPerPerson',
  'accommodationPerRoomPerNight',
  'mealsPerPersonPerNight',
  'localTransportPerPersonPerNight',
  'activitiesPerPersonPerNight',
  'taxesFeesPerPerson',
];

test('dataset ships several destinations for typical budgets', () => {
  assert.ok(DESTINATIONS.length >= 5, 'expect enough destinations for multiple results');
});

test('every destination has unique, valid core fields', () => {
  const ids = new Set();
  for (const d of DESTINATIONS) {
    assert.ok(d.id && typeof d.id === 'string');
    assert.ok(!ids.has(d.id), `duplicate id: ${d.id}`);
    ids.add(d.id);

    assert.ok(d.name);
    assert.ok(d.country);
    assert.ok(d.region);
    assert.ok(d.tagline);
    assert.ok(d.overview);
    assert.ok(d.bestSeason);
    assert.ok(Array.isArray(d.seasonMonths) && d.seasonMonths.length > 0, `${d.id}: season months`);
    assert.ok(d.travelTime && d.travelTime.label, `${d.id}: travel time`);
    assert.ok(
      Array.isArray(d.suggestedStayNights) &&
        d.suggestedStayNights.length === 2 &&
        d.suggestedStayNights[0] > 0 &&
        d.suggestedStayNights[1] >= d.suggestedStayNights[0],
      `${d.id}: suggested stay range`,
    );
  }
});

test('every destination carries documented image provenance', () => {
  for (const d of DESTINATIONS) {
    const img = d.image;
    assert.ok(img, `${d.id}: image present`);
    assert.ok(img.url && img.url.startsWith('https://'), `${d.id}: https image url`);
    assert.ok(img.alt, `${d.id}: alt text`);
    assert.ok(img.credit, `${d.id}: credit`);
    assert.ok(img.source, `${d.id}: source`);
    assert.ok(img.license, `${d.id}: license`);
  }
});

test('every destination has complete cost assumptions with low <= high', () => {
  for (const d of DESTINATIONS) {
    for (const key of CATEGORIES) {
      const r = d.costs[key];
      assert.ok(r, `${d.id}: ${key} defined`);
      assert.ok(r.low >= 0 && r.high >= r.low, `${d.id}: ${key} range valid`);
    }
    const pct = d.costs.contingencyPercent;
    assert.ok(Number.isFinite(pct) && pct >= 0 && pct <= 30, `${d.id}: contingency percent`);
  }
});

test('train-mode destinations provide a train estimate', () => {
  for (const d of DESTINATIONS) {
    if (d.transportMode === 'either' || d.transportMode === 'train') {
      assert.ok(
        d.costs.trainPerPerson && d.costs.trainPerPerson.high >= d.costs.trainPerPerson.low,
        `${d.id}: train estimate present`,
      );
    }
  }
});

test('getDestination returns the matching destination or null', () => {
  assert.equal(getDestination('prague').name, 'Prague');
  assert.equal(getDestination('nope'), null);
});

test('shared assumptions are provided for transparency', () => {
  assert.ok(Array.isArray(SHARED_ASSUMPTIONS) && SHARED_ASSUMPTIONS.length > 0);
});
