# Progress Report 2: Carrying Out the Integration Plan

This report covers what changed between the state described in `progress-01-original-to-current.md` and the state after the integration plan was carried out on 10 November 2026.

**Scope:** everything was done and tested **locally**. Nothing was committed or pushed, so GitHub and https://commission-estimator.vercel.app still show the old, broken version until the group pushes.

**Constraint:** the artist's rate card and past quotes have still not been collected. No artist prices or quotes were invented. Where real data is needed, the repo now has templates and scripts ready for it.

## 1. Summary

| Before | After |
| :--- | :--- |
| Every request crashed with `ReferenceError: peso is not defined` | Requests work end to end locally (tested in the browser at phone sizes) |
| `getEstimate()` returned a fixed fake ₱1,200 to ₱1,800 | Real chain: model → client corrections → pricing formula |
| Transformers.js not installed | Installed (`@huggingface/transformers` 4.3.2); production build passes |
| No model loading message | Download percentage shown at page load, then "Starting the AI model..." |
| Scores never shown | Every understood factor shows "82% sure" or "your choice" |
| Fixed ±15% range, even when guessing | ±15% when everything is understood, +5% per assumed factor, up to ±35% |
| No explanation of the price | "How this price was worked out" breakdown, plus "For now the price assumes: ..." |
| 8 pricing tests | 24 pricing tests, including market sanity checks and the full chain |
| Classifier accuracy unknown, thresholds guessed | `npm run eval:ai` measures it; thresholds tuned; 2 normalizer fixes |
| No way to check quotes | Intake checklist, past-quotes template, and `npm run compare:quotes` |

## 2. What changed, by member

### Member 3: interface (`src/ui/`, `src/main.js`)

* **Crash fixed** (`render.js`): defined `peso` as a Philippine-peso formatter (`₱1,200`). `renderEstimate()` now finds `#messages` itself instead of relying on the browser's automatic `window.messages` global.
* **Real estimate** (`getEstimate.js`): now runs `classify()` → `applyCorrections()` → `toUnderstoodMissing()` → `calculate()`. Adding `?mock` to the URL switches to the fake classifier, for working on the interface without the model.
* **Model loading** (`main.js`): the model download starts when the page opens. The status banner shows the download percentage, then "Starting the AI model...". The send button stays usable: an early request waits for the download to finish. If the download fails, a clear error is shown and sending again retries.
* **Estimate card** (`render.js`, `styles.css`):
  * factor names ("Art style", "Use") instead of raw keys;
  * a confidence score next to every understood factor, or "your choice" after a correction;
  * a heading above the follow-up questions, and under each question the default the price currently uses;
  * a collapsible "How this price was worked out" section, with one line per factor, the running total, assumed values marked, and the range. It stays open when the card is redrawn after a correction;
  * a narrow-phone layout (360 px and below) where each dropdown gets its own row.
* **Copy summary** now lists every factor, including follow-up answers, and marks assumed ones "(not specified)".
* **Single source of labels:** `render.js` reads dropdown options from `ai/labels.js`. The duplicate `src/mock/factorLabels.js` was deleted.
* **Cleanup:** deleted the unused Vite starter files `src/counter.js` and `src/assets/` (`hero.png`, `javascript.svg`, `vite.svg`).
* **README** rewritten: how it works, how to run it, all commands, project layout and owners, and limitations.

### Member 2: pricing (`src/pricing/`, `src/docs/`)

* **Range reflects uncertainty** (`rateCard.js`, `calculate.js`): new settings `MISSING_RANGE_STEP = 0.05` and `MAX_RANGE_FACTOR = 0.35`. Each factor priced with a default widens the range by 5% on each side:

  | Factors assumed | 0 | 1 | 2 | 3 | 4 or 5 |
  | :--- | :--- | :--- | :--- | :--- | :--- |
  | Range | ±15% | ±20% | ±25% | ±30% | ±35% |

* **Richer output:** `calculate()` now also returns:
  * `point`: the middle price;
  * `rangeFactor`;
  * `assumed`: which defaults were used;
  * `breakdown`: one step per factor with its running total.

  The original fields `{ low, high, understood, missing }` are unchanged.
