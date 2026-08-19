"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Upload, Loader2 } from "lucide-react"

interface FileUploadZoneProps {
  onDrop: (files: File[]) => void
  isUploading?: boolean
}

export function FileUploadZone({ onDrop, isUploading }: FileUploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(false)

      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) {
        onDrop(files)
      }
    },
    [onDrop]
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || [])
      if (files.length > 0) {
        onDrop(files)
      }
      e.target.value = ""
    },
    [onDrop]
  )

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 transition-all",
        isDragOver
          ? "border-primary bg-primary/5"
          : "border-border hover:border-muted-foreground/50 hover:bg-muted/30",
        isUploading && "pointer-events-none opacity-50"
      )}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
      {isUploading ? (
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      ) : (
        <Upload
          className={cn(
            "size-8",
            isDragOver ? "text-primary" : "text-muted-foreground/40"
          )}
        />
      )}
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">
          {isDragOver ? "Drop files here" : "Drag & drop files here"}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          or click to browse
        </p>
      </div>
    </div>
  )
}
