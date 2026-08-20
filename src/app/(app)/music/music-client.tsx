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
  ListMusic,
  PlayCircle,
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

  const audioRef = React.useRef<HTMLAudioElement | null>(null)
  const youtubeRef = React.useRef<HTMLIFrameElement | null>(null)
  const progressInterval = React.useRef<ReturnType<typeof setInterval> | null>(null)

  React.useEffect(() => {
    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current)
    }
  }, [])

  async function handleSearch(e?: React.FormEvent) {
    e?.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setError(null)
    setTracks([])

    try {
      if (source === "deezer") {
        const res = await fetch(`/api/music/deezer?q=${encodeURIComponent(query.trim())}`)
        if (!res.ok) throw new Error("Search failed")
        const data = await res.json()
        setTracks(
          data.data.map((t: any) => ({
            id: String(t.id),
            title: t.title_short || t.title,
            artist: t.artist.name,
            thumbnail: t.album.cover_medium || t.album.cover,
            preview: t.preview,
            duration: t.duration,
            source: "deezer" as const,
            link: t.link,
          }))
        )
      } else {
        const res = await fetch(`/api/music/youtube?q=${encodeURIComponent(query.trim())}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Search failed")
        setTracks(
          data.videos.map((v: any) => ({
            id: v.id,
            title: v.title,
            artist: v.channelTitle,
            thumbnail: v.thumbnail,
            source: "youtube" as const,
            videoId: v.id,
          }))
        )
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function playTrack(track: Track) {
    if (currentTrack?.id === track.id && isPlaying) {
      pauseTrack()
      return
    }

    stopCurrentPlayback()
    setCurrentTrack(track)
    setIsPlaying(true)
    setProgress(0)

    if (track.source === "deezer" && track.preview) {
      const audio = new Audio(track.preview)
      audio.volume = muted ? 0 : volume / 100
      audioRef.current = audio

      audio.addEventListener("loadedmetadata", () => {
        setDuration(audio.duration)
      })
      audio.addEventListener("ended", () => {
        setIsPlaying(false)
        setProgress(0)
      })
      audio.play().catch(() => setIsPlaying(false))

      if (progressInterval.current) clearInterval(progressInterval.current)
      progressInterval.current = setInterval(() => {
        if (audioRef.current) {
          setProgress(audioRef.current.currentTime)
        }
      }, 250)
    }
  }

  function pauseTrack() {
    setIsPlaying(false)
    if (audioRef.current) audioRef.current.pause()
    if (progressInterval.current) clearInterval(progressInterval.current)
  }

  function stopCurrentPlayback() {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ""
      audioRef.current = null
    }
    if (progressInterval.current) clearInterval(progressInterval.current)
  }

  function handleSeek(e: React.MouseEvent<HTMLDivElement>) {
    if (!audioRef.current || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    const newTime = pct * duration
    audioRef.current.currentTime = newTime
    setProgress(newTime)
  }

  function handleVolumeChange(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = Math.round(((e.clientX - rect.left) / rect.width) * 100)
    setVolume(pct)
    setMuted(false)
    if (audioRef.current) audioRef.current.volume = pct / 100
  }

  function toggleMute() {
    setMuted(!muted)
    if (audioRef.current) audioRef.current.volume = muted ? volume / 100 : 0
  }

  function formatTime(s: number) {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, "0")}`
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <div className="flex flex-col gap-4 p-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Music className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground glow-text">Music</h1>
            <p className="text-sm text-muted-foreground">Listen with Deezer or YouTube Music</p>
          </div>
        </div>

        {/* Source tabs + Search */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex gap-1 rounded-xl bg-muted/50 p-1">
            <button
              onClick={() => { setSource("deezer"); setTracks([]); setError(null) }}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
                source === "deezer"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Music className="size-4" />
              Deezer
            </button>
            <button
              onClick={() => { setSource("youtube"); setTracks([]); setError(null) }}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
                source === "youtube"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <PlayCircle className="size-4" />
              YouTube
            </button>
          </div>

          <form onSubmit={handleSearch} className="flex flex-1 gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder={source === "deezer" ? "Search songs, artists..." : "Search YouTube Music..."}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button type="submit" disabled={loading || !query.trim()} className="glow-button">
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
              Search
            </Button>
          </form>
        </div>

        {source === "youtube" && (
          <p className="text-xs text-muted-foreground">
            Requires YOUTUBE_API_KEY environment variable. Get a free key at{" "}
            <a href="https://console.cloud.google.com/apis/credentials" target="_blank" className="text-primary underline">
              Google Cloud Console
            </a>
          </p>
        )}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-6 pb-32">
        {error && (
          <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {tracks.length === 0 && !loading && !error && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Music className="mb-4 size-16 text-muted-foreground/20" />
            <h3 className="mb-1 text-lg font-medium text-foreground">Start listening</h3>
            <p className="text-sm text-muted-foreground">
              Search for a song or artist to get started
            </p>
          </div>
        )}

        <div className="space-y-1">
          {tracks.map((track, i) => (
            <button
              key={`${track.source}-${track.id}`}
              onClick={() => playTrack(track)}
              className={cn(
                "flex w-full items-center gap-4 rounded-xl p-3 text-left transition-all hover:bg-muted/50",
                currentTrack?.id === track.id && "bg-primary/5 ring-1 ring-primary/20"
              )}
            >
              <span className="w-6 text-center text-sm text-muted-foreground">{i + 1}</span>
              <img
                src={track.thumbnail}
                alt={track.title}
                className="size-12 rounded-lg object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{track.title}</p>
                <p className="truncate text-sm text-muted-foreground">{track.artist}</p>
              </div>
              {track.duration && (
                <span className="text-xs text-muted-foreground">{formatTime(track.duration)}</span>
              )}
              {track.source === "deezer" && track.preview && (
                <div className="flex items-center gap-1">
                  {currentTrack?.id === track.id && isPlaying ? (
                    <Pause className="size-5 text-primary" />
                  ) : (
                    <Play className="size-5 text-muted-foreground group-hover:text-primary" />
                  )}
                </div>
              )}
              {track.source === "youtube" && (
                <div className="flex items-center gap-1">
                  <Play className="size-5 text-muted-foreground" />
                </div>
              )}
              {track.link && (
                <a
                  href={track.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <ExternalLink className="size-4" />
                </a>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Now Playing Bar */}
      {currentTrack && (
        <div className="fixed bottom-16 left-0 right-0 z-40 border-t border-border/50 bg-background/95 backdrop-blur-xl md:bottom-0 md:left-64">
          <div className="flex items-center gap-4 px-4 py-3">
            <img
              src={currentTrack.thumbnail}
              alt={currentTrack.title}
              className="size-12 rounded-lg object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{currentTrack.title}</p>
              <p className="truncate text-xs text-muted-foreground">{currentTrack.artist}</p>
            </div>

            {/* Progress bar */}
            <div className="hidden sm:flex flex-1 items-center gap-2 max-w-md">
              <span className="w-10 text-right text-xs text-muted-foreground">{formatTime(progress)}</span>
              <div
                onClick={handleSeek}
                className="group relative h-1.5 flex-1 cursor-pointer rounded-full bg-muted"
              >
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all"
                  style={{ width: duration ? `${(progress / duration) * 100}%` : "0%" }}
                />
                <div
                  className="absolute top-1/2 size-3 -translate-y-1/2 rounded-full bg-primary opacity-0 shadow-[0_0_6px_oklch(from_var(--primary)_l_c_h_/_0.4)] group-hover:opacity-100 transition-opacity"
                  style={{ left: duration ? `calc(${(progress / duration) * 100}% - 6px)` : "0%" }}
                />
              </div>
              <span className="w-10 text-xs text-muted-foreground">{formatTime(duration)}</span>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1">
              {currentTrack.source === "deezer" ? (
                <>
                  <Button variant="ghost" size="icon" onClick={() => {
                    if (isPlaying) pauseTrack()
                    else if (currentTrack) playTrack(currentTrack)
                  }}>
                    {isPlaying ? <Pause className="size-5" /> : <Play className="size-5" />}
                  </Button>
                </>
              ) : (
                <Button variant="ghost" size="icon" onClick={() => {
                  if (youtubeRef.current) {
                    youtubeRef.current.contentWindow?.postMessage(
                      isPlaying ? '{"event":"command","func":"pauseVideo"}' : '{"event":"command","func":"playVideo"}',
                      "*"
                    )
                    setIsPlaying(!isPlaying)
                  }
                }}>
                  {isPlaying ? <Pause className="size-5" /> : <Play className="size-5" />}
                </Button>
              )}

              <Button variant="ghost" size="icon" onClick={toggleMute}>
                {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
              </Button>

              <div
                onClick={handleVolumeChange}
                className="hidden sm:block relative h-1 w-20 cursor-pointer rounded-full bg-muted"
              >
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-primary"
                  style={{ width: `${muted ? 0 : volume}%` }}
                />
              </div>

              {currentTrack.link && (
                <a
                  href={currentTrack.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg p-2 text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="size-4" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
