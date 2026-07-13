/**
 * Media API helpers — build-time fetch from Trakt, MAL, Last.fm, Goodreads
 * All functions return typed data or empty arrays on failure.
 */

const TRAKT_CLIENT_ID = import.meta.env.TRAKT_CLIENT_ID ?? ''
const TRAKT_USERNAME = import.meta.env.TRAKT_USERNAME ?? 'chirag127'
const MAL_CLIENT_ID = import.meta.env.MAL_CLIENT_ID ?? ''
const MAL_USERNAME = import.meta.env.MAL_USERNAME ?? 'chirag127'
const LASTFM_API_KEY = import.meta.env.LASTFM_API_KEY ?? ''
const LASTFM_USERNAME = import.meta.env.LASTFM_USERNAME ?? 'chirag127'
const GOODREADS_ID = import.meta.env.GOODREADS_USER_ID ?? ''

// ---- types ----------------------------------------------------------------

export interface TraktItem {
  type: 'movie' | 'episode'
  watched_at: string
  movie?: { title: string; year: number; ids: { tmdb: number; imdb: string } }
  show?: { title: string; year: number; ids: { tmdb: number } }
  episode?: { season: number; number: number; title: string }
}

export interface TraktWatchlistMovie {
  movie: { title: string; year: number; ids: { tmdb: number; imdb: string } }
}

export interface MALAnime {
  node: {
    id: number
    title: string
    main_picture?: { medium: string; large: string }
    mean?: number
    num_episodes?: number
  }
  list_status: {
    status: string
    score: number
    num_episodes_watched: number
    updated_at: string
  }
}

export interface LastfmTrack {
  name: string
  artist: { '#text': string }
  album: { '#text': string }
  image: Array<{ '#text': string; size: string }>
  date?: { '#text': string; uts: string }
  '@attr'?: { nowplaying?: string }
}

export interface LastfmArtist {
  name: string
  playcount: string
  image: Array<{ '#text': string; size: string }>
}

export interface GoodreadsBook {
  title: string
  author: string
  cover: string
  shelf: string
  rating?: string
  link: string
}

// ---- Trakt ----------------------------------------------------------------

async function traktFetch<T>(path: string): Promise<T[]> {
  if (!TRAKT_CLIENT_ID) return []
  try {
    const r = await fetch(`https://api.trakt.tv${path}`, {
      headers: {
        'Content-Type': 'application/json',
        'trakt-api-version': '2',
        'trakt-api-key': TRAKT_CLIENT_ID,
      },
    })
    if (!r.ok) return []
    return r.json()
  } catch {
    return []
  }
}

export async function getTraktHistory(limit = 30): Promise<TraktItem[]> {
  return traktFetch(`/users/${TRAKT_USERNAME}/history?limit=${limit}`)
}

export async function getTraktMovies(limit = 20): Promise<TraktItem[]> {
  const h = await traktFetch<TraktItem>(`/users/${TRAKT_USERNAME}/history/movies?limit=${limit}`)
  return h
}

export async function getTraktShows(limit = 20): Promise<TraktItem[]> {
  return traktFetch(`/users/${TRAKT_USERNAME}/history/shows?limit=${limit}`)
}

export async function getTraktWatchlist(): Promise<TraktWatchlistMovie[]> {
  return traktFetch(`/users/${TRAKT_USERNAME}/watchlist/movies`)
}

export async function getTraktStats(): Promise<Record<string, unknown>> {
  if (!TRAKT_CLIENT_ID) return {}
  try {
    const r = await fetch(`https://api.trakt.tv/users/${TRAKT_USERNAME}/stats`, {
      headers: { 'trakt-api-version': '2', 'trakt-api-key': TRAKT_CLIENT_ID },
    })
    if (!r.ok) return {}
    return r.json()
  } catch {
    return {}
  }
}

// ---- MAL ------------------------------------------------------------------

async function malFetch<T>(path: string): Promise<T[]> {
  if (!MAL_CLIENT_ID) return []
  try {
    const r = await fetch(`https://api.myanimelist.net/v2${path}`, {
      headers: { 'X-MAL-CLIENT-ID': MAL_CLIENT_ID },
    })
    if (!r.ok) return []
    const data = await r.json()
    return data.data ?? []
  } catch {
    return []
  }
}

export async function getMALAnimeList(status = 'watching', limit = 20): Promise<MALAnime[]> {
  return malFetch(
    `/users/${MAL_USERNAME}/animelist?fields=list_status,main_picture,mean,num_episodes&status=${status}&limit=${limit}&sort=list_updated_at`,
  )
}

