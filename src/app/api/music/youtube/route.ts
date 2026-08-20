import { NextRequest, NextResponse } from "next/server"
import { searchYouTube } from "@/lib/music/youtube"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q")
  const limit = Math.min(Number(searchParams.get("limit") || "20"), 50)
  const pageToken = searchParams.get("pageToken") || undefined

  if (!q) {
    return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 })
  }

  try {
    const results = await searchYouTube(q, limit, pageToken)
    return NextResponse.json(results)
  } catch (error: any) {
    const status = error.message?.includes("not configured") ? 503 : 500
    return NextResponse.json({ error: error.message }, { status })
  }
}
