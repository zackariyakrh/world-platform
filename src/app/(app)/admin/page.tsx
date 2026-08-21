import { db } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Users,
  UserCheck,
  Hash,
  Briefcase,
  ListTodo,
  HardDrive,
  Activity,
  Server,
  Shield,
} from "lucide-react"

export default async function AdminOverviewPage() {
  const [
    totalUsers,
    activeUsers,
    totalChannels,
    totalProjects,
    totalTasks,
    recentAuditLogs,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { isActive: true } }),
    db.channel.count(),
    db.project.count(),
    db.task.count(),
    db.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    }),
  ])

  const stats = [
    {
      label: "Total Users",
      value: totalUsers,
      icon: Users,
      glowColor: "oklch(0.60 0.20 250)",
    },
    {
      label: "Active Users",
      value: activeUsers,
      icon: UserCheck,
      glowColor: "oklch(0.65 0.20 155)",
    },
    {
      label: "Channels",
      value: totalChannels,
      icon: Hash,
      glowColor: "oklch(0.50 0.12 80)",
    },
    {
      label: "Projects",
      value: totalProjects,
      icon: Briefcase,
      glowColor: "oklch(0.70 0.18 55)",
    },
    {
      label: "Tasks",
      value: totalTasks,
      icon: ListTodo,
      glowColor: "oklch(0.65 0.20 185)",
    },
    {
      label: "Storage Used",
      value: "N/A",
      icon: HardDrive,
      glowColor: "oklch(0.60 0.20 330)",
    },
  ]

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-1">
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground glow-text">
          <Shield className="size-6 text-primary drop-shadow-[0_0_8px_oklch(from_var(--primary)_l_c_h_/_0.4)]" />
          Admin Overview
        </h1>
        <p className="text-sm text-muted-foreground">
          Platform statistics and system health at a glance.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label} className="glow-card group overflow-hidden">
            <CardContent className="flex items-center gap-4">
              <div
                className="relative flex size-10 shrink-0 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110"
                style={{
                  background: `oklch(from ${stat.glowColor} l c h / 0.1)`,
                  boxShadow: `0 0 0 1px oklch(from ${stat.glowColor} l c h / 0.15)`,
                }}
              >
                <stat.icon className="size-5" style={{ color: stat.glowColor }} />
              </div>
              <div className="flex flex-col gap-0.5">
                <p className="text-2xl font-bold text-foreground">
                  {stat.value}
                </p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="glow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="size-4" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentAuditLogs.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No recent activity.
              </p>
            ) : (
              <div className="flex flex-col gap-1">
                {recentAuditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-muted/50"
                  >
                    <div className="mt-1 size-2 shrink-0 rounded-full bg-primary shadow-[0_0_6px_oklch(from_var(--primary)_l_c_h_/_0.5)]" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {log.user?.name ?? log.user?.email ?? "System"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {log.action}
                        {log.resource ? ` on ${log.resource}` : ""}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {new Date(log.createdAt).toLocaleDateString()}
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
              <Server className="size-4" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                <span className="text-sm text-foreground">Database</span>
                <span className="text-xs font-medium text-green-600 dark:text-green-400">
                  Operational
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                <span className="text-sm text-foreground">Auth Service</span>
                <span className="text-xs font-medium text-green-600 dark:text-green-400">
                  Operational
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                <span className="text-sm text-foreground">File Storage</span>
                <span className="text-xs font-medium text-green-600 dark:text-green-400">
                  Operational
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                <span className="text-sm text-foreground">AI Services</span>
                <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400">
                  Not Configured
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Growth</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-40 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
            User growth chart will be displayed here.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
