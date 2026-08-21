"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { Search, Plus, MessageSquare, Loader2, UserPlus } from "lucide-react"
import { toast } from "sonner"

interface DMUser {
  id: string
  name: string | null
  username: string | null
  avatar: string | null
  status: string
}

interface DMConversationItem {
  id: string
  lastMessage: string | null
  lastMessageAt: string | null
  unreadCount: number
  otherUser: DMUser
}

interface DMListProps {
  conversations: DMConversationItem[]
  activeId?: string
}

function getInitials(name: string | null): string {
  if (!name) return "?"
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

const statusColors: Record<string, string> = {
  online: "bg-emerald-500",
  away: "bg-amber-500",
  busy: "bg-red-500",
  dnd: "bg-red-500",
  offline: "bg-muted-foreground/50",
}

export function DMList({ conversations, activeId }: DMListProps) {
  const router = useRouter()
  const [search, setSearch] = React.useState("")
  const [newDMOpen, setNewDMOpen] = React.useState(false)
  const [users, setUsers] = React.useState<DMUser[]>([])
  const [usersLoading, setUsersLoading] = React.useState(false)
  const [creating, setCreating] = React.useState<string | null>(null)
  const [userSearch, setUserSearch] = React.useState("")

  const filtered = React.useMemo(() => {
    if (!search.trim()) return conversations
    const q = search.toLowerCase()
    return conversations.filter(
      (c) =>
        c.otherUser.name?.toLowerCase().includes(q) ||
        c.otherUser.username?.toLowerCase().includes(q)
    )
  }, [conversations, search])

  const filteredUsers = React.useMemo(() => {
    if (!userSearch.trim()) return users
    const q = userSearch.toLowerCase()
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) ||
        u.username?.toLowerCase().includes(q)
    )
  }, [users, userSearch])

  async function openNewDM() {
    setNewDMOpen(true)
    setUserSearch("")
    setUsersLoading(true)
    try {
      const res = await fetch("/api/dm/users")
      if (res.ok) {
        const data = await res.json()
        setUsers(data)
      }
    } catch {
      // keep empty
    } finally {
      setUsersLoading(false)
    }
  }

  async function startConversation(userId: string) {
    setCreating(userId)
    try {
      const res = await fetch("/api/dm/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })
      const data = await res.json()
      if (res.ok) {
        setNewDMOpen(false)
        router.push(`/dms/${data.conversationId}`)
      } else {
        toast.error(data.error || "Failed to create conversation")
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setCreating(null)
    }
  }

  return (
    <div className="flex h-full flex-col border-r">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <h2 className="text-sm font-semibold">Direct Messages</h2>
        <Button variant="ghost" size="icon-xs" onClick={openNewDM}>
          <Plus className="size-4" />
        </Button>
      </div>

      <div className="px-3 py-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="h-8 pl-8 text-sm"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-0.5 px-2">
          {filtered.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <MessageSquare className="size-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No conversations found</p>
            </div>
          )}

          {filtered.map((conversation) => {
            const isActive = activeId === conversation.id
            return (
              <Link
                key={conversation.id}
                href={`/dms/${conversation.id}`}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-muted/50",
                  isActive && "bg-muted text-foreground"
                )}
              >
                <div className="relative shrink-0">
                  <Avatar size="sm">
                    <AvatarImage
                      src={conversation.otherUser.avatar || undefined}
                      alt={conversation.otherUser.name || "User"}
                    />
                    <AvatarFallback>
                      {getInitials(conversation.otherUser.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span
                    className={cn(
                      "absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full ring-2 ring-background",
                      statusColors[conversation.otherUser.status] || statusColors.offline
                    )}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className={cn("truncate font-medium", conversation.unreadCount > 0 && "font-semibold")}>
                      {conversation.otherUser.name || conversation.otherUser.username || "Unknown"}
                    </span>
                    {conversation.lastMessageAt && (
                      <span className="ml-2 shrink-0 text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: false })}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="truncate text-xs text-muted-foreground">
                      {conversation.lastMessage || "No messages yet"}
                    </span>
                    {conversation.unreadCount > 0 && (
                      <Badge variant="default" className="ml-2 h-4 min-w-4 shrink-0 justify-center px-1 text-[10px]">
                        {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </ScrollArea>

      {/* New DM Dialog */}
      <Dialog open={newDMOpen} onOpenChange={setNewDMOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Message</DialogTitle>
            <DialogDescription>Start a conversation with someone.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-1">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search people..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="h-9 pl-8"
              />
            </div>
            <ScrollArea className="max-h-72">
              {usersLoading ? (
                <div className="flex items-center justify-center gap-2 py-8">
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Loading users...</span>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <UserPlus className="size-8 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    {users.length === 0 ? "No users available to message" : "No users found"}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-0.5">
                  {filteredUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => startConversation(user.id)}
                      disabled={creating !== null}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-muted/50 disabled:opacity-50"
                    >
                      <div className="relative shrink-0">
                        <Avatar size="sm">
                          <AvatarImage src={user.avatar || undefined} alt={user.name || "User"} />
                          <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                        <span
                          className={cn(
                            "absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full ring-2 ring-background",
                            statusColors[user.status] || statusColors.offline
                          )}
                        />
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <p className="truncate font-medium">{user.name || "Unknown"}</p>
                        {user.username && (
                          <p className="truncate text-xs text-muted-foreground">@{user.username}</p>
                        )}
                      </div>
                      {creating === user.id && (
                        <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
