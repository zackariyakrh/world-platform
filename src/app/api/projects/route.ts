import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const userId = (session?.user as any)?.id as string | undefined

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get("workspaceId")
    const status = searchParams.get("status")

    const userWorkspace = await db.workspaceMember.findFirst({
      where: { userId },
      select: { workspaceId: true },
    })

    const targetWorkspaceId = workspaceId || userWorkspace?.workspaceId

    if (!targetWorkspaceId) {
      return NextResponse.json({ error: "No workspace found" }, { status: 400 })
    }

    const where: any = { workspaceId: targetWorkspaceId }
    if (status && status !== "all") {
      where.status = status
    }

    const projects = await db.project.findMany({
      where,
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
        },
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    })

    return NextResponse.json(projects)
  } catch (error) {
    console.error("Failed to fetch projects:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const userId = (session?.user as any)?.id as string | undefined

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, status, priority, startDate, dueDate, workspaceId } = body

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      )
    }

    const userWorkspace = await db.workspaceMember.findFirst({
      where: { userId },
      select: { workspaceId: true },
    })

    const targetWorkspaceId = workspaceId || userWorkspace?.workspaceId

    if (!targetWorkspaceId) {
      return NextResponse.json({ error: "No workspace found" }, { status: 400 })
    }

    const project = await db.project.create({
      data: {
        name: name.trim(),
        description: description || null,
        status: status || "active",
        priority: priority || "medium",
        startDate: startDate ? new Date(startDate) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        workspaceId: targetWorkspaceId,
        ownerId: userId,
        members: {
          create: {
            userId,
            role: "lead",
          },
        },
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
        },
        tasks: true,
      },
    })

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error("Failed to create project:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
