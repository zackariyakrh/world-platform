"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { EmojiPicker } from "@/components/chat/emoji-picker"
import { PickerPopup } from "@/components/ui/picker-popup"
import { cn } from "@/lib/utils"
import {
  Send,
  Paperclip,
  Smile,
  Code,
} from "lucide-react"

interface MessageInputProps {
  onSend: (content: string) => void
  placeholder?: string
  disabled?: boolean
}

export function MessageInput({ onSend, placeholder = "Type a message...", disabled }: MessageInputProps) {
  const [value, setValue] = React.useState("")
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  const adjustHeight = React.useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = "auto"
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
  }, [])

  React.useEffect(() => {
    adjustHeight()
  }, [value, adjustHeight])

  const handleSubmit = React.useCallback(() => {
    if (!value.trim() || disabled) return
    onSend(value.trim())
    setValue("")
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }, [value, disabled, onSend])

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSubmit()
      }
    },
    [handleSubmit]
  )

  const handleEmojiSelect = React.useCallback((emoji: string) => {
    setValue((prev) => prev + emoji)
    setShowEmojiPicker(false)
    textareaRef.current?.focus()
  }, [])

  const insertCodeBlock = React.useCallback(() => {
    setValue((prev) => prev + "```\n\n```")
    setShowEmojiPicker(false)
    setTimeout(() => {
      const textarea = textareaRef.current
      if (textarea) {
        textarea.selectionStart = textarea.selectionEnd = textarea.value.length - 4
        textarea.focus()
      }
    }, 0)
  }, [])

  return (
    <div className="relative border-t bg-background px-4 py-3 shadow-[0_-1px_2px_oklch(from_var(--glow)_l_c_h_/_0.04)]">
      <div className="glow-input flex items-end gap-2 rounded-lg border bg-muted/50 px-3 py-2 transition-all duration-300">
        <div className="flex shrink-0 items-center gap-0.5">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={disabled}
                  />
                }
              >
                <Paperclip className="size-4" />
              </TooltipTrigger>
              <TooltipContent side="top">Attach file</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="relative">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={disabled}
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    />
                  }
                >
                  <Smile className="size-4" />
                </TooltipTrigger>
                <TooltipContent side="top">Emoji & GIFs</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <PickerPopup open={showEmojiPicker} onClose={() => setShowEmojiPicker(false)} className="absolute bottom-full left-0 z-20 mb-2">
              <EmojiPicker
                onSelect={handleEmojiSelect}
                onGifSelect={(url) => {
                  onSend(url)
                  setShowEmojiPicker(false)
                }}
              />
            </PickerPopup>
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={disabled}
                    onClick={insertCodeBlock}
                  />
                }
              >
                <Code className="size-4" />
              </TooltipTrigger>
              <TooltipContent side="top">Code block</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="min-h-[24px] max-h-[200px] flex-1 resize-none border-0 bg-transparent p-0 text-sm shadow-none placeholder:text-muted-foreground/40 focus-visible:border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          rows={1}
        />

        <Button
          variant="ghost"
          size="icon-sm"
          disabled={!value.trim() || disabled}
          onClick={handleSubmit}
          className="shrink-0 transition-all duration-300 hover:text-primary hover:drop-shadow-[0_0_6px_oklch(from_var(--primary)_l_c_h_/_0.5)]"
        >
          <Send className="size-4" />
        </Button>
      </div>

      <div className="mt-1 text-[10px] text-muted-foreground">
        <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[10px]">Enter</kbd>
        {" "}to send, {" "}
        <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[10px]">Shift+Enter</kbd>
        {" "}for new line
      </div>
    </div>
  )
}
