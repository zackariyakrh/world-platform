"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Music,
  Search,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Loader2,
  ExternalLink,
  Volume2,
  VolumeX,
  LayoutList,
  LayoutGrid,
  RefreshCw,
  Repeat,
} from "lucide-react"

interface Track {
  id: string
  title: string
  artist: string
  thumbnail: string
  duration?: number
  source: "youtube"
  videoId?: string
  link?: string
}

declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: () => void
  }
}

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

export function MusicClient() {
  const [query, setQuery] = React.useState("")
  const [tracks, setTracks] = React.useState<Track[]>([])
  const [loading, setLoading] = React.useState(false)
  const [loadingMore, setLoadingMore] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [currentTrack, setCurrentTrack] = React.useState<Track | null>(null)
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const [duration, setDuration] = React.useState(0)
  const [volume, setVolume] = React.useState(80)
  const [muted, setMuted] = React.useState(false)
  const [queue, setQueue] = React.useState<Track[]>([])
  const [viewMode, setViewMode] = React.useState<"list" | "grid">("list")
  const [nextPageToken, setNextPageToken] = React.useState<string | null>(null)
  const [activeQuery, setActiveQuery] = React.useState("")
  const [repeatOne, setRepeatOne] = React.useState(false)

  const audioRef = React.useRef<HTMLAudioElement | null>(null)
  const ytPlayerRef = React.useRef<any>(null)
  const ytContainerRef = React.useRef<HTMLDivElement>(null)
  const progressInterval = React.useRef<ReturnType<typeof setInterval> | null>(null)
  const ytReadyRef = React.useRef(false)
  const queueRef = React.useRef<Track[]>([])
  const currentTrackRef = React.useRef<Track | null>(null)
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const loadingMoreRef = React.useRef(false)

  React.useEffect(() => { queueRef.current = queue }, [queue])
  React.useEffect(() => { currentTrackRef.current = currentTrack }, [currentTrack])
  React.useEffect(() => { loadingMoreRef.current = loadingMore }, [loadingMore])

  React.useEffect(() => {
    if (window.YT?.Player) { ytReadyRef.current = true; return }
    const tag = document.createElement("script")
    tag.src = "https://www.youtube.com/iframe_api"
    document.head.appendChild(tag)
    window.onYouTubeIframeAPIReady = () => { ytReadyRef.current = true }
  }, [])

  React.useEffect(() => () => stopAll(), [])

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

  function stopAll() {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; audioRef.current = null }
    if (ytPlayerRef.current) { try { ytPlayerRef.current.destroy() } catch {} ytPlayerRef.current = null }
    if (progressInterval.current) clearInterval(progressInterval.current)
  }

  function startProgress() {
    if (progressInterval.current) clearInterval(progressInterval.current)
    progressInterval.current = setInterval(() => {
      if (audioRef.current && !audioRef.current.paused) setProgress(audioRef.current.currentTime)
      if (ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === "function") {
        const t = ytPlayerRef.current.getCurrentTime()
        if (typeof t === "number" && !isNaN(t)) setProgress(t)
      }
    }, 250)
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

  function playTrack(track: Track) {
    if (currentTrack?.id === track.id) {
      if (isPlaying) { pauseTrack() } else { resumeTrack() }
      return
    }
    stopAll()
    setCurrentTrack(track); setProgress(0); setDuration(0); setIsPlaying(false)

    if (track.videoId) {
      createYouTubePlayer(track.videoId)
    }
  }

  function createYouTubePlayer(videoId: string) {
    const doCreate = () => {
      if (!ytContainerRef.current) return
      if (ytPlayerRef.current) { try { ytPlayerRef.current.destroy() } catch {} ytPlayerRef.current = null }
      const container = ytContainerRef.current; container.innerHTML = ""
      const div = document.createElement("div"); div.id = "yt-player"; container.appendChild(div)

      const player = new window.YT.Player(div, {
        videoId, width: 1, height: 1,
        playerVars: { autoplay: 1, controls: 0, disablekb: 1, fs: 0, iv_load_policy: 3, modestbranding: 1, rel: 0, showinfo: 0 },
        events: {
          onReady: (e: any) => { ytPlayerRef.current = e.target; e.target.setVolume(muted ? 0 : volume); setDuration(e.target.getDuration()); setIsPlaying(true); startProgress() },
          onStateChange: (e: any) => {
            if (e.data === window.YT.PlayerState.PLAYING) { setIsPlaying(true); startProgress() }
            else if (e.data === window.YT.PlayerState.PAUSED) { setIsPlaying(false); if (progressInterval.current) clearInterval(progressInterval.current) }
            else if (e.data === window.YT.PlayerState.ENDED) { setIsPlaying(false); setProgress(0); if (progressInterval.current) clearInterval(progressInterval.current); playNextInQueue() }
          },
          onError: () => setIsPlaying(false),
        },
      })
    }
    if (ytReadyRef.current && window.YT?.Player) { doCreate() }
    else { const c = setInterval(() => { if (ytReadyRef.current && window.YT?.Player) { clearInterval(c); doCreate() } }, 100); setTimeout(() => clearInterval(c), 10000) }
  }

  function pauseTrack() {
    setIsPlaying(false)
    if (audioRef.current) audioRef.current.pause()
    if (ytPlayerRef.current) try { ytPlayerRef.current.pauseVideo() } catch {}
    if (progressInterval.current) clearInterval(progressInterval.current)
  }

  function resumeTrack() {
    setIsPlaying(true)
    if (audioRef.current) audioRef.current.play().catch(() => setIsPlaying(false))
    if (ytPlayerRef.current) try { ytPlayerRef.current.playVideo() } catch {}
    startProgress()
  }

  function playNextInQueue() {
    if (repeatOne && currentTrackRef.current) {
      const t = currentTrackRef.current
      setTimeout(() => playTrack(t), 0)
      return
    }
    const q = queueRef.current
    if (q.length > 0) { const next = q[0]; setQueue(p => p.slice(1)); setTimeout(() => playTrack(next), 0) }
    else { setIsPlaying(false); setProgress(0); if (progressInterval.current) clearInterval(progressInterval.current) }
  }

  function handleSeek(e: React.MouseEvent<HTMLDivElement>) {
    if (!duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const newTime = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) * duration
    if (audioRef.current) audioRef.current.currentTime = newTime
    if (ytPlayerRef.current) try { ytPlayerRef.current.seekTo(newTime, true) } catch {}
    setProgress(newTime)
  }

  function handleVolumeChange(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = Math.round(Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)))
    setVolume(pct); setMuted(false)
    if (audioRef.current) audioRef.current.volume = pct / 100
    if (ytPlayerRef.current) try { ytPlayerRef.current.setVolume(pct) } catch {}
  }

  function toggleMute() {
    const n = !muted; setMuted(n)
    if (audioRef.current) audioRef.current.volume = n ? 0 : volume / 100
    if (ytPlayerRef.current) try { n ? ytPlayerRef.current.mute() : ytPlayerRef.current.unMute() } catch {}
  }

  function fmt(s: number) { if (!s || isNaN(s)) return "0:00"; return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}` }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div ref={ytContainerRef} className="absolute w-0 h-0 overflow-hidden opacity-0" aria-hidden="true" />

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
              <button key={`${track.id}-${i}`} onClick={() => playTrack(track)} className={cn("group flex w-full items-center gap-4 rounded-xl p-3 text-left transition-all hover:bg-muted/50", currentTrack?.id === track.id && "bg-primary/5 ring-1 ring-primary/20")}>
                <span className="w-6 text-center text-sm text-muted-foreground">{i + 1}</span>
                <img src={track.thumbnail} alt={track.title} className="size-12 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{track.title}</p>
                  <p className="truncate text-sm text-muted-foreground">{track.artist}</p>
                </div>
                <div className="flex items-center gap-1">
                  {currentTrack?.id === track.id && isPlaying ? <Pause className="size-5 text-primary" /> : <Play className="size-5 text-muted-foreground group-hover:text-primary" />}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Grid View */}
        {!loading && viewMode === "grid" && tracks.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {tracks.map((track, i) => (
              <button key={`${track.id}-${i}`} onClick={() => playTrack(track)} className={cn("group flex flex-col items-center gap-2 rounded-xl p-3 text-center transition-all hover:bg-muted/50", currentTrack?.id === track.id && "bg-primary/5 ring-1 ring-primary/20")}>
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
                <p className="truncate w-full text-xs font-medium text-foreground">{track.title}</p>
                <p className="truncate w-full text-xs text-muted-foreground">{track.artist}</p>
              </button>
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

        {queue.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">Queue ({queue.length})</h3>
            <div className="space-y-1">
              {queue.map((track, i) => (
                <div key={`q-${track.id}-${i}`} className="flex items-center gap-3 rounded-lg p-2 text-sm">
                  <span className="w-4 text-center text-xs text-muted-foreground">{i + 1}</span>
                  <img src={track.thumbnail} alt="" className="size-8 rounded object-cover" />
                  <div className="min-w-0 flex-1"><p className="truncate text-foreground">{track.title}</p><p className="truncate text-xs text-muted-foreground">{track.artist}</p></div>
                  <button onClick={() => setQueue(p => p.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive">&times;</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Player Bar — only visible when a track is playing */}
      {currentTrack && (
        <>
          <style>{`
            @keyframes playerGlow {
              0%, 100% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
            }
            @keyframes progressGlow {
              0%, 100% { box-shadow: 0 0 10px oklch(0.6 0.25 310 / 0.5), 0 0 4px oklch(0.7 0.3 300 / 0.3); }
              50% { box-shadow: 0 0 18px oklch(0.6 0.25 310 / 0.7), 0 0 8px oklch(0.7 0.3 300 / 0.5); }
            }
            @keyframes thumbPulse {
              0%, 100% { box-shadow: 0 0 8px rgba(255,255,255,0.6); }
              50% { box-shadow: 0 0 16px rgba(255,255,255,0.9); }
            }
            .player-glow-bg {
              background: linear-gradient(135deg, oklch(0.25 0.15 300), oklch(0.22 0.2 320), oklch(0.20 0.18 340), oklch(0.18 0.15 280), oklch(0.25 0.15 300));
              background-size: 300% 300%;
              animation: playerGlow 8s ease infinite;
            }
            .progress-glow {
              background: linear-gradient(90deg, oklch(0.7 0.25 300), oklch(0.75 0.22 330), oklch(0.8 0.2 360), oklch(0.75 0.22 330), oklch(0.7 0.25 300));
              background-size: 200% 100%;
              animation: progressGlow 2s ease-in-out infinite;
            }
            .progress-fill-animated {
              background: linear-gradient(90deg, oklch(0.7 0.25 300), oklch(0.75 0.22 330), oklch(0.8 0.2 30), oklch(0.75 0.22 330), oklch(0.7 0.25 300));
              background-size: 200% 100%;
              animation: playerGlow 4s ease infinite;
            }
            .thumb-glow { animation: thumbPulse 3s ease-in-out infinite; }
          `}</style>
          <div className="shrink-0 border-t player-glow-bg" style={{ boxShadow: "0 -6px 32px oklch(0.5 0.25 300 / 0.35), 0 -2px 12px oklch(0.6 0.3 320 / 0.25), inset 0 1px 0 oklch(1 0 0 / 0.08)", borderTop: "1px solid oklch(0.6 0.2 300 / 0.15)" }}>
            {/* Progress bar — full width at top */}
            <div onClick={handleSeek} className="group relative h-1.5 cursor-pointer bg-white/10">
              <div className="absolute inset-y-0 left-0 transition-[width] duration-100 progress-fill-animated" style={{ width: duration ? `${(progress / duration) * 100}%` : "0%" }} />
              <div className="absolute inset-y-0 left-0 rounded-full progress-glow opacity-50" style={{ width: duration ? `${(progress / duration) * 100}%` : "0%" }} />
              <div className="absolute top-1/2 size-3.5 -translate-y-1/2 rounded-full bg-white opacity-0 group-hover:opacity-100 transition-opacity" style={{ left: duration ? `calc(${(progress / duration) * 100}% - 7px)` : "-7px", boxShadow: "0 0 10px rgba(255,255,255,0.7)" }} />
            </div>
            <div className="flex items-center gap-3 px-6 py-5 sm:gap-4">
              <img src={currentTrack.thumbnail} alt={currentTrack.title} className="size-16 rounded-xl object-cover shrink-0 ring-2 ring-white/15 thumb-glow" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{currentTrack.title}</p>
                <p className="truncate text-xs text-white/50">{currentTrack.artist}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Button variant="ghost" size="icon" onClick={() => { if (currentTrack) { setProgress(0); if (audioRef.current) audioRef.current.currentTime = 0; if (ytPlayerRef.current) try { ytPlayerRef.current.seekTo(0, true) } catch {} } }} className="size-10 text-white/60 hover:text-white hover:bg-white/10"><SkipBack className="size-5" /></Button>
                <Button variant="ghost" size="icon" onClick={() => { if (isPlaying) pauseTrack(); else resumeTrack(); }} className="size-12 text-white hover:text-white hover:bg-white/15 shadow-[0_0_24px_oklch(0.7 0.3 300 / 0.5)] transition-shadow hover:shadow-[0_0_32px_oklch(0.7 0.3 300 / 0.7)]">{isPlaying ? <Pause className="size-6" /> : <Play className="size-6 ml-0.5" />}</Button>
                <Button variant="ghost" size="icon" onClick={() => playNextInQueue()} className="size-10 text-white/60 hover:text-white hover:bg-white/10"><SkipForward className="size-5" /></Button>
              </div>
              <div className="hidden md:flex items-center gap-2 flex-1 max-w-md">
                <span className="w-10 text-right text-xs text-white/40 tabular-nums">{fmt(progress)}</span>
                <div onClick={handleSeek} className="group relative h-1.5 flex-1 cursor-pointer rounded-full bg-white/10">
                  <div className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-100 progress-fill-animated" style={{ width: duration ? `${(progress / duration) * 100}%` : "0%" }} />
                  <div className="absolute inset-y-0 left-0 rounded-full progress-glow opacity-40" style={{ width: duration ? `${(progress / duration) * 100}%` : "0%" }} />
                  <div className="absolute top-1/2 size-3 -translate-y-1/2 rounded-full bg-white opacity-0 shadow-[0_0_8px_rgba(255,255,255,0.6)] group-hover:opacity-100 transition-opacity" style={{ left: duration ? `calc(${(progress / duration) * 100}% - 6px)` : "-6px" }} />
                </div>
                <span className="w-10 text-xs text-white/40 tabular-nums">-{fmt(duration > progress ? duration - progress : 0)}</span>
              </div>
              <div className="hidden sm:flex items-center gap-2.5 shrink-0">
                <Button variant="ghost" size="icon" onClick={() => setRepeatOne(r => !r)} className={cn("size-9 transition-colors", repeatOne ? "text-primary shadow-[0_0_12px_oklch(0.7 0.3 300 / 0.5)]" : "text-white/50 hover:text-white hover:bg-white/10")}><Repeat className="size-4" /></Button>
                <Button variant="ghost" size="icon" onClick={toggleMute} className="size-9 text-white/50 hover:text-white hover:bg-white/10">{muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}</Button>
                <div onClick={handleVolumeChange} className="relative h-1.5 w-24 cursor-pointer rounded-full bg-white/10">
                  <div className="absolute inset-y-0 left-0 rounded-full bg-white/70 transition-[width] duration-75" style={{ width: `${muted ? 0 : volume}%` }} />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
