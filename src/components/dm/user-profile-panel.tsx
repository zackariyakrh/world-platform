"use client"

import * as React from "react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import {
  Briefcase,
  Clock,
  Globe,
  Hash,
  FolderOpen,
  Users,
  Loader2,
} from "lucide-react"

interface ProfileData {
  id: string
  name: string | null
  username: string | null
  avatar: string | null
  bio: string | null
  jobTitle: string | null
  customStatus: string | null
  status: string
  timezone: string | null
  lastSeenAt: string | null
  createdAt: string
  friendshipStatus: string | null
  commonWorkspaces: { id: string; name: string; icon: string | null }[]
  commonChannels: { id: string; name: string; type: string }[]
  commonGroups: { id: string; name: string; avatar: string | null }[]
  commonProjects: { id: string; name: string }[]
}

const statusColors: Record<string, string> = {
  online: "bg-emerald-500",
  away: "bg-amber-500",
  busy: "bg-red-500",
  dnd: "bg-red-500",
  offline: "bg-muted-foreground/50",
}

const statusLabels: Record<string, string> = {
  online: "Online",
  away: "Away",
  busy: "Busy",
  dnd: "Do Not Disturb",
  offline: "Offline",
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

interface UserProfileDialogProps {
  userId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UserProfileDialog({ userId, open, onOpenChange }: UserProfileDialogProps) {
  const [profile, setProfile] = React.useState<ProfileData | null>(null)
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (!open || !userId) {
      setProfile(null)
      return
    }
    setLoading(true)
    fetch(`/api/profile/${userId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed")
        return res.json()
      })
      .then((data) => setProfile(data))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false))
  }, [userId, open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-hidden flex flex-col">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : !profile ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-muted-foreground">Failed to load profile</p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Profile</DialogTitle>
            </DialogHeader>
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="flex flex-col items-center pb-4">
                <div className="relative mb-3">
                  <Avatar className="size-20">
                    <AvatarImage src={profile.avatar || undefined} alt={profile.name || ""} />
                    <AvatarFallback className="text-xl">{getInitials(profile.name)}</AvatarFallback>
                  </Avatar>
                  <span
                    className={cn(
                      "absolute right-0 bottom-0 size-4 rounded-full ring-3 ring-background",
                      statusColors[profile.status] || statusColors.offline
                    )}
                  />
                </div>

                <h2 className="text-lg font-semibold">{profile.name || "Unknown"}</h2>
                {profile.username && (
                  <p className="text-sm text-muted-foreground">@{profile.username}</p>
                )}

                <div className="mt-1 flex items-center gap-1.5">
                  <span className={cn("size-2 rounded-full", statusColors[profile.status] || statusColors.offline)} />
                  <span className="text-xs text-muted-foreground">
                    {profile.customStatus || statusLabels[profile.status] || "Offline"}
                  </span>
                </div>

                {profile.friendshipStatus && (
                  <span className="mt-2 inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    Friend
                  </span>
                )}
              </div>

              <Separator className="mb-4" />

              {profile.bio && (
                <div className="mb-4">
                  <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">About</p>
                  <p className="text-sm leading-relaxed">{profile.bio}</p>
                </div>
              )}

              {profile.jobTitle && (
                <div className="mb-4 flex items-center gap-2">
                  <Briefcase className="size-4 shrink-0 text-muted-foreground" />
                  <span className="text-sm">{profile.jobTitle}</span>
                </div>
              )}

              {profile.timezone && (
                <div className="mb-4 flex items-center gap-2">
                  <Globe className="size-4 shrink-0 text-muted-foreground" />
                  <span className="text-sm">{profile.timezone}</span>
                </div>
              )}

              {profile.lastSeenAt && profile.status !== "online" && (
                <div className="mb-4 flex items-center gap-2">
                  <Clock className="size-4 shrink-0 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Last seen {formatDistanceToNow(new Date(profile.lastSeenAt), { addSuffix: true })}
                  </span>
                </div>
              )}

              <div className="mb-4 flex items-center gap-2">
                <Clock className="size-4 shrink-0 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Joined {formatDistanceToNow(new Date(profile.createdAt), { addSuffix: true })}
                </span>
              </div>

              <Separator className="my-4" />

              {profile.commonWorkspaces.length > 0 && (
                <div className="mb-4">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {profile.commonWorkspaces.length} Shared Workspace{profile.commonWorkspaces.length > 1 ? "s" : ""}
                  </p>
                  <div className="flex flex-col gap-1">
                    {profile.commonWorkspaces.map((w) => (
                      <Link
                        key={w.id}
                        href={`/workspaces/${w.id}`}
                        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50 transition-colors"
                      >
                        <FolderOpen className="size-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate">{w.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {profile.commonChannels.length > 0 && (
                <div className="mb-4">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {profile.commonChannels.length} Shared Channel{profile.commonChannels.length > 1 ? "s" : ""}
                  </p>
                  <div className="flex flex-col gap-1">
                    {profile.commonChannels.map((ch) => (
                      <Link
                        key={ch.id}
                        href={`/channels/${ch.id}`}
                        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50 transition-colors"
                      >
                        <Hash className="size-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate">{ch.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {profile.commonGroups.length > 0 && (
                <div className="mb-4">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {profile.commonGroups.length} Shared Group{profile.commonGroups.length > 1 ? "s" : ""}
                  </p>
                  <div className="flex flex-col gap-1">
                    {profile.commonGroups.map((g) => (
                      <Link
                        key={g.id}
                        href="/groups"
                        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50 transition-colors"
                      >
                        <Users className="size-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate">{g.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {profile.commonProjects.length > 0 && (
                <div className="mb-4">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {profile.commonProjects.length} Shared Project{profile.commonProjects.length > 1 ? "s" : ""}
                  </p>
                  <div className="flex flex-col gap-1">
                    {profile.commonProjects.map((p) => (
                      <Link
                        key={p.id}
                        href={`/projects/${p.id}`}
                        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50 transition-colors"
                      >
                        <Briefcase className="size-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate">{p.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {profile.commonWorkspaces.length === 0 &&
                profile.commonChannels.length === 0 &&
                profile.commonGroups.length === 0 &&
                profile.commonProjects.length === 0 && (
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground">No shared workspaces, channels, groups, or projects</p>
                </div>
              )}
            </ScrollArea>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
