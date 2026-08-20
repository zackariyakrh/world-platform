"use client"

import { create } from "zustand"

export interface Track {
  id: string
  title: string
  artist: string
  thumbnail: string
  duration?: number
  source: "youtube"
  videoId?: string
  link?: string
}

export type RepeatMode = "off" | "all" | "one"

interface MusicState {
  currentTrack: Track | null
  queue: Track[]
  history: Track[]
  isPlaying: boolean
  progress: number
  duration: number
  volume: number
  muted: boolean
  shuffle: boolean
  repeat: RepeatMode
  favorites: Track[]
  queueOpen: boolean
  lyricsOpen: boolean
  fullscreenOpen: boolean
  sleepTimerMinutes: number | null
  sleepTimerEnd: number | null
  playerVisible: boolean

  setCurrentTrack: (track: Track | null) => void
  setQueue: (queue: Track[]) => void
  addToQueue: (track: Track) => void
  removeFromQueue: (index: number) => void
  clearQueue: () => void
  setHistory: (history: Track[]) => void
  setIsPlaying: (playing: boolean) => void
  setProgress: (progress: number) => void
  setDuration: (duration: number) => void
  setVolume: (volume: number) => void
  setMuted: (muted: boolean) => void
  toggleMute: () => void
  setShuffle: (shuffle: boolean) => void
  setRepeat: (repeat: RepeatMode) => void
  cycleRepeat: () => void
  toggleFavorite: (track: Track) => void
  isFavorite: (trackId: string) => boolean
  setQueueOpen: (open: boolean) => void
  setLyricsOpen: (open: boolean) => void
  setFullscreenOpen: (open: boolean) => void
  setSleepTimerMinutes: (minutes: number | null) => void
  setSleepTimerEnd: (end: number | null) => void
  setPlayerVisible: (visible: boolean) => void
}

export const useMusicStore = create<MusicState>((set, get) => ({
  currentTrack: null,
  queue: [],
  history: [],
  isPlaying: false,
  progress: 0,
  duration: 0,
  volume: 80,
  muted: false,
  shuffle: false,
  repeat: "off",
  favorites: [],
  queueOpen: false,
  lyricsOpen: false,
  fullscreenOpen: false,
  sleepTimerMinutes: null,
  sleepTimerEnd: null,
  playerVisible: true,

  setCurrentTrack: (track) => set({ currentTrack: track }),
  setQueue: (queue) => set({ queue }),
  addToQueue: (track) => set((s) => ({ queue: [...s.queue, track] })),
  removeFromQueue: (index) => set((s) => ({
    queue: s.queue.filter((_, i) => i !== index),
  })),
  clearQueue: () => set({ queue: [] }),
  setHistory: (history) => set({ history }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setProgress: (progress) => set({ progress }),
  setDuration: (duration) => set({ duration }),
  setVolume: (volume) => set({ volume, muted: volume === 0 }),
  setMuted: (muted) => set({ muted }),
  toggleMute: () => set((s) => ({ muted: !s.muted })),
  setShuffle: (shuffle) => set({ shuffle }),
  setRepeat: (repeat) => set({ repeat }),
  cycleRepeat: () => set((s) => ({
    repeat: s.repeat === "off" ? "all" : s.repeat === "all" ? "one" : "off",
  })),
  toggleFavorite: (track) => set((s) => {
    const exists = s.favorites.find(t => t.id === track.id)
    if (exists) return { favorites: s.favorites.filter(t => t.id !== track.id) }
    return { favorites: [...s.favorites, track] }
  }),
  isFavorite: (trackId) => get().favorites.some(t => t.id === trackId),
  setQueueOpen: (open) => set({ queueOpen: open }),
  setLyricsOpen: (open) => set({ lyricsOpen: open }),
  setFullscreenOpen: (open) => set({ fullscreenOpen: open }),
  setSleepTimerMinutes: (minutes) => set({ sleepTimerMinutes: minutes }),
  setSleepTimerEnd: (end) => set({ sleepTimerEnd: end }),
  setPlayerVisible: (visible) => set({ playerVisible: visible }),
}))
