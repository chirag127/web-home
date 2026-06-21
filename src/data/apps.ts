/*
 * apps.ts — single source of truth for every app in the oriz family.
 *
 * Static metadata (slug / brand / one-liner / category / subdomain / repo /
 * status / packages) is hand-curated here. Native-distribution channels
 * (Play Store / MS Store / CWS / Firefox / Edge / VSCE / Open VSX) plus
 * direct-download channels (GH Release .apk / .msix / .dmg / .AppImage) are
 * auto-discovered from the GitHub Releases API at build time via
 * `~/lib/discover-releases.ts`.
 *
 * The auto-discovered URLs are MERGED on top of the per-app `channels`
 * object below — so a manually pinned channel here always wins. To trigger
 * the "Microsoft Store / direct-download MSIX" badge on /desktop for a given
 * app, publish a GitHub Release on its repo with an `.msix` asset and the
 * next site build picks it up automatically (24h fs-cached).
 *
 * Coming-soon UX:
 *   - if a channel URL is absent from BOTH the static metadata AND the
 *     auto-discovery cache, AppCard renders a 'Coming soon' badge.
 *   - rationale: per knowledge/decisions/architecture/pwabuilder-as-primary-converter.md
 *     native packages come from PWABuilder transforms, so the copy reads
 *     'Coming soon — Android/Windows/macOS/Linux via PWABuilder'.
 */
import { discoverReleaseChannels } from '~/lib/discover-releases'

/* Native-distribution + web channels we render badges for. */
export type Channel =
  | 'web'
  | 'pwa'
  | 'play_store'
  | 'ms_store'
  | 'cws'
  | 'firefox'
  | 'edge'
  | 'vsce'
  | 'open_vsx'
  | 'github_release_apk'
  | 'github_release_msix'
  | 'github_release_dmg'
  | 'github_release_appimage'

export type AppCategory = 'tool' | 'content' | 'personal' | 'hub' | 'extension'
export type AppStatus = 'production' | 'wip' | 'scaffold'

export interface AppMeta {
  /** Folder name, e.g. `oriz-slice-pdf-tools-app`. Also the GitHub repo name. */
  slug: string
  /** Pretty brand name, e.g. `Slice`, `Pixie`, `Forge`. */
  brand: string
  /** 1-line purpose. Renders as the secondary line on every card. */
  oneLine: string
  /** Family-section bucket. */
  category: AppCategory
  /** Canonical subdomain URL — always present. */
  subdomain: string
  /** `chirag127/<slug>` — passed to the GH Releases API. */
  repo: string
  /** Production-status badge. */
  status: AppStatus
  /** URL per channel. Missing channel ⇒ "Coming soon" badge. */
  channels: Partial<Record<Channel, string>>
  /** @chirag127/* npm packages this app depends on. */
  packages?: string[]
}

/*
 * STATIC APP LIST — 24 apps (1 personal + 8 content + 15 tools).
 * Hub apps (home-app itself) are excluded — this catalog renders ON the
 * hub. Extensions belong to a different catalog (none shipped yet).
 *
 * Channel URLs left empty here are filled at build time by
 * discoverReleaseChannels() if the app has a matching release asset.
 */
