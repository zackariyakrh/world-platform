"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Copy, Check, Bot, User, ExternalLink } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface AIMessageData {
  id: string
  content: string
  role: string
  sources?: string | null
  createdAt: string
}

interface AIMessageProps {
  message: AIMessageData
}

function parseMarkdown(content: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  const regex =
    /```(\w*)\n?([\s\S]*?)```|`([^`]+)`|\*\*([^*]+)\*\*|\*([^*]+)\*|^### (.+)$|^## (.+)$|^# (.+)$/gm
  let lastIndex = 0
  let match: RegExpExecArray | null
  let key = 0

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      const text = content.slice(lastIndex, match.index)
      if (text) parts.push(<span key={key++}>{text}</span>)
    }

    if (match[2] !== undefined) {
      parts.push(
        <pre
          key={key++}
          className="my-2 overflow-x-auto rounded-lg bg-muted px-4 py-3 text-sm font-mono"
        >
          {match[1] && (
            <div className="mb-1 border-b text-[10px] uppercase text-muted-foreground">
              {match[1]}
            </div>
          )}
          <code>{match[2].trim()}</code>
        </pre>
      )
    } else if (match[3] !== undefined) {
      parts.push(
        <code
          key={key++}
          className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono"
        >
          {match[3]}
        </code>
      )
    } else if (match[4] !== undefined) {
      parts.push(
        <strong key={key++} className="font-semibold">
          {match[4]}
        </strong>
      )
    } else if (match[5] !== undefined) {
      parts.push(
        <em key={key++} className="italic">
          {match[5]}
        </em>
      )
    } else if (match[6] !== undefined) {
      parts.push(
        <h3 key={key++} className="mt-4 mb-2 text-base font-semibold">
          {match[6]}
        </h3>
      )
    } else if (match[7] !== undefined) {
      parts.push(
        <h2 key={key++} className="mt-4 mb-2 text-lg font-semibold">
          {match[7]}
        </h2>
      )
    } else if (match[8] !== undefined) {
      parts.push(
        <h1 key={key++} className="mt-4 mb-2 text-xl font-bold">
          {match[8]}
        </h1>
      )
    }

    lastIndex = match.index + match[0].length
  }

  if (lastIndex < content.length) {
    const remaining = content.slice(lastIndex)
    if (remaining) parts.push(<span key={key++}>{remaining}</span>)
  }

  return parts.length > 0 ? parts : [content]
}

export function AIMessage({ message }: AIMessageProps) {
  const [copied, setCopied] = React.useState(false)
  const isUser = message.role === "user"

  const handleCopy = React.useCallback(() => {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [message.content])

  let sources: { title: string; url?: string }[] = []
  if (message.sources) {
    try {
      sources = JSON.parse(message.sources)
    } catch {
      // ignore invalid JSON
    }
  }

  return (
    <div
      className={cn(
        "group/message flex gap-3 px-4 py-3",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Bot className="size-4" />
        </div>
      )}

      <div
        className={cn(
          "relative max-w-[75%] min-w-0",
          isUser
            ? "rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-primary-foreground"
            : "rounded-2xl rounded-bl-md border bg-card px-4 py-2.5 text-card-foreground"
        )}
      >
        <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
          {isUser
            ? message.content
            : parseMarkdown(message.content)}
        </div>

        {!isUser && sources.length > 0 && (
          <div className="mt-3 border-t pt-2">
            <p className="mb-1 text-[10px] font-medium uppercase text-muted-foreground">
              Sources
            </p>
            <div className="flex flex-wrap gap-1">
              {sources.map((source, i) => (
                <Badge key={i} variant="secondary" className="text-[10px]">
                  {source.url ? (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1"
                    >
                      {source.title}
                      <ExternalLink className="size-2.5" />
                    </a>
                  ) : (
                    source.title
                  )}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div
          className={cn(
            "mt-1 flex items-center gap-2",
            isUser ? "justify-end" : "justify-between"
          )}
        >
          <span className="text-[10px] text-muted-foreground/60">
            {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
          </span>

          {!isUser && (
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handleCopy}
              className="opacity-0 group-hover/message:opacity-100 transition-opacity"
            >
              {copied ? (
                <Check className="size-3 text-green-500" />
              ) : (
                <Copy className="size-3" />
              )}
            </Button>
          )}
        </div>
      </div>

      {isUser && (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <User className="size-4" />
        </div>
      )}
    </div>
  )
}
