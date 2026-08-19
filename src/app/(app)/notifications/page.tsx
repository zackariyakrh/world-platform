import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { NotificationList } from "@/components/notifications/notification-list"
import { Bell } from "lucide-react"

export default async function NotificationsPage() {
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) {
    redirect("/auth/login")
  }

  const notifications = await db.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground glow-text">
            <Bell className="size-6 text-primary drop-shadow-[0_0_8px_oklch(from_var(--primary)_l_c_h_/_0.4)]" />
            Notifications
          </h1>
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
              : "You're all caught up!"}
          </p>
        </div>
      </div>

      <div className="rounded-xl border">
        <NotificationList
          notifications={notifications.map((n) => ({
            ...n,
            createdAt: n.createdAt.toISOString(),
          }))}
        />
      </div>
    </div>
  )
}
