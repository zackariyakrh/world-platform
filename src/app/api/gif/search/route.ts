import { NextRequest, NextResponse } from "next/server"

const GIPHY_API_KEY = process.env.GIPHY_API_KEY || "dc6zaTOxFJmzC"
const GIPHY_BASE = "https://api.giphy.com/v1/gifs"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q")
  const limit = searchParams.get("limit") || "24"
  const offset = searchParams.get("offset") || "0"

  if (!query || !query.trim()) {
    return NextResponse.json({ error: "q parameter is required" }, { status: 400 })
  }

  try {
    const url = `${GIPHY_BASE}/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query.trim())}&limit=${limit}&offset=${offset}&rating=g&lang=en`
    const res = await fetch(url)
    if (!res.ok) {
      return NextResponse.json({ error: "GIPHY API error" }, { status: 502 })
    }
    const data = await res.json()
    const gifs = (data.data || []).map((item: any) => ({
      id: item.id,
      title: item.title,
      url: item.images?.downsized_medium?.url || item.images?.original?.url || "",
      preview: item.images?.fixed_height_small?.url || item.images?.fixed_height?.url || "",
      width: parseInt(item.images?.downsized_medium?.width || "0", 10),
      height: parseInt(item.images?.downsized_medium?.height || "0", 10),
    }))
    return NextResponse.json({ gifs, pagination: data.pagination })
  } catch (err) {
    console.error("GIF search failed:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const GIPHY_BASE = "https://api.giphy.com/v1/gifs/trending"
  try {
    const url = `${GIPHY_BASE}?api_key=${GIPHY_API_KEY}&limit=24&rating=g`
    const res = await fetch(url)
    if (!res.ok) {
      return NextResponse.json({ error: "GIPHY API error" }, { status: 502 })
    }
    const data = await res.json()
    const gifs = (data.data || []).map((item: any) => ({
      id: item.id,
      title: item.title,
      url: item.images?.downsized_medium?.url || item.images?.original?.url || "",
      preview: item.images?.fixed_height_small?.url || item.images?.fixed_height?.url || "",
      width: parseInt(item.images?.downsized_medium?.width || "0", 10),
      height: parseInt(item.images?.downsized_medium?.height || "0", 10),
    }))
    return NextResponse.json({ gifs })
  } catch (err) {
    console.error("GIF trending failed:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
