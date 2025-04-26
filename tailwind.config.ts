/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{html,ts}", // Asegúrate de que Tailwind procese todos los archivos HTML y TypeScript
    ],
    safelist: [
      'bg-green-100', 'text-green-800',
      'bg-red-100',   'text-red-800',
    ],
    theme: {
      extend: {},
    },
    plugins: [],
  }
  