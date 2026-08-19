"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { User, Bell, Palette, Settings } from "lucide-react"

const TABS = [
  { href: "/settings/profile", label: "Profile", icon: User },
  { href: "/settings/notifications", label: "Notifications", icon: Bell },
  { href: "/settings/appearance", label: "Appearance", icon: Palette },
]

export function SettingsTabs() {
  const pathname = usePathname()

  return (
    <div className="flex gap-1 border-b">
      {TABS.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(tab.href + "/")
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex items-center gap-2 rounded-t-lg border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
              active
                ? "border-primary bg-muted/50 text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="size-4" />
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