export async function getMALMangaList(status = 'reading', limit = 20): Promise<MALAnime[]> {
  return malFetch(
    `/users/${MAL_USERNAME}/mangalist?fields=list_status,main_picture,mean&status=${status}&limit=${limit}&sort=list_updated_at`,
  )
}

// ---- Last.fm ---------------------------------------------------------------

async function lastfmFetch<T>(method: string, extra = ''): Promise<T> {
  const url = `https://ws.audioscrobbler.com/2.0/?method=${method}&user=${LASTFM_USERNAME}&api_key=${LASTFM_API_KEY}&format=json${extra}`
  try {
    const r = await fetch(url)
    if (!r.ok) return {} as T
    return r.json()
  } catch {
    return {} as T
  }
}

export async function getLastfmRecentTracks(limit = 10): Promise<LastfmTrack[]> {
  const d = await lastfmFetch<{ recenttracks?: { track: LastfmTrack[] } }>(
    'user.getrecenttracks',
    `&limit=${limit}`,
  )
  return d.recenttracks?.track ?? []
}

export async function getLastfmTopArtists(period = '1month', limit = 12): Promise<LastfmArtist[]> {
  const d = await lastfmFetch<{ topartists?: { artist: LastfmArtist[] } }>(
    'user.gettopartists',
    `&period=${period}&limit=${limit}`,
  )
  return d.topartists?.artist ?? []
}

export async function getLastfmTopTracks(period = '1month', limit = 12): Promise<LastfmTrack[]> {
  const d = await lastfmFetch<{ toptracks?: { track: LastfmTrack[] } }>(
    'user.gettoptracks',
    `&period=${period}&limit=${limit}`,
  )
  return d.toptracks?.track ?? []
}

export async function getLastfmUserInfo(): Promise<Record<string, unknown>> {
  const d = await lastfmFetch<{ user?: Record<string, unknown> }>('user.getinfo')
  return d.user ?? {}
}

// ---- Goodreads RSS --------------------------------------------------------

export async function getGoodreadsShelf(shelf = 'currently-reading'): Promise<GoodreadsBook[]> {
  if (!GOODREADS_ID) return []
  try {
    const url = `https://www.goodreads.com/review/list/${GOODREADS_ID}.xml?shelf=${shelf}&sort=date_updated&per_page=10`
    const r = await fetch(url)
    if (!r.ok) return []
    const xml = await r.text()
    // Parse minimal fields from XML without a dependency
    const books: GoodreadsBook[] = []
    const items = xml.match(/<review>[\s\S]*?<\/review>/g) ?? []
    for (const item of items.slice(0, 10)) {
      const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ?? ''
      const author = item.match(/<name><!\[CDATA\[(.*?)\]\]><\/name>/)?.[1] ?? ''
      const cover = item.match(/<image_url>(.*?)<\/image_url>/)?.[1] ?? ''
      const link = item.match(/<link><!\[CDATA\[(.*?)\]\]><\/link>/)?.[1] ?? ''
      const rating = item.match(/<rating>(\d)<\/rating>/)?.[1]
      if (title) books.push({ title, author, cover, shelf, rating, link })
    }
    return books
  } catch {
    return []
  }
}

// ---- Combined activity feed -----------------------------------------------

export interface ActivityItem {
  type: 'watch' | 'listen' | 'read' | 'anime'
  title: string
  subtitle: string
  image?: string
  timestamp: string
  url?: string
}

export async function getCombinedActivity(limit = 20): Promise<ActivityItem[]> {
  const [trakt, tracks] = await Promise.all([getTraktHistory(10), getLastfmRecentTracks(10)])

  const items: ActivityItem[] = []

  for (const t of trakt.slice(0, 10)) {
    if (t.movie) {
      items.push({
        type: 'watch',
        title: t.movie.title,
        subtitle: `Movie · ${t.movie.year}`,
        timestamp: t.watched_at,
      })
    } else if (t.show && t.episode) {
      items.push({
        type: 'watch',
        title: t.show.title,
        subtitle: `S${t.episode.season}E${t.episode.number} · ${t.episode.title}`,
        timestamp: t.watched_at,
      })
    }
  }

  for (const t of tracks.slice(0, 10)) {
    if (t.name) {
      items.push({
        type: 'listen',
        title: t.name,
        subtitle: t.artist['#text'],
        image: t.image?.find((i) => i.size === 'medium')?.['#text'],
        timestamp: t.date?.uts
          ? new Date(+t.date.uts * 1000).toISOString()
          : new Date().toISOString(),
      })
    }
  }

  return items.sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, limit)
}
