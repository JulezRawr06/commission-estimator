# Progress Report 1: From the Original Repo to the Current State

This report covers how the Commission Price Estimator got from an empty Vite project to its state on 10 November 2026, just before the integration plan was carried out. The "original state" is the `main` branch of https://github.com/JulezRawr06/commission-estimator (latest commit `5ee1ce0`). It matched the local copy exactly when we checked on 10 November 2026.

## 1. Summary

| Layer | Owner | Status on 10 Nov 2026 |
| :--- | :--- | :--- |
| AI classification | Member 1 | Code written and committed, but never connected to the app, and the model package is not installed |
| Pricing logic | Member 2 | Formula, rate card, tests, and factor table written locally, **not committed** |
| Interface and deployment | Member 3 | Chat interface built and deployed to Vercel, but it shows a fake estimate and **crashes on every request** |
| Client, testing, docs | Member 4 | No rate card, past quotes, or test evidence in the repo yet |

The three code layers had never been joined. Typing a request on the live site always failed with "Something went wrong."

## 2. What is on GitHub (the original state)

### Commit history

| Commit | Author | Date | What it did |
| :--- | :--- | :--- | :--- |
| `48deea8` | Jules | 4 Nov 2026 | **Create Vite app.** Standard Vite + vanilla JavaScript starter: `index.html`, `package.json` (Vite only), `src/main.js`, `src/style.css`, `src/counter.js`, and starter images. |
| `669b674` | Jules | 4 Nov 2026 | **Setting up directories.** Added empty folders, one per layer: `src/ai/`, `src/pricing/`, `src/ui/`, `src/mock/`, `src/docs/`. |
| `5dfa6fa` | Jules | 4 Nov 2026 | **Interface and Vercel deployment.** Replaced the starter page with the chat-style interface (Member 3's layer, see below), added mock data, and deployed to https://commission-estimator.vercel.app. |
| `b08ed9e` | ManIV4 | 8 Nov 2026 | **Member 1 contributions.** Added the whole AI layer in `src/ai/` (see below). |
| `5ee1ce0` | ManIV4 | 8 Nov 2026 | **vite.config.js.** Set `worker: { format: 'es' }` so the AI Web Worker can be bundled. |

### Member 3's layer: interface (commit `5dfa6fa`)

* `index.html`: a single-column page with a header, a status banner (`#status`), a chat area (`#messages`) with a greeting bubble, and a text box with a "Get estimate" button.
* `src/ui/styles.css`: mobile-first styles with chat bubbles, an estimate card, 16px inputs (stops iPhone zoom), 44px buttons, safe-area padding, and dark mode.
* `src/main.js`: handles the form, keeps the last request and the client's corrections, and calls `getEstimate()` again when a correction is made.
* `src/ui/render.js`: draws the estimate card, with the price range, a dropdown for each understood factor, a follow-up question with a dropdown for each missing factor, a "Copy summary" button, and a note that the artist gives the final quote.
* `src/ui/getEstimate.js`: a **stub**. It waits 600 ms and returns the fixed `sampleEstimate` (₱1,200 to ₱1,800), whatever the client types.
* `src/mock/sampleEstimate.js` and `src/mock/factorLabels.js`: fake data so the interface could be built before the AI and pricing existed.
* `README.md`: only the Vercel link.

### Member 1's layer: AI classification (commits `b08ed9e`, `5ee1ce0`)

* `labels.js`: the five factors (framing, style, characters, background, usage), the label IDs, the wording the model reads, a sentence template per factor, and a confidence threshold per factor (starting guesses from 0.4 to 0.6). Model: `Xenova/mobilebert-uncased-mnli`.
* `classifier.worker.js`: loads Transformers.js zero-shot classification in a Web Worker (q8 quantized), runs one pass per factor, and returns the top label, its score, whether it passes the threshold, and all scores.
* `classifier.js`: the main-thread interface, with `preloadClassifier()`, `classify()` (caches the last 10 results), and `downloadPercent()`.
* `normalize.js`: a regex glossary that turns common Filipino and Taglish phrases (for example "buong katawan", "pang-negosyo", "mag-jowa") into English before the English-only model reads them.
* `helpers.js`: `applyCorrections()` (a client's correction becomes a confident answer) and `toUnderstoodMissing()` (splits factors into the understood and missing lists the interface draws).
* `mockClassifier.js`: the same interface as `classifier.js` but with fixed results, so other members can work without the model.
* `testRequests.js`: 18 sample requests (8 English, 4 Filipino, 6 Taglish) with expected labels.

## 3. What was added locally since the original state (not on GitHub)

### Member 2's layer: pricing logic (untracked files)

* `src/pricing/rateCard.js`: every pricing number in one place, in PHP:
  * base price by framing: headshot ₱500, half-body ₱800, full-body ₱1,200;
  * style multipliers: chibi 0.6, anime 1.0, cartoon 0.9, realistic 1.5, pixel art 0.9;
  * character add-ons: +80% for two, +160% for three or more;
  * background fees: simple +₱150, detailed +₱500;
  * usage multiplier: commercial 1.75;
  * a ±15% range;
  * defaults for missing factors (half-body, anime, one character, no background, personal).

  The values are **research-based placeholders** from Filipino commission rates (Reddit, DeviantArt, Facebook groups, VGen), because the artist's real rate card has not been collected.
* `src/pricing/calculate.js`: a pure function, `calculate({ understood, missing })`. It fills missing factors with the defaults, applies base → style → characters → background → usage, and returns `{ low, high, understood, missing }`, the same shape as the mock, so the interface would not need changes.
* `src/pricing/_test.js`: 8 hand-checked test cases. All pass with `node src/pricing/_test.js`.
* `src/docs/pricing-factors.md`: the factor table (labels, price effect, and reason for each), the formula, the defaults, research sources, and steps for updating when the real rate card arrives.

### Other local changes

* `.gitignore`: added `.agents/` so the AI-assistant rule files stay out of the repo.
* `.agents/` (ignored): project context, rules, and skills for AI coding assistants.

## 4. Problems found in the current state

1. **The live app crashes on every request.** `render.js` uses `peso.format(...)`, but `peso` is never defined. Confirmed on https://commission-estimator.vercel.app: the console shows `ReferenceError: peso is not defined`, and the user sees "Something went wrong."
2. **Nothing is connected.** `getEstimate()` returns the mock, and neither `classify()` nor `calculate()` is called anywhere in the app.
3. **The model cannot run.** `@huggingface/transformers` is imported by the worker but is not in `package.json` and not installed.
4. `renderEstimate()` uses a `messages` variable it never declares. It only works because the browser exposes `id="messages"` as a global variable.
5. `render.js` takes its label lists from `mock/factorLabels.js` instead of `ai/labels.js`, so the two can drift apart.
6. No loading state for the model download, even though `preloadClassifier()` and `downloadPercent()` exist.
7. Confidence scores are never shown, so Member 1's "done when" check (label and score for every factor on screen) is not met.
8. `testRequests.js` is never run, so classifier accuracy (especially for Filipino and Taglish) is unknown and the thresholds are untuned.
9. No rate card, no past quotes, and no tuning. Member 2's "done when" check (10 past quotes landing close) cannot be done yet.
10. Leftover starter files: `src/counter.js`, `src/assets/*`.

## 5. Status against each member's "done when"

| Member | Done when | Met? |
| :--- | :--- | :--- |
| 1 | Typing a request shows the predicted label and score for every factor | No: the classifier is not connected and scores are not shown |
| 2 | Given labels, returns a sensible range; 10 past quotes land close | Half: the formula works and is tested; no quotes to compare against |
| 3 | The deployed link opens on a phone and shows an estimate for a typed request | No: the link opens, but every request crashes |
| 4 | Rate card and test data in the docs folder; user testing summarized | No |
