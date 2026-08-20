"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
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
  HelpCircle,
  Phone,
  Sun,
  Moon,
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

  const ThemeIcon = theme === "dark" ? Sun : Moon

  return (
    <header
      data-slot="header"
      className={cn(
        "sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border/50 bg-background/60 px-5 backdrop-blur-xl",
        "shadow-[0_1px_3px_oklch(from_var(--glow)_l_c_h_/_0.06)]",
        className
      )}
      {...props}
    >
      {/* Left — menu + title */}
      <div className="flex items-center gap-3 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="shrink-0 md:hidden rounded-full size-9"
        >
          <Menu className="size-4" />
        </Button>
        {title && (
          <h1 className="truncate text-lg font-semibold">{title}</h1>
        )}
      </div>

      {/* Center — search */}
      <button
        onClick={onSearchClick}
        className={cn(
          "hidden md:flex items-center gap-3 rounded-full border border-white/20 bg-white/10 backdrop-blur-xl px-5 py-2.5 text-sm text-muted-foreground",
          "shadow-[0_4px_24px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.1)]",
          "transition-all duration-300 hover:bg-white/20 hover:border-white/30 hover:text-foreground hover:shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.15)]",
          "max-w-lg flex-1"
        )}
      >
        <Search className="size-4 shrink-0 opacity-60" />
        <span className="truncate opacity-70">Search anything...</span>
        <kbd className="ml-auto shrink-0 rounded-lg border border-white/15 bg-white/10 backdrop-blur-sm px-2.5 py-1 text-[11px] font-medium text-muted-foreground/80 shadow-sm">
          Ctrl+K
        </kbd>
      </button>

      {/* Right — actions + profile */}
      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onSearchClick}
          className="shrink-0 md:hidden rounded-full size-9"
        >
          <Search className="size-4" />
        </Button>

        {actions}

        <Button variant="ghost" size="icon" className="relative shrink-0 rounded-full size-9">
          <Bell className="size-4" />
          {notificationCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex min-w-5 h-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-semibold text-primary-foreground shadow-[0_0_8px_oklch(from_var(--primary)_l_c_h_/_0.3)]">
              {notificationCount > 99 ? "99+" : notificationCount}
            </span>
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 rounded-full size-9"
          onClick={() => router.push("/dms")}
        >
          <Phone className="size-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 rounded-full size-9"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <ThemeIcon className="size-4" />
        </Button>

        <div className="mx-1 h-6 w-px bg-border/60" />

        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 rounded-full size-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={() => signOut({ callbackUrl: `${window.location.origin}/auth/login` })}
          title="Sign Out"
        >
          <LogOut className="size-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button className="flex items-center gap-2.5 rounded-full px-2 py-1.5 transition-colors hover:bg-muted" />
            }
          >
            <div className="relative">
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt={userName || ""}
                  className="size-8 rounded-full object-cover ring-2 ring-primary/15"
                />
              ) : (
                <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-xs font-semibold text-primary">
                  {(userName || userEmail || "?").slice(0, 2).toUpperCase()}
                </div>
              )}
              <span className="absolute -right-0.5 -bottom-0.5 block size-2.5 rounded-full border-2 border-background bg-emerald-500" />
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
            <DropdownMenuItem
              variant="destructive"
              onClick={() => signOut({ callbackUrl: `${window.location.origin}/auth/login` })}
            >
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
