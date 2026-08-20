import { getValidAccessToken } from "./auth"
import { SPOTIFY_API_BASE } from "./types"

export class SpotifyAPIError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
    this.name = "SpotifyAPIError"
  }
}

async function spotifyFetch<T>(
  userId: string,
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getValidAccessToken(userId)
  if (!token) throw new SpotifyAPIError("Spotify not connected", 401)

  const url = endpoint.startsWith("http") ? endpoint : `${SPOTIFY_API_BASE}${endpoint}`
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  })

  if (res.status === 204) return null as T

  if (!res.ok) {
    const body = await res.text()
    throw new SpotifyAPIError(
      body || `Spotify API error: ${res.status}`,
      res.status
    )
  }

  return res.json()
}

export async function getSpotifyProfile(userId: string) {
  return spotifyFetch<any>(userId, "/me")
}

export async function getCurrentlyPlaying(userId: string) {
  try {
    return await spotifyFetch<any>(userId, "/me/player/currently-playing")
  } catch (e: any) {
    if (e.status === 204 || e.status === 404) return null
    throw e
  }
}

export async function getPlaybackState(userId: string) {
  try {
    return await spotifyFetch<any>(userId, "/me/player")
  } catch (e: any) {
    if (e.status === 204 || e.status === 404) return null
    throw e
  }
}

export async function play(userId: string, body?: any) {
  return spotifyFetch<void>(userId, "/me/player/play", {
    method: "PUT",
    body: body ? JSON.stringify(body) : undefined,
  })
}

export async function pause(userId: string) {
  return spotifyFetch<void>(userId, "/me/player/pause", { method: "PUT" })
}

export async function skipNext(userId: string) {
  return spotifyFetch<void>(userId, "/me/player/next", { method: "POST" })
}

export async function skipPrevious(userId: string) {
  return spotifyFetch<void>(userId, "/me/player/previous", { method: "POST" })
}

export async function seek(userId: string, positionMs: number) {
  return spotifyFetch<void>(userId, `/me/player/seek?position_ms=${positionMs}`, {
    method: "PUT",
  })
}

export async function setVolume(userId: string, volumePercent: number) {
  return spotifyFetch<void>(userId, `/me/player/volume?volume_percent=${volumePercent}`, {
    method: "PUT",
  })
}

export async function setShuffle(userId: string, state: boolean) {
  return spotifyFetch<void>(userId, `/me/player/shuffle?state=${state}`, {
    method: "PUT",
  })
}

export async function setRepeat(userId: string, state: "track" | "context" | "off") {
  return spotifyFetch<void>(userId, `/me/player/repeat?state=${state}`, {
    method: "PUT",
  })
}

export async function searchSpotify(
  userId: string,
  query: string,
  types: string = "track,artist,album,playlist",
  limit: number = 20,
  offset: number = 0
) {
  const params = new URLSearchParams({
    q: query,
    type: types,
    limit: String(limit),
    offset: String(offset),
  })
  return spotifyFetch<any>(userId, `/search?${params.toString()}`)
}

export async function getPlaylists(userId: string, limit: number = 50) {
  return spotifyFetch<any>(userId, `/me/playlists?limit=${limit}`)
}

export async function getPlaylistTracks(userId: string, playlistId: string) {
  return spotifyFetch<any>(userId, `/playlists/${playlistId}/tracks`)
}

export async function playTrack(userId: string, trackUri: string) {
  return spotifyFetch<void>(userId, "/me/player/play", {
    method: "PUT",
    body: JSON.stringify({ uris: [trackUri] }),
  })
}

export async function playPlaylist(userId: string, playlistUri: string, offset?: number) {
  return spotifyFetch<void>(userId, "/me/player/play", {
    method: "PUT",
    body: JSON.stringify({
      context_uri: playlistUri,
      offset: offset !== undefined ? { position: offset } : undefined,
    }),
  })
}

export async function getRecentlyPlayed(userId: string, limit: number = 20) {
  return spotifyFetch<any>(userId, `/me/player/recently-played?limit=${limit}`)
}
