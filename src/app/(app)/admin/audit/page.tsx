import { db } from "@/lib/db"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ScrollText, ShieldCheck } from "lucide-react"
import { AuditLogFilters } from "@/components/admin/audit-log-filters"

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams

  const userFilter =
    typeof params.user === "string" ? params.user : undefined
  const actionFilter =
    typeof params.action === "string" ? params.action : undefined
  const page = Math.max(1, Number(params.page) || 1)
  const pageSize = 50
  const skip = (page - 1) * pageSize

  const where: { userId?: string; action?: { contains: string } } = {}
  if (userFilter) where.userId = userFilter
  if (actionFilter) where.action = { contains: actionFilter }

  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    }),
    db.auditLog.count({ where }),
  ])

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-1">
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground glow-text">
          <ShieldCheck className="size-6 text-primary drop-shadow-[0_0_8px_oklch(from_var(--primary)_l_c_h_/_0.4)]" />
          Audit Logs
        </h1>
        <p className="text-sm text-muted-foreground">
          Track system activity and user actions.
        </p>
      </div>

      <AuditLogFilters />

      <div className="text-xs text-muted-foreground">
        {total} log entr{total !== 1 ? "ies" : "y"}
      </div>

      {logs.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-16 text-center">
          <ScrollText className="size-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No audit logs found.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(log.createdAt).toLocaleString()}
                </TableCell>
                <TableCell className="text-sm">
                  {log.user?.name ?? log.user?.email ?? "System"}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{log.action}</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {log.resource ?? "—"}
                </TableCell>
                <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                  {log.details ?? "—"}
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {log.ipAddress ?? "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <span className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
          </span>
        </div>
      )}
    </div>
  )
}
