/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: '#ff8a00',
          red: '#f14624',
          light: '#fff4e6',
          dark: '#c73e1d',
        },
      },
    },
  },
  plugins: [],
}
