"use client"

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
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
  Search,
  Plus,
  X,
  Compass,
  ChevronsUpDown,
  Users,
  Pin,
  Loader2,
  HelpCircle,
  Paintbrush,
  LogOut,
  Phone,
  Shield,
  Bell,
  ChevronLeft,
  ChevronRight,
  Zap,
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
  onClose?: () => void
  onChannelSelect?: (channelId: string) => void
  userRole?: string
  appName?: string
}

function Sidebar({
  workspaceId,
  currentChannelId,
  open = false,
  onClose,
  onChannelSelect,
  userRole,
  appName = "Nexus",
  className,
  ...props
}: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [collapsed, setCollapsed] = React.useState(false)
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
          "fixed inset-y-0 left-0 z-50 flex flex-col text-sidebar-foreground",
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
                <DropdownMenuItem onClick={() => router.push("/settings")}>
                  <Settings className="size-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/help")}>
                  <HelpCircle className="size-4" />
                  Help & Support
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={() => router.push("/admin/users")}>
                    <Users className="size-4" />
                    Admin Panel
                  </DropdownMenuItem>
                )}
                {isAdmin && (
                  <DropdownMenuItem onClick={() => router.push("/admin/branding")}>
                    <Paintbrush className="size-4" />
                    Branding
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <button
              onClick={() => router.push("/dashboard")}
              className="flex size-9 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground shadow-[0_0_12px_oklch(from_var(--primary)_l_c_h_/_0.3)] hover:shadow-[0_0_20px_oklch(from_var(--primary)_l_c_h_/_0.4)] transition-shadow"
            >
              {appName.charAt(0).toUpperCase()}
            </button>
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

        {/* Search Bar */}
        <div className={cn("px-3 py-2", collapsed && "px-2")}>
          <button
            onClick={() => {
              if (collapsed) {
                setCollapsed(false)
                setTimeout(() => {
                  const event = new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true })
                  window.dispatchEvent(event)
                }, 350)
              } else {
                const event = new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true })
                window.dispatchEvent(event)
              }
            }}
            className={cn(
              "flex items-center gap-2 rounded-lg bg-sidebar-accent/50 text-sidebar-accent-foreground transition-all duration-200 hover:bg-sidebar-accent",
              collapsed ? "h-9 w-9 justify-center px-0" : "h-9 w-full px-2.5"
            )}
          >
            <Search className="size-4 shrink-0" />
            {!collapsed && (
              <>
                <span className="text-base">Search</span>
                <kbd className="ml-auto rounded border bg-background px-1 py-0.5 text-[10px] font-medium text-muted-foreground">
                  Ctrl+K
                </kbd>
              </>
            )}
          </button>
        </div>

        {/* Navigation Items */}
        <ScrollArea className="flex-1 px-2">
          <div className="flex flex-col gap-0.5">
            {/* Main Navigation */}
            <SidebarItem
              icon={Compass}
              label="Explore"
              isActive={isActive("/explore")}
              collapsed={collapsed}
              onClick={() => router.push("/explore")}
            />
            <SidebarItem
              icon={MessageSquare}
              label="Threads"
              isActive={isActive("/threads")}
              collapsed={collapsed}
              onClick={() => router.push("/threads")}
            />
            <SidebarItem
              icon={Pin}
              label="Saved Items"
              isActive={isActive("/bookmarks")}
              collapsed={collapsed}
              onClick={() => router.push("/bookmarks")}
            />
            <SidebarItem
              icon={Bell}
              label="Notifications"
              isActive={isActive("/notifications")}
              collapsed={collapsed}
              onClick={() => router.push("/notifications")}
            />

            <div className="my-2">
              <Separator />
            </div>

            {/* Channels Section */}
            {!collapsed ? (
              <Collapsible defaultOpen>
                <div className="flex items-center group/category">
                  <CollapsibleTrigger
                    render={
                      <button className="flex flex-1 items-center gap-0.5 px-1 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors" />
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
                          <Label className="text-xs font-medium uppercase text-muted-foreground">Name</Label>
                          <Input
                            placeholder="e.g. marketing"
                            value={createName}
                            onChange={(e) => setCreateName(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") handleCreateChannel() }}
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label className="text-xs font-medium uppercase text-muted-foreground">Description</Label>
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
                      <div className="px-2 py-2 text-xs text-muted-foreground">Loading...</div>
                    ) : channels.length === 0 ? (
                      <div className="px-2 py-2 text-xs text-muted-foreground">No channels yet</div>
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
              <SidebarItem
                icon={Hash}
                label="Channels"
                isActive={false}
                collapsed={collapsed}
                onClick={() => setCollapsed(false)}
              />
            )}

            <div className="my-2">
              <Separator />
            </div>

            {/* Direct Messages Section */}
            {!collapsed && (
              <div className="group/dm-section">
                <button
                  onClick={() => setShowDMs(!showDMs)}
                  className="flex w-full items-center gap-0.5 px-1 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronDown
                    className={cn("size-3 transition-transform", !showDMs && "-rotate-90")}
                  />
                  Direct Messages
                </button>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Bottom Actions */}
        <div className="mt-auto border-t">
          {/* Admin Quick Access (when collapsed) */}
          {collapsed && isAdmin && (
            <div className="flex flex-col items-center gap-1 px-2 py-2">
              <SidebarItem
                icon={Shield}
                label="Admin"
                isActive={isActive("/admin")}
                collapsed={collapsed}
                onClick={() => router.push("/admin/users")}
              />
            </div>
          )}

          {/* Main Bottom Actions */}
          <div className={cn(
            "flex items-center gap-1",
            collapsed ? "flex-col px-2 py-2" : "px-3 py-2"
          )}>
            <SidebarItem
              icon={Phone}
              label="Call"
              collapsed={collapsed}
              onClick={() => {}}
            />
            <SidebarItem
              icon={Settings}
              label="Settings"
              isActive={isActive("/settings")}
              collapsed={collapsed}
              onClick={() => router.push("/settings")}
            />
            <SidebarItem
              icon={HelpCircle}
              label="Help"
              isActive={isActive("/help")}
              collapsed={collapsed}
              onClick={() => router.push("/help")}
            />
            <div className={cn(!collapsed && "ml-auto")}>
              <SidebarItem
                icon={LogOut}
                label="Sign Out"
                collapsed={collapsed}
                onClick={() => signOut({ callbackUrl: `${window.location.origin}/auth/login` })}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              />
            </div>
          </div>

          {/* Collapse Toggle */}
          <div className={cn(
            "hidden md:flex items-center border-t",
            collapsed ? "justify-center px-2 py-2" : "justify-end px-3 py-2"
          )}>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-all duration-200"
            >
              {collapsed ? (
                <ChevronRight className="size-4" />
              ) : (
                <>
                  <ChevronLeft className="size-4" />
                  <span>Collapse</span>
                </>
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

function SidebarItem({
  icon: Icon,
  label,
  isActive = false,
  collapsed = false,
  badge,
  onClick,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  isActive?: boolean
  collapsed?: boolean
  badge?: number
  onClick?: () => void
  className?: string
}) {
  return (
    <button
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={cn(
        "group flex items-center rounded-lg transition-all duration-200",
        collapsed
          ? "size-10 justify-center"
          : "w-full gap-2.5 px-2.5 py-2",
        isActive
          ? "bg-primary/10 text-primary shadow-[inset_0_0_20px_oklch(from_var(--primary)_l_c_h_/_0.08)]"
          : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground hover:shadow-[inset_0_0_20px_oklch(from_var(--sidebar-primary)_l_c_h_/_0.06)]",
        className
      )}
    >
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
        <span className="ml-auto flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground shadow-[0_0_8px_oklch(from_var(--primary)_l_c_h_/_0.3)]">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
      {isActive && !collapsed && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary shadow-[0_0_8px_oklch(from_var(--primary)_l_c_h_/_0.4)]" />
      )}
    </button>
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
          <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground shadow-[0_0_8px_oklch(from_var(--primary)_l_c_h_/_0.4)] animate-[glow-pulse_2s_ease-in-out_infinite]">
            {channel.mentionCount > 99 ? "99+" : channel.mentionCount}
          </span>
        )}
        {!channel.muted && channel.unread && channel.unread > 0 && !channel.mentionCount && (
          <span className="size-2 shrink-0 rounded-full bg-primary shadow-[0_0_6px_oklch(from_var(--primary)_l_c_h_/_0.5)]" />
        )}
      </div>
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary shadow-[0_0_8px_oklch(from_var(--primary)_l_c_h_/_0.4)]" />
      )}
    </button>
  )
}

export { Sidebar, type SidebarProps }
