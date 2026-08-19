"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
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
  Users,
  Plus,
  UserPlus,
  Lock,
  Globe,
  Loader2,
  UserMinus,
  Trash2,
  Crown,
} from "lucide-react"

interface Group {
  id: string
  name: string
  description?: string | null
  isPrivate: boolean
  creatorId: string
  _count: { members: number }
  creator: { id: string; name: string; avatar: string | null }
}

interface GroupDetail extends Group {
  members: {
    id: string
    role: string
    user: { id: string; name: string; email: string; avatar: string | null; role: string }
  }[]
  invitations: {
    id: string
    status: string
    user: { id: string; name: string; email: string; avatar: string | null }
  }[]
}

interface GroupsPageProps {
  userRole?: string
}

export function GroupsClient({ userRole }: GroupsPageProps) {
  const router = useRouter()
  const [groups, setGroups] = React.useState<Group[]>([])
  const [loading, setLoading] = React.useState(true)
  const [createOpen, setCreateOpen] = React.useState(false)
  const [inviteOpen, setInviteOpen] = React.useState(false)
  const [detailOpen, setDetailOpen] = React.useState(false)
  const [selectedGroup, setSelectedGroup] = React.useState<GroupDetail | null>(null)
  const [createName, setCreateName] = React.useState("")
  const [createDesc, setCreateDesc] = React.useState("")
  const [createPrivate, setCreatePrivate] = React.useState(false)
  const [creating, setCreating] = React.useState(false)
  const [inviting, setInviting] = React.useState(false)
  const [inviteEmails, setInviteEmails] = React.useState("")
  const [allUsers, setAllUsers] = React.useState<{ id: string; name: string; email: string; avatar: string | null }[]>([])
  const [selectedUsers, setSelectedUsers] = React.useState<string[]>([])
  const isAdmin = userRole === "owner" || userRole === "admin"

  React.useEffect(() => {
    fetchGroups()
  }, [])

  async function fetchGroups() {
    setLoading(true)
    try {
      const res = await fetch("/api/groups")
      if (res.ok) setGroups(await res.json())
    } catch {} finally {
      setLoading(false)
    }
  }

  async function handleCreate() {
    if (!createName.trim()) return
    setCreating(true)
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createName.trim(),
          description: createDesc.trim() || undefined,
          isPrivate: createPrivate,
        }),
      })
      if (res.ok) {
        toast.success("Group created!")
        setCreateOpen(false)
        setCreateName("")
        setCreateDesc("")
        setCreatePrivate(false)
        fetchGroups()
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to create group")
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setCreating(false)
    }
  }

  async function openInvite(group: Group) {
    setSelectedGroup(null)
    setInviteOpen(true)
    setSelectedUsers([])
    setInviteEmails("")
    try {
      const res = await fetch(`/api/workspaces`)
      if (res.ok) {
        const data = await res.json()
        setAllUsers(data.flatMap((w: any) => w.members?.map((m: any) => m.user) || []).filter((u: any, i: number, arr: any[]) => arr.findIndex((x: any) => x.id === u.id) === i))
      }
    } catch {}
  }

  async function handleInvite(groupId: string) {
    if (!selectedUsers.length) return
    setInviting(true)
    try {
      const res = await fetch(`/api/groups/${groupId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: selectedUsers }),
      })
      if (res.ok) {
        toast.success("Invitations sent!")
        setInviteOpen(false)
        fetchGroups()
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to invite")
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setInviting(false)
    }
  }

  async function handleJoin(groupId: string) {
    try {
      const res = await fetch(`/api/groups/${groupId}/join`, { method: "POST" })
      if (res.ok) {
        toast.success("Joined group!")
        fetchGroups()
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to join")
      }
    } catch {
      toast.error("Something went wrong")
    }
  }

  async function handleLeave(groupId: string) {
    try {
      const res = await fetch(`/api/groups/${groupId}/join`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Left group")
        fetchGroups()
      }
    } catch {
      toast.error("Something went wrong")
    }
  }

  async function handleDelete(groupId: string) {
    try {
      const res = await fetch(`/api/groups/${groupId}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Group deleted")
        fetchGroups()
        setDetailOpen(false)
      }
    } catch {
      toast.error("Something went wrong")
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground glow-text">
            <Users className="size-6 text-primary drop-shadow-[0_0_8px_oklch(from_var(--primary)_l_c_h_/_0.4)]" />
            Groups
          </h1>
          <p className="text-base text-muted-foreground">
            Create and manage team groups.
          </p>
        </div>
        {isAdmin && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger render={<Button className="glow-button" />}>
              <Plus className="size-4" />
              New Group
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Group</DialogTitle>
                <DialogDescription>Create a new group for your workspace.</DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-5 py-1">
                <div className="flex flex-col gap-2">
                  <Label>Name</Label>
                  <Input placeholder="e.g. Design Team" value={createName} onChange={(e) => setCreateName(e.target.value)} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Description</Label>
                  <Input placeholder="What is this group about?" value={createDesc} onChange={(e) => setCreateDesc(e.target.value)} />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="private" checked={createPrivate} onCheckedChange={(v) => setCreatePrivate(!!v)} />
                  <Label htmlFor="private" className="text-base font-normal text-muted-foreground flex items-center gap-1.5">
                    <Lock className="size-3.5" /> Private (invite only)
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
                <Button onClick={handleCreate} disabled={creating || !createName.trim()}>
                  {creating ? <Loader2 className="size-4 animate-spin" /> : "Create Group"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">Loading groups...</div>
      ) : groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <Users className="size-12 text-muted-foreground/30" />
          <p className="text-base text-muted-foreground">No groups yet. {isAdmin ? "Create one to get started." : "Ask an admin to create a group."}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <div
              key={group.id}
              className="glow-card flex flex-col gap-3 rounded-xl bg-card p-5 cursor-pointer hover:shadow-lg transition-all duration-300"
              onClick={() => {
                setSelectedGroup(null)
                setDetailOpen(true)
                fetch(`/api/groups/${group.id}`).then(r => r.json()).then(setSelectedGroup)
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Users className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{group.name}</h3>
                    <p className="text-sm text-muted-foreground">{group._count.members} member{group._count.members !== 1 ? "s" : ""}</p>
                  </div>
                </div>
                {group.isPrivate ? (
                  <Badge variant="secondary"><Lock className="size-3" /> Private</Badge>
                ) : (
                  <Badge variant="outline"><Globe className="size-3" /> Public</Badge>
                )}
              </div>
              {group.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{group.description}</p>
              )}
              <div className="mt-auto flex items-center justify-between pt-2 border-t">
                <span className="text-xs text-muted-foreground">by {group.creator.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleJoin(group.id)
                  }}
                >
                  Join
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Group Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-lg">
          {selectedGroup ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Users className="size-5 text-primary" />
                  {selectedGroup.name}
                </DialogTitle>
                <DialogDescription>{selectedGroup.description || "No description"}</DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-3 py-1">
                <h4 className="text-sm font-medium text-muted-foreground uppercase">Members ({selectedGroup.members.length})</h4>
                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                  {selectedGroup.members.map((m) => (
                    <div key={m.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/50">
                      <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                        {m.user.name?.slice(0, 2).toUpperCase() || "??"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{m.user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{m.user.email}</p>
                      </div>
                      {m.role === "admin" && <Crown className="size-3.5 text-primary" />}
                    </div>
                  ))}
                </div>
              </div>
              <DialogFooter>
                {isAdmin && (
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(selectedGroup.id)}>
                    <Trash2 className="size-3.5" />
                    Delete
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => handleLeave(selectedGroup.id)}>
                  <UserMinus className="size-3.5" />
                  Leave
                </Button>
                {isAdmin && (
                  <Button size="sm" onClick={() => { setDetailOpen(false); openInvite(selectedGroup) }}>
                    <UserPlus className="size-3.5" />
                    Invite
                  </Button>
                )}
              </DialogFooter>
            </>
          ) : (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Invite to Group</DialogTitle>
            <DialogDescription>Select users to invite.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-1 max-h-64 overflow-y-auto">
            {allUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No users found</p>
            ) : (
              allUsers.map((user) => (
                <label key={user.id} className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-muted/50 cursor-pointer">
                  <Checkbox
                    checked={selectedUsers.includes(user.id)}
                    onCheckedChange={(v) => {
                      setSelectedUsers((prev) =>
                        v ? [...prev, user.id] : prev.filter((id) => id !== user.id)
                      )
                    }}
                  />
                  <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                    {user.name?.slice(0, 2).toUpperCase() || "??"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                </label>
              ))
            )}
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button onClick={() => selectedGroup && handleInvite(selectedGroup.id)} disabled={inviting || !selectedUsers.length}>
              {inviting ? <Loader2 className="size-4 animate-spin" /> : `Invite ${selectedUsers.length} user${selectedUsers.length !== 1 ? "s" : ""}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
