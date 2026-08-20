"use client"

import * as React from "react"
import { toast } from "sonner"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  FolderOpen,
  Plus,
  Users,
  Hash,
  Briefcase,
  Loader2,
  Trash2,
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
}

export function AdminWorkspacesClient({ workspaces: initial }: { workspaces: Workspace[] }) {
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
        body: JSON.stringify({ name: name.trim(), description: desc.trim() || undefined }),
      })
      if (res.ok) {
        const ws = await res.json()
        setWorkspaces((prev) => [ws, ...prev])
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

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/workspaces/${id}`, { method: "DELETE" })
      if (res.ok) {
        setWorkspaces((prev) => prev.filter((w) => w.id !== id))
        toast.success("Workspace deleted")
      } else {
        toast.error("Failed to delete workspace")
      }
    } catch {
      toast.error("Something went wrong")
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground glow-text">
            <FolderOpen className="size-6 text-primary drop-shadow-[0_0_8px_oklch(from_var(--primary)_l_c_h_/_0.4)]" />
            Workspaces
          </h1>
          <p className="text-base text-muted-foreground">Manage all workspaces in your platform.</p>
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
                <Input placeholder="e.g. Engineering Team" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Description</Label>
                <Input placeholder="What is this workspace for?" value={desc} onChange={(e) => setDesc(e.target.value)} />
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

      <div className="glow-card rounded-xl bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Workspace</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead className="text-center">Members</TableHead>
              <TableHead className="text-center">Channels</TableHead>
              <TableHead className="text-center">Projects</TableHead>
              <TableHead>Visibility</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workspaces.map((ws) => (
              <TableRow key={ws.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary text-sm font-bold">
                      {ws.name?.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{ws.name}</p>
                      <p className="text-xs text-muted-foreground">/{ws.slug}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">{ws.owner.name}</span>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary"><Users className="size-3" /> {ws._count.members}</Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary"><Hash className="size-3" /> {ws._count.channels}</Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary"><Briefcase className="size-3" /> {ws._count.projects}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={ws.isPublic ? "outline" : "secondary"}>
                    {ws.isPublic ? "Public" : "Private"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => handleDelete(ws.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {workspaces.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No workspaces found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
