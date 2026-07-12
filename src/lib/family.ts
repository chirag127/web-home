/*
 * family.ts — inlined family catalog (formerly @chirag127/astro-data).
 *
 * De-dep 2026-07-12: the published @chirag127/astro-data package was a stub;
 * this is the canonical family metadata used by Footer, Sidebar, JsonLd, and
 * the /sites + /privacy pages. Community-packages-only: no in-house dep.
 */

export interface FamilySite {
  slug: string
  name: string
  url: string
  /** Section bucket: hub | reading | tools | finance | personal | content */
  category: 'hub' | 'reading' | 'tools' | 'finance' | 'personal' | 'content'
  emoji: string
  tagline: string
}

export interface FamilyPackage {
  slug: string
  npm: string
  category: 'astro' | 'ui' | 'util'
  version?: string
  tagline?: string
}

export const FAMILY = {
  brand: 'Oriz',
  rootOrigin: 'https://oriz.in',
  legalUpdated: '2026-07-12',
  operator: {
    name: 'Chirag Singhal',
    email: 'chirag@oriz.in',
    githubHandle: 'chirag127',
    address: 'Ghaziabad, Uttar Pradesh, India',
  },
  jurisdiction: {
    city: 'Ghaziabad',
    state: 'Uttar Pradesh',
    country: 'India',
  },
} as const

export const FAMILY_SITES: FamilySite[] = [
  {
    slug: 'home',
    name: 'Oriz',
    url: 'https://oriz.in',
    category: 'hub',
    emoji: '◆',
    tagline: 'The family hub — every app, tool, book, and package in one place.',
  },
  {
    slug: 'me',
    name: 'CS',
    url: 'https://oriz.in/me',
    category: 'personal',
    emoji: '●',
    tagline: "Chirag Singhal's personal site — hero, now, uses, CV, contact.",
  },
  {
    slug: 'ncert',
    name: 'NCERT',
    url: 'https://books.oriz.in',
    category: 'reading',
    emoji: '▣',
    tagline: 'Free NCERT textbook directory — browse and download by class and subject.',
  },
  {
    slug: 'lore',
    name: 'Lore',
    url: 'https://book-lore.oriz.in',
    category: 'reading',
    emoji: '▤',
    tagline: 'Free library of structured book summaries and narration scripts.',
  },
  {
    slug: 'janaushdhi',
    name: 'Janaushdhi',
    url: 'https://janaushdhi.oriz.in',
    category: 'reading',
    emoji: '▥',
    tagline: 'Read-only catalog of the PMBJP generic-medicine list with price compare.',
  },
  {
    slug: 'blog',
    name: 'Pages',
    url: 'https://blog.oriz.in',
    category: 'content',
    emoji: '▦',
    tagline: 'Long-form writing on engineering, finance, and books.',
  },
  {
    slug: 'journal',
    name: 'Roam',
    url: 'https://journal.oriz.in',
    category: 'content',
    emoji: '▧',
    tagline: 'Privacy-first PWA journal — editor, mood, tags, calendar, streaks.',
  },
  {
    slug: 'pdf-tools',
    name: 'PDF Tools',
    url: 'https://pdf-tools.oriz.in',
    category: 'tools',
    emoji: '▨',
    tagline: 'Free browser-side PDF utilities — split, merge, compress.',
  },
  {
    slug: 'image-tools',
    name: 'Image Tools',
    url: 'https://image-tools.oriz.in',
    category: 'tools',
    emoji: '▩',
    tagline: 'Free browser-side image utilities — convert, resize, optimize.',
  },
  {
    slug: 'finance',
    name: 'Finance',
    url: 'https://finance.oriz.in',
    category: 'finance',
    emoji: '◈',
    tagline: 'Free finance calculators — SIP, EMI, tax, retirement.',
  },
  {
    slug: 'cards',
    name: 'Cards',
    url: 'https://financial-cards.oriz.in',
    category: 'finance',
    emoji: '◇',
    tagline: 'India credit-card intelligence — compare rewards and fees.',
  },
]

export const FAMILY_PACKAGES: FamilyPackage[] = [
  {
    slug: 'astro-analytics',
    npm: '@chirag127/astro-analytics',
    category: 'astro',
    tagline: 'Drop-in privacy-first analytics for Astro sites.',
  },
  {
    slug: 'astro-seo',
    npm: '@chirag127/astro-seo',
    category: 'astro',
    tagline: 'SEO + JSON-LD helpers for Astro sites.',
  },
]
