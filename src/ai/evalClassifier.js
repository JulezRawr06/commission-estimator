// evalClassifier.js: runs the REAL model on every message in testRequests.js and
// reports how well it reads each factor. OWNERS: Member 1 (labels, normalizer)
// and Member 2 (thresholds).
//
// Run with: npm run eval:ai            (summary)
//           npm run eval:ai -- --verbose   (every message, every factor)
//
// The first run downloads the model (about 25 MB) into
// node_modules/@huggingface/transformers/.cache. Later runs are offline.
//
// How each factor of each message is scored:
//   Mentioned in `expected` (the client said it):
//     correct       = right label AND confident        -> priced correctly
//     asked         = not confident                    -> app asks a follow-up (safe, but extra step)
//     WRONG         = wrong label AND confident        -> priced wrong without asking (worst case)
//   Not mentioned (the client did not say it):
//     asked         = not confident                    -> correct: the app should ask
//     guessed       = confident                        -> app assumed something the client never said
//
// The threshold sweep at the end shows, per factor, which threshold would give the
// most good outcomes (correct + rightly asked) on these messages. Treat it as a
// hint: 18 messages is a small sample, so do not over-fit to it. The sweep uses one
// threshold for every label of a factor; per-label overrides (labels.js) are only
// reflected in the tables and the "current" figure.

import { pipeline } from '@huggingface/transformers';
import { FACTORS, MODEL_ID } from './labels.js';
import { normalize } from './normalize.js';
import { classifyFactors } from './zeroShot.js';
import { TEST_REQUESTS } from './testRequests.js';

const verbose = process.argv.includes('--verbose');
const pct = (a, b) => (b ? `${Math.round((a / b) * 100)}%` : '-');

console.log(`Loading ${MODEL_ID} (q8)...`);
const loadStart = performance.now();
const model = await pipeline('zero-shot-classification', MODEL_ID, { dtype: 'q8' });
console.log(`Model ready in ${((performance.now() - loadStart) / 1000).toFixed(1)} s\n`);

// ---------------------------------------------------------------------------------
// Run every message
// ---------------------------------------------------------------------------------
const runs = [];
let totalMs = 0;
for (const req of TEST_REQUESTS) {
  const started = performance.now();
  const normalizedText = normalize(req.text);
  const factors = await classifyFactors(model, normalizedText);
  const ms = performance.now() - started;
  totalMs += ms;
  runs.push({ req, normalizedText, factors, ms });

  if (verbose) {
    console.log(`[${req.id}] ${req.text}`);
    if (normalizedText !== req.text) console.log(`         normalized: ${normalizedText}`);
    for (const [factor, info] of Object.entries(factors)) {
      const want = req.expected[factor];
      const mark = outcome(want, info);
      console.log(`         ${factor.padEnd(11)} ${String(info.label).padEnd(14)} ${info.score.toFixed(2)} ${info.confident ? 'confident' : 'low      '}  expected: ${want ?? '(not said)'}  -> ${mark}`);
    }
    console.log('');
  }
}

function outcome(expected, info, threshold) {
  const confident = threshold == null ? info.confident : info.score >= threshold;
  if (expected) {
    if (!confident) return 'asked';
    return info.label === expected ? 'correct' : 'WRONG';
  }
  return confident ? 'guessed' : 'asked';
}

// ---------------------------------------------------------------------------------
// Summary per factor
// ---------------------------------------------------------------------------------
function tally(filter = () => true) {
  const rows = {};
  for (const factor of Object.keys(FACTORS)) {
    rows[factor] = { mentioned: 0, correct: 0, askedM: 0, wrong: 0, unmentioned: 0, askedU: 0, guessed: 0 };
  }
  for (const run of runs.filter(filter)) {
    for (const [factor, info] of Object.entries(run.factors)) {
      const want = run.req.expected[factor];
      const row = rows[factor];
      const o = outcome(want, info);
      if (want) {
        row.mentioned++;
        if (o === 'correct') row.correct++;
        else if (o === 'asked') row.askedM++;
        else row.wrong++;
      } else {
        row.unmentioned++;
        if (o === 'asked') row.askedU++;
        else row.guessed++;
      }
    }
  }
  return rows;
}

