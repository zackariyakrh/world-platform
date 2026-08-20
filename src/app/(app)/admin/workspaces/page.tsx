import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { AdminWorkspacesClient } from "./admin-workspaces-client"

export default async function AdminWorkspacesPage() {
  const session = await auth()
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) return null

  const workspaces = await db.workspace.findMany({
    include: {
      owner: { select: { id: true, name: true, email: true, avatar: true } },
      _count: {
        select: {
          members: true,
          channels: true,
          projects: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return <AdminWorkspacesClient workspaces={workspaces as any} />
}
