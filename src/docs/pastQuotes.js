// pastQuotes.js: the artist's past commission requests and the price they actually
// quoted. OWNER: Member 4 (collects), Member 2 (uses to tune the rate card).
//
// EMPTY ON PURPOSE: no real quotes have been collected yet. Do not fill this with
// made-up numbers; the comparison is only meaningful with the artist's real quotes.
//
// How to add a quote (with the artist's permission; leave out client names):
//   {
//     id: 'q01',
//     date: '2026-10',                       // month is enough
//     request: 'the client message, or a short paraphrase',
//     labels: {                              // what the ARTIST actually priced
//       framing: 'full-body',                //   headshot | half-body | full-body
//       style: 'anime',                      //   chibi | anime | cartoon | realistic | pixel art
//       characters: 'two',                   //   one | two | three or more
//       background: 'simple',                //   none | simple | detailed
//       usage: 'personal',                   //   personal | commercial
//     },                                     // leave a factor out if the artist did not say
//     quote: 2500,                           // the artist's final price in PHP
//     notes: 'rush, +20% (not in the app yet)',
//   },
//
// Then run: npm run compare:quotes
// Aim for 15 to 20 quotes. The "done when" check for Member 2 needs at least 10.

export const PAST_QUOTES = [
];
