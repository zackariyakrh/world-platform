import { db } from "@/lib/db"
import { UserTable } from "@/components/admin/user-table"
import { Users } from "lucide-react"

export default async function AdminUsersPage() {
  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      role: true,
      isActive: true,
      createdAt: true,
      lastSeenAt: true,
    },
  })

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-1">
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground glow-text">
          <Users className="size-6 text-primary drop-shadow-[0_0_8px_oklch(from_var(--primary)_l_c_h_/_0.4)]" />
          User Management
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage users, roles, and account status.
        </p>
      </div>
      <UserTable users={users} />
    </div>
  )
}
