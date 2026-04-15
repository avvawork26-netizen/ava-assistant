/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Dark grey professional palette
        surface: {
          50:  '#f8f8f8',
          100: '#f0f0f0',
          200: '#e4e4e4',
          300: '#d1d1d1',
          400: '#a0a0a0',
          500: '#6b6b6b',
          600: '#4a4a4a',
          700: '#333333',
          800: '#222222',
          900: '#161616',
          950: '#0d0d0d',
        },
        // Accent — sharp amber/gold, less warm
        accent: {
          50:  '#fdf8ec',
          100: '#faecc4',
          200: '#f5d97a',
          300: '#efc140',
          400: '#e8a81a',
          500: '#c98f0c',
          600: '#a87009',
          700: '#865408',
          800: '#6e420c',
          900: '#5a360e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        md: '8px',
        lg: '10px',
        xl: '14px',
      },
    },
  },
  plugins: [],
};
