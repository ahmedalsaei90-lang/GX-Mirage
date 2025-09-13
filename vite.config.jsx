import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [
        require('tailwindcss')({
          darkMode: 'class',  // Enables dark mode
          content: ['./src/**/*.{js,jsx,ts,tsx}'],
          theme: {
            extend: {
              colors: {
                'purple-dark': '#4c1d95',
              },
            },
          },
        }),
        require('autoprefixer'),
      ],
    },
  },
});