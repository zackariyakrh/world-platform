import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { AdminProjectsClient } from "./admin-projects-client"

export default async function AdminProjectsPage() {
  const session = await auth()
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) return null

  const projects = await db.project.findMany({
    include: {
      owner: { select: { id: true, name: true, email: true, avatar: true } },
      workspace: { select: { id: true, name: true } },
      _count: {
        select: {
          members: true,
          tasks: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return <AdminProjectsClient projects={projects as any} />
}
