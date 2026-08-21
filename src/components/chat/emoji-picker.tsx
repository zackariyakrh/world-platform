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
    name: "Recent",
    icon: "🕐",
    emojis: [],
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

export function EmojiPicker({ onSelect, className }: EmojiPickerProps) {
  const [recentEmojis, setRecentEmojis] = React.useState<string[]>([])
  const [activeCategory, setActiveCategory] = React.useState(1)

  React.useEffect(() => {
    setRecentEmojis(getRecentEmojis())
  }, [])

  const handleSelect = React.useCallback((emoji: string) => {
    saveRecentEmoji(emoji)
    setRecentEmojis((prev) => [emoji, ...prev.filter((e) => e !== emoji)].slice(0, 20))
    onSelect(emoji)
  }, [onSelect])

  const recentCategory = EMOJI_CATEGORIES[0]
  const displayCategories = recentEmojis.length > 0 ? EMOJI_CATEGORIES : EMOJI_CATEGORIES.filter((_, i) => i !== 0)
  const currentCategory = displayCategories.find((_, i) => {
    if (activeCategory === 0 && recentEmojis.length > 0) return true
    const realIndex = recentEmojis.length > 0 ? activeCategory : activeCategory
    return displayCategories[realIndex] === _
  })
  const showRecent = activeCategory === 0 && recentEmojis.length > 0

  return (
    <div
      className={cn(
        "flex w-72 flex-col overflow-hidden rounded-lg border bg-background shadow-lg",
        className
      )}
    >
      <div className="flex gap-1 border-b px-2 py-1.5">
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

      <div className="h-48 overflow-y-auto p-2">
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
            {(displayCategories[recentEmojis.length > 0 ? activeCategory : activeCategory]?.emojis || []).map((emoji) => (
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
