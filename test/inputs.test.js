import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  CURRENCIES,
  BUDGET,
  FLEXIBILITY,
  createInputs,
  validateInputs,
  isDateValid,
} from '../src/inputs.js';
import { validateDeparture } from '../src/departure.js';

test('createInputs returns the full structured shape with sensible defaults', () => {
  const inputs = createInputs();
  assert.equal(inputs.departure, '');
  assert.equal(inputs.currency, 'USD');
  assert.equal(inputs.budgetAmount, BUDGET.default);
  assert.equal(inputs.travelers, 1);
  assert.equal(inputs.tripLength, null);
  assert.deepEqual(inputs.dates, {
    approximate: '',
    flexibility: FLEXIBILITY.flexible,
    flexDays: 3,
    start: '',
    end: '',
  });
});

test('empty inputs fail validation with messages for each required field', () => {
  const errors = validateInputs(createInputs());
  assert.ok(errors.departure);
  assert.ok(errors.tripLength);
  assert.ok(errors.approximate);
});

test('complete flexible-dates inputs are valid', () => {
  const inputs = createInputs();
  inputs.departure = 'Milan';
  inputs.tripLength = 'week';
  inputs.dates.approximate = 'June';
  assert.deepEqual(validateInputs(inputs), {});
});

test('fixed dates require a start and end with end on or after start', () => {
  const inputs = createInputs();
  inputs.departure = 'Paris';
  inputs.tripLength = 'weekend';
  inputs.dates.approximate = 'August';
  inputs.dates.flexibility = FLEXIBILITY.fixed;

  assert.ok(validateInputs(inputs).dates, 'missing dates is invalid');
  inputs.dates.start = '2026-08-10';
  inputs.dates.end = '2026-08-14';
  assert.equal(validateInputs(inputs).dates, undefined, 'valid range is accepted');

  inputs.dates.end = '2026-08-08';
  assert.ok(validateInputs(inputs).dates, 'end before start is invalid');
});

test('budget outside configured range is invalid', () => {
  const inputs = createInputs();
  inputs.departure = 'Lisbon';
  inputs.tripLength = 'week';
  inputs.dates.approximate = 'May';
  inputs.budgetAmount = BUDGET.max + 1;
  assert.ok(validateInputs(inputs).budget);

  inputs.budgetAmount = BUDGET.max;
  assert.equal(validateInputs(inputs).budget, undefined);
});

test('isDateValid parses ISO dates and rejects reversed ranges', () => {
  assert.equal(isDateValid('2026-08-01', '2026-08-10'), true);
  assert.equal(isDateValid('2026-08-10', '2026-08-01'), false);
  assert.equal(isDateValid('', '2026-08-01'), false);
  assert.equal(isDateValid('not-a-date', '2026-08-01'), false);
});

test('currencies are USD and EUR only', () => {
  assert.deepEqual(CURRENCIES, ['USD', 'EUR']);
});

test('validateDeparture rejects empty input', async () => {
  const result = await validateDeparture('   ', { delay: 0 });
  assert.equal(result.ok, false);
  assert.ok(result.message);
});

test('validateDeparture normalizes non-empty input', async () => {
  const result = await validateDeparture('  Milan  ', { delay: 0 });
  assert.equal(result.ok, true);
  assert.equal(result.normalized, 'Milan');
});
