/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  
    theme: {
      extend: {
        fontFamily: {
          trebuchet: ['Trebuchet MS', 'sans-serif'], // Add the custom font
          baloo: ['Baloo 2', 'sans-serif'],
        nunito: ['Nunito', 'sans-serif'],
        },
      },
    },
    plugins: [],
};


