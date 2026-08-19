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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
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
} from "lucide-react"

interface Channel {
  id: string
  name: string
  type: "text" | "voice"
  unread?: number
  muted?: boolean
  mentionCount?: number
}

interface ChannelCategory {
  id: string
  name: string
  channels: Channel[]
}

interface DirectMessage {
  id: string
  name: string
  image?: string | null
  status: StatusType
  unread?: number
}

interface Workspace {
  id: string
  name: string
  icon?: string
}

interface SidebarProps extends React.ComponentProps<"aside"> {
  workspaceId?: string
  currentChannelId?: string
  open?: boolean
  onClose?: () => void
  onChannelSelect?: (channelId: string) => void
}

const mockWorkspace: Workspace = {
  id: "ws-1",
  name: "Nexus Team",
}

const mockCategories: ChannelCategory[] = [
  {
    id: "cat-1",
    name: "Information",
    channels: [
      { id: "ch-1", name: "welcome", type: "text" },
      { id: "ch-2", name: "announcements", type: "text", unread: 2 },
      { id: "ch-3", name: "rules", type: "text" },
    ],
  },
  {
    id: "cat-2",
    name: "General",
    channels: [
      { id: "ch-4", name: "general", type: "text", unread: 5, mentionCount: 3 },
      { id: "ch-5", name: "off-topic", type: "text" },
      { id: "ch-6", name: "introductions", type: "text" },
    ],
  },
  {
    id: "cat-3",
    name: "Engineering",
    channels: [
      { id: "ch-7", name: "frontend", type: "text" },
      { id: "ch-8", name: "backend", type: "text", unread: 1 },
      { id: "ch-9", name: "devops", type: "text" },
      { id: "ch-10", name: "standup", type: "voice" },
      { id: "ch-11", name: "pair-programming", type: "voice" },
    ],
  },
  {
    id: "cat-4",
    name: "Design",
    channels: [
      { id: "ch-12", name: "ui-ux", type: "text" },
      { id: "ch-13", name: "branding", type: "text" },
    ],
  },
]

const mockDMs: DirectMessage[] = [
  { id: "dm-1", name: "Alice Chen", status: "online", image: null },
  { id: "dm-2", name: "Bob Williams", status: "away", unread: 1, image: null },
  { id: "dm-3", name: "Carol Davis", status: "busy", image: null },
  { id: "dm-4", name: "David Kim", status: "offline", image: null },
]

