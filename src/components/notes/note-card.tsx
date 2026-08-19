"use client"

import Link from "next/link"
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
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, FileText } from "lucide-react"

interface NoteCardProps {
  note: Note & { tags: NoteTag[] }
}

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return "just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

export function NoteCard({ note }: NoteCardProps) {
  const preview = note.content.slice(0, 100) || "Empty note"

  return (
    <Link href={`/notes/${note.id}`}>
      <Card className="cursor-pointer transition-colors hover:bg-muted/50">
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="size-4 shrink-0 text-muted-foreground" />
              <h3 className="truncate text-sm font-medium text-foreground">
                {note.title}
              </h3>
            </div>
            {note.isPublished && (
              <Badge variant="secondary" className="shrink-0">
                Published
              </Badge>
            )}
          </div>
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {preview}
          </p>
          {note.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {note.tags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  className="text-xs"
                  style={
                    tag.color
                      ? {
                          borderColor: tag.color,
                          color: tag.color,
                        }
                      : undefined
                  }
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="size-3" />
            {formatRelativeTime(new Date(note.updatedAt))}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
