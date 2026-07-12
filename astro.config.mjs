// @ts-check
import react from '@astrojs/react'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'
import AstroPwa from '@vite-pwa/astro'
import { defineConfig } from 'astro/config'

export default defineConfig({
  site: 'https://oriz.in',
  base: process.env.PUBLIC_BASE_PATH ?? '/',
  vite: { plugins: [tailwindcss()] },
  integrations: [
    react(),
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      filter: (page) => !/\/(legal|account)\//.test(page),
    }),
    AstroPwa({
      registerType: 'autoUpdate',
      injectRegister: false,
      manifest: {
        id: '/',
        name: 'Oriz',
        short_name: 'Oriz',
        description:
          'A free-forever family of small web apps, tools, content sites, books, and open-source packages by Chirag Singhal.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        theme_color: '#D0BCFF',
        background_color: '#0F0D13',
        icons: [
          { src: '/icons/icon-192.png', type: 'image/png', sizes: '192x192', purpose: 'any' },
          { src: '/icons/icon-512.png', type: 'image/png', sizes: '512x512', purpose: 'any' },
          {
            src: '/icons/maskable-512.png',
            type: 'image/png',
            sizes: '512x512',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        // Never serve stale API / auth / cross-origin live data — network-only.
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: ({ url }) =>
              url.origin === self.location.origin && !url.pathname.startsWith('/api/'),
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'oriz-shell' },
          },
        ],
      },
    }),
  ],
})
