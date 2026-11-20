import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt', // show "New version available" instead of swapping files silently
      includeAssets: ['icons/icon.svg'],
      manifest: {
        name: 'Rootine',
        short_name: 'Rootine',
        description: 'Focus with Pomodoro timers and grow a garden of plants.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        theme_color: '#2F5D50',
        background_color: '#F7F3E8',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Cache only the app files. Never answer an /api request from the cache or with index.html.
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [],
        importScripts: ['/sw-notify.js'], // notification tap handler
      },
    }),
  ],
  server: {
    port: 5173,
    // API_URL lets tests point the app at a different backend (default: the local one).
    proxy: { '/api': process.env.API_URL || 'http://localhost:4000' },
  },
});
