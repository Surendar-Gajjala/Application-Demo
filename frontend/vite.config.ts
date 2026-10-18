import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => {
  // Load all env vars (prefix '') so the non-VITE_ token is readable Node-side only.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 3000,
      // Allow reading the sibling backend/ tree so the frontend can import the shared
      // site-query.json payload without duplicating it.
      fs: { allow: ['..'] },
      proxy: {
        // The browser only ever talks to this origin; /api is forwarded to the local Spring Boot app.
        '/api': 'http://localhost:8080',
        // Sites view: forward to the Enterprise API and inject the Bearer token server-side
        // so the token never enters the browser bundle. CORS is avoided (same-origin to the browser).
        '/enterprise': {
          target: 'https://enterprise.ztwo.app',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/enterprise/, '/api/v1/platform'),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              const token = env.ENTERPRISE_API_TOKEN;
              if (token) {
                proxyReq.setHeader('Authorization', `Bearer ${token}`);
              }
            });
          },
        },
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
      // Page tests render large tables; the first test per file also pays cold module loading.
      testTimeout: 15_000,
    },
  };
});
