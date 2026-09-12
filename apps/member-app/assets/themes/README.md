# Card background photos

These images back the "Card backgrounds" feature (Privacy screen →
Appearance → Card backgrounds): a member can apply one as the backdrop of
their Profile Details, Balances, or SACCO Profile card. They are **not**
full-app theme backgrounds — the app's own background/theme is unaffected.

Registered in `theme/cardBackdrops.ts` (`CARD_BACKDROPS` / `CARD_BACKDROP_ORDER`).

## Image spec
- Format: JPG/PNG (WebP is fine too, smallest)
- Aspect: roughly 4:3 to 16:9 lands well on the card shapes; `resizeMode: "cover"`
  crops to fit either way
- Weight: keep each **< 150 KB** where possible — compress hard (squoosh.app)
- Content: avoid anything with a visible watermark, stock-site logo, or a
  signed artist's mark — those can't ship in a live app without a proper
  licence. Prefer your own photos or CC0 sources (Unsplash/Pexels). Do not scrape.

## Adding a new one
1. Drop the file here with a short, descriptive, lowercase-hyphenated name
   (e.g. `forest-path.jpg`).
2. In `theme/cardBackdrops.ts`, add an entry to `CARD_BACKDROPS` (id, label,
   `source: require('../assets/themes/forest-path.jpg')`, `scrimColors`) and
   its id to `CARD_BACKDROP_ORDER`.

The gallery in `components/ui/CardBackgroundSettings.tsx` picks it up
automatically — no other wiring needed.
