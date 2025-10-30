/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#415347',
        secondary: '#5f5c44',
        background: '#f6f2e5',
      },
    },
  },
  plugins: [],
}



