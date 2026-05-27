/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'rgb(var(--background) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        'surface-border': 'rgb(var(--surface-border) / <alpha-value>)',
        primary: 'rgb(var(--primary) / <alpha-value>)',
        'primary-hover': 'rgb(var(--primary-hover) / <alpha-value>)',
        secondary: 'rgb(var(--secondary) / <alpha-value>)',
        'text-main': 'rgb(var(--text-main) / <alpha-value>)',
        'text-muted': 'rgb(var(--text-muted) / <alpha-value>)',
        'error-bg': 'rgb(var(--error-bg) / <alpha-value>)',
      },
      fontFamily: {
        heading: ['Quicksand', 'Nunito', 'sans-serif'],
        body: ['Inter', 'Roboto', 'sans-serif'],
        handwriting: ['Caveat', 'cursive'],
        kalam: ['Kalam', 'cursive'],
        patrick: ['"Patrick Hand"', 'cursive'],
      },
    },
  },
  plugins: [],
};
