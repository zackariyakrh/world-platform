"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Search, Hash, Users, Briefcase, MessageSquare, ListTodo,
  ArrowRight, Circle, Clock, Plus, MoreHorizontal, Pencil,
  Trash2, Loader2, Eye, KeyRound, Mail, Phone, MapPin, UserCheck,
} from "lucide-react"
import { toast } from "sonner"

interface Channel { id: string; name: string; description: string | null; type: string; _count: { messages: number } }
interface User { id: string; name: string | null; firstName: string | null; lastName: string | null; email: string; phone: string | null; gender: string | null; address: string | null; avatar: string | null; jobTitle: string | null; status: string; role: string; isActive: boolean }
interface Project { id: string; name: string; description: string | null; status: string; progress: number; _count: { tasks: number } }
interface Message { id: string; content: string; createdAt: string; user: { id: string; name: string | null; avatar: string | null }; channel: { id: string; name: string } }
interface Task { id: string; title: string; status: string; priority: string; dueDate: string | null; assignee: { id: string; name: string | null; avatar: string | null } | null; project: { id: string; name: string } | null }

interface ExploreClientProps {
  channels: Channel[]
  users: User[]
  projects: Project[]
  recentMessages: Message[]
  recentTasks: Task[]
  isAdmin: boolean
}

function getInitials(name: string | null, email: string) {
  if (name) return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
  return email[0].toUpperCase()
}

function statusColor(s: string) {
  switch (s) { case "online": return "bg-green-500"; case "away": return "bg-yellow-500"; case "busy": return "bg-red-500"; default: return "bg-gray-400" }
}

function priorityColor(p: string) {
  switch (p) { case "urgent": return "text-red-500"; case "high": return "text-orange-500"; case "medium": return "text-yellow-500"; case "low": return "text-green-500"; default: return "text-muted-foreground" }
}

function trunc(s: string, n: number) { return s.length > n ? s.slice(0, n) + "..." : s }

async function api(url: string, method: string, body?: unknown) {
  return fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  })
}

