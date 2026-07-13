/*
 * apps.ts — single source of truth for every app in the chirag127 family.
 *
 * Rewritten 2026-06-25 per fleet scope-cut (Phase B + same-day Phase A reversal):
 *   - 11 saturated apps removed earlier (archived to archive org):
 *     slice-pdf, pixie-image, reel-video, echo-audio, scribe-text, grid-qr,
 *     shift-convert, dice-random, rank-seo, pivot-data, paper-print.
 *   - 8 additional scaffold apps archived 2026-06-25 PM under the repo-level
 *     build-gate (see knowledge/decisions/architecture/fleet/scope-cut-2026-06-25.md):
 *     cards, finance, health, packages, tools, cipher-crypto-tools-app,
 *     forge-dev-tools-app, omni-post-app.
 *   - Repo slugs migrated chirag127/* → chirag127/<short-slug> (Phase D).
 *
 * Static metadata (slug / brand / one-liner / category / subdomain / repo /
 * status / packages) is hand-curated here. Native-distribution channels
 * (Play Store / MS Store / CWS / Firefox / Edge / VSCE / Open VSX) plus
 * direct-download channels (GH Release .apk / .msix / .dmg / .AppImage) are
 * auto-discovered from the GitHub Releases API at build time via
 * `~/lib/discover-releases.ts`.
 *
 * The auto-discovered URLs are MERGED on top of the per-app `channels`
 * object below — so a manually pinned channel here always wins.
 *
 * Coming-soon UX:
 *   - if a channel URL is absent from BOTH the static metadata AND the
 *     auto-discovery cache, AppCard renders a 'Coming soon' badge.
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
  /** Short slug. Same as the GitHub repo name under chirag127/. */
  slug: string
  /** Pretty brand name, e.g. `Paisa`, `Cards`, `Forge`. */
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
  /**
   * Apps depend on ZERO in-house npm packages. All deps are community packages.
   * Analytics is inlined per app via <script> tags in BaseLayout.astro.
   * See knowledge/decisions/architecture/packaging/zero-in-house-packages-inline-analytics-2026-06-25.md
   */
  packages?: string[]
}

/*
 * STATIC APP LIST — 6 active apps after 2026-06-25 scope-cut.
 *   1 personal (me)
 *   4 content (blog, journal, janaushdhi-app, lore-app)
 *   1 content/reference (ncert-app)
 *
 *   Hub apps (home, formerly auth + status) DON'T appear in this catalog
 *   because home itself renders the catalog. auth + status were archived
 *   2026-06-25.
 *
 *   Every app below has shipping content today — the repo-level build-gate
 *   bar. Apps cut: cards, finance, health, packages, tools,
 *   cipher-crypto-tools-app, forge-dev-tools-app, omni-post-app.
 */
const APPS_STATIC: AppMeta[] = [
  // ── Personal (1) ─────────────────────────────────────────────────────
  {
    slug: 'me',
    brand: 'CS',
    oneLine: "Chirag Singhal's personal site — hero, now, uses, CV, contact.",
    category: 'personal',
    subdomain: 'https://oriz.in/me',
    repo: 'chirag127/me',
    status: 'production',
    channels: { web: 'https://oriz.in/me' },
  },

  // ── Content (5) ──────────────────────────────────────────────────────
  {
    slug: 'janaushdhi-app',
    brand: 'Janaushdhi',
    oneLine:
      'Read-only catalog of the PMBJP generic medicine list — search, filter, compare prices, locate the nearest Kendra.',
    category: 'content',
    subdomain: 'https://janaushdhi.oriz.in',
    repo: 'chirag127/janaushdhi-app',
    status: 'scaffold',
    channels: { web: 'https://janaushdhi.oriz.in' },
  },
  {
    slug: 'lore-app',
    brand: 'Lore',
    oneLine:
      'Free, ad-supported library of structured book summaries — overview, content map, critical analysis, narration script.',
    category: 'content',
    subdomain: 'https://book-lore.oriz.in',
    repo: 'chirag127/lore-app',
    status: 'production',
    channels: { web: 'https://book-lore.oriz.in' },
  },
  {
    slug: 'ncert-app',
    brand: 'NCERT',
    oneLine:
      'Free NCERT textbook directory — browse, search, and download every NCERT book by class, subject, and language.',
    category: 'content',
    subdomain: 'https://books.oriz.in',
    repo: 'chirag127/ncert-app',
    status: 'production',
    channels: { web: 'https://books.oriz.in' },
  },
  {
    slug: 'blog',
    brand: 'Pages',
    oneLine:
      'Long-form writing on engineering, finance, and books — the blog of the chirag127 family.',
    category: 'content',
    subdomain: 'https://blog.oriz.in',
    repo: 'chirag127/blog',
    status: 'production',
    channels: { web: 'https://blog.oriz.in' },
  },
  {
    slug: 'journal',
    brand: 'Roam',
    oneLine:
      'Privacy-first PWA journal — Tiptap editor, mood + tags + photos, calendar heatmap, memories, search, streaks, goals, optional E2EE.',
    category: 'content',
    subdomain: 'https://journal.oriz.in',
    repo: 'chirag127/journal',
    status: 'production',
    channels: { web: 'https://journal.oriz.in' },
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

/** Slug for cross-link to packages.oriz.in docs. Drops `` prefix and `-app` suffix. */
export function appDocsSlug(app: AppMeta): string {
  return app.slug.replace(/^/, '').replace(/-app$/, '')
}

/** Cross-link URL to the app's full docs on packages.oriz.in. */
export function appDocsUrl(app: AppMeta): string {
  return `https://packages.oriz.in/${appDocsSlug(app)}`
}
