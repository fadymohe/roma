/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        roma: {
          // Primary Brand Colors
          primary: {
            DEFAULT: '#5A1827', // Deep Wine Burgundy
            dark: '#3E0F1A',
            light: '#7A2437',
            hover: '#48131F',
          },
          // Secondary / Soft Tint
          secondary: {
            DEFAULT: '#8A4F58', // Soft Dusty Rose
            soft: '#F5EBEB',
            border: '#D9C5C8',
          },
          // Action / Accent Color (High Conversion - strictly for CTAs)
          accent: {
            DEFAULT: '#E06D53', // Warm Terracotta Peach
            hover: '#C8573E',
            active: '#B24932',
            light: '#FDF0ED',
          },
          // Backgrounds
          bg: {
            base: '#FAF8F5', // Ultra-clean Pearlescent Off-White
            card: '#FFFFFF', // Pure Solid White
            alt: '#F4EFEA',  // Subtle Ivory Tint
          },
          // Text & Feedback
          text: {
            primary: '#1F1618', // Deep Charcoal Plum
            muted: '#6B5E62',   // Warm Gray
            struck: '#9A8E91',  // Strikethrough Price Gray
          },
          // Status Badges
          success: {
            DEFAULT: '#1B6B4A', // Emerald Forest
            light: '#E8F5EE',
          },
          sale: {
            DEFAULT: '#D92D20', // Vivid Carmine
            light: '#FEF3F2',
          },
          // Borders
          border: {
            DEFAULT: '#ECE3E1', // Muted Rose-Gray
            focus: '#5A1827',
          },
        },
      },
      fontFamily: {
        sans: ['IBM Plex Sans Arabic', 'Cairo', 'sans-serif'],
        arabic: ['IBM Plex Sans Arabic', 'Cairo', 'sans-serif'],
        cairo: ['Cairo', 'sans-serif'],
        latin: ['Plus Jakarta Sans', 'sans-serif'],
        outfit: ['Outfit', 'sans-serif'],
      },
      borderRadius: {
        xs: '4px',
        sm: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '24px',
        '3xl': '32px',
        full: '9999px',
      },
      boxShadow: {
        'roma-card': '0 4px 20px -2px rgba(90, 24, 39, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.02)',
        'roma-hover': '0 12px 30px -4px rgba(90, 24, 39, 0.12), 0 4px 10px -2px rgba(0, 0, 0, 0.04)',
        'roma-cta': '0 8px 24px -4px rgba(224, 109, 83, 0.35)',
        'roma-drawer': '-10px 0 35px -5px rgba(31, 22, 24, 0.15)',
        'roma-sticky': '0 -4px 20px rgba(90, 24, 39, 0.06)',
      },
      aspectRatio: {
        '4/5': '4 / 5',
      },
      fontSize: {
        'hero-m': ['28px', { lineHeight: '1.25', fontWeight: '700' }],
        'hero-d': ['42px', { lineHeight: '1.2', fontWeight: '700' }],
        'h2-m': ['22px', { lineHeight: '1.3', fontWeight: '700' }],
        'h2-d': ['30px', { lineHeight: '1.25', fontWeight: '700' }],
        'card-title': ['15px', { lineHeight: '1.4', fontWeight: '600' }],
        'price-curr': ['17px', { lineHeight: '1', fontWeight: '700' }],
        'price-old': ['13px', { lineHeight: '1', fontWeight: '400' }],
      },
      transitionTimingFunction: {
        'roma-smooth': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};