function printTable(title, rows) {
  console.log(title);
  console.log('  factor       said: correct  asked  WRONG  | not said: asked  guessed');
  const sum = { mentioned: 0, correct: 0, askedM: 0, wrong: 0, unmentioned: 0, askedU: 0, guessed: 0 };
  for (const [factor, r] of Object.entries(rows)) {
    for (const k of Object.keys(sum)) sum[k] += r[k];
    console.log(
      `  ${factor.padEnd(11)} ${String(r.mentioned).padStart(5)}: ${`${r.correct} (${pct(r.correct, r.mentioned)})`.padStart(8)} ${String(r.askedM).padStart(6)} ${String(r.wrong).padStart(6)}  | ${String(r.unmentioned).padStart(8)}: ${`${r.askedU} (${pct(r.askedU, r.unmentioned)})`.padStart(6)} ${String(r.guessed).padStart(8)}`,
    );
  }
  console.log(
    `  ${'ALL'.padEnd(11)} ${String(sum.mentioned).padStart(5)}: ${`${sum.correct} (${pct(sum.correct, sum.mentioned)})`.padStart(8)} ${String(sum.askedM).padStart(6)} ${String(sum.wrong).padStart(6)}  | ${String(sum.unmentioned).padStart(8)}: ${`${sum.askedU} (${pct(sum.askedU, sum.unmentioned)})`.padStart(6)} ${String(sum.guessed).padStart(8)}`,
  );
  console.log('');
  return sum;
}

printTable('All messages (current thresholds)', tally());
for (const lang of ['en', 'fil', 'taglish']) {
  const count = runs.filter((r) => r.req.lang === lang).length;
  printTable(`Language: ${lang} (${count} messages)`, tally((r) => r.req.lang === lang));
}

// Label accuracy ignoring confidence: does the model's top guess match, when said?
console.log('Top-guess accuracy when the client said the factor (ignores the threshold):');
for (const factor of Object.keys(FACTORS)) {
  const said = runs.filter((r) => r.req.expected[factor]);
  const right = said.filter((r) => r.factors[factor].label === r.req.expected[factor]).length;
  console.log(`  ${factor.padEnd(11)} ${right}/${said.length} (${pct(right, said.length)})`);
}
console.log('');

// ---------------------------------------------------------------------------------
// Threshold sweep
// ---------------------------------------------------------------------------------
console.log('Threshold sweep (good = correct + rightly asked; WRONG = priced wrong without asking)');
const thresholds = [];
for (let t = 0.3; t <= 0.951; t += 0.05) thresholds.push(Number(t.toFixed(2)));

for (const [factor, config] of Object.entries(FACTORS)) {
  const results = thresholds.map((t) => {
    let good = 0;
    let wrong = 0;
    let guessed = 0;
    for (const run of runs) {
      const o = outcome(run.req.expected[factor], run.factors[factor], t);
      const said = Boolean(run.req.expected[factor]);
      if (o === 'correct' || (o === 'asked' && !said)) good++;
      if (o === 'WRONG') wrong++;
      if (o === 'guessed') guessed++;
    }
    return { t, good, wrong, guessed };
  });
  // Best = most good outcomes, then fewest WRONG, then closest to the current threshold.
  const best = [...results].sort(
    (a, b) => b.good - a.good || a.wrong - b.wrong || Math.abs(a.t - config.threshold) - Math.abs(b.t - config.threshold),
  )[0];
  // "current" uses the app's real decision, including any per-label threshold.
  let currentGood = 0;
  for (const run of runs) {
    const o = outcome(run.req.expected[factor], run.factors[factor]);
    if (o === 'correct' || (o === 'asked' && !run.req.expected[factor])) currentGood++;
  }
  const overrides = config.labels.filter((l) => l.threshold != null).map((l) => `${l.id} ${l.threshold}`);
  const currentName = `${config.threshold.toFixed(2)}${overrides.length ? ` (${overrides.join(', ')})` : ''}`;
  console.log(
    `  ${factor.padEnd(11)} current ${currentName}: ${currentGood}/${runs.length} good   sweep best ${best.t.toFixed(2)}: ${best.good}/${runs.length} good, ${best.wrong} WRONG, ${best.guessed} guessed`,
  );
  if (verbose) {
    console.log(`              ${results.map((r) => `${r.t.toFixed(2)}:${r.good}`).join('  ')}`);
  }
}

console.log(`\nAverage time per message: ${(totalMs / runs.length / 1000).toFixed(2)} s (this computer, Node; phones will be slower)`);
