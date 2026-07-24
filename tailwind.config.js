/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './*.html',
    './blog/**/*.html',
    './cart.js',
    './cart-drawer.js',
  ],
  safelist: [
    { pattern: /^(text|bg|border)-(cream|charcoal|gold|white|black|charcoal-soft|cream-dark|cream-darker|gold-dark)(\/\d{1,3})?$/ },
  ],
  theme: {
    extend: {
      colors: {
        cream: '#F9F7F2',
        charcoal: '#1A1A1A',
        gold: '#D4AF37',
        'gold-dark': '#B8941F',
        'cream-dark': '#EFEDE6',
        'cream-darker': '#E5E2D8',
        'charcoal-soft': '#2C2C2C',
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Jost', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
