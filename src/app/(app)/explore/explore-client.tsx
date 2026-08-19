"use client"

import * as React from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  Hash,
  Users,
  Briefcase,
  MessageSquare,
  ListTodo,
  ArrowRight,
  Circle,
  Clock,
} from "lucide-react"

interface Channel {
  id: string
  name: string
  description: string | null
  type: string
  _count: { messages: number }
}

interface User {
  id: string
  name: string | null
  email: string
  avatar: string | null
  jobTitle: string | null
  status: string
}

interface Project {
  id: string
  name: string
  description: string | null
  status: string
  progress: number
  _count: { tasks: number }
}

interface Message {
  id: string
  content: string
  createdAt: string
  user: { id: string; name: string | null; avatar: string | null }
  channel: { id: string; name: string }
}

interface Task {
  id: string
  title: string
  status: string
  priority: string
  dueDate: string | null
  assignee: { id: string; name: string | null; avatar: string | null } | null
  project: { id: string; name: string } | null
}

interface ExploreClientProps {
  channels: Channel[]
  users: User[]
  projects: Project[]
  recentMessages: Message[]
  recentTasks: Task[]
}

function getInitials(name: string | null, email: string) {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }
  return email[0].toUpperCase()
}

function statusColor(status: string) {
  switch (status) {
    case "online":
      return "bg-green-500"
    case "away":
      return "bg-yellow-500"
    case "busy":
      return "bg-red-500"
    default:
      return "bg-gray-400"
  }
}

function priorityColor(priority: string) {
  switch (priority) {
    case "urgent":
      return "text-red-500"
    case "high":
      return "text-orange-500"
    case "medium":
      return "text-yellow-500"
    case "low":
      return "text-green-500"
    default:
      return "text-muted-foreground"
  }
}

function truncate(str: string, len: number) {
  return str.length > len ? str.slice(0, len) + "..." : str
}

