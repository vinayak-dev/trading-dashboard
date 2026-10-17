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
          bg: '#08090d',
          surface: '#0f1116',
          card: '#13151b',
          cardInner: '#181b22',
          cardHover: '#1c1f28',
          border: '#212631',
          borderSubtle: '#191d26',
          win: '#00c076',
          winMuted: 'rgba(0, 192, 118, 0.12)',
          loss: '#ff4d4d',
          lossMuted: 'rgba(255, 77, 77, 0.12)',
          blue: '#0084ff',
          blueMuted: 'rgba(0, 132, 255, 0.14)',
          neutral: '#e6ebf2',
          muted: '#6f7787',
          dimmed: '#98a2b3',
          pill: '#1c202a',
          pillHover: '#252a37',
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
