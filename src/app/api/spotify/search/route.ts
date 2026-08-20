import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { searchSpotify } from "@/lib/spotify/api"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const userId = (session?.user as any)?.id as string | undefined
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const q = searchParams.get("q")
    const type = searchParams.get("type") || "track,artist,album,playlist"
    const limit = parseInt(searchParams.get("limit") || "20")
    const offset = parseInt(searchParams.get("offset") || "0")

    if (!q || !q.trim()) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 })
    }

    const results = await searchSpotify(userId, q.trim(), type, limit, offset)
    return NextResponse.json(results)
  } catch (error: any) {
    if (error.status === 401) {
      return NextResponse.json({ error: "Spotify not connected" }, { status: 401 })
    }
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
}
