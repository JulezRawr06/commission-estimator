# Commission Price Estimator

A phone-friendly web app for PTF50. A client types an art commission request in plain words (English, Filipino, or Taglish) and gets a price range based on the artist's rate card.

Live link (redeploys from `main`): https://commission-estimator.vercel.app

## How it works

```
client message
  -> normalize.js          Filipino/Taglish phrases to English
  -> AI classifier          Transformers.js zero-shot classification, in a Web Worker
                            (Xenova/mobilebert-uncased-mnli, q8), one pass per factor
  -> label + score per factor: framing, style, characters, background, usage
  -> threshold check        low score = "missing": the app asks a follow-up question
  -> client corrections     a dropdown answer always beats the AI
  -> pricing formula        base price x style + characters + background x usage
  -> price range            +/-15%, wider by 5% for each detail that had to be assumed
```

Everything runs in the browser. There is no server and no API key, and requests are not stored. The model (about 25 MB) downloads on the first visit and is cached by the browser after that.

## Run it locally

Requires Node.js 18 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:5173. To work on the interface without downloading the model, open http://localhost:5173/?mock (fixed fake labels).

## Commands

| Command | What it does |
| :--- | :--- |
| `npm run dev` | Local development server |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run test:pricing` | Pricing formula tests, including market sanity checks |
| `npm run compare:quotes` | Compare the app with the artist's past quotes in `src/docs/pastQuotes.js` |
| `npm run eval:ai` | Run the real model on the 18 test messages and report accuracy per factor and language (add `-- --verbose` for every message) |

## Project layout and owners

| Folder | Owner | Contents |
| :--- | :--- | :--- |
| `src/ai/` | Member 1 | `labels.js` (factors, labels, thresholds), `classifier.js` + `classifier.worker.js` (model), `zeroShot.js` (shared per-factor step), `normalize.js` (Filipino/Taglish glossary), `helpers.js`, `mockClassifier.js`, `testRequests.js`, `evalClassifier.js` |
| `src/pricing/` | Member 2 | `rateCard.js` (all prices), `calculate.js` (formula), `_test.js`, `compareQuotes.js` |
| `src/ui/` | Member 3 | `render.js` (chat and estimate card), `getEstimate.js` (joins AI and pricing), `styles.css` |
| `src/docs/` | Member 4 / all | `pricing-factors.md`, `rate-card-intake.md`, `pastQuotes.js`, progress reports |
| `src/mock/` | - | `sampleEstimate.js`, the original fake estimate (no longer used by the app) |

## Current limitations

* **The prices are placeholders.** They are based on research into Filipino commission rates, not the artist's rate card. See `src/docs/rate-card-intake.md`.
* **No past quotes yet**, so the estimates have not been checked against real quotes (`npm run compare:quotes`).
* The model sometimes scores factors the client never mentioned with high confidence. The thresholds were raised to reduce this, but a very short message such as "how much for a drawing?" can still get some factors guessed. The client can correct any of them.
* The model is unreliable at telling personal from commercial use, so commercial only counts when the model is at least 85% sure. Otherwise the app asks.
* The model is English-only. Filipino and Taglish rely on the glossary in `normalize.js`.
* The first visit downloads about 7 MB of runtime (compressed) plus the model, which is slow on mobile data.
