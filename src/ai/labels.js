// labels.js: factors, labels, and thresholds for the classifier. OWNER: Member 1.
//
// IMPORTANT: the label strings (the `id` values) must match the keys in
// src/pricing/rateCard.js exactly. src/ui/render.js reads its dropdown options from
// `factorLabels` below. If the artist's rate card changes a category, change it here
// and in rateCard.js, then tell Member 2 (pricing) and Member 3 (UI).
//
//   id        = value handed to pricing and the UI (e.g. 'full-body')
//   phrase    = the wording the AI model reads (natural English, may differ from id)
//   template  = sentence the model tests, with {} replaced by each phrase
//   threshold = minimum top score to count as "understood". Below it, the factor goes
//               in the `missing` list and the UI asks a follow-up question.
//               Tuned on 10 Nov 2026 with `npm run eval:ai` on the 18 messages in
//               testRequests.js (was 0.5 / 0.4 / 0.5 / 0.45 / 0.6). The model gives high
//               scores even to factors the client never mentioned, so the thresholds
//               were raised: a wrong confident guess silently changes the price, while a
//               follow-up question only costs the client one tap. 18 messages is a small
//               sample: re-run eval:ai whenever messages, phrases, or labels change.
//               A label can override its factor's threshold with its own `threshold`
//               (see 'commercial' below).

export const MODEL_ID = 'Xenova/mobilebert-uncased-mnli';

export const FACTORS = {
  framing: {
    template: 'The client wants a {}.',
    threshold: 0.7,
    labels: [
      { id: 'headshot', phrase: 'headshot or bust-up portrait' },
      { id: 'half-body', phrase: 'half-body illustration' },
      { id: 'full-body', phrase: 'full-body illustration' },
    ],
  },
  style: {
    template: 'The art style is {}.',
    threshold: 0.6,
    labels: [
      { id: 'chibi', phrase: 'chibi' },
      { id: 'anime', phrase: 'anime' },
      { id: 'cartoon', phrase: 'cartoon' }, // was 'western cartoon': the model then mixed it up with pixel art
      { id: 'realistic', phrase: 'realistic' },
      { id: 'pixel art', phrase: 'pixel art' },
    ],
  },
  characters: {
    template: 'The artwork has {}.',
    threshold: 0.7,
    labels: [
      { id: 'one', phrase: 'one character' },
      { id: 'two', phrase: 'two characters' },
      { id: 'three or more', phrase: 'three or more characters' },
    ],
  },
  background: {
    template: 'The artwork has {}.',
    threshold: 0.85,
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
      // Stricter threshold for this label only: commercial multiplies the price by
      // 1.75, and the model often reads vague or Filipino messages as commercial
      // ("Hi! Magkano po magpa-commission ng drawing?" -> commercial 0.75).
      // Below 0.85 the app asks "personal or commercial?" instead of guessing.
      { id: 'commercial', phrase: 'commercial use such as a business, logo, or merchandise', threshold: 0.85 },
    ],
  },
};

// { factor: [label ids] }, derived from FACTORS. render.js uses it for the dropdowns.
export const factorLabels = Object.fromEntries(
  Object.entries(FACTORS).map(([factor, f]) => [factor, f.labels.map((l) => l.id)])
);
