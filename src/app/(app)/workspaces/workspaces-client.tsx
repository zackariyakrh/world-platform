"use client"

import * as React from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
import {
  FolderOpen,
  Plus,
  Users,
  Hash,
  Briefcase,
  Loader2,
  Crown,
  ChevronRight,
  Globe,
  Lock,
} from "lucide-react"

interface Workspace {
  id: string
  name: string
  slug: string
  description?: string | null
  isPublic: boolean
  createdAt: string
  owner: { id: string; name: string; email: string; avatar: string | null }
  _count: { members: number; channels: number; projects: number }
  myRole: string
}

export function WorkspacesClient({
  workspaces: initial,
  userId,
}: {
  workspaces: Workspace[]
  userId: string
}) {
  const router = useRouter()
  const [workspaces, setWorkspaces] = React.useState(initial)
  const [createOpen, setCreateOpen] = React.useState(false)
  const [name, setName] = React.useState("")
  const [desc, setDesc] = React.useState("")
  const [creating, setCreating] = React.useState(false)

  async function handleCreate() {
    if (!name.trim()) return
    setCreating(true)
    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: desc.trim() || undefined,
        }),
      })
      if (res.ok) {
        const ws = await res.json()
        setWorkspaces((prev) => [{ ...ws, myRole: "owner", _count: { members: 1, channels: 0, projects: 0 } }, ...prev])
        setCreateOpen(false)
        setName("")
        setDesc("")
        toast.success("Workspace created!")
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to create workspace")
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setCreating(false)
    }
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground glow-text">
            <FolderOpen className="size-6 text-primary drop-shadow-[0_0_8px_oklch(from_var(--primary)_l_c_h_/_0.4)]" />
            Workspaces
          </h1>
          <p className="text-base text-muted-foreground">
            Your team workspaces — channels, projects, and collaboration.
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger render={<Button className="glow-button" />}>
            <Plus className="size-4" />
            New Workspace
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Workspace</DialogTitle>
              <DialogDescription>Create a new workspace for your team.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-1">
              <div className="flex flex-col gap-2">
                <Label>Name</Label>
                <Input
                  placeholder="e.g. Engineering Team"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Description</Label>
                <Input
                  placeholder="What is this workspace for?"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
              <Button onClick={handleCreate} disabled={creating || !name.trim()}>
                {creating ? <Loader2 className="size-4 animate-spin" /> : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {workspaces.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20">
          <FolderOpen className="mb-3 size-14 text-muted-foreground/30" />
          <h3 className="mb-1 text-base font-medium text-foreground">No workspaces yet</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Create a workspace to start collaborating with your team.
          </p>
          <Button variant="outline" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            Create Workspace
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((ws) => (
            <button
              key={ws.id}
              onClick={() => router.push(`/workspaces/${ws.id}`)}
              className="glow-card group flex flex-col gap-4 rounded-xl bg-card p-5 text-left transition-all hover:ring-2 hover:ring-primary/30"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary text-base font-bold">
                    {ws.name?.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                      {ws.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">/{ws.slug}</p>
                  </div>
                </div>
                <ChevronRight className="size-4 text-muted-foreground/40 group-hover:text-primary transition-colors mt-1" />
              </div>

              {ws.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{ws.description}</p>
              )}

              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="gap-1">
                  <Users className="size-3" />
                  {ws._count.members}
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <Hash className="size-3" />
                  {ws._count.channels}
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <Briefcase className="size-3" />
                  {ws._count.projects}
                </Badge>
                <Badge variant={ws.isPublic ? "outline" : "secondary"} className="gap-1 ml-auto">
                  {ws.isPublic ? <Globe className="size-3" /> : <Lock className="size-3" />}
                  {ws.isPublic ? "Public" : "Private"}
                </Badge>
              </div>

              <div className="flex items-center justify-between border-t border-border/50 pt-3">
                <div className="flex items-center gap-2">
                  <div className="flex size-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
                    {ws.owner.name?.charAt(0) || ws.owner.email?.charAt(0) || "?"}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {ws.owner.name || ws.owner.email}
                  </span>
                </div>
                {ws.myRole === "owner" && (
                  <Badge variant="outline" className="gap-1 text-xs text-primary border-primary/30">
                    <Crown className="size-3" />
                    Owner
                  </Badge>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </>
  )
}
