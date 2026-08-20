import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { exchangeCodeForTokens } from "@/lib/spotify/auth"
import { getSpotifyProfile } from "@/lib/spotify/api"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")

  if (error === "access_denied") {
    return NextResponse.redirect(new URL("/spotify?error=denied", request.url))
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL("/spotify?error=missing_params", request.url))
  }

  try {
    const stateRecord = await db.appSetting.findUnique({
      where: { key: `spotify_state_${state}` },
    })

    if (!stateRecord) {
      return NextResponse.redirect(new URL("/spotify?error=invalid_state", request.url))
    }

    const stateData = JSON.parse(stateRecord.value)
    const userId = stateData.userId

    await db.appSetting.delete({ where: { key: `spotify_state_${state}` } }).catch(() => {})

    const tokens = await exchangeCodeForTokens(code)

    const profile = await getSpotifyProfile(userId)
    if (!profile) {
      return NextResponse.redirect(new URL("/spotify?error=profile_failed", request.url))
    }

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000)

    await db.spotifyConnection.upsert({
      where: { userId },
      update: {
        spotifyUserId: profile.id,
        spotifyDisplayName: profile.display_name || profile.id,
        spotifyEmail: profile.email || null,
        spotifyAvatarUrl: profile.images?.[0]?.url || null,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt,
        scopes: tokens.scope,
      },
      create: {
        userId,
        spotifyUserId: profile.id,
        spotifyDisplayName: profile.display_name || profile.id,
        spotifyEmail: profile.email || null,
        spotifyAvatarUrl: profile.images?.[0]?.url || null,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt,
        scopes: tokens.scope,
      },
    })

    return NextResponse.redirect(new URL("/spotify?connected=true", request.url))
  } catch (error) {
    console.error("Spotify callback error:", error)
    return NextResponse.redirect(new URL("/spotify?error=callback_failed", request.url))
  }
}
