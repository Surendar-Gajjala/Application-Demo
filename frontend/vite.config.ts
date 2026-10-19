import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => {
  // Load all env vars (prefix '') so the non-VITE_ token is readable Node-side only.
  const env = loadEnv(mode, process.cwd(), '');
  // Same variable the Netlify Edge Function reads; falls back to the hosted server.
  const enterpriseHost = env.ENTERPRISE_API_HOST?.trim() || 'https://enterprise.ztwo.app';

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 3000,
      proxy: {
        // Every view calls the Enterprise API through this same-origin path. The proxy injects
        // the Bearer token server-side so it never enters the browser bundle.
        '/enterprise': {
          target: enterpriseHost,
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