export function ExploreClient({
  channels: initCh, users: initUs, projects: initProj,
  recentMessages: initMsg, recentTasks: initTask, isAdmin,
}: ExploreClientProps) {
  const router = useRouter()
  const [search, setSearch] = React.useState("")
  const [channels, setChannels] = React.useState(initCh)
  const [users, setUsers] = React.useState(initUs)
  const [projects, setProjects] = React.useState(initProj)
  const [tasks, setTasks] = React.useState(initTask)

  const [chOpen, setChOpen] = React.useState(false)
  const [chEdit, setChEdit] = React.useState<Channel | null>(null)
  const [chForm, setChForm] = React.useState({ name: "", description: "" })
  const [chBusy, setChBusy] = React.useState(false)

  const [projOpen, setProjOpen] = React.useState(false)
  const [projEdit, setProjEdit] = React.useState<Project | null>(null)
  const [projForm, setProjForm] = React.useState({ name: "", description: "", status: "active" })
  const [projBusy, setProjBusy] = React.useState(false)

  const [taskOpen, setTaskOpen] = React.useState(false)
  const [taskEdit, setTaskEdit] = React.useState<Task | null>(null)
  const [taskForm, setTaskForm] = React.useState({ title: "", status: "todo", priority: "medium", projectId: "" })
  const [taskBusy, setTaskBusy] = React.useState(false)

  const [uOpen, setUOpen] = React.useState(false)
  const [uForm, setUForm] = React.useState({ firstName: "", lastName: "", email: "", phone: "", gender: "", address: "", password: "", role: "member" })
  const [uBusy, setUBusy] = React.useState(false)

  const [viewUser, setViewUser] = React.useState<User | null>(null)
  const [resetPwOpen, setResetPwOpen] = React.useState(false)
  const [resetPwUser, setResetPwUser] = React.useState<User | null>(null)
  const [resetPwForm, setResetPwForm] = React.useState({ password: "", confirm: "" })
  const [resetPwBusy, setResetPwBusy] = React.useState(false)

  const [delUser, setDelUser] = React.useState<User | null>(null)
  const [delBusy, setDelBusy] = React.useState(false)

  const f = React.useMemo(() => search.toLowerCase(), [search])
  const fch = React.useMemo(() => f ? channels.filter((c) => c.name.toLowerCase().includes(f) || c.description?.toLowerCase().includes(f)) : channels, [channels, f])
  const fus = React.useMemo(() => f ? users.filter((u) => u.name?.toLowerCase().includes(f) || u.email.toLowerCase().includes(f)) : users, [users, f])
  const fp = React.useMemo(() => f ? projects.filter((p) => p.name.toLowerCase().includes(f) || p.description?.toLowerCase().includes(f)) : projects, [projects, f])
  const fm = React.useMemo(() => f ? initMsg.filter((m) => m.content.toLowerCase().includes(f)) : initMsg, [initMsg, f])
  const ft = React.useMemo(() => f ? tasks.filter((t) => t.title.toLowerCase().includes(f) || t.project?.name.toLowerCase().includes(f)) : tasks, [tasks, f])

  function openChDialog(edit: Channel | null) {
    setChEdit(edit)
    setChForm(edit ? { name: edit.name, description: edit.description || "" } : { name: "", description: "" })
    setChOpen(true)
  }

  async function saveCh() {
    if (!chForm.name.trim()) return
    setChBusy(true)
    try {
      const body = { name: chForm.name.trim(), description: chForm.description.trim() || null }
      const res = chEdit ? await api(`/api/channels/${chEdit.id}`, "PATCH", body) : await api("/api/channels", "POST", body)
      if (res.ok) {
        const ch = await res.json()
        if (chEdit) {
          setChannels((p) => p.map((c) => c.id === ch.id ? { ...c, name: ch.name, description: ch.description } : c))
          toast.success("Channel updated")
        } else {
          setChannels((p) => [...p, { id: ch.id, name: ch.name, description: ch.description, type: ch.type || "text", _count: ch._count || { messages: 0 } }])
          toast.success("Channel created")
          window.dispatchEvent(new Event("channels:changed"))
        }
        setChOpen(false); setChEdit(null); setChForm({ name: "", description: "" })
      } else { toast.error((await res.json()).error || "Failed") }
    } catch { toast.error("Error") } finally { setChBusy(false) }
  }

  async function deleteCh(ch: Channel) {
    if (!confirm(`Delete #${ch.name}?`)) return
    const res = await api(`/api/channels/${ch.id}`, "DELETE")
    if (res.ok || res.status === 204) { setChannels((p) => p.filter((c) => c.id !== ch.id)); toast.success(`#${ch.name} deleted`); window.dispatchEvent(new Event("channels:changed")) }
    else { toast.error("Failed") }
  }

  function openProjDialog(edit: Project | null) {
    setProjEdit(edit)
    setProjForm(edit ? { name: edit.name, description: edit.description || "", status: edit.status } : { name: "", description: "", status: "active" })
    setProjOpen(true)
  }

  async function saveProj() {
    if (!projForm.name.trim()) return
    setProjBusy(true)
    try {
      const body = { name: projForm.name.trim(), description: projForm.description.trim() || null, status: projForm.status }
      const res = projEdit ? await api(`/api/projects/${projEdit.id}`, "PATCH", body) : await api("/api/projects", "POST", body)
      if (res.ok) {
        const p = await res.json()
        if (projEdit) {
          setProjects((prev) => prev.map((x) => x.id === p.id ? { ...x, name: p.name, description: p.description, status: p.status || projEdit.status } : x))
          toast.success("Project updated")
        } else {
          setProjects((prev) => [...prev, { id: p.id, name: p.name, description: p.description, status: p.status || "active", progress: 0, _count: { tasks: 0 } }])
          toast.success("Project created")
        }
        setProjOpen(false); setProjEdit(null); setProjForm({ name: "", description: "", status: "active" })
      } else { toast.error((await res.json()).error || "Failed") }
    } catch { toast.error("Error") } finally { setProjBusy(false) }
  }

  async function deleteProj(p: Project) {
    if (!confirm(`Delete project "${p.name}"?`)) return
    const res = await api(`/api/projects/${p.id}`, "DELETE")
    if (res.ok || res.status === 204) { setProjects((prev) => prev.filter((x) => x.id !== p.id)); toast.success("Project deleted") }
    else { toast.error("Failed") }
  }

  function openTaskDialog(edit: Task | null) {
    setTaskEdit(edit)
    setTaskForm(edit
      ? { title: edit.title, status: edit.status, priority: edit.priority, projectId: edit.project?.id || "" }
      : { title: "", status: "todo", priority: "medium", projectId: projects[0]?.id || "" })
    setTaskOpen(true)
  }

  async function saveTask() {
    if (!taskForm.title.trim()) return
    setTaskBusy(true)
    try {
      const body = { title: taskForm.title.trim(), status: taskForm.status, priority: taskForm.priority, projectId: taskForm.projectId || undefined }
      const res = taskEdit ? await api(`/api/tasks/${taskEdit.id}`, "PATCH", body) : await api("/api/tasks", "POST", body)
      if (res.ok) {
        const t = await res.json()
        if (taskEdit) {
          setTasks((prev) => prev.map((x) => x.id === t.id ? { ...x, title: t.title, status: t.status, priority: t.priority } : x))
          toast.success("Task updated")
        } else {
          setTasks((prev) => [{ id: t.id, title: t.title, status: t.status, priority: t.priority, dueDate: null, assignee: t.assignee || null, project: projects.find((p) => p.id === taskForm.projectId) || null }, ...prev])
          toast.success("Task created")
        }
        setTaskOpen(false); setTaskEdit(null); setTaskForm({ title: "", status: "todo", priority: "medium", projectId: "" })
      } else { toast.error((await res.json()).error || "Failed") }
    } catch { toast.error("Error") } finally { setTaskBusy(false) }
  }

  async function deleteTask(t: Task) {
    if (!confirm(`Delete task "${t.title}"?`)) return
    const res = await api(`/api/tasks/${t.id}`, "DELETE")
    if (res.ok) { setTasks((prev) => prev.filter((x) => x.id !== t.id)); toast.success("Task deleted") }
    else { toast.error("Failed") }
  }

  async function saveUser() {
    if (!uForm.firstName.trim() || !uForm.lastName.trim() || !uForm.email.trim() || uForm.password.length < 8) { toast.error("Fill all required fields (password min 8 chars)"); return }
    setUBusy(true)
    try {
      const res = await api("/api/admin/users", "POST", {
        firstName: uForm.firstName.trim(),
        lastName: uForm.lastName.trim(),
        email: uForm.email.trim(),
        phone: uForm.phone.trim() || undefined,
        gender: uForm.gender || undefined,
        address: uForm.address.trim() || undefined,
        password: uForm.password,
        role: uForm.role,
      })
      if (res.ok) {
        const u = await res.json()
        setUsers((prev) => [...prev, { id: u.id, name: u.name, firstName: u.firstName, lastName: u.lastName, email: u.email, phone: u.phone, gender: u.gender, address: u.address, avatar: null, jobTitle: null, status: "offline", role: u.role, isActive: true }])
        toast.success("User created"); setUOpen(false); setUForm({ firstName: "", lastName: "", email: "", phone: "", gender: "", address: "", password: "", role: "member" })
      } else { toast.error((await res.json()).error || "Failed") }
    } catch { toast.error("Error") } finally { setUBusy(false) }
  }

  async function deleteUser(u: User) {
    setDelBusy(true)
    try {
      const res = await api("/api/admin/users", "DELETE", { userId: u.id })
      if (res.ok || res.status === 204) { setUsers((prev) => prev.filter((x) => x.id !== u.id)); toast.success("User deleted"); setDelUser(null) }
      else { const d = await res.json(); toast.error(d.error || "Failed") }
    } catch { toast.error("Error") } finally { setDelBusy(false) }
  }

  async function toggleUserActive(u: User) {
    const res = await api("/api/admin/users", "PATCH", { userId: u.id, isActive: !u.isActive })
    if (res.ok) { setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, isActive: !x.isActive } : x)); toast.success(u.isActive ? "Suspended" : "Reactivated") }
  }

  async function changeUserRole(u: User, role: string) {
    const res = await api("/api/admin/users", "PATCH", { userId: u.id, role })
    if (res.ok) { setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, role } : x)); toast.success(`Role changed to ${role}`) }
  }

  function openResetPw(u: User) {
    setResetPwUser(u)
    setResetPwForm({ password: "", confirm: "" })
    setResetPwOpen(true)
  }

  async function resetUserPassword() {
    if (!resetPwUser) return
    if (resetPwForm.password.length < 8) { toast.error("Password must be at least 8 characters"); return }
    if (resetPwForm.password !== resetPwForm.confirm) { toast.error("Passwords do not match"); return }
    setResetPwBusy(true)
    try {
      const res = await api("/api/admin/users", "PATCH", { userId: resetPwUser.id, resetPassword: resetPwForm.password })
      if (res.ok) { toast.success(`Password reset for ${resetPwUser.name || resetPwUser.email}`); setResetPwOpen(false) }
      else { const d = await res.json(); toast.error(d.error || "Failed") }
    } catch { toast.error("Error") } finally { setResetPwBusy(false) }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search everything..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Tabs defaultValue="channels" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="channels" className="gap-1.5"><Hash className="size-3.5" />Channels<Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">{fch.length}</Badge></TabsTrigger>
          <TabsTrigger value="people" className="gap-1.5"><Users className="size-3.5" />People<Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">{fus.length}</Badge></TabsTrigger>
          <TabsTrigger value="projects" className="gap-1.5"><Briefcase className="size-3.5" />Projects<Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">{fp.length}</Badge></TabsTrigger>
          <TabsTrigger value="activity" className="gap-1.5"><MessageSquare className="size-3.5" />Activity</TabsTrigger>
          <TabsTrigger value="tasks" className="gap-1.5"><ListTodo className="size-3.5" />Tasks<Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">{ft.length}</Badge></TabsTrigger>
        </TabsList>

        {/* Channels */}
        <TabsContent value="channels">
          <Card className="glow-card">
            <CardContent className="p-0">
              {isAdmin && (
                <div className="flex items-center justify-between border-b px-4 py-2">
                  <span className="text-xs font-medium text-muted-foreground">Manage channels</span>
                  <Button size="sm" className="h-7 gap-1" onClick={() => openChDialog(null)}>
                    <Plus className="size-3" />New Channel
                  </Button>
                </div>
              )}
              <div className="grid gap-0 divide-y">
                {fch.length === 0 ? <p className="py-12 text-center text-sm text-muted-foreground">No channels found.</p> :
                  fch.map((ch) => (
                    <div key={ch.id} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50">
                      <Link href={`/channels/${ch.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10"><Hash className="size-4 text-primary" /></div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">#{ch.name}</span>
                            <Badge variant="outline" className="h-5 text-[10px]">{ch.type}</Badge>
                          </div>
                          {ch.description && <p className="truncate text-xs text-muted-foreground">{ch.description}</p>}
                        </div>
                        <span className="text-xs text-muted-foreground">{ch._count.messages} msgs</span>
                      </Link>
                      {isAdmin && (
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-xs" />}><MoreHorizontal className="size-3.5" /></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openChDialog(ch)}><Pencil className="size-3.5" />Rename</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => deleteCh(ch)} className="text-destructive"><Trash2 className="size-3.5" />Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* People */}
        <TabsContent value="people">
          <Card className="glow-card">
            <CardContent className="p-0">
              {isAdmin && (
                <div className="flex items-center justify-between border-b px-4 py-2">
                  <span className="text-xs font-medium text-muted-foreground">Manage users</span>
                  <Button size="sm" className="h-7 gap-1" onClick={() => setUOpen(true)}>
                    <Plus className="size-3" />New User
                  </Button>
                </div>
              )}
              <div className="grid gap-0 divide-y">
                {fus.length === 0 ? <p className="py-12 text-center text-sm text-muted-foreground">No people found.</p> :
                  fus.map((u) => (
                    <div key={u.id} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50">
                      <div className="relative">
                        <Avatar size="sm"><AvatarImage src={u.avatar ?? undefined} /><AvatarFallback>{getInitials(u.name, u.email)}</AvatarFallback></Avatar>
                        <div className={`absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-background ${statusColor(u.status)}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">{u.name ?? "Unnamed"}</span>
                          {u.phone && <span className="text-xs text-muted-foreground">{u.phone}</span>}
                        </div>
                        <p className="text-xs text-muted-foreground">{u.jobTitle || u.email}</p>
                        {u.gender && <p className="text-[10px] text-muted-foreground capitalize">{u.gender}</p>}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="h-5 text-[10px]">{u.role}</Badge>
                        {!u.isActive && <Badge variant="destructive" className="h-5 text-[10px]">Suspended</Badge>}
                      </div>
                      {isAdmin && (
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-xs" />}><MoreHorizontal className="size-3.5" /></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setViewUser(u)}><Eye className="size-3.5" />View Details</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openResetPw(u)}><KeyRound className="size-3.5" />Reset Password</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuGroup>
                              <DropdownMenuLabel>Change Role</DropdownMenuLabel>
                              {["admin", "manager", "member", "guest"].map((r) => (
                                <DropdownMenuItem key={r} onClick={() => changeUserRole(u, r)} disabled={u.role === r}>
                                  Make {r.charAt(0).toUpperCase() + r.slice(1)}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => toggleUserActive(u)}>{u.isActive ? "Suspend" : "Reactivate"}</DropdownMenuItem>
                            {u.role !== "owner" && <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setDelUser(u)} className="text-destructive"><Trash2 className="size-3.5" />Delete</DropdownMenuItem>
                            </>}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Projects */}
        <TabsContent value="projects">
          <Card className="glow-card">
            <CardContent className="p-0">
              {isAdmin && (
                <div className="flex items-center justify-between border-b px-4 py-2">
                  <span className="text-xs font-medium text-muted-foreground">Manage projects</span>
                  <Button size="sm" className="h-7 gap-1" onClick={() => openProjDialog(null)}>
                    <Plus className="size-3" />New Project
                  </Button>
                </div>
              )}
              <div className="grid gap-0 divide-y">
                {fp.length === 0 ? <p className="py-12 text-center text-sm text-muted-foreground">No projects found.</p> :
                  fp.map((p) => (
                    <div key={p.id} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50">
                      <Link href={`/projects/${p.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10"><Briefcase className="size-4 text-primary" /></div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">{p.name}</span>
                            <Badge variant="outline" className="h-5 text-[10px]">{p.status}</Badge>
                          </div>
                          {p.description && <p className="truncate text-xs text-muted-foreground">{trunc(p.description, 80)}</p>}
                          <div className="mt-1 flex items-center gap-2">
                            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${p.progress}%` }} /></div>
                            <span className="text-[10px] text-muted-foreground">{p.progress}% &middot; {p._count.tasks} tasks</span>
                          </div>
                        </div>
                      </Link>
                      {isAdmin && (
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-xs" />}><MoreHorizontal className="size-3.5" /></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openProjDialog(p)}><Pencil className="size-3.5" />Edit</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => deleteProj(p)} className="text-destructive"><Trash2 className="size-3.5" />Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity */}
        <TabsContent value="activity">
          <Card className="glow-card">
            <CardContent className="p-0">
              <div className="grid gap-0 divide-y">
                {fm.length === 0 ? <p className="py-12 text-center text-sm text-muted-foreground">No recent activity.</p> :
                  fm.map((msg) => (
                    <Link key={msg.id} href={`/channels/${msg.channel.id}`} className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/50">
                      <Avatar size="sm"><AvatarImage src={msg.user.avatar ?? undefined} /><AvatarFallback>{getInitials(msg.user.name, "")}</AvatarFallback></Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">{msg.user.name ?? "Unknown"}</span>
                          <span className="text-xs text-muted-foreground">in #{msg.channel.name}</span>
                          <span className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground"><Clock className="size-3" />{new Date(msg.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">{trunc(msg.content, 120)}</p>
                      </div>
                    </Link>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tasks */}
        <TabsContent value="tasks">
          <Card className="glow-card">
            <CardContent className="p-0">
              {isAdmin && (
                <div className="flex items-center justify-between border-b px-4 py-2">
                  <span className="text-xs font-medium text-muted-foreground">Manage tasks</span>
                  <Button size="sm" className="h-7 gap-1" onClick={() => openTaskDialog(null)}>
                    <Plus className="size-3" />New Task
                  </Button>
                </div>
              )}
              <div className="grid gap-0 divide-y">
                {ft.length === 0 ? <p className="py-12 text-center text-sm text-muted-foreground">No tasks found.</p> :
                  ft.map((t) => (
                    <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                      <Circle className={`size-2.5 shrink-0 ${priorityColor(t.priority)}`} />
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-medium text-foreground">{t.title}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          {t.project && <Badge variant="outline" className="h-5 text-[10px]">{t.project.name}</Badge>}
                          <Badge variant="secondary" className="h-5 text-[10px]">{t.status}</Badge>
                          {t.dueDate && <span className="text-[10px] text-muted-foreground">Due {new Date(t.dueDate).toLocaleDateString()}</span>}
                        </div>
                      </div>
                      {t.assignee && <Avatar size="sm"><AvatarImage src={t.assignee.avatar ?? undefined} /><AvatarFallback>{getInitials(t.assignee.name, "")}</AvatarFallback></Avatar>}
                      {isAdmin && (
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-xs" />}><MoreHorizontal className="size-3.5" /></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openTaskDialog(t)}><Pencil className="size-3.5" />Edit</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => deleteTask(t)} className="text-destructive"><Trash2 className="size-3.5" />Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Channel Dialog */}
      <Dialog open={chOpen} onOpenChange={setChOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{chEdit ? "Edit Channel" : "Create Channel"}</DialogTitle>
            <DialogDescription>{chEdit ? "Update the channel name or description." : "Add a new channel to your workspace."}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-5 py-1">
            <div className="flex flex-col gap-2"><Label className="text-xs font-medium uppercase text-muted-foreground">Name</Label><Input placeholder="e.g. welcome" value={chForm.name} onChange={(e) => setChForm({ ...chForm, name: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") saveCh() }} /></div>
            <div className="flex flex-col gap-2"><Label className="text-xs font-medium uppercase text-muted-foreground">Description</Label><Input placeholder="What is this channel about?" value={chForm.description} onChange={(e) => setChForm({ ...chForm, description: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button onClick={saveCh} disabled={chBusy || !chForm.name.trim()}>{chBusy ? <Loader2 className="size-3.5 animate-spin" /> : chEdit ? "Save Changes" : "Create Channel"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Project Dialog */}
      <Dialog open={projOpen} onOpenChange={setProjOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{projEdit ? "Edit Project" : "Create Project"}</DialogTitle>
            <DialogDescription>{projEdit ? "Update project details." : "Set up a new project for your team."}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-5 py-1">
            <div className="flex flex-col gap-2"><Label className="text-xs font-medium uppercase text-muted-foreground">Name</Label><Input placeholder="Project name" value={projForm.name} onChange={(e) => setProjForm({ ...projForm, name: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") saveProj() }} /></div>
            <div className="flex flex-col gap-2"><Label className="text-xs font-medium uppercase text-muted-foreground">Description</Label><Input placeholder="Brief description of the project" value={projForm.description} onChange={(e) => setProjForm({ ...projForm, description: e.target.value })} /></div>
            <div className="flex flex-col gap-2"><Label className="text-xs font-medium uppercase text-muted-foreground">Status</Label>
              <Select value={projForm.status} onValueChange={(v) => setProjForm({ ...projForm, status: v ?? "active" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="on-hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button onClick={saveProj} disabled={projBusy || !projForm.name.trim()}>{projBusy ? <Loader2 className="size-3.5 animate-spin" /> : projEdit ? "Save Changes" : "Create Project"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task Dialog */}
      <Dialog open={taskOpen} onOpenChange={setTaskOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{taskEdit ? "Edit Task" : "Create Task"}</DialogTitle>
            <DialogDescription>{taskEdit ? "Update task details." : "Add a new task to track."}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-5 py-1">
            <div className="flex flex-col gap-2"><Label className="text-xs font-medium uppercase text-muted-foreground">Title</Label><Input placeholder="Task title" value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") saveTask() }} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2"><Label className="text-xs font-medium uppercase text-muted-foreground">Status</Label>
                <Select value={taskForm.status} onValueChange={(v) => setTaskForm({ ...taskForm, status: v ?? "todo" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="todo">To Do</SelectItem><SelectItem value="in_progress">In Progress</SelectItem><SelectItem value="done">Done</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2"><Label className="text-xs font-medium uppercase text-muted-foreground">Priority</Label>
                <Select value={taskForm.priority} onValueChange={(v) => setTaskForm({ ...taskForm, priority: v ?? "medium" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="urgent">Urgent</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-2"><Label className="text-xs font-medium uppercase text-muted-foreground">Project</Label>
              <Select value={taskForm.projectId} onValueChange={(v) => setTaskForm({ ...taskForm, projectId: v ?? "" })}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent><SelectItem value="">None</SelectItem>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button onClick={saveTask} disabled={taskBusy || !taskForm.title.trim()}>{taskBusy ? <Loader2 className="size-3.5 animate-spin" /> : taskEdit ? "Save Changes" : "Create Task"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Dialog */}
      <Dialog open={uOpen} onOpenChange={setUOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create User</DialogTitle>
            <DialogDescription>Add a new user to the platform.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-5 py-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2"><Label className="text-xs font-medium uppercase text-muted-foreground">First Name *</Label><Input placeholder="Jane" value={uForm.firstName} onChange={(e) => setUForm({ ...uForm, firstName: e.target.value })} /></div>
              <div className="flex flex-col gap-2"><Label className="text-xs font-medium uppercase text-muted-foreground">Last Name *</Label><Input placeholder="Doe" value={uForm.lastName} onChange={(e) => setUForm({ ...uForm, lastName: e.target.value })} /></div>
            </div>
            <div className="flex flex-col gap-2"><Label className="text-xs font-medium uppercase text-muted-foreground">Email *</Label><Input type="email" placeholder="jane@example.com" value={uForm.email} onChange={(e) => setUForm({ ...uForm, email: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2"><Label className="text-xs font-medium uppercase text-muted-foreground">Phone</Label><Input placeholder="+1 234 567 890" value={uForm.phone} onChange={(e) => setUForm({ ...uForm, phone: e.target.value })} /></div>
              <div className="flex flex-col gap-2"><Label className="text-xs font-medium uppercase text-muted-foreground">Gender</Label>
                <Select value={uForm.gender} onValueChange={(v) => setUForm({ ...uForm, gender: v ?? "" })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-2"><Label className="text-xs font-medium uppercase text-muted-foreground">Address</Label><Input placeholder="Street, City, Country" value={uForm.address} onChange={(e) => setUForm({ ...uForm, address: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2"><Label className="text-xs font-medium uppercase text-muted-foreground">Password *</Label><Input type="password" placeholder="Min 8 characters" value={uForm.password} onChange={(e) => setUForm({ ...uForm, password: e.target.value })} /></div>
              <div className="flex flex-col gap-2"><Label className="text-xs font-medium uppercase text-muted-foreground">Role</Label>
                <Select value={uForm.role} onValueChange={(v) => setUForm({ ...uForm, role: v ?? "member" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["admin", "manager", "member", "guest"].map((r) => <SelectItem key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button onClick={saveUser} disabled={uBusy}>{uBusy ? <Loader2 className="size-3.5 animate-spin" /> : "Create User"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Details Dialog */}
      <Dialog open={!!viewUser} onOpenChange={(o) => { if (!o) setViewUser(null) }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>Full profile information for this user.</DialogDescription>
          </DialogHeader>
          {viewUser && (
            <div className="flex flex-col gap-5 py-1">
              <div className="flex items-center gap-4">
                <Avatar className="size-14">
                  <AvatarImage src={viewUser.avatar ?? undefined} />
                  <AvatarFallback className="text-lg">{getInitials(viewUser.name, viewUser.email)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-base font-semibold text-foreground">{viewUser.name ?? "Unnamed"}</p>
                  <p className="text-sm text-muted-foreground">{viewUser.email}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant="outline" className="h-5 text-[10px]">{viewUser.role}</Badge>
                    {!viewUser.isActive && <Badge variant="destructive" className="h-5 text-[10px]">Suspended</Badge>}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium uppercase text-muted-foreground">First Name</span>
                  <span className="text-foreground">{viewUser.firstName || "—"}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium uppercase text-muted-foreground">Last Name</span>
                  <span className="text-foreground">{viewUser.lastName || "—"}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium uppercase text-muted-foreground">Phone</span>
                  <span className="text-foreground">{viewUser.phone || "—"}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium uppercase text-muted-foreground">Gender</span>
                  <span className="text-foreground capitalize">{viewUser.gender || "—"}</span>
                </div>
                <div className="col-span-2 flex flex-col gap-1">
                  <span className="text-xs font-medium uppercase text-muted-foreground">Address</span>
                  <span className="text-foreground">{viewUser.address || "—"}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium uppercase text-muted-foreground">Status</span>
                  <div className="flex items-center gap-2">
                    <div className={`size-2 rounded-full ${statusColor(viewUser.status)}`} />
                    <span className="text-foreground capitalize">{viewUser.status}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Close</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetPwOpen} onOpenChange={setResetPwOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>Set a new password for {resetPwUser?.name || resetPwUser?.email}.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-5 py-1">
            <div className="flex flex-col gap-2">
              <Label className="text-xs font-medium uppercase text-muted-foreground">New Password</Label>
              <Input type="password" placeholder="Min 8 characters" value={resetPwForm.password} onChange={(e) => setResetPwForm({ ...resetPwForm, password: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") resetUserPassword() }} />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-xs font-medium uppercase text-muted-foreground">Confirm Password</Label>
              <Input type="password" placeholder="Re-enter password" value={resetPwForm.confirm} onChange={(e) => setResetPwForm({ ...resetPwForm, confirm: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") resetUserPassword() }} />
            </div>
            {resetPwForm.password && resetPwForm.confirm && resetPwForm.password !== resetPwForm.confirm && (
              <p className="text-xs text-destructive">Passwords do not match</p>
            )}
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button onClick={resetUserPassword} disabled={resetPwBusy || resetPwForm.password.length < 8 || resetPwForm.password !== resetPwForm.confirm}>
              {resetPwBusy ? <Loader2 className="size-3.5 animate-spin" /> : "Reset Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <Dialog open={!!delUser} onOpenChange={(o) => { if (!o) setDelUser(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              This action cannot be undone. <strong>{delUser?.name || delUser?.email}</strong> will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button variant="destructive" onClick={() => delUser && deleteUser(delUser)} disabled={delBusy}>
              {delBusy ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
              {delBusy ? "Deleting..." : "Delete User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
