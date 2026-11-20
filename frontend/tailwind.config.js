/** @type {import('tailwindcss').Config} */
module.exports = {
  safelist: [
    {
      pattern: /badge-(primary|success|warning|danger|info)/,
    },
    {
      pattern: /badge/,
    },
    {
      pattern: /bg-red-500|text-white|rounded-full|px-1.5|py-0.5|text-xs|font-bold/,
    },
    {
      pattern: /ml-auto/,
    },
  ],
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./index.html",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}