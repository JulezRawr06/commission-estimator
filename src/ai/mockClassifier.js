// mockClassifier.js: same API as classifier.js, but no model and no download.
// Values match src/mock/sampleEstimate.js (characters is low-confidence on purpose,
// so the follow-up question path can be built and tested).
//
// To use it, change one import:
//   import { classify, preloadClassifier } from '../ai/mockClassifier.js';   // fake
//   import { classify, preloadClassifier } from '../ai/classifier.js';       // real

const SAMPLE = {
  normalizedText: '',
  model: 'mock',
  elapsedMs: 300,
  factors: {
    framing: { label: 'full-body', score: 0.82, confident: true, scores: { headshot: 0.04, 'half-body': 0.14, 'full-body': 0.82 } },
    style: { label: 'anime', score: 0.74, confident: true, scores: { chibi: 0.06, anime: 0.74, cartoon: 0.06, realistic: 0.1, 'pixel art': 0.04 } },
    characters: { label: 'two', score: 0.41, confident: false, scores: { one: 0.33, two: 0.41, 'three or more': 0.26 } },
    background: { label: 'detailed', score: 0.69, confident: true, scores: { none: 0.06, simple: 0.25, detailed: 0.69 } },
    usage: { label: 'commercial', score: 0.88, confident: true, scores: { personal: 0.12, commercial: 0.88 } },
  },
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function preloadClassifier(onProgress = () => {}) {
  for (const progress of [10, 40, 70, 100]) {
    onProgress({ status: 'progress', file: 'mock-model.onnx', progress });
    await wait(150);
  }
  onProgress({ status: 'ready' });
}

export async function classify(text, onProgress) {
  await preloadClassifier(onProgress);
  return { ...SAMPLE, text, normalizedText: text };
}

export function downloadPercent(event) {
  return event?.status === 'progress' ? Math.round(event.progress ?? 0) : 0;
}
