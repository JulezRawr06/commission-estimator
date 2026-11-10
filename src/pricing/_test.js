// Pricing tests. OWNER: Member 2.
// Run with: npm run test:pricing   (or: node src/pricing/_test.js)
// Development check only; it is not shipped in the app.
//
// When the real rate card arrives, update the `point` values in PRICE_CASES
// (work each one out by hand from the formula in calculate.js) and the
// MARKET_RANGES if the artist's market differs.

import assert from 'node:assert/strict';
import { calculate, rangeFactorFor } from './calculate.js';
import {
  BASE_PRICES,
  STYLE_MULTIPLIERS,
  CHARACTER_ADDONS,
  BACKGROUND_ADDONS,
  USAGE_MULTIPLIERS,
  RANGE_FACTOR,
  MAX_RANGE_FACTOR,
} from './rateCard.js';
import { applyCorrections, toUnderstoodMissing } from '../ai/helpers.js';
import { classify as mockClassify } from '../ai/mockClassifier.js';
import { classifyFactors } from '../ai/zeroShot.js';
import { FACTORS } from '../ai/labels.js';

let passed = 0;
let failed = 0;

async function check(name, fn) {
  try {
    await fn();
    console.log(`  PASS  ${name}`);
    passed++;
  } catch (error) {
    console.log(`  FAIL  ${name}`);
    console.log(`        ${error.message.split('\n').join('\n        ')}`);
    failed++;
  }
}

// Build calculate() input from a { factor: label } map. Factors not given are missing.
const ALL_FACTORS = ['framing', 'style', 'characters', 'background', 'usage'];
function input(labels) {
  return {
    understood: Object.entries(labels).map(([factor, label]) => ({ factor, label, score: 0.8 })),
    missing: ALL_FACTORS.filter((f) => !(f in labels)).map((factor) => ({ factor, score: 0.3 })),
  };
}

function expectRange(result, point, assumedCount) {
  const range = rangeFactorFor(assumedCount);
  assert.equal(result.point, point, 'middle price');
  assert.equal(result.rangeFactor, range, 'range width');
  assert.equal(result.low, Math.round(point * (1 - range)), 'low');
  assert.equal(result.high, Math.round(point * (1 + range)), 'high');
}

// ---------------------------------------------------------------------------------
// 1. Price cases (points worked out by hand from the formula)
// ---------------------------------------------------------------------------------
console.log('\nPrice cases');

const PRICE_CASES = [
  // full-body 1200 x anime 1.0 = 1200
  ['Simplest full-body (anime, 1 char, no bg, personal)',
    { framing: 'full-body', style: 'anime', characters: 'one', background: 'none', usage: 'personal' }, 1200, 0],
  // headshot 500 x chibi 0.6 = 300; +80% = 540
  ['Chibi headshot, 2 chars, personal',
    { framing: 'headshot', style: 'chibi', characters: 'two', background: 'none', usage: 'personal' }, 540, 0],
  // half-body 800 x 1.5 = 1200; +150 = 1350; x1.75 = 2362.5
  ['Half-body, realistic, simple bg, commercial',
    { framing: 'half-body', style: 'realistic', characters: 'one', background: 'simple', usage: 'commercial' }, 2362.5, 0],
  // 1200; +160% = 3120; +500 = 3620; x1.75 = 6335
  ['Maximum complexity (full-body, anime, 3+ chars, detailed bg, commercial)',
    { framing: 'full-body', style: 'anime', characters: 'three or more', background: 'detailed', usage: 'commercial' }, 6335, 0],
  ['Simplest possible (headshot, anime, 1 char, no bg, personal)',
    { framing: 'headshot', style: 'anime', characters: 'one', background: 'none', usage: 'personal' }, 500, 0],
  // all defaults: half-body 800, anime, one, none, personal = 800
  ['All factors missing (all defaults)', {}, 800, 5],
  // style defaults to anime: 1200; +80% = 2160; +500 = 2660
  ['One factor missing (style defaults to anime)',
    { framing: 'full-body', characters: 'two', background: 'detailed', usage: 'personal' }, 2660, 1],
  // characters defaults to one: 1200 + 500 = 1700; x1.75 = 2975
  ['Mock scenario (characters missing)',
    { framing: 'full-body', style: 'anime', background: 'detailed', usage: 'commercial' }, 2975, 1],
];

