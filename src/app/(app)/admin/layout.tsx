import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { AdminNav } from "./admin-nav"

export default async function AdminLayout({
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
    select: { role: true, isSuperAdmin: true },
  })

  if (!user || (user.role !== "owner" && user.role !== "admin" && !user.isSuperAdmin)) {
    redirect("/dashboard")
  }

  return (
    <div className="flex flex-1 flex-col lg:flex-row gap-0">
      <AdminNav />
      <main className="flex flex-1 flex-col overflow-auto">{children}</main>
    </div>
  )
}
