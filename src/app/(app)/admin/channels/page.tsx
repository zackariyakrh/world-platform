import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { AdminChannelsClient } from "./admin-channels-client"

export default async function AdminChannelsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/auth/login")

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, isSuperAdmin: true },
  })
  if (!user || (user.role !== "owner" && user.role !== "admin" && !user.isSuperAdmin)) {
    redirect("/dashboard")
  }

  const membership = await db.workspaceMember.findFirst({
    where: { userId: session.user.id },
    select: { workspaceId: true },
  })

  const channels = membership
    ? await db.channel.findMany({
        where: { workspaceId: membership.workspaceId },
        include: {
          creator: { select: { id: true, name: true } },
          _count: { select: { members: true, messages: true } },
        },
        orderBy: { createdAt: "asc" },
      })
    : []

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Channels</h1>
        <p className="text-sm text-muted-foreground">
          Manage workspace channels. Create, edit, or delete channels.
        </p>
      </div>
      <AdminChannelsClient channels={channels} />
    </div>
  )
}
