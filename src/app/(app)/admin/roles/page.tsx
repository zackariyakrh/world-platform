import { db } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Shield, ShieldCheck, Check, X } from "lucide-react"
import { getPermissionsForRole, type Role, type Permission } from "@/lib/permissions"

const ALL_ROLES: Role[] = ["owner", "admin", "manager", "moderator", "member", "guest"]

const ROLE_DESCRIPTIONS: Record<Role, string> = {
  owner: "Full platform control. Can manage all settings, users, and billing.",
  admin: "Administrative access. Can manage users, settings, and all resources.",
  manager: "Team management. Can create projects, manage members, and moderate.",
  moderator: "Content moderation. Can manage messages and basic channel settings.",
  member: "Standard member. Can participate in channels, tasks, and projects.",
  guest: "Read-only access. Can view shared resources but cannot create or edit.",
}

export default async function AdminRolesPage() {
  const userCounts = await db.user.groupBy({
    by: ["role"],
    _count: { id: true },
  })

  const countMap = Object.fromEntries(
    userCounts.map((uc) => [uc.role, uc._count.id])
  )

  const allPermissions: Permission[] = [
    "organization:manage",
    "organization:read",
    "member:invite",
    "member:remove",
    "member:read",
    "member:role:update",
    "project:create",
    "project:read",
    "project:update",
    "project:delete",
    "project:archive",
    "task:create",
    "task:read",
    "task:update",
    "task:delete",
    "task:assign",
    "task:comment",
    "channel:create",
    "channel:read",
    "channel:update",
    "channel:delete",
    "message:create",
    "message:read",
    "message:update",
    "message:delete",
    "message:moderate",
    "file:upload",
    "file:read",
    "file:delete",
    "audit:read",
    "settings:read",
    "settings:update",
  ]

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-1">
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground glow-text">
          <ShieldCheck className="size-6 text-primary drop-shadow-[0_0_8px_oklch(from_var(--primary)_l_c_h_/_0.4)]" />
          Roles &amp; Permissions
        </h1>
        <p className="text-sm text-muted-foreground">
          View role definitions and the permissions matrix.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ALL_ROLES.map((role) => (
          <Card key={role}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 capitalize">
                  <Shield className="size-4" />
                  {role}
                </CardTitle>
                <Badge variant="outline">
                  {countMap[role] ?? 0} user{(countMap[role] ?? 0) !== 1 ? "s" : ""}
                </Badge>
              </div>
              <CardDescription>{ROLE_DESCRIPTIONS[role]}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {getPermissionsForRole(role).length} permissions
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Permissions Matrix</CardTitle>
          <CardDescription>
            Complete mapping of roles to their granted permissions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">Permission</TableHead>
                {ALL_ROLES.map((role) => (
                  <TableHead key={role} className="w-20 text-center capitalize">
                    {role}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {allPermissions.map((perm) => (
                <TableRow key={perm}>
                  <TableCell className="font-mono text-xs">{perm}</TableCell>
                  {ALL_ROLES.map((role) => {
                    const has = getPermissionsForRole(role).includes(perm)
                    return (
                      <TableCell key={role} className="text-center">
                        {has ? (
                          <Check className="mx-auto size-3.5 text-green-500" />
                        ) : (
                          <X className="mx-auto size-3.5 text-muted-foreground/30" />
                        )}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
