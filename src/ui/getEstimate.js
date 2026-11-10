// getEstimate.js: joins the three layers.
//
//   client text --> AI classifier (Member 1) --> client corrections
//               --> understood / missing split --> pricing formula (Member 2)
//               --> estimate shown by render.js (Member 3)
//
// The real model runs by default. Add `?mock` to the URL
// (e.g. http://localhost:5173/?mock) to use the fake classifier instead:
// no download, fixed labels, useful for working on the interface.

import * as realClassifier from '../ai/classifier.js';
import * as mockClassifier from '../ai/mockClassifier.js';
import { applyCorrections, toUnderstoodMissing } from '../ai/helpers.js';
import { calculate } from '../pricing/calculate.js';

export const usingMock = new URLSearchParams(window.location.search).has('mock');
const ai = usingMock ? mockClassifier : realClassifier;

// Start downloading the model. onPercent receives one 0 to 100 number.
export function preloadModel(onPercent = () => {}) {
  return ai.preloadClassifier((event) => onPercent(ai.downloadPercent(event)));
}

// request = { text: 'what the client typed', corrections: { factor: 'label' } }
export async function getEstimate({ text, corrections = {} }, onPercent = () => {}) {
  const result = await ai.classify(text, (event) => onPercent(ai.downloadPercent(event)));
  const corrected = applyCorrections(result, corrections);
  return calculate(toUnderstoodMissing(corrected));
}
