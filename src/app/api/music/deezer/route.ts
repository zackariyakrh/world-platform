import { NextRequest, NextResponse } from "next/server"
import { searchDeezer, getDeezerCharts } from "@/lib/music/deezer"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q")
  const limit = Math.min(Number(searchParams.get("limit") || "20"), 50)

  try {
    if (!q) {
      const charts = await getDeezerCharts(limit)
      return NextResponse.json(charts)
    }
    const results = await searchDeezer(q, limit)
    return NextResponse.json(results)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
