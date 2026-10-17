/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        trading: {
          bg: '#0a0d14',
          card: '#111726',
          cardHover: '#151d30',
          border: '#1f2a40',
          borderSubtle: '#172033',
          win: '#10b981',
          winMuted: 'rgba(16, 185, 129, 0.12)',
          loss: '#ef4444',
          lossMuted: 'rgba(239, 68, 68, 0.12)',
          neutral: '#e2e8f0',
          muted: '#64748b',
          dimmed: '#94a3b8',
          accent: '#38bdf8',
          warning: '#f59e0b',
          warningMuted: 'rgba(245, 158, 11, 0.12)',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
