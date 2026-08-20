import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getPlaylistTracks } from "@/lib/spotify/api"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ playlistId: string }> }
) {
  try {
    const session = await auth()
    const userId = (session?.user as any)?.id as string | undefined
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { playlistId } = await params
    const tracks = await getPlaylistTracks(userId, playlistId)
    return NextResponse.json(tracks)
  } catch (error: any) {
    if (error.status === 401) {
      return NextResponse.json({ error: "Spotify not connected" }, { status: 401 })
    }
    return NextResponse.json({ error: "Failed to fetch playlist tracks" }, { status: 500 })
  }
}
