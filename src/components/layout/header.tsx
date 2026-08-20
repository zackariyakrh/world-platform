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
  Phone,
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
  userName?: string | null
  userEmail?: string | null
  userAvatar?: string | null
}

function Header({
  title,
  actions,
  onMenuClick,
  onSearchClick,
  notificationCount = 0,
  userName,
  userEmail,
  userAvatar,
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
        "sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border/50 bg-background/60 pl-4 pr-6 backdrop-blur-xl",
        "shadow-[0_1px_3px_oklch(from_var(--glow)_l_c_h_/_0.06)]",
        className
      )}
      {...props}
    >
      {/* Mobile menu */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onMenuClick}
        className="shrink-0 md:hidden"
      >
        <Menu className="size-5" />
      </Button>

      {/* Page title (mobile) */}
      {title && (
        <h1 className="truncate text-lg font-semibold md:hidden">{title}</h1>
      )}

      {/* Search bar — prominent, centered */}
      <button
        onClick={onSearchClick}
        className={cn(
          "hidden md:flex items-center gap-3 rounded-xl border border-border/60 bg-muted/40 px-4 py-2.5 text-sm text-muted-foreground",
          "transition-all duration-200 hover:bg-muted/70 hover:border-border hover:text-foreground",
          "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40",
          "min-w-0 max-w-md flex-1"
        )}
      >
        <Search className="size-4 shrink-0" />
        <span className="truncate">Search anything...</span>
        <kbd className="ml-auto shrink-0 rounded-md border border-border/60 bg-background/80 px-2 py-0.5 text-xs font-medium text-muted-foreground">
          Ctrl+K
        </kbd>
      </button>

      {/* Mobile search */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onSearchClick}
        className="shrink-0 md:hidden"
      >
        <Search className="size-5" />
      </Button>

      <div className="flex-1 md:flex-none" />

      {actions}

      {/* Right side actions */}
      <div className="flex items-center gap-1">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative shrink-0 rounded-xl">
          <Bell className="size-5" />
          {notificationCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex min-w-5 h-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-semibold text-primary-foreground shadow-[0_0_8px_oklch(from_var(--primary)_l_c_h_/_0.3)]">
              {notificationCount > 99 ? "99+" : notificationCount}
            </span>
          )}
        </Button>

        {/* Calls / DMs */}
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 rounded-xl"
          onClick={() => router.push("/dms")}
        >
          <Phone className="size-5" />
        </Button>

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 rounded-xl"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <ThemeIcon className="size-5" />
        </Button>

        <Separator orientation="vertical" className="mx-1 h-7" />

        {/* User avatar dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-colors hover:bg-muted" />
            }
          >
            <div className="relative">
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt={userName || ""}
                  className="size-9 rounded-xl object-cover ring-2 ring-primary/15"
                />
              ) : (
                <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-sm font-semibold text-primary">
                  {(userName || userEmail || "?").slice(0, 2).toUpperCase()}
                </div>
              )}
              <StatusBadge
                status="online"
                size="sm"
                className="absolute -right-0.5 -bottom-0.5"
              />
            </div>
            <div className="hidden lg:flex flex-col items-start">
              <span className="text-sm font-medium leading-tight">{userName || "User"}</span>
              <span className="text-xs text-muted-foreground leading-tight">{userEmail || ""}</span>
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
            <DropdownMenuItem variant="destructive" onClick={() => signOut({ callbackUrl: `${window.location.origin}/auth/login` })}>
              <LogOut className="size-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

export { Header, type HeaderProps }