for (const [name, labels, point, assumedCount] of PRICE_CASES) {
  await check(name, () => expectRange(calculate(input(labels)), point, assumedCount));
}

// ---------------------------------------------------------------------------------
// 2. Range widening, assumed list, breakdown, and fallbacks
// ---------------------------------------------------------------------------------
console.log('\nRange, assumed defaults, and breakdown');

await check('Range widens 5% per assumed factor and stops at the maximum', () => {
  assert.equal(rangeFactorFor(0), RANGE_FACTOR);
  for (let n = 1; n <= 5; n++) {
    assert.ok(rangeFactorFor(n) > rangeFactorFor(n - 1) || rangeFactorFor(n) === MAX_RANGE_FACTOR, `n=${n}`);
    assert.ok(rangeFactorFor(n) <= MAX_RANGE_FACTOR, `n=${n} is above the maximum`);
  }
  assert.equal(rangeFactorFor(5), MAX_RANGE_FACTOR);
});

await check('A vague request gets a wider range than a clear one', () => {
  const clear = calculate(input({ framing: 'full-body', style: 'anime', characters: 'one', background: 'none', usage: 'personal' }));
  const vague = calculate(input({ framing: 'full-body' }));
  assert.ok(vague.high - vague.low > clear.high - clear.low);
});

await check('Assumed list names each default used', () => {
  const result = calculate(input({ framing: 'full-body', style: 'anime', background: 'detailed', usage: 'commercial' }));
  assert.deepEqual(result.assumed, [{ factor: 'characters', label: 'one' }]);
});

await check('An unknown label falls back to the default and is marked assumed', () => {
  const result = calculate(input({ framing: 'poster', style: 'anime', characters: 'one', background: 'none', usage: 'personal' }));
  assert.equal(result.point, BASE_PRICES['half-body']);
  assert.deepEqual(result.assumed, [{ factor: 'framing', label: 'half-body' }]);
});

await check('Breakdown has one step per factor and ends at the middle price', () => {
  const result = calculate(input({ framing: 'half-body', style: 'realistic', characters: 'one', background: 'simple', usage: 'commercial' }));
  assert.deepEqual(result.breakdown.map((s) => s.factor), ALL_FACTORS);
  assert.deepEqual(result.breakdown.map((s) => s.subtotal), [800, 1200, 1200, 1350, 2363]);
  assert.equal(result.breakdown.at(-1).subtotal, Math.round(result.point));
});

await check('Breakdown marks assumed factors', () => {
  const result = calculate(input({ framing: 'full-body' }));
  const flagged = result.breakdown.filter((s) => s.assumed).map((s) => s.factor);
  assert.deepEqual(flagged, ['style', 'characters', 'background', 'usage']);
});

await check('understood and missing are passed through for the interface', () => {
  const given = input({ framing: 'full-body' });
  const result = calculate(given);
  assert.equal(result.understood, given.understood);
  assert.equal(result.missing, given.missing);
});

// ---------------------------------------------------------------------------------
// 3. Integration with the AI layer: classifier -> corrections -> pricing
// ---------------------------------------------------------------------------------
console.log('\nIntegration with the classifier (mock)');

await check('Mock classifier result prices with characters assumed', async () => {
  const result = await mockClassify('full-body anime, detailed bg, commercial');
  const estimate = calculate(toUnderstoodMissing(applyCorrections(result, {})));
  expectRange(estimate, 2975, 1);
  assert.deepEqual(estimate.missing.map((m) => m.factor), ['characters']);
});

await check('Answering the follow-up removes the guess and narrows the range', async () => {
  const result = await mockClassify('full-body anime, detailed bg, commercial');
  const estimate = calculate(toUnderstoodMissing(applyCorrections(result, { characters: 'two' })));
  // 1200; +80% = 2160; +500 = 2660; x1.75 = 4655
  expectRange(estimate, 4655, 0);
  assert.deepEqual(estimate.missing, []);
});

await check('Choosing "Choose one" (empty value) is ignored', async () => {
  const result = await mockClassify('x');
  const estimate = calculate(toUnderstoodMissing(applyCorrections(result, { characters: '' })));
  assert.deepEqual(estimate.assumed.map((a) => a.factor), ['characters']);
});

// ---------------------------------------------------------------------------------
// 4. Confidence rule for commercial use (stricter threshold in ai/labels.js)
// A fake model returns a fixed usage score, so this needs no download.
// ---------------------------------------------------------------------------------
console.log('\nCommercial-use confidence rule');

