/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A', // Primary Green
          700: '#15803D',
          800: '#166534',
          900: '#14532D', // Dark Green
          950: '#052E16',
        },
        slate: {
          subtle: '#64748B',
          border: '#E2E8F0',
        }
      },
    },
  },
  plugins: [],
}