const APPS_STATIC: AppMeta[] = [
  // ── Personal (1) ─────────────────────────────────────────────────────
  {
    slug: 'oriz-cs-me-app',
    brand: 'CS',
    oneLine: "Chirag Singhal's personal site — hero, now, uses, CV, contact.",
    category: 'personal',
    subdomain: 'https://me.oriz.in',
    repo: 'chirag127/oriz-cs-me-app',
    status: 'production',
    channels: { web: 'https://me.oriz.in' },
    packages: ['@chirag127/astro-shell'],
  },

  // ── Content (8) ──────────────────────────────────────────────────────
  {
    slug: 'oriz-janaushdhi-app',
    brand: 'Janaushdhi',
    oneLine:
      'Read-only catalog of the PMBJP generic medicine list — search, filter, compare prices, locate the nearest Kendra.',
    category: 'content',
    subdomain: 'https://janaushdhi.oriz.in',
    repo: 'chirag127/oriz-janaushdhi-app',
    status: 'scaffold',
    channels: { web: 'https://janaushdhi.oriz.in' },
    packages: [],
  },
  {
    slug: 'oriz-lore-book-summaries-app',
    brand: 'Lore',
    oneLine:
      'Free, ad-supported library of structured book summaries — overview, content map, critical analysis, narration script.',
    category: 'content',
    subdomain: 'https://book-lore.oriz.in',
    repo: 'chirag127/oriz-lore-book-summaries-app',
    status: 'production',
    channels: { web: 'https://book-lore.oriz.in' },
    packages: [],
  },
  {
    slug: 'oriz-ncert-app',
    brand: 'NCERT',
    oneLine:
      'Free NCERT textbook directory — browse, search, and download every NCERT book by class, subject, and language.',
    category: 'content',
    subdomain: 'https://books.oriz.in',
    repo: 'chirag127/oriz-ncert-app',
    status: 'production',
    channels: { web: 'https://books.oriz.in' },
    packages: [],
  },
  {
    slug: 'oriz-omni-post-app',
    brand: 'Omni',
    oneLine:
      'RSS-driven cross-poster — watches blog.oriz.in/rss.xml and fans every new post out to every blogging platform with a public API.',
    category: 'content',
    subdomain: 'https://omni.oriz.in',
    repo: 'chirag127/oriz-omni-post-app',
    status: 'wip',
    channels: { web: 'https://omni.oriz.in' },
    packages: [],
  },
  {
    slug: 'oriz-packages-catalog-app',
    brand: 'Packages',
    oneLine: 'Auto-discovery catalog of every @chirag127/oriz npm package.',
    category: 'content',
    subdomain: 'https://packages.oriz.in',
    repo: 'chirag127/oriz-packages-catalog-app',
    status: 'scaffold',
    channels: { web: 'https://packages.oriz.in' },
    packages: [],
  },
  {
    slug: 'oriz-pages-blog-app',
    brand: 'Pages',
    oneLine:
      'Long-form writing on engineering, finance, and books — the blog of the oriz family.',
    category: 'content',
    subdomain: 'https://blog.oriz.in',
    repo: 'chirag127/oriz-pages-blog-app',
    status: 'production',
    channels: { web: 'https://blog.oriz.in' },
    packages: [],
  },
  {
    slug: 'oriz-roam-journal-app',
    brand: 'Roam',
    oneLine:
      'Privacy-first PWA journal — Tiptap editor, mood + tags + photos, calendar heatmap, memories, search, streaks, goals, optional E2EE.',
    category: 'content',
    subdomain: 'https://journal.oriz.in',
    repo: 'chirag127/oriz-roam-journal-app',
    status: 'production',
    channels: { web: 'https://journal.oriz.in' },
    packages: ['@chirag127/oriz-ui'],
  },
  {
    slug: 'oriz-tabs-cards-app',
    brand: 'Tabs',
    oneLine:
      'India card intelligence — credit, debit, and prepaid card profiles for every major Indian issuer.',
    category: 'content',
    subdomain: 'https://cards.oriz.in',
    repo: 'chirag127/oriz-tabs-cards-app',
    status: 'production',
    channels: { web: 'https://cards.oriz.in' },
    packages: [],
  },

  // ── Tools (15) ───────────────────────────────────────────────────────
  {
    slug: 'oriz-cipher-crypto-tools-app',
    brand: 'Cipher',
    oneLine: 'Encryption, decryption, hashing, and key-generation utilities for everyday cryptography work.',
    category: 'tool',
    subdomain: 'https://crypto.oriz.in',
    repo: 'chirag127/oriz-cipher-crypto-tools-app',
    status: 'scaffold',
    channels: { web: 'https://crypto.oriz.in' },
    packages: [],
  },
  {
    slug: 'oriz-dice-random-tools-app',
    brand: 'Dice',
    oneLine:
      'Browser-based random and picker tools — dice rolls, coin flips, number generators, list shufflers, name pickers, team splitters.',
    category: 'tool',
    subdomain: 'https://random.oriz.in',
    repo: 'chirag127/oriz-dice-random-tools-app',
    status: 'scaffold',
    channels: { web: 'https://random.oriz.in' },
    packages: [],
  },
  {
    slug: 'oriz-echo-audio-tools-app',
    brand: 'Echo',
    oneLine:
      'Browser-based audio tools — trim, convert, extract, normalise, and the rest of the audio toolkit.',
    category: 'tool',
    subdomain: 'https://audio.oriz.in',
    repo: 'chirag127/oriz-echo-audio-tools-app',
    status: 'scaffold',
    channels: { web: 'https://audio.oriz.in' },
    packages: [],
  },
  {
    slug: 'oriz-forge-dev-tools-app',
    brand: 'Forge',
    oneLine:
      'A developer toolbox — a growing collection of small, fast utilities for building, smithing, and shipping code.',
    category: 'tool',
    subdomain: 'https://dev.oriz.in',
    repo: 'chirag127/oriz-forge-dev-tools-app',
    status: 'scaffold',
    channels: { web: 'https://dev.oriz.in' },
    packages: [],
  },
  {
    slug: 'oriz-grid-qr-tools-app',
    brand: 'Grid',
    oneLine: 'Generate, decode, and customise QR codes and barcodes.',
    category: 'tool',
    subdomain: 'https://qr.oriz.in',
    repo: 'chirag127/oriz-grid-qr-tools-app',
    status: 'scaffold',
    channels: { web: 'https://qr.oriz.in' },
    packages: [],
  },
  {
    slug: 'oriz-paisa-finance-tools-app',
    brand: 'Paisa',
    oneLine:
      'SIP, EMI, FIRE, tax — calculators that show the math, run in your browser, and never see your inputs.',
    category: 'tool',
    subdomain: 'https://finance.oriz.in',
    repo: 'chirag127/oriz-paisa-finance-tools-app',
    status: 'production',
    channels: { web: 'https://finance.oriz.in' },
    packages: ['@chirag127/oriz-ui'],
  },
  {
    slug: 'oriz-paper-print-tools-app',
    brand: 'Paper',
    oneLine:
      'Print-ready generators — lined sheets, dot grids, graph paper, planners, calendars, labels, exported as press-ready PDFs.',
    category: 'tool',
    subdomain: 'https://print.oriz.in',
    repo: 'chirag127/oriz-paper-print-tools-app',
    status: 'scaffold',
    channels: { web: 'https://print.oriz.in' },
    packages: [],
  },
  {
    slug: 'oriz-pivot-data-tools-app',
    brand: 'Pivot',
    oneLine:
      'Data and spreadsheet utilities — CSV/JSON/TSV transforms, pivot operations, sorting, filtering, deduplication.',
    category: 'tool',
    subdomain: 'https://data.oriz.in',
    repo: 'chirag127/oriz-pivot-data-tools-app',
    status: 'scaffold',
    channels: { web: 'https://data.oriz.in' },
    packages: [],
  },
  {
    slug: 'oriz-pixie-image-tools-app',
    brand: 'Pixie',
    oneLine:
      'Compress, resize, crop, convert, watermark, upscale, remove backgrounds, blur faces, generate memes — every operation runs in your browser.',
    category: 'tool',
    subdomain: 'https://image.oriz.in',
    repo: 'chirag127/oriz-pixie-image-tools-app',
    status: 'production',
    channels: { web: 'https://image.oriz.in' },
    packages: ['@chirag127/oriz-ui'],
  },
  {
    slug: 'oriz-rank-seo-tools-app',
    brand: 'Rank',
    oneLine: 'SEO ranking and analysis tools — keyword research helpers, SERP previewers, meta-tag generators.',
    category: 'tool',
    subdomain: 'https://seo.oriz.in',
    repo: 'chirag127/oriz-rank-seo-tools-app',
    status: 'scaffold',
    channels: { web: 'https://seo.oriz.in' },
    packages: [],
  },
  {
    slug: 'oriz-reel-video-tools-app',
    brand: 'Reel',
    oneLine: 'Client-side video processing — trim, transcode, extract frames, change format.',
    category: 'tool',
    subdomain: 'https://video.oriz.in',
    repo: 'chirag127/oriz-reel-video-tools-app',
    status: 'scaffold',
    channels: { web: 'https://video.oriz.in' },
    packages: [],
  },
  {
    slug: 'oriz-scribe-text-tools-app',
    brand: 'Scribe',
    oneLine:
      'Text manipulation and writing utilities — case conversion, diffing, counting, formatting, and other text transforms.',
    category: 'tool',
    subdomain: 'https://text.oriz.in',
    repo: 'chirag127/oriz-scribe-text-tools-app',
    status: 'scaffold',
    channels: { web: 'https://text.oriz.in' },
    packages: [],
  },
  {
    slug: 'oriz-shift-convert-tools-app',
    brand: 'Shift',
    oneLine: 'Universal converter — shifts and changes units, formats, and values across every "from X to Y" domain.',
    category: 'tool',
    subdomain: 'https://convert.oriz.in',
    repo: 'chirag127/oriz-shift-convert-tools-app',
    status: 'scaffold',
    channels: { web: 'https://convert.oriz.in' },
    packages: [],
  },
  {
    slug: 'oriz-slice-pdf-tools-app',
    brand: 'Slice',
    oneLine: 'Merge, split, compress, sign, redact, OCR — a free PDF toolkit that runs entirely in your browser.',
    category: 'tool',
    subdomain: 'https://pdf.oriz.in',
    repo: 'chirag127/oriz-slice-pdf-tools-app',
    status: 'production',
    channels: { web: 'https://pdf.oriz.in' },
    packages: [],
  },
  {
    slug: 'oriz-vitals-health-tools-app',
    brand: 'Vitals',
    oneLine: 'Health and fitness calculators — BMI, BMR, TDEE, body fat, macros, heart-rate zones, and more.',
    category: 'tool',
    subdomain: 'https://health.oriz.in',
    repo: 'chirag127/oriz-vitals-health-tools-app',
    status: 'scaffold',
    channels: { web: 'https://health.oriz.in' },
    packages: [],
  },
]

