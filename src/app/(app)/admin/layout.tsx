import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import {
  LayoutDashboard,
  Users,
  Mail,
  FolderOpen,
  Hash,
  Briefcase,
  Shield,
  Bot,
  Palette,
  Lock,
  ScrollText,
  Settings,
} from "lucide-react"

const NAV_ITEMS = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Invitations", href: "/admin/invitations", icon: Mail },
  { label: "Workspaces", href: "/admin/workspaces", icon: FolderOpen },
  { label: "Channels", href: "/admin/channels", icon: Hash },
  { label: "Projects", href: "/admin/projects", icon: Briefcase },
  { label: "Roles", href: "/admin/roles", icon: Shield },
  { label: "AI Config", href: "/admin/ai-config", icon: Bot },
  { label: "Branding", href: "/admin/branding", icon: Palette },
  { label: "Security", href: "/admin/settings", icon: Lock },
  { label: "Audit Logs", href: "/admin/audit", icon: ScrollText },
  { label: "Settings", href: "/admin/settings", icon: Settings },
]

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
    <div className="flex flex-1 gap-0">
      <aside className="hidden w-56 shrink-0 border-r bg-muted/30 lg:block">
        <div className="flex flex-col gap-1 p-3">
          <div className="px-2 pb-2 pt-3">
            <h2 className="text-sm font-semibold text-foreground">
              Administration
            </h2>
            <p className="text-xs text-muted-foreground">
              Manage your platform
            </p>
          </div>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <item.icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          ))}
        </div>
      </aside>
      <main className="flex flex-1 flex-col overflow-auto">{children}</main>
    </div>
  )
}