function Sidebar({
  workspaceId: _workspaceId,
  currentChannelId,
  open = false,
  onClose,
  onChannelSelect,
  className,
  ...props
}: SidebarProps) {
  const router = useRouter()
  const [collapsedCategories, setCollapsedCategories] = React.useState<
    Set<string>
  >(new Set())
  const [showDMs, setShowDMs] = React.useState(true)

  const toggleCategory = (categoryId: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(categoryId)) {
        next.delete(categoryId)
      } else {
        next.add(categoryId)
      }
      return next
    })
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
                {mockWorkspace.name.charAt(0)}
              </span>
              <span className="truncate">{mockWorkspace.name}</span>
              <ChevronsUpDown className="ml-auto size-4 shrink-0 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem>
                <Settings className="size-4" />
                Workspace Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Users className="size-4" />
                Invite People
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Plus className="size-4" />
                Create Workspace
              </DropdownMenuItem>
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
          <button className="flex h-8 w-full items-center gap-2 rounded-md bg-sidebar-accent/50 px-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent">
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

            {mockCategories.map((category) => (
              <Collapsible
                key={category.id}
                open={!collapsedCategories.has(category.id)}
                onOpenChange={() => toggleCategory(category.id)}
              >
                <div className="flex items-center group/category">
                  <CollapsibleTrigger
                    render={
                      <button className="flex flex-1 items-center gap-0.5 px-1 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors" />
                    }
                  >
                    <ChevronDown
                      className={cn(
                        "size-3 transition-transform",
                        collapsedCategories.has(category.id) &&
                          "-rotate-90"
                      )}
                    />
                    {category.name}
                  </CollapsibleTrigger>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="opacity-0 group-hover/category:opacity-100 transition-opacity"
                  >
                    <Plus className="size-3" />
                  </Button>
                </div>
                <CollapsibleContent>
                  <div className="flex flex-col gap-0.5">
                    {category.channels.map((channel) => (
                      <ChannelItem
                        key={channel.id}
                        channel={channel}
                        isActive={currentChannelId === channel.id}
                        onClick={() => onChannelSelect?.(channel.id)}
                      />
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}

            <div className="my-2">
              <Separator />
            </div>

            <div className="group/dm-section">
              <button
                onClick={() => setShowDMs(!showDMs)}
                className="flex w-full items-center gap-0.5 px-1 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronDown
                  className={cn(
                    "size-3 transition-transform",
                    !showDMs && "-rotate-90"
                  )}
                />
                Direct Messages
              </button>
              {showDMs && (
                <div className="flex flex-col gap-0.5">
                  {mockDMs.map((dm) => (
                    <DMItem key={dm.id} dm={dm} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        <div className="mt-auto border-t">
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="relative">
              <div className="flex size-8 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
                Y
              </div>
              <StatusBadge
                status="online"
                size="sm"
                className="absolute -right-0.5 -bottom-0.5"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">You</p>
              <p className="truncate text-xs text-muted-foreground">Online</p>
            </div>
            <div className="flex items-center gap-0.5">
              <Button variant="ghost" size="icon-xs">
                <Mic className="size-4" />
              </Button>
              <Button variant="ghost" size="icon-xs">
                <Headphones className="size-4" />
              </Button>
              <Button variant="ghost" size="icon-xs">
                <Settings className="size-4" />
              </Button>
            </div>
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
  const Icon = channel.type === "voice" ? Volume2 : Hash

  return (
    <button
      onClick={onClick}
      className={cn(
        "group/channel flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-all duration-200",
        isActive
          ? "bg-sidebar-accent text-foreground shadow-[inset_0_0_24px_oklch(from_var(--sidebar-primary)_l_c_h_/_0.08)] border-l-2 border-primary/50 -ml-px pl-[9px]"
          : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground hover:shadow-[inset_0_0_20px_oklch(from_var(--sidebar-primary)_l_c_h_/_0.04)]",
        channel.mentionCount && channel.mentionCount > 0 && "text-foreground"
      )}
    >
      <Icon className={cn(
        "size-4 shrink-0 transition-all duration-200",
        isActive && "text-primary drop-shadow-[0_0_6px_oklch(from_var(--sidebar-primary)_l_c_h_/_0.5)]"
      )} />
      <span className="truncate">{channel.name}</span>
      <div className="ml-auto flex items-center gap-1">
        {channel.muted && (
          <BellOff className="size-3 shrink-0 text-muted-foreground/50" />
        )}
        {channel.mentionCount && channel.mentionCount > 0 && (
          <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground shadow-[0_0_8px_oklch(from_var(--primary)_l_c_h_/_0.4)] animate-[glow-pulse_2s_ease-in-out_infinite]">
            {channel.mentionCount > 99 ? "99+" : channel.mentionCount}
          </span>
        )}
        {!channel.muted &&
          channel.unread &&
          channel.unread > 0 &&
          !channel.mentionCount && (
            <span className="size-2 shrink-0 rounded-full bg-primary shadow-[0_0_6px_oklch(from_var(--primary)_l_c_h_/_0.5)]" />
          )}
      </div>
    </button>
  )
}

function DMItem({ dm }: { dm: DirectMessage }) {
  return (
    <button className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground transition-colors">
      <div className="relative shrink-0">
        <div className="flex size-6 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground">
          {dm.name
            .split(" ")
            .map((n) => n[0])
            .join("")}
        </div>
        <StatusBadge
          status={dm.status}
          size="sm"
          className="absolute -right-0.5 -bottom-0.5"
        />
      </div>
      <span className="truncate">{dm.name}</span>
      {dm.unread && dm.unread > 0 && (
        <span className="ml-auto flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
          {dm.unread}
        </span>
      )}
    </button>
  )
}

export { Sidebar, type SidebarProps, type Channel, type ChannelCategory, type DirectMessage, type Workspace }
