import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const session = await auth()
    const userId = (session?.user as any)?.id as string | undefined
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { workspaceId } = await params

    const user = await db.user.findUnique({ where: { id: userId }, select: { role: true, isSuperAdmin: true } })
    const isAdmin = user?.isSuperAdmin || user?.role === "owner" || user?.role === "admin"

    if (!isAdmin) {
      const membership = await db.workspaceMember.findFirst({ where: { userId, workspaceId }, select: { role: true } })
      if (!membership || membership.role !== "owner") {
        return NextResponse.json({ error: "Not authorized" }, { status: 403 })
      }
    }

    const body = await request.json()
    const data: Record<string, unknown> = {}
    for (const field of ["name", "description", "isPublic"]) {
      if (field in body) data[field] = field === "name" ? (body[field] as string).trim() : body[field]
    }

    const updated = await db.workspace.update({ where: { id: workspaceId }, data })
    return NextResponse.json(updated)
  } catch (error) {
    console.error("Failed to update workspace:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const session = await auth()
    const userId = (session?.user as any)?.id as string | undefined
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { workspaceId } = await params

    const user = await db.user.findUnique({ where: { id: userId }, select: { role: true, isSuperAdmin: true } })
    const isAdmin = user?.isSuperAdmin || user?.role === "owner" || user?.role === "admin"

    if (!isAdmin) {
      const membership = await db.workspaceMember.findFirst({ where: { userId, workspaceId } })
      if (!membership || membership.role !== "owner") {
        return NextResponse.json({ error: "Only the owner can delete this workspace" }, { status: 403 })
      }
    }

    await db.workspace.delete({ where: { id: workspaceId } })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Failed to delete workspace:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
