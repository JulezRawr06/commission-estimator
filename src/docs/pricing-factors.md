# Pricing Factor Reference Table

Owner: Member 2 (Pricing Logic Lead)

This document records every pricing factor, its labels, its effect on the price, and the rationale behind each value. It is the reference for Members 1, 3, and 4, and the basis for the pricing section of the final report.

All prices are in Philippine Peso (PHP). Values are research-based placeholders; update them when the real artist's rate card arrives.

---

## Formula

```
base       = BASE_PRICES[framing]
styled     = base * STYLE_MULTIPLIERS[style]
withChars  = styled + (styled * CHARACTER_ADDONS[characters])
withBg     = withChars + BACKGROUND_ADDONS[background]
point      = withBg * USAGE_MULTIPLIERS[usage]
range      = min(0.15 + 0.05 * assumedCount, 0.35)
low        = round(point * (1 - range))
high       = round(point * (1 + range))
```

The range accounts for the fact that the artist makes the final quote. The estimate is a guide, not a fixed price.

### How wide the range is

`assumedCount` is the number of factors the app had to fill in with a default (see "Defaults for Missing Factors" below). Each one widens the range, because the price is less certain:

| Factors assumed | Range | Example on a P2,000 middle price |
|:----------------|:------|:---------------------------------|
| 0 (everything understood) | +/-15% | P1,700 to P2,300 |
| 1 | +/-20% | P1,600 to P2,400 |
| 2 | +/-25% | P1,500 to P2,500 |
| 3 | +/-30% | P1,400 to P2,600 |
| 4 or 5 | +/-35% (maximum) | P1,300 to P2,700 |

When the client answers a follow-up question, that factor is no longer assumed and the range narrows. The values are in `rateCard.js` as `RANGE_FACTOR`, `MISSING_RANGE_STEP`, and `MAX_RANGE_FACTOR`.

### What the app shows

`calculate()` returns the range plus a `breakdown` (one line per factor with the running total, as shown in the app under "How this price was worked out") and an `assumed` list (shown as "For now the price assumes: ..."). This lets the client, and the group in the demo, trace exactly how a price was reached.

---

## Factor 1: Framing (sets the base price)

Framing determines how much of the character is drawn. More canvas means more work, so it sets the base price.

| Label | Base Price | Rationale |
|:------|:-----------|:----------|
| headshot | P500 | Upper-beginner rate for a bust-up portrait. Market range: P300-P800. |
| half-body | P800 | Midpoint for a waist-up illustration. Market range: P600-P1,500. |
| full-body | P1,200 | Lower-intermediate rate for a full figure. Market range: P1,000-P2,500. |

Source: Filipino artist commission rates from Reddit r/phclassifieds, DeviantArt, Facebook art groups (2024-2025).

---

## Factor 2: Style (multiplier on the base price)

Style changes the rendering effort, not the amount of canvas. Chibi has simplified anatomy and proportions. Realistic requires detailed lighting, textures, and anatomical accuracy.

| Label | Multiplier | Effect on P1,200 Base | Rationale |
|:------|:-----------|:----------------------|:----------|
| chibi | 0.60x | P720 | Simpler anatomy, smaller proportions. Market: ~40-60% of standard rate. |
| anime | 1.00x | P1,200 | Baseline. Most common style requested from Filipino digital artists. |
| cartoon | 0.90x | P1,080 | Similar to anime, slightly less detail on shading. |
| realistic | 1.50x | P1,800 | Detailed anatomy, lighting, and textures. Market: 50-100% premium. |
| pixel art | 0.90x | P1,080 | Niche style; moderate effort, comparable to cartoon. |

---

## Factor 3: Characters (add-on as a fraction of the styled base)

Additional characters increase compositional difficulty and drawing time. The industry standard is +50% to +100% per extra character. We use +80%, the midpoint.

| Label | Add-on Fraction | Effect on P1,200 Styled Base | Rationale |
|:------|:----------------|:-----------------------------|:----------|
| one | +0% | P1,200 (no change) | Single character is included in the base. |
| two | +80% | P1,200 + P960 = P2,160 | Midpoint of market range (+50% to +100%). |
| three or more | +160% | P1,200 + P1,920 = P3,120 | Capped at the equivalent of 3 characters for simplicity. |

