/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Warm, comforting palette: soft purple / lavender / light pink / white.
        lavender: {
          50: '#f7f5fc',
          100: '#efeaf9',
          200: '#ddd3f2',
          300: '#c4b3e8',
          400: '#a98edb',
          500: '#9170cf',
          600: '#7b57bd',
          700: '#69489f',
          800: '#583e82',
          900: '#4a356a',
        },
        blush: {
          50: '#fdf3f7',
          100: '#fbe6ef',
          200: '#f8cfe0',
          300: '#f3a8c8',
          400: '#ec77a6',
          500: '#e15188',
        },
        cream: '#fcfbfe',
      },
      fontFamily: {
        sans: ['Nunito', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Quicksand"', 'Nunito', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 10px 40px -12px rgba(123, 87, 189, 0.25)',
        card: '0 4px 24px -8px rgba(123, 87, 189, 0.18)',
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%,100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.4s ease-out',
        'pulse-soft': 'pulseSoft 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
