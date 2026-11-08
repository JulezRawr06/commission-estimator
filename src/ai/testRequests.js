// testRequests.js: sample commission messages and the labels we EXPECT.
//
// `expected` lists only the factors the message actually states. A factor NOT listed
// is "unmentioned": the classifier should mark it not confident, so the app asks a
// follow-up question instead of guessing.
//
// Member 4: replace/add real client messages from the artist (with permission) and
// keep the `lang` tag. Aim for 20+ cases, at least 8 Filipino or Taglish.
// Label strings must match src/ai/labels.js.

export const TEST_REQUESTS = [
  // ---------- English ----------
  { id: 'en-01', lang: 'en', text: 'Hi! I would like a full-body anime drawing of my OC for my profile picture.',
    expected: { framing: 'full-body', style: 'anime', characters: 'one', usage: 'personal' } },
  { id: 'en-02', lang: 'en', text: 'Can I commission a chibi headshot of me and my boyfriend? Just for us.',
    expected: { framing: 'headshot', style: 'chibi', characters: 'two', usage: 'personal' } },
  { id: 'en-03', lang: 'en', text: 'I need a realistic half-body portrait for my business website, no background.',
    expected: { framing: 'half-body', style: 'realistic', background: 'none', usage: 'commercial' } },
  { id: 'en-04', lang: 'en', text: 'Three characters in a detailed forest scene, cartoon style, for a book cover.',
    expected: { style: 'cartoon', characters: 'three or more', background: 'detailed', usage: 'commercial' } },
  { id: 'en-05', lang: 'en', text: 'Pixel art of one character, full body, simple background, for my game.',
    expected: { framing: 'full-body', style: 'pixel art', characters: 'one', background: 'simple', usage: 'commercial' } },
  { id: 'en-06', lang: 'en', text: 'Hello, how much for a drawing?',
    expected: {} },
  { id: 'en-07', lang: 'en', text: 'Anime bust-up for my Twitch channel logo, no background please.',
    expected: { framing: 'headshot', style: 'anime', background: 'none', usage: 'commercial' } },
  { id: 'en-08', lang: 'en', text: 'I want a drawing of my two cats and my dog in a cozy living room.',
    expected: { characters: 'three or more', background: 'detailed' } },

  // ---------- Filipino ----------
  { id: 'fil-01', lang: 'fil', text: 'Magkano po ang buong katawan na anime para sa sarili ko lang?',
    expected: { framing: 'full-body', style: 'anime', usage: 'personal' } },
  { id: 'fil-02', lang: 'fil', text: 'Gusto ko ng dalawang tao, may detalyadong background, pang-negosyo po.',
    expected: { characters: 'two', background: 'detailed', usage: 'commercial' } },
  { id: 'fil-03', lang: 'fil', text: 'Mukha lang po, walang background.',
    expected: { framing: 'headshot', background: 'none' } },
  { id: 'fil-04', lang: 'fil', text: 'Isang karakter lang, hanggang bewang, simpleng background.',
    expected: { framing: 'half-body', characters: 'one', background: 'simple' } },

  // ---------- Taglish ----------
  { id: 'tl-01', lang: 'taglish', text: 'Hello! Pa-draw ng full body chibi ng OC ko, pang-regalo sa friend ko.',
    expected: { framing: 'full-body', style: 'chibi', usage: 'personal' } },
  { id: 'tl-02', lang: 'taglish', text: 'Magkano kapag half body, realistic, tapos pang-merch ko po siya?',
    expected: { framing: 'half-body', style: 'realistic', usage: 'commercial' } },
  { id: 'tl-03', lang: 'taglish', text: 'Need ko ng drawing ng mag-jowa, walang background po.',
    expected: { characters: 'two', background: 'none' } },
  { id: 'tl-04', lang: 'taglish', text: 'Pwede ba magpa-commission ng cartoon na drawing para sa shop ko?',
    expected: { style: 'cartoon', usage: 'commercial' } },
  { id: 'tl-05', lang: 'taglish', text: 'Magkano po ang pa-commission?',
    expected: {} },
  { id: 'tl-06', lang: 'taglish', text: 'Gusto ko ng apat na characters sa buong eksena sa beach, anime style, for personal use lang.',
    expected: { style: 'anime', characters: 'three or more', background: 'detailed', usage: 'personal' } },
];