* **Safer fallback:** a label that is not in the rate card (for example a typo or a new label) now falls back to the default and is listed as assumed, instead of being priced silently.
* **Tests** (`_test.js`, `npm run test:pricing`): 24 tests, up from 8. All pass. They:
  * read the range from the rate card instead of hard-coding ±15%;
  * cover the range widening, the breakdown, unknown labels, and the full chain from classifier to price using the mock;
  * include **market sanity checks**: each rate-card value must sit inside the market ranges researched in `pricing-factors.md`. This is a stand-in until real quotes exist.
* **Ready for real data:**
  * `src/docs/rate-card-intake.md`: questions for the artist. Each answer maps to one value in `rateCard.js`. It also asks about rush fees and how much quotes vary.
  * `src/docs/pastQuotes.js`: an **empty** template for 15 to 20 past quotes, with an example of the format.
  * `src/pricing/compareQuotes.js` (`npm run compare:quotes`): for each quote it shows:
    * the app's range and middle price;
    * the error;
    * whether the real quote is inside the range;
    * the average error per label;
    * whether Member 2's "10 quotes land close" check is met.

    It was dry-run on temporary sample data kept outside the repo, then run on the empty file, where it prints a "no past quotes yet" message.
* **Docs:** `pricing-factors.md` now explains the range rule and the breakdown, and has a "Validation Status" section stating plainly that the prices are research placeholders and that quote checking is still waiting on the artist.

### Member 1: AI (`src/ai/`)

* **Model installed:** `@huggingface/transformers` ^4.3.2 added to `package.json`.
* **Shared logic:** the per-factor zero-shot step moved from the worker into `zeroShot.js`, so the browser and the new Node evaluation script run exactly the same code. `classifier.worker.js` now calls it.
* **Evaluation script** (`evalClassifier.js`, `npm run eval:ai`): runs the real model on the 18 messages in `testRequests.js`. It reports, per factor and per language:
  * correct answers;
  * follow-up questions asked;
  * confident wrong answers;
  * guesses about factors the client never mentioned;
  * a sweep of possible thresholds.
* **Main finding:** the model gives **high scores even to factors the client never mentioned**. "Hello, how much for a drawing?" scored "detailed background" at 0.89. With the old thresholds, 34 of 38 unmentioned factors were guessed instead of asked.
* **Thresholds tuned** (`labels.js`):

  | Factor | Old | New |
  | :--- | :--- | :--- |
  | framing | 0.50 | 0.70 |
  | style | 0.40 | 0.60 |
  | characters | 0.50 | 0.70 |
  | background | 0.45 | 0.85 |
  | usage | 0.60 | 0.60 (unchanged) |

  Reason: a wrong confident guess silently changes the price, while a follow-up question only costs one tap.
* **Normalizer fixes** (`normalize.js`):
  * "may detalyadong background" became "detailed background background" because the shorter pattern matched first. Fixed.
  * Added "me and my ___" / "ako at si/ang ___" → "two characters". The message "chibi headshot of me and my boyfriend" went from wrong (one character) to correct (two, 0.98).
* **Label wording:** the style label "cartoon" is now read by the model as "cartoon" instead of "western cartoon", which it confused with pixel art.
* **Download progress:** `downloadPercent()` now uses Transformers.js 4's byte-weighted `progress_total` event. The old per-file average jumped to 76% almost immediately because the small config files finish first.
* **Tried and dropped:**
  * scoring the labels independently (`multi_label: true`): no clear gain;
  * four alternative wordings for the usage labels: all worse than the current one;
  * three versions of an English "for my business" hint: none fixed the case, and one made "book cover" worse.

  None of these were kept.

## 3. Results

### Classifier on the 18 test messages (`npm run eval:ai`, Node)

| Outcome | Before | After |
| :--- | :--- | :--- |
| Factor said, read correctly and confidently | 42 of 52 | 41 of 52 |
| Factor said, but asked as a follow-up | 5 | 9 |
| **Factor said, read wrong but confidently** (priced wrong without asking) | **5** | **2** |
| Factor not said, correctly asked | 4 of 38 | 25 of 38 |
| **Factor not said, but guessed** | **34** | **13** |

By language after tuning:
* English: 20 of 27 stated factors correct;
* Filipino: 8 of 11;
* Taglish: 13 of 14.

