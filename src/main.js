import { BudgetControl } from './components/budget-control.js';

const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = String(new Date().getFullYear());

const budgetRoot = document.getElementById('budget-control');
if (budgetRoot) {
  new BudgetControl(budgetRoot, {
    min: 300,
    max: 20000,
    step: 100,
    tiers: [750, 1500, 2500, 4000],
    amount: 1500,
    currency: 'USD',
    onChange: ({ amount, currency }) => {
      console.info(`Budget selected: ${amount} ${currency}`);
    },
  });
}
