/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        nude: {
          50: '#fbf9f6',
          100: '#f6f1ea',
          200: '#ede1d4',
          300: '#decabd',
          400: '#c5ae9d',
          500: '#ac9280',
          600: '#947967',
          700: '#755d4f',
          800: '#544238',
          900: '#2b211c',
        },
        rose: {
          50: '#fff5f6',
          100: '#ffe6e9',
          200: '#ffccd4',
          300: '#ffa3b2',
          400: '#f86f87',
          500: '#ea3e61',
          600: '#d42147',
        },
        champagne: {
          50: '#fdfbf7',
          100: '#fbf5eb',
          200: '#f5e8d0',
          300: '#ebd3a8',
          400: '#dfbc7d',
          500: '#caa054',
          600: '#ab8240',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
        serif: ['Cormorant Garamond', 'Playfair Display', 'serif'],
      }
    },
  },
  plugins: [],
}

