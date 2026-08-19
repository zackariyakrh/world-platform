"use client"

import * as React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { MessageInput } from "@/components/chat/message-input"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface ThreadUser {
  id: string
  name: string | null
  username: string | null
  avatar: string | null
}

interface ThreadMessageData {
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
  user: ThreadUser
  reactions?: { id: string; emoji: string }[]
  replies?: { id: string }[]
}

interface ThreadPanelProps {
  parentMessage: ThreadMessageData
  threadId?: string
  onClose: () => void
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

function ParentMessage({ message }: { message: ThreadMessageData }) {
  const initials = message.user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?"

  return (
    <div className="flex gap-3 px-4 py-3">
      <Avatar size="default">
        <AvatarImage src={message.user.avatar || undefined} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold">
            {message.user.name || message.user.username || "Unknown"}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
          </span>
        </div>
        <div className="mt-0.5 text-sm leading-relaxed">
          <div className="whitespace-pre-wrap break-words">{parseMarkdown(message.content)}</div>
        </div>
      </div>
    </div>
  )
}

export function ThreadPanel({ parentMessage, threadId, onClose }: ThreadPanelProps) {
  const [replies, setReplies] = React.useState<ThreadMessageData[]>([])
  const [isSending, setIsSending] = React.useState(false)
  const bottomRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    async function fetchReplies() {
      try {
        const res = await fetch(`/api/messages?threadId=${threadId || parentMessage.id}`)
        if (res.ok) {
          const data = await res.json()
          setReplies(data.messages || [])
        }
      } catch (err) {
        console.error("Failed to fetch thread replies:", err)
      }
    }
    fetchReplies()
  }, [threadId, parentMessage.id])

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [replies])

  const handleSend = React.useCallback(
    async (content: string) => {
      if (!content.trim() || isSending) return

      setIsSending(true)
      try {
        const res = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            channelId: parentMessage.channelId,
            content,
            replyToId: parentMessage.id,
          }),
        })

        if (!res.ok) throw new Error("Failed to send reply")

        const newReply = await res.json()
        setReplies((prev) => [...prev, newReply])
      } catch (error) {
        console.error("Failed to send reply:", error)
      } finally {
        setIsSending(false)
      }
    },
    [parentMessage.channelId, parentMessage.id, isSending]
  )

  const parentInitials = parentMessage.user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?"

  return (
    <div className="flex h-full w-80 flex-col border-l bg-background">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-sm font-semibold">Thread</h3>
        <Button variant="ghost" size="icon-sm" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col">
          <ParentMessage message={parentMessage} />
          <Separator />

          {replies.length > 0 && (
            <div className="px-4 py-2 text-xs text-muted-foreground">
              {replies.length} {replies.length === 1 ? "reply" : "replies"}
            </div>
          )}

          {replies.map((reply) => {
            const replyInitials = reply.user.name
              ?.split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2) || "?"

            return (
              <div key={reply.id} className="flex gap-3 px-4 py-2">
                <Avatar size="sm">
                  <AvatarImage src={reply.user.avatar || undefined} />
                  <AvatarFallback>{replyInitials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold">
                      {reply.user.name || reply.user.username || "Unknown"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="mt-0.5 text-sm leading-relaxed">
                    <div className="whitespace-pre-wrap break-words">{parseMarkdown(reply.content)}</div>
                  </div>
                </div>
              </div>
            )
          })}

          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <MessageInput
        onSend={handleSend}
        placeholder="Reply..."
        disabled={isSending}
      />
    </div>
  )
}
