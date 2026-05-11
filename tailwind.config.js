/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'brand-slate': '#0F172A',
        'brand-surface': '#1E293B',
        primary: '#F59E0B',
        secondary: '#EC4899',
      },
      fontFamily: {
        heading: ['Quicksand', 'Nunito', 'sans-serif'],
        body: ['Inter', 'Roboto', 'sans-serif'],
        handwriting: ['Caveat', 'Kalam', 'cursive'],
      },
    },
  },
  plugins: [],
};
