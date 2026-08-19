"use client"

import { useState, useCallback, useEffect, useRef } from "react"
interface NoteTag {
  id: string
  name: string
  color: string | null
  noteId: string
}

interface Note {
  id: string
  title: string
  content: string
  isPublished: boolean
  updatedAt: Date | string
  tags: NoteTag[]
}
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Save, X, Check, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface NoteEditorProps {
  note?: Note & { tags: NoteTag[] }
  onSave: (note: Note & { tags: NoteTag[] }) => void
}

type SaveStatus = "idle" | "saving" | "saved" | "error"

export function NoteEditor({ note, onSave }: NoteEditorProps) {
  const [title, setTitle] = useState(note?.title || "")
  const [content, setContent] = useState(note?.content || "")
  const [isPublished, setIsPublished] = useState(note?.isPublished || false)
  const [tags, setTags] = useState<NoteTag[]>(note?.tags || [])
  const [tagInput, setTagInput] = useState("")
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle")
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const saveNote = useCallback(
    async (data: { title: string; content: string; isPublished: boolean; tags: { name: string; color?: string }[] }) => {
      setSaveStatus("saving")
      try {
        const url = note ? `/api/notes/${note.id}` : "/api/notes"
        const method = note ? "PATCH" : "POST"

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })

        if (!res.ok) throw new Error("Failed to save")

        const saved = await res.json()
        setSaveStatus("saved")
        onSave(saved)

        setTimeout(() => setSaveStatus("idle"), 2000)
      } catch {
        setSaveStatus("error")
        toast.error("Failed to save note")
      }
    },
    [note, onSave]
  )

  const handleAutoSave = useCallback(
    (newTitle: string, newContent: string) => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
      autoSaveTimer.current = setTimeout(() => {
        if (newTitle.trim()) {
          saveNote({
            title: newTitle,
            content: newContent,
            isPublished,
            tags: tags.map((t) => ({ name: t.name, color: t.color || undefined })),
          })
        }
      }, 3000)
    },
    [isPublished, tags, saveNote]
  )

  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    }
  }, [])

  const handleAddTag = () => {
    const name = tagInput.trim()
    if (!name || tags.some((t) => t.name.toLowerCase() === name.toLowerCase())) {
      setTagInput("")
      return
    }

    const colors = ["#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f97316", "#22c55e", "#06b6d4", "#3b82f6"]
    const color = colors[tags.length % colors.length]

    const newTag: NoteTag = {
      id: `temp-${Date.now()}`,
      name,
      color,
      noteId: note?.id || "",
    }

    setTags([...tags, newTag])
    setTagInput("")
  }

  const handleRemoveTag = (tagId: string) => {
    setTags(tags.filter((t) => t.id !== tagId))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddTag()
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <Input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
            handleAutoSave(e.target.value, content)
          }}
          placeholder="Untitled note"
          className="h-auto border-none bg-transparent px-0 text-xl font-semibold focus-visible:ring-0 focus-visible:ring-offset-0 md:text-2xl"
        />
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {saveStatus === "saving" && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Loader2 className="size-3 animate-spin" />
                Saving...
              </span>
            )}
            {saveStatus === "saved" && (
              <span className="flex items-center gap-1 text-xs text-green-500">
                <Check className="size-3" />
                Saved
              </span>
            )}
            {saveStatus === "error" && (
              <span className="text-xs text-red-500">Failed to save</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="published" className="text-xs text-muted-foreground">
              Published
            </Label>
            <Switch
              id="published"
              size="sm"
              checked={isPublished}
              onCheckedChange={(checked) => {
                setIsPublished(checked)
                saveNote({ title, content, isPublished: checked, tags: tags.map((t) => ({ name: t.name, color: t.color || undefined })) })
              }}
            />
          </div>
          <Button
            size="sm"
            onClick={() =>
              saveNote({
                title,
                content,
                isPublished,
                tags: tags.map((t) => ({ name: t.name, color: t.color || undefined })),
              })
            }
            disabled={saveStatus === "saving"}
          >
            <Save className="size-3.5" />
            Save
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Badge
            key={tag.id}
            variant="outline"
            className="gap-1"
            style={
              tag.color
                ? { borderColor: tag.color, color: tag.color }
                : undefined
            }
          >
            {tag.name}
            <button
              onClick={() => handleRemoveTag(tag.id)}
              className="ml-0.5 rounded-full p-0.5 hover:bg-muted"
            >
              <X className="size-2.5" />
            </button>
          </Badge>
        ))}
        <Input
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add tag..."
          className="h-6 w-24 border-dashed text-xs focus-visible:ring-0"
        />
      </div>

      <Textarea
        value={content}
        onChange={(e) => {
          setContent(e.target.value)
          handleAutoSave(title, e.target.value)
        }}
        placeholder="Start writing... (Markdown supported)"
        className="min-h-[400px] resize-none border-none bg-transparent px-0 text-sm leading-relaxed focus-visible:ring-0 focus-visible:ring-offset-0"
      />
    </div>
  )
}
