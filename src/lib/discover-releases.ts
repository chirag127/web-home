/*
 * discover-releases.ts — build-time GitHub Releases auto-discovery.
 *
 * For each AppMeta, fire `GET /repos/<repo>/releases/latest`, inspect the
 * asset filenames, and return a partial channels record. Asset → channel
 * mapping:
 *
 *   *.apk       → github_release_apk
 *   *.msix      → github_release_msix
 *   *.dmg       → github_release_dmg
 *   *.AppImage  → github_release_appimage
 *
 * That way: once a GitHub release for any oriz app drops an MSIX/APK/etc.
 * asset, the matching badge on /mobile or /desktop fills in automatically
 * on the next build. Zero manual URL edits.
 *
 * Behaviour:
 *   - 24 h fs cache (Astro/CI containers don't rebuild more often than
 *     hourly, but cap it at 24 h so a fresh-cut release shows up the same
 *     business day).
 *   - Anonymous calls — 60 req/h limit. If the build hits a 403, we just
 *     skip discovery for the remaining repos this build. Static URLs from
 *     apps.ts still render correctly.
 *   - Fail-soft: any thrown error → return {}. Never break the build.
 *
 * Cache location: `.cache/releases/<repo-slug>.json`. The directory is in
 * .gitignore (Astro builds write to it during `astro build`, Cloudflare
 * Pages caches don't rely on it).
 */
import { promises as fs } from 'node:fs'
import path from 'node:path'
import type { Channel } from '~/data/apps'

interface GhAsset {
  name: string
  browser_download_url: string
}
interface GhRelease {
  assets?: GhAsset[]
  html_url?: string
}

const CACHE_DIR = path.resolve(process.cwd(), '.cache/releases')
const CACHE_MS = 24 * 60 * 60 * 1000 // 24 h

type Discovered = Partial<Record<Channel, string>>

/**
 * Read the on-disk cache for a repo. Returns null on miss / expiry / parse
 * error — never throws.
 */
async function readCache(repo: string): Promise<Discovered | null> {
  try {
    const file = path.join(CACHE_DIR, `${repo.replace('/', '__')}.json`)
    const stat = await fs.stat(file)
    if (Date.now() - stat.mtimeMs > CACHE_MS) return null
    const raw = await fs.readFile(file, 'utf8')
    return JSON.parse(raw) as Discovered
  } catch {
    return null
  }
}

/** Persist a discovery result. Swallows errors — cache writes are best-effort. */
async function writeCache(repo: string, data: Discovered): Promise<void> {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true })
    const file = path.join(CACHE_DIR, `${repo.replace('/', '__')}.json`)
    await fs.writeFile(file, JSON.stringify(data), 'utf8')
  } catch {
    /* ignore */
  }
}

/** Map an asset filename to a release-download channel id, or null if no match. */
function classifyAsset(name: string): Channel | null {
  const lower = name.toLowerCase()
  if (lower.endsWith('.apk')) return 'github_release_apk'
  if (lower.endsWith('.msix') || lower.endsWith('.msixbundle')) return 'github_release_msix'
  if (lower.endsWith('.dmg')) return 'github_release_dmg'
  if (lower.endsWith('.appimage')) return 'github_release_appimage'
  return null
}

/**
 * Public entry: returns the per-channel URLs discoverable from
 * `<repo>/releases/latest`. Always resolves — never rejects.
 */
export async function discoverReleaseChannels(repo: string): Promise<Discovered> {
  // 1) Cache hit?
  const cached = await readCache(repo)
  if (cached) return cached

  // 2) Build-time opt-out (e.g. fast preview, no network).
  if (process.env.DISABLE_RELEASE_DISCOVERY === 'true') return {}

  // 3) Fire the API. Anonymous unless GITHUB_TOKEN is set (raises limit
  //    from 60 → 5000 req/h on CI).
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'oriz-home-build',
  }
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`

  let release: GhRelease | null = null
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
      headers,
      signal: AbortSignal.timeout(8000),
    })
    if (res.ok) release = (await res.json()) as GhRelease
  } catch {
    /* fail-soft */
  }

  const out: Discovered = {}
  if (release?.assets) {
    for (const asset of release.assets) {
      const channel = classifyAsset(asset.name)
      if (channel && !out[channel]) {
        out[channel] = asset.browser_download_url
      }
    }
  }

  // Cache even empty results — avoids re-hitting the API for repos with
  // no releases yet on every page render.
  await writeCache(repo, out)
  return out
}
