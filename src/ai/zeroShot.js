// zeroShot.js: the per-factor zero-shot step, shared by the browser worker
// (classifier.worker.js) and the Node evaluation script (evalClassifier.js),
// so both run exactly the same logic.
//
// `model` is a Transformers.js zero-shot-classification pipeline.
// Returns the `factors` object described in classifier.js.

import { FACTORS } from './labels.js';

export async function classifyFactors(model, normalizedText, factors = FACTORS) {
  const result = {};
  // One pass per factor, in order. WASM runs on one thread anyway.
  for (const [factor, config] of Object.entries(factors)) {
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
    const label = idByPhrase[output.labels[0]];
    // A label may set its own, stricter threshold (e.g. 'commercial', because a
    // wrong commercial guess raises the price by 75%). Otherwise use the factor's.
    const threshold = config.labels.find((l) => l.id === label)?.threshold ?? config.threshold;
    result[factor] = {
      label,
      score,
      confident: score >= threshold,
      scores,
    };
  }
  return result;
}
