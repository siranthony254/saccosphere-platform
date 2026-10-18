import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#06091A',
        'navy-2': '#111B3D',
        violet: {
          DEFAULT: '#6D28D9',
          light: '#A78BFA',
        },
        mint: {
          DEFAULT: '#10B981',
          light: '#6EE7B7',
        },
        gold: '#F59E0B',
        ink: {
          DEFAULT: '#1C1C2E',
          soft: '#4B4B6B',
        },
        surface: '#F8F8FC',
        rule: 'rgba(109,40,217,0.15)',
      },
      fontFamily: {
        serif: ['var(--font-dm-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        page: '860px',
        wide: '1120px',
      },
      borderRadius: {
        card: '14px',
        tile: '16px',
      },
      keyframes: {
        pulseDot: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
      },
      animation: {
        'pulse-dot': 'pulseDot 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

export default config
