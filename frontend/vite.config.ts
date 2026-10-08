import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    // The browser only ever talks to this origin; /api is forwarded to the local Spring Boot app.
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    // Page tests render large tables; the first test per file also pays cold module loading.
    testTimeout: 15_000,
  },
});
