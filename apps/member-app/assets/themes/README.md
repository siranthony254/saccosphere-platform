# Scenic theme backgrounds

Drop a full-screen image here and wire it into `theme/tokens.ts` to add an
image-backed theme (the KCB-style "nature background" look).

## Image spec
- Format: **WebP** (smallest) or PNG/JPG
- Size: **1284 × 2778** (portrait, iPhone 14 Pro Max) — it's `resizeMode: "cover"`,
  so anything ~9:19.5 and ≥1080px wide is fine
- Weight: keep each **< 250 KB**. Compress hard (squoosh.app, `cwebp -q 78`).
- Content: pick imagery that stays mid-to-dark so the white UI text on the
  scrim stays readable; avoid a bright band across the vertical centre.
- Licence: CC0 (Unsplash / Pexels) or your own. Do not scrape.

## Wiring it up
In `theme/tokens.ts`:

```ts
export const savannahTheme: Theme = {
  id: 'savannah',
  label: 'Savannah',
  appearance: 'dark',
  isDark: true,
  colors: { ...DARK_COLORS, accent: '#F59E0B' },
  backdrop: { kind: 'image', source: require('../assets/themes/savannah.webp') },
  // 40–60% black keeps AA contrast on the brightest part of the photo
  scrimColors: ['rgba(0,0,0,0.25)', 'rgba(0,0,0,0.62)'],
  statusBar: 'light',
}
```

Then add `'savannah'` to `ThemeId`, `THEMES`, and `THEME_ORDER`.
`AppBackground` and the picker pick it up automatically.
