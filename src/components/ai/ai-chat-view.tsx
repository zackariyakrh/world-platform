"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { AIMessage } from "@/components/ai/ai-message"
import { ModelSelector } from "@/components/ai/model-selector"
import { Send, Plus, Loader2, Sparkles } from "lucide-react"

interface AIModelProvider {
  id: string
  name: string
  displayName: string
}

interface AIModelData {
  id: string
  name: string
  displayName: string
  modelId: string
  providerId: string
  provider: AIModelProvider
}

interface AIMessageData {
  id: string
  content: string
  role: string
  modelId?: string | null
  sources?: string | null
  createdAt: string
}

interface AIChatViewProps {
  conversationId: string
  initialMessages: AIMessageData[]
  availableModels: AIModelData[]
  currentModel?: AIModelData | null
}

export function AIChatView({
  conversationId,
  initialMessages,
  availableModels,
  currentModel,
}: AIChatViewProps) {
  const router = useRouter()
  const [messages, setMessages] = React.useState<AIMessageData[]>(initialMessages)
  const [input, setInput] = React.useState("")
  const [isSending, setIsSending] = React.useState(false)
  const [selectedModelId, setSelectedModelId] = React.useState<string | undefined>(
    currentModel?.id
  )
  const bottomRef = React.useRef<HTMLDivElement>(null)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = React.useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  React.useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const handleSend = React.useCallback(async () => {
    const trimmed = input.trim()
    if (!trimmed || isSending) return

    const userMessage: AIMessageData = {
      id: `temp-${Date.now()}`,
      content: trimmed,
      role: "user",
      createdAt: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsSending(true)

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          content: trimmed,
          modelId: selectedModelId,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => null)
        throw new Error(errorData?.error || "Failed to send message")
      }

      const data = await res.json()

      setMessages((prev) => {
        const withoutTemp = prev.filter((m) => m.id !== userMessage.id)
        return [
          ...withoutTemp,
          {
            ...userMessage,
            id: `user-${Date.now()}`,
          },
          data.message,
        ]
      })
    } catch (error) {
      console.error("Chat error:", error)
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id))
      setInput(trimmed)
    } finally {
      setIsSending(false)
      textareaRef.current?.focus()
    }
  }, [input, isSending, conversationId, selectedModelId])

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  const handleNewConversation = React.useCallback(() => {
    router.push("/ai")
  }, [router])

  const handleModelChange = React.useCallback(async (modelId: string) => {
    setSelectedModelId(modelId)
  }, [])

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <ModelSelector
          models={availableModels}
          selectedModelId={selectedModelId}
          onSelect={handleModelChange}
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={handleNewConversation}
          className="gap-1.5"
        >
          <Plus className="size-3.5" />
          New Chat
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="mx-auto max-w-3xl flex flex-col gap-1 py-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10">
                <Sparkles className="size-7 text-primary" />
              </div>
              <h3 className="mb-1 text-lg font-semibold">Start a conversation</h3>
              <p className="max-w-sm text-sm text-muted-foreground">
                Ask me anything. I can help with your work tasks, answer questions,
                and provide insights from your workspace.
              </p>
            </div>
          )}

          {messages.map((message) => (
            <AIMessage key={message.id} message={message} />
          ))}

          {isSending && (
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Loader2 className="size-4 animate-spin" />
              </div>
              <div className="rounded-2xl rounded-bl-md border bg-card px-4 py-2.5">
                <span className="text-sm text-muted-foreground animate-pulse">
                  Thinking...
                </span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <div className="border-t bg-background p-4">
        <div className="mx-auto max-w-3xl">
          <div className="relative flex items-end gap-2 rounded-xl border bg-muted/30 px-3 py-2 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="min-h-[40px] max-h-[200px] flex-1 resize-none border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:outline-none"
              rows={1}
              disabled={isSending}
            />
            <Button
              size="icon-sm"
              onClick={handleSend}
              disabled={!input.trim() || isSending}
              className="shrink-0"
            >
              {isSending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
            </Button>
          </div>
          <p className="mt-1.5 text-center text-[10px] text-muted-foreground/60">
            AI can make mistakes. Verify important information.
          </p>
        </div>
      </div>
    </div>
  )
}
