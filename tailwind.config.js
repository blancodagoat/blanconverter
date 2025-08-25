/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './public/**/*.html',
    './src/scripts/**/*.js',
  ],
  theme: {
    extend: {
      colors: {
        orange: {
          500: '#ff6b35',
          600: '#e55a2b'
        }
      }
    },
  },
  plugins: [require('@tailwindcss/forms')],
};


