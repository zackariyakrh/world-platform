"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Hash,
  MoreHorizontal,
  Plus,
  Trash2,
  Loader2,
  ExternalLink,
  Users,
  MessageSquare,
} from "lucide-react"
import { toast } from "sonner"

type ChannelRow = {
  id: string
  name: string
  description: string | null
  type: string
  isPrivate: boolean
  creator: { id: string; name: string | null } | null
  _count: { members: number; messages: number }
  createdAt: Date
}

export function AdminChannelsClient({ channels: initial }: { channels: ChannelRow[] }) {
  const router = useRouter()
  const [channels, setChannels] = React.useState(initial)
  const [search, setSearch] = React.useState("")
  const [createOpen, setCreateOpen] = React.useState(false)
  const [creating, setCreating] = React.useState(false)
  const [deletingId, setDeletingId] = React.useState<string | null>(null)
  const [form, setForm] = React.useState({ name: "", description: "" })

  const filtered = React.useMemo(() => {
    if (!search) return channels
    const q = search.toLowerCase()
    return channels.filter(
      (ch) => ch.name.includes(q) || ch.description?.toLowerCase().includes(q)
    )
  }, [channels, search])

  async function handleCreate() {
    if (!form.name.trim()) return
    setCreating(true)
    try {
      const res = await fetch("/api/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || undefined,
        }),
      })
      if (res.ok) {
        const ch = await res.json()
        setChannels((prev) => [...prev, {
          id: ch.id,
          name: ch.name,
          description: ch.description,
          type: ch.type || "text",
          isPrivate: ch.isPrivate || false,
          creator: ch.creator,
          _count: ch._count || { members: 1, messages: 0 },
          createdAt: new Date(),
        }])
        setForm({ name: "", description: "" })
        setCreateOpen(false)
        toast.success("Channel created")
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to create channel")
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(ch: ChannelRow) {
    setDeletingId(ch.id)
    try {
      const res = await fetch(`/api/channels/${ch.id}`, { method: "DELETE" })
      if (res.ok || res.status === 204) {
        setChannels((prev) => prev.filter((c) => c.id !== ch.id))
        toast.success(`#${ch.name} deleted`)
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to delete channel")
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Input
            placeholder="Search channels..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8"
          />
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger
            render={<Button size="sm" className="glow-button h-8 gap-1.5" />}
          >
            <Plus className="size-3.5" />
            Create Channel
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Channel</DialogTitle>
              <DialogDescription>Add a new channel to your workspace.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-2">
              <div className="flex flex-col gap-2">
                <Label>Name</Label>
                <Input
                  placeholder="e.g. welcome, announcements"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="glow-input"
                  onKeyDown={(e) => { if (e.key === "Enter") handleCreate() }}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Description (optional)</Label>
                <Input
                  placeholder="What is this channel about?"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="glow-input"
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
              <Button onClick={handleCreate} disabled={creating || !form.name.trim()} className="glow-button">
                {creating ? <Loader2 className="size-3.5 animate-spin" /> : "Create Channel"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="text-xs text-muted-foreground">
        {filtered.length} channel{filtered.length !== 1 ? "s" : ""}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Channel</TableHead>
            <TableHead>Creator</TableHead>
            <TableHead>Members</TableHead>
            <TableHead>Messages</TableHead>
            <TableHead>Visibility</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                No channels found.
              </TableCell>
            </TableRow>
          ) : (
            filtered.map((ch) => (
              <TableRow key={ch.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Hash className="size-4 text-muted-foreground" />
                    <div>
                      <span className="text-sm font-medium">{ch.name}</span>
                      {ch.description && (
                        <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                          {ch.description}
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {ch.creator?.name || "System"}
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1 text-sm">
                    <Users className="size-3" />
                    {ch._count.members}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1 text-sm">
                    <MessageSquare className="size-3" />
                    {ch._count.messages}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant={ch.isPrivate ? "secondary" : "outline"}>
                    {ch.isPrivate ? "Private" : "Public"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={<Button variant="ghost" size="icon-xs" />}
                    >
                      <MoreHorizontal className="size-3.5" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/channels/${ch.id}`)}>
                        <ExternalLink className="size-3.5" />
                        Open Channel
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          if (window.confirm(`Delete #${ch.name}? This will remove all messages.`)) {
                            handleDelete(ch)
                          }
                        }}
                        disabled={deletingId === ch.id}
                        className="text-destructive focus:text-destructive"
                      >
                        {deletingId === ch.id ? (
                          <><Loader2 className="size-3.5 animate-spin" /> Deleting...</>
                        ) : (
                          <><Trash2 className="size-3.5" /> Delete Channel</>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
