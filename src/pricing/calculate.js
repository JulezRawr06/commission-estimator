// calculate.js: the pricing formula. OWNER: Member 2.
//
// Pure function. No DOM access, no AI imports, no side effects.
// Takes the understood/missing split from helpers.js and returns the estimate
// that render.js shows.
//
// Formula:
//   base       = BASE_PRICES[framing]
//   styled     = base * STYLE_MULTIPLIERS[style]
//   withChars  = styled + (styled * CHARACTER_ADDONS[characters])
//   withBg     = withChars + BACKGROUND_ADDONS[background]
//   point      = withBg * USAGE_MULTIPLIERS[usage]
//   range      = min(RANGE_FACTOR + MISSING_RANGE_STEP * assumedCount, MAX_RANGE_FACTOR)
//   low        = round(point * (1 - range))
//   high       = round(point * (1 + range))

import {
  BASE_PRICES,
  STYLE_MULTIPLIERS,
  CHARACTER_ADDONS,
  BACKGROUND_ADDONS,
  USAGE_MULTIPLIERS,
  RANGE_FACTOR,
  MISSING_RANGE_STEP,
  MAX_RANGE_FACTOR,
  DEFAULTS,
} from './rateCard.js';

// The order the formula applies the factors in, and the rate-card table each one reads.
export const PRICE_TABLES = {
  framing: BASE_PRICES,
  style: STYLE_MULTIPLIERS,
  characters: CHARACTER_ADDONS,
  background: BACKGROUND_ADDONS,
  usage: USAGE_MULTIPLIERS,
};

// Decide which label each factor is priced with.
// A factor uses its classified (or client-corrected) label when it is understood
// and the label exists in the rate card. Otherwise it falls back to the default
// in rateCard.js and is listed in `assumed`, so the client can see the guess.
function resolveLabels(understood) {
  const given = {};
  for (const item of understood) given[item.factor] = item.label;

  const labels = {};
  const assumed = [];
  for (const factor of Object.keys(PRICE_TABLES)) {
    const label = given[factor];
    // hasOwnProperty (not Object.hasOwn) so older phone browsers still work.
    if (label != null && Object.prototype.hasOwnProperty.call(PRICE_TABLES[factor], label)) {
      labels[factor] = label;
    } else {
      labels[factor] = DEFAULTS[factor];
      assumed.push({ factor, label: DEFAULTS[factor] });
    }
  }
  return { labels, assumed };
}

// Width of the low-to-high band (0.15 = +/-15%) for a given number of assumed factors.
export function rangeFactorFor(assumedCount) {
  return Math.min(RANGE_FACTOR + MISSING_RANGE_STEP * assumedCount, MAX_RANGE_FACTOR);
}

// Main pricing function.
//
// Input:  { understood: [{ factor, label, score }], missing: [{ factor, score }] }
//         This is the output of helpers.toUnderstoodMissing() after corrections.
//
// Output: {
//   low, high,          // the price range, whole pesos
//   point,              // the middle price before the range is applied
//   rangeFactor,        // e.g. 0.2 means +/-20%
//   understood, missing,// passed through unchanged for render.js
//   assumed,            // [{ factor, label }] defaults used for the price
//   breakdown,          // [{ factor, label, kind, value, subtotal, assumed }]
//                       //   kind: 'base' (value = pesos), 'multiply' (value = x),
//                       //         'add-percent' (value = fraction), 'add' (value = pesos)
// }
export function calculate({ understood = [], missing = [] } = {}) {
  const { labels, assumed } = resolveLabels(understood);
  const isAssumed = (factor) => assumed.some((a) => a.factor === factor);

  const base = BASE_PRICES[labels.framing];
  const styleMul = STYLE_MULTIPLIERS[labels.style];
  const charAddon = CHARACTER_ADDONS[labels.characters];
  const bgAddon = BACKGROUND_ADDONS[labels.background];
  const usageMul = USAGE_MULTIPLIERS[labels.usage];

  const styled = base * styleMul;
  const withChars = styled + styled * charAddon;
  const withBg = withChars + bgAddon;
  const point = withBg * usageMul;

  const rangeFactor = rangeFactorFor(assumed.length);
  const low = Math.round(point * (1 - rangeFactor));
  const high = Math.round(point * (1 + rangeFactor));

  const step = (factor, kind, value, subtotal) => ({
    factor,
    label: labels[factor],
    kind,
    value,
    subtotal: Math.round(subtotal),
    assumed: isAssumed(factor),
  });

  const breakdown = [
    step('framing', 'base', base, base),
    step('style', 'multiply', styleMul, styled),
    step('characters', 'add-percent', charAddon, withChars),
    step('background', 'add', bgAddon, withBg),
    step('usage', 'multiply', usageMul, point),
  ];

  return { low, high, point, rangeFactor, understood, missing, assumed, breakdown };
}
