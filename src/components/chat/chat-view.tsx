"use client"

import * as React from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChatMessage } from "@/components/chat/chat-message"
import { MessageInput } from "@/components/chat/message-input"
import { ThreadPanel } from "@/components/chat/thread-panel"

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

interface ChatMessageData {
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

interface ChatChannel {
  id: string
  name: string
  topic: string | null
  memberCount: number
}

interface ChatViewProps {
  channelId: string
  initialMessages: ChatMessageData[]
  channel: ChatChannel
}

export function ChatView({ channelId, initialMessages, channel }: ChatViewProps) {
  const [messages, setMessages] = React.useState<ChatMessageData[]>(initialMessages)
  const [isSending, setIsSending] = React.useState(false)
  const [typingUsers, setTypingUsers] = React.useState<string[]>([])
  const [threadMessage, setThreadMessage] = React.useState<ChatMessageData | null>(null)
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const bottomRef = React.useRef<HTMLDivElement>(null)

  const scrollToBottom = React.useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  React.useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const handleSend = React.useCallback(
    async (content: string) => {
      if (!content.trim() || isSending) return

      setIsSending(true)
      try {
        const res = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ channelId, content }),
        })

        if (!res.ok) throw new Error("Failed to send message")

        const newMessage = await res.json()
        setMessages((prev) => [...prev, newMessage])
      } catch (error) {
        console.error("Failed to send message:", error)
      } finally {
        setIsSending(false)
      }
    },
    [channelId, isSending]
  )

  const handleThreadOpen = React.useCallback((message: ChatMessageData) => {
    setThreadMessage(message)
  }, [])

  const handleThreadClose = React.useCallback(() => {
    setThreadMessage(null)
  }, [])

  return (
    <div className="flex min-h-0 flex-1">
      <div className="flex min-h-0 flex-1 flex-col">
        {channel.topic && (
          <div className="flex items-center gap-2 border-b px-4 py-1.5 text-xs text-muted-foreground">
            <span>{channel.topic}</span>
          </div>
        )}

        <ScrollArea className="flex-1" ref={scrollRef}>
          <div className="flex flex-col gap-0.5 p-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted text-2xl">
                  #
                </div>
                <h3 className="mb-1 text-lg font-semibold">
                  Welcome to #{channel.name}
                </h3>
                <p className="max-w-sm text-sm text-muted-foreground">
                  This is the start of the conversation. Send a message to get things going!
                </p>
              </div>
            )}

            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                onReply={() => handleThreadOpen(message)}
              />
            ))}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>

        {typingUsers.length > 0 && (
          <div className="h-6 px-4 text-xs text-muted-foreground">
            {typingUsers.length === 1
              ? `${typingUsers[0]} is typing...`
              : `${typingUsers.join(", ")} are typing...`}
          </div>
        )}

        <MessageInput
          onSend={handleSend}
          placeholder={`Message #${channel.name}`}
          disabled={isSending}
        />
      </div>

      {threadMessage && (
        <ThreadPanel
          parentMessage={threadMessage}
          onClose={handleThreadClose}
        />
      )}
    </div>
  )
}
