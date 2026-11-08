// helpers.js: small pure functions that connect the classifier to the rest of the app.
// Member 2 (pricing) and Member 3 (UI) can use these directly or ignore them.
// No model code here, so they are safe to unit test and to use with the mock.

// The UI lets the client fix a wrong guess: corrections = { factor: 'label' }.
// A correction is the client's own answer, so it beats the AI: it becomes
// confident with score 1. Empty values (the "Choose one" option) are ignored.
export function applyCorrections(result, corrections = {}) {
  const factors = {};
  for (const [factor, info] of Object.entries(result.factors)) {
    const corrected = corrections[factor];
    factors[factor] = corrected
      ? { ...info, label: corrected, score: 1, confident: true, corrected: true }
      : info;
  }
  return { ...result, factors };
}

// Split a result into the two lists the UI already renders
// (same shape as src/mock/sampleEstimate.js):
//   understood: [{ factor, label, score }]   -> shown with a dropdown to change it
//   missing:    [{ factor, score }]          -> the UI asks a follow-up question
export function toUnderstoodMissing(result) {
  const understood = [];
  const missing = [];
  for (const [factor, info] of Object.entries(result.factors)) {
    if (info.confident) understood.push({ factor, label: info.label, score: info.score });
    else missing.push({ factor, score: info.score });
  }
  return { understood, missing };
}
