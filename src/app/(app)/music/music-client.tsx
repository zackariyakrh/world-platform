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
  PlayCircle,
  LayoutList,
  LayoutGrid,
} from "lucide-react"

interface Track {
  id: string
  title: string
  artist: string
  thumbnail: string
  preview?: string
  duration?: number
  source: "deezer" | "youtube"
  videoId?: string
  link?: string
}

declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: () => void
  }
}

export function MusicClient() {
  const [source, setSource] = React.useState<"deezer" | "youtube">("deezer")
  const [query, setQuery] = React.useState("")
  const [tracks, setTracks] = React.useState<Track[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [currentTrack, setCurrentTrack] = React.useState<Track | null>(null)
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const [duration, setDuration] = React.useState(0)
  const [volume, setVolume] = React.useState(80)
  const [muted, setMuted] = React.useState(false)
  const [queue, setQueue] = React.useState<Track[]>([])
  const [viewMode, setViewMode] = React.useState<"list" | "grid">("list")

  const audioRef = React.useRef<HTMLAudioElement | null>(null)
  const ytPlayerRef = React.useRef<any>(null)
  const ytContainerRef = React.useRef<HTMLDivElement>(null)
  const progressInterval = React.useRef<ReturnType<typeof setInterval> | null>(null)
  const ytReadyRef = React.useRef(false)
  const queueRef = React.useRef<Track[]>([])
  const currentTrackRef = React.useRef<Track | null>(null)

  React.useEffect(() => { queueRef.current = queue }, [queue])
  React.useEffect(() => { currentTrackRef.current = currentTrack }, [currentTrack])

  React.useEffect(() => {
    if (window.YT?.Player) { ytReadyRef.current = true; return }
    const tag = document.createElement("script")
    tag.src = "https://www.youtube.com/iframe_api"
    document.head.appendChild(tag)
    window.onYouTubeIframeAPIReady = () => { ytReadyRef.current = true }
  }, [])

  React.useEffect(() => () => stopAll(), [])

  // Load default tracks when source changes
  React.useEffect(() => {
    loadDefaultTracks(source)
  }, [source])

  async function loadDefaultTracks(src: "deezer" | "youtube") {
    setLoading(true); setError(null); setTracks([]); setQuery("")
    try {
      if (src === "deezer") {
        const res = await fetch("/api/music/deezer")
        if (!res.ok) throw new Error("Failed to load charts")
        const data = await res.json()
        setTracks(data.data.map((t: any) => ({
          id: String(t.id), title: t.title_short || t.title, artist: t.artist.name,
          thumbnail: t.album.cover_medium || t.album.cover, preview: t.preview,
          duration: t.duration, source: "deezer" as const, link: t.link,
        })))
      } else {
        const searches = ["popular music 2026", "trending songs", "hit music", "top hits", "best music videos"]
        const q = searches[Math.floor(Math.random() * searches.length)]
        const res = await fetch(`/api/music/youtube?q=${encodeURIComponent(q)}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Failed to load")
        setTracks(data.videos.map((v: any) => ({
          id: v.id, title: v.title, artist: v.channelTitle, thumbnail: v.thumbnail,
          source: "youtube" as const, videoId: v.id,
        })))
      }
    } catch (err: any) { setError(err.message) } finally { setLoading(false) }
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
    setLoading(true); setError(null); setTracks([])
    try {
      if (source === "deezer") {
        const res = await fetch(`/api/music/deezer?q=${encodeURIComponent(query.trim())}`)
        if (!res.ok) throw new Error("Search failed")
        const data = await res.json()
        setTracks(data.data.map((t: any) => ({
          id: String(t.id), title: t.title_short || t.title, artist: t.artist.name,
          thumbnail: t.album.cover_medium || t.album.cover, preview: t.preview,
          duration: t.duration, source: "deezer" as const, link: t.link,
        })))
      } else {
        const res = await fetch(`/api/music/youtube?q=${encodeURIComponent(query.trim())}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Search failed")
        setTracks(data.videos.map((v: any) => ({
          id: v.id, title: v.title, artist: v.channelTitle, thumbnail: v.thumbnail,
          source: "youtube" as const, videoId: v.id,
        })))
      }
    } catch (err: any) { setError(err.message) } finally { setLoading(false) }
  }

  function playTrack(track: Track) {
    if (currentTrack?.id === track.id) {
      if (isPlaying) { pauseTrack() } else { resumeTrack() }
      return
    }
    stopAll()
    setCurrentTrack(track); setProgress(0); setDuration(0); setIsPlaying(false)

    if (track.source === "deezer" && track.preview) {
      const audio = new Audio(track.preview)
      audio.volume = muted ? 0 : volume / 100
      audioRef.current = audio
      audio.addEventListener("loadedmetadata", () => { setDuration(audio.duration); setIsPlaying(true); startProgress() })
      audio.play().then(() => { setIsPlaying(true); startProgress() }).catch(() => setIsPlaying(false))
      audio.addEventListener("ended", () => playNextInQueue())
    } else if (track.source === "youtube" && track.videoId) {
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
            <p className="text-sm text-muted-foreground">Listen with Deezer or YouTube Music</p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex gap-1 rounded-xl bg-muted/50 p-1">
            <button onClick={() => setSource("deezer")} className={cn("flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all", source === "deezer" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              <Music className="size-4" /> Deezer
            </button>
            <button onClick={() => setSource("youtube")} className={cn("flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all", source === "youtube" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              <PlayCircle className="size-4" /> YouTube
            </button>
          </div>
          <form onSubmit={handleSearch} className="flex flex-1 gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input placeholder={source === "deezer" ? "Search songs, artists..." : "Search YouTube Music..."} value={query} onChange={e => setQuery(e.target.value)} className="pl-9" />
            </div>
            <Button type="submit" disabled={loading || !query.trim()} className="glow-button">
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />} Search
            </Button>
          </form>
          <div className="flex gap-1 rounded-lg bg-muted/50 p-1">
            <button onClick={() => setViewMode("list")} className={cn("rounded-md p-2 transition-all", viewMode === "list" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}><LayoutList className="size-4" /></button>
            <button onClick={() => setViewMode("grid")} className={cn("rounded-md p-2 transition-all", viewMode === "grid" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}><LayoutGrid className="size-4" /></button>
          </div>
        </div>
        {source === "deezer" && <p className="text-xs text-muted-foreground">Deezer free API provides 30-second previews. Full playback requires Deezer Premium.</p>}
      </div>

      {/* Scrollable Results */}
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4">
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
              <button key={`${track.source}-${track.id}`} onClick={() => playTrack(track)} className={cn("group flex w-full items-center gap-4 rounded-xl p-3 text-left transition-all hover:bg-muted/50", currentTrack?.id === track.id && "bg-primary/5 ring-1 ring-primary/20")}>
                <span className="w-6 text-center text-sm text-muted-foreground">{i + 1}</span>
                <img src={track.thumbnail} alt={track.title} className="size-12 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{track.title}</p>
                  <p className="truncate text-sm text-muted-foreground">{track.artist}</p>
                </div>
                {track.duration && <span className="text-xs text-muted-foreground">{fmt(track.duration)}</span>}
                <div className="flex items-center gap-1">
                  {currentTrack?.id === track.id && isPlaying ? <Pause className="size-5 text-primary" /> : <Play className="size-5 text-muted-foreground group-hover:text-primary" />}
                </div>
                {track.link && <a href={track.link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"><ExternalLink className="size-4" /></a>}
              </button>
            ))}
          </div>
        )}

        {/* Grid View */}
        {!loading && viewMode === "grid" && tracks.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {tracks.map((track) => (
              <button key={`${track.source}-${track.id}`} onClick={() => playTrack(track)} className={cn("group flex flex-col items-center gap-2 rounded-xl p-3 text-center transition-all hover:bg-muted/50", currentTrack?.id === track.id && "bg-primary/5 ring-1 ring-primary/20")}>
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

        {queue.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">Queue ({queue.length})</h3>
            <div className="space-y-1">
              {queue.map((track, i) => (
                <div key={`q-${track.source}-${track.id}-${i}`} className="flex items-center gap-3 rounded-lg p-2 text-sm">
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
        <div className="sticky bottom-0 -mx-6 px-6 pb-6 pt-4" style={{ background: "linear-gradient(135deg, oklch(0.22 0.03 300 / 0.97), oklch(0.18 0.04 320 / 0.97), oklch(0.15 0.03 280 / 0.97))", boxShadow: "0 -8px 32px oklch(0.4 0.15 var(--hue, 280) / 0.2), 0 -2px 12px oklch(0.5 0.2 var(--hue, 280) / 0.15), inset 0 1px 0 oklch(1 0 0 / 0.05)" }}>
          <div className="flex items-center gap-3 sm:gap-4">
            <img src={currentTrack.thumbnail} alt={currentTrack.title} className="size-12 rounded-lg object-cover shrink-0 ring-2 ring-white/10" />
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-white">{currentTrack.title}</p><p className="truncate text-xs text-white/60">{currentTrack.artist}</p></div>
            <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
              <Button variant="ghost" size="icon" onClick={() => { if (currentTrack) { setProgress(0); if (audioRef.current) audioRef.current.currentTime = 0; if (ytPlayerRef.current) try { ytPlayerRef.current.seekTo(0, true) } catch {} } }} className="text-white/70 hover:text-white hover:bg-white/10"><SkipBack className="size-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => { if (isPlaying) pauseTrack(); else resumeTrack(); }} className="size-10 text-white hover:text-white hover:bg-white/10">{isPlaying ? <Pause className="size-5" /> : <Play className="size-5" />}</Button>
              <Button variant="ghost" size="icon" onClick={() => playNextInQueue()} className="text-white/70 hover:text-white hover:bg-white/10"><SkipForward className="size-4" /></Button>
            </div>
            <div className="hidden sm:flex items-center gap-2 flex-1 max-w-md">
              <span className="w-10 text-right text-xs text-white/50 tabular-nums">{fmt(progress)}</span>
              <div onClick={handleSeek} className="group relative h-1.5 flex-1 cursor-pointer rounded-full bg-white/10">
                <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 transition-[width] duration-100" style={{ width: duration ? `${(progress / duration) * 100}%` : "0%", boxShadow: "0 0 8px oklch(0.7 0.2 320 / 0.5)" }} />
                <div className="absolute top-1/2 size-3 -translate-y-1/2 rounded-full bg-white opacity-0 shadow-[0_0_8px_rgba(255,255,255,0.5)] group-hover:opacity-100 transition-opacity" style={{ left: duration ? `calc(${(progress / duration) * 100}% - 6px)` : "-6px" }} />
              </div>
              <span className="w-10 text-xs text-white/50 tabular-nums">-{fmt(duration > progress ? duration - progress : 0)}</span>
            </div>
            <div className="hidden sm:flex items-center gap-1 shrink-0">
              <Button variant="ghost" size="icon" onClick={toggleMute} className="text-white/70 hover:text-white hover:bg-white/10">{muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}</Button>
              <div onClick={handleVolumeChange} className="relative h-1 w-20 cursor-pointer rounded-full bg-white/10">
                <div className="absolute inset-y-0 left-0 rounded-full bg-white/70" style={{ width: `${muted ? 0 : volume}%` }} />
              </div>
            </div>
            {currentTrack.link && <a href={currentTrack.link} target="_blank" rel="noopener noreferrer" className="rounded-lg p-2 text-white/50 hover:text-white shrink-0"><ExternalLink className="size-4" /></a>}
          </div>
        </div>
      )}
    </div>
  )
}
