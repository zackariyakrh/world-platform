import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await auth()
    const userId = (session?.user as any)?.id as string | undefined
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { projectId } = await params
    const project = await db.project.findUnique({ where: { id: projectId }, select: { id: true, workspaceId: true } })
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const user = await db.user.findUnique({ where: { id: userId }, select: { role: true, isSuperAdmin: true } })
    const isAdmin = user?.isSuperAdmin || user?.role === "owner" || user?.role === "admin"

    if (!isAdmin) {
      const member = await db.projectMember.findFirst({ where: { userId, projectId } })
      if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const data: Record<string, unknown> = {}
    for (const field of ["name", "description", "status", "priority", "progress"]) {
      if (field in body) data[field] = body[field] || null
    }
    if (body.startDate) data.startDate = new Date(body.startDate)
    if (body.dueDate) data.dueDate = new Date(body.dueDate)

    const updated = await db.project.update({ where: { id: projectId }, data })
    return NextResponse.json(updated)
  } catch (error) {
    console.error("Failed to update project:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await auth()
    const userId = (session?.user as any)?.id as string | undefined
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { projectId } = await params
    const project = await db.project.findUnique({ where: { id: projectId }, select: { id: true } })
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const user = await db.user.findUnique({ where: { id: userId }, select: { role: true, isSuperAdmin: true } })
    if (!user?.isSuperAdmin && user?.role !== "owner" && user?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await db.project.delete({ where: { id: projectId } })
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Failed to delete project:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
