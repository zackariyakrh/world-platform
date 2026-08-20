"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
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

export function AdminNav() {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile horizontal scroll tabs */}
      <div className="lg:hidden border-b bg-muted/30">
        <div className="flex overflow-x-auto scrollbar-none p-2 gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href + item.label}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary shadow-[inset_0_0_12px_oklch(from_var(--primary)_l_c_h_/_0.08)]"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="size-3.5 shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-56 lg:shrink-0 lg:flex-col border-r bg-muted/30">
        <div className="flex flex-col gap-1 p-3">
          <div className="px-2 pb-2 pt-3">
            <h2 className="text-sm font-semibold text-foreground">
              Administration
            </h2>
            <p className="text-xs text-muted-foreground">
              Manage your platform
            </p>
          </div>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href + item.label}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary font-medium shadow-[inset_0_0_20px_oklch(from_var(--primary)_l_c_h_/_0.08)]"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="size-4 shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </div>
      </aside>
    </>
  )
}
