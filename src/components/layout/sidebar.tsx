"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
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
import { StatusBadge, type StatusType } from "@/components/ui/status-badge"
import {
  Hash,
  Volume2,
  ChevronDown,
  Settings,
  MessageSquare,
  Search,
  Plus,
  X,
  Headphones,
  Mic,
  Compass,
  ChevronsUpDown,
  Users,
  Pin,
  BellOff,
  Loader2,
  Trash2,
  HelpCircle,
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

interface DirectMessage {
  id: string
  name: string
  image?: string | null
  status: StatusType
  unread?: number
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
  const [channels, setChannels] = React.useState<Channel[]>([])
  const [channelsLoading, setChannelsLoading] = React.useState(true)
  const [showDMs, setShowDMs] = React.useState(true)
  const [createOpen, setCreateOpen] = React.useState(false)
  const [createName, setCreateName] = React.useState("")
  const [createDesc, setCreateDesc] = React.useState("")
  const [creating, setCreating] = React.useState(false)

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

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        data-slot="sidebar"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar text-sidebar-foreground transition-transform duration-200 md:relative md:z-auto md:translate-x-0",
          "border-r border-sidebar-border",
          "before:pointer-events-none before:absolute before:inset-y-0 before:right-0 before:w-px before:bg-gradient-to-b before:from-primary/20 before:via-primary/5 before:to-transparent",
          open ? "translate-x-0" : "-translate-x-full",
          className
        )}
        {...props}
      >
        <div className="flex h-12 items-center justify-between border-b px-3">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1 py-1 text-sm font-medium hover:bg-sidebar-accent transition-colors" />
              }
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
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
              {(userRole === "owner" || userRole === "admin") && (
                <DropdownMenuItem onClick={() => router.push("/admin/users")}>
                  <Users className="size-4" />
                  Admin Panel
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {onClose && (
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={onClose}
              className="shrink-0 md:hidden"
            >
              <X className="size-4" />
            </Button>
          )}
        </div>

        <div className="px-3 py-2">
          <button
            onClick={() => {
              const event = new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true })
              window.dispatchEvent(event)
            }}
            className="flex h-8 w-full items-center gap-2 rounded-md bg-sidebar-accent/50 px-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent"
          >
            <Search className="size-4 shrink-0" />
            <span>Search</span>
            <kbd className="ml-auto rounded border bg-background px-1 py-0.5 text-[10px] font-medium text-muted-foreground">
              Ctrl+K
            </kbd>
          </button>
        </div>

        <ScrollArea className="flex-1 px-2">
          <div className="flex flex-col gap-0.5">
            <SidebarItem icon={Compass} label="Explore" onClick={() => router.push("/explore")} />
            <SidebarItem icon={MessageSquare} label="Threads" onClick={() => router.push("/threads")} />
            <SidebarItem icon={Pin} label="Saved Items" onClick={() => router.push("/bookmarks")} />

            <div className="my-2">
              <Separator />
            </div>

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

            <div className="my-2">
              <Separator />
            </div>

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
          </div>
        </ScrollArea>

        <div className="mt-auto border-t">
          <div className="flex items-center gap-2 px-3 py-2">
            <Button variant="ghost" size="icon-xs" onClick={() => router.push("/settings")}>
              <Settings className="size-4" />
            </Button>
            <Button variant="ghost" size="icon-xs" onClick={() => router.push("/help")}>
              <HelpCircle className="size-4" />
            </Button>
            <Button variant="ghost" size="icon-xs">
              <Mic className="size-4" />
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}

function SidebarItem({
  icon: Icon,
  label,
  badge,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  badge?: number
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-all duration-200 hover:shadow-[inset_0_0_20px_oklch(from_var(--sidebar-primary)_l_c_h_/_0.06)]"
    >
      <Icon className="size-4 shrink-0 transition-all duration-200 group-hover:drop-shadow-[0_0_6px_oklch(from_var(--sidebar-primary)_l_c_h_/_0.4)]" />
      <span className="truncate">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="ml-auto flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground shadow-[0_0_8px_oklch(from_var(--primary)_l_c_h_/_0.3)]">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </button>
  )
}

function ChannelItem({
  channel,
  isActive,
  onClick,
}: {
  channel: Channel
  isActive: boolean
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group/channel flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-all duration-200",
        isActive
          ? "bg-sidebar-accent text-foreground shadow-[inset_0_0_24px_oklch(from_var(--sidebar-primary)_l_c_h_/_0.08)] border-l-2 border-primary/50 -ml-px pl-[9px]"
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
    </button>
  )
}

export { Sidebar, type SidebarProps }