---

## Factor 4: Background (flat PHP add-on)

Background effort does not scale proportionally with framing or style, so a flat fee is the industry standard. The add-on is applied after character pricing.

| Label | Add-on | Rationale |
|:------|:-------|:----------|
| none | P0 | No background (transparent or solid color). Free in most rate cards. |
| simple | P150 | Gradient, abstract, or single-color wash. Market range: P100-P300. |
| detailed | P500 | Scene, architecture, landscape. Market range: P300-P1,500. |

---

## Factor 5: Usage (multiplier on the full subtotal)

Commercial use commands a premium because the client profits from the artwork. Most beginner-to-intermediate Filipino artists charge 1.5x to 2x for commercial rights.

| Label | Multiplier | Effect on P1,200 Subtotal | Rationale |
|:------|:-----------|:--------------------------|:----------|
| personal | 1.00x | P1,200 | Standard rate. Profile pictures, gifts, personal collections. |
| commercial | 1.75x | P2,100 | Merch, logos, book covers, VTuber assets, business branding. Midpoint of 1.5x-2x market range. |

---

## Defaults for Missing Factors

When the classifier has low confidence on a factor, the app uses a conservative default and asks a follow-up question. Defaults are chosen to produce a middle-of-the-road estimate.

| Factor | Default Label | Why This Default |
|:-------|:--------------|:-----------------|
| framing | half-body | Middle tier. Avoids overquoting (full-body) or underquoting (headshot). |
| style | anime | Baseline multiplier (1.00x). Most common style in the market. |
| characters | one | Safest assumption. Additional characters are a significant add-on. |
| background | none | Most common default in real commission pricing. |
| usage | personal | Avoids surprising the client with a commercial multiplier they did not ask for. |

---

## Research Sources

- Filipino art commission rate surveys from Reddit r/phclassifieds and r/HungryArtists
- DeviantArt Filipino artist commission sheets
- Facebook groups for Filipino digital art commissions
- VGen and Artistree Filipino freelancer profiles
- General pricing methodology from artconnect.com, beyondeveryart.com, and nonesuchworks.com
- Data collected November 2026; reflects 2024-2025 market rates

---

## Validation Status (10 November 2026)

| Check | Status |
|:------|:-------|
| Formula returns a sensible range for any set of labels | Done. `npm run test:pricing`: 28 tests pass, including the missing-factor, unknown-label, and commercial-confidence cases |
| Values are realistic | Partly. Market sanity checks pass: every value is inside the market ranges listed above. This is research, not the artist's prices |
| Artist's real rate card | **Not collected yet.** Questions are ready in `rate-card-intake.md` |
| At least 10 past quotes land close (Member 2 "done when") | **Not done.** No quotes yet. `pastQuotes.js` and `npm run compare:quotes` are ready |
| Confidence thresholds tuned | Done as a first pass, against the 18 test messages (`npm run eval:ai`), not against quotes. See the comment in `src/ai/labels.js` |
| Commercial-use guesses | Commercial needs at least 85% confidence (personal needs 60%). Below that, the app asks, because a wrong commercial guess adds 75% to the price |

State this honestly in the report: until the rate card and quotes arrive, the app shows **how** the artist would price a request, but the peso amounts are estimates of the local market, not this artist's prices.

---

## How to Update When the Real Rate Card Arrives

1. Send `rate-card-intake.md` to the artist (Member 4) and get the answers in writing.
2. Open `src/pricing/rateCard.js`.
3. Replace the values in `BASE_PRICES`, `STYLE_MULTIPLIERS`, `CHARACTER_ADDONS`, `BACKGROUND_ADDONS`, and `USAGE_MULTIPLIERS` with the artist's actual prices. If the artist uses different categories, change the labels in `src/ai/labels.js` too.
4. Update the `point` values in `src/pricing/_test.js` (work each out by hand from the formula) and run `npm run test:pricing`.
5. Enter the past quotes in `src/docs/pastQuotes.js` and run `npm run compare:quotes`.
6. Adjust values, or `RANGE_FACTOR` and `MISSING_RANGE_STEP`, until at least 10 quotes land close. Use the "average error by label" list to see which values are too high or too low.
7. Update this document with the new values and rationale.

