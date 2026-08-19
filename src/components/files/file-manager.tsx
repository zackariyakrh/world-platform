"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import {
  Grid3X3,
  List,
  Search,
  FolderOpen,
  FileText,
  Image,
  Film,
  Music,
  Archive,
  File,
  Download,
  Trash2,
  Share2,
  Pencil,
  ChevronRight,
  Upload,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { FileUploadZone } from "@/components/files/file-upload-zone"

type FileItem = {
  id: string
  name: string
  originalName: string
  mimeType: string
  size: number
  url: string
  folder: string
  uploaderId: string
  createdAt: string | Date
  uploader?: { id: string; name: string | null; avatar: string | null }
}

type ViewMode = "grid" | "list"

interface FileManagerProps {
  files: FileItem[]
  workspaces?: Array<{ id: string; name: string }>
  currentUserId: string
}

const mimeIconMap: Record<string, typeof FileText> = {
  "application/pdf": FileText,
  "image/": Image,
  "video/": Film,
  "audio/": Music,
  "application/zip": Archive,
  "application/x-rar": Archive,
  "application/x-7z": Archive,
  "text/": FileText,
}

function getFileIcon(mimeType: string) {
  for (const [prefix, Icon] of Object.entries(mimeIconMap)) {
    if (mimeType.startsWith(prefix)) return Icon
  }
  return File
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
}

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function FileManager({ files, workspaces = [], currentUserId }: FileManagerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("createdAt")
  const [currentFolder, setCurrentFolder] = useState("/")
  const [isUploading, setIsUploading] = useState(false)
  const [tab, setTab] = useState<"all" | "shared">("all")

  const folders = useMemo(() => {
    const folderSet = new Set<string>()
    files.forEach((f) => {
      if (f.folder && f.folder !== "/") {
        folderSet.add(f.folder)
      }
    })
    return Array.from(folderSet).sort()
  }, [files])

  const filteredFiles = useMemo(() => {
    let result = files

    if (tab === "all") {
      result = result.filter((f) => f.uploaderId === currentUserId || f.folder === currentFolder)
    } else {
      result = result.filter((f) => f.uploaderId !== currentUserId)
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (f) =>
          f.originalName.toLowerCase().includes(q) ||
          f.mimeType.toLowerCase().includes(q)
      )
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.originalName.localeCompare(b.originalName)
        case "size":
          return b.size - a.size
        case "type":
          return a.mimeType.localeCompare(b.mimeType)
        default:
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
      }
    })

    return result
  }, [files, searchQuery, sortBy, currentFolder, tab, currentUserId])

  const breadcrumbParts = currentFolder.split("/").filter(Boolean)

  const handleUpload = async (droppedFiles: File[]) => {
    setIsUploading(true)
    try {
      for (const file of droppedFiles) {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("folder", currentFolder)
        await fetch("/api/files", { method: "POST", body: formData })
      }
      window.location.reload()
    } catch (error) {
      console.error("Upload failed:", error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (fileId: string) => {
    await fetch(`/api/files/${fileId}`, { method: "DELETE" })
    window.location.reload()
  }

  const handleDownload = (file: FileItem) => {
    window.open(`/api/files/${file.id}`, "_blank")
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border bg-muted p-0.5">
            {(["all", "shared"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors",
                  tab === t
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t === "all" ? "My Files" : "Shared With Me"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-48 pl-8"
            />
          </div>
          <Select value={sortBy} onValueChange={(v) => v && setSortBy(v)}>
            <SelectTrigger className="h-8 w-32">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Date</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="size">Size</SelectItem>
              <SelectItem value="type">Type</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex rounded-lg border border-border bg-muted p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "rounded-md p-1 transition-colors",
                viewMode === "grid"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Grid3X3 className="size-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "rounded-md p-1 transition-colors",
                viewMode === "list"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <List className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {folders.length > 0 && (
        <div className="flex items-center gap-1 text-sm">
          <button
            onClick={() => setCurrentFolder("/")}
            className={cn(
              "rounded px-2 py-0.5 text-xs font-medium transition-colors",
              currentFolder === "/"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Home
          </button>
          {breadcrumbParts.map((part, i) => (
            <div key={i} className="flex items-center gap-1">
              <ChevronRight className="size-3 text-muted-foreground" />
              <button
                onClick={() =>
                  setCurrentFolder("/" + breadcrumbParts.slice(0, i + 1).join("/"))
                }
                className={cn(
                  "rounded px-2 py-0.5 text-xs font-medium transition-colors",
                  i === breadcrumbParts.length - 1
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {part}
              </button>
            </div>
          ))}
        </div>
      )}

      <FileUploadZone onDrop={handleUpload} isUploading={isUploading} />

      {filteredFiles.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <FolderOpen className="size-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No files found</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filteredFiles.map((file) => {
            const Icon = getFileIcon(file.mimeType)
            const isImage = file.mimeType.startsWith("image/")
            return (
              <div
                key={file.id}
                className="group flex flex-col rounded-xl border border-border transition-colors hover:bg-muted/50"
              >
                <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-t-xl bg-muted/30">
                  {isImage ? (
                    <img
                      src={file.url}
                      alt={file.originalName}
                      className="size-full object-cover"
                    />
                  ) : (
                    <Icon className="size-8 text-muted-foreground/40" />
                  )}
                </div>
                <div className="flex flex-col gap-1 p-2.5">
                  <p className="truncate text-xs font-medium text-foreground">
                    {file.originalName}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatFileSize(file.size)} &middot; {formatDate(file.createdAt)}
                  </p>
                  <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleDownload(file)}
                    >
                      <Download className="size-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleDelete(file.id)}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                    <Button variant="ghost" size="icon-xs">
                      <Share2 className="size-3" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-border">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-xs font-medium text-muted-foreground">
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Size</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Modified</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFiles.map((file) => {
                const Icon = getFileIcon(file.mimeType)
                return (
                  <tr
                    key={file.id}
                    className="border-b border-border last:border-0 transition-colors hover:bg-muted/30"
                  >
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Icon className="size-4 shrink-0 text-muted-foreground" />
                        <span className="truncate text-sm text-foreground">
                          {file.originalName}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-[10px]">
                        {file.mimeType.split("/")[1]?.toUpperCase() || "FILE"}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {formatDate(file.createdAt)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => handleDownload(file)}
                        >
                          <Download className="size-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => handleDelete(file.id)}
                        >
                          <Trash2 className="size-3" />
                        </Button>
                        <Button variant="ghost" size="icon-xs">
                          <Share2 className="size-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
