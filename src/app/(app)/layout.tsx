import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { getBrandingSettings } from "@/lib/settings"
import { AppLayout } from "@/components/layout/app-layout"

export default async function AppGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/auth/login")
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      role: true,
      workspaceMembers: {
        select: {
          workspace: {
            select: {
              id: true,
              name: true,
              slug: true,
              icon: true,
            },
          },
        },
      },
      notifications: {
        where: { isRead: false },
        select: { id: true },
      },
    },
  })

  if (!user) {
    redirect("/auth/login")
  }

  const notificationCount = user.notifications.length
  const branding = await getBrandingSettings()

  return (
    <AppLayout
      notificationCount={notificationCount}
      userName={user.name}
      userEmail={user.email}
      userAvatar={user.avatar}
      userRole={user.role}
      appName={branding.appName}
    >
      {children}
    </AppLayout>
  )
}
