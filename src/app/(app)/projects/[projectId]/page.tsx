import { notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { Badge } from "@/components/ui/badge"
import { AvatarGroup, type AvatarGroupUser } from "@/components/ui/avatar-group"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TaskList } from "@/components/projects/task-list"
import { format } from "date-fns"
import {
  Calendar,
  Users,
  FolderKanban,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react"
import Link from "next/link"

interface ProjectDetailPageProps {
  params: Promise<{ projectId: string }>
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { projectId } = await params
  const session = await auth()
  const userId = (session?.user as any)?.id as string | undefined

  if (!userId) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Please sign in.</p>
      </div>
    )
  }

  const project = await db.project.findUnique({
    where: { id: projectId },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, avatar: true, email: true } },
        },
      },
      tasks: {
        include: {
          assignee: { select: { id: true, name: true, avatar: true } },
          creator: { select: { id: true, name: true } },
          comments: true,
          checklists: true,
          subtasks: { select: { id: true, title: true, status: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!project) {
    notFound()
  }

  const doneCount = project.tasks.filter((t) => t.status === "done").length
  const inProgressCount = project.tasks.filter((t) => t.status === "in_progress").length
  const todoCount = project.tasks.filter((t) => t.status === "todo").length

  const members: AvatarGroupUser[] = project.members.map((m) => ({
    id: m.userId,
    name: m.user.name || "Unknown",
    image: m.user.avatar,
  }))

  const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
    active: "default",
    archived: "secondary",
    completed: "outline",
  }

  const serializedTasks = project.tasks.map((t) => ({
    ...t,
    dueDate: t.dueDate?.toISOString() || null,
    startDate: t.startDate?.toISOString() || null,
    completedAt: t.completedAt?.toISOString() || null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    assignee: t.assignee
      ? { id: t.assignee.id, name: t.assignee.name, avatar: t.assignee.avatar }
      : undefined,
    creator: t.creator
      ? { id: t.creator.id, name: t.creator.name, avatar: null }
      : undefined,
    comments: t.comments.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      user: { id: c.userId, name: "User", avatar: null },
    })),
    subtasks: [
      ...t.subtasks.map((st) => ({
        id: st.id,
        title: st.title,
        status: st.status,
      })),
      ...t.checklists.map((cl) => ({
        id: cl.id,
        title: cl.text,
        status: cl.isDone ? "done" : "todo",
        isDone: cl.isDone,
      })),
    ],
  }))

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold glow-text">{project.name}</h1>
              <Badge variant={statusVariant[project.status] || "secondary"}>
                {project.status}
              </Badge>
            </div>
            {project.description && (
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                {project.description}
              </p>
            )}
          </div>
          <Link href="/projects">
            <Button variant="outline" size="sm">
              Back to Projects
            </Button>
          </Link>
        </div>

        <div className="mt-4 flex items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <CheckCircle className="size-4 text-emerald-500" />
            <span>{doneCount} done</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="size-4 text-amber-500" />
            <span>{inProgressCount} in progress</span>
          </div>
          <div className="flex items-center gap-1.5">
            <AlertCircle className="size-4 text-blue-500" />
            <span>{todoCount} todo</span>
          </div>
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center gap-1.5">
            <Users className="size-4" />
            <span>{project.members.length} members</span>
          </div>
          <div className="flex items-center gap-1.5">
            <FolderKanban className="size-4" />
            <span>{project.tasks.length} tasks</span>
          </div>
          {project.dueDate && (
            <div className="flex items-center gap-1.5">
              <Calendar className="size-4" />
              <span>Due {format(new Date(project.dueDate), "MMM d, yyyy")}</span>
            </div>
          )}
        </div>

        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{project.progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>

        <div className="mt-4">
          <AvatarGroup users={members} max={8} />
        </div>
      </div>

      <Tabs defaultValue="tasks">
        <TabsList variant="line">
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks">
          <TaskList
            tasks={serializedTasks}
            onTaskClick={() => {}}
            onAddTask={() => {}}
          />
        </TabsContent>

        <TabsContent value="timeline">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Calendar className="mb-3 size-12 text-muted-foreground/30" />
            <h3 className="mb-1 text-sm font-medium">Timeline view</h3>
            <p className="text-sm text-muted-foreground">
              Gantt chart timeline coming soon.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="files">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FolderKanban className="mb-3 size-12 text-muted-foreground/30" />
            <h3 className="mb-1 text-sm font-medium">Project files</h3>
            <p className="text-sm text-muted-foreground">
              File management coming soon.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <div className="max-w-lg space-y-6 py-4">
            <div>
              <h3 className="text-sm font-medium">Project Settings</h3>
              <p className="text-sm text-muted-foreground">
                Manage your project configuration.
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Project Name
                </label>
                <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">
                  {project.name}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Description
                </label>
                <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">
                  {project.description || "No description"}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Status
                </label>
                <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">
                  <Badge variant={statusVariant[project.status] || "secondary"}>
                    {project.status}
                  </Badge>
                </div>
              </div>
              {project.dueDate && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Due Date
                  </label>
                  <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">
                    {format(new Date(project.dueDate), "MMMM d, yyyy")}
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
