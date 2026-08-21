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
  Users,
  Plus,
  Pencil,
  Loader2,
  Trash2,
  Lock,
  Globe,
} from "lucide-react"

interface Group {
  id: string
  name: string
  description: string | null
  isPrivate: boolean
  createdAt: string
  creator: { id: string; name: string | null }
  workspace: { id: string; name: string }
  _count: { members: number }
}

interface Workspace {
  id: string
  name: string
}

export function AdminGroupsClient({ groups: initial, workspaces }: { groups: Group[]; workspaces: Workspace[] }) {
  const [groups, setGroups] = React.useState(initial)
  const [createOpen, setCreateOpen] = React.useState(false)
  const [editOpen, setEditOpen] = React.useState(false)
  const [editGroup, setEditGroup] = React.useState<Group | null>(null)
  const [creating, setCreating] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [form, setForm] = React.useState({ name: "", description: "", isPrivate: false, workspaceId: "" })
  const [editForm, setEditForm] = React.useState({ name: "", description: "", isPrivate: false })

  async function handleCreate() {
    if (!form.name.trim()) return
    setCreating(true)
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          isPrivate: form.isPrivate,
        }),
      })
      if (res.ok) {
        toast.success("Group created")
        setCreateOpen(false)
        setForm({ name: "", description: "", isPrivate: false, workspaceId: "" })
        window.location.reload()
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to create group")
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setCreating(false)
    }
  }

  function openEdit(group: Group) {
    setEditGroup(group)
    setEditForm({ name: group.name, description: group.description || "", isPrivate: group.isPrivate })
    setEditOpen(true)
  }

  async function handleEdit() {
    if (!editGroup || !editForm.name.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/groups/${editGroup.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name.trim(),
          description: editForm.description.trim() || null,
          isPrivate: editForm.isPrivate,
        }),
      })
      if (res.ok) {
        setGroups((prev) => prev.map((g) => g.id === editGroup.id ? { ...g, name: editForm.name.trim(), description: editForm.description.trim() || null, isPrivate: editForm.isPrivate } : g))
        setEditOpen(false)
        setEditGroup(null)
        toast.success("Group updated")
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to update group")
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/groups/${id}`, { method: "DELETE" })
      if (res.ok) {
        setGroups((prev) => prev.filter((g) => g.id !== id))
        toast.success("Group deleted")
      } else {
        toast.error("Failed to delete group")
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
            <Users className="size-6 text-primary drop-shadow-[0_0_8px_oklch(from_var(--primary)_l_c_h_/_0.4)]" />
            Groups
          </h1>
          <p className="text-base text-muted-foreground">Manage all groups across workspaces.</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger render={<Button className="glow-button gap-1.5" />}>
            <Plus className="size-4" />
            New Group
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Group</DialogTitle>
              <DialogDescription>Create a new group in a workspace.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-2">
              <div className="flex flex-col gap-2">
                <Label>Name</Label>
                <Input placeholder="e.g. Design Team" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Description</Label>
                <Input placeholder="What is this group about?" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="create-private"
                  checked={form.isPrivate}
                  onChange={(e) => setForm({ ...form, isPrivate: e.target.checked })}
                  className="size-4"
                />
                <Label htmlFor="create-private">Private group</Label>
              </div>
            </div>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
              <Button onClick={handleCreate} disabled={creating || !form.name.trim()}>
                {creating ? <Loader2 className="size-4 animate-spin" /> : "Create Group"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Group</DialogTitle>
            <DialogDescription>Update group details.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-2">
              <Label>Name</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Description</Label>
              <Input placeholder="What is this group about?" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit-private"
                checked={editForm.isPrivate}
                onChange={(e) => setEditForm({ ...editForm, isPrivate: e.target.checked })}
                className="size-4"
              />
              <Label htmlFor="edit-private">Private group</Label>
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button onClick={handleEdit} disabled={saving || !editForm.name.trim()}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="glow-card rounded-xl bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Group</TableHead>
              <TableHead>Workspace</TableHead>
              <TableHead>Creator</TableHead>
              <TableHead className="text-center">Members</TableHead>
              <TableHead>Visibility</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.map((group) => (
              <TableRow key={group.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary text-sm font-bold">
                      {group.name?.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{group.name}</p>
                      {group.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">{group.description}</p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">{group.workspace.name}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">{group.creator.name || "Unknown"}</span>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary"><Users className="size-3" /> {group._count.members}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={group.isPrivate ? "secondary" : "outline"} className="gap-1">
                    {group.isPrivate ? <Lock className="size-3" /> : <Globe className="size-3" />}
                    {group.isPrivate ? "Private" : "Public"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => openEdit(group)}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => {
                        if (window.confirm(`Delete group "${group.name}"?`)) handleDelete(group.id)
                      }}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {groups.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No groups found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
