"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Search, Loader2 } from "lucide-react"

interface EmojiPickerProps {
  onSelect: (emoji: string) => void
  onGifSelect?: (url: string) => void
  className?: string
}

interface GifItem {
  id: string
  title: string
  url: string
  preview: string
  width: number
  height: number
}

const EMOJI_CATEGORIES = [
  {
    name: "Recent",
    icon: "🕐",
    emojis: [] as string[],
  },
  {
    name: "Smileys",
    icon: "😃",
    emojis: ["😀", "😃", "😄", "😁", "😅", "😂", "🤣", "😊", "😇", "🙂", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🤫", "🤔", "🤐", "🤨", "😐", "😑"],
  },
  {
    name: "Gestures",
    icon: "👍",
    emojis: ["👍", "👎", "👌", "✌️", "🤞", "🤟", "🤘", "🤙", "👋", "🤚", "🖐️", "✋", "🖖", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "💪", "🦾", "🖕", "✍️", "🤳", "💅"],
  },
  {
    name: "Hearts",
    icon: "❤️",
    emojis: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝"],
  },
  {
    name: "Objects",
    icon: "🔥",
    emojis: ["⭐", "🌟", "✨", "💫", "🔥", "💯", "🎉", "🎊", "🎯", "🚀", "💡", "📌", "📎", "✅", "❌", "⚠️", "💬", "👁️‍🗨️", "🔗", "📝"],
  },
]

const RECENT_KEY = "nexus-recent-emojis"

function getRecentEmojis(): string[] {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem(RECENT_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveRecentEmoji(emoji: string) {
  try {
    const recent = getRecentEmojis().filter((e) => e !== emoji)
    recent.unshift(emoji)
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, 20)))
  } catch {}
}

export function EmojiPicker({ onSelect, onGifSelect, className }: EmojiPickerProps) {
  const [recentEmojis, setRecentEmojis] = React.useState<string[]>([])
  const [activeCategory, setActiveCategory] = React.useState(1)
  const [gifMode, setGifMode] = React.useState(false)
  const [gifSearch, setGifSearch] = React.useState("")
  const [gifs, setGifs] = React.useState<GifItem[]>([])
  const [gifLoading, setGifLoading] = React.useState(false)
  const [gifOffset, setGifOffset] = React.useState(0)
  const [hasMore, setHasMore] = React.useState(true)
  const gifContainerRef = React.useRef<HTMLDivElement>(null)
  const searchTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(() => {
    setRecentEmojis(getRecentEmojis())
  }, [])

  const handleSelect = React.useCallback((emoji: string) => {
    saveRecentEmoji(emoji)
    setRecentEmojis((prev) => [emoji, ...prev.filter((e) => e !== emoji)].slice(0, 20))
    onSelect(emoji)
  }, [onSelect])

  const searchGifs = React.useCallback(async (query: string, offset = 0, append = false) => {
    setGifLoading(true)
    try {
      const url = query.trim()
        ? `/api/gif/search?q=${encodeURIComponent(query)}&offset=${offset}&limit=24`
        : `/api/gif/search?q=funny&offset=${offset}&limit=24`
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        const newGifs = data.gifs || []
        setGifs(prev => append ? [...prev, ...newGifs] : newGifs)
        setHasMore(newGifs.length === 24)
        setGifOffset(offset + newGifs.length)
      }
    } catch {
      if (!append) setGifs([])
    } finally {
      setGifLoading(false)
    }
  }, [])

  React.useEffect(() => {
    if (!gifMode) return
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => {
      setGifOffset(0)
      setHasMore(true)
      searchGifs(gifSearch, 0, false)
    }, gifSearch ? 400 : 0)
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    }
  }, [gifSearch, gifMode, searchGifs])

  const handleGifScroll = React.useCallback(() => {
    const container = gifContainerRef.current
    if (!container || gifLoading || !hasMore) return
    if (container.scrollTop + container.clientHeight >= container.scrollHeight - 40) {
      searchGifs(gifSearch, gifOffset, true)
    }
  }, [gifSearch, gifOffset, gifLoading, hasMore, searchGifs])

  const displayCategories = recentEmojis.length > 0 ? EMOJI_CATEGORIES : EMOJI_CATEGORIES.filter((_, i) => i !== 0)
  const showRecent = activeCategory === 0 && recentEmojis.length > 0

  return (
    <div
      className={cn(
        "flex w-72 flex-col overflow-hidden rounded-lg border bg-background shadow-lg",
        className
      )}
    >
      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b px-2 py-1.5">
        <button
          className={cn(
            "flex size-7 items-center justify-center rounded text-sm font-medium transition-colors hover:bg-muted",
            !gifMode && "bg-muted"
          )}
          onClick={() => setGifMode(false)}
        >
          😀
        </button>
        <button
          className={cn(
            "flex size-7 items-center justify-center rounded text-xs font-bold transition-colors hover:bg-muted",
            gifMode && "bg-muted"
          )}
          onClick={() => setGifMode(true)}
        >
          GIF
        </button>
        {!gifMode && (
          <div className="ml-auto flex gap-0.5">
            {displayCategories.map((cat, i) => (
              <button
                key={cat.name}
                title={cat.name}
                className={cn(
                  "flex size-7 items-center justify-center rounded text-base transition-colors hover:bg-muted",
                  activeCategory === i && "bg-muted"
                )}
                onClick={() => setActiveCategory(i)}
              >
                {cat.icon}
              </button>
            ))}
          </div>
        )}
        {gifMode && (
          <div className="ml-auto flex-1 max-w-44">
            <div className="relative">
              <Search className="absolute left-1.5 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={gifSearch}
                onChange={(e) => setGifSearch(e.target.value)}
                placeholder="Search GIFs..."
                className="h-7 pl-6 text-xs"
                autoFocus
              />
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      {gifMode ? (
        <div
          ref={gifContainerRef}
          onScroll={handleGifScroll}
          className="h-52 overflow-y-auto p-1"
        >
          {gifs.length === 0 && !gifLoading ? (
            <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
              {gifSearch ? "No GIFs found" : "Loading trending GIFs..."}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1">
              {gifs.map((gif) => (
                <button
                  key={gif.id}
                  className="group relative overflow-hidden rounded-md bg-muted"
                  onClick={() => {
                    if (onGifSelect) {
                      onGifSelect(gif.url)
                    } else {
                      onSelect(gif.url)
                    }
                  }}
                >
                  <img
                    src={gif.preview || gif.url}
                    alt={gif.title}
                    className="h-20 w-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </button>
              ))}
            </div>
          )}
          {gifLoading && (
            <div className="flex items-center justify-center py-3">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      ) : (
        <div className="h-52 overflow-y-auto p-2">
          {showRecent && (
            <div className="grid grid-cols-8 gap-0.5">
              {recentEmojis.map((emoji, i) => (
                <button
                  key={`${emoji}-${i}`}
                  className="flex size-8 items-center justify-center rounded text-lg transition-colors hover:bg-muted"
                  onClick={() => handleSelect(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
          {!showRecent && (
            <div className="grid grid-cols-8 gap-0.5">
              {(displayCategories.find((_, i) => {
                const idx = recentEmojis.length > 0 ? activeCategory : activeCategory
                return i === idx
              })?.emojis || []).map((emoji) => (
                <button
                  key={emoji}
                  className="flex size-8 items-center justify-center rounded text-lg transition-colors hover:bg-muted"
                  onClick={() => handleSelect(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
