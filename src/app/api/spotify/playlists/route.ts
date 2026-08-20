import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getPlaylists } from "@/lib/spotify/api"

export async function GET() {
  try {
    const session = await auth()
    const userId = (session?.user as any)?.id as string | undefined
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const playlists = await getPlaylists(userId)
    return NextResponse.json(playlists)
  } catch (error: any) {
    if (error.status === 401) {
      return NextResponse.json({ error: "Spotify not connected" }, { status: 401 })
    }
    return NextResponse.json({ error: "Failed to fetch playlists" }, { status: 500 })
  }
}
