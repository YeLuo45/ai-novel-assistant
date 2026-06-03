/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        'serif-novel': [
          'Georgia',
          'Cambria',
          '"Times New Roman"',
          'Times',
          '"Noto Serif SC"',
          '"Source Han Serif SC"',
          'serif',
        ],
      },
    },
  },
  plugins: [],
}
