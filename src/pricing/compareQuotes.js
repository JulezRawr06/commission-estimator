// compareQuotes.js: compares the app's estimates with the artist's real past quotes.
// OWNER: Member 2. Run with: npm run compare:quotes
//
// For each quote in src/docs/pastQuotes.js it prices the artist's labels with
// calculate() and reports how far the app's middle price is from the real quote,
// and whether the real quote falls inside the app's range.
//
// This checks the PRICING (rate card and formula), not the AI: the labels come
// from the artist, not from the classifier. Use evalClassifier.js for the AI.
//
// Member 2's "done when": at least 10 past quotes land close.
// "Close" here = the real quote is inside the app's range, or within
// CLOSE_ENOUGH of the middle price. Agree this definition with the group.

import { calculate } from './calculate.js';
import { PAST_QUOTES } from '../docs/pastQuotes.js';

const CLOSE_ENOUGH = 0.2; // 20% of the middle price
const NEEDED = 10;
const FACTORS = ['framing', 'style', 'characters', 'background', 'usage'];

if (PAST_QUOTES.length === 0) {
  console.log('No past quotes yet. Add the artist\'s quotes to src/docs/pastQuotes.js, then run this again.');
  process.exit(0);
}

const peso = (n) => `P${Math.round(n).toLocaleString('en-PH')}`;
const pct = (n) => `${n >= 0 ? '+' : ''}${(n * 100).toFixed(0)}%`;

const rows = PAST_QUOTES.map((q) => {
  const labels = q.labels ?? {};
  const estimate = calculate({
    understood: Object.entries(labels).map(([factor, label]) => ({ factor, label, score: 1 })),
    missing: FACTORS.filter((f) => !(f in labels)).map((factor) => ({ factor, score: 0 })),
  });
  const error = (estimate.point - q.quote) / q.quote; // + means the app is too high
  const inRange = q.quote >= estimate.low && q.quote <= estimate.high;
  const close = inRange || Math.abs(estimate.point - q.quote) / estimate.point <= CLOSE_ENOUGH;
  return { q, estimate, error, inRange, close };
});

console.log('\nid      quote      app range              middle     error   in range  close');
for (const r of rows) {
  console.log(
    [
      String(r.q.id).padEnd(7),
      peso(r.q.quote).padEnd(10),
      `${peso(r.estimate.low)} to ${peso(r.estimate.high)}`.padEnd(22),
      peso(r.estimate.point).padEnd(10),
      pct(r.error).padStart(6),
      (r.inRange ? 'yes' : 'no').padStart(9),
      (r.close ? 'yes' : 'no').padStart(6),
    ].join(' '),
  );
}

const meanAbs = rows.reduce((sum, r) => sum + Math.abs(r.error), 0) / rows.length;
const meanSigned = rows.reduce((sum, r) => sum + r.error, 0) / rows.length;
const inRange = rows.filter((r) => r.inRange).length;
const close = rows.filter((r) => r.close).length;

console.log(`\nQuotes compared:        ${rows.length}`);
console.log(`Average error (size):   ${(meanAbs * 100).toFixed(1)}%`);
console.log(`Average error (signed): ${pct(meanSigned)}  (+ means the app quotes too high overall)`);
console.log(`Real quote in range:    ${inRange} of ${rows.length}`);
console.log(`Close (range or ${CLOSE_ENOUGH * 100}%):   ${close} of ${rows.length}`);

// Per-factor hint: which labels are most often over or under priced.
const byLabel = {};
for (const r of rows) {
  for (const [factor, label] of Object.entries(r.q.labels ?? {})) {
    const key = `${factor}=${label}`;
    (byLabel[key] ??= []).push(r.error);
  }
}
console.log('\nAverage error by label (look for labels that are always too high or too low):');
for (const [key, errors] of Object.entries(byLabel).sort()) {
  const avg = errors.reduce((a, b) => a + b, 0) / errors.length;
  console.log(`  ${key.padEnd(28)} ${pct(avg).padStart(6)}  (${errors.length} quote${errors.length === 1 ? '' : 's'})`);
}

const done = rows.length >= NEEDED && close >= NEEDED;
console.log(`\nMember 2 "done when" (${NEEDED}+ quotes land close): ${done ? 'MET' : 'NOT MET YET'}`);
