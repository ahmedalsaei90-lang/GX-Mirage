import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [
        require('tailwindcss')({
          config: {
            darkMode: 'class',  // Enables 'dark' class for modes
            content: ['./src/**/*.{js,jsx,ts,tsx}'],
            theme: {
              extend: {
                colors: {
                  'purple-dark': '#4c1d95',  // Dark mode purple
                },
              },
            },
          },
        }),
        require('autoprefixer'),
      ],
    },
  },
});