Top-guess accuracy, ignoring the threshold:

| Factor | Correct |
| :--- | :--- |
| background | 10/10 |
| framing | 9/10 |
| style | 10/11 |
| usage | 10/12 |
| characters | 7/9 |

About 0.2 s per message in Node on this computer.

Remaining wrong answers:
* "for my business website" is read as personal use (0.95);
* "my two cats and my dog" is read as two characters.

18 messages is a small sample, so these numbers are a guide, not proof.

### Pricing tests
`npm run test:pricing`: 24 passed, 0 failed.

### Build
`npm run build` passes. The worker bundle includes the ONNX runtime, a 27 MB WASM file (6.8 MB compressed), and the model downloads separately (about 25 MB).

### Local browser test (`npm run dev`, phone viewport 375×812 and 320×700)

| Test | Result |
| :--- | :--- |
| Page load, cold (browser cache cleared) | Percentage rises 48% → 98%, then "Starting the AI model...", then ready after about 8 s on this connection |
| Vague: "Hello, how much for a drawing?" | ₱1,275 to ₱2,125. Asked about style and characters, but still guessed full-body (77%), detailed background (88%), and personal (77%). This is the known limitation |
| Follow-up answered (characters = two) | Card replaced, not duplicated. ₱2,128 to ₱3,192 (₱2,660 ±20%), "your choice" shown |
| Clear: "Full-body anime drawing of my OC, 2 characters, detailed background, for my merch shop." | Style, characters, background, and commercial use understood. Framing was asked, not guessed (full-body below the threshold). ₱2,716 to ₱4,074 |
| Filipino: "Gusto ko ng dalawang tao, may detalyadong background, pang-negosyo po." | Characters 99%, background 97%, commercial 82%. Framing and style asked. ₱2,546 to ₱4,244 (±25%) |
| Correcting understood factors (use → personal, framing → full-body) | Price updated correctly to ₱2,128 to ₱3,192 |
| Copy summary text | "Commission estimate ₱2,128 to ₱3,192. Framing: full-body, Art style: anime (not specified), Characters: two, Background: detailed, Use: personal." |
| `?mock` mode | "Using the test classifier (mock mode)"; ₱2,380 to ₱3,570 as expected |
| 320 px width | No sideways scrolling; dropdowns readable |
| Console errors | None |

**Not tested:**
* real phones or slow mobile data;
* an incognito window on the deployed site (nothing was deployed);
* light mode on a phone;
* the "model failed to download" message (it would need the network blocked);
* the Copy button itself: browsers block clipboard access in automated tests, so only the summary text was checked.

## 4. Files changed

| Change | Files |
| :--- | :--- |
| Modified | `README.md`, `package.json`, `package-lock.json`, `src/main.js`, `src/ui/getEstimate.js`, `src/ui/render.js`, `src/ui/styles.css`, `src/ai/classifier.js`, `src/ai/classifier.worker.js`, `src/ai/labels.js`, `src/ai/normalize.js`, `src/pricing/rateCard.js`, `src/pricing/calculate.js`, `src/pricing/_test.js`, `src/docs/pricing-factors.md` |
| New | `src/ai/zeroShot.js`, `src/ai/evalClassifier.js`, `src/pricing/compareQuotes.js`, `src/docs/pastQuotes.js`, `src/docs/rate-card-intake.md`, `src/docs/progress-01-original-to-current.md`, `src/docs/progress-02-plan-execution.md` |
| Deleted | `src/mock/factorLabels.js`, `src/counter.js`, `src/assets/hero.png`, `src/assets/javascript.svg`, `src/assets/vite.svg` |
| Outside the repo or ignored | `.agents/rules/project_context.md` (refreshed); `../.claude/launch.json` (local dev-server config for testing, in the parent folder) |

Already uncommitted before this work and still uncommitted: Member 2's original pricing files and the `.gitignore` change (`.agents/`).

## 5. Status against each member's "done when"

