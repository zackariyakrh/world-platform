import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { getBrandingSettings, setSetting } from "@/lib/settings"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Calendar,
  CheckSquare,
  AlertCircle,
  MessageSquare,
  Plus,
  Sparkles,
  Clock,
  ArrowRight,
  ListTodo,
  Video,
  FileText,
  LayoutDashboard,
  Paintbrush,
} from "lucide-react"
import Link from "next/link"
import { AppNameEditor } from "./app-name-editor"

export default async function DashboardPage() {
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) return null

  const [user, currentUser] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, role: true, isSuperAdmin: true },
    }),
    db.user.findUnique({
      where: { id: userId },
      select: { role: true, isSuperAdmin: true },
    }),
  ])

  const isAdmin = currentUser?.isSuperAdmin || currentUser?.role === "owner" || currentUser?.role === "admin"
  const branding = isAdmin ? await getBrandingSettings() : null

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayEnd = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1
  )

  const [upcomingMeetings, todayTasks, overdueTasks, recentNotifications] =
    await Promise.all([
      db.calendarEvent.findMany({
        where: {
          startTime: { gte: now },
          participants: { some: { userId } },
        },
        select: {
          id: true,
          title: true,
          startTime: true,
          endTime: true,
          type: true,
          color: true,
        },
        orderBy: { startTime: "asc" },
        take: 5,
      }),
      db.task.findMany({
        where: {
          assigneeId: userId,
          status: { notIn: ["done"] },
          OR: [
            {
              dueDate: {
                gte: todayStart,
                lt: todayEnd,
              },
            },
            { dueDate: null, status: "in_progress" },
          ],
        },
        select: {
          id: true,
          title: true,
          priority: true,
          dueDate: true,
          project: { select: { name: true } },
        },
        orderBy: [
          { priority: "desc" },
          { dueDate: "asc" },
        ],
        take: 6,
      }),
      db.task.count({
        where: {
          assigneeId: userId,
          status: { notIn: ["done"] },
          dueDate: { lt: now },
        },
      }),
      db.notification.findMany({
        where: { userId },
        select: {
          id: true,
          type: true,
          title: true,
          content: true,
          isRead: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
    ])

  const firstName = user?.name?.split(" ")[0] ?? "there"

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-1">
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground glow-text">
          <LayoutDashboard className="size-6 text-primary drop-shadow-[0_0_8px_oklch(from_var(--primary)_l_c_h_/_0.4)]" />
          Welcome back, {firstName}
        </h1>
        <p className="text-sm text-muted-foreground">
          Here&apos;s what&apos;s happening across your workspace today.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <QuickStatCard
          icon={CheckSquare}
          label="Today's Tasks"
          value={todayTasks.length}
          glowColor="oklch(0.60 0.20 250)"
        />
        <QuickStatCard
          icon={AlertCircle}
          label="Overdue"
          value={overdueTasks}
          glowColor="oklch(0.55 0.12 80)"
        />
        <QuickStatCard
          icon={Calendar}
          label="Upcoming Events"
          value={upcomingMeetings.length}
          glowColor="oklch(0.65 0.20 155)"
        />
        <QuickStatCard
          icon={MessageSquare}
          label="Unread"
          value={recentNotifications.filter((n) => !n.isRead).length}
          glowColor="oklch(0.50 0.12 80)"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="glow-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListTodo className="size-4" />
              Today&apos;s Tasks
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto"
              render={<Link href="/projects" />}
              nativeButton={false}
            >
              View all
              <ArrowRight className="size-3" />
            </Button>
          </CardHeader>
          <CardContent>
            {todayTasks.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <CheckSquare className="size-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  No tasks for today. You&apos;re all caught up!
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {todayTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors hover:bg-muted/50"
                  >
                    <div
                      className={`size-2 shrink-0 rounded-full shadow-[0_0_6px_currentColor] ${
                        task.priority === "urgent"
                          ? "bg-red-500"
                          : task.priority === "high"
                            ? "bg-orange-500"
                            : task.priority === "medium"
                              ? "bg-yellow-500"
                              : "bg-blue-500"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {task.title}
                      </p>
                      {task.project && (
                        <p className="truncate text-xs text-muted-foreground">
                          {task.project.name}
                        </p>
                      )}
                    </div>
                    {task.dueDate && (
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {new Date(task.dueDate).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="size-4" />
              Upcoming
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto"
              render={<Link href="/calendar" />}
              nativeButton={false}
            >
              View all
              <ArrowRight className="size-3" />
            </Button>
          </CardHeader>
          <CardContent>
            {upcomingMeetings.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <Calendar className="size-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  No upcoming events
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {upcomingMeetings.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 rounded-lg border px-3 py-2.5 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex flex-col items-center pt-0.5">
                      <span className="text-xs font-medium text-muted-foreground">
                        {new Date(event.startTime).toLocaleDateString([], {
                          weekday: "short",
                        })}
                      </span>
                      <span className="text-sm font-semibold text-foreground">
                        {new Date(event.startTime).getDate()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {event.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(event.startTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {event.endTime &&
                          ` – ${new Date(event.endTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="glow-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="size-4" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentNotifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <Bell className="size-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  No recent notifications
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {recentNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/50 ${
                      !notification.isRead ? "bg-muted/30" : ""
                    }`}
                  >
                    <div
                      className={`mt-1 size-2 shrink-0 rounded-full ${
                        notification.isRead
                          ? "bg-muted-foreground/30"
                          : "bg-primary shadow-[0_0_6px_oklch(from_var(--primary)_l_c_h_/_0.5)]"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {notification.title}
                      </p>
                      {notification.content && (
                        <p className="truncate text-xs text-muted-foreground">
                          {notification.content}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatRelativeTime(new Date(notification.createdAt))}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="size-4" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              {isAdmin && branding && (
                <AppNameEditor currentName={branding.appName} />
              )}
              {quickActions.map((action) => (
                <Button
                  key={action.label}
                  variant="outline"
                  className="w-full justify-start gap-3"
                  render={<Link href={action.href} />}
                  nativeButton={false}
                >
                  <action.icon className="size-4 text-muted-foreground" />
                  {action.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function QuickStatCard({
  icon: Icon,
  label,
  value,
  glowColor,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  glowColor: string
}) {
  return (
    <Card className="glow-card group overflow-hidden">
      <CardContent className="flex items-center gap-4">
        <div
          className="relative flex size-10 shrink-0 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110"
          style={{
            background: `oklch(from ${glowColor} l c h / 0.1)`,
            boxShadow: `0 0 0 1px oklch(from ${glowColor} l c h / 0.15)`,
          }}
        >
          <div
            className="absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{
              boxShadow: `0 0 20px oklch(from ${glowColor} l c h / 0.3), inset 0 0 20px oklch(from ${glowColor} l c h / 0.1)`,
            }}
          />
          <span className="relative size-5" style={{ color: glowColor }}>
            <Icon className="size-5" />
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function Bell(props: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  )
}

const quickActions = [
  { icon: Plus, label: "Create task", href: "/projects" },
  { icon: MessageSquare, label: "New message", href: "/dms" },
  { icon: Video, label: "Start meeting", href: "/meetings" },
  { icon: Calendar, label: "Schedule event", href: "/calendar" },
  { icon: FileText, label: "Write a note", href: "/notes" },
  { icon: Sparkles, label: "AI Assistant", href: "/ai" },
]

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return "just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}
