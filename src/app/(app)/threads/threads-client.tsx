"use client"

import { useState, useMemo } from "react"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import {
  Search,
  Plus,
  MessageSquare,
  Users,
  Hash,
  Eye,
  EyeOff,
  X,
} from "lucide-react"

interface Thread {
  id: string
  title: string | null
  isClosed: boolean
  replyCount: number
  lastReplyAt: string | null
  createdAt: string
  creator: {
    id: string
    name: string | null
    avatar: string | null
    email: string
  }
  channel: { id: string; name: string }
  lastMessage: {
    id: string
    content: string
    createdAt: string
    user: {
      id: string
      name: string | null
      avatar: string | null
    }
  } | null
  isFollowing: boolean
  followerCount: number
}

interface Channel {
  id: string
  name: string
}

interface ThreadsClientProps {
  initialThreads: Thread[]
  channels: Channel[]
  currentUserId: string
}

type FilterTab = "all" | "mine" | "following"

function getInitials(name: string | null, email: string): string {
  if (name) {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }
  return email.slice(0, 2).toUpperCase()
}

function timeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return "just now"

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`

  return date.toLocaleDateString()
}

function truncate(str: string, len: number): string {
  if (str.length <= len) return str
  return str.slice(0, len) + "..."
}

export function ThreadsClient({
  initialThreads,
  channels,
  currentUserId,
}: ThreadsClientProps) {
  const [threads, setThreads] = useState<Thread[]>(initialThreads)
  const [search, setSearch] = useState("")
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newChannelId, setNewChannelId] = useState("")
  const [creating, setCreating] = useState(false)

  const filteredThreads = useMemo(() => {
    let result = threads

    if (activeFilter === "mine") {
      result = result.filter((t) => t.creator.id === currentUserId)
    } else if (activeFilter === "following") {
      result = result.filter((t) => t.isFollowing)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (t) =>
          (t.title && t.title.toLowerCase().includes(q)) ||
          t.channel.name.toLowerCase().includes(q) ||
          (t.creator.name && t.creator.name.toLowerCase().includes(q))
      )
    }

    return result
  }, [threads, activeFilter, search, currentUserId])

  async function handleToggleFollow(threadId: string) {
    const thread = threads.find((t) => t.id === threadId)
    if (!thread) return

    try {
      const method = thread.isFollowing ? "DELETE" : "POST"
      const res = await fetch(`/api/threads/${threadId}/follow`, { method })
      if (!res.ok) throw new Error("Failed")

      setThreads((prev) =>
        prev.map((t) =>
          t.id === threadId
            ? {
                ...t,
                isFollowing: !t.isFollowing,
                followerCount: t.isFollowing
                  ? t.followerCount - 1
                  : t.followerCount + 1,
              }
            : t
        )
      )
    } catch {
      toast.error("Failed to update follow status")
    }
  }

  async function handleCreateThread() {
    if (!newTitle.trim()) {
      toast.error("Please enter a thread title")
      return
    }
    if (!newChannelId) {
      toast.error("Please select a channel")
      return
    }

    setCreating(true)
    try {
      const res = await fetch("/api/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim(), channelId: newChannelId }),
      })
      if (!res.ok) throw new Error("Failed")
      toast.success("Thread created")
      setDialogOpen(false)
      setNewTitle("")
      setNewChannelId("")
      window.location.reload()
    } catch {
      toast.error("Failed to create thread")
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Threads</h1>
          <Badge variant="secondary">{filteredThreads.length}</Badge>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button className="glow-button" />}>
              <Plus className="mr-2 h-4 w-4" />
              New Thread
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Thread</DialogTitle>
              <DialogDescription>
                Start a new discussion thread in a channel.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="thread-title">Title</Label>
                <Input
                  id="thread-title"
                  placeholder="Thread title..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="glow-input"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Channel</Label>
                <Select value={newChannelId} onValueChange={(v) => setNewChannelId(v ?? "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a channel" />
                  </SelectTrigger>
                  <SelectContent>
                    {channels.map((ch) => (
                      <SelectItem key={ch.id} value={ch.id}>
                        #{ch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>
                Cancel
              </DialogClose>
              <Button
                className="glow-button"
                disabled={creating}
                onClick={handleCreateThread}
              >
                {creating ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search threads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 glow-input"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex gap-1 rounded-lg border p-1">
          {(["all", "mine", "following"] as const).map((filter) => (
            <Button
              key={filter}
              variant={activeFilter === filter ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveFilter(filter)}
            >
              {filter === "all" && "All"}
              {filter === "mine" && (
                <>
                  <Eye className="mr-1 h-3 w-3" />
                  My Threads
                </>
              )}
              {filter === "following" && (
                <>
                  <Users className="mr-1 h-3 w-3" />
                  Following
                </>
              )}
            </Button>
          ))}
        </div>
      </div>

      {filteredThreads.length === 0 ? (
        <Card className="glow-card">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <MessageSquare className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium text-muted-foreground">
              No threads found
            </p>
            <p className="text-sm text-muted-foreground">
              {search
                ? "Try adjusting your search"
                : "Create a new thread to get started"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredThreads.map((thread) => (
            <Card key={thread.id} className="glow-card">
              <CardContent className="flex items-start gap-4 p-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={thread.creator.avatar ?? undefined} />
                  <AvatarFallback>
                    {getInitials(thread.creator.name, thread.creator.email)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold truncate">
                      {thread.title || "Untitled Thread"}
                    </h3>
                    <Badge variant="outline" className="shrink-0 text-xs">
                      <Hash className="mr-1 h-3 w-3" />
                      {thread.channel.name}
                    </Badge>
                    {thread.isClosed && (
                      <Badge variant="secondary" className="shrink-0 text-xs">
                        Closed
                      </Badge>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground mb-1">
                    by {thread.creator.name || thread.creator.email}
                  </p>

                  {thread.lastMessage && (
                    <p className="text-sm text-muted-foreground mb-2">
                      <span className="font-medium text-foreground">
                        {thread.lastMessage.user.name || "Someone"}:
                      </span>{" "}
                      {truncate(thread.lastMessage.content, 120)}
                      <span className="ml-1 text-xs">
                        {timeAgo(thread.lastMessage.createdAt)}
                      </span>
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {thread.replyCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {thread.followerCount}
                    </span>
                    <span>{timeAgo(thread.createdAt)}</span>
                  </div>
                </div>

                <Button
                  variant={thread.isFollowing ? "default" : "outline"}
                  size="sm"
                  className="shrink-0 glow-button"
                  onClick={() => handleToggleFollow(thread.id)}
                >
                  {thread.isFollowing ? (
                    <>
                      <EyeOff className="mr-1 h-3 w-3" />
                      Following
                    </>
                  ) : (
                    <>
                      <Eye className="mr-1 h-3 w-3" />
                      Follow
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
