import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { getSpotifyAuthUrl } from "@/lib/spotify/auth"
import crypto from "crypto"

export async function GET() {
  try {
    const session = await auth()
    const userId = (session?.user as any)?.id as string | undefined
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const existing = await db.spotifyConnection.findUnique({ where: { userId } })
    if (existing) {
      return NextResponse.json({
        connected: true,
        spotifyDisplayName: existing.spotifyDisplayName,
        spotifyAvatarUrl: existing.spotifyAvatarUrl,
        spotifyUserId: existing.spotifyUserId,
        showOnProfile: existing.showOnProfile,
        showCurrentlyPlaying: existing.showCurrentlyPlaying,
        privacyLevel: existing.privacyLevel,
      })
    }

    return NextResponse.json({ connected: false })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST() {
  try {
    const session = await auth()
    const userId = (session?.user as any)?.id as string | undefined
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const state = crypto.randomUUID()
    const stateData = JSON.stringify({ userId, state, timestamp: Date.now() })
    const encodedState = Buffer.from(stateData).toString("base64url")

    const authUrl = getSpotifyAuthUrl(encodedState)

    await db.appSetting.upsert({
      where: { key: `spotify_state_${encodedState}` },
      update: { value: stateData },
      create: { key: `spotify_state_${encodedState}`, value: stateData },
    })

    return NextResponse.json({ authUrl })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    const userId = (session?.user as any)?.id as string | undefined
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const connection = await db.spotifyConnection.findUnique({ where: { userId } })
    if (!connection) {
      return NextResponse.json({ error: "No Spotify connection" }, { status: 404 })
    }

    const body = await request.json().catch(() => ({}))
    const updated = await db.spotifyConnection.update({
      where: { userId },
      data: {
        showOnProfile: body.showOnProfile ?? connection.showOnProfile,
        showCurrentlyPlaying: body.showCurrentlyPlaying ?? connection.showCurrentlyPlaying,
        privacyLevel: body.privacyLevel ?? connection.privacyLevel,
      },
    })

    return NextResponse.json({
      showOnProfile: updated.showOnProfile,
      showCurrentlyPlaying: updated.showCurrentlyPlaying,
      privacyLevel: updated.privacyLevel,
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const session = await auth()
    const userId = (session?.user as any)?.id as string | undefined
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await db.spotifyConnection.delete({ where: { userId } }).catch(() => {})
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
