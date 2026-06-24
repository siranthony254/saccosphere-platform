/** @type {import('tailwindcss').Config} */
export default {
  content: [
    // Include paths from all apps
    '../../apps/super-admin/src/**/*.{ts,tsx}',
    '../../apps/sacco-admin/src/**/*.{ts,tsx}',
    '../../apps/member-app/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand Colors - Deep Navy
        navy: {
          950: '#06091A', // darkest, status bar / hero gradient end
          900: '#0C1228', // primary app background (dark screens)
          800: '#111B3D', // card backgrounds on dark surfaces
          700: '#182347', // elevated surfaces, bottom sheets
          600: '#1F2D5C', // borders on dark bg, subtle dividers
          500: '#263670', // muted text on dark bg
        },
        // Brand Colors - Electric Violet
        violet: {
          700: '#3B0E8C', // pressed/active state
          600: '#5018B8', // hover
          500: '#6D28D9', // primary CTA buttons
          400: '#7C3AED', // default interactive elements
          300: '#8B5CF6', // icons, secondary actions
          200: '#A78BFA', // light mode borders, tags
          100: '#C4B5FD', // tints on dark bg
          50: '#EDE9FE', // badge backgrounds, chip fills (light mode)
          25: '#F5F3FF', // page tints, hover surfaces (light mode)
        },
        // Brand Colors - Mint
        mint: {
          700: '#064E3B', // dark text on mint bg
          600: '#047857', // darker success icons
          500: '#10B981', // primary positive value color
          400: '#34D399', // hover/active on dark surfaces
          300: '#6EE7B7', // tints, subtle positive indicators
          100: '#D1FAE5', // credit transaction backgrounds
          50: '#ECFDF5', // success page tints
        },
        // Semantic Colors - Text (Ink)
        ink: {
          DEFAULT: '#111827', // primary text
          soft: '#374151', // secondary text
          muted: '#6B7280', // placeholders, captions
          faint: '#9CA3AF', // timestamps, fine print
        },
        // Semantic Colors - Surfaces
        surface: {
          DEFAULT: '#FFFFFF',
          2: '#F8FAFC', // list row backgrounds
          3: '#F1F5F9', // input backgrounds, chips
        },
        // Semantic Colors - Status
        red: {
          500: '#DC2626', // debit
          50: '#FEE2E2', // debit background
        },
        amber: {
          500: '#D97706', // warning
          50: '#FEF3C7', // warning background
        },
        blue: {
          500: '#2563EB', // info
          50: '#DBEAFE', // info background
        },
      },
      borderColor: {
        DEFAULT: 'rgba(0, 0, 0, 0.07)',
        mid: 'rgba(0, 0, 0, 0.13)',
      },
      textColor: {
        DEFAULT: '#111827', // ink
      },
      backgroundColor: {
        DEFAULT: '#FFFFFF',
      },
      spacing: {
        '4.5': '1.125rem',
      },
    },
  },
  plugins: [],
}
