export interface YouTubeVideo {
  id: string
  title: string
  channelTitle: string
  thumbnail: string
  duration?: string
  viewCount?: string
}

export interface YouTubeSearchResult {
  videos: YouTubeVideo[]
  totalResults: number
  nextPageToken?: string
}

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3"

function getApiKey(): string | null {
  return process.env.YOUTUBE_API_KEY || null
}

export async function searchYouTube(
  query: string,
  maxResults = 20,
  pageToken?: string
): Promise<YouTubeSearchResult> {
  const apiKey = getApiKey()
  if (!apiKey) {
    throw new Error("YouTube API key not configured. Add YOUTUBE_API_KEY to your environment.")
  }

  const params = new URLSearchParams({
    part: "snippet",
    q: query,
    type: "video",
    videoCategoryId: "10",
    maxResults: String(maxResults),
    key: apiKey,
  })
  if (pageToken) params.set("pageToken", pageToken)

  const res = await fetch(`${YOUTUBE_API_BASE}/search?${params}`)
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`YouTube search failed: ${res.status} ${body}`)
  }

  const data = await res.json()

  const videos: YouTubeVideo[] = data.items.map((item: any) => ({
    id: item.id.videoId,
    title: item.snippet.title,
    channelTitle: item.snippet.channelTitle,
    thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || "",
  }))

  return {
    videos,
    totalResults: data.pageInfo?.totalResults || 0,
    nextPageToken: data.nextPageToken,
  }
}

export async function getYouTubeVideoDetails(
  videoIds: string[]
): Promise<YouTubeVideo[]> {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error("YouTube API key not configured.")

  const params = new URLSearchParams({
    part: "snippet,contentDetails,statistics",
    id: videoIds.join(","),
    key: apiKey,
  })

  const res = await fetch(`${YOUTUBE_API_BASE}/videos?${params}`)
  if (!res.ok) throw new Error("YouTube video details failed")

  const data = await res.json()

  return data.items.map((item: any) => ({
    id: item.id,
    title: item.snippet.title,
    channelTitle: item.snippet.channelTitle,
    thumbnail: item.snippet.thumbnails?.medium?.url || "",
    duration: item.contentDetails?.duration,
    viewCount: item.statistics?.viewCount,
  }))
}

export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${typeof window !== "undefined" ? window.location.origin : ""}`
}
