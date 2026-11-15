import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev: the SPA runs on :5173 and proxies /api to the Express server on :4000,
// so cookies are same-origin in development exactly like production (Vercel rewrite).
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { '/api': { target: 'http://localhost:4000', changeOrigin: true } } },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    css: false,
    coverage: { provider: 'v8', include: ['src/**/*.{js,jsx}'], exclude: ['src/main.jsx', 'src/test/**'] },
  },
});
