import type { BottomBarAction } from '~/components/chrome/BottomBar.astro'

/*
 * BottomBar actions — v0 locked design 2026-06-22.
 * Five: Home, Apps, Tools, Search, Me. Icons are unicode glyphs (chrome
 * BottomBar takes plain strings; replace with lucide icons in a later iter).
 */
export const bottomBarActions: BottomBarAction[] = [
  { icon: '⌂', label: 'Home', href: '/' },
  { icon: '⊞', label: 'Apps', href: '/apps/' },
  { icon: '✦', label: 'Tools', href: '/tools/' },
  { icon: '⌕', label: 'Search', href: '/#oriz-search' },
  { icon: '◐', label: 'Me', href: '/me' },
]
