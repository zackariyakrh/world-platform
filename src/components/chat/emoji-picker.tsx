"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface EmojiPickerProps {
  onSelect: (emoji: string) => void
  className?: string
}

const EMOJI_CATEGORIES = [
  {
    name: "Smileys",
    emojis: ["😀", "😃", "😄", "😁", "😅", "😂", "🤣", "😊", "😇", "🙂", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🤫", "🤔", "🤐", "🤨", "😐", "😑"],
  },
  {
    name: "Gestures",
    emojis: ["👍", "👎", "👌", "✌️", "🤞", "🤟", "🤘", "🤙", "👋", "🤚", "🖐️", "✋", "🖖", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "💪", "🦾", "🖕", "✍️", "🤳", "💅"],
  },
  {
    name: "Hearts",
    emojis: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝"],
  },
  {
    name: "Objects",
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

export function EmojiPicker({ onSelect, className }: EmojiPickerProps) {
  const [recentEmojis, setRecentEmojis] = React.useState<string[]>([])
  const [activeCategory, setActiveCategory] = React.useState(0)

  React.useEffect(() => {
    setRecentEmojis(getRecentEmojis())
  }, [])

  const handleSelect = React.useCallback((emoji: string) => {
    saveRecentEmoji(emoji)
    setRecentEmojis((prev) => [emoji, ...prev.filter((e) => e !== emoji)].slice(0, 20))
    onSelect(emoji)
  }, [onSelect])

  return (
    <div
      className={cn(
        "flex w-72 flex-col overflow-hidden rounded-lg border bg-background shadow-lg",
        className
      )}
    >
      <div className="flex gap-1 border-b px-2 py-1.5">
        {recentEmojis.length > 0 && (
          <button
            className={cn(
              "rounded px-2 py-1 text-xs font-medium transition-colors hover:bg-muted",
              activeCategory === -1 && "bg-muted"
            )}
            onClick={() => setActiveCategory(-1)}
          >
            Recent
          </button>
        )}
        {EMOJI_CATEGORIES.map((cat, i) => (
          <button
            key={cat.name}
            className={cn(
              "rounded px-2 py-1 text-xs font-medium transition-colors hover:bg-muted",
              activeCategory === i && "bg-muted"
            )}
            onClick={() => setActiveCategory(i)}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="h-48 overflow-y-auto p-2">
        {activeCategory === -1 && recentEmojis.length > 0 && (
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

        {activeCategory >= 0 && EMOJI_CATEGORIES[activeCategory] && (
          <div className="grid grid-cols-8 gap-0.5">
            {EMOJI_CATEGORIES[activeCategory].emojis.map((emoji) => (
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
    </div>
  )
}
