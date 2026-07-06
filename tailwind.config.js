/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        antique: {
          bg: '#1a120b',
          card: '#2c1f14',
          border: '#8b7355',
          gold: '#c9a44b',
          goldLight: '#e8d5a3',
          red: '#b33a2e',
          cream: '#f5f0e8',
          text: '#d4c5b2',
          muted: '#8a7e6b',
        },
      },
      fontFamily: {
        classical: ['"Noto Serif SC"', '"Source Han Serif SC"', '"SimSun"', '"STSong"', 'serif'],
      },
    },
  },
  plugins: [],
};
