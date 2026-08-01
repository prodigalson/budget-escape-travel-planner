import { BudgetControl } from './budget-control.js';
import {
  BUDGET,
  TRIP_LENGTHS,
  MONTHS,
  FLEXIBILITY,
  FLEXIBILITY_OPTIONS,
  FLEX_DAYS,
  createInputs,
  validateInputs,
} from '../inputs.js';
import { validateDeparture } from '../departure.js';

function monthsOptions() {
  return MONTHS.map((m) => `<option value="${m}">${m}</option>`).join('');
}

/**
 * Mobile-first input flow: departure, budget (circular + exact + currency),
 * travelers, trip length, and dates with flexibility. Emits a single
 * structured `inputs` object (see `src/inputs.js`) on every change.
 */
export class InputFlow {
  constructor(root, options = {}) {
    this.root = root;
    this.onChange = options.onChange;
    this.onSubmit = options.onSubmit;
    this.inputs = options.initial ? { ...createInputs(), ...options.initial } : createInputs();
    this._errors = {};
    this._departurePending = false;
    this._render();
    this._mountBudget();
    this._bind();
    this._validate();
  }

  get value() {
    return { ...this.inputs, dates: { ...this.inputs.dates } };
  }

  _render() {
    const tripOptions = TRIP_LENGTHS.map(
      (t) =>
        `<button type="button" class="flow__choice-btn" role="radio" data-trip="${t.value}" aria-checked="false">${t.label}</button>`,
    ).join('');

    const flexOptions = FLEXIBILITY_OPTIONS.map(
      (f) =>
        `<button type="button" class="flow__segmented-btn" role="radio" data-flex="${f.value}" aria-checked="${this.inputs.dates.flexibility === f.value}">${f.label}</button>`,
    ).join('');

    const flexDayChips = FLEX_DAYS.map(
      (d) =>
        `<button type="button" class="flow__choice-btn flow__choice-btn--sm" role="radio" data-flex-day="${d}" aria-checked="${this.inputs.dates.flexDays === d}">±${d}</button>`,
    ).join('');

    const flexibility = this.inputs.dates.flexibility;
    const showFlex = flexibility === FLEXIBILITY.flexible;
    const showFixed = flexibility === FLEXIBILITY.fixed;

    this.root.innerHTML = `
      <form class="flow" novalidate>
        <div class="flow__fields">

          <div class="flow__field" data-field="departure">
            <label class="flow__label" for="flow-departure">Departure city or station</label>
            <div class="flow__control">
              <input class="flow__input" id="flow-departure" name="departure" type="text"
                     autocomplete="off" spellcheck="false"
                     placeholder="e.g. Milan or Milano Centrale"
                     aria-describedby="departure-hint departure-error" />
              <span class="flow__status" data-departure-status aria-hidden="true"></span>
            </div>
            <p class="flow__hint" id="departure-hint">Where are you starting from?</p>
            <p class="flow__error" id="departure-error" data-error="departure" role="alert" hidden></p>
          </div>

          <div class="flow__field flow__field--budget" data-field="budget">
            <div class="flow__budget-slot" data-budget></div>
            <p class="flow__error" data-error="budget" role="alert" hidden></p>
          </div>

          <div class="flow__field" data-field="travelers">
            <span class="flow__label" id="travelers-label">Travelers</span>
            <div class="flow__stepper">
              <button type="button" class="flow__step" data-step="-1"
                      aria-label="One fewer traveler" aria-describedby="travelers-value">−</button>
              <output class="flow__stepper-value" id="travelers-value" data-travelers for="travelers-label">1</output>
              <button type="button" class="flow__step" data-step="1"
                      aria-label="One more traveler" aria-describedby="travelers-value">+</button>
            </div>
            <p class="flow__error" data-error="travelers" role="alert" hidden></p>
          </div>

          <fieldset class="flow__field" data-field="tripLength">
            <legend class="flow__label">Trip length</legend>
            <div class="flow__choice" role="radiogroup" aria-label="Trip length" data-trip-group>
              ${tripOptions}
            </div>
            <p class="flow__error" data-error="tripLength" role="alert" hidden></p>
          </fieldset>

          <fieldset class="flow__field" data-field="dates">
            <legend class="flow__label">When would you like to travel?</legend>

            <label class="flow__label flow__label--soft" for="flow-month">Approximate month</label>
            <select class="flow__select" id="flow-month" data-month
                    aria-describedby="month-error approximate-error">
              <option value="">Select a month</option>
              ${monthsOptions()}
            </select>

            <div class="flow__segmented" role="radiogroup" aria-label="Date flexibility" data-flex-group>
              ${flexOptions}
            </div>

            <div class="flow__flex" data-flex-days ${showFlex ? '' : 'hidden'}>
              <span class="flow__hint" id="flex-days-hint">Flexible within ± days</span>
              <div class="flow__choice" role="radiogroup" aria-label="Flexible offset days" data-flex-days-group>
                ${flexDayChips}
              </div>
            </div>

            <div class="flow__fixed" data-fixed ${showFixed ? '' : 'hidden'}>
              <div class="flow__date">
                <label class="flow__label flow__label--soft" for="flow-start">Start date</label>
                <input class="flow__input" type="date" id="flow-start" data-start />
              </div>
              <div class="flow__date">
                <label class="flow__label flow__label--soft" for="flow-end">End date</label>
                <input class="flow__input" type="date" id="flow-end" data-end />
              </div>
            </div>

            <p class="flow__error" data-error="approximate" role="alert" hidden></p>
            <p class="flow__error" data-error="dates" role="alert" hidden></p>
          </fieldset>
        </div>

        <div class="flow__cta">
          <p class="flow__summary" data-summary role="status"></p>
          <button type="submit" class="btn btn--primary flow__submit" data-submit disabled>
            See my escapes
          </button>
        </div>
      </form>
    `;

    this._els = {
      departure: this.root.querySelector('#flow-departure'),
      month: this.root.querySelector('#flow-month'),
      start: this.root.querySelector('#flow-start'),
      end: this.root.querySelector('#flow-end'),
      travelers: this.root.querySelector('[data-travelers]'),
      stepButtons: [...this.root.querySelectorAll('[data-step]')],
      tripGroup: this.root.querySelector('[data-trip-group]'),
      flexGroup: this.root.querySelector('[data-flex-group]'),
      flexDaysGroup: this.root.querySelector('[data-flex-days-group]'),
      flexDays: this.root.querySelector('[data-flex-days]'),
      fixed: this.root.querySelector('[data-fixed]'),
      submit: this.root.querySelector('[data-submit]'),
      summary: this.root.querySelector('[data-summary]'),
      departureStatus: this.root.querySelector('[data-departure-status]'),
    };
  }

