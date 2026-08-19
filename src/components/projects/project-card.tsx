"use client"

import * as React from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import { AvatarGroup, type AvatarGroupUser } from "@/components/ui/avatar-group"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import {
  CheckCircle,
  Clock,
  AlertCircle,
  MoreHorizontal,
} from "lucide-react"

interface Task {
  id: string
  title: string
  status: string
  priority: string
  dueDate: string | null
}

interface ProjectMember {
  id: string
  userId: string
  role: string
  user: {
    id: string
    name: string | null
    avatar: string | null
  }
}

interface ProjectData {
  id: string
  name: string
  description: string | null
  status: string
  priority: string
  progress: number
  startDate: string | null
  dueDate: string | null
  createdAt: string
  members: ProjectMember[]
  tasks: Task[]
}

interface ProjectCardProps {
  project: ProjectData
}

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  active: "default",
  archived: "secondary",
  completed: "outline",
}

const priorityColor: Record<string, string> = {
  low: "text-blue-500",
  medium: "text-amber-500",
  high: "text-orange-500",
  urgent: "text-red-500",
}

export function ProjectCard({ project }: ProjectCardProps) {
  const todoCount = project.tasks.filter((t) => t.status === "todo").length
  const inProgressCount = project.tasks.filter((t) => t.status === "in_progress").length
  const doneCount = project.tasks.filter((t) => t.status === "done").length
  const totalCount = project.tasks.length

  const members: AvatarGroupUser[] = project.members.map((m) => ({
    id: m.userId,
    name: m.user.name || "Unknown",
    image: m.user.avatar,
  }))

  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="glow-card cursor-pointer">
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="line-clamp-1">{project.name}</CardTitle>
            <Badge variant={statusVariant[project.status] || "secondary"}>
              {project.status}
            </Badge>
          </div>
          {project.description && (
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {project.description}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{project.progress}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all shadow-[0_0_8px_oklch(from_var(--primary)_l_c_h_/_0.3)]"
                style={{ width: `${project.progress}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <CheckCircle className="size-3.5 text-emerald-500 drop-shadow-[0_0_4px_oklch(0.65_0.20_160_/_0.4)]" />
              <span>{doneCount} done</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="size-3.5 text-blue-500 drop-shadow-[0_0_4px_oklch(0.60_0.20_250_/_0.4)]" />
              <span>{inProgressCount} in progress</span>
            </div>
            <div className="flex items-center gap-1">
              <AlertCircle className="size-3.5 text-muted-foreground/50" />
              <span>{todoCount} todo</span>
            </div>
            <span className="ml-auto text-muted-foreground/50">{totalCount} total</span>
          </div>

          <div className="flex items-center justify-between">
            <AvatarGroup users={members} max={4} size="sm" />
            {project.dueDate && (
              <span className="text-xs text-muted-foreground">
                Due {format(new Date(project.dueDate), "MMM d, yyyy")}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
