/*
 * <MultiSearch /> — multi-engine "search the web" launcher.
 *
 * Locked spec: knowledge/decisions/architecture/multi-engine-search-button.md
 *
 * Click the button → popover with 6 engines (Google / DDG / Bing / Kagi /
 * Marginalia / Ecosia). Each engine link opens in a new tab.
 *
 * Contextual query priority:
 *   1. window.getSelection().toString()       (live selection wins)
 *   2. last-clicked card title                (data-oriz-card-title attr)
 *   3. document.title minus the family suffix (e.g. " — oriz")
 */
import { useCallback, useEffect, useRef, useState } from 'react'

export interface SearchEngine {
  id: string
  name: string
  url: (q: string) => string
  /** Single-character glyph for the affordance — the kit ships no images. */
  glyph: string
}

export const DEFAULT_ENGINES: SearchEngine[] = [
  { id: 'google', name: 'Google', glyph: 'G', url: (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}` },
  { id: 'ddg', name: 'DuckDuckGo', glyph: 'D', url: (q) => `https://duckduckgo.com/?q=${encodeURIComponent(q)}` },
  { id: 'bing', name: 'Bing', glyph: 'B', url: (q) => `https://www.bing.com/search?q=${encodeURIComponent(q)}` },
  { id: 'kagi', name: 'Kagi', glyph: 'K', url: (q) => `https://kagi.com/search?q=${encodeURIComponent(q)}` },
  { id: 'marginalia', name: 'Marginalia', glyph: 'M', url: (q) => `https://search.marginalia.nu/search?query=${encodeURIComponent(q)}` },
  { id: 'ecosia', name: 'Ecosia', glyph: 'E', url: (q) => `https://www.ecosia.org/search?q=${encodeURIComponent(q)}` },
]

interface Props {
  engines?: SearchEngine[]
  /** Suffix stripped off document.title when used as the fallback query. */
  titleSuffix?: string
  /** Override the rendered button label. Default: "Search the web". */
  label?: string
}

function resolveQuery(titleSuffix: string): string {
  if (typeof window === 'undefined') return ''
  const sel = window.getSelection?.()?.toString().trim()
  if (sel) return sel

  // Last-clicked card title — populated by the click handler below.
  const last = (window as unknown as { __orizLastCardTitle?: string }).__orizLastCardTitle
  if (last) return last

  let title = document.title || ''
  if (titleSuffix && title.endsWith(titleSuffix)) title = title.slice(0, -titleSuffix.length).trim()
  return title.replace(/\s*[—–-]\s*oriz.*$/i, '').trim() || title
}

/** One-time install of a click listener that snapshots `data-oriz-card-title`. */
function useLastClickedCardTitle() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      const card = target?.closest('[data-oriz-card-title]') as HTMLElement | null
      if (card) {
        const t = card.getAttribute('data-oriz-card-title')
        if (t) (window as unknown as { __orizLastCardTitle?: string }).__orizLastCardTitle = t
      }
    }
    document.addEventListener('click', onClick, { capture: true })
    return () => document.removeEventListener('click', onClick, { capture: true })
  }, [])
}

export default function MultiSearch({
  engines = DEFAULT_ENGINES,
  titleSuffix = ' — oriz',
  label = 'Search the web',
}: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const popRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  useLastClickedCardTitle()

  const refreshQuery = useCallback(() => {
    setQuery(resolveQuery(titleSuffix))
  }, [titleSuffix])

  const toggle = useCallback(() => {
    refreshQuery()
    setOpen((o) => !o)
  }, [refreshQuery])

  // Close on outside click + Escape.
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node) && btnRef.current && !btnRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        btnRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div data-oriz-multisearch="root" style={{ position: 'relative', display: 'inline-block' }}>
      <button
        ref={btnRef}
        type="button"
        data-oriz-multisearch="trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={toggle}
      >
        {label}
      </button>
      {open && (
        <div
          ref={popRef}
          data-oriz-multisearch="popover"
          role="dialog"
          aria-label={label}
        >
          <p data-oriz-multisearch="query" title={query}>
            <span data-oriz-multisearch="query-label">query:</span>{' '}
            <span data-oriz-multisearch="query-text">{query || '(none)'}</span>
          </p>
          <ul data-oriz-multisearch="list">
            {engines.map((e) => (
              <li key={e.id}>
                <a
                  data-oriz-multisearch="engine"
                  data-oriz-multisearch-engine-id={e.id}
                  href={query ? e.url(query) : '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                >
                  <span data-oriz-multisearch="glyph" aria-hidden="true">{e.glyph}</span>
                  <span data-oriz-multisearch="name">{e.name}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
