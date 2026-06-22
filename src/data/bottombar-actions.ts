import type { BottomBarAction } from '@chirag127/astro-chrome/BottomBar.astro'

export const bottomBarActions: BottomBarAction[] = [
  { icon: '⌂', label: 'Home', href: '/' },
  { icon: '⊞', label: 'Apps', href: '/apps/' },
  { icon: '✦', label: 'Books', href: '/books/' },
  { icon: '◐', label: 'Me', href: 'https://me.oriz.in/' },
  { icon: '☰', label: 'Menu', href: '#sb-toggle' },
]
