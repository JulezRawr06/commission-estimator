// classifier.worker.js: runs the model off the main thread so the page stays
// responsive (loading bar, buttons) while the phone does the heavy work.
// Do not import this directly. Use classifier.js.

import { pipeline } from '@huggingface/transformers';
import { FACTORS, MODEL_ID } from './labels.js';
import { normalize } from './normalize.js';

let modelPromise = null;

function loadModel() {
  if (!modelPromise) {
    modelPromise = pipeline('zero-shot-classification', MODEL_ID, {
      dtype: 'q8', // smaller quantized weights: faster download on mobile data
      progress_callback: (progress) => self.postMessage({ type: 'progress', progress }),
    }).catch((error) => {
      modelPromise = null; // allow a retry after a failed download
      throw error;
    });
  }
  return modelPromise;
}

async function classify(text) {
  const started = performance.now();
  const model = await loadModel();
  const normalizedText = normalize(text);

  const factors = {};
  // One pass per factor, in order. WASM runs on one thread anyway.
  for (const [factor, config] of Object.entries(FACTORS)) {
    const output = await model(normalizedText, config.labels.map((l) => l.phrase), {
      hypothesis_template: config.template,
      multi_label: false, // scores across one factor's labels add up to 1
    });

    const idByPhrase = Object.fromEntries(config.labels.map((l) => [l.phrase, l.id]));
    const scores = {};
    output.labels.forEach((phrase, i) => {
      scores[idByPhrase[phrase]] = Number(output.scores[i].toFixed(3));
    });

    const score = Number(output.scores[0].toFixed(3));
    factors[factor] = {
      label: idByPhrase[output.labels[0]],
      score,
      confident: score >= config.threshold,
      scores,
    };
  }

  return { text, normalizedText, model: MODEL_ID, elapsedMs: Math.round(performance.now() - started), factors };
}

self.onmessage = async ({ data }) => {
  const { id, type, text } = data;
  try {
    if (type === 'load') {
      await loadModel();
      self.postMessage({ id, type: 'loaded' });
    } else if (type === 'classify') {
      self.postMessage({ id, type: 'result', result: await classify(text) });
    }
  } catch (error) {
    self.postMessage({ id, type: 'error', message: error?.message ?? String(error) });
  }
};
