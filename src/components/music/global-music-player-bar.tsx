"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { useTheme } from "next-themes"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useMusicStore, type RepeatMode, type Track } from "@/stores/music-store"
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Volume1,
  Repeat,
  Repeat1,
  Shuffle,
  Heart,
  ListMusic,
  Mic2,
  Maximize2,
  Minimize2,
  Rewind,
  FastForward,
  X,
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

// Module-level persistent state — survives component remounts across navigations
let persistentYTContainer: HTMLDivElement | null = null
let persistentYTPlayer: any = null
let persistentYTReady = false
let persistentProgressInterval: ReturnType<typeof setInterval> | null = null

function getOrCreateYTContainer() {
  if (typeof window === "undefined") return null
  if (!persistentYTContainer) {
    persistentYTContainer = document.createElement("div")
    persistentYTContainer.id = "nexus-yt-player-root"
    persistentYTContainer.style.cssText = "position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;pointer-events:none;z-index:-1;"
    document.body.appendChild(persistentYTContainer)
  }
  return persistentYTContainer
}

function loadYTScript() {
  if (typeof window === "undefined") return
  if (window.YT?.Player) { persistentYTReady = true; return }
  if (document.querySelector('script[src*="youtube.com/iframe_api"]')) return
  const tag = document.createElement("script")
  tag.src = "https://www.youtube.com/iframe_api"
  document.head.appendChild(tag)
  window.onYouTubeIframeAPIReady = () => { persistentYTReady = true }
}

