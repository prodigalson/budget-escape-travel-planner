/**
 * Results view for Budget Escape.
 *
 * Renders the ranked, affordable destination options produced by the engine,
 * including an image-led card grid, an itemized estimate breakdown, a
 * destination detail panel, and a "refine inputs" affordance. Every result
 * surfaces its data source + last-checked time and never claims live/bookable
 * pricing.
 */

import {
  formatRange,
  formatMoney,
} from '../engine.js';
import {
  COST_SOURCE,
  COST_LAST_CHECKED,
  SHARED_ASSUMPTIONS,
} from '../data/destinations.js';
import { BASE_CURRENCY, RATES_SOURCE, RATES_LAST_CHECKED } from '../rates.js';
import { TRIP_LENGTHS } from '../inputs.js';

const CATEGORIES = [
  { key: 'transport', label: 'Transport (round trip)', basis: 'per traveler' },
  { key: 'accommodation', label: 'Accommodation', basis: 'per room, per night (shared)' },
  { key: 'meals', label: 'Meals', basis: 'per traveler, per night' },
  { key: 'localTransport', label: 'Local transport', basis: 'per traveler, per night' },
  { key: 'activities', label: 'Activities & entry', basis: 'per traveler, per night' },
  { key: 'taxesFees', label: 'Taxes & fees', basis: 'per traveler' },
];

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function tripLabel(value) {
  const preset = TRIP_LENGTHS.find((t) => t.value === value);
  return preset ? preset.label : value;
}

function badgeClass(badge) {
  const low = String(badge).toLowerCase().replace(/[^a-z]/g, '-');
  return `fit-badge fit-badge--${low}`;
}

export class ResultsView {
  constructor(root, { onRefine, onRetry } = {}) {
    this.root = root;
    this.onRefine = onRefine;
    this.onRetry = onRetry;
    this.inputs = null;
    this._results = [];
    this._lastTriggerId = null;
    this._bind();
  }

  _bind() {
    this.root.addEventListener('click', (event) => {
      const refine = event.target.closest('[data-refine]');
      if (refine) {
        if (this.onRefine) this.onRefine();
        return;
      }
      const retry = event.target.closest('[data-retry]');
      if (retry) {
        if (this.onRetry) this.onRetry();
        return;
      }
      const open = event.target.closest('[data-open-detail]');
      if (open) {
        if (open.tagName === 'A') event.preventDefault();
        this._lastTriggerId = open.dataset.openDetail;
        this._showDetail(open.dataset.openDetail);
        return;
      }
      const back = event.target.closest('[data-back]');
      if (back) {
        this._showList();
        const id = this._lastTriggerId;
        if (id) {
          const card = this.root.querySelector(`[data-open-detail="${id}"]`);
          if (card) card.focus({ preventScroll: true });
        }
        return;
      }
    });
  }

  _header() {
    const inputs = this.inputs;
    if (!inputs) return '';
    const nights = inputs.tripLength
      ? TRIP_LENGTHS.find((t) => t.value === inputs.tripLength)?.nights
      : '';
    const budget = `${formatMoney(inputs.budgetAmount, inputs.currency)} ${inputs.currency}`;
    const month = inputs.dates?.approximate || 'flexible dates';

    return `
      <div class="results__summary">
        <div class="results__summary-head">
          <span class="eyebrow">Your escape</span>
          <button type="button" class="btn btn--secondary results__refine" data-refine>
            Refine inputs
          </button>
        </div>
        <dl class="results__chips">
          <div class="results__chip"><dt>From</dt><dd>${escapeHtml(inputs.departure || '—')}</dd></div>
          <div class="results__chip"><dt>Budget</dt><dd>${budget}</dd></div>
          <div class="results__chip"><dt>Travelers</dt><dd>${inputs.travelers}</dd></div>
          <div class="results__chip"><dt>Trip</dt><dd>${escapeHtml(tripLabel(inputs.tripLength))}${nights ? ` (${nights} nights)` : ''}</dd></div>
          <div class="results__chip"><dt>When</dt><dd>${escapeHtml(month)}</dd></div>
        </dl>
      </div>
    `;
  }

  showLoading(inputs) {
    this.inputs = inputs;
    const skeletons = [0, 1, 2].map(
      () => `
        <div class="dest-card dest-card--skeleton" aria-hidden="true">
          <div class="dest-card__media skeleton-block"></div>
          <div class="dest-card__body">
            <div class="skeleton-line" style="width: 60%"></div>
            <div class="skeleton-line" style="width: 40%"></div>
          </div>
        </div>`,
    ).join('');
    this._body(`
      <div class="results__status" role="status">
        <p>Finding escapes that fit your budget…</p>
      </div>
      <div class="dest-grid">${skeletons}</div>
    `);
  }

