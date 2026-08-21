import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const session = await auth()
    const userId = (session?.user as any)?.id as string | undefined

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { groupId } = await params

    const group = await db.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true, role: true } },
          },
        },
        invitations: {
          where: { status: "pending" },
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true } },
          },
        },
        creator: { select: { id: true, name: true, avatar: true } },
        _count: { select: { members: true } },
      },
    })

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 })
    }

    return NextResponse.json(group)
  } catch (error) {
    console.error("Failed to fetch group:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const session = await auth()
    const userId = (session?.user as any)?.id as string | undefined
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { groupId } = await params

    const user = await db.user.findUnique({ where: { id: userId }, select: { role: true, isSuperAdmin: true } })
    const isAdmin = user?.isSuperAdmin || user?.role === "owner" || user?.role === "admin"

    if (!isAdmin) {
      const group = await db.group.findUnique({ where: { id: groupId }, select: { creatorId: true } })
      if (!group || group.creatorId !== userId) {
        return NextResponse.json({ error: "Not authorized" }, { status: 403 })
      }
    }

    const body = await request.json()
    const data: Record<string, unknown> = {}
    for (const field of ["name", "description", "isPrivate"]) {
      if (field in body) data[field] = body[field] || null
    }

    const updated = await db.group.update({ where: { id: groupId }, data })
    return NextResponse.json(updated)
  } catch (error) {
    console.error("Failed to update group:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const session = await auth()
    const userId = (session?.user as any)?.id as string | undefined

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { groupId } = await params

    const user = await db.user.findUnique({ where: { id: userId }, select: { role: true, isSuperAdmin: true } })
    const isAdmin = user?.isSuperAdmin || user?.role === "owner" || user?.role === "admin"

    if (!isAdmin) {
      const group = await db.group.findUnique({ where: { id: groupId }, select: { creatorId: true } })
      if (!group || group.creatorId !== userId) {
        return NextResponse.json({ error: "Not authorized" }, { status: 403 })
      }
    }

    await db.group.delete({ where: { id: groupId } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Failed to delete group:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
