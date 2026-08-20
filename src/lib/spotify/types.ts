export const SPOTIFY_SCOPES = [
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-currently-playing",
  "user-read-private",
  "playlist-read-private",
  "playlist-read-collaborative",
  "user-library-read",
  "user-read-recently-played",
].join(" ")

export const SPOTIFY_API_BASE = "https://api.spotify.com/v1"

export interface SpotifyUserProfile {
  id: string
  display_name: string
  email?: string
  images: Array<{ url: string; width: number; height: number }>
  product: string
  country: string
  followers: { total: number }
}

export interface SpotifyTrack {
  id: string
  name: string
  artists: Array<{ id: string; name: string }>
  album: {
    id: string
    name: string
    images: Array<{ url: string; width: number; height: number }>
  }
  duration_ms: number
  external_urls: { spotify: string }
  preview_url?: string
}

export interface SpotifyCurrentlyPlaying {
  is_playing: boolean
  progress_ms: number
  currently_playing_type: "track" | "episode" | "ad" | "unknown"
  item: SpotifyTrack | null
  device: SpotifyDevice
  shuffle_state: boolean
  repeat_state: "off" | "track" | "context"
}

export interface SpotifyDevice {
  id: string
  name: string
  type: string
  is_active: boolean
  volume_percent: number
  supports_volume: boolean
}

export interface SpotifyPlaylist {
  id: string
  name: string
  description: string | null
  images: Array<{ url: string; width: number; height: number }>
  owner: { id: string; display_name: string }
  tracks: { total: number }
  public: boolean | null
  external_urls: { spotify: string }
}

export interface SpotifyPlaylistTrack {
  added_at: string
  track: SpotifyTrack | null
}

export interface SpotifySearchResult {
  tracks?: { items: SpotifyTrack[]; total: number }
  artists?: { items: SpotifyArtist[]; total: number }
  albums?: { items: SpotifyAlbum[]; total: number }
  playlists?: { items: SpotifyPlaylist[]; total: number }
}

export interface SpotifyArtist {
  id: string
  name: string
  images: Array<{ url: string; width: number; height: number }>
  genres: string[]
  followers: { total: number }
  external_urls: { spotify: string }
}

export interface SpotifyAlbum {
  id: string
  name: string
  artists: Array<{ id: string; name: string }>
  images: Array<{ url: string; width: number; height: number }>
  release_date: string
  total_tracks: number
  external_urls: { spotify: string }
}

export interface SpotifyPlaylistFull extends SpotifyPlaylist {
  tracks: { items: SpotifyPlaylistTrack[]; total: number; next: string | null }
}
