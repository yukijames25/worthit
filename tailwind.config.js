/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Hiragino Sans"',
          '"Hiragino Kaku Gothic ProN"',
          '"Noto Sans JP"',
          'system-ui',
          'sans-serif',
        ],
      },
      colors: {
        brand: {
          50: '#fff1f7',
          100: '#ffe1ef',
          200: '#ffc3df',
          300: '#ff95c4',
          400: '#ff5fa3',
          500: '#ff2e83',
          600: '#ec1268',
          700: '#c70753',
          800: '#a40a47',
          900: '#880c3e',
        },
        ink: {
          900: '#0f1115',
          800: '#1a1d24',
          700: '#2a2e38',
          500: '#5b6170',
          400: '#8a90a0',
          300: '#c4c9d4',
          200: '#e2e5ec',
          100: '#f1f3f7',
          50: '#f8f9fc',
        },
        // ダークモード専用パレット（dark: で明示的に使用）
        night: {
          950: '#06070b',
          900: '#0a0c12',
          800: '#11141c',
          700: '#1a1e29',
          600: '#252a38',
          500: '#3c4254',
          400: '#6b7287',
          300: '#a5acbe',
          200: '#d4d8e1',
          100: '#eef0f5',
        },
        good: '#22c55e',
        bad: '#ef4444',
      },
      backgroundImage: {
        'app-gradient':
          'radial-gradient(120% 80% at 0% 0%, #ffe9f3 0%, #fff7fb 35%, #f5f1ff 65%, #eaf2ff 100%)',
        'app-gradient-dark':
          'radial-gradient(120% 80% at 0% 0%, #1a1024 0%, #110c1c 35%, #0a0c12 65%, #060a14 100%)',
        'card-shine':
          'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.55) 100%)',
      },
      boxShadow: {
        ios: '0 1px 2px rgba(15,17,21,0.04), 0 8px 24px rgba(15,17,21,0.06)',
        'ios-lg':
          '0 1px 2px rgba(15,17,21,0.04), 0 18px 40px -8px rgba(15,17,21,0.12)',
        nav: '0 -8px 28px rgba(15,17,21,0.08)',
        'ios-dark':
          '0 1px 2px rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.45)',
      },
      borderRadius: {
        '2.5xl': '1.25rem',
        '4xl': '2rem',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.92)' },
          '60%': { opacity: '1', transform: 'scale(1.02)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        'sheet-up': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.45s cubic-bezier(0.16, 1, 0.3, 1) both',
        'pop-in': 'pop-in 0.55s cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-up': 'slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
        shimmer: 'shimmer 2.4s linear infinite',
        float: 'float 4s ease-in-out infinite',
        'sheet-up': 'sheet-up 0.35s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in': 'fade-in 0.25s ease-out both',
      },
    },
  },
  plugins: [],
}
