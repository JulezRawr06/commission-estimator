// labels.js: factors, labels, and thresholds for the classifier. OWNER: Member 1.
//
// IMPORTANT: the label strings (the `id` values) must match src/mock/factorLabels.js
// exactly, because src/ui/render.js uses them as <select> options and compares them
// with `===`. If the artist's rate card changes a category, change it here, then
// tell Member 2 (pricing) and Member 3 (UI) so all three stay in sync.
//
//   id        = value handed to pricing and the UI (e.g. 'full-body')
//   phrase    = the wording the AI model reads (natural English, may differ from id)
//   template  = sentence the model tests, with {} replaced by each phrase
//   threshold = minimum top score to count as "understood". Below it, the factor goes
//               in the `missing` list and the UI asks a follow-up question.
//               STARTING GUESSES. Member 2 tunes these against the artist's past quotes.
//               (A factor with more labels needs a lower threshold: the chance level is
//               1/number-of-labels.)

export const MODEL_ID = 'Xenova/mobilebert-uncased-mnli';

export const FACTORS = {
  framing: {
    template: 'The client wants a {}.',
    threshold: 0.5,
    labels: [
      { id: 'headshot', phrase: 'headshot or bust-up portrait' },
      { id: 'half-body', phrase: 'half-body illustration' },
      { id: 'full-body', phrase: 'full-body illustration' },
    ],
  },
  style: {
    template: 'The art style is {}.',
    threshold: 0.4,
    labels: [
      { id: 'chibi', phrase: 'chibi' },
      { id: 'anime', phrase: 'anime' },
      { id: 'cartoon', phrase: 'western cartoon' },
      { id: 'realistic', phrase: 'realistic' },
      { id: 'pixel art', phrase: 'pixel art' },
    ],
  },
  characters: {
    template: 'The artwork has {}.',
    threshold: 0.5,
    labels: [
      { id: 'one', phrase: 'one character' },
      { id: 'two', phrase: 'two characters' },
      { id: 'three or more', phrase: 'three or more characters' },
    ],
  },
  background: {
    template: 'The artwork has {}.',
    threshold: 0.45,
    labels: [
      { id: 'none', phrase: 'no background' },
      { id: 'simple', phrase: 'a simple background' },
      { id: 'detailed', phrase: 'a detailed background' },
    ],
  },
  usage: {
    template: 'The artwork is for {}.',
    threshold: 0.6,
    labels: [
      { id: 'personal', phrase: 'personal use' },
      { id: 'commercial', phrase: 'commercial use such as a business, logo, or merchandise' },
    ],
  },
};

// Same shape as src/mock/factorLabels.js, derived from FACTORS so the two can't drift.
// Member 3: when ready, change render.js to `import { factorLabels } from '../ai/labels.js'`.
export const factorLabels = Object.fromEntries(
  Object.entries(FACTORS).map(([factor, f]) => [factor, f.labels.map((l) => l.id)])
);
