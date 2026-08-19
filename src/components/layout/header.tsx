"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { StatusBadge } from "@/components/ui/status-badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Search,
  Bell,
  Menu,
  Settings,
  User,
  LogOut,
  Moon,
  Sun,
  HelpCircle,
} from "lucide-react"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"

interface HeaderProps extends React.ComponentProps<"header"> {
  title?: string
  actions?: React.ReactNode
  onMenuClick?: () => void
  onSearchClick?: () => void
  notificationCount?: number
}

function Header({
  title,
  actions,
  onMenuClick,
  onSearchClick,
  notificationCount = 0,
  className,
  ...props
}: HeaderProps) {
  const { theme, setTheme } = useTheme()
  const router = useRouter()

  const themeLabel = theme === "dark" ? "Light Mode" : "Dark Mode"
  const ThemeIcon = theme === "dark" ? Sun : Moon

  return (
    <header
      data-slot="header"
      className={cn(
        "sticky top-0 z-30 flex h-12 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur-sm",
        "shadow-[0_1px_2px_oklch(from_var(--glow)_l_c_h_/_0.06)]",
        className
      )}
      {...props}
    >
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onMenuClick}
        className="shrink-0 md:hidden"
      >
        <Menu className="size-4" />
      </Button>

      {title && (
        <h1 className="truncate text-sm font-medium">{title}</h1>
      )}

      <div className="flex-1" />

      {actions}

      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onSearchClick}
        className="shrink-0"
      >
        <Search className="size-4" />
      </Button>

      <Button variant="ghost" size="icon-sm" className="relative shrink-0">
        <Bell className="size-4" />
        {notificationCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
            {notificationCount > 99 ? "99+" : notificationCount}
          </span>
        )}
      </Button>

      <Separator orientation="vertical" className="mx-1 h-5" />

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button className="flex items-center gap-2 rounded-md p-1 hover:bg-muted transition-colors" />
          }
        >
          <div className="relative">
            <div className="flex size-7 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
              Y
            </div>
            <StatusBadge
              status="online"
              size="sm"
              className="absolute -right-0.5 -bottom-0.5"
            />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => router.push("/settings/profile")}>
            <User className="size-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/settings")}>
            <Settings className="size-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/help")}>
            <HelpCircle className="size-4" />
            Help & Support
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <ThemeIcon className="size-4" />
            {themeLabel}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => signOut({ callbackUrl: "/auth/login" })}>
            <LogOut className="size-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}

export { Header, type HeaderProps }
