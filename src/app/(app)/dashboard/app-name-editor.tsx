"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Paintbrush, Loader2, Check } from "lucide-react"
import { toast } from "sonner"

export function AppNameEditor({ currentName }: { currentName: string }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(currentName)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    const trimmed = name.trim()
    if (!trimmed) {
      toast.error("App name cannot be empty")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: { "app.name": trimmed } }),
      })
      if (!res.ok) throw new Error("Failed")
      setSaved(true)
      toast.success("App name updated! Refresh to see changes.")
      setTimeout(() => {
        setSaved(false)
        setOpen(false)
        window.location.reload()
      }, 1000)
    } catch {
      toast.error("Failed to update app name")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" className="w-full justify-start gap-3" />
        }
      >
        <Paintbrush className="size-4 text-muted-foreground" />
        Change App Name
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change App Name</DialogTitle>
          <DialogDescription>
            This changes the name shown in the top-left corner of the sidebar.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-1">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="app-name-input">App Name</Label>
            <Input
              id="app-name-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Nexus, My Company"
              onKeyDown={(e) => { if (e.key === "Enter") handleSave() }}
            />
          </div>
          <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
              {name.trim() ? name.trim().charAt(0).toUpperCase() : "?"}
            </span>
            <span className="text-sm font-medium text-foreground truncate">
              {name.trim() || "Untitled"}
            </span>
          </div>
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button onClick={handleSave} disabled={saving || !name.trim()}>
            {saving ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : saved ? (
              <Check className="size-3.5" />
            ) : (
              <Paintbrush className="size-3.5" />
            )}
            {saving ? "Saving..." : saved ? "Saved!" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
