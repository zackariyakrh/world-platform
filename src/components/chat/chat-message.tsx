"use client"

import * as React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import {
  MessageSquare,
  Smile,
  Bookmark,
  MoreHorizontal,
  Pin,
  Pencil,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { EmojiPicker } from "@/components/chat/emoji-picker"
import { PickerPopup } from "@/components/ui/picker-popup"
import { toast } from "sonner"

interface ChatUser {
  id: string
  name: string | null
  username: string | null
  avatar: string | null
}

interface ChatReaction {
  id: string
  emoji: string
  messageId: string
  userId: string
  user: ChatUser
}

interface MessageData {
  id: string
  content: string
  type: string
  isEdited: boolean
  isPinned: boolean
  isDeleted: boolean
  channelId: string | null
  userId: string
  threadId: string | null
  replyToId: string | null
  parentId: string | null
  workspaceId: string | null
  createdAt: string
  updatedAt: string
  user: ChatUser
  reactions?: ChatReaction[]
  replies?: { id: string }[]
}

interface ChatMessageProps {
  message: MessageData
  onReply?: () => void
}

function parseMarkdown(content: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  const regex = /```([\s\S]*?)```|`([^`]+)`|\*\*([^*]+)\*\*|\*([^*]+)\*/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index))
    }

    if (match[1] !== undefined) {
      parts.push(
        <pre
          key={match.index}
          className="my-1 overflow-x-auto rounded-md bg-muted px-3 py-2 text-sm font-mono"
        >
          <code>{match[1].trim()}</code>
        </pre>
      )
    } else if (match[2] !== undefined) {
      parts.push(
        <code
          key={match.index}
          className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono"
        >
          {match[2]}
        </code>
      )
    } else if (match[3] !== undefined) {
      parts.push(
        <strong key={match.index} className="font-semibold">
          {match[3]}
        </strong>
      )
    } else if (match[4] !== undefined) {
      parts.push(
        <em key={match.index} className="italic">
          {match[4]}
        </em>
      )
    }

    lastIndex = match.index + match[0].length
  }

  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex))
  }

  return parts.length > 0 ? parts : [content]
}

function groupReactions(reactions: ChatReaction[]) {
  const grouped: Record<string, { emoji: string; count: number; userIds: string[] }> = {}
  for (const r of reactions) {
    if (!grouped[r.emoji]) {
      grouped[r.emoji] = { emoji: r.emoji, count: 0, userIds: [] }
    }
    grouped[r.emoji].count++
    grouped[r.emoji].userIds.push(r.userId)
  }
  return Object.values(grouped)
}

export function ChatMessage({ message, onReply }: ChatMessageProps) {
  const [showActions, setShowActions] = React.useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false)
  const [bookmarked, setBookmarked] = React.useState(false)

  async function handleBookmark() {
    if (bookmarked) return
    try {
      const res = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "message",
          refId: message.id,
          title: message.content.slice(0, 100),
          category: message.channelId ?? undefined,
        }),
      })
      if (res.ok) {
        setBookmarked(true)
        toast.success("Bookmarked")
      } else {
        const data = await res.json()
        if (res.status === 409) {
          setBookmarked(true)
        } else {
          toast.error(data.error || "Failed to bookmark")
        }
      }
    } catch {
      toast.error("Failed to bookmark")
    }
  }

  const initials = message.user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?"

  const groupedReactions = groupReactions(message.reactions || [])
  const replyCount = message.replies?.length ?? 0

  const timeAgo = formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })

  return (
    <div
      className="group/message relative flex gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-muted/50"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false)
        setShowEmojiPicker(false)
      }}
    >
      <Avatar size="default">
        <AvatarImage src={message.user.avatar || undefined} alt={message.user.name || "User"} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold">
            {message.user.name || message.user.username || "Unknown"}
          </span>
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
          {message.isEdited && (
            <span className="text-xs text-muted-foreground">(edited)</span>
          )}
          {message.isPinned && (
            <Pin className="size-3 text-muted-foreground" />
          )}
        </div>

        <div className="mt-0.5 text-base leading-relaxed">
          {message.isDeleted ? (
            <span className="italic text-muted-foreground">This message was deleted</span>
          ) : /^(https?:\/\/[^\s]+\.gif\b|https?:\/\/[^\s]*giphy\.com[^\s]*|https?:\/\/[^\s]*media\.tenor\.com[^\s]*)$/i.test(message.content.trim()) ? (
            <div className="overflow-hidden rounded-lg">
              <img
                src={message.content.trim()}
                alt="GIF"
                className="max-w-[280px] max-h-[200px] rounded-lg object-cover"
                loading="lazy"
              />
            </div>
          ) : (
            <div className="whitespace-pre-wrap break-words">{parseMarkdown(message.content)}</div>
          )}
        </div>

        {groupedReactions.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {groupedReactions.map((r) => (
              <button
                key={r.emoji}
                className="inline-flex items-center gap-1 rounded-full border bg-muted/50 px-2 py-0.5 text-xs transition-colors hover:bg-muted"
              >
                <span>{r.emoji}</span>
                <span className="text-muted-foreground">{r.count}</span>
              </button>
            ))}
          </div>
        )}

        {replyCount > 0 && (
          <button className="mt-1 flex items-center gap-1 text-xs text-blue-500 hover:underline">
            <MessageSquare className="size-3" />
            {replyCount} {replyCount === 1 ? "reply" : "replies"}
          </button>
        )}
      </div>

      {showActions && (
        <div className="absolute -top-3 right-2 z-10 flex items-center rounded-md border bg-background shadow-sm">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="rounded-none"
                    onClick={onReply}
                  />
                }
              >
                <MessageSquare className="size-3.5" />
              </TooltipTrigger>
              <TooltipContent side="top">Reply</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="rounded-none"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  />
                }
              >
                <Smile className="size-3.5" />
              </TooltipTrigger>
              <TooltipContent side="top">Add Reaction</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className={cn("rounded-none", bookmarked && "text-primary")}
                    onClick={handleBookmark}
                  />
                }
              >
                <Bookmark className="size-3.5" fill={bookmarked ? "currentColor" : "none"} />
              </TooltipTrigger>
              <TooltipContent side="top">{bookmarked ? "Bookmarked" : "Bookmark"}</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button variant="ghost" size="icon-xs" className="rounded-none" />
                }
              >
                <MoreHorizontal className="size-3.5" />
              </TooltipTrigger>
              <TooltipContent side="top">More</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      <PickerPopup open={showEmojiPicker} onClose={() => setShowEmojiPicker(false)} className="absolute -top-2 right-2 z-20 -translate-y-full">
        <EmojiPicker
          onSelect={(emoji) => {
            console.log("Add reaction:", emoji)
            setShowEmojiPicker(false)
          }}
        />
      </PickerPopup>
    </div>
  )
}
