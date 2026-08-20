import { db } from "@/lib/db"
import { SPOTIFY_SCOPES } from "./types"

function getClientId() {
  return process.env.SPOTIFY_CLIENT_ID!
}
function getClientSecret() {
  return process.env.SPOTIFY_CLIENT_SECRET!
}
function getRedirectUri() {
  return process.env.SPOTIFY_REDIRECT_URI || `${process.env.APP_URL || "https://nexus-khaki-one-43.vercel.app"}/api/spotify/callback`
}

export function getSpotifyAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: getClientId(),
    response_type: "code",
    redirect_uri: getRedirectUri(),
    scope: SPOTIFY_SCOPES,
    state,
    show_dialog: "true",
  })
  return `https://accounts.spotify.com/authorize?${params.toString()}`
}

export async function exchangeCodeForTokens(code: string): Promise<{
  access_token: string
  refresh_token: string
  expires_in: number
  scope: string
}> {
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${getClientId()}:${getClientSecret()}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: getRedirectUri(),
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Failed to exchange code for tokens: ${res.status} ${body}`)
  }

  return res.json()
}

export async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string
  expires_in: number
}> {
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${getClientId()}:${getClientSecret()}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  })

  if (!res.ok) {
    throw new Error("Failed to refresh access token")
  }

  return res.json()
}

export async function getValidAccessToken(userId: string): Promise<string | null> {
  const connection = await db.spotifyConnection.findUnique({
    where: { userId },
  })

  if (!connection) return null

  const now = new Date()
  const bufferMs = 5 * 60 * 1000

  if (connection.expiresAt.getTime() - bufferMs > now.getTime()) {
    return connection.accessToken
  }

  try {
    const data = await refreshAccessToken(connection.refreshToken)
    const newExpiresAt = new Date(now.getTime() + data.expires_in * 1000)

    await db.spotifyConnection.update({
      where: { userId },
      data: {
        accessToken: data.access_token,
        expiresAt: newExpiresAt,
      },
    })

    return data.access_token
  } catch {
    await db.spotifyConnection.delete({ where: { userId } })
    return null
  }
}

export async function disconnectSpotify(userId: string): Promise<void> {
  await db.spotifyConnection.delete({ where: { userId } }).catch(() => {})
}
