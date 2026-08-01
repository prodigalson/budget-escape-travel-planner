import { InputFlow } from './components/input-flow.js';
import { ResultsView } from './components/results.js';
import { DESTINATIONS } from './data/destinations.js';
import { rankDestinations } from './engine.js';

const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = String(new Date().getFullYear());

const flowRoot = document.getElementById('input-flow');
const resultsRoot = document.getElementById('results');

function scrollTo(el) {
  if (el && typeof el.scrollIntoView === 'function') {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

const resultsView = new ResultsView(resultsRoot, {
  onRefine: () => {
    scrollTo(flowRoot);
    if (flowRoot) {
      const first = flowRoot.querySelector('input');
      if (first) first.focus({ preventScroll: true });
    }
  },
  onRetry: () => {
    if (currentInputs) run(currentInputs);
  },
});

async function run(inputs) {
  resultsView.showLoading(inputs);
  try {
    const ranked = await rankDestinations(DESTINATIONS, inputs);
    if (ranked.length) {
      resultsView.showResults(inputs, ranked);
    } else {
      resultsView.showEmpty(inputs);
    }
    scrollTo(resultsRoot);
  } catch (error) {
    console.error('Failed to estimate escapes:', error);
    resultsView.showError();
  }
}

let currentInputs = null;

if (flowRoot) {
  new InputFlow(flowRoot, {
    onChange: (inputs) => {
      currentInputs = inputs;
    },
    onSubmit: (inputs) => {
      currentInputs = inputs;
      run(inputs);
    },
  });
}
