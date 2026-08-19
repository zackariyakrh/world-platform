import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { GroupsClient } from "./groups-client"

export default async function GroupsPage() {
  const session = await auth()
  const userId = (session?.user as any)?.id as string | undefined

  if (!userId) return null

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })

  return <GroupsClient userRole={user?.role} />
}
