/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      spacing: {
        4.5: '1.125rem',
      },
      colors: {
        slate: {
          750: '#243044',
          850: '#172033',
        },
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        accent: {
          emerald: '#10b981',
          cyan: '#06b6d4',
          violet: '#8b5cf6',
          amber: '#f59e0b',
          rose: '#f43f5e',
        },
        'brand-primary': '#f59e0b',
        surface: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          750: '#283548',
          800: '#1e293b',
          850: '#172033',
          900: '#0f172a',
          950: '#090d16',
        },
        dark: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          800: '#1e293b',
          850: '#172033',
          900: '#0f172a',
          950: '#090d16',
        }
      },
      fontFamily: {
        sans: ['"Outfit"', '"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['"Instrument Serif"', '"Cormorant Garamond"', '"Playfair Display"', 'Georgia', 'serif'],
        'display-sans': ['"Outfit"', '"Plus Jakarta Sans"', 'sans-serif'],
        'display-serif': ['"Instrument Serif"', '"Cormorant Garamond"', 'Georgia', 'serif'],
        mono: ['Fira Code', 'JetBrains Mono', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'glow-brand': '0 0 20px -5px rgba(99, 102, 241, 0.4)',
        'glow-emerald': '0 0 20px -5px rgba(16, 185, 129, 0.4)',
      },
    },
  },
  plugins: [],
};
