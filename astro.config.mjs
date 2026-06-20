// @ts-check

import react from '@astrojs/react'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'

export default defineConfig({
  site: 'https://oriz.in',
  output: 'static',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  integrations: [
    react(),
    sitemap({
      // Cross-link the canonical apex sitemap from every family domain.
      // Per knowledge/decisions/architecture/seo-three-pillars.md, robots.txt
      // also points at https://oriz.in/sitemap-index.xml so sub-sites and
      // GitHub-Pages mirrors all converge on the apex.
      changefreq: 'weekly',
      priority: 0.7,
      filter: (page) => !/\/(legal|account)\//.test(page),
    }),
  ],
  vite: { plugins: [tailwindcss()] },
})
