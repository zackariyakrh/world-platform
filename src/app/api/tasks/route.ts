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
    const projectId = searchParams.get("projectId")
    const status = searchParams.get("status")
    const assigneeId = searchParams.get("assigneeId")

    const where: any = {}
    if (projectId) where.projectId = projectId
    if (status) where.status = status
    if (assigneeId) where.assigneeId = assigneeId

    if (!projectId) {
      const userWorkspace = await db.workspaceMember.findFirst({
        where: { userId },
        select: { workspaceId: true },
      })

      if (userWorkspace) {
        const workspaceProjects = await db.project.findMany({
          where: { workspaceId: userWorkspace.workspaceId },
          select: { id: true },
        })
        where.projectId = { in: workspaceProjects.map((p) => p.id) }
      }
    }

    const tasks = await db.task.findMany({
      where,
      include: {
        assignee: {
          select: { id: true, name: true, avatar: true },
        },
        creator: {
          select: { id: true, name: true },
        },
        subtasks: {
          select: { id: true, title: true, status: true },
        },
        _count: {
          select: { comments: true, subtasks: true },
        },
      },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error("Failed to fetch tasks:", error)
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
    const {
      title,
      description,
      status,
      priority,
      dueDate,
      startDate,
      estimatedHours,
      projectId,
      assigneeId,
      parentId,
    } = body

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        { error: "Task title is required" },
        { status: 400 }
      )
    }

    const maxOrder = projectId
      ? await db.task.findFirst({
          where: { projectId, status: status || "todo" },
          orderBy: { order: "desc" },
          select: { order: true },
        })
      : null

    const task = await db.task.create({
      data: {
        title: title.trim(),
        description: description || null,
        status: status || "todo",
        priority: priority || "medium",
        dueDate: dueDate ? new Date(dueDate) : null,
        startDate: startDate ? new Date(startDate) : null,
        estimatedHours: estimatedHours || null,
        projectId: projectId || null,
        assigneeId: assigneeId || null,
        creatorId: userId,
        parentId: parentId || null,
        order: (maxOrder?.order ?? 0) + 1,
      },
      include: {
        assignee: {
          select: { id: true, name: true, avatar: true },
        },
        creator: {
          select: { id: true, name: true },
        },
      },
    })

    if (projectId) {
      const totalTasks = await db.task.count({ where: { projectId } })
      const doneTasks = await db.task.count({
        where: { projectId, status: "done" },
      })
      const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0
      await db.project.update({ where: { id: projectId }, data: { progress } })
    }

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error("Failed to create task:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