/*
 * Build-time merge: walk every app, fire the GH Releases API, and overlay
 * any discovered release-asset URLs onto the static `channels` map.
 *
 * Static URLs ALWAYS win — discovery is purely additive. If GH errors out
 * (rate-limit, network), discoverReleaseChannels returns an empty record
 * for that repo and the build continues.
 *
 * Top-level await is fine here because Astro evaluates this module once
 * per build in Node 22.
 */
async function buildApps(): Promise<AppMeta[]> {
  const enriched = await Promise.all(
    APPS_STATIC.map(async (app) => {
      const discovered = await discoverReleaseChannels(app.repo)
      return {
        ...app,
        channels: { ...discovered, ...app.channels },
      }
    }),
  )
  return enriched
}

export const APPS: AppMeta[] = await buildApps()

/* ─────────────────────────────────────────────────────────────────────
 * Helpers — keep page templates lean.
 * ───────────────────────────────────────────────────────────────────── */

export function appsByCategory(): Record<AppCategory, AppMeta[]> {
  const grouped: Record<AppCategory, AppMeta[]> = {
    tool: [],
    content: [],
    personal: [],
    hub: [],
    extension: [],
  }
  for (const a of APPS) grouped[a.category].push(a)
  return grouped
}

/** Strip the leading `oriz-` and trailing `-app` for the packages.oriz.in slug. */
export function appDocsSlug(app: AppMeta): string {
  return app.slug.replace(/^oriz-/, '').replace(/-app$/, '')
}

/** Cross-link URL to the app's full docs on packages.oriz.in. */
export function appDocsUrl(app: AppMeta): string {
  return `https://packages.oriz.in/${appDocsSlug(app)}`
}
