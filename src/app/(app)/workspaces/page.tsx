import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { WorkspacesClient } from "./workspaces-client"

export default async function WorkspacesPage() {
  const session = await auth()
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) return null

  const memberships = await db.workspaceMember.findMany({
    where: { userId },
    include: {
      workspace: {
        include: {
          owner: { select: { id: true, name: true, email: true, avatar: true } },
          _count: { select: { members: true, channels: true, projects: true } },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  })

  const workspaces = memberships.map((m) => ({
    ...m.workspace,
    createdAt: m.workspace.createdAt.toISOString(),
    myRole: m.role,
    owner: {
      ...m.workspace.owner,
      name: m.workspace.owner.name || "",
    },
  }))

  return (
    <div className="p-6">
      <WorkspacesClient workspaces={workspaces} userId={userId} />
    </div>
  )
}
