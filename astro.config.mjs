// @ts-check
import { shell } from '@chirag127/astro-shell/shell'

export default shell({
  site: 'https://oriz.in',
  includeMdx: false,
  // Cross-link the canonical apex sitemap from every family domain.
  // Per knowledge/decisions/architecture/seo-three-pillars.md, robots.txt
  // also points at https://oriz.in/sitemap-index.xml so sub-sites and
  // GitHub-Pages mirrors all converge on the apex.
  sitemap: {
    changefreq: 'weekly',
    priority: 0.7,
    filter: (page) => !/\/(legal|account)\//.test(page),
  },
})
