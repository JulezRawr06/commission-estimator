# Rate Card Intake Checklist

Owner: Member 4 sends it to the artist; Member 2 enters the answers.

The app's prices are placeholders until the artist answers these questions. Each answer maps to one value in `src/pricing/rateCard.js`, so nothing else in the code needs to change. Get the answers in writing (a message or a photo of the rate card is fine).

## Before you ask

* Explain what the app does: a client types a request and gets a price **range**, and the artist still gives the final quote.
* Ask permission to use their rates and past quotes in a school project, and say that no client names will be stored.
* Ask the questions in the artist's own terms. If they use different categories (for example "bust" instead of "headshot"), write their words down and tell Member 1 and Member 2. The labels may need to change.

## Questions

### 1. Base prices (`BASE_PRICES`)
For **one character, no background, personal use**, in your usual style:

| Framing | Your price (PHP) |
| :--- | :--- |
| Headshot / bust-up | |
| Half-body / waist-up | |
| Full-body | |

### 2. Art styles (`STYLE_MULTIPLIERS`)
Which styles do you offer, and how does each change the price? (For example, "chibi is about half", "realistic is +50%", or a separate price list.)

| Style | Offered? | Price change |
| :--- | :--- | :--- |
| Chibi | | |
| Anime | | (usual price) |
| Cartoon | | |
| Realistic | | |
| Pixel art | | |
| Other: | | |

### 3. Extra characters (`CHARACTER_ADDONS`)
How much do you add for each extra character? A fixed amount or a percentage? Is there a maximum number of characters?

### 4. Backgrounds (`BACKGROUND_ADDONS`)

| Background | Your add-on (PHP) |
| :--- | :--- |
| None / plain colour | |
| Simple (gradient, pattern, simple shapes) | |
| Detailed (a scene or place) | |

### 5. Commercial use (`USAGE_MULTIPLIERS`)
What do you charge when the art is for a business, merch, logo, stream, or book cover? (For example, "x2" or "+₱1,000".)

### 6. Rush orders (not in the app yet)
Do you charge for rush deadlines? How much, and what counts as rush? If yes, Member 2 will add a deadline factor.

### 7. How much do your quotes vary? (`RANGE_FACTOR`)
For the same type of request, how far can your final price move up or down (for example "about 10%" or "up to ₱500")? This sets how wide the app's range is.

### 8. Anything else you charge for?
Examples: complex outfits or armour, weapons, animals, extra revisions, high resolution or print files. Note which ones are common.

## Past quotes (for `src/docs/pastQuotes.js`)

Ask for 15 to 20 recent commissions (at least 10 are needed). For each one:

* the client's request (or a short paraphrase, no names);
* what the artist decided it was (framing, style, number of characters, background, personal or commercial);
* the final price they quoted;
* anything unusual (rush, extra details, a discount for a friend).

Enter them in `src/docs/pastQuotes.js` exactly as the example there shows, then run `npm run compare:quotes`.

## After the answers come back

1. Member 2 updates `src/pricing/rateCard.js`.
2. Member 2 updates the expected prices in `src/pricing/_test.js` and runs `npm run test:pricing`.
3. Member 2 runs `npm run compare:quotes` and adjusts values until at least 10 quotes land close.
4. Member 2 updates `src/docs/pricing-factors.md`.
