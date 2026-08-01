const STYLE_ID = 'budget-control-styles';

const CURRENCIES = {
  USD: {
    symbol: '$',
    label: 'USD',
    format: (n) => new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(n),
  },
  EUR: {
    symbol: '€',
    label: 'EUR',
    format: (n) => new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(n),
  },
};

const RADIUS = 90;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function svgEl(name, attrs) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', name);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

let styleInjected = false;
function injectStyles() {
  if (styleInjected) return;
  styleInjected = true;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .budget-ring__handle {
      pointer-events: none;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Reusable circular budget selector.
 *
 * Renders an interactive ring (click / drag to position the needle) plus an
 * exact-amount input and a currency toggle. Emits `change` events with
 * `{ amount, currency }`.
 */
export class BudgetControl {
  /**
   * @param {HTMLElement} root
   * @param {object} [options]
   * @param {number[]} [options.tiers] preset amounts offered as quick chips
   * @param {number} [options.min=100] minimum budget
   * @param {number} [options.max=20000] maximum budget
   * @param {number} [options.step=100] step for pointer/exact adjustment
   * @param {string} [options.currency='USD']
   * @param {(value: {amount:number, currency:string}) => void} [options.onChange]
   */
  constructor(root, options = {}) {
    this.root = root;
    this.min = options.min ?? 100;
    this.max = options.max ?? 20000;
    this.step = options.step ?? 100;
    this.tiers = options.tiers ?? [500, 1000, 2000, 4000];
    this.currency = options.currency ?? 'USD';
    this.onChange = options.onChange;
    this.amount = clamp(options.amount ?? 1000, this.min, this.max);
    this._pointer = null;

    injectStyles();
    this._render();
    this._bind();
  }

  get current() {
    return { amount: this.amount, currency: this.currency };
  }

  _currency() {
    return CURRENCIES[this.currency] ?? CURRENCIES.USD;
  }

  _render() {
    this.root.replaceChildren();

    const label = document.createElement('p');
    label.className = 'budget-control__label';
    label.id = 'budget-control-label';
    label.textContent = 'Total vacation budget';

    this.root.appendChild(label);

    const ring = document.createElement('div');
    ring.className = 'budget-ring';
    ring.tabIndex = 0;
    ring.setAttribute('role', 'slider');
    ring.setAttribute('aria-labelledby', 'budget-control-label');
    ring.setAttribute('aria-valuemin', String(this.min));
    ring.setAttribute('aria-valuemax', String(this.max));
    ring.setAttribute('aria-valuenow', String(this.amount));

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 220 220');
    svg.setAttribute('aria-hidden', 'true');

    const track = svgEl('circle', {
      class: 'budget-ring__track',
      cx: '110',
      cy: '110',
      r: String(RADIUS),
    });
    const progress = svgEl('circle', {
      class: 'budget-ring__progress',
      cx: '110',
      cy: '110',
      r: String(RADIUS),
      'stroke-dasharray': String(CIRCUMFERENCE),
      'stroke-dashoffset': String(CIRCUMFERENCE),
      'transform': 'rotate(-90 110 110)',
    });
    svg.append(track, progress);
    ring.appendChild(svg);

    const display = document.createElement('div');
    display.className = 'budget-ring__display';
    const amount = document.createElement('span');
    amount.className = 'budget-ring__amount';
    const currency = document.createElement('span');
    currency.className = 'budget-ring__currency';
    currency.textContent = this.currency;
    const hint = document.createElement('span');
    hint.className = 'budget-ring__hint';
    hint.textContent = 'Tap, drag, or use arrow keys';
    display.append(amount, currency, hint);
    ring.appendChild(display);

    this.root.appendChild(ring);

    const exact = document.createElement('div');
    exact.className = 'budget-control__exact';

    const input = document.createElement('input');
    input.className = 'budget-control__exact-input';
    input.type = 'number';
    input.min = String(this.min);
    input.max = String(this.max);
    input.step = String(this.step);
    input.value = String(this.amount);
    input.setAttribute('aria-label', 'Exact budget amount');
    this._input = input;

    const currencyBtn = document.createElement('button');
    currencyBtn.type = 'button';
    currencyBtn.className = 'budget-control__currency';
    currencyBtn.textContent = this._currency().label;
    currencyBtn.setAttribute('aria-pressed', 'false');
    currencyBtn.addEventListener('click', () => this.toggleCurrency());
    this._currencyBtn = currencyBtn;

    exact.append(input, currencyBtn);
    this.root.appendChild(exact);

    if (this.tiers.length) {
      const chips = document.createElement('div');
      chips.className = 'budget-control__tiers';
      for (const tier of this.tiers) {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'budget-control__tier';
        chip.dataset.amount = String(tier);
        chip.textContent = this._currency().format(tier);
        chip.addEventListener('click', () => this.setAmount(tier));
        chips.appendChild(chip);
      }
      this.root.appendChild(chips);
    }

    this._ring = ring;
    this._progress = progress;
    this._amountEl = amount;
    this._sync();
  }

  _sync() {
    const frac = (this.amount - this.min) / (this.max - this.min);
    const offset = CIRCUMFERENCE * (1 - frac);
    this._progress.setAttribute('stroke-dashoffset', String(offset));
    this._amountEl.textContent = this._currency().format(this.amount);
    if (this._input && Number(this._input.value) !== this.amount) {
      this._input.value = String(this.amount);
    }
    this._ring.setAttribute('aria-valuenow', String(this.amount));
    this._ring.setAttribute('aria-valuetext', this._currency().format(this.amount));
  }

  setAmount(value) {
    this.amount = Math.round(clamp(value, this.min, this.max) / this.step) * this.step;
    this._sync();
    this._emit();
  }

  setCurrency(currency) {
    if (!CURRENCIES[currency]) return;
    this.currency = currency;
    if (this._currencyBtn) {
      this._currencyBtn.textContent = CURRENCIES[currency].label;
    }
    if (this.root) {
      const hints = this.root.querySelectorAll('.budget-ring__currency');
      hints.forEach((el) => { el.textContent = currency; });
      this.root.querySelectorAll('.budget-control__tier').forEach((chip) => {
        chip.textContent = CURRENCIES[currency].format(Number(chip.dataset.amount));
      });
    }
    this._sync();
    this._emit();
  }

  toggleCurrency() {
    this.setCurrency(this.currency === 'USD' ? 'EUR' : 'USD');
  }

  _emit() {
    if (typeof this.onChange === 'function') {
      this.onChange(this.current);
    }
    this.root.dispatchEvent(
      new CustomEvent('change', {
        detail: this.current,
        bubbles: true,
      }),
    );
  }

  _angleFromEvent(event) {
    const rect = this._ring.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let angle = (Math.atan2(event.clientY - cy, event.clientX - cx) * 180) / Math.PI;
    angle = (angle + 90 + 360) % 360; // 0 at top, clockwise
    return angle;
  }

  _valueFromAngle(angle) {
    const frac = clamp(angle / 360, 0, 1);
    return Math.round((this.min + frac * (this.max - this.min)) / this.step) * this.step;
  }

  _bind() {
    const apply = (event) => this.setAmount(this._valueFromAngle(this._angleFromEvent(event)));

    const onPointerDown = (event) => {
      event.preventDefault();
      this._pointer = event.pointerId;
      this._ring.setPointerCapture(event.pointerId);
      apply(event);
    };

    const onPointerMove = (event) => {
      if (this._pointer !== event.pointerId) return;
      apply(event);
    };

    const onPointerUp = (event) => {
      if (this._pointer !== event.pointerId) return;
      this._pointer = null;
      this._ring.releasePointerCapture(event.pointerId);
    };

    this._ring.addEventListener('pointerdown', onPointerDown);
    this._ring.addEventListener('pointermove', onPointerMove);
    this._ring.addEventListener('pointerup', onPointerUp);
    this._ring.addEventListener('pointercancel', onPointerUp);

    this._ring.addEventListener('keydown', (event) => {
      let next = null;
      if (event.key === 'ArrowUp' || event.key === 'ArrowRight') {
        next = this.amount + this.step;
      } else if (event.key === 'ArrowDown' || event.key === 'ArrowLeft') {
        next = this.amount - this.step;
      }
      if (next !== null) {
        event.preventDefault();
        this.setAmount(next);
      }
    });

    this._input.addEventListener('change', () => {
      const parsed = Number(this._input.value);
      if (Number.isFinite(parsed)) this.setAmount(parsed);
    });
  }
}
