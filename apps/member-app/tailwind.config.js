/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('nativewind/preset')],
  content: ['./app/**/*.tsx', './components/**/*.tsx'],
  darkMode: 'class', // Use class-based dark mode instead of media queries to avoid NativeWind warnings
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
        // Brand Colors - Electric Violet
        violet: {
          700: '#3B0E8C',
          600: '#5018B8',
          500: '#6D28D9',
          400: '#7C3AED',
          300: '#8B5CF6',
          200: '#A78BFA',
          100: '#C4B5FD',
          50: '#EDE9FE',
          25: '#F5F3FF',
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
        // surface-2 and surface-3 via nested, surface2/surface3 as aliases
        surface: {
          DEFAULT: '#FFFFFF',
          2: '#F8FAFC',
          3: '#F1F5F9',
        },
        surface2: '#F8FAFC',
        surface3: '#F1F5F9',
        // Semantic Colors - Border
        border: 'rgba(0,0,0,0.07)',
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
        DEFAULT: 'rgba(0,0,0,0.07)',
        mid: 'rgba(0,0,0,0.13)',
      },
      spacing: {
        '4.5': '1.125rem',
      },
    },
  },
  plugins: [],
}
