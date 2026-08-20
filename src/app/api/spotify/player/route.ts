import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getCurrentlyPlaying, getPlaybackState, play, pause, skipNext, skipPrevious, seek, setVolume, setShuffle, setRepeat } from "@/lib/spotify/api"

export async function GET() {
  try {
    const session = await auth()
    const userId = (session?.user as any)?.id as string | undefined
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const [current, state] = await Promise.all([
      getCurrentlyPlaying(userId).catch(() => null),
      getPlaybackState(userId).catch(() => null),
    ])

    return NextResponse.json({ currentlyPlaying: current, playbackState: state })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const userId = (session?.user as any)?.id as string | undefined
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const { action, positionMs, volume, state: stateValue, repeatState, trackUri } = body

    switch (action) {
      case "play":
        await play(userId, trackUri ? { uris: [trackUri] } : undefined)
        break
      case "pause":
        await pause(userId)
        break
      case "next":
        await skipNext(userId)
        break
      case "previous":
        await skipPrevious(userId)
        break
      case "seek":
        if (typeof positionMs === "number") await seek(userId, positionMs)
        break
      case "volume":
        if (typeof volume === "number") await setVolume(userId, volume)
        break
      case "shuffle":
        if (typeof stateValue === "boolean") await setShuffle(userId, stateValue)
        break
      case "repeat":
        if (repeatState) await setRepeat(userId, repeatState)
        break
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    if (error.status === 403) {
      return NextResponse.json({ error: "Spotify Premium required for this action" }, { status: 403 })
    }
    if (error.status === 404) {
      return NextResponse.json({ error: "No active device found. Open Spotify on a device first." }, { status: 404 })
    }
    return NextResponse.json({ error: "Failed to control playback" }, { status: 500 })
  }
}
