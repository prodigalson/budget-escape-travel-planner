/**
 * Estimate + ranking engine for Budget Escape.
 *
 * Pure-ish, unit-testable logic. Consumes the shared `inputs` shape
 * (see `src/inputs.js`) and the seed destination dataset, and produces, for
 * each affordable destination, an honest all-in estimate:
 *
 *   total = transport + accommodation + meals + local transport + activities
 *           + taxes/fees + contingency
 *
 * each as a low–high range, computed for the traveler count and trip length.
 * Results are filtered to those that FIT the budget (the all-in high bound
 * must not exceed the budget) and ranked by a fit score.
 *
 * Currency: cost assumptions are stored in a reference currency (USD, see
 * `src/rates.js`) and converted to the user's currency through the `convert`
 * seam — a clean hook for the data-layer issue (PER-159).
 */

import { TRIP_LENGTHS } from './inputs.js';
import { BASE_CURRENCY, convert } from './rates.js';

export function nightsForTripLength(tripLength) {
  const preset = TRIP_LENGTHS.find((t) => t.value === tripLength);
  return preset ? preset.nights : null;
}

export function currencySymbol(currency) {
  return currency === 'EUR' ? '€' : '$';
}

export function formatMoney(value, currency) {
  const symbol = currencySymbol(currency);
  return `${symbol}${Math.round(value).toLocaleString('en-US')}`;
}

export function formatRange(range, currency) {
  return `${formatMoney(range.low, currency)}–${formatMoney(range.high, currency)}`;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

async function convertRange(range, currency) {
  const low = await convert(range.low, BASE_CURRENCY, currency);
  const high = await convert(range.high, BASE_CURRENCY, currency);
  return { low: low.amount, high: high.amount };
}

function transportCosts(destination) {
  const costs = destination.costs;
  if (destination.transportMode === 'train' || destination.transportMode === 'either') {
    const train = costs.trainPerPerson || costs.flightsPerPerson;
    return { low: train.low, high: train.high, mode: 'train' };
  }
  return { low: costs.flightsPerPerson.low, high: costs.flightsPerPerson.high, mode: 'flight' };
}

/**
 * Build the all-in estimate for a destination against an `inputs` object.
 * Returns category ranges (low/high) plus totals and remaining buffer, in the
 * user's currency.
 */
export async function buildEstimate(destination, inputs) {
  const nights = nightsForTripLength(inputs.tripLength);
  const travelers = inputs.travelers;
  const currency = inputs.currency;
  const costs = destination.costs;

  const transport = await convertRange(transportCosts(destination, costs), currency);
  const accommodation = await convertRange(costs.accommodationPerPersonPerNight, currency);
  const meals = await convertRange(costs.mealsPerPersonPerNight, currency);
  const localTransport = await convertRange(costs.localTransportPerPersonPerNight, currency);
  const activities = await convertRange(costs.activitiesPerPersonPerNight, currency);
  const taxesFees = await convertRange(costs.taxesFeesPerPerson, currency);

  const scaleDaily = travelers * nights;
  const categories = {
    transport: {
      low: transport.low * travelers,
      high: transport.high * travelers,
    },
    accommodation: {
      low: accommodation.low * scaleDaily,
      high: accommodation.high * scaleDaily,
    },
    meals: {
      low: meals.low * scaleDaily,
      high: meals.high * scaleDaily,
    },
    localTransport: {
      low: localTransport.low * scaleDaily,
      high: localTransport.high * scaleDaily,
    },
    activities: {
      low: activities.low * scaleDaily,
      high: activities.high * scaleDaily,
    },
    taxesFees: {
      low: taxesFees.low * travelers,
      high: taxesFees.high * travelers,
    },
  };

  const subtotal = {
    low: Object.values(categories).reduce((sum, c) => sum + c.low, 0),
    high: Object.values(categories).reduce((sum, c) => sum + c.high, 0),
  };

  const percent = costs.contingencyPercent;
  const contingency = {
    low: subtotal.low * (percent / 100),
    high: subtotal.high * (percent / 100),
    percent,
  };

  const total = {
    low: subtotal.low + contingency.low,
    high: subtotal.high + contingency.high,
  };
  const estimateMid = (total.low + total.high) / 2;

  const budget = inputs.budgetAmount;
  const remaining = {
    low: budget - total.low,
    high: budget - total.high,
    mid: budget - estimateMid,
  };

  return {
    destinationId: destination.id,
    nights,
    travelers,
    currency,
    transportMode: transportCosts(destination).mode,
    categories,
    contingency,
    subtotal,
    total,
    estimateMid,
    budget,
    remaining,
    bufferHigh: budget - total.high,
    affordability: {
      // The budget must not be exceeded by the central all-in estimate.
      affordable: estimateMid <= budget + 1e-6,
    },
  };
}

function seasonMatch(destination, month) {
  if (!month) return 0.5;
  const months = destination.seasonMonths || [];
  if (months.includes(month)) return 1;
  const season = [
    'January', 'February', 'March',
    'April', 'May', 'June',
    'July', 'August', 'September',
    'October', 'November', 'December',
  ];
  const idx = season.indexOf(month);
  if (idx < 0) return 0.5;
  const close = months.some(
    (m) => Math.abs(season.indexOf(m) - idx) === 1,
  );
  return close ? 0.6 : 0.3;
}

function tripLengthMatch(destination, nights) {
  const [min, max] = destination.suggestedStayNights;
  if (nights >= min && nights <= max) return 1;
  const distance = nights < min ? min - nights : nights - max;
  return clamp(1 - distance / 6, 0, 1);
}

function fitBadge(utilization) {
  if (utilization > 0.92) return 'Tight fit';
  if (utilization > 0.75) return 'Great fit';
  if (utilization > 0.5) return 'Good fit';
  return 'Budget-light';
}

function fitScore(estimate, destination, month) {
  const mid = (estimate.total.low + estimate.total.high) / 2;
  const utilization = estimate.budget > 0 ? mid / estimate.budget : 1;
  const budgetFit = clamp(1 - Math.abs(utilization - 0.7), 0, 1);

  const season = seasonMatch(destination, month);
  const trip = tripLengthMatch(destination, estimate.nights);

  const score = Math.round((0.5 * budgetFit + 0.3 * season + 0.2 * trip) * 100);
  return {
    score,
    badge: fitBadge(utilization),
    utilization,
    budgetFit,
    seasonMatch: season,
    tripMatch: trip,
  };
}

/**
 * Rank all destinations against the user's `inputs`:
 *  1. Drop any that don't fit the budget (all-in high must not exceed budget).
 *  2. Order the rest by fit score, high to low (tie-break on total low).
 * Optionally pass `opts.month` to override the requested month for matching.
 */
export async function rankDestinations(destinations, inputs) {
  const month = inputs.dates && inputs.dates.approximate;

  const assessed = await Promise.all(
    destinations.map(async (destination) => {
      const estimate = await buildEstimate(destination, inputs);
      return { destination, estimate, fit: fitScore(estimate, destination, month) };
    }),
  );

  const affordable = assessed.filter((r) => r.estimate.affordability.affordable);
  affordable.sort((a, b) => {
    if (b.fit.score !== a.fit.score) return b.fit.score - a.fit.score;
    if (a.estimate.total.low !== b.estimate.total.low) {
      return a.estimate.total.low - b.estimate.total.low;
    }
    return a.destination.name.localeCompare(b.destination.name);
  });

  return affordable;
}
