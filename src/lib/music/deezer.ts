export interface DeezerTrack {
  id: number
  title: string
  title_short: string
  artist: { id: number; name: string }
  album: { id: number; title: string; cover: string; cover_medium: string }
  preview: string
  duration: number
  link: string
}

export interface DeezerSearchResult {
  data: DeezerTrack[]
  total: number
}

export interface DeezerPlaylist {
  id: number
  title: string
  picture: string
  picture_medium: string
  nb_tracks: number
  user: { name: string }
  link: string
}

export async function searchDeezer(query: string, limit = 20): Promise<DeezerSearchResult> {
  const res = await fetch(
    `https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=${limit}`
  )
  if (!res.ok) throw new Error("Deezer search failed")
  return res.json()
}

export async function getDeezerTrack(id: number): Promise<DeezerTrack> {
  const res = await fetch(`https://api.deezer.com/track/${id}`)
  if (!res.ok) throw new Error("Deezer track not found")
  return res.json()
}

export async function getDeezerCharts(limit = 20): Promise<DeezerSearchResult> {
  const res = await fetch(`https://api.deezer.com/chart/0/tracks?limit=${limit}`)
  if (!res.ok) throw new Error("Deezer charts failed")
  return res.json()
}

export async function getDeezerRadio(limit = 20): Promise<DeezerSearchResult> {
  const res = await fetch(`https://api.deezer.com/radio/tracks?limit=${limit}`)
  if (!res.ok) throw new Error("Deezer radio failed")
  return res.json()
}
