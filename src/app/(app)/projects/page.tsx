import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { ProjectCard } from "@/components/projects/project-card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, FolderKanban } from "lucide-react"
import Link from "next/link"

interface ProjectsPageProps {
  searchParams: Promise<{ status?: string }>
}

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const session = await auth()
  const userId = (session?.user as any)?.id as string | undefined
  const { status } = await searchParams

  if (!userId) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Please sign in to view projects.</p>
      </div>
    )
  }

  const userWorkspace = await db.workspaceMember.findFirst({
    where: { userId },
    select: { workspaceId: true },
  })

  if (!userWorkspace) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <FolderKanban className="size-12 text-muted-foreground/30" />
          <div>
            <h3 className="text-sm font-medium">No workspace found</h3>
            <p className="text-sm text-muted-foreground">Join a workspace to see projects.</p>
          </div>
        </div>
      </div>
    )
  }

  const where: any = { workspaceId: userWorkspace.workspaceId }
  if (status && status !== "all") {
    where.status = status
  }

  const projects = await db.project.findMany({
    where,
    include: {
      members: {
        include: { user: { select: { id: true, name: true, avatar: true } } },
      },
      tasks: {
        select: { id: true, title: true, status: true, priority: true, dueDate: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  })

  const serializedProjects = projects.map((p) => ({
    ...p,
    startDate: p.startDate?.toISOString() || null,
    dueDate: p.dueDate?.toISOString() || null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    tasks: p.tasks.map((t) => ({
      ...t,
      dueDate: t.dueDate?.toISOString() || null,
    })),
  }))

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold glow-text">
            <FolderKanban className="size-6 text-primary drop-shadow-[0_0_8px_oklch(from_var(--primary)_l_c_h_/_0.4)]" />
            Projects
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your team projects and track progress
          </p>
        </div>
        <Link href="/projects/new">
          <Button>
            <Plus className="size-4" />
            New Project
          </Button>
        </Link>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <Select defaultValue={status || "all"}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {serializedProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <FolderKanban className="mb-3 size-12 text-muted-foreground/30" />
          <h3 className="mb-1 text-sm font-medium">No projects yet</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Create your first project to get started.
          </p>
          <Link href="/projects/new">
            <Button variant="outline" size="sm">
              <Plus className="size-3.5" />
              Create Project
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {serializedProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  )
}
