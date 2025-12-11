/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Тёмная тема как на скриншоте
        dark: {
          900: '#0a0a0f',
          800: '#12121a',
          700: '#1a1a25',
          600: '#252530',
          500: '#32323f',
        },
        // Акцентные цвета для рисков
        risk: {
          casino: '#ff6b35',
          high: '#ef4444',
          normal: '#eab308',
          low: '#22c55e',
        },
        // Направления
        long: '#22c55e',
        short: '#ef4444',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
