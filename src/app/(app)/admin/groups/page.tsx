import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { AdminGroupsClient } from "./admin-groups-client"

export default async function AdminGroupsPage() {
  const session = await auth()
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) return null

  const [groups, workspaces] = await Promise.all([
    db.group.findMany({
      include: {
        creator: { select: { id: true, name: true } },
        workspace: { select: { id: true, name: true } },
        _count: { select: { members: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.workspace.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ])

  return <AdminGroupsClient groups={groups as any} workspaces={workspaces} />
}
