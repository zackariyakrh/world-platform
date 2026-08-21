"use client"

import * as React from "react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import {
  X,
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

interface UserProfilePanelProps {
  userId: string
  open: boolean
  onClose: () => void
}

export function UserProfilePanel({ userId, open, onClose }: UserProfilePanelProps) {
  const [profile, setProfile] = React.useState<ProfileData | null>(null)
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (!open || !userId) return
    setLoading(true)
    fetch(`/api/users/${userId}/profile`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setProfile(data))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false))
  }, [userId, open])

  if (!open) return null

  return (
    <>
      <div className="absolute inset-y-0 right-0 z-30 w-80 border-l bg-background shadow-xl animate-in slide-in-from-right duration-200">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h3 className="text-sm font-semibold">Profile</h3>
            <Button variant="ghost" size="icon-xs" onClick={onClose}>
              <X className="size-4" />
            </Button>
          </div>

          {loading ? (
            <div className="flex flex-1 items-center justify-center">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : !profile ? (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-sm text-muted-foreground">Failed to load profile</p>
            </div>
          ) : (
            <ScrollArea className="flex-1">
              <div className="flex flex-col items-center px-4 pt-6 pb-4">
                {/* Avatar */}
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

                {/* Name & username */}
                <h2 className="text-lg font-semibold">{profile.name || "Unknown"}</h2>
                {profile.username && (
                  <p className="text-sm text-muted-foreground">@{profile.username}</p>
                )}

                {/* Status */}
                <div className="mt-1 flex items-center gap-1.5">
                  <span className={cn("size-2 rounded-full", statusColors[profile.status] || statusColors.offline)} />
                  <span className="text-xs text-muted-foreground">
                    {profile.customStatus || statusLabels[profile.status] || "Offline"}
                  </span>
                </div>

                {/* Friendship badge */}
                {profile.friendshipStatus && (
                  <span className="mt-2 inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    Friend
                  </span>
                )}
              </div>

              <div className="px-4">
                <Separator className="mb-4" />

                {/* Bio */}
                {profile.bio && (
                  <div className="mb-4">
                    <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">About</p>
                    <p className="text-sm leading-relaxed">{profile.bio}</p>
                  </div>
                )}

                {/* Job title */}
                {profile.jobTitle && (
                  <div className="mb-4 flex items-center gap-2">
                    <Briefcase className="size-4 shrink-0 text-muted-foreground" />
                    <span className="text-sm">{profile.jobTitle}</span>
                  </div>
                )}

                {/* Timezone */}
                {profile.timezone && (
                  <div className="mb-4 flex items-center gap-2">
                    <Globe className="size-4 shrink-0 text-muted-foreground" />
                    <span className="text-sm">{profile.timezone}</span>
                  </div>
                )}

                {/* Last seen */}
                {profile.lastSeenAt && profile.status !== "online" && (
                  <div className="mb-4 flex items-center gap-2">
                    <Clock className="size-4 shrink-0 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Last seen {formatDistanceToNow(new Date(profile.lastSeenAt), { addSuffix: true })}
                    </span>
                  </div>
                )}

                {/* Joined */}
                <div className="mb-4 flex items-center gap-2">
                  <Clock className="size-4 shrink-0 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Joined {formatDistanceToNow(new Date(profile.createdAt), { addSuffix: true })}
                  </span>
                </div>

                <Separator className="my-4" />

                {/* Common Workspaces */}
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

                {/* Common Channels */}
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

                {/* Common Groups */}
                {profile.commonGroups.length > 0 && (
                  <div className="mb-4">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {profile.commonGroups.length} Shared Group{profile.commonGroups.length > 1 ? "s" : ""}
                    </p>
                    <div className="flex flex-col gap-1">
                      {profile.commonGroups.map((g) => (
                        <Link
                          key={g.id}
                          href={`/groups`}
                          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50 transition-colors"
                        >
                          <Users className="size-3.5 shrink-0 text-muted-foreground" />
                          <span className="truncate">{g.name}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Common Projects */}
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

                {/* No shared items */}
                {profile.commonWorkspaces.length === 0 &&
                  profile.commonChannels.length === 0 &&
                  profile.commonGroups.length === 0 &&
                  profile.commonProjects.length === 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground">No shared workspaces, channels, groups, or projects</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>
      <div
        className="absolute inset-0 z-20 bg-black/20 md:hidden"
        onClick={onClose}
      />
    </>
  )
}