  _mountBudget() {
    const slot = this.root.querySelector('[data-budget]');
    this.budget = new BudgetControl(slot, {
      min: BUDGET.min,
      max: BUDGET.max,
      step: BUDGET.step,
      tiers: [750, 1500, 2500, 4000],
      amount: this.inputs.budgetAmount,
      currency: this.inputs.currency,
      onChange: ({ amount, currency }) => {
        this.inputs.budgetAmount = amount;
        this.inputs.currency = currency;
        this._validate();
        this._emit();
      },
    });
  }

  _bind() {
    this._els.departure.addEventListener('change', () => this._onDepartureChange());
    this._els.month.addEventListener('change', () => {
      this.inputs.dates.approximate = this._els.month.value;
      this._validate();
      this._emit();
    });
    this._els.start.addEventListener('change', () => {
      this.inputs.dates.start = this._els.start.value;
      this._validate();
      this._emit();
    });
    this._els.end.addEventListener('change', () => {
      this.inputs.dates.end = this._els.end.value;
      this._validate();
      this._emit();
    });

    this._els.stepButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const delta = Number(btn.dataset.step);
        const next = Math.min(12, Math.max(1, this.inputs.travelers + delta));
        if (next !== this.inputs.travelers) {
          this.inputs.travelers = next;
          this._els.travelers.textContent = String(next);
          this._validate();
          this._emit();
        }
      });
    });

    this._els.tripGroup.addEventListener('click', (event) => {
      const btn = event.target.closest('[data-trip]');
      if (!btn) return;
      this.inputs.tripLength = btn.dataset.trip;
      this._els.tripGroup
        .querySelectorAll('[data-trip]')
        .forEach((b) => b.setAttribute('aria-checked', String(b === btn)));
      this._validate();
      this._emit();
    });

    this._els.flexGroup.addEventListener('click', (event) => {
      const btn = event.target.closest('[data-flex]');
      if (!btn) return;
      const value = btn.dataset.flex;
      this.inputs.dates.flexibility = value;
      this._els.flexGroup
        .querySelectorAll('[data-flex]')
        .forEach((b) => b.setAttribute('aria-checked', String(b === btn)));
      this._els.flexDays.hidden = value !== FLEXIBILITY.flexible;
      this._els.fixed.hidden = value !== FLEXIBILITY.fixed;
      this._validate();
      this._emit();
    });

    this._els.flexDaysGroup.addEventListener('click', (event) => {
      const btn = event.target.closest('[data-flex-day]');
      if (!btn) return;
      this.inputs.dates.flexDays = Number(btn.dataset.flexDay);
      this._els.flexDaysGroup
        .querySelectorAll('[data-flex-day]')
        .forEach((b) => b.setAttribute('aria-checked', String(b === btn)));
      this._validate();
      this._emit();
    });

    this.root.addEventListener('submit', (event) => this._onSubmit(event));
  }

  _onDepartureChange() {
    const value = this._els.departure.value;
    this.inputs.departure = value;
    this._validate();
    this._departureStatus(value);
    this._emit();
  }

  async _departureStatus(value) {
    const status = this._els.departureStatus;
    status.className = 'flow__status flow__status--loading';
    status.textContent = '';
    status.setAttribute('aria-hidden', 'true');
    this._departurePending = true;

    const result = await validateDeparture(value);

    this._departurePending = false;
    if (this._els.departure.value !== result.normalized) return;

    if (result.ok) {
      status.className = 'flow__status flow__status--ok';
      status.textContent = '✓';
      status.setAttribute('aria-hidden', 'true');
      this.inputs.departure = result.normalized;
    } else {
      status.className = 'flow__status flow__status--error';
      status.textContent = '';
      status.removeAttribute('aria-hidden');
      this.inputs.departure = value;
      this._validate();
    }
  }

  _onSubmit(event) {
    event.preventDefault();
    const errors = validateInputs(this.inputs);
    if (Object.keys(errors).length) {
      this._errors = errors;
      this._renderErrors();
      return;
    }
    if (this.onSubmit) this.onSubmit(this.value);
  }

  _setFieldError(key) {
    const node = this._els
      ? this.root.querySelector(`[data-error="${key}"]`)
      : null;
    if (!node) return;
    if (this._errors[key]) {
      node.textContent = this._errors[key];
      node.hidden = false;
    } else {
      node.textContent = '';
      node.hidden = true;
    }
  }

  _renderErrors() {
    ['departure', 'budget', 'travelers', 'tripLength', 'approximate', 'dates'].forEach((key) => {
      this._setFieldError(key);
    });
    const invalid = Boolean(this._errors.departure) || this._departurePending;
    this._els.departure.setAttribute('aria-invalid', invalid ? 'true' : 'false');
  }

  _validate() {
    this._errors = validateInputs(this.inputs);
    this._renderErrors();

    const complete = Object.keys(this._errors).length === 0;
    this._els.submit.disabled = !complete;
    const missing = Object.keys(this._errors).length;
    if (complete) {
      this._els.summary.textContent = 'Looks good — ready to explore.';
    } else {
      this._els.summary.textContent =
        missing === 1
          ? 'One thing left to fill in.'
          : `${missing} things left to fill in.`;
    }
  }

  _emit() {
    if (typeof this.onChange === 'function') {
      this.onChange(this.value);
    }
    this.root.dispatchEvent(
      new CustomEvent('change', { detail: this.value, bubbles: true }),
    );
  }
}
