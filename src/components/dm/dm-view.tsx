"use client"

import * as React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import {
  Phone,
  Video,
  MoreHorizontal,
  Send,
  Paperclip,
  Smile,
} from "lucide-react"

interface DMUser {
  id: string
  name: string | null
  username: string | null
  avatar: string | null
  status: string
}

interface DMMessageData {
  id: string
  content: string
  type: string
  isEdited: boolean
  isDeleted: boolean
  senderId: string
  createdAt: string
  updatedAt: string
}

interface DMViewProps {
  conversationId: string
  initialMessages: DMMessageData[]
  otherUser: DMUser
}

const statusColors: Record<string, string> = {
  online: "bg-emerald-500",
  away: "bg-amber-500",
  busy: "bg-red-500",
  dnd: "bg-red-500",
  offline: "bg-muted-foreground/50",
}

const statusLabels: Record<string, string> = {
  online: "Online",
  away: "Away",
  busy: "Busy",
  dnd: "Do Not Disturb",
  offline: "Offline",
}

function getInitials(name: string | null): string {
  if (!name) return "?"
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function DMView({ conversationId, initialMessages, otherUser }: DMViewProps) {
  const [messages, setMessages] = React.useState<DMMessageData[]>(initialMessages)
  const [inputValue, setInputValue] = React.useState("")
  const [isSending, setIsSending] = React.useState(false)
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const bottomRef = React.useRef<HTMLDivElement>(null)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = React.useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  React.useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const adjustHeight = React.useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = "auto"
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
  }, [])

  React.useEffect(() => {
    adjustHeight()
  }, [inputValue, adjustHeight])

  const handleSend = React.useCallback(async () => {
    if (!inputValue.trim() || isSending) return

    setIsSending(true)
    try {
      const res = await fetch(`/api/dm/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, content: inputValue.trim() }),
      })

      if (!res.ok) throw new Error("Failed to send message")

      const newMessage = await res.json()
      setMessages((prev) => [...prev, newMessage])
      setInputValue("")
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"
      }
    } catch (error) {
      console.error("Failed to send message:", error)
    } finally {
      setIsSending(false)
    }
  }, [conversationId, inputValue, isSending])

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <div className="relative">
          <Avatar>
            <AvatarImage
              src={otherUser.avatar || undefined}
              alt={otherUser.name || "User"}
            />
            <AvatarFallback>{getInitials(otherUser.name)}</AvatarFallback>
          </Avatar>
          <span
            className={cn(
              "absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full ring-2 ring-background",
              statusColors[otherUser.status] || statusColors.offline
            )}
          />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold">
            {otherUser.name || otherUser.username || "Unknown"}
          </h2>
          <p className="text-xs text-muted-foreground">
            {statusLabels[otherUser.status] || "Offline"}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger
                render={<Button variant="ghost" size="icon-sm" />}
              >
                <Phone className="size-4" />
              </TooltipTrigger>
              <TooltipContent>Voice Call</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger
                render={<Button variant="ghost" size="icon-sm" />}
              >
                <Video className="size-4" />
              </TooltipTrigger>
              <TooltipContent>Video Call</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger
                render={<Button variant="ghost" size="icon-sm" />}
              >
                <MoreHorizontal className="size-4" />
              </TooltipTrigger>
              <TooltipContent>More</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="flex flex-col gap-1 p-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Avatar size="lg" className="mb-3">
                <AvatarImage
                  src={otherUser.avatar || undefined}
                  alt={otherUser.name || "User"}
                />
                <AvatarFallback>{getInitials(otherUser.name)}</AvatarFallback>
              </Avatar>
              <h3 className="mb-1 text-lg font-semibold">
                {otherUser.name || otherUser.username}
              </h3>
              <p className="max-w-sm text-sm text-muted-foreground">
                This is the beginning of your conversation. Send a message to get started!
              </p>
            </div>
          )}

          {messages.map((message) => {
            const isOwn = message.senderId === otherUser.id ? false : true
            return (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-muted/30",
                  isOwn && "flex-row-reverse"
                )}
              >
                <div className="shrink-0">
                  <Avatar size="sm">
                    <AvatarFallback>
                      {isOwn ? "Y" : getInitials(otherUser.name)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className={cn("min-w-0 max-w-[70%]", isOwn && "text-right")}>
                  <div className={cn("text-sm leading-relaxed", isOwn && "ml-auto")}>
                    {message.isDeleted ? (
                      <span className="italic text-muted-foreground">This message was deleted</span>
                    ) : (
                      <div className="inline-block rounded-lg bg-muted/50 px-3 py-2 text-left">
                        <div className="whitespace-pre-wrap break-words">{message.content}</div>
                      </div>
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                    <span>{formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}</span>
                    {message.isEdited && <span>(edited)</span>}
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <div className="border-t bg-background px-4 py-3">
        <div className="flex items-end gap-2 rounded-lg border bg-muted/50 px-3 py-2">
          <div className="flex shrink-0 items-center gap-0.5">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button variant="ghost" size="icon-sm" disabled={isSending} />
                  }
                >
                  <Paperclip className="size-4" />
                </TooltipTrigger>
                <TooltipContent>Attach file</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button variant="ghost" size="icon-sm" disabled={isSending} />
                  }
                >
                  <Smile className="size-4" />
                </TooltipTrigger>
                <TooltipContent>Emoji</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <Textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${otherUser.name || otherUser.username || ""}`}
            disabled={isSending}
            className="min-h-[24px] max-h-[200px] flex-1 resize-none border-0 bg-transparent p-0 text-sm shadow-none focus-visible:border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            rows={1}
          />

          <Button
            variant="ghost"
            size="icon-sm"
            disabled={!inputValue.trim() || isSending}
            onClick={handleSend}
            className="shrink-0"
          >
            <Send className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
