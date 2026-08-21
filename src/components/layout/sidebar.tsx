"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Hash,
  ChevronDown,
  Settings,
  MessageSquare,
  Plus,
  X,
  Compass,
  ChevronsUpDown,
  Users,
  Pin,
  Loader2,
  Shield,
  Bell,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  FolderOpen,
  Music,
  CalendarDays,
} from "lucide-react"

interface Channel {
  id: string
  name: string
  type: "text" | "voice"
  description?: string | null
  unread?: number
  muted?: boolean
  mentionCount?: number
}

interface SidebarProps extends React.ComponentProps<"aside"> {
  workspaceId?: string
  currentChannelId?: string
  open?: boolean
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
  onClose?: () => void
  onChannelSelect?: (channelId: string) => void
  userRole?: string
  appName?: string
}

function Sidebar({
  workspaceId,
  currentChannelId,
  open = false,
  collapsed: collapsedProp,
  onCollapsedChange,
  onClose,
  onChannelSelect,
  userRole,
  appName = "Nexus",
  className,
  ...props
}: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [collapsedState, setCollapsedState] = React.useState(false)
  const collapsed = collapsedProp ?? collapsedState
  const [channels, setChannels] = React.useState<Channel[]>([])
  const [channelsLoading, setChannelsLoading] = React.useState(true)
  const [showDMs, setShowDMs] = React.useState(true)
  const [createOpen, setCreateOpen] = React.useState(false)
  const [createName, setCreateName] = React.useState("")
  const [createDesc, setCreateDesc] = React.useState("")
  const [creating, setCreating] = React.useState(false)

  const isAdmin = userRole === "owner" || userRole === "admin"

  React.useEffect(() => {
    async function loadChannels() {
      setChannelsLoading(true)
      try {
        const url = workspaceId ? `/api/channels?workspaceId=${workspaceId}` : "/api/channels"
        const res = await fetch(url)
        if (res.ok) {
          const data = await res.json()
          setChannels(data.map((ch: any) => ({
            id: ch.id,
            name: ch.name,
            type: ch.type || "text",
            description: ch.description,
          })))
        }
      } catch {
        // keep empty
      } finally {
        setChannelsLoading(false)
      }
    }
    loadChannels()

    function onChannelsChanged() { loadChannels() }
    window.addEventListener("channels:changed", onChannelsChanged)
    return () => window.removeEventListener("channels:changed", onChannelsChanged)
  }, [workspaceId])

  async function handleCreateChannel() {
    if (!createName.trim()) return
    setCreating(true)
    try {
      const res = await fetch("/api/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createName.trim(),
          description: createDesc.trim() || undefined,
          workspaceId,
        }),
      })
      if (res.ok) {
        const ch = await res.json()
        setChannels((prev) => [...prev, {
          id: ch.id,
          name: ch.name,
          type: ch.type || "text",
          description: ch.description,
        }])
        setCreateName("")
        setCreateDesc("")
        setCreateOpen(false)
      }
    } catch {
      // ignore
    } finally {
      setCreating(false)
    }
  }

  function isActive(href: string) {
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        data-slot="sidebar"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col overflow-hidden text-sidebar-foreground",
          "border-r border-sidebar-border",
          "before:pointer-events-none before:absolute before:inset-y-0 before:right-0 before:w-px before:bg-gradient-to-b before:from-primary/20 before:via-primary/5 before:to-transparent",
          collapsed ? "w-[68px]" : "w-64",
          "transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
          "md:relative md:z-auto",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          className
        )}
        style={{ background: "var(--sidebar)" }}
        {...props}
      >
        {/* App Header */}
        <div className={cn(
          "flex h-14 items-center border-b",
          collapsed ? "justify-center px-2" : "justify-between px-4"
        )}>
          {!collapsed ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2 py-1.5 text-base font-semibold hover:bg-sidebar-accent transition-colors" />
                }
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground shadow-[0_0_12px_oklch(from_var(--primary)_l_c_h_/_0.3)]">
                  {appName.charAt(0).toUpperCase()}
                </span>
                <span className="truncate">{appName}</span>
                <ChevronsUpDown className="ml-auto size-4 shrink-0 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem onClick={() => router.push("/explore")}>
                  <Compass className="size-4" />
                  Explore
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/threads")}>
                  <MessageSquare className="size-4" />
                  Threads
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/bookmarks")}>
                  <Pin className="size-4" />
                  Saved Items
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/notifications")}>
                  <Bell className="size-4" />
                  Notifications
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/groups")}>
                  <Users className="size-4" />
                  Groups
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/projects")}>
                  <Briefcase className="size-4" />
                  Projects
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/workspaces")}>
                  <FolderOpen className="size-4" />
                  Workspaces
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/music")}>
                  <Music className="size-4" />
                  Music
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/calendar")}>
                  <CalendarDays className="size-4" />
                  Calendar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/settings")}>
                  <Settings className="size-4" />
                  Settings
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={() => router.push("/admin/users")}>
                    <Shield className="size-4" />
                    Admin Panel
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button className="flex size-9 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground shadow-[0_0_12px_oklch(from_var(--primary)_l_c_h_/_0.3)] hover:shadow-[0_0_20px_oklch(from_var(--primary)_l_c_h_/_0.4)] transition-shadow" />
                }
              >
                {appName.charAt(0).toUpperCase()}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem onClick={() => router.push("/explore")}>
                  <Compass className="size-4" />
                  Explore
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/threads")}>
                  <MessageSquare className="size-4" />
                  Threads
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/bookmarks")}>
                  <Pin className="size-4" />
                  Saved Items
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/notifications")}>
                  <Bell className="size-4" />
                  Notifications
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/groups")}>
                  <Users className="size-4" />
                  Groups
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/projects")}>
                  <Briefcase className="size-4" />
                  Projects
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/workspaces")}>
                  <FolderOpen className="size-4" />
                  Workspaces
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/music")}>
                  <Music className="size-4" />
                  Music
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/calendar")}>
                  <CalendarDays className="size-4" />
                  Calendar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/settings")}>
                  <Settings className="size-4" />
                  Settings
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={() => router.push("/admin/users")}>
                    <Shield className="size-4" />
                    Admin Panel
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Mobile close */}
          {onClose && (
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={onClose}
              className="shrink-0 md:hidden ml-1"
            >
              <X className="size-4" />
            </Button>
          )}
        </div>

        {/* Navigation Items */}
        <ScrollArea className="flex-1 px-2">
          <div className="flex flex-col gap-0.5">
            {/* Channels Section */}
            {!collapsed ? (
              <Collapsible defaultOpen>
                <div className="flex items-center group/category">
                  <CollapsibleTrigger
                    render={
                      <button className="flex flex-1 items-center gap-0.5 px-1 py-1 text-sm font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors" />
                    }
                  >
                    <ChevronDown className="size-3 transition-transform" />
                    Channels
                  </CollapsibleTrigger>
                  <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogTrigger
                      render={
                        <button className="opacity-0 group-hover/category:opacity-100 transition-opacity p-0.5 rounded hover:bg-sidebar-accent" />
                      }
                    >
                      <Plus className="size-3" />
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Create Channel</DialogTitle>
                        <DialogDescription>Add a new channel to your workspace.</DialogDescription>
                      </DialogHeader>
                      <div className="flex flex-col gap-5 py-1">
                        <div className="flex flex-col gap-2">
                          <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                          <Input
                            placeholder="e.g. marketing"
                            value={createName}
                            onChange={(e) => setCreateName(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") handleCreateChannel() }}
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                          <Input
                            placeholder="What is this channel about?"
                            value={createDesc}
                            onChange={(e) => setCreateDesc(e.target.value)}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
                        <Button onClick={handleCreateChannel} disabled={creating || !createName.trim()}>
                          {creating ? <Loader2 className="size-3.5 animate-spin" /> : "Create Channel"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                <CollapsibleContent>
                  <div className="flex flex-col gap-0.5">
                    {channelsLoading ? (
                      <div className="px-2 py-2 text-sm text-muted-foreground">Loading...</div>
                    ) : channels.length === 0 ? (
                      <div className="px-2 py-2 text-sm text-muted-foreground">No channels yet</div>
                    ) : (
                      channels.map((channel) => (
                        <ChannelItem
                          key={channel.id}
                          channel={channel}
                          isActive={currentChannelId === channel.id}
                          collapsed={collapsed}
                          onClick={() => {
                            onChannelSelect?.(channel.id)
                            router.push(`/channels/${channel.id}`)
                          }}
                        />
                      ))
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ) : (
              <SidebarLink
                icon={Hash}
                label="Channels"
                href="#"
                isActive={false}
                collapsed={collapsed}
                onClick={() => {
                  setCollapsedState(false)
                  onCollapsedChange?.(false)
                }}
              />
            )}

            <div className="my-2">
              <Separator />
            </div>

            {/* Direct Messages Section */}
            {!collapsed ? (
              <div className="group/dm-section">
                <button
                  onClick={() => setShowDMs(!showDMs)}
                  className="flex w-full items-center gap-0.5 px-1 py-1 text-sm font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronDown
                    className={cn("size-3 transition-transform", !showDMs && "-rotate-90")}
                  />
                  Direct Messages
                </button>
              </div>
            ) : (
              <SidebarLink
                icon={MessageSquare}
                label="Direct Messages"
                href="#"
                isActive={false}
                collapsed={collapsed}
                onClick={() => {
                  setCollapsedState(false)
                  onCollapsedChange?.(false)
                }}
              />
            )}
          </div>
        </ScrollArea>

        {/* Bottom Actions */}
        <div className="mt-auto shrink-0 border-t">
          {/* Admin Quick Access (when collapsed) */}
          {collapsed && isAdmin && (
            <div className="flex flex-col items-center gap-1 px-2 py-2">
              <Link
                href="/admin/users"
                title="Admin"
                className={cn(
                  "flex size-10 items-center justify-center rounded-lg transition-all duration-200",
                  isActive("/admin")
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                )}
              >
                <Shield className="size-5" />
              </Link>
            </div>
          )}

          {/* Collapse Toggle */}
          <div className={cn(
            "hidden md:flex items-center border-t",
            collapsed ? "justify-center px-2 py-2" : "justify-end px-3 py-2"
          )}>
            <button
              onClick={() => {
                const next = !collapsed
                setCollapsedState(next)
                onCollapsedChange?.(next)
              }}
              className="flex items-center justify-center rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-all duration-200"
            >
              {collapsed ? (
                <ChevronRight className="size-4" />
              ) : (
                <ChevronLeft className="size-4" />
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

function SidebarLink({
  icon: Icon,
  label,
  href,
  isActive = false,
  collapsed = false,
  badge,
  onClick,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  href: string
  isActive?: boolean
  collapsed?: boolean
  badge?: number
  onClick?: () => void
  className?: string
}) {
  const inner = (
    <>
      <Icon className={cn(
        "shrink-0 transition-all duration-200",
        collapsed ? "size-5" : "size-4",
        isActive && "drop-shadow-[0_0_8px_oklch(from_var(--primary)_l_c_h_/_0.5)]",
        !isActive && "group-hover:drop-shadow-[0_0_6px_oklch(from_var(--sidebar-primary)_l_c_h_/_0.4)]"
      )} />
      {!collapsed && (
        <span className="truncate text-base">{label}</span>
      )}
      {!collapsed && badge !== undefined && badge > 0 && (
        <span className="ml-auto flex size-5 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground shadow-[0_0_8px_oklch(from_var(--primary)_l_c_h_/_0.3)]">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
      {isActive && !collapsed && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary shadow-[0_0_8px_oklch(from_var(--primary)_l_c_h_/_0.4)]" />
      )}
    </>
  )

  if (onClick) {
    return (
      <button
        onClick={onClick}
        title={collapsed ? label : undefined}
        className={cn(
          "group relative flex items-center rounded-lg transition-all duration-200",
          collapsed ? "size-10 justify-center" : "w-full gap-2.5 px-2.5 py-2",
          isActive
            ? "bg-primary/10 text-primary shadow-[inset_0_0_20px_oklch(from_var(--primary)_l_c_h_/_0.08)]"
            : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground hover:shadow-[inset_0_0_20px_oklch(from_var(--sidebar-primary)_l_c_h_/_0.06)]",
          className
        )}
      >
        {inner}
      </button>
    )
  }

  return (
    <Link
      href={href}
      prefetch={true}
      title={collapsed ? label : undefined}
      className={cn(
        "group relative flex items-center rounded-lg transition-all duration-200",
        collapsed ? "size-10 justify-center" : "w-full gap-2.5 px-2.5 py-2",
        isActive
          ? "bg-primary/10 text-primary shadow-[inset_0_0_20px_oklch(from_var(--primary)_l_c_h_/_0.08)]"
          : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground hover:shadow-[inset_0_0_20px_oklch(from_var(--sidebar-primary)_l_c_h_/_0.06)]",
        className
      )}
    >
      {inner}
    </Link>
  )
}

function ChannelItem({
  channel,
  isActive,
  collapsed = false,
  onClick,
}: {
  channel: Channel
  isActive: boolean
  collapsed?: boolean
  onClick?: () => void
}) {
  if (collapsed) {
    return (
      <button
        onClick={onClick}
        title={channel.name}
        className={cn(
          "group/channel flex size-10 items-center justify-center rounded-lg transition-all duration-200",
          isActive
            ? "bg-primary/10 text-primary shadow-[inset_0_0_20px_oklch(from_var(--primary)_l_c_h_/_0.08)]"
            : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
        )}
      >
        <Hash className={cn(
          "size-4 shrink-0 transition-all duration-200",
          isActive && "text-primary drop-shadow-[0_0_6px_oklch(from_var(--primary)_l_c_h_/_0.5)]"
        )} />
      </button>
    )
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        "group/channel relative flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-base transition-all duration-200",
        isActive
          ? "bg-primary/10 text-primary shadow-[inset_0_0_24px_oklch(from_var(--primary)_l_c_h_/_0.08)]"
          : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground hover:shadow-[inset_0_0_20px_oklch(from_var(--sidebar-primary)_l_c_h_/_0.04)]"
      )}
    >
      <Hash className={cn(
        "size-4 shrink-0 transition-all duration-200",
        isActive && "text-primary drop-shadow-[0_0_6px_oklch(from_var(--sidebar-primary)_l_c_h_/_0.5)]"
      )} />
      <span className="truncate">{channel.name}</span>
      <div className="ml-auto flex items-center gap-1">
        {channel.mentionCount && channel.mentionCount > 0 && (
          <span className="flex size-5 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground shadow-[0_0_8px_oklch(from_var(--primary)_l_c_h_/_0.4)] animate-[glow-pulse_2s_ease-in-out_infinite]">
            {channel.mentionCount > 99 ? "99+" : channel.mentionCount}
          </span>
        )}
        {!channel.muted && channel.unread && channel.unread > 0 && !channel.mentionCount && (
          <span className="size-2 shrink-0 rounded-full bg-primary shadow-[0_0_6px_oklch(from_var(--sidebar-primary)_l_c_h_/_0.5)]" />
        )}
      </div>
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary shadow-[0_0_8px_oklch(from_var(--primary)_l_c_h_/_0.4)]" />
      )}
    </button>
  )
}

export { Sidebar, type SidebarProps }
