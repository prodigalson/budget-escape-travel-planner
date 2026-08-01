/**
 * Shared input model for the Budget Escape planner.
 *
 * This is the single place that defines the shape of the `inputs` object and
 * how to validate it. The results issue (results engine) consumes the same
 * shape, so keeping it here keeps the two in sync.
 *
 * Amounts and currencies are stored in the native currency chosen by the user
 * (USD or EUR). No conversion happens at this stage.
 */

export const CURRENCIES = ['USD', 'EUR'];

export const BUDGET = {
  min: 300,
  max: 20000,
  step: 100,
  default: 1500,
};

/** Preset trip lengths offered in the flow. */
export const TRIP_LENGTHS = [
  { value: 'weekend', label: 'Weekend', nights: 2 },
  { value: 'short', label: '5 nights', nights: 5 },
  { value: 'week', label: '7 nights', nights: 7 },
  { value: 'two-weeks', label: '14 nights', nights: 14 },
];

/** Approximate travel months offered in the flow. */
export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const FLEXIBILITY = {
  flexible: 'flexible',
  fixed: 'fixed',
};

export const FLEXIBILITY_OPTIONS = [
  { value: FLEXIBILITY.flexible, label: 'Flexible' },
  { value: FLEXIBILITY.fixed, label: 'Specific dates' },
];

/** Plus/minus day options for flexible dates. */
export const FLEX_DAYS = [1, 2, 3, 5];

/**
 * Create a fresh, empty `inputs` object. This function owns the shape so a
 * single source of truth is used across the app.
 */
export function createInputs() {
  return {
    departure: '',
    budgetAmount: BUDGET.default,
    currency: 'USD',
    travelers: 1,
    tripLength: null,
    dates: {
      approximate: '',
      flexibility: FLEXIBILITY.flexible,
      flexDays: 3,
      start: '',
      end: '',
    },
  };
}

export function isDateValid(start, end) {
  if (!start || !end) return false;
  const from = Date.parse(start);
  const to = Date.parse(end);
  if (Number.isNaN(from) || Number.isNaN(to)) return false;
  return to >= from;
}

/**
 * Validate an inputs object and return an errors map (keys -> message).
 * An empty map means the inputs are ready to submit.
 */
export function validateInputs(inputs) {
  const errors = {};

  if (!inputs.departure || !inputs.departure.trim()) {
    errors.departure = 'Enter your departure city or station.';
  }

  if (
    !Number.isFinite(inputs.budgetAmount) ||
    inputs.budgetAmount < BUDGET.min ||
    inputs.budgetAmount > BUDGET.max
  ) {
    errors.budget = 'Choose a budget between your starting amount and a realistic total.';
  }

  if (!Number.isInteger(inputs.travelers) || inputs.travelers < 1 || inputs.travelers > 12) {
    errors.travelers = 'Choose how many people are traveling.';
  }

  if (!inputs.tripLength) {
    errors.tripLength = 'Choose how long your trip will be.';
  }

  if (!inputs.dates.approximate) {
    errors.approximate = 'Choose an approximate travel month.';
  }

  if (inputs.dates.flexibility === FLEXIBILITY.fixed) {
    if (!isDateValid(inputs.dates.start, inputs.dates.end)) {
      errors.dates = 'Enter a start and end date with the end on or after the start.';
    }
  }

  return errors;
}
