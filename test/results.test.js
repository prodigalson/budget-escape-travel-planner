import { test } from 'node:test';
import assert from 'node:assert/strict';

import { ResultsView } from '../src/components/results.js';
import { DESTINATIONS } from '../src/data/destinations.js';
import { rankDestinations } from '../src/engine.js';

class FakeRoot {
  constructor() {
    this.innerHTML = '';
    this.listeners = {};
  }

  addEventListener() {}

  querySelector() {
    return null;
  }
}

function inputs(overrides = {}) {
  return {
    departure: 'Milan',
    budgetAmount: 3000,
    currency: 'USD',
    travelers: 2,
    tripLength: 'week',
    dates: { approximate: 'June', flexibility: 'flexible', flexDays: 3, start: '', end: '' },
    ...overrides,
  };
}

function makeView() {
  const root = new FakeRoot();
  const view = new ResultsView(root, { onRefine() {}, onRetry() {} });
  return { root, view };
}

test('showLoading renders a status and skeleton cards', () => {
  const { root, view } = makeView();
  view.showLoading(inputs());
  assert.ok(root.innerHTML.includes('Finding escapes'));
  assert.ok(root.innerHTML.includes('dest-card--skeleton'));
});

test('showEmpty renders the no-fit state and hints to refine', () => {
  const { root, view } = makeView();
  view.showEmpty(inputs({ budgetAmount: 150 }));
  assert.ok(root.innerHTML.includes('No destinations fit your budget'));
  assert.ok(root.innerHTML.includes('data-refine'));
});

test('showError renders the retry state', () => {
  const { root, view } = makeView();
  view.showError();
  assert.ok(root.innerHTML.includes("couldn't load your escapes"));
  assert.ok(root.innerHTML.includes('data-retry'));
});

test('showResults renders a card per result with image, price, badge, CTA', async () => {
  const { root, view } = makeView();
  const data = inputs();
  const ranked = await rankDestinations(DESTINATIONS, data);
  assert.ok(ranked.length >= 1);

  view.showResults(data, ranked);
  assert.ok(root.innerHTML.includes('fit your budget'));
  assert.ok(root.innerHTML.includes('data-open-detail'));
  assert.ok(root.innerHTML.includes('fit-badge'));
  assert.ok(root.innerHTML.includes('loading="lazy"'));
  assert.ok(root.innerHTML.includes(ranked[0].destination.image.credit), 'card surfaces image credit');
  for (const r of ranked.slice(0, 3)) {
    assert.ok(root.innerHTML.includes(r.destination.name));
  }
});

test('detail view includes itemized breakdown, assumptions, buffer, and source', async () => {
  const { root, view } = makeView();
  const data = inputs();
  const ranked = await rankDestinations(DESTINATIONS, data);
  view.showResults(data, ranked);

  view._showDetail(ranked[0].destination.id);
  const html = root.innerHTML;
  assert.ok(html.includes('Estimated breakdown'));
  assert.ok(html.includes('transport'));
  assert.ok(html.includes('Contingency'));
  assert.ok(html.includes('Remaining buffer'));
  assert.ok(html.includes('Assumptions'));
  assert.ok(html.includes('last checked'));
  assert.ok(html.includes("What's included"));
});
