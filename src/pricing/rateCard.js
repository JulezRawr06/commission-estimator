// rateCard.js: the artist's rate card as data. OWNER: Member 2.
//
// This file holds every number the pricing formula reads. When the real artist's
// rate card arrives (Member 4), change the values here -- do not touch calculate.js.
//
// All prices are in Philippine Peso (PHP).
// Research basis: Filipino digital art commission rates from Reddit r/phclassifieds,
// DeviantArt, Facebook art groups, and VGen freelancer profiles (2024-2025 data),
// targeting the upper-beginner / lower-intermediate tier.

// --- Base prices by framing (single character, no background, personal use) --------

export const BASE_PRICES = {
  'headshot':   500,
  'half-body':  800,
  'full-body':  1200,
};

// --- Style multipliers (applied to the base price) --------------------------------
// Chibi is simpler anatomy and proportions, so it costs less.
// Realistic requires detailed lighting, textures, and anatomy, so it costs more.
// Anime is the baseline (1.00x) because it is the most common request style
// among Filipino digital artists.

export const STYLE_MULTIPLIERS = {
  'chibi':       0.60,
  'anime':       1.00,
  'cartoon':     0.90,
  'realistic':   1.50,
  'pixel art':   0.90,
};

// --- Character add-ons (fraction of the styled base to ADD) ------------------------
// Industry standard: +50% to +100% per extra character. We use +80% (midpoint).
// "three or more" is capped at the equivalent of 3 characters for simplicity.

export const CHARACTER_ADDONS = {
  'one':             0,
  'two':             0.80,
  'three or more':   1.60,
};

// --- Background add-ons (flat PHP amount added after character pricing) -------------
// Background effort does not scale with framing or style, so a flat fee is standard.

export const BACKGROUND_ADDONS = {
  'none':      0,
  'simple':    150,
  'detailed':  500,
};

// --- Usage multipliers (applied to the full subtotal) ------------------------------
// Commercial use (merch, logos, book covers, VTuber assets) commands a premium.
// Most beginner-to-intermediate Filipino artists charge 1.5x to 2x for commercial.

export const USAGE_MULTIPLIERS = {
  'personal':    1.00,
  'commercial':  1.75,
};

// --- Range factor ------------------------------------------------------------------
// The estimate shows a low-to-high band: point * (1 - RANGE_FACTOR) to
// point * (1 + RANGE_FACTOR). This accounts for the artist quoting higher or
// lower depending on specifics not captured by the classifier.

export const RANGE_FACTOR = 0.15;

// --- Wider range when the app is guessing ------------------------------------------
// Each factor filled in with a default (missing, low-confidence, or unknown label)
// widens the band by MISSING_RANGE_STEP on each side, up to MAX_RANGE_FACTOR.
//   0 assumed -> +/-15%, 1 -> +/-20%, 2 -> +/-25%, 3 -> +/-30%, 4 or 5 -> +/-35%
// A vague request gets an honest wide range; a clear request gets a narrow one.
// These are starting values: tune them with compareQuotes.js once past quotes exist.

export const MISSING_RANGE_STEP = 0.05;
export const MAX_RANGE_FACTOR = 0.35;

// --- Defaults for missing / low-confidence factors ---------------------------------
// When the classifier is not confident about a factor, the pricing logic uses
// these defaults to produce a middle-of-the-road estimate rather than guessing
// the cheapest or most expensive option.

export const DEFAULTS = {
  framing:    'half-body',   // middle tier between headshot and full-body
  style:      'anime',       // baseline multiplier (1.00x)
  characters: 'one',         // safest assumption; extras are a large add-on
  background: 'none',        // most common default in real commission pricing
  usage:      'personal',    // avoids surprising the client with a commercial fee
};

