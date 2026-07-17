/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          50:  '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          500: '#f9a8d4',
          600: '#f472b6',
          700: '#ec4899',
          DEFAULT: '#f9a8d4',
          hover:   '#f472b6',
          light:   '#fdf2f8',
        },
        sidebar: {
          DEFAULT: '#0f172a',
          hover:   '#1e293b',
          border:  '#1e293b',
          text:    '#94a3b8',
          active:  '#f9a8d4',
        },
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        'card-hover': '0 4px 12px 0 rgb(0 0 0 / 0.08)',
        modal: '0 20px 60px -10px rgb(0 0 0 / 0.25)',
      },
    },
  },
  plugins: [],
}
