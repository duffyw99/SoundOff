import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'SoundOff!',
        short_name: 'SoundOff',
        description: 'A social music game for friends.',
        display: 'standalone',
        start_url: '/',
        background_color: '#14121f',
        theme_color: '#14121f',
        // TODO(M1): add real app icons so the PWA is installable.
        icons: [],
      },
    }),
  ],
  server: {
    // In dev, forward API calls to the Fastify server.
    proxy: {
      '/healthz': 'http://localhost:8080',
      '/api': 'http://localhost:8080',
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
  },
});
