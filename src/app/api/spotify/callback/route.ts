import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { exchangeCodeForTokens } from "@/lib/spotify/auth"
import { SPOTIFY_API_BASE, SpotifyUserProfile } from "@/lib/spotify/types"

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
    let stateRecord
    try {
      stateRecord = await db.appSetting.findUnique({
        where: { key: `spotify_state_${state}` },
      })
    } catch (e: any) {
      console.error("Spotify callback: DB lookup failed:", e?.message)
      return NextResponse.redirect(new URL("/spotify?error=db_lookup_failed", request.url))
    }

    if (!stateRecord) {
      return NextResponse.redirect(new URL("/spotify?error=invalid_state", request.url))
    }

    const stateData = JSON.parse(stateRecord.value)
    const userId = stateData.userId

    await db.appSetting.delete({ where: { key: `spotify_state_${state}` } }).catch(() => {})

    let tokens
    try {
      tokens = await exchangeCodeForTokens(code)
    } catch (e: any) {
      console.error("Spotify callback: token exchange failed:", e?.message)
      return NextResponse.redirect(new URL("/spotify?error=token_exchange_failed", request.url))
    }

    let profile: SpotifyUserProfile
    try {
      const profileRes = await fetch(`${SPOTIFY_API_BASE}/me`, {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      })
      if (!profileRes.ok) {
        const body = await profileRes.text()
        console.error("Spotify callback: profile fetch failed:", profileRes.status, body)
        return NextResponse.redirect(new URL("/spotify?error=profile_fetch_failed", request.url))
      }
      profile = await profileRes.json()
    } catch (e: any) {
      console.error("Spotify callback: profile fetch error:", e?.message)
      return NextResponse.redirect(new URL("/spotify?error=profile_error", request.url))
    }

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000)

    try {
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
    } catch (e: any) {
      console.error("Spotify callback: DB upsert failed:", e?.message)
      return NextResponse.redirect(new URL("/spotify?error=db_save_failed", request.url))
    }

    return NextResponse.redirect(new URL("/spotify?connected=true", request.url))
  } catch (error: any) {
    console.error("Spotify callback error:", error?.message, error?.stack)
    return NextResponse.redirect(new URL("/spotify?error=callback_failed", request.url))
  }
}