export function ExploreClient({
  channels,
  users,
  projects,
  recentMessages,
  recentTasks,
}: ExploreClientProps) {
  const [search, setSearch] = React.useState("")

  const filteredChannels = React.useMemo(() => {
    if (!search) return channels
    const q = search.toLowerCase()
    return channels.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q)
    )
  }, [channels, search])

  const filteredUsers = React.useMemo(() => {
    if (!search) return users
    const q = search.toLowerCase()
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.jobTitle?.toLowerCase().includes(q)
    )
  }, [users, search])

  const filteredProjects = React.useMemo(() => {
    if (!search) return projects
    const q = search.toLowerCase()
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
    )
  }, [projects, search])

  const filteredMessages = React.useMemo(() => {
    if (!search) return recentMessages
    const q = search.toLowerCase()
    return recentMessages.filter((m) => m.content.toLowerCase().includes(q))
  }, [recentMessages, search])

  const filteredTasks = React.useMemo(() => {
    if (!search) return recentTasks
    const q = search.toLowerCase()
    return recentTasks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.project?.name.toLowerCase().includes(q)
    )
  }, [recentTasks, search])

  return (
    <div className="flex flex-col gap-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search everything..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="glow-input pl-9"
        />
      </div>

      <Tabs defaultValue="channels" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="channels" className="gap-1.5">
            <Hash className="size-3.5" />
            Channels
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
              {filteredChannels.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="people" className="gap-1.5">
            <Users className="size-3.5" />
            People
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
              {filteredUsers.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="projects" className="gap-1.5">
            <Briefcase className="size-3.5" />
            Projects
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
              {filteredProjects.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-1.5">
            <MessageSquare className="size-3.5" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="tasks" className="gap-1.5">
            <ListTodo className="size-3.5" />
            Tasks
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
              {filteredTasks.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* ─── Channels ─────────────────────────────────── */}
        <TabsContent value="channels">
          <Card className="glow-card">
            <CardContent className="p-0">
              <div className="grid gap-0 divide-y">
                {filteredChannels.length === 0 ? (
                  <p className="py-12 text-center text-sm text-muted-foreground">
                    No channels found.
                  </p>
                ) : (
                  filteredChannels.map((channel) => (
                    <Link
                      key={channel.id}
                      href={`/channels/${channel.id}`}
                      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Hash className="size-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">
                            #{channel.name}
                          </span>
                          <Badge variant="outline" className="h-5 text-[10px]">
                            {channel.type}
                          </Badge>
                        </div>
                        {channel.description && (
                          <p className="truncate text-xs text-muted-foreground">
                            {channel.description}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {channel._count.messages.toLocaleString()} messages
                      </span>
                      <ArrowRight className="size-3.5 text-muted-foreground/50" />
                    </Link>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── People ───────────────────────────────────── */}
        <TabsContent value="people">
          <Card className="glow-card">
            <CardContent className="p-0">
              <div className="grid gap-0 divide-y">
                {filteredUsers.length === 0 ? (
                  <p className="py-12 text-center text-sm text-muted-foreground">
                    No people found.
                  </p>
                ) : (
                  filteredUsers.map((user) => (
                    <Link
                      key={user.id}
                      href="/dms"
                      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="relative">
                        <Avatar size="sm">
                          <AvatarImage src={user.avatar ?? undefined} />
                          <AvatarFallback>
                            {getInitials(user.name, user.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className={`absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-background ${statusColor(user.status)}`}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-medium text-foreground">
                          {user.name ?? "Unnamed"}
                        </span>
                        <p className="text-xs text-muted-foreground">
                          {user.jobTitle || user.email}
                        </p>
                      </div>
                      <ArrowRight className="size-3.5 text-muted-foreground/50" />
                    </Link>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Projects ─────────────────────────────────── */}
        <TabsContent value="projects">
          <Card className="glow-card">
            <CardContent className="p-0">
              <div className="grid gap-0 divide-y">
                {filteredProjects.length === 0 ? (
                  <p className="py-12 text-center text-sm text-muted-foreground">
                    No projects found.
                  </p>
                ) : (
                  filteredProjects.map((project) => (
                    <Link
                      key={project.id}
                      href={`/projects/${project.id}`}
                      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Briefcase className="size-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">
                            {project.name}
                          </span>
                          <Badge variant="outline" className="h-5 text-[10px]">
                            {project.status}
                          </Badge>
                        </div>
                        {project.description && (
                          <p className="truncate text-xs text-muted-foreground">
                            {truncate(project.description, 80)}
                          </p>
                        )}
                        <div className="mt-1 flex items-center gap-2">
                          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary transition-all"
                              style={{ width: `${project.progress}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {project.progress}% &middot; {project._count.tasks} tasks
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="size-3.5 text-muted-foreground/50" />
                    </Link>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Activity ─────────────────────────────────── */}
        <TabsContent value="activity">
          <Card className="glow-card">
            <CardContent className="p-0">
              <div className="grid gap-0 divide-y">
                {filteredMessages.length === 0 ? (
                  <p className="py-12 text-center text-sm text-muted-foreground">
                    No recent activity.
                  </p>
                ) : (
                  filteredMessages.map((msg) => (
                    <Link
                      key={msg.id}
                      href={`/channels/${msg.channel.id}`}
                      className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
                    >
                      <Avatar size="sm">
                        <AvatarImage src={msg.user.avatar ?? undefined} />
                        <AvatarFallback>
                          {getInitials(msg.user.name, "")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">
                            {msg.user.name ?? "Unknown"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            in #{msg.channel.name}
                          </span>
                          <span className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Clock className="size-3" />
                            {new Date(msg.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {truncate(msg.content, 120)}
                        </p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Tasks ────────────────────────────────────── */}
        <TabsContent value="tasks">
          <Card className="glow-card">
            <CardContent className="p-0">
              <div className="grid gap-0 divide-y">
                {filteredTasks.length === 0 ? (
                  <p className="py-12 text-center text-sm text-muted-foreground">
                    No tasks found.
                  </p>
                ) : (
                  filteredTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 px-4 py-3"
                    >
                      <Circle className={`size-2.5 shrink-0 ${priorityColor(task.priority)}`} />
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-medium text-foreground">
                          {task.title}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          {task.project && (
                            <Badge variant="outline" className="h-5 text-[10px]">
                              {task.project.name}
                            </Badge>
                          )}
                          <Badge variant="secondary" className="h-5 text-[10px]">
                            {task.status}
                          </Badge>
                          {task.dueDate && (
                            <span className="text-[10px] text-muted-foreground">
                              Due {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      {task.assignee && (
                        <Avatar size="sm">
                          <AvatarImage src={task.assignee.avatar ?? undefined} />
                          <AvatarFallback>
                            {getInitials(task.assignee.name, "")}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
