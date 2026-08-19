import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { ExploreClient } from "./explore-client"
import { Compass } from "lucide-react"

export default async function ExplorePage() {
  const session = await auth()
  const userId = (session?.user as any)?.id as string | undefined

  if (!userId) return null

  const currentUser = await db.user.findUnique({
    where: { id: userId },
    select: { role: true, isSuperAdmin: true },
  })
  const isAdmin = currentUser?.isSuperAdmin || currentUser?.role === "owner" || currentUser?.role === "admin"

  const userWorkspaces = await db.workspaceMember.findMany({
    where: { userId },
    select: { workspaceId: true },
  })
  const workspaceIds = userWorkspaces.map((w) => w.workspaceId)

  const [
    channels,
    users,
    projects,
    recentMessages,
    recentTasks,
  ] = await Promise.all([
    db.channel.findMany({
      where: { workspaceId: { in: workspaceIds } },
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        _count: { select: { messages: true } },
      },
      orderBy: { name: "asc" },
    }),
    db.user.findMany({
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        gender: true,
        address: true,
        avatar: true,
        jobTitle: true,
        status: true,
        role: true,
        isActive: true,
      },
      orderBy: { name: "asc" },
      take: 50,
    }),
    db.project.findMany({
      where: { workspaceId: { in: workspaceIds } },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        progress: true,
        _count: { select: { tasks: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    db.message.findMany({
      where: {
        channel: { workspaceId: { in: workspaceIds } },
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        user: { select: { id: true, name: true, avatar: true } },
        channel: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    db.task.findMany({
      where: {
        project: { workspaceId: { in: workspaceIds } },
        status: { not: "done" },
      },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        dueDate: true,
        assignee: { select: { id: true, name: true, avatar: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 15,
    }),
  ])

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-1">
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground glow-text">
          <Compass className="size-6 text-primary drop-shadow-[0_0_8px_oklch(from_var(--primary)_l_c_h_/_0.4)]" />
          Explore
        </h1>
        <p className="text-sm text-muted-foreground">
          Discover channels, people, projects, and activity across your workspace.
        </p>
      </div>

      <ExploreClient
        channels={channels as any}
        users={users as any}
        projects={projects as any}
        recentMessages={recentMessages as any}
        recentTasks={recentTasks as any}
        isAdmin={isAdmin}
      />
    </div>
  )
}
