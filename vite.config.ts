/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // 既存の public/manifest.webmanifest を尊重して plugin 側の自動生成をスキップ
      manifest: false,
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: [
        'favicon.svg',
        'icons.svg',
        'icon-ios.png',
        'icon192.png',
        'icon512.png',
        'manifest.webmanifest',
      ],
      workbox: {
        // SPAなのでナビゲーション要求はすべて index.html にフォールバック
        navigateFallback: '/index.html',
        // /api・/auth は外部処理、/lp は独立した静的LP（SWのSPAフォールバックで横取りさせない）
        navigateFallbackDenylist: [/^\/api\//, /^\/auth\//, /^\/lp/],
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // Supabase REST/Auth は常にネットワーク優先（オフライン時のみフォールバック）
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/,
            handler: 'NetworkOnly',
          },
          {
            // 画像はキャッシュ
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
        ],
      },
      devOptions: {
        // dev サーバーでは Service Worker を無効化（HMR と干渉しない）
        enabled: false,
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
