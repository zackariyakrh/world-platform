"use client"

import * as React from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  FolderOpen,
  Users,
  Hash,
  Briefcase,
  ArrowLeft,
  Crown,
  MoreHorizontal,
  UserMinus,
  Loader2,
  Plus,
  Globe,
  Lock,
} from "lucide-react"

interface Member {
  id: string
  role: string
  joinedAt: string
  user: { id: string; name: string | null; email: string; avatar: string | null }
}

interface Channel {
  id: string
  name: string
  type: string
  description?: string | null
  createdAt: string
  updatedAt: string
}

interface Project {
  id: string
  name: string
  description?: string | null
  status: string
  priority: string
  startDate?: string | null
  dueDate?: string | null
  createdAt: string
  updatedAt: string
  _count: { tasks: number }
}

interface Workspace {
  id: string
  name: string
  slug: string
  description?: string | null
  isPublic: boolean
  createdAt: string
  owner: { id: string; name: string; email: string; avatar: string | null }
  members: Member[]
  channels: Channel[]
  projects: Project[]
  _count: { members: number; channels: number; projects: number }
  myRole: string
}

export function WorkspaceDetailClient({
  workspace,
  userId,
}: {
  workspace: Workspace
  userId: string
}) {
  const router = useRouter()
  const ws = workspace
  const isOwner = ws.myRole === "owner"
  const isAdmin = ws.myRole === "admin" || isOwner

  return (
    <>
      <div className="mb-6">
        <button
          onClick={() => router.push("/workspaces")}
          className="mb-3 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to Workspaces
        </button>

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary text-xl font-bold">
              {ws.name?.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground glow-text">
                {ws.name}
                <Badge variant={ws.isPublic ? "outline" : "secondary"} className="gap-1 text-xs">
                  {ws.isPublic ? <Globe className="size-3" /> : <Lock className="size-3" />}
                  {ws.isPublic ? "Public" : "Private"}
                </Badge>
              </h1>
              {ws.description && (
                <p className="mt-1 text-sm text-muted-foreground">{ws.description}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        {[
          { label: "Members", value: ws._count.members, icon: Users },
          { label: "Channels", value: ws._count.channels, icon: Hash },
          { label: "Projects", value: ws._count.projects, icon: Briefcase },
        ].map((stat) => (
          <div key={stat.label} className="glow-card rounded-xl bg-card p-4 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <stat.icon className="size-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Members */}
        <div className="glow-card rounded-xl bg-card p-5">
          <h2 className="mb-4 text-base font-semibold text-foreground">Members</h2>
          <div className="space-y-2">
            {ws.members.map((member) => (
              <div key={member.id} className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                    {member.user.name?.charAt(0) || member.user.email?.charAt(0) || "?"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {member.user.name || member.user.email}
                      {member.user.id === userId && (
                        <span className="ml-1.5 text-xs text-muted-foreground">(you)</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">{member.user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {member.role === "owner" && (
                    <Badge variant="outline" className="gap-1 text-xs text-primary border-primary/30">
                      <Crown className="size-3" />
                      Owner
                    </Badge>
                  )}
                  {member.role === "admin" && (
                    <Badge variant="secondary" className="text-xs">Admin</Badge>
                  )}
                  {isAdmin && member.role !== "owner" && member.user.id !== userId && (
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="sm" className="size-7 p-0" />}>
                        <MoreHorizontal className="size-3.5" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={async () => {
                            try {
                              const res = await fetch(`/api/workspaces/${ws.id}/members/${member.user.id}`, { method: "DELETE" })
                              if (res.ok) toast.success("Member removed")
                              else toast.error("Failed to remove member")
                            } catch { toast.error("Something went wrong") }
                          }}
                        >
                          <UserMinus className="size-3.5" />
                          Remove from workspace
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Channels */}
        <div className="glow-card rounded-xl bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">Channels</h2>
          </div>
          {ws.channels.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No channels yet.</p>
          ) : (
            <div className="space-y-1">
              {ws.channels.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => router.push(`/channels/${ch.id}`)}
                  className="flex w-full items-center gap-3 rounded-lg border border-transparent p-3 text-left transition-colors hover:bg-muted/50 hover:border-border/50"
                >
                  <Hash className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{ch.name}</p>
                    {ch.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1">{ch.description}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Projects */}
        <div className="glow-card rounded-xl bg-card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">Projects</h2>
          </div>
          {ws.projects.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No projects yet.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ws.projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => router.push(`/projects/${project.id}`)}
                  className="rounded-xl border border-border/50 p-4 text-left transition-all hover:ring-2 hover:ring-primary/30"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-medium text-foreground">{project.name}</h3>
                    <Badge variant={project.status === "active" ? "default" : "secondary"} className="text-xs">
                      {project.status}
                    </Badge>
                  </div>
                  {project.description && (
                    <p className="mb-2 text-xs text-muted-foreground line-clamp-2">{project.description}</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{project._count.tasks} tasks</span>
                    <Badge variant="outline" className="text-xs">{project.priority}</Badge>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
