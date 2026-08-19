export type Role = "owner" | "admin" | "manager" | "moderator" | "member" | "guest"

export type Permission =
  | "organization:manage"
  | "organization:read"
  | "member:invite"
  | "member:remove"
  | "member:read"
  | "member:role:update"
  | "project:create"
  | "project:read"
  | "project:update"
  | "project:delete"
  | "project:archive"
  | "task:create"
  | "task:read"
  | "task:update"
  | "task:delete"
  | "task:assign"
  | "task:comment"
  | "channel:create"
  | "channel:read"
  | "channel:update"
  | "channel:delete"
  | "message:create"
  | "message:read"
  | "message:update"
  | "message:delete"
  | "message:moderate"
  | "file:upload"
  | "file:read"
  | "file:delete"
  | "audit:read"
  | "settings:read"
  | "settings:update"

const ROLE_HIERARCHY: Role[] = [
  "owner",
  "admin",
  "manager",
  "moderator",
  "member",
  "guest",
]

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  owner: [
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
  ],
  admin: [
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
  ],
  manager: [
    "organization:read",
    "member:invite",
    "member:read",
    "project:create",
    "project:read",
    "project:update",
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
    "message:create",
    "message:read",
    "message:update",
    "message:moderate",
    "file:upload",
    "file:read",
    "settings:read",
  ],
  moderator: [
    "organization:read",
    "member:read",
    "project:read",
    "task:create",
    "task:read",
    "task:update",
    "task:comment",
    "channel:create",
    "channel:read",
    "channel:update",
    "message:create",
    "message:read",
    "message:update",
    "message:moderate",
    "file:upload",
    "file:read",
  ],
  member: [
    "organization:read",
    "member:read",
    "project:read",
    "task:create",
    "task:read",
    "task:update",
    "task:comment",
    "channel:read",
    "message:create",
    "message:read",
    "message:update",
    "file:upload",
    "file:read",
  ],
  guest: [
    "organization:read",
    "project:read",
    "task:read",
    "channel:read",
    "message:read",
    "file:read",
  ],
}

function getRoleIndex(role: Role): number {
  const idx = ROLE_HIERARCHY.indexOf(role)
  return idx === -1 ? ROLE_HIERARCHY.length : idx
}

export function getPermissionsForRole(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? []
}

export function hasPermission(
  user: { role?: string | null; isSuperAdmin?: boolean },
  permission: Permission
): boolean {
  if (user.isSuperAdmin) return true

  const role = user.role as Role | undefined
  if (!role) return false

  const permissions = getPermissionsForRole(role)
  return permissions.includes(permission)
}

export function requirePermission(
  user: { role?: string | null; isSuperAdmin?: boolean; id?: string },
  permission: Permission
): void {
  if (!hasPermission(user, permission)) {
    throw new Error(
      `Permission denied: ${permission} requires a higher role than ${user.role ?? "none"}`
    )
  }
}

export function canManageRole(
  assignerRole: Role,
  targetRole: Role
): boolean {
  return getRoleIndex(assignerRole) < getRoleIndex(targetRole)
}
