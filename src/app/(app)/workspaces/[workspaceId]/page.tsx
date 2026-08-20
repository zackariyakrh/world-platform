import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { WorkspaceDetailClient } from "./workspace-detail-client"

export default async function WorkspaceDetailPage(props: {
  params: Promise<{ workspaceId: string }>
}) {
  const { workspaceId } = await props.params
  const session = await auth()
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) return null

  const membership = await db.workspaceMember.findFirst({
    where: { userId, workspaceId },
    select: { role: true },
  })

  if (!membership) notFound()

  const ws = await db.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      owner: { select: { id: true, name: true, email: true, avatar: true } },
      members: {
        include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
        orderBy: { joinedAt: "asc" },
      },
      channels: {
        orderBy: { createdAt: "asc" },
      },
      projects: {
        include: {
          _count: { select: { tasks: true } },
        },
        orderBy: { updatedAt: "desc" },
      },
      _count: { select: { members: true, channels: true, projects: true } },
    },
  })

  if (!ws) notFound()

  const serialized = {
    ...ws,
    createdAt: ws.createdAt.toISOString(),
    myRole: membership.role,
    owner: { ...ws.owner, name: ws.owner.name || "" },
    members: ws.members.map((m) => ({
      ...m,
      joinedAt: m.joinedAt.toISOString(),
      user: { ...m.user, name: m.user.name || "" },
    })),
    channels: ws.channels.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    })),
    projects: ws.projects.map((p) => ({
      ...p,
      startDate: p.startDate?.toISOString() || null,
      dueDate: p.dueDate?.toISOString() || null,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    })),
  }

  return (
    <div className="p-6">
      <WorkspaceDetailClient workspace={serialized} userId={userId} />
    </div>
  )
}
