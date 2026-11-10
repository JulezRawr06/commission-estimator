import './ui/styles.css';

import { getEstimate, preloadModel, usingMock } from './ui/getEstimate.js';
import { addMessage, renderEstimate, setStatus } from './ui/render.js';

const form = document.querySelector('#request-form');
const input = document.querySelector('#request');

let lastText = '';
let corrections = {};
let currentCard = null;
let modelReady = false;

function loadingMessage(percent) {
  if (percent >= 100) return 'Starting the AI model...';
  return percent > 0
    ? `Loading the AI model (first visit only)... ${percent}%`
    : 'Loading the AI model (first visit only)...';
}

// Start the model download as soon as the page opens, so it is ready by the
// time the client finishes typing. The send button stays enabled: if the client
// sends early, the request simply waits for the download to finish.
function preload() {
  setStatus('busy', loadingMessage(0));
  preloadModel((percent) => {
    if (!modelReady) setStatus('busy', loadingMessage(percent));
  })
    .then(() => {
      modelReady = true;
      setStatus('ready', usingMock ? 'Using the test classifier (mock mode).' : '');
    })
    .catch((error) => {
      console.error(error);
      setStatus('error', 'The AI model could not be downloaded. Check your connection and send your request to try again.');
    });
}

async function run() {
  setStatus('loading', modelReady ? 'Working out your estimate...' : loadingMessage(0));
  try {
    const estimate = await getEstimate({ text: lastText, corrections }, (percent) => {
      if (!modelReady) setStatus('loading', loadingMessage(percent));
    });
    modelReady = true;
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

preload();
