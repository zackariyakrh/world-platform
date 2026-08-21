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
  Sparkles,
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
  const [scrolled, setScrolled] = React.useState(false)

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const ThemeIcon = theme === "dark" ? Sun : Moon

  return (
    <header
      data-slot="header"
      className={cn(
        "sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 px-4 transition-all duration-300",
        scrolled
          ? "border-b border-border/40 bg-background/80 backdrop-blur-2xl shadow-[0_1px_12px_rgba(0,0,0,0.06)]"
          : "border-b border-transparent bg-background/40 backdrop-blur-xl",
        className
      )}
      {...props}
    >
      {/* Left — menu + branding */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={onMenuClick}
          className="flex md:hidden size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Menu className="size-4" />
        </button>

        <div className="hidden md:flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sparkles className="size-3.5" />
          </div>
          {title && (
            <h1 className="text-sm font-semibold tracking-tight">{title}</h1>
          )}
        </div>
      </div>

      {/* Center — search */}
      <button
        onClick={onSearchClick}
        className={cn(
          "hidden md:flex items-center gap-2.5 mx-auto rounded-full px-4 py-2 text-sm text-muted-foreground/70",
          "border border-border/40 bg-muted/30",
          "transition-all duration-200",
          "hover:bg-muted/60 hover:border-border/60 hover:text-foreground hover:shadow-sm",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
          "max-w-md w-full"
        )}
      >
        <Search className="size-3.5 shrink-0 opacity-50" />
        <span className="truncate">Search anything...</span>
        <kbd className="ml-auto shrink-0 rounded-md border border-border/50 bg-background/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground/60">
          Ctrl+K
        </kbd>
      </button>

      {/* Right — compact icon row + profile */}
      <div className="flex items-center gap-1 shrink-0 ml-auto">
        <button
          onClick={onSearchClick}
          className="flex md:hidden size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Search className="size-4" />
        </button>

        {actions}

        <button
          onClick={() => router.push("/dms")}
          className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          title="Messages"
        >
          <Phone className="size-4" />
        </button>

        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          title="Toggle theme"
        >
          <ThemeIcon className="size-4" />
        </button>

        <div className="relative">
          <button className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
            <Bell className="size-4" />
          </button>
          {notificationCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground shadow-[0_0_8px_oklch(from_var(--primary)_l_c_h_/_0.35)]">
              {notificationCount > 99 ? "99+" : notificationCount}
            </span>
          )}
        </div>

        <div className="mx-1 h-5 w-px bg-border/50" />

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button className="flex items-center gap-2 rounded-full p-1 transition-colors hover:bg-accent/50" />
            }
          >
            <div className="relative">
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt={userName || ""}
                  className="size-7 rounded-full object-cover ring-2 ring-border/50"
                />
              ) : (
                <div className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary ring-2 ring-border/50">
                  {(userName || userEmail || "?").slice(0, 2).toUpperCase()}
                </div>
              )}
              <span className="absolute -bottom-0.5 -right-0.5 block size-2 rounded-full border-[1.5px] border-background bg-emerald-500" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium leading-none">{userName || "User"}</p>
              <p className="mt-0.5 text-xs leading-none text-muted-foreground">{userEmail || ""}</p>
            </div>
            <DropdownMenuSeparator />
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
