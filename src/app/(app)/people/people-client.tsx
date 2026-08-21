"use client"

import * as React from "react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import {
  Search,
  Users,
  UserPlus,
  Loader2,
  Check,
  Clock,
  X,
  MessageSquare,
  UserCheck,
  Globe,
} from "lucide-react"
import { toast } from "sonner"

interface User {
  id: string
  name: string | null
  username: string | null
  avatar: string | null
  status: string
  jobTitle: string | null
  friendshipStatus: string | null
  sharedGroups: number
  sharedWorkspaces: number
  canAddFriend: boolean
}

interface Friend {
  id: string
  name: string | null
  username: string | null
  avatar: string | null
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

export function PeopleClient() {
  const [query, setQuery] = React.useState("")
  const [results, setResults] = React.useState<User[]>([])
  const [searching, setSearching] = React.useState(false)
  const [friends, setFriends] = React.useState<Friend[]>([])
  const [pendingSent, setPendingSent] = React.useState<Friend[]>([])
  const [pendingReceived, setPendingReceived] = React.useState<Friend[]>([])
  const [friendsLoading, setFriendsLoading] = React.useState(true)
  const [addingId, setAddingId] = React.useState<string | null>(null)
  const [activeTab, setActiveTab] = React.useState("search")

  // Load friends on mount
  React.useEffect(() => {
    loadFriends()
  }, [])

  async function loadFriends() {
    setFriendsLoading(true)
    try {
      const res = await fetch("/api/friends")
      if (res.ok) {
        const data = await res.json()
        setFriends(data.friends || [])
        setPendingSent(data.pendingSent || [])
        setPendingReceived(data.pendingReceived || [])
      }
    } catch {
      // keep empty
    } finally {
      setFriendsLoading(false)
    }
  }

  // Search users with debounce
  React.useEffect(() => {
    if (query.trim().length < 2) {
      setResults([])
      return
    }

    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(query.trim())}`)
        if (res.ok) {
          const data = await res.json()
          setResults(data)
        }
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  async function sendFriendRequest(userId: string) {
    setAddingId(userId)
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendId: userId }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success("Friend request sent")
        setResults((prev) =>
          prev.map((u) =>
            u.id === userId ? { ...u, friendshipStatus: "pending", canAddFriend: false } : u
          )
        )
      } else {
        toast.error(data.error || "Failed to send request")
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setAddingId(null)
    }
  }

  async function acceptRequest(userId: string) {
    try {
      const res = await fetch("/api/friends", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendId: userId, action: "accept" }),
      })
      if (res.ok) {
        toast.success("Friend request accepted")
        loadFriends()
      }
    } catch {
      toast.error("Something went wrong")
    }
  }

  async function declineRequest(userId: string) {
    try {
      const res = await fetch("/api/friends", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendId: userId, action: "decline" }),
      })
      if (res.ok) {
        loadFriends()
      }
    } catch {
      toast.error("Something went wrong")
    }
  }

  async function removeFriend(userId: string) {
    try {
      const res = await fetch("/api/friends", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendId: userId }),
      })
      if (res.ok) {
        toast.success("Friend removed")
        loadFriends()
      }
    } catch {
      toast.error("Something went wrong")
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex shrink-0 flex-col gap-4 p-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Users className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground glow-text">People</h1>
            <p className="text-sm text-muted-foreground">Find and connect with users</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden px-6 pb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex h-full flex-col">
          <TabsList className="w-full justify-start rounded-xl bg-muted/50 p-1 h-auto">
            <TabsTrigger value="search" className="rounded-lg gap-1.5">
              <Search className="size-3.5" />
              Find People
            </TabsTrigger>
            <TabsTrigger value="friends" className="rounded-lg gap-1.5">
              <UserCheck className="size-3.5" />
              Friends
              {friends.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 min-w-5 justify-center px-1 text-[10px]">
                  {friends.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="requests" className="rounded-lg gap-1.5">
              <Clock className="size-3.5" />
              Requests
              {pendingReceived.length > 0 && (
                <Badge variant="default" className="ml-1 h-5 min-w-5 justify-center px-1 text-[10px]">
                  {pendingReceived.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Find People Tab */}
          <TabsContent value="search" className="flex-1 overflow-hidden mt-4">
            <div className="flex flex-col gap-4 h-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by username or name..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="h-10 pl-9"
                />
              </div>

              <ScrollArea className="flex-1">
                {searching ? (
                  <div className="flex items-center justify-center gap-2 py-12">
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Searching...</span>
                  </div>
                ) : results.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {results.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/50 p-3 transition-colors hover:bg-muted/50"
                      >
                        <div className="relative shrink-0">
                          <Avatar>
                            <AvatarImage src={user.avatar || undefined} alt={user.name || "User"} />
                            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                          </Avatar>
                          <span
                            className={cn(
                              "absolute -right-0.5 -bottom-0.5 size-3 rounded-full ring-2 ring-background",
                              statusColors[user.status] || statusColors.offline
                            )}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{user.name || "Unknown"}</span>
                            {user.username && (
                              <span className="text-sm text-muted-foreground">@{user.username}</span>
                            )}
                          </div>
                          {user.jobTitle && (
                            <p className="text-xs text-muted-foreground">{user.jobTitle}</p>
                          )}
                          <div className="mt-1 flex items-center gap-2">
                            {user.sharedGroups > 0 && (
                              <Badge variant="outline" className="h-5 text-[10px] gap-1">
                                <Users className="size-2.5" />
                                {user.sharedGroups} group{user.sharedGroups > 1 ? "s" : ""}
                              </Badge>
                            )}
                            {user.sharedWorkspaces > 0 && (
                              <Badge variant="outline" className="h-5 text-[10px] gap-1">
                                <Globe className="size-2.5" />
                                {user.sharedWorkspaces} workspace{user.sharedWorkspaces > 1 ? "s" : ""}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0">
                          {user.friendshipStatus === "accepted" ? (
                            <Badge variant="secondary" className="gap-1">
                              <Check className="size-3" />
                              Friends
                            </Badge>
                          ) : user.friendshipStatus === "pending" ? (
                            <Badge variant="outline" className="gap-1">
                              <Clock className="size-3" />
                              Pending
                            </Badge>
                          ) : user.canAddFriend ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => sendFriendRequest(user.id)}
                              disabled={addingId === user.id}
                              className="gap-1.5"
                            >
                              {addingId === user.id ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <UserPlus className="size-3.5" />
                              )}
                              Add Friend
                            </Button>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">
                              No shared groups
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : query.trim().length >= 2 ? (
                  <div className="flex flex-col items-center gap-2 py-12 text-center">
                    <Search className="size-8 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">No users found for &ldquo;{query}&rdquo;</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-12 text-center">
                    <Search className="size-8 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">Search for users by their username or name</p>
                    <p className="text-xs text-muted-foreground/60">You can only add users in the same group or workspace</p>
                  </div>
                )}
              </ScrollArea>
            </div>
          </TabsContent>

          {/* Friends Tab */}
          <TabsContent value="friends" className="flex-1 overflow-hidden mt-4">
            <ScrollArea className="h-full">
              {friendsLoading ? (
                <div className="flex items-center justify-center gap-2 py-12">
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Loading friends...</span>
                </div>
              ) : friends.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {friends.map((friend) => (
                    <div
                      key={friend.id}
                      className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/50 p-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="relative shrink-0">
                        <Avatar>
                          <AvatarImage src={friend.avatar || undefined} alt={friend.name || "User"} />
                          <AvatarFallback>{getInitials(friend.name)}</AvatarFallback>
                        </Avatar>
                      </div>

                      <div className="min-w-0 flex-1">
                        <span className="font-medium">{friend.name || "Unknown"}</span>
                        {friend.username && (
                          <p className="text-sm text-muted-foreground">@{friend.username}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Link href={`/dms`}>
                          <Button size="sm" variant="outline" className="gap-1.5">
                            <MessageSquare className="size-3.5" />
                            Message
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeFriend(friend.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-12 text-center">
                  <UserCheck className="size-8 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">No friends yet</p>
                  <p className="text-xs text-muted-foreground/60">Search for people to add as friends</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Requests Tab */}
          <TabsContent value="requests" className="flex-1 overflow-hidden mt-4">
            <ScrollArea className="h-full">
              {friendsLoading ? (
                <div className="flex items-center justify-center gap-2 py-12">
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Loading...</span>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {/* Received Requests */}
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                      Received ({pendingReceived.length})
                    </h3>
                    {pendingReceived.length > 0 ? (
                      <div className="flex flex-col gap-2">
                        {pendingReceived.map((user) => (
                          <div
                            key={user.id}
                            className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/50 p-3"
                          >
                            <Avatar>
                              <AvatarImage src={user.avatar || undefined} alt={user.name || "User"} />
                              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                            </Avatar>

                            <div className="min-w-0 flex-1">
                              <span className="font-medium">{user.name || "Unknown"}</span>
                              {user.username && (
                                <p className="text-sm text-muted-foreground">@{user.username}</p>
                              )}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <Button
                                size="sm"
                                onClick={() => acceptRequest(user.id)}
                                className="gap-1.5"
                              >
                                <Check className="size-3.5" />
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => declineRequest(user.id)}
                              >
                                <X className="size-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No pending requests</p>
                    )}
                  </div>

                  {/* Sent Requests */}
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                      Sent ({pendingSent.length})
                    </h3>
                    {pendingSent.length > 0 ? (
                      <div className="flex flex-col gap-2">
                        {pendingSent.map((user) => (
                          <div
                            key={user.id}
                            className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/50 p-3"
                          >
                            <Avatar>
                              <AvatarImage src={user.avatar || undefined} alt={user.name || "User"} />
                              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                            </Avatar>

                            <div className="min-w-0 flex-1">
                              <span className="font-medium">{user.name || "Unknown"}</span>
                              {user.username && (
                                <p className="text-sm text-muted-foreground">@{user.username}</p>
                              )}
                            </div>

                            <Badge variant="outline" className="gap-1">
                              <Clock className="size-3" />
                              Pending
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No sent requests</p>
                    )}
                  </div>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
