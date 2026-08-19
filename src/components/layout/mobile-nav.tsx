"use client"

import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  HomeIcon,
  MessageSquareIcon,
  CheckSquareIcon,
  CalendarIcon,
  SparklesIcon,
  MoreHorizontalIcon,
} from "lucide-react"

interface MobileNavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
}

const defaultItems: MobileNavItem[] = [
  { label: "Home", href: "/", icon: HomeIcon },
  { label: "Messages", href: "/messages", icon: MessageSquareIcon, badge: 3 },
  { label: "Tasks", href: "/tasks", icon: CheckSquareIcon },
  { label: "Calendar", href: "/calendar", icon: CalendarIcon },
  { label: "AI", href: "/ai", icon: SparklesIcon },
  { label: "More", href: "/more", icon: MoreHorizontalIcon },
]

interface MobileNavProps extends React.ComponentProps<"nav"> {
  items?: MobileNavItem[]
  activeHref?: string
}

function MobileNav({
  items = defaultItems,
  activeHref,
  className,
  ...props
}: MobileNavProps) {
  return (
    <nav
      data-slot="mobile-nav"
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t bg-background px-2 py-1 safe-area-inset-bottom md:hidden",
        className
      )}
      {...props}
    >
      {items.map((item) => {
        const Icon = item.icon
        const isActive = activeHref === item.href

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-xs transition-colors",
              isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="relative">
              <Icon className="size-5" />
              {item.badge && item.badge > 0 && (
                <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                  {item.badge > 9 ? "9+" : item.badge}
                </span>
              )}
            </span>
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

export { MobileNav, type MobileNavItem }
