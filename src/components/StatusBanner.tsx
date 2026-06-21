/*
 * <StatusBanner /> — Better Stack incidents banner.
 *
 * Locked spec: knowledge/decisions/architecture/status-banner-on-every-site.md
 *
 * Build-time: tries to fetch FEED + parses latest active incident; if no
 * incident, this component renders null (zero DOM). Client-side: revalidates
 * every 60s and falls back to FALLBACK_FEED if primary fails.
 *
 * Severity → label/color (color is sites' job via [data-oriz-status]):
 *   degraded         → "Some features may be slow"
 *   partial_outage   → "Some sites are unreachable"
 *   major_outage     → "We're working on it"
 *   maintenance      → "Scheduled work in progress"
 *
 * Banner is dismissible — sets a localStorage flag keyed on the incident id.
 * Re-appears for the next distinct incident.
 */
import { useEffect, useState } from 'react'

const FEED = 'https://status.oriz.in/feed.rss'
const FALLBACK_FEED = 'https://status-backup.oriz.in/feed.rss'

type Severity = 'degraded' | 'partial_outage' | 'major_outage' | 'maintenance'

interface Incident {
  id: string
  title: string
  severity: Severity
}

interface Props {
  /** Per-site identifier, used for the `?ref=banner-<siteId>` UTM tag. */
  siteId: string
  /** SSR-injected incident from a build-time fetch (optional). */
  initialIncident?: Incident | null
}

const LABELS: Record<Severity, string> = {
  degraded: 'Degraded',
  partial_outage: 'Partial outage',
  major_outage: 'Major outage',
  maintenance: 'Maintenance',
}

const STRAP: Record<Severity, string> = {
  degraded: 'Some features may be slow',
  partial_outage: 'Some sites are unreachable',
  major_outage: "We're working on it",
  maintenance: 'Scheduled work in progress',
}

function dismissedKey(id: string): string {
  return `oriz:status-dismissed:${id}`
}

function parseSeverity(raw: string): Severity {
  const r = raw.toLowerCase()
  if (r.includes('major')) return 'major_outage'
  if (r.includes('partial')) return 'partial_outage'
  if (r.includes('maintenance')) return 'maintenance'
  return 'degraded'
}

/** Parses the latest *active* incident from a Better Stack RSS feed string. */
export function parseLatestActive(rss: string): Incident | null {
  if (!rss) return null
  // Crude RSS item walk — Better Stack <item> blocks include
  //   <title>...</title>
  //   <guid>...</guid>
  //   <category>severity:major_outage</category>
  //   <category>status:investigating</category>  (only when active)
  const itemRe = /<item\b[\s\S]*?<\/item>/g
  const items = rss.match(itemRe) ?? []
  for (const item of items) {
    const status = /<category[^>]*>\s*status:([a-z_]+)\s*<\/category>/i.exec(item)?.[1]
    // Active = anything not yet "resolved"/"completed".
    if (!status || status === 'resolved' || status === 'completed') continue
    const title = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(item)?.[1]?.replace(/<!\[CDATA\[|\]\]>/g, '').trim() ?? '(incident)'
    const guid = /<guid[^>]*>([\s\S]*?)<\/guid>/i.exec(item)?.[1]?.trim() ?? title
    const sevRaw = /<category[^>]*>\s*severity:([a-z_]+)\s*<\/category>/i.exec(item)?.[1] ?? 'degraded'
    return { id: guid, title, severity: parseSeverity(sevRaw) }
  }
  return null
}

async function tryFetch(url: string, signal?: AbortSignal): Promise<string | null> {
  try {
    const res = await fetch(url, { signal, headers: { Accept: 'application/rss+xml, text/xml' } })
    if (!res.ok) return null
    return await res.text()
  } catch {
    return null
  }
}

export default function StatusBanner({ siteId, initialIncident = null }: Props) {
  const [incident, setIncident] = useState<Incident | null>(initialIncident)
  const [dismissed, setDismissed] = useState<boolean>(false)

  useEffect(() => {
    const ac = new AbortController()
    let mounted = true

    const tick = async () => {
      const rss = (await tryFetch(FEED, ac.signal)) ?? (await tryFetch(FALLBACK_FEED, ac.signal))
      if (!mounted) return
      setIncident(rss ? parseLatestActive(rss) : null)
    }

    tick()
    const t = setInterval(tick, 60_000)
    return () => {
      mounted = false
      ac.abort()
      clearInterval(t)
    }
  }, [])

  useEffect(() => {
    if (!incident) return
    try {
      setDismissed(localStorage.getItem(dismissedKey(incident.id)) === '1')
    } catch {
      setDismissed(false)
    }
  }, [incident])

  if (!incident || dismissed) return null

  const detailsHref = `https://status.oriz.in/?ref=banner-${siteId}`

  return (
    <div data-oriz-status={incident.severity} role="status" aria-live="polite">
      <span data-oriz-status-label>[{LABELS[incident.severity]}]</span>{' '}
      <span data-oriz-status-strap>{STRAP[incident.severity]}</span>{' '}
      <a data-oriz-status-link href={detailsHref} target="_blank" rel="noopener noreferrer">
        details →
      </a>
      <button
        type="button"
        data-oriz-status-dismiss
        aria-label="Dismiss status banner"
        onClick={() => {
          try {
            localStorage.setItem(dismissedKey(incident.id), '1')
          } catch {
            /* private mode — fail silently, banner returns next visit */
          }
          setDismissed(true)
        }}
      >
        ×
      </button>
    </div>
  )
}
