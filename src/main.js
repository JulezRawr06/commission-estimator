import './ui/styles.css';

import { getEstimate } from './ui/getEstimate.js';
import { addMessage, renderEstimate, setStatus } from './ui/render.js';

const form = document.querySelector('#request-form');
const input = document.querySelector('#request');

let lastText = '';
let corrections = {};
let currentCard = null;

async function run() {
  setStatus('loading', 'Working out your estimate...');
  try {
    const estimate = await getEstimate({ text: lastText, corrections });
    currentCard?.remove();
    currentCard = renderEstimate(estimate, corrections, onCorrect);
    setStatus('ready');
  } catch (error) {
    console.error(error);
    setStatus('error', 'Something went wrong. Please try again, or message the artist directly.');
  }
}

function onCorrect(factor, label) {
  corrections[factor] = label;
  run();
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  lastText = text;
  corrections = {};
  currentCard = null;
  addMessage(text, 'client');
  input.value = '';
  run();
});