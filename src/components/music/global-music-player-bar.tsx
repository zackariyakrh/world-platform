"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useMusicStore, type RepeatMode, type Track } from "@/stores/music-store"
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Loader2,
  Volume2,
  VolumeX,
  Volume1,
  Repeat,
  Repeat1,
  Shuffle,
  Heart,
  ListMusic,
  Mic2,
  Share2,
  Download,
  Settings,
  Moon,
  Maximize2,
  Minimize2,
  Rewind,
  FastForward,
  X,
  GripVertical,
  Music,
  ChevronDown,
} from "lucide-react"

declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: () => void
  }
}

function decodeHtmlEntities(text: string): string {
  if (typeof document === "undefined") return text
  const txt = document.createElement("textarea")
  txt.innerHTML = text
  return txt.value
}

function fmt(s: number): string {
  if (!s || isNaN(s)) return "0:00"
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${String(sec).padStart(2, "0")}`
}

export function GlobalMusicPlayerBar() {
  const {
    currentTrack, queue, history, isPlaying, progress, duration, volume, muted,
    shuffle, repeat, favorites, queueOpen, lyricsOpen, fullscreenOpen,
    sleepTimerEnd,
    setCurrentTrack, setQueue, addToQueue, removeFromQueue, clearQueue,
    setHistory, setIsPlaying, setProgress, setDuration, setVolume, setMuted,
    toggleMute, setShuffle, cycleRepeat, toggleFavorite, setQueueOpen,
    setLyricsOpen, setFullscreenOpen, setSleepTimerMinutes, setSleepTimerEnd,
  } = useMusicStore()

  const { theme } = useTheme()
  const isDark = theme === "dark" || (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches)

  const audioRef = React.useRef<HTMLAudioElement | null>(null)
  const ytPlayerRef = React.useRef<any>(null)
  const ytContainerRef = React.useRef<HTMLDivElement>(null)
  const progressInterval = React.useRef<ReturnType<typeof setInterval> | null>(null)
  const ytReadyRef = React.useRef(false)
  const currentTrackRef = React.useRef<Track | null>(null)
  const queueRef = React.useRef<Track[]>([])
  const historyRef = React.useRef<Track[]>([])
  const isPlayingRef = React.useRef(false)
  const shuffleRef = React.useRef(false)
  const repeatRef = React.useRef<RepeatMode>("off")
  const isDraggingRef = React.useRef(false)
  const sleepTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const [dragProgress, setDragProgress] = React.useState<number | null>(null)
  const [showQueuePanel, setShowQueuePanel] = React.useState(false)

  React.useEffect(() => { queueRef.current = queue }, [queue])
  React.useEffect(() => { historyRef.current = history }, [history])
  React.useEffect(() => { currentTrackRef.current = currentTrack }, [currentTrack])
  React.useEffect(() => { isPlayingRef.current = isPlaying }, [isPlaying])
  React.useEffect(() => { shuffleRef.current = shuffle }, [shuffle])
  React.useEffect(() => { repeatRef.current = repeat }, [repeat])

  // YouTube IFrame API loader
  React.useEffect(() => {
    if (window.YT?.Player) { ytReadyRef.current = true; return }
    const tag = document.createElement("script")
    tag.src = "https://www.youtube.com/iframe_api"
    document.head.appendChild(tag)
    window.onYouTubeIframeAPIReady = () => { ytReadyRef.current = true }
  }, [])

  // Cleanup on unmount
  React.useEffect(() => () => {
    stopAll()
    if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current)
  }, [])

  // Sleep timer
  React.useEffect(() => {
    if (sleepTimerEnd) {
      if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current)
      const remaining = sleepTimerEnd - Date.now()
      if (remaining <= 0) {
        pausePlayback()
        setSleepTimerEnd(null)
        setSleepTimerMinutes(null)
      } else {
        sleepTimerRef.current = setTimeout(() => {
          pausePlayback()
          setSleepTimerEnd(null)
          setSleepTimerMinutes(null)
        }, remaining)
      }
    }
    return () => { if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current) }
  }, [sleepTimerEnd])

  function stopAll() {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; audioRef.current = null }
    if (ytPlayerRef.current) { try { ytPlayerRef.current.destroy() } catch {} ytPlayerRef.current = null }
    if (progressInterval.current) clearInterval(progressInterval.current)
  }

  function startProgress() {
    if (progressInterval.current) clearInterval(progressInterval.current)
    progressInterval.current = setInterval(() => {
      if (isDraggingRef.current) return
      if (audioRef.current && !audioRef.current.paused) {
        useMusicStore.getState().setProgress(audioRef.current.currentTime)
      }
      if (ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === "function") {
        const t = ytPlayerRef.current.getCurrentTime()
        if (typeof t === "number" && !isNaN(t)) {
          useMusicStore.getState().setProgress(t)
        }
      }
    }, 250)
  }

  function playTrack(track: Track) {
    const state = useMusicStore.getState()
    if (state.currentTrack?.id === track.id) {
      if (state.isPlaying) pausePlayback()
      else resumePlayback()
      return
    }

    stopAll()

    // Add current track to history
    if (state.currentTrack) {
      setHistory([state.currentTrack, ...state.history].slice(0, 100))
    }

    setCurrentTrack(track)
    setProgress(0)
    setDuration(0)
    setIsPlaying(false)

    if (track.videoId) {
      createYouTubePlayer(track.videoId)
    }
  }

  function createYouTubePlayer(videoId: string) {
    const doCreate = () => {
      if (!ytContainerRef.current) return
      if (ytPlayerRef.current) { try { ytPlayerRef.current.destroy() } catch {} ytPlayerRef.current = null }
      const container = ytContainerRef.current; container.innerHTML = ""
      const div = document.createElement("div"); div.id = "yt-player-global"; container.appendChild(div)

      new window.YT.Player(div, {
        videoId, width: 1, height: 1,
        playerVars: { autoplay: 1, controls: 0, disablekb: 1, fs: 0, iv_load_policy: 3, modestbranding: 1, rel: 0, showinfo: 0 },
        events: {
          onReady: (e: any) => {
            ytPlayerRef.current = e.target
            const s = useMusicStore.getState()
            e.target.setVolume(s.muted ? 0 : s.volume)
            setDuration(e.target.getDuration())
            setIsPlaying(true)
            startProgress()
          },
          onStateChange: (e: any) => {
            if (e.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true)
              startProgress()
            } else if (e.data === window.YT.PlayerState.PAUSED) {
              setIsPlaying(false)
              if (progressInterval.current) clearInterval(progressInterval.current)
            } else if (e.data === window.YT.PlayerState.ENDED) {
              setIsPlaying(false)
              setProgress(0)
              if (progressInterval.current) clearInterval(progressInterval.current)
              handleTrackEnd()
            }
          },
          onError: (e: any) => {
            console.warn("YouTube player error:", e.data)
            setIsPlaying(false)
            // Try next track on error
            handleTrackEnd()
          },
        },
      })
    }
    if (ytReadyRef.current && window.YT?.Player) { doCreate() }
    else {
      const c = setInterval(() => {
        if (ytReadyRef.current && window.YT?.Player) { clearInterval(c); doCreate() }
      }, 100)
      setTimeout(() => clearInterval(c), 10000)
    }
  }

  function handleTrackEnd() {
    const s = useMusicStore.getState()
    const { repeat: rep, shuffle: shuf, queue: q, currentTrack: ct } = s

    if (rep === "one" && ct) {
      setTimeout(() => playTrack(ct), 0)
      return
    }

    playNext()
  }

  function playNext() {
    const s = useMusicStore.getState()
    const { queue: q, shuffle: shuf, repeat: rep, currentTrack: ct } = s

    if (q.length > 0) {
      let nextTrack: Track
      let remainingQueue: Track[]

      if (shuf) {
        const randomIndex = Math.floor(Math.random() * q.length)
        nextTrack = q[randomIndex]
        remainingQueue = q.filter((_, i) => i !== randomIndex)
      } else {
        nextTrack = q[0]
        remainingQueue = q.slice(1)
      }

      setQueue(remainingQueue)
      if (ct) setHistory([ct, ...s.history].slice(0, 100))
      setTimeout(() => playTrack(nextTrack), 0)
    } else if (rep === "all" && ct) {
      // Repeat all: go back to history beginning or just replay
      if (s.history.length > 0) {
        setQueue(s.history.slice(1))
        setHistory([])
        setTimeout(() => playTrack(s.history[0]), 0)
      } else {
        setTimeout(() => playTrack(ct), 0)
      }
    } else {
      setIsPlaying(false)
      setProgress(0)
      if (progressInterval.current) clearInterval(progressInterval.current)
    }
  }

  function playPrevious() {
    const s = useMusicStore.getState()
    const { history: h, currentTrack: ct } = s

    if (s.progress > 3) {
      // If more than 3 seconds in, restart current track
      setProgress(0)
      if (audioRef.current) audioRef.current.currentTime = 0
      if (ytPlayerRef.current) try { ytPlayerRef.current.seekTo(0, true) } catch {}
      return
    }

    if (h.length > 0) {
      const prevTrack = h[0]
      const newHistory = h.slice(1)
      setHistory(newHistory)
      if (ct) setQueue([ct, ...s.queue])
      setTimeout(() => playTrack(prevTrack), 0)
    } else if (ct) {
      setProgress(0)
      if (audioRef.current) audioRef.current.currentTime = 0
      if (ytPlayerRef.current) try { ytPlayerRef.current.seekTo(0, true) } catch {}
    }
  }

  function pausePlayback() {
    setIsPlaying(false)
    if (audioRef.current) audioRef.current.pause()
    if (ytPlayerRef.current) try { ytPlayerRef.current.pauseVideo() } catch {}
    if (progressInterval.current) clearInterval(progressInterval.current)
  }

  function resumePlayback() {
    setIsPlaying(true)
    if (audioRef.current) audioRef.current.play().catch(() => setIsPlaying(false))
    if (ytPlayerRef.current) try { ytPlayerRef.current.playVideo() } catch {}
    startProgress()
  }

  function handleSeek(e: React.MouseEvent<HTMLDivElement>) {
    const d = useMusicStore.getState().duration
    if (!d) return
    const rect = e.currentTarget.getBoundingClientRect()
    const newTime = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) * d
    if (audioRef.current) audioRef.current.currentTime = newTime
    if (ytPlayerRef.current) try { ytPlayerRef.current.seekTo(newTime, true) } catch {}
    setProgress(newTime)
  }

  function handleDragStart(e: React.MouseEvent<HTMLDivElement>) {
    isDraggingRef.current = true
    const d = useMusicStore.getState().duration
    if (!d) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    setDragProgress(pct * d)

    const onMove = (ev: MouseEvent) => {
      const pct = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width))
      setDragProgress(pct * d)
    }
    const onUp = (ev: MouseEvent) => {
      const pct = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width))
      const newTime = pct * d
      if (audioRef.current) audioRef.current.currentTime = newTime
      if (ytPlayerRef.current) try { ytPlayerRef.current.seekTo(newTime, true) } catch {}
      setProgress(newTime)
      setDragProgress(null)
      isDraggingRef.current = false
      document.removeEventListener("mousemove", onMove)
      document.removeEventListener("mouseup", onUp)
    }
    document.addEventListener("mousemove", onMove)
    document.addEventListener("mouseup", onUp)
  }

  function handleVolumeChange(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = Math.round(Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)))
    setVolume(pct)
    if (pct > 0) setMuted(false)
    if (audioRef.current) audioRef.current.volume = pct / 100
    if (ytPlayerRef.current) try { ytPlayerRef.current.setVolume(pct) } catch {}
  }

  function toggleMuteFn() {
    const s = useMusicStore.getState()
    const newMuted = !s.muted
    setMuted(newMuted)
    if (audioRef.current) audioRef.current.volume = newMuted ? 0 : s.volume / 100
    if (ytPlayerRef.current) try { newMuted ? ytPlayerRef.current.mute() : ytPlayerRef.current.unMute() } catch {}
  }

  function seekRelative(seconds: number) {
    const s = useMusicStore.getState()
    const newTime = Math.max(0, Math.min(s.duration || 0, s.progress + seconds))
    if (audioRef.current) audioRef.current.currentTime = newTime
    if (ytPlayerRef.current) try { ytPlayerRef.current.seekTo(newTime, true) } catch {}
    setProgress(newTime)
  }

  function handleShare() {
    const s = useMusicStore.getState()
    if (!s.currentTrack) return
    const url = s.currentTrack.link || `https://www.youtube.com/watch?v=${s.currentTrack.videoId}`
    if (navigator.share) {
      navigator.share({ title: s.currentTrack.title, url })
    } else {
      navigator.clipboard.writeText(url)
    }
  }

  function handleDownload() {
    const s = useMusicStore.getState()
    if (!s.currentTrack?.videoId) return
    window.open(`https://www.youtube.com/watch?v=${s.currentTrack.videoId}`, "_blank")
  }

  // Keyboard shortcuts
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      const s = useMusicStore.getState()
      if (!s.currentTrack) return

      switch (e.code) {
        case "Space":
          e.preventDefault()
          s.isPlaying ? pausePlayback() : resumePlayback()
          break
        case "ArrowLeft":
          e.preventDefault()
          if (e.shiftKey) { seekRelative(-10) } else { seekRelative(-5) }
          break
        case "ArrowRight":
          e.preventDefault()
          if (e.shiftKey) { seekRelative(10) } else { seekRelative(5) }
          break
        case "ArrowUp":
          e.preventDefault()
          setVolume(Math.min(100, s.volume + 5))
          if (ytPlayerRef.current) try { ytPlayerRef.current.setVolume(Math.min(100, s.volume + 5)) } catch {}
          break
        case "ArrowDown":
          e.preventDefault()
          setVolume(Math.max(0, s.volume - 5))
          if (ytPlayerRef.current) try { ytPlayerRef.current.setVolume(Math.max(0, s.volume - 5)) } catch {}
          break
        case "KeyN":
          if (e.ctrlKey || e.metaKey) { e.preventDefault(); playNext() }
          break
        case "KeyP":
          if (e.ctrlKey || e.metaKey) { e.preventDefault(); playPrevious() }
          break
        case "KeyM":
          toggleMuteFn()
          break
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  if (!currentTrack) return null

  const displayProgress = dragProgress !== null ? dragProgress : progress
  const pct = duration ? (displayProgress / duration) * 100 : 0
  const decodedTitle = decodeHtmlEntities(currentTrack.title)
  const decodedArtist = decodeHtmlEntities(currentTrack.artist)

  return (
    <>
      <style>{`
        @keyframes playerGlow {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes progressPulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes thumbPulse {
          0%, 100% { box-shadow: 0 0 6px var(--tw-progress-glow); }
          50% { box-shadow: 0 0 14px var(--tw-progress-glow); }
        }
        .player-progress-fill {
          background: linear-gradient(90deg, oklch(0.65 0.28 300), oklch(0.72 0.24 330), oklch(0.78 0.2 30), oklch(0.72 0.24 330), oklch(0.65 0.28 300));
          background-size: 200% 100%;
          animation: playerGlow 4s ease infinite;
        }
        .player-progress-glow {
          background: linear-gradient(90deg, oklch(0.65 0.28 300 / 0.5), oklch(0.72 0.24 330 / 0.5), oklch(0.78 0.2 30 / 0.5));
          animation: progressPulse 2s ease-in-out infinite;
        }
        .dark .player-bar-bg {
          background: linear-gradient(180deg, oklch(0.16 0.02 280), oklch(0.12 0.015 280));
          border-color: oklch(1 0 0 / 0.06);
        }
        .light .player-bar-bg, :root:not(.dark) .player-bar-bg {
          background: linear-gradient(180deg, oklch(0.97 0.005 80), oklch(0.95 0.008 80));
          border-color: oklch(0 0 0 / 0.08);
        }
      `}</style>

      <div ref={ytContainerRef} className="absolute w-0 h-0 overflow-hidden opacity-0" aria-hidden="true" />

      {/* Fullscreen player overlay */}
      {fullscreenOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6" style={{ background: isDark ? "oklch(0.1 0.02 280)" : "oklch(0.95 0.01 80)" }}>
          <Button variant="ghost" size="icon" onClick={() => setFullscreenOpen(false)} className="absolute top-4 right-4"><Minimize2 className="size-5" /></Button>
          <img src={currentTrack.thumbnail} alt={decodedTitle} className="size-64 rounded-2xl object-cover shadow-2xl ring-2 ring-white/10" />
          <div className="text-center">
            <h2 className={cn("text-2xl font-bold", isDark ? "text-white" : "text-foreground")}>{decodedTitle}</h2>
            <p className={cn("text-lg", isDark ? "text-white/50" : "text-muted-foreground")}>{decodedArtist}</p>
          </div>
          <div className="w-full max-w-lg px-6">
            <div onClick={handleSeek} onMouseDown={handleDragStart} className="group relative h-2 cursor-pointer rounded-full" style={{ background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }}>
              <div className="absolute inset-y-0 left-0 rounded-full player-progress-fill transition-[width] duration-75" style={{ width: `${pct}%` }} />
              <div className="absolute top-1/2 size-4 -translate-y-1/2 rounded-full bg-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" style={{ left: `calc(${pct}% - 8px)` }} />
            </div>
            <div className="flex justify-between mt-2">
              <span className={cn("text-xs tabular-nums", isDark ? "text-white/40" : "text-muted-foreground")}>{fmt(displayProgress)}</span>
              <span className={cn("text-xs tabular-nums", isDark ? "text-white/40" : "text-muted-foreground")}>{fmt(duration)}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setShuffle(!shuffle)} className={cn("size-10", shuffle ? "text-primary" : isDark ? "text-white/50 hover:text-white" : "text-muted-foreground hover:text-foreground")}><Shuffle className="size-5" /></Button>
            <Button variant="ghost" size="icon" onClick={playPrevious} className={cn("size-10", isDark ? "text-white/70 hover:text-white" : "text-foreground hover:text-primary")}><SkipBack className="size-5" /></Button>
            <Button variant="ghost" size="icon" onClick={() => seekRelative(-10)} className={cn("size-10", isDark ? "text-white/50 hover:text-white" : "text-muted-foreground hover:text-foreground")}><Rewind className="size-5" /></Button>
            <Button variant="ghost" size="icon" onClick={() => isPlaying ? pausePlayback() : resumePlayback()} className={cn("size-14", isDark ? "text-white hover:text-white" : "text-foreground hover:text-primary")} style={{ boxShadow: "0 0 20px oklch(0.65 0.28 300 / 0.4)" }}>{isPlaying ? <Pause className="size-7" /> : <Play className="size-7 ml-0.5" />}</Button>
            <Button variant="ghost" size="icon" onClick={() => seekRelative(10)} className={cn("size-10", isDark ? "text-white/50 hover:text-white" : "text-muted-foreground hover:text-foreground")}><FastForward className="size-5" /></Button>
            <Button variant="ghost" size="icon" onClick={playNext} className={cn("size-10", isDark ? "text-white/70 hover:text-white" : "text-foreground hover:text-primary")}><SkipForward className="size-5" /></Button>
            <Button variant="ghost" size="icon" onClick={cycleRepeat} className={cn("size-10", repeat !== "off" ? "text-primary" : isDark ? "text-white/50 hover:text-white" : "text-muted-foreground hover:text-foreground")}>{repeat === "one" ? <Repeat1 className="size-5" /> : <Repeat className="size-5" />}</Button>
          </div>
        </div>
      )}

      {/* Bottom Player Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t player-bar-bg" style={{ boxShadow: isDark ? "0 -4px 24px oklch(0 0 0 / 0.4)" : "0 -2px 12px oklch(0 0 0 / 0.06)" }}>
        {/* Progress bar */}
        <div onClick={handleSeek} onMouseDown={handleDragStart} className="group relative h-1.5 cursor-pointer" style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }}>
          <div className="absolute inset-y-0 left-0 transition-[width] duration-75 player-progress-fill" style={{ width: `${pct}%` }} />
          <div className="absolute inset-y-0 left-0 rounded-full player-progress-glow" style={{ width: `${pct}%` }} />
          <div className="absolute top-1/2 size-3.5 -translate-y-1/2 rounded-full bg-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" style={{ left: `calc(${pct}% - 7px)`, boxShadow: isDark ? "0 0 8px rgba(255,255,255,0.5)" : "0 0 8px rgba(0,0,0,0.3)" }} />
        </div>

        <div className="flex items-center gap-2 px-4 py-3 sm:gap-3 md:px-6">
          {/* Track info */}
          <div className="flex items-center gap-3 min-w-0 flex-1 sm:flex-none sm:w-64 md:w-72">
            <img src={currentTrack.thumbnail} alt={decodedTitle} className={cn("size-12 rounded-lg object-cover shrink-0 ring-1", isDark ? "ring-white/10" : "ring-black/8")} />
            <div className="min-w-0 flex-1 sm:flex-none">
              <p className={cn("truncate text-sm font-semibold", isDark ? "text-white" : "text-foreground")}>{decodedTitle}</p>
              <p className={cn("truncate text-xs", isDark ? "text-white/50" : "text-muted-foreground")}>{decodedArtist}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => toggleFavorite(currentTrack.id)} className="size-8 shrink-0 hidden sm:inline-flex">
              <Heart className={cn("size-4", favorites.has(currentTrack.id) ? "fill-red-500 text-red-500" : isDark ? "text-white/40 hover:text-white" : "text-muted-foreground hover:text-foreground")} />
            </Button>
          </div>

          {/* Center controls */}
          <div className="flex flex-col items-center gap-1 flex-1">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => setShuffle(!shuffle)} className={cn("size-8 hidden sm:inline-flex", shuffle ? "text-primary" : isDark ? "text-white/40 hover:text-white" : "text-muted-foreground hover:text-foreground")} title="Shuffle"><Shuffle className="size-4" /></Button>
              <Button variant="ghost" size="icon" onClick={playPrevious} className={cn("size-9", isDark ? "text-white/70 hover:text-white" : "text-foreground hover:text-primary")} title="Previous"><SkipBack className="size-5" /></Button>
              <Button variant="ghost" size="icon" onClick={() => seekRelative(-10)} className={cn("size-8 hidden md:inline-flex", isDark ? "text-white/40 hover:text-white" : "text-muted-foreground hover:text-foreground")} title="Rewind 10s"><Rewind className="size-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => isPlaying ? pausePlayback() : resumePlayback()} className={cn("size-11 mx-1", isDark ? "text-white hover:text-white" : "text-foreground hover:text-primary")} title={isPlaying ? "Pause" : "Play"} style={{ boxShadow: "0 0 16px oklch(0.65 0.28 300 / 0.35)" }}>
                {isPlaying ? <Pause className="size-5" /> : <Play className="size-5 ml-0.5" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => seekRelative(10)} className={cn("size-8 hidden md:inline-flex", isDark ? "text-white/40 hover:text-white" : "text-muted-foreground hover:text-foreground")} title="Forward 10s"><FastForward className="size-4" /></Button>
              <Button variant="ghost" size="icon" onClick={playNext} className={cn("size-9", isDark ? "text-white/70 hover:text-white" : "text-foreground hover:text-primary")} title="Next"><SkipForward className="size-5" /></Button>
              <Button variant="ghost" size="icon" onClick={cycleRepeat} className={cn("size-8 hidden sm:inline-flex", repeat !== "off" ? "text-primary" : isDark ? "text-white/40 hover:text-white" : "text-muted-foreground hover:text-foreground")} title={`Repeat: ${repeat}`}>
                {repeat === "one" ? <Repeat1 className="size-4" /> : <Repeat className="size-4" />}
              </Button>
            </div>
            {/* Time + seek (shown on small screens) */}
            <div className="flex items-center gap-2 w-full max-w-md md:hidden">
              <span className={cn("w-10 text-right text-[10px] tabular-nums", isDark ? "text-white/40" : "text-muted-foreground")}>{fmt(displayProgress)}</span>
              <div onClick={handleSeek} onMouseDown={handleDragStart} className="group/seek relative h-1 flex-1 cursor-pointer rounded-full" style={{ background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }}>
                <div className="absolute inset-y-0 left-0 rounded-full player-progress-fill" style={{ width: `${pct}%` }} />
              </div>
              <span className={cn("w-10 text-[10px] tabular-nums", isDark ? "text-white/40" : "text-muted-foreground")}>{fmt(duration)}</span>
            </div>
          </div>

          {/* Right controls */}
          <div className="hidden md:flex items-center gap-2 flex-1 max-w-xs justify-end">
            <span className={cn("w-10 text-right text-xs tabular-nums", isDark ? "text-white/40" : "text-muted-foreground")}>{fmt(displayProgress)}</span>
            <div onClick={handleSeek} onMouseDown={handleDragStart} className="group/seek relative h-1.5 flex-1 cursor-pointer rounded-full max-w-48" style={{ background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }}>
              <div className="absolute inset-y-0 left-0 rounded-full player-progress-fill transition-[width] duration-75" style={{ width: `${pct}%` }} />
              <div className="absolute top-1/2 size-3 -translate-y-1/2 rounded-full bg-white opacity-0 group-hover/seek:opacity-100 transition-opacity shadow-md" style={{ left: `calc(${pct}% - 6px)` }} />
            </div>
            <span className={cn("w-10 text-xs tabular-nums", isDark ? "text-white/40" : "text-muted-foreground")}>-{fmt(duration > displayProgress ? duration - displayProgress : 0)}</span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="icon" onClick={() => setQueueOpen(!queueOpen)} className={cn("size-8", queueOpen ? "text-primary" : isDark ? "text-white/40 hover:text-white" : "text-muted-foreground hover:text-foreground")} title="Queue"><ListMusic className="size-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => setLyricsOpen(!lyricsOpen)} className={cn("size-8 hidden sm:inline-flex", lyricsOpen ? "text-primary" : isDark ? "text-white/40 hover:text-white" : "text-muted-foreground hover:text-foreground")} title="Lyrics"><Mic2 className="size-4" /></Button>
            <div className="hidden sm:flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={toggleMuteFn} className={cn("size-8", isDark ? "text-white/40 hover:text-white" : "text-muted-foreground hover:text-foreground")} title={muted ? "Unmute" : "Mute"}>
                {muted || volume === 0 ? <VolumeX className="size-4" /> : volume < 50 ? <Volume1 className="size-4" /> : <Volume2 className="size-4" />}
              </Button>
              <div onClick={handleVolumeChange} className="relative h-1 w-20 cursor-pointer rounded-full" style={{ background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }}>
                <div className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-75" style={{ width: `${muted ? 0 : volume}%`, background: isDark ? "rgba(255,255,255,0.6)" : "oklch(0.52 0.22 25)" }} />
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setFullscreenOpen(true)} className={cn("size-8 hidden sm:inline-flex", isDark ? "text-white/40 hover:text-white" : "text-muted-foreground hover:text-foreground")} title="Fullscreen"><Maximize2 className="size-4" /></Button>
          </div>
        </div>
      </div>

      {/* Queue Side Panel */}
      {queueOpen && (
        <div className="fixed inset-y-0 right-0 z-[60] w-80 flex flex-col border-l" style={{ background: isDark ? "oklch(0.14 0.02 280)" : "oklch(0.98 0.005 80)", top: "auto", bottom: 0, height: "calc(100% - 80px)" }}>
          <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)" }}>
            <h3 className={cn("font-semibold", isDark ? "text-white" : "text-foreground")}>Queue</h3>
            <Button variant="ghost" size="icon" onClick={() => setQueueOpen(false)} className="size-8"><X className="size-4" /></Button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {currentTrack && (
              <div className="mb-3">
                <p className={cn("text-xs font-medium mb-2 px-2", isDark ? "text-white/40" : "text-muted-foreground")}>Now Playing</p>
                <div className="flex items-center gap-3 rounded-lg p-2" style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)" }}>
                  <img src={currentTrack.thumbnail} alt="" className="size-10 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className={cn("truncate text-sm font-medium", isDark ? "text-white" : "text-foreground")}>{decodeHtmlEntities(currentTrack.title)}</p>
                    <p className={cn("truncate text-xs", isDark ? "text-white/50" : "text-muted-foreground")}>{decodeHtmlEntities(currentTrack.artist)}</p>
                  </div>
                </div>
              </div>
            )}
            {queue.length > 0 && (
              <div>
                <p className={cn("text-xs font-medium mb-2 px-2", isDark ? "text-white/40" : "text-muted-foreground")}>Next Up ({queue.length})</p>
                {queue.map((track, i) => (
                  <div key={`q-${track.id}-${i}`} className="flex items-center gap-3 rounded-lg p-2 hover:bg-white/5 transition-colors group">
                    <GripVertical className={cn("size-4 shrink-0 opacity-0 group-hover:opacity-50", isDark ? "text-white" : "text-muted-foreground")} />
                    <img src={track.thumbnail} alt="" className="size-10 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className={cn("truncate text-sm", isDark ? "text-white/80" : "text-foreground")}>{decodeHtmlEntities(track.title)}</p>
                      <p className={cn("truncate text-xs", isDark ? "text-white/40" : "text-muted-foreground")}>{decodeHtmlEntities(track.artist)}</p>
                    </div>
                    <button onClick={() => removeFromQueue(i)} className={cn("opacity-0 group-hover:opacity-100 transition-opacity", isDark ? "text-white/40 hover:text-red-400" : "text-muted-foreground hover:text-destructive")}>&times;</button>
                  </div>
                ))}
              </div>
            )}
            {queue.length === 0 && !currentTrack && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Music className={cn("size-12 mb-3", isDark ? "text-white/10" : "text-muted-foreground/20")} />
                <p className={cn("text-sm", isDark ? "text-white/30" : "text-muted-foreground")}>Queue is empty</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