  showError() {
    this._body(`
      <div class="results__state" role="alert">
        <h3 class="results__state-title">We couldn't load your escapes</h3>
        <p class="results__state-text">Something went wrong while estimating your trips. Please try again.</p>
        <button type="button" class="btn btn--primary" data-retry>Try again</button>
      </div>
    `);
  }

  showEmpty(inputs) {
    this.inputs = inputs;
    this._results = [];
    this._body(`
      <div class="results__state">
        <h3 class="results__state-title">No destinations fit your budget</h3>
        <p class="results__state-text">
          We can't find a destination whose all-in estimate stays within
          ${escapeHtml(formatMoney(inputs.budgetAmount, inputs.currency))}.
          Try a larger budget, a shorter trip, or fewer travelers.
        </p>
        <button type="button" class="btn btn--primary" data-refine>Refine inputs</button>
      </div>
    `);
  }

  showResults(inputs, results) {
    this.inputs = inputs;
    this._results = results;
    const cards = results
      .map((r) => this._card(r))
      .join('');
    this._body(`
      <div class="results__count" role="status">
        ${results.length} ${results.length === 1 ? 'escape' : 'escapes'} fit your budget.
      </div>
      <div class="dest-grid">${cards}</div>
    `);
  }

  _card(result) {
    const { destination, estimate, fit } = result;
    const img = destination.image;
    return `
      <article class="dest-card results__card">
        <a class="dest-card__media" href="#detail-${destination.id}" data-open-detail="${destination.id}" aria-label="View details for ${escapeHtml(destination.name)}">
          <img
            src="${escapeHtml(img.url)}"
            alt="${escapeHtml(img.alt)}"
            loading="lazy"
            decoding="async"
            referrerpolicy="no-referrer"
          />
        </a>
        <div class="dest-card__body">
          <div class="dest-card__head">
            <div>
              <h3 class="dest-card__title" id="result-${destination.id}">${escapeHtml(destination.name)}</h3>
              <p class="dest-card__place">${escapeHtml(destination.country)} · ${escapeHtml(destination.region)}</p>
            </div>
            <span class="${badgeClass(fit.badge)}">${escapeHtml(fit.badge)}</span>
          </div>
          <p class="dest-card__price" aria-label="Estimated all-in cost">
            ${formatRange(estimate.total, estimate.currency)}
          </p>
          <p class="dest-card__meta">
            Travel ${escapeHtml(destination.travelTime.label)} · Best ${escapeHtml(destination.bestSeason)}
          </p>
          <button type="button" class="btn btn--secondary dest-card__cta" data-open-detail="${destination.id}">
            View breakdown &amp; details
          </button>
        </div>
      </article>
    `;
  }