export function GlobalMusicPlayerBar() {
  const {
    currentTrack, queue, history, isPlaying, progress, duration, volume, muted,
    shuffle, repeat, favorites, queueOpen, lyricsOpen, fullscreenOpen,
    playerVisible,
    setCurrentTrack,
    setHistory, setIsPlaying, setProgress, setDuration, setVolume, setMuted,
    toggleMute, setShuffle, cycleRepeat, toggleFavorite, setQueueOpen,
    setLyricsOpen, setFullscreenOpen,
    setPlayerVisible,
  } = useMusicStore()

  const { theme } = useTheme()
  const isDark = theme === "dark" || (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches)
  const pathname = usePathname()
  const isMusicPage = pathname === "/music"

  const audioRef = React.useRef<HTMLAudioElement | null>(null)
  const currentTrackRef = React.useRef<Track | null>(null)
  const queueRef = React.useRef<Track[]>([])
  const historyRef = React.useRef<Track[]>([])
  const isPlayingRef = React.useRef(false)
  const shuffleRef = React.useRef(false)
  const repeatRef = React.useRef<RepeatMode>("off")
  const isDraggingRef = React.useRef(false)

  const [dragProgress, setDragProgress] = React.useState<number | null>(null)
  const [expandedMobile, setExpandedMobile] = React.useState(false)

  React.useEffect(() => { queueRef.current = queue }, [queue])
  React.useEffect(() => { historyRef.current = history }, [history])
  React.useEffect(() => { currentTrackRef.current = currentTrack }, [currentTrack])
  React.useEffect(() => { isPlayingRef.current = isPlaying }, [isPlaying])
  React.useEffect(() => { shuffleRef.current = shuffle }, [shuffle])
  React.useEffect(() => { repeatRef.current = repeat }, [repeat])

  // Auto-play when currentTrack changes externally (e.g. from music page clicking a song)
  const prevTrackIdRef = React.useRef<string | null>(null)
  React.useEffect(() => {
    if (currentTrack && currentTrack.id !== prevTrackIdRef.current) {
      prevTrackIdRef.current = currentTrack.id
      if (isPlaying && currentTrack.videoId) {
        stopAll()
        setProgress(0)
        setDuration(0)
        createYouTubePlayer(currentTrack.videoId)
      }
    }
  }, [currentTrack, isPlaying])

  React.useEffect(() => {
    loadYTScript()
  }, [])

  React.useEffect(() => () => {
    if (persistentProgressInterval) clearInterval(persistentProgressInterval)
  }, [])

  function stopAll() {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; audioRef.current = null }
    if (persistentYTPlayer) { try { persistentYTPlayer.destroy() } catch {} persistentYTPlayer = null }
    if (persistentProgressInterval) clearInterval(persistentProgressInterval)
  }

  function startProgress() {
    if (persistentProgressInterval) clearInterval(persistentProgressInterval)
    persistentProgressInterval = setInterval(() => {
      if (isDraggingRef.current) return
      if (audioRef.current && !audioRef.current.paused) {
        useMusicStore.getState().setProgress(audioRef.current.currentTime)
      }
      if (persistentYTPlayer && typeof persistentYTPlayer.getCurrentTime === "function") {
        const t = persistentYTPlayer.getCurrentTime()
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
      const container = getOrCreateYTContainer()
      if (!container) return
      if (persistentYTPlayer) { try { persistentYTPlayer.destroy() } catch {} persistentYTPlayer = null }
      container.innerHTML = ""
      const div = document.createElement("div"); div.id = "yt-player-global"; container.appendChild(div)

      new window.YT.Player(div, {
        videoId, width: 1, height: 1,
        playerVars: { autoplay: 1, controls: 0, disablekb: 1, fs: 0, iv_load_policy: 3, modestbranding: 1, rel: 0, showinfo: 0 },
        events: {
          onReady: (e: any) => {
            persistentYTPlayer = e.target
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
              if (persistentProgressInterval) clearInterval(persistentProgressInterval)
            } else if (e.data === window.YT.PlayerState.ENDED) {
              setIsPlaying(false)
              setProgress(0)
              if (persistentProgressInterval) clearInterval(persistentProgressInterval)
              handleTrackEnd()
            }
          },
          onError: (e: any) => {
            console.warn("YouTube player error:", e.data)
            handleTrackEnd()
          },
        },
      })
    }
    if (persistentYTReady && window.YT?.Player) { doCreate() }
    else {
      const c = setInterval(() => {
        if (persistentYTReady && window.YT?.Player) { clearInterval(c); doCreate() }
      }, 100)
      setTimeout(() => clearInterval(c), 10000)
    }
  }

  function handleTrackEnd() {
    const s = useMusicStore.getState()
    const { repeat: rep, currentTrack: ct } = s

    if (rep === "one" && ct) {
      setTimeout(() => playTrack(ct), 0)
      return
    }

    playNext()
  }

  function playNext() {
    const s = useMusicStore.getState()
    const { history: h, repeat: rep, currentTrack: ct } = s

    if (h.length > 0) {
      const prevTrack = h[0]
      setHistory(h.slice(1))
      setTimeout(() => playTrack(prevTrack), 0)
    } else if (rep === "all" && ct) {
      setTimeout(() => playTrack(ct), 0)
    } else {
      setIsPlaying(false)
      setProgress(0)
      if (persistentProgressInterval) clearInterval(persistentProgressInterval)
    }
  }

  function playPrevious() {
    const s = useMusicStore.getState()
    const { history: h, currentTrack: ct, progress: p } = s

    if (p > 3) {
      setProgress(0)
      if (audioRef.current) audioRef.current.currentTime = 0
      if (persistentYTPlayer) try { persistentYTPlayer.seekTo(0, true) } catch {}
      return
    }

    if (h.length > 0) {
      const prevTrack = h[0]
      setHistory(h.slice(1))
      if (ct) setHistory([ct, ...s.history].slice(0, 100))
      setTimeout(() => playTrack(prevTrack), 0)
    } else if (ct) {
      setProgress(0)
      if (audioRef.current) audioRef.current.currentTime = 0
      if (persistentYTPlayer) try { persistentYTPlayer.seekTo(0, true) } catch {}
    }
  }

  function pausePlayback() {
    setIsPlaying(false)
    if (audioRef.current) audioRef.current.pause()
    if (persistentYTPlayer) try { persistentYTPlayer.pauseVideo() } catch {}
    if (persistentProgressInterval) clearInterval(persistentProgressInterval)
  }

  function resumePlayback() {
    setIsPlaying(true)
    if (audioRef.current) audioRef.current.play().catch(() => setIsPlaying(false))
    if (persistentYTPlayer) try { persistentYTPlayer.playVideo() } catch {}
    startProgress()
  }

  function handleSeek(e: React.MouseEvent<HTMLDivElement>) {
    const d = useMusicStore.getState().duration
    if (!d) return
    const rect = e.currentTarget.getBoundingClientRect()
    const newTime = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) * d
    if (audioRef.current) audioRef.current.currentTime = newTime
    if (persistentYTPlayer) try { persistentYTPlayer.seekTo(newTime, true) } catch {}
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
      const p = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width))
      setDragProgress(p * d)
    }
    const onUp = (ev: MouseEvent) => {
      const p = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width))
      const newTime = p * d
      if (audioRef.current) audioRef.current.currentTime = newTime
      if (persistentYTPlayer) try { persistentYTPlayer.seekTo(newTime, true) } catch {}
      setProgress(newTime)
      setDragProgress(null)
      isDraggingRef.current = false
      document.removeEventListener("mousemove", onMove)
      document.removeEventListener("mouseup", onUp)
    }
    document.addEventListener("mousemove", onMove)
    document.addEventListener("mouseup", onUp)
  }

  function applyVolumeFromEvent(clientX: number, el: HTMLDivElement) {
    const rect = el.getBoundingClientRect()
    const pct = Math.round(Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)))
    setVolume(pct)
    if (pct > 0) setMuted(false)
    if (audioRef.current) audioRef.current.volume = pct / 100
    if (persistentYTPlayer) try { persistentYTPlayer.setVolume(pct) } catch {}
  }

  function handleVolumeDragStart(e: React.MouseEvent<HTMLDivElement>) {
    applyVolumeFromEvent(e.clientX, e.currentTarget)
    const onMove = (ev: MouseEvent) => applyVolumeFromEvent(ev.clientX, e.currentTarget)
    const onUp = () => { document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp) }
    document.addEventListener("mousemove", onMove)
    document.addEventListener("mouseup", onUp)
  }

  function toggleMuteFn() {
    const s = useMusicStore.getState()
    const newMuted = !s.muted
    setMuted(newMuted)
    if (audioRef.current) audioRef.current.volume = newMuted ? 0 : s.volume / 100
    if (persistentYTPlayer) try { newMuted ? persistentYTPlayer.mute() : persistentYTPlayer.unMute() } catch {}
  }

  function seekRelative(seconds: number) {
    const s = useMusicStore.getState()
    const newTime = Math.max(0, Math.min(s.duration || 0, s.progress + seconds))
    if (audioRef.current) audioRef.current.currentTime = newTime
    if (persistentYTPlayer) try { persistentYTPlayer.seekTo(newTime, true) } catch {}
    setProgress(newTime)
  }



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
          if (persistentYTPlayer) try { persistentYTPlayer.setVolume(Math.min(100, s.volume + 5)) } catch {}
          break
        case "ArrowDown":
          e.preventDefault()
          setVolume(Math.max(0, s.volume - 5))
          if (persistentYTPlayer) try { persistentYTPlayer.setVolume(Math.max(0, s.volume - 5)) } catch {}
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
        .player-progress-fill {
          background: linear-gradient(90deg, oklch(0.65 0.28 300), oklch(0.72 0.24 330), oklch(0.78 0.2 30), oklch(0.72 0.24 330), oklch(0.65 0.28 300));
          background-size: 200% 100%;
          animation: playerGlow 4s ease infinite;
        }
        .player-progress-glow {
          background: linear-gradient(90deg, oklch(0.65 0.28 300 / 0.4), oklch(0.72 0.24 330 / 0.4), oklch(0.78 0.2 30 / 0.4));
          animation: progressPulse 2s ease-in-out infinite;
        }
      `}</style>

      <div className="sr-only" aria-hidden="true" />

      {/* Fullscreen player overlay — fixed within content area, never covers sidebar/header */}
      {fullscreenOpen && createPortal(
        <div className="fixed z-[200] flex flex-col items-center justify-center gap-6 overflow-y-auto" style={{
          top: "80px",
          left: "var(--sidebar-width, 0px)",
          right: 0,
          bottom: playerVisible ? "500px" : 0,
          background: isDark ? "oklch(0.1 0.02 280)" : "oklch(0.96 0.005 80)",
        }}>
          <Button variant="ghost" size="icon" onClick={() => setFullscreenOpen(false)} className="absolute top-4 right-4 z-10"><Minimize2 className="size-5" /></Button>
          <img src={currentTrack.thumbnail} alt={decodedTitle} className="size-64 rounded-2xl object-cover shadow-2xl ring-2 ring-white/10" />
          <div className="text-center">
            <h2 className={cn("text-2xl font-bold", isDark ? "text-white" : "text-gray-900")}>{decodedTitle}</h2>
            <p className={cn("text-lg", isDark ? "text-white/50" : "text-gray-500")}>{decodedArtist}</p>
          </div>
          <div className="w-full max-w-lg px-6">
            <div onClick={handleSeek} onMouseDown={handleDragStart} className="group relative h-2 cursor-pointer rounded-full" style={{ background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }}>
              <div className="absolute inset-y-0 left-0 rounded-full player-progress-fill transition-[width] duration-75" style={{ width: `${pct}%` }} />
              <div className="absolute top-1/2 size-4 -translate-y-1/2 rounded-full bg-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" style={{ left: `calc(${pct}% - 8px)` }} />
            </div>
            <div className="flex justify-between mt-2">
              <span className={cn("text-xs tabular-nums", isDark ? "text-white/40" : "text-gray-400")}>{fmt(displayProgress)}</span>
              <span className={cn("text-xs tabular-nums", isDark ? "text-white/40" : "text-gray-400")}>{fmt(duration)}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setShuffle(!shuffle)} className={cn("size-10", shuffle ? "text-primary" : isDark ? "text-white/50 hover:text-white" : "text-gray-400 hover:text-gray-900")} title="Shuffle"><Shuffle className="size-5" /></Button>
            <Button variant="ghost" size="icon" onClick={playPrevious} className={cn("size-10", isDark ? "text-white/70 hover:text-white" : "text-gray-700 hover:text-primary")} title="Previous"><SkipBack className="size-5" /></Button>
            <Button variant="ghost" size="icon" onClick={() => seekRelative(-10)} className={cn("size-10", isDark ? "text-white/50 hover:text-white" : "text-gray-400 hover:text-gray-900")} title="Rewind 10s"><Rewind className="size-5" /></Button>
            <Button variant="ghost" size="icon" onClick={() => isPlaying ? pausePlayback() : resumePlayback()} className={cn("size-14", isDark ? "text-white hover:text-white" : "text-gray-900 hover:text-primary")} style={{ boxShadow: "0 0 20px oklch(0.65 0.28 300 / 0.4)" }}>{isPlaying ? <Pause className="size-7" /> : <Play className="size-7 ml-0.5" />}</Button>
            <Button variant="ghost" size="icon" onClick={() => seekRelative(10)} className={cn("size-10", isDark ? "text-white/50 hover:text-white" : "text-gray-400 hover:text-gray-900")} title="Forward 10s"><FastForward className="size-5" /></Button>
            <Button variant="ghost" size="icon" onClick={playNext} className={cn("size-10", isDark ? "text-white/70 hover:text-white" : "text-gray-700 hover:text-primary")} title="Next"><SkipForward className="size-5" /></Button>
            <Button variant="ghost" size="icon" onClick={cycleRepeat} className={cn("size-10", repeat !== "off" ? "text-primary" : isDark ? "text-white/50 hover:text-white" : "text-gray-400 hover:text-gray-900")} title={`Repeat: ${repeat}`}>
              {repeat === "one" ? <Repeat1 className="size-5" /> : <Repeat className="size-5" />}
            </Button>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <Button variant="ghost" size="icon" onClick={() => toggleFavorite(currentTrack)} className="size-10">
              <Heart className={cn("size-5", favorites.some(t => t.id === currentTrack.id) ? "fill-red-500 text-red-500" : isDark ? "text-white/40 hover:text-white" : "text-gray-400 hover:text-gray-900")} />
            </Button>
          </div>
        </div>,
        document.getElementById("main-content") || document.body
      )}

      {/* Lyrics Panel */}
      {lyricsOpen && (
        <div className="absolute bottom-0 right-0 top-0 z-[60] w-96 flex flex-col border-l" style={{ background: isDark ? "oklch(0.14 0.02 280)" : "oklch(0.98 0.005 80)" }}>
          <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)" }}>
            <h3 className={cn("font-semibold", isDark ? "text-white" : "text-gray-900")}>Lyrics</h3>
            <Button variant="ghost" size="icon" onClick={() => setLyricsOpen(false)} className="size-8"><X className="size-4" /></Button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Mic2 className={cn("size-12 mb-3", isDark ? "text-white/10" : "text-gray-300")} />
              <p className={cn("text-sm font-medium mb-1", isDark ? "text-white/40" : "text-gray-500")}>Lyrics not available</p>
              <p className={cn("text-xs", isDark ? "text-white/25" : "text-gray-400")}>YouTube doesn&apos;t provide lyrics data</p>
            </div>
          </div>
        </div>
      )}

      {/* Favorites Side Panel */}
      {queueOpen && (
        <div className="fixed inset-y-0 right-0 top-20 bottom-0 z-[60] w-96 flex flex-col border-l" style={{ background: isDark ? "oklch(0.14 0.02 280)" : "oklch(0.98 0.005 80)" }}>
          <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)" }}>
            <h3 className={cn("font-semibold", isDark ? "text-white" : "text-gray-900")}>Favorites ({favorites.length})</h3>
            <Button variant="ghost" size="icon" onClick={() => setQueueOpen(false)} className="size-8"><X className="size-4" /></Button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {favorites.length > 0 ? (
              favorites.map((track, i) => (
                <div key={`fav-${track.id}-${i}`} className="flex items-center gap-3 rounded-lg p-2 hover:bg-white/5 transition-colors group cursor-pointer" onClick={() => { setCurrentTrack(track); setProgress(0); setDuration(0); setIsPlaying(true); }}>
                  <img src={track.thumbnail} alt="" className="size-10 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className={cn("truncate text-sm", isDark ? "text-white/80" : "text-gray-700")}>{decodeHtmlEntities(track.title)}</p>
                    <p className={cn("truncate text-xs", isDark ? "text-white/40" : "text-gray-400")}>{decodeHtmlEntities(track.artist)}</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); toggleFavorite(track) }} className={cn("opacity-0 group-hover:opacity-100 transition-opacity", isDark ? "text-white/40 hover:text-red-400" : "text-gray-400 hover:text-red-500")} title="Remove from favorites"><X className="size-4" /></button>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Heart className={cn("size-12 mb-3", isDark ? "text-white/10" : "text-gray-200")} />
                <p className={cn("text-sm", isDark ? "text-white/30" : "text-gray-400")}>No favorites yet</p>
                <p className={cn("text-xs mt-1", isDark ? "text-white/20" : "text-gray-300")}>Heart songs to add them here</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Player Bar */}
      {playerVisible && (
      <div className={cn("shrink-0 border-t h-[500px] flex flex-col", isDark ? "bg-gray-900 border-white/[0.06]" : "bg-white border-gray-200")} style={{ boxShadow: isDark ? "0 -6px 40px rgba(120,60,200,0.25), 0 -2px 16px rgba(120,60,200,0.15), 0 -4px 24px rgba(0,0,0,0.4)" : "0 -4px 32px rgba(120,60,200,0.1), 0 -2px 12px rgba(0,0,0,0.06)" }}>
        {/* Progress bar */}
        <div onClick={handleSeek} onMouseDown={handleDragStart} className="group relative h-1.5 cursor-pointer" style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }}>
          <div className="absolute inset-y-0 left-0 transition-[width] duration-75 player-progress-fill" style={{ width: `${pct}%` }} />
          <div className="absolute top-1/2 size-3.5 -translate-y-1/2 rounded-full bg-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" style={{ left: `calc(${pct}% - 7px)`, boxShadow: isDark ? "0 0 8px rgba(255,255,255,0.5)" : "0 0 8px rgba(0,0,0,0.3)" }} />
        </div>

        <div className="flex items-center gap-4 px-6 py-6 sm:gap-6 md:px-10 flex-1">
          {/* Track info */}
          <div className="flex items-center gap-4 min-w-0 flex-1 sm:flex-none sm:w-64 md:w-72">
            <img src={currentTrack.thumbnail} alt={decodedTitle} className={cn("size-14 rounded-xl object-cover shrink-0 ring-1", isDark ? "ring-white/10" : "ring-black/[0.08]")} />
            <div className="min-w-0 flex-1 sm:flex-none">
              <p className={cn("truncate text-sm font-semibold", isDark ? "text-white" : "text-gray-900")}>{decodedTitle}</p>
              <p className={cn("truncate text-xs", isDark ? "text-white/50" : "text-gray-500")}>{decodedArtist}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => toggleFavorite(currentTrack)} className="size-9 shrink-0 hidden sm:inline-flex" title={favorites.some(t => t.id === currentTrack.id) ? "Unlike" : "Like"}>
              <Heart className={cn("size-4", favorites.some(t => t.id === currentTrack.id) ? "fill-red-500 text-red-500" : isDark ? "text-white/40 hover:text-white" : "text-gray-400 hover:text-gray-900")} />
            </Button>
          </div>

          {/* Center controls */}
          <div className="flex flex-col items-center gap-1 flex-1">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => setShuffle(!shuffle)} className={cn("size-9 inline-flex", shuffle ? "text-primary" : isDark ? "text-white/40 hover:text-white" : "text-gray-400 hover:text-gray-900")} title="Shuffle"><Shuffle className="size-4" /></Button>
              <Button variant="ghost" size="icon" onClick={playPrevious} className={cn("size-9", isDark ? "text-white/70 hover:text-white" : "text-gray-700 hover:text-primary")} title="Previous"><SkipBack className="size-5" /></Button>
              <Button variant="ghost" size="icon" onClick={() => seekRelative(-10)} className={cn("size-9 inline-flex", isDark ? "text-white/40 hover:text-white" : "text-gray-400 hover:text-gray-900")} title="Rewind 10s"><Rewind className="size-5" /></Button>
              <Button variant="ghost" size="icon" onClick={() => isPlaying ? pausePlayback() : resumePlayback()} className={cn("size-9 mx-1", isDark ? "text-white hover:text-white" : "text-gray-900 hover:text-primary")} title={isPlaying ? "Pause" : "Play"} style={{ boxShadow: "0 0 16px oklch(0.65 0.28 300 / 0.35)" }}>
                {isPlaying ? <Pause className="size-5" /> : <Play className="size-5 ml-0.5" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => seekRelative(10)} className={cn("size-9 inline-flex", isDark ? "text-white/40 hover:text-white" : "text-gray-400 hover:text-gray-900")} title="Forward 10s"><FastForward className="size-5" /></Button>
              <Button variant="ghost" size="icon" onClick={playNext} className={cn("size-9", isDark ? "text-white/70 hover:text-white" : "text-gray-700 hover:text-primary")} title="Next"><SkipForward className="size-5" /></Button>
              <Button variant="ghost" size="icon" onClick={cycleRepeat} className={cn("size-9 inline-flex", repeat !== "off" ? "text-primary" : isDark ? "text-white/40 hover:text-white" : "text-gray-400 hover:text-gray-900")} title={`Repeat: ${repeat}`}>
                {repeat === "one" ? <Repeat1 className="size-5" /> : <Repeat className="size-5" />}
              </Button>
            </div>
            {/* Time + seek (shown on small screens) */}
            <div className="flex items-center gap-2 w-full max-w-md md:hidden">
              <span className={cn("w-10 text-right text-[10px] tabular-nums", isDark ? "text-white/40" : "text-gray-400")}>{fmt(displayProgress)}</span>
              <div onClick={handleSeek} onMouseDown={handleDragStart} className="group/seek relative h-1 flex-1 cursor-pointer rounded-full" style={{ background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }}>
                <div className="absolute inset-y-0 left-0 rounded-full player-progress-fill" style={{ width: `${pct}%` }} />
              </div>
              <span className={cn("w-10 text-[10px] tabular-nums", isDark ? "text-white/40" : "text-gray-400")}>{fmt(duration)}</span>
            </div>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2 flex-1 max-w-xs justify-end">
            <span className={cn("w-10 text-right text-xs tabular-nums", isDark ? "text-white/40" : "text-gray-400")}>{fmt(displayProgress)}</span>
            <div onClick={handleSeek} onMouseDown={handleDragStart} className="group/seek relative h-1.5 flex-1 cursor-pointer rounded-full max-w-48" style={{ background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }}>
              <div className="absolute inset-y-0 left-0 rounded-full player-progress-fill transition-[width] duration-75" style={{ width: `${pct}%` }} />
              <div className="absolute top-1/2 size-3 -translate-y-1/2 rounded-full bg-white opacity-0 group-hover/seek:opacity-100 transition-opacity shadow-md" style={{ left: `calc(${pct}% - 6px)` }} />
            </div>
            <span className={cn("w-10 text-xs tabular-nums", isDark ? "text-white/40" : "text-gray-400")}>-{fmt(duration > displayProgress ? duration - displayProgress : 0)}</span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="icon" onClick={() => setQueueOpen(!queueOpen)} className={cn("size-9", queueOpen ? "text-primary" : isDark ? "text-white/40 hover:text-white" : "text-gray-400 hover:text-gray-900")} title="Favorites"><ListMusic className="size-4" /></Button>
            <div className="flex items-center gap-2 group/vol">
              <Button variant="ghost" size="icon" onClick={toggleMuteFn} className={cn("size-9", isDark ? "text-white/40 hover:text-white" : "text-gray-400 hover:text-gray-900")} title={muted ? "Unmute" : "Mute"}>
                {muted || volume === 0 ? <VolumeX className="size-4" /> : volume < 50 ? <Volume1 className="size-4" /> : <Volume2 className="size-4" />}
              </Button>
              <div className="relative w-28 h-6 flex items-center cursor-pointer group/vol" onMouseDown={handleVolumeDragStart}>
                <div className="absolute inset-y-0 my-auto h-1.5 w-full rounded-full transition-all duration-200" style={{ background: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)" }}>
                  <div className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-100 ease-out" style={{ width: `${muted ? 0 : volume}%`, background: isDark ? "rgba(255,255,255,0.7)" : "oklch(0.52 0.22 25)" }} />
                </div>
                <div className="absolute top-1/2 -translate-y-1/2 size-3.5 rounded-full bg-white shadow-lg opacity-80 group-hover/vol:opacity-100 transition-all duration-200 pointer-events-none" style={{ left: `calc(${muted ? 0 : volume}% - 7px)` }} />
              </div>
            </div>
            {isMusicPage && <Button variant="ghost" size="icon" onClick={() => setFullscreenOpen(true)} className={cn("size-9 inline-flex", isDark ? "text-white/40 hover:text-white" : "text-gray-400 hover:text-gray-900")} title="Fullscreen"><Maximize2 className="size-4" /></Button>}
            <Button variant="ghost" size="icon" onClick={() => { stopAll(); setIsPlaying(false); setCurrentTrack(null); setPlayerVisible(false) }} className={cn("size-9 inline-flex", isDark ? "text-white/40 hover:text-white" : "text-gray-400 hover:text-gray-900")} title="Close player"><X className="size-4" /></Button>
          </div>
        </div>
      </div>
      )}
      {!playerVisible && currentTrack && (
        <Button variant="ghost" size="icon" onClick={() => setPlayerVisible(true)} className="fixed bottom-4 right-4 z-[70] size-10 rounded-full shadow-lg" style={{ background: isDark ? "oklch(0.16 0.02 280)" : "white", boxShadow: isDark ? "0 4px 20px rgba(120,60,200,0.3)" : "0 4px 20px rgba(0,0,0,0.15)" }} title="Show player">
          <Play className="size-4" />
        </Button>
      )}
    </>
  )
}
