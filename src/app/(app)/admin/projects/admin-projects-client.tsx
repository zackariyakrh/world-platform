"use client"

import * as React from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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

export function AdminProjectsClient({ projects: initial }: { projects: Project[] }) {
  const [projects, setProjects] = React.useState(initial)
  const [deleting, setDeleting] = React.useState<string | null>(null)

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
      <div className="flex flex-col gap-1">
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground glow-text">
          <Briefcase className="size-6 text-primary drop-shadow-[0_0_8px_oklch(from_var(--primary)_l_c_h_/_0.4)]" />
          Projects
        </h1>
        <p className="text-base text-muted-foreground">Manage all projects across workspaces.</p>
      </div>

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
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => handleDelete(project.id)}
                    disabled={deleting === project.id}
                  >
                    {deleting === project.id ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                  </Button>
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