  _showDetail(id) {
    const result = this._results.find((r) => r.destination.id === id);
    if (!result) return;
    const { destination, estimate, fit } = result;
    const img = destination.image;
    const included = CATEGORIES.map(
      (c) => `<li>${escapeHtml(c.label)}</li>`,
    ).concat('<li>Contingency allowance</li>').join('');
    const rows = CATEGORIES.map(
      (c) => `
        <tr>
          <th scope="row">${escapeHtml(c.label)}</th>
          <td data-basis="${escapeHtml(c.basis)}">${formatRange(estimate.categories[c.key], estimate.currency)}</td>
        </tr>`,
    ).join('');
    const assumptions = [...SHARED_ASSUMPTIONS, ...(destination.assumptions || [])]
      .map((a) => `<li>${escapeHtml(a)}</li>`)
      .join('');
    const currencyNote =
      estimate.currency === BASE_CURRENCY
        ? `Costs are ${estimate.currency} estimates.`
        : `Costs converted to ${estimate.currency} using ${escapeHtml(RATES_SOURCE)} (${RATES_LAST_CHECKED}).`;
    const seasonYes = (destination.seasonMonths || []).includes((this.inputs?.dates?.approximate) || '');
    const tripMatch = fit.tripMatch > 0.8;
    const reasoning = [
      `Fits your ${formatMoney(this.inputs.budgetAmount, this.inputs.currency)} budget with a ${escapeHtml(fit.badge.toLowerCase())}.`,
      seasonYes
        ? `${this.inputs.dates.approximate} is in its best season.`
        : `${this.inputs.dates.approximate || 'Your chosen month'} is outside its peak season, which often means better prices.`,
      tripMatch
        ? 'Its ideal stay length lines up well with your trip.'
        : 'You may want to nudge the stay length for the best value here.',
    ].join(' ');

    const backLabel = 'Back to results';
    this._body(`
      <section class="detail" id="detail-${destination.id}" aria-labelledby="detail-title-${destination.id}">
        <button type="button" class="btn btn--secondary detail__back" data-back>← ${backLabel}</button>
        <div class="detail__hero">
          <img
            src="${escapeHtml(img.url)}"
            alt="${escapeHtml(img.alt)}"
            loading="lazy"
            decoding="async"
            referrerpolicy="no-referrer"
          />
        </div>
        <div class="detail__content">
          <span class="eyebrow">${escapeHtml(destination.country)} · ${escapeHtml(destination.region)}</span>
          <h2 class="detail__title" id="detail-title-${destination.id}">${escapeHtml(destination.name)}</h2>
          <p class="detail__tagline">${escapeHtml(destination.tagline)}</p>
          <p class="detail__price">
            Estimated all-in
            <span class="detail__price-amount">${formatRange(estimate.total, estimate.currency)}</span>
            <span class="fit-badge ${badgeClass(fit.badge)}">${escapeHtml(fit.badge)}</span>
          </p>
          <p class="detail__overview">${escapeHtml(destination.overview)}</p>

          <dl class="detail__facts">
            <div class="detail__fact"><dt>Best season</dt><dd>${escapeHtml(destination.bestSeason)}</dd></div>
            <div class="detail__fact"><dt>Travel time</dt><dd>${escapeHtml(destination.travelTime.label)}</dd></div>
            <div class="detail__fact"><dt>Suggested stay</dt><dd>${destination.suggestedStayNights[0]}–${destination.suggestedStayNights[1]} nights</dd></div>
            <div class="detail__fact"><dt>Estimate basis</dt><dd>${estimate.travelers} traveler${estimate.travelers === 1 ? '' : 's'} · ${estimate.nights} nights · ${estimate.rooms} room${estimate.rooms === 1 ? '' : 's'}</dd></div>
          </dl>

          <h3 class="detail__subhead">What's included</h3>
          <ul class="detail__list">${included}</ul>

          <h3 class="detail__subhead">Estimated breakdown</h3>
          <div class="detail__table-wrap">
            <table class="detail__table">
              <thead>
                <tr><th scope="col">Category</th><th scope="col">Estimate range</th></tr>
              </thead>
              <tbody>${rows}</tbody>
              <tfoot>
                <tr class="detail__row-subtotal"><th scope="row">Subtotal</th><td>${formatRange(estimate.subtotal, estimate.currency)}</td></tr>
                <tr><th scope="row">Contingency (${estimate.contingency.percent}%)</th><td>${formatRange(estimate.contingency, estimate.currency)}</td></tr>
                <tr class="detail__row-total"><th scope="row">All-in estimate</th><td>${formatRange(estimate.total, estimate.currency)}</td></tr>
                <tr class="detail__row-buffer"><th scope="row">Remaining buffer</th><td>approx. ${formatMoney(estimate.remaining.mid, estimate.currency)} spare</td></tr>
              </tfoot>
            </table>
          </div>

          <h3 class="detail__subhead">Why this fits</h3>
          <p class="detail__reasoning">${escapeHtml(reasoning)}</p>

          <h3 class="detail__subhead">Assumptions</h3>
          <ul class="detail__list">${assumptions}</ul>

          <p class="detail__source">
            ${escapeHtml(COST_SOURCE)}, last checked ${COST_LAST_CHECKED}. ${currencyNote}
            Estimates are illustrative, not live or bookable.
          </p>
          <p class="detail__credit">${escapeHtml(img.credit)} — ${escapeHtml(img.license)}.</p>

          <div class="detail__cta">
            <button type="button" class="btn btn--primary" data-refine>Refine inputs</button>
          </div>
        </div>
      </section>
    `);
    const backEl = this.root.querySelector('.detail__back');
    if (backEl) backEl.focus({ preventScroll: true });
  }

  _showList() {
    if (!this._results.length) {
      this.showEmpty(this.inputs);
      return;
    }
    this.showResults(this.inputs, this._results);
  }

  _body(html) {
    this.root.innerHTML = `
      <section class="results" aria-live="polite" aria-label="Escape results">
        ${this._header()}
        <div class="results__body">${html}</div>
      </section>
    `;
  }
}