const usageOnly = { usage: FACTORS.usage };
const fakeModel = (top, score) => async (text, phrases) => {
  const topPhrase = FACTORS.usage.labels.find((l) => l.id === top).phrase;
  const other = phrases.find((p) => p !== topPhrase);
  return { labels: [topPhrase, other], scores: [score, 1 - score] };
};

await check('Commercial at 75% is not trusted: the app asks, and prices as personal', async () => {
  const factors = await classifyFactors(fakeModel('commercial', 0.75), 'x', usageOnly);
  assert.equal(factors.usage.confident, false);
  const estimate = calculate(toUnderstoodMissing({ factors }));
  assert.deepEqual(estimate.assumed, [
    { factor: 'framing', label: 'half-body' }, { factor: 'style', label: 'anime' },
    { factor: 'characters', label: 'one' }, { factor: 'background', label: 'none' },
    { factor: 'usage', label: 'personal' },
  ]);
});
await check('Commercial at 90% is trusted', async () => {
  const factors = await classifyFactors(fakeModel('commercial', 0.9), 'x', usageOnly);
  assert.equal(factors.usage.confident, true);
});
await check('Personal still only needs the usage threshold (75% is trusted)', async () => {
  const factors = await classifyFactors(fakeModel('personal', 0.75), 'x', usageOnly);
  assert.equal(factors.usage.confident, true);
});
await check('Personal below the usage threshold is asked', async () => {
  const factors = await classifyFactors(fakeModel('personal', 0.55), 'x', usageOnly);
  assert.equal(factors.usage.confident, false);
});

// ---------------------------------------------------------------------------------
// 5. Market sanity checks (stand-in until real past quotes exist)
// The ranges below are the market ranges recorded in src/docs/pricing-factors.md.
// They catch typos and unrealistic values in rateCard.js; they do NOT prove the
// estimates match the artist. Only compareQuotes.js with real quotes can do that.
// ---------------------------------------------------------------------------------
console.log('\nMarket sanity checks');

const MARKET_RANGES = {
  base: { 'headshot': [300, 800], 'half-body': [600, 1500], 'full-body': [1000, 2500] },
  style: { chibi: [0.4, 0.6], realistic: [1.5, 2.0] },
  characters: { two: [0.5, 1.0] },
  background: { simple: [100, 300], detailed: [300, 1500] },
  usage: { commercial: [1.5, 2.0] },
};

const within = (value, [min, max], what) =>
  assert.ok(value >= min && value <= max, `${what} = ${value}, expected ${min} to ${max}`);

await check('Base prices are inside market ranges', () => {
  for (const [label, range] of Object.entries(MARKET_RANGES.base)) within(BASE_PRICES[label], range, label);
});
await check('Style multipliers are inside market ranges', () => {
  for (const [label, range] of Object.entries(MARKET_RANGES.style)) within(STYLE_MULTIPLIERS[label], range, label);
});
await check('Extra-character add-on is inside the market range', () => {
  within(CHARACTER_ADDONS.two, MARKET_RANGES.characters.two, 'two');
  assert.equal(CHARACTER_ADDONS['three or more'], CHARACTER_ADDONS.two * 2, 'three or more = two extra characters');
});
await check('Background fees are inside market ranges', () => {
  for (const [label, range] of Object.entries(MARKET_RANGES.background)) within(BACKGROUND_ADDONS[label], range, label);
});
await check('Commercial multiplier is inside the market range', () => {
  within(USAGE_MULTIPLIERS.commercial, MARKET_RANGES.usage.commercial, 'commercial');
});
await check('Prices only go up as the request gets bigger', () => {
  assert.ok(BASE_PRICES.headshot < BASE_PRICES['half-body'] && BASE_PRICES['half-body'] < BASE_PRICES['full-body']);
  assert.ok(CHARACTER_ADDONS.one < CHARACTER_ADDONS.two && CHARACTER_ADDONS.two < CHARACTER_ADDONS['three or more']);
  assert.ok(BACKGROUND_ADDONS.none < BACKGROUND_ADDONS.simple && BACKGROUND_ADDONS.simple < BACKGROUND_ADDONS.detailed);
  assert.ok(USAGE_MULTIPLIERS.personal < USAGE_MULTIPLIERS.commercial);
});

console.log(`\n${passed} passed, ${failed} failed out of ${passed + failed} tests.`);
if (failed > 0) process.exit(1);
