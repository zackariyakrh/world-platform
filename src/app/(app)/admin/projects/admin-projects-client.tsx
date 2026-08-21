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
  Briefcase,
  Users,
  ListTodo,
  Loader2,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react"

interface Project {
  id: string
  name: string
  description?: string | null
  status: string
  priority: string
  progress: number
  createdAt: string
  owner: { id: string; name: string; email: string; avatar: string | null }
  workspace: { id: string; name: string }
  _count: { members: number; tasks: number }
}

interface Workspace {
  id: string
  name: string
}

const statusColors: Record<string, string> = {
  active: "text-green-500 bg-green-500/10 border-green-500/20",
  completed: "text-blue-500 bg-blue-500/10 border-blue-500/20",
  archived: "text-muted-foreground bg-muted border-border",
}

const priorityColors: Record<string, string> = {
  urgent: "text-red-500 bg-red-500/10 border-red-500/20",
  high: "text-orange-500 bg-orange-500/10 border-orange-500/20",
  medium: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
  low: "text-muted-foreground bg-muted border-border",
}

export function AdminProjectsClient({ projects: initial, workspaces }: { projects: Project[]; workspaces: Workspace[] }) {
  const [projects, setProjects] = React.useState(initial)
  const [createOpen, setCreateOpen] = React.useState(false)
  const [editOpen, setEditOpen] = React.useState(false)
  const [editProject, setEditProject] = React.useState<Project | null>(null)
  const [creating, setCreating] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [deleting, setDeleting] = React.useState<string | null>(null)
  const [form, setForm] = React.useState({ name: "", description: "", status: "active", priority: "medium", workspaceId: "" })
  const [editForm, setEditForm] = React.useState({ name: "", description: "", status: "active", priority: "medium" })

  async function handleCreate() {
    if (!form.name.trim()) return
    setCreating(true)
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          status: form.status,
          priority: form.priority,
          workspaceId: form.workspaceId || undefined,
        }),
      })
      if (res.ok) {
        const p = await res.json()
        toast.success("Project created")
        setCreateOpen(false)
        setForm({ name: "", description: "", status: "active", priority: "medium", workspaceId: "" })
        window.location.reload()
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to create project")
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setCreating(false)
    }
  }

  function openEdit(project: Project) {
    setEditProject(project)
    setEditForm({ name: project.name, description: project.description || "", status: project.status, priority: project.priority })
    setEditOpen(true)
  }

  async function handleEdit() {
    if (!editProject || !editForm.name.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/projects/${editProject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name.trim(),
          description: editForm.description.trim() || null,
          status: editForm.status,
          priority: editForm.priority,
        }),
      })
      if (res.ok) {
        setProjects((prev) => prev.map((p) => p.id === editProject.id ? { ...p, name: editForm.name.trim(), description: editForm.description.trim() || null, status: editForm.status, priority: editForm.priority } : p))
        setEditOpen(false)
        setEditProject(null)
        toast.success("Project updated")
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to update project")
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" })
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== id))
        toast.success("Project deleted")
      } else {
        toast.error("Failed to delete project")
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground glow-text">
            <Briefcase className="size-6 text-primary drop-shadow-[0_0_8px_oklch(from_var(--primary)_l_c_h_/_0.4)]" />
            Projects
          </h1>
          <p className="text-base text-muted-foreground">Manage all projects across workspaces.</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger render={<Button className="glow-button gap-1.5" />}>
            <Plus className="size-4" />
            New Project
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Project</DialogTitle>
              <DialogDescription>Add a new project to a workspace.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-2">
              <div className="flex flex-col gap-2">
                <Label>Name</Label>
                <Input placeholder="e.g. Website Redesign" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Description</Label>
                <Input placeholder="What is this project about?" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Workspace</Label>
                <select
                  value={form.workspaceId}
                  onChange={(e) => setForm({ ...form, workspaceId: e.target.value })}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Use your default workspace</option>
                  {workspaces.map((ws) => (
                    <option key={ws.id} value={ws.id}>{ws.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label>Status</Label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Priority</Label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
              <Button onClick={handleCreate} disabled={creating || !form.name.trim()}>
                {creating ? <Loader2 className="size-4 animate-spin" /> : "Create Project"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>Update project details.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-2">
              <Label>Name</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Description</Label>
              <Input placeholder="What is this project about?" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Status</Label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Priority</Label>
                <select
                  value={editForm.priority}
                  onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
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
              <TableHead>Project</TableHead>
              <TableHead>Workspace</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead className="text-center">Tasks</TableHead>
              <TableHead className="text-center">Members</TableHead>
              <TableHead className="text-center">Progress</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => (
              <TableRow key={project.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Briefcase className="size-4" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{project.name}</p>
                      {project.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">{project.description}</p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">{project.workspace.name}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">{project.owner.name}</span>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={statusColors[project.status] || ""}>
                    {project.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={priorityColors[project.priority] || ""}>
                    {project.priority}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary"><ListTodo className="size-3" /> {project._count.tasks}</Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary"><Users className="size-3" /> {project._count.members}</Badge>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-8 text-right">{project.progress}%</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => openEdit(project)}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => {
                        if (window.confirm(`Delete project "${project.name}"?`)) handleDelete(project.id)
                      }}
                      disabled={deleting === project.id}
                    >
                      {deleting === project.id ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {projects.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No projects found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
