"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Bookmark,
  MessageSquare,
  FileText,
  CheckSquare,
  File,
  Bot,
  Trash2,
  Search,
  ExternalLink,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"

interface BookmarkData {
  id: string
  type: string
  refId: string
  title: string | null
  category: string | null
  userId: string
  createdAt: string | Date
}

interface BookmarksClientProps {
  initialBookmarks: BookmarkData[]
}

const TYPE_FILTERS = [
  { value: "all", label: "All" },
  { value: "message", label: "Messages" },
  { value: "file", label: "Files" },
  { value: "task", label: "Tasks" },
  { value: "note", label: "Notes" },
  { value: "ai_response", label: "AI Responses" },
]

function getTypeIcon(type: string) {
  switch (type) {
    case "message":
      return <MessageSquare className="size-4" />
    case "file":
      return <File className="size-4" />
    case "task":
      return <CheckSquare className="size-4" />
    case "note":
      return <FileText className="size-4" />
    case "ai_response":
      return <Bot className="size-4" />
    default:
      return <Bookmark className="size-4" />
  }
}

function getTypeBadgeVariant(type: string) {
  switch (type) {
    case "message":
      return "secondary" as const
    case "file":
      return "outline" as const
    case "task":
      return "default" as const
    case "note":
      return "secondary" as const
    case "ai_response":
      return "outline" as const
    default:
      return "secondary" as const
  }
}

export function BookmarksClient({ initialBookmarks }: BookmarksClientProps) {
  const [bookmarks, setBookmarks] = useState(initialBookmarks)
  const [typeFilter, setTypeFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredBookmarks = useMemo(() => {
    return bookmarks.filter((b) => {
      const matchesType = typeFilter === "all" || b.type === typeFilter
      const matchesSearch =
        !searchQuery ||
        b.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.category?.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesType && matchesSearch
    })
  }, [bookmarks, typeFilter, searchQuery])

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/bookmarks?id=${id}`, {
        method: "DELETE",
      })

      if (!res.ok) throw new Error("Failed to delete")

      setBookmarks((prev) => prev.filter((b) => b.id !== id))
      toast.success("Bookmark removed")
    } catch {
      toast.error("Failed to remove bookmark")
    }
  }

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: bookmarks.length }
    for (const b of bookmarks) {
      counts[b.type] = (counts[b.type] || 0) + 1
    }
    return counts
  }, [bookmarks])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search bookmarks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={(v) => v && setTypeFilter(v)}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TYPE_FILTERS.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label} ({typeCounts[t.value] || 0})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ScrollArea className="h-[calc(100vh-220px)]">
        <div className="space-y-2">
          {filteredBookmarks.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-border py-12 text-center">
              <Bookmark className="size-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                {searchQuery || typeFilter !== "all"
                  ? "No matching bookmarks"
                  : "No bookmarks yet"}
              </p>
            </div>
          ) : (
            filteredBookmarks.map((bookmark) => (
              <div
                key={bookmark.id}
                className="group flex items-start gap-3 rounded-xl border p-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  {getTypeIcon(bookmark.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {bookmark.title || "Untitled"}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge
                      variant={getTypeBadgeVariant(bookmark.type)}
                      className="text-[10px]"
                    >
                      {bookmark.type.replace("_", " ")}
                    </Badge>
                    {bookmark.category && (
                      <Badge variant="outline" className="text-[10px]">
                        {bookmark.category}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(bookmark.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => {
                      toast.info("Navigate to bookmarked item")
                    }}
                  >
                    <ExternalLink className="size-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => handleDelete(bookmark.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
