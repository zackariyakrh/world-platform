import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), user: null }
  }
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, isSuperAdmin: true },
  })
  if (!user || (user.role !== "owner" && user.role !== "admin" && !user.isSuperAdmin)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }), user: null }
  }
  return { error: null, user }
}

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const userFilter = searchParams.get("user")
  const actionFilter = searchParams.get("action")
  const page = Math.max(1, Number(searchParams.get("page")) || 1)
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

  return NextResponse.json({
    logs,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  })
}
