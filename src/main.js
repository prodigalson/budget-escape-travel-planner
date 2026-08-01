import { InputFlow } from './components/input-flow.js';

const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = String(new Date().getFullYear());

const flowRoot = document.getElementById('input-flow');
if (flowRoot) {
  new InputFlow(flowRoot, {
    onChange: (inputs) => {
      console.info('Inputs updated:', inputs);
    },
    onSubmit: (inputs) => {
      console.info('Escapes requested with:', inputs);
    },
  });
}
