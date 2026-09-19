/** @type {import('tailwindcss').Config} */

// CSS custom properties store "r g b" triplets (see index.css and
// AdminThemeProvider), so opacity-modifier classes like bg-violet-500/20
// still work: Tailwind can combine a pre-split triplet with an alpha value
// at runtime, but can't extract channels out of an opaque `var(--x)` hex
// string at build time.
function withOpacity(variableName) {
  return ({ opacityValue }) =>
    opacityValue === undefined
      ? `rgb(var(${variableName}))`
      : `rgb(var(${variableName}) / ${opacityValue})`
}

module.exports = {
  content: ['./src/**/*.{ts,tsx}', './web/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand Colors - Deep Navy
        navy: {
          950: '#06091A',
          900: '#0C1228',
          800: '#111B3D',
          700: '#182347',
          600: '#1F2D5C',
          500: '#263670',
        },
        // Brand accent - resolves via CSS custom properties written by
        // AdminThemeProvider (packages/ui/src/theme), so every violet-*
        // class (buttons, active nav links, focus rings, links, and any
        // bg-violet-500/20-style opacity variant) follows the admin's
        // selected theme instead of a fixed hue. "violet" stays the class
        // name for zero churn across existing usages.
        violet: {
          700: withOpacity('--accent-700'),
          600: withOpacity('--accent-600'),
          500: withOpacity('--accent-500'),
          400: withOpacity('--accent-400'),
          300: withOpacity('--accent-300'),
          200: withOpacity('--accent-200'),
          100: withOpacity('--accent-100'),
          50: withOpacity('--accent-50'),
          // No dedicated near-white shade per theme; reuses 50 (a pale
          // tint either way, so the difference from 25 is negligible).
          25: withOpacity('--accent-50'),
        },
        // Brand Colors - Mint
        mint: {
          700: '#064E3B',
          600: '#047857',
          500: '#10B981',
          400: '#34D399',
          300: '#6EE7B7',
          100: '#D1FAE5',
          50: '#ECFDF5',
        },
        // Semantic Colors - Text (Ink)
        ink: {
          DEFAULT: '#111827',
          soft: '#374151',
          muted: '#6B7280',
          faint: '#9CA3AF',
        },
        // Semantic Colors - Surfaces
        surface: {
          DEFAULT: '#FFFFFF',
          2: '#F8FAFC',
          3: '#F1F5F9',
        },
        // Semantic Colors - Status
        red: {
          500: '#DC2626',
          50: '#FEE2E2',
        },
        amber: {
          500: '#D97706',
          50: '#FEF3C7',
        },
        blue: {
          500: '#2563EB',
          50: '#DBEAFE',
        },
      },
      borderColor: {
        DEFAULT: 'rgba(0, 0, 0, 0.07)',
        mid: 'rgba(0, 0, 0, 0.13)',
      },
    },
  },
  plugins: [],
}
