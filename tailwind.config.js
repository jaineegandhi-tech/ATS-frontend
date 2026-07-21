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
          50:  '#EBF2FF',
          100: '#D6E6FF',
          200: '#ADC8FF',
          500: '#3B82F6',
          600: '#0B5ED7',
          700: '#084CB3',
          DEFAULT: '#0B5ED7',
          hover:   '#084CB3',
          light:   '#EBF2FF',
        },
        sidebar: {
          DEFAULT: '#0B1F3A',
          hover:   '#112847',
          border:  '#162F52',
          text:    '#8BA3C0',
          active:  '#0B5ED7',
        },
        surface: '#F5F8FC',
        heading: '#1A1A1A',
        body:    '#5F6B7A',
      },
      boxShadow: {
        card:       '0 1px 4px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'card-hover':'0 6px 20px 0 rgb(11 94 215 / 0.10)',
        modal:      '0 20px 60px -10px rgb(0 0 0 / 0.20)',
        topbar:     '0 1px 0 0 #E8EDF3',
      },
      borderRadius: {
        DEFAULT: '8px',
        lg: '10px',
        xl: '12px',
        '2xl': '16px',
      },
      maxWidth: {
        container: '1280px',
      },
    },
  },
  plugins: [],
}
