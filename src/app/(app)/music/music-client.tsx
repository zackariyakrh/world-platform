"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useMusicStore, type Track } from "@/stores/music-store"
import {
  Music,
  Search,
  Play,
  Pause,
  Loader2,
  LayoutList,
  LayoutGrid,
  RefreshCw,
  Heart,
} from "lucide-react"

const RANDOM_SEARCHES = [
  "popular music 2026", "trending songs right now", "top hits this week",
  "best music videos", "viral songs 2026", "new music releases",
  "chart toppers", "hot songs right now", "music hits of the week",
  "top 40 songs", "most streamed songs", "best new music",
  "radio hits 2026", "billboard hot 100", "spotify top 50",
  "catchy songs", "feel good music", "chill music vibes",
  "party music hits", "workout playlist songs", "indie music 2026",
  "electronic music hits", "hip hop hits 2026", "pop music hits",
  "rock music best", "r&b hits", "latin music hits",
  "kpop hits 2026", "afrobeats trending", "country music hits",
]

function decodeHtmlEntities(text: string): string {
  if (typeof document === "undefined") return text
  const txt = document.createElement("textarea")
  txt.innerHTML = text
  return txt.value
}

export function MusicClient() {
  const {
    currentTrack, isPlaying, favorites,
    setCurrentTrack, setIsPlaying, setProgress, setDuration,
    toggleFavorite, setQueue,
  } = useMusicStore()

  const [query, setQuery] = React.useState("")
  const [tracks, setTracks] = React.useState<Track[]>([])
  const [loading, setLoading] = React.useState(false)
  const [loadingMore, setLoadingMore] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [viewMode, setViewMode] = React.useState<"list" | "grid">("list")
  const [nextPageToken, setNextPageToken] = React.useState<string | null>(null)
  const [activeQuery, setActiveQuery] = React.useState("")

  const scrollRef = React.useRef<HTMLDivElement>(null)
  const loadingMoreRef = React.useRef(false)

  React.useEffect(() => { loadingMoreRef.current = loadingMore }, [loadingMore])

  React.useEffect(() => {
    loadRandomTracks()
  }, [])

  React.useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    function onScroll() {
      if (loadingMoreRef.current || !nextPageToken) return
      if (el!.scrollTop + el!.clientHeight >= el!.scrollHeight - 300) {
        loadMore()
      }
    }
    el.addEventListener("scroll", onScroll, { passive: true })
    return () => el.removeEventListener("scroll", onScroll)
  }, [nextPageToken, activeQuery])

  async function loadRandomTracks() {
    setLoading(true); setError(null); setTracks([]); setQuery(""); setActiveQuery(""); setNextPageToken(null)
    try {
      const q = RANDOM_SEARCHES[Math.floor(Math.random() * RANDOM_SEARCHES.length)]
      const res = await fetch(`/api/music/youtube?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to load")
      setTracks(data.videos.map((v: any) => ({
        id: v.id, title: v.title, artist: v.channelTitle, thumbnail: v.thumbnail,
        source: "youtube" as const, videoId: v.id,
      })))
      setNextPageToken(data.nextPageToken || null)
      setActiveQuery(q)
    } catch (err: any) { setError(err.message) } finally { setLoading(false) }
  }

  async function loadMore() {
    if (!nextPageToken || loadingMore || !activeQuery) return
    setLoadingMore(true)
    try {
      const res = await fetch(`/api/music/youtube?q=${encodeURIComponent(activeQuery)}&pageToken=${nextPageToken}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to load more")
      const newTracks: Track[] = data.videos.map((v: any) => ({
        id: v.id, title: v.title, artist: v.channelTitle, thumbnail: v.thumbnail,
        source: "youtube" as const, videoId: v.id,
      }))
      setTracks(prev => [...prev, ...newTracks])
      setNextPageToken(data.nextPageToken || null)
    } catch (err: any) { setError(err.message) } finally { setLoadingMore(false) }
  }

  async function handleSearch(e?: React.FormEvent) {
    e?.preventDefault()
    if (!query.trim()) return
    setLoading(true); setError(null); setTracks([]); setNextPageToken(null)
    try {
      const res = await fetch(`/api/music/youtube?q=${encodeURIComponent(query.trim())}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Search failed")
      setTracks(data.videos.map((v: any) => ({
        id: v.id, title: v.title, artist: v.channelTitle, thumbnail: v.thumbnail,
        source: "youtube" as const, videoId: v.id,
      })))
      setNextPageToken(data.nextPageToken || null)
      setActiveQuery(query.trim())
    } catch (err: any) { setError(err.message) } finally { setLoading(false) }
  }

  function playTrackAtIndex(track: Track, index: number) {
    const remaining = tracks.slice(index + 1)
    setQueue(remaining)
    setCurrentTrack(track)
    setProgress(0)
    setDuration(0)
    setIsPlaying(true)
  }

  function fmt(s: number) { if (!s || isNaN(s)) return "0:00"; return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}` }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex shrink-0 flex-col gap-4 p-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Music className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground glow-text">Music</h1>
            <p className="text-sm text-muted-foreground">Listen with YouTube Music</p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <form onSubmit={handleSearch} className="flex flex-1 gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input placeholder="Search YouTube Music..." value={query} onChange={e => setQuery(e.target.value)} className="pl-9" />
            </div>
            <Button type="submit" disabled={loading || !query.trim()} className="glow-button">
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />} Search
            </Button>
          </form>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={loadRandomTracks} disabled={loading} className="gap-2 text-muted-foreground hover:text-foreground">
              <RefreshCw className={cn("size-4", loading && "animate-spin")} /> Refresh
            </Button>
            <div className="flex gap-1 rounded-lg bg-muted/50 p-1">
              <button onClick={() => setViewMode("list")} className={cn("rounded-md p-2 transition-all", viewMode === "list" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}><LayoutList className="size-4" /></button>
              <button onClick={() => setViewMode("grid")} className={cn("rounded-md p-2 transition-all", viewMode === "grid" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}><LayoutGrid className="size-4" /></button>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Results */}
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-6 pb-4">
        {error && <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>}

        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        )}

        {!loading && tracks.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Music className="mb-4 size-16 text-muted-foreground/20" />
            <h3 className="mb-1 text-lg font-medium text-foreground">No results</h3>
            <p className="text-sm text-muted-foreground">Try a different search</p>
          </div>
        )}

        {/* List View */}
        {!loading && viewMode === "list" && tracks.length > 0 && (
          <div className="space-y-1">
            {tracks.map((track, i) => (
              <div key={`${track.id}-${i}`} className={cn("group flex w-full items-center gap-[10px] rounded-xl p-3 text-left transition-all hover:bg-muted/50", currentTrack?.id === track.id && "bg-primary/5 ring-1 ring-primary/20")}>
                <button onClick={() => playTrackAtIndex(track, i)} className="flex flex-1 items-center gap-4 min-w-0 text-left">
                  <span className="w-6 text-center text-sm text-muted-foreground">{i + 1}</span>
                  <img src={track.thumbnail} alt={track.title} className="size-12 rounded-lg object-cover shrink-0" />
                  <div className="min-w-0 flex-1 text-left">
                    <p className="truncate text-sm font-medium text-foreground text-left">{decodeHtmlEntities(track.title)}</p>
                    <p className="truncate text-sm text-muted-foreground text-left">{decodeHtmlEntities(track.artist)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {currentTrack?.id === track.id && isPlaying ? <Pause className="size-5 text-primary" /> : <Play className="size-5 text-muted-foreground group-hover:text-primary" />}
                  </div>
                </button>
                <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" onClick={() => toggleFavorite(track)} className="size-8" title="Like">
                    <Heart className={cn("size-4", favorites.some(t => t.id === track.id) ? "fill-red-500 text-red-500" : "text-muted-foreground hover:text-foreground")} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Grid View */}
        {!loading && viewMode === "grid" && tracks.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {tracks.map((track, i) => (
              <div key={`${track.id}-${i}`} className={cn("group flex flex-col items-start gap-2 rounded-xl p-3 text-left transition-all hover:bg-muted/50", currentTrack?.id === track.id && "bg-primary/5 ring-1 ring-primary/20")}>
                <button onClick={() => playTrackAtIndex(track, i)} className="w-full">
                  <div className="relative size-full aspect-square">
                    <img src={track.thumbnail} alt={track.title} className="size-full rounded-lg object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/0 opacity-0 group-hover:bg-black/30 group-hover:opacity-100 transition-all">
                      {currentTrack?.id === track.id && isPlaying ? (
                        <Pause className="size-8 text-white drop-shadow-lg" />
                      ) : (
                        <Play className="size-8 text-white drop-shadow-lg" />
                      )}
                    </div>
                  </div>
                  <p className="truncate w-full text-xs font-medium text-foreground mt-2 text-left">{decodeHtmlEntities(track.title)}</p>
                  <p className="truncate w-full text-xs text-muted-foreground text-left">{decodeHtmlEntities(track.artist)}</p>
                </button>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" onClick={() => toggleFavorite(track)} className="size-7" title="Like">
                    <Heart className={cn("size-3.5", favorites.some(t => t.id === track.id) ? "fill-red-500 text-red-500" : "text-muted-foreground")} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Infinite scroll loader */}
        {loadingMore && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        )}

        {!loading && tracks.length > 0 && !nextPageToken && (
          <div className="py-8 text-center text-sm text-muted-foreground">No more results</div>
        )}
      </div>
    </div>
  )
}