| Member | Done when | Now |
| :--- | :--- | :--- |
| 1 | Typing a request shows the label and score for every factor | **Met locally.** Understood factors show their score; the rest are asked as follow-ups |
| 2 | Sensible range from labels; 10 past quotes land close | **Half.** Formula, uncertainty-aware range, and tests are done. Quote check is ready but needs the artist's quotes |
| 3 | Deployed link opens on a phone and shows an estimate | **Not yet.** Works locally; needs a push and testing on two real phones |
| 4 | Rate card and test data in docs; user testing summarized | **Not yet.** The intake checklist and quote template are ready to use |

## 6. Follow-up after manual testing: stricter rule for commercial use

The group tested three sample messages in the local app. All three prices were calculated correctly, but the vague message "Hi! Magkano po magpa-commission ng drawing?" was read as **commercial at 75%**. The commercial ×1.75 multiplier, plus a realistic-style guess, raised the middle price from ₱800 to ₱2,100 (shown as ₱1,470 to ₱2,730) for a message that names no details at all.

Tests outside the repo showed this is not caused by one word:
* removing "commission" still gave commercial at 0.85;
* translating "Magkano" ("how much") did not help;
* one sentence that literally says "for commercial use" was read as personal (0.79).

The small model is simply unreliable at this factor, so a normalizer rule could not fix it.

**Decision:** commercial use only counts if the model is **at least 85% sure**. Below that, the app asks "Is this for personal use or commercial use?" and prices as personal until the client answers. Personal keeps the usage threshold of 0.60. A wrong commercial guess adds 75% to the price, while a wrong personal guess costs nothing, because personal is already the default.

**How:** labels can now set their own threshold. `labels.js` gives `commercial` the value `threshold: 0.85`, and `zeroShot.js` uses a label's own threshold when it has one. `evalClassifier.js` reports the current result using the real per-label rule. Four new tests in `_test.js` (fake model, no download) check that commercial at 75% is asked, commercial at 90% is trusted, personal at 75% is trusted, and personal at 55% is asked. **28 of 28 tests pass.**

**Effect on the 18 test messages (usage only):**

| | Before | After |
| :--- | :--- | :--- |
| Usage stated and read correctly | 9 | 6 |
| Usage stated, asked as a follow-up | 2 | 5 |
| Usage stated, read wrong but confidently | 1 | 1 ("for my business website" read as personal; no price raised) |
| Usage not stated, but guessed | 5 (some commercial) | 4 (all personal, the default, so no price change) |

The model now never guesses commercial on these messages unless it is very sure. Messages like "for a book cover", "for my Twitch channel logo", and "pang-negosyo" (0.73 to 0.79) are now asked instead of trusted: one extra tap, never a wrong price. "Para sa shop ko" (0.94) is still trusted.

**Browser check:**

| Message | Result |
| :--- | :--- |
| "Hi! Magkano po magpa-commission ng drawing?" | Was ₱1,470 to ₱2,730. Now **₱780 to ₱1,620**, asking framing, characters, background, and use. Answering "commercial" gives ₱1,470 to ₱2,730, now marked "your choice" |
| "Pa-draw po ng buong katawan na chibi, dalawang tao, walang background, pang-merch ko." | Asks framing and use; ₱648 to ₱1,080 until answered |
| "Pwede ba magpa-commission ng cartoon na drawing para sa shop ko?" | Commercial trusted at 94% |

No console errors. One guess remains in the vague message: realistic at 61%, just above the style threshold of 0.60. Raising the style threshold slightly (about 0.65) is a possible next tweak, but it needs more real messages to judge.

## 7. What is left (for people, not code)

1. **Commit and push** when the group is ready. Vercel redeploys from `main`, which fixes the live link.
2. **Collect the rate card** with `rate-card-intake.md`, and **15 to 20 past quotes** into `pastQuotes.js` (Member 4). Then update `rateCard.js`, run `test:pricing` and `compare:quotes`, and tune (Member 2).
3. **Test on two real phones** and in an incognito window, including first-load time on mobile data (Members 1 and 3).
4. **Add more real client messages** to `testRequests.js` (especially Filipino and Taglish), re-run `eval:ai`, and re-check the thresholds (Members 1 and 2).
5. Optional AI follow-ups for Member 1:
   * try a larger NLI model or different usage wording, to fix "for my business ..." being read as personal;
   * decide whether a very short message with no details should skip the estimate and ask all the questions first.
6. User testing with 3 to 5 people, the report sections, and the demo.
