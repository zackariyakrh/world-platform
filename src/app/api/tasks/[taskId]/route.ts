import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

interface TaskRouteParams {
  params: Promise<{ taskId: string }>
}

async function isUserInProject(userId: string, projectId: string | null): Promise<boolean> {
  if (!projectId) return true
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { workspaceId: true },
  })
  if (!project) return false
  const member = await db.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId: project.workspaceId } },
  })
  return !!member
}

export async function GET(request: NextRequest, { params }: TaskRouteParams) {
  try {
    const session = await auth()
    const userId = (session?.user as any)?.id as string | undefined

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { taskId } = await params

    const task = await db.task.findUnique({
      where: { id: taskId },
      include: {
        assignee: {
          select: { id: true, name: true, avatar: true, email: true },
        },
        creator: {
          select: { id: true, name: true, avatar: true },
        },
        comments: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        subtasks: true,
        dependencies: {
          include: {
            dependsOn: { select: { id: true, title: true } },
          },
        },
        dependents: {
          include: {
            task: { select: { id: true, title: true } },
          },
        },
        attachments: true,
      },
    })

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    if (!(await isUserInProject(userId, task.projectId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json(task)
  } catch (error) {
    console.error("Failed to fetch task:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: TaskRouteParams) {
  try {
    const session = await auth()
    const userId = (session?.user as any)?.id as string | undefined

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { taskId } = await params
    const body = await request.json()

    const existingTask = await db.task.findUnique({
      where: { id: taskId },
      select: { id: true, projectId: true, status: true },
    })

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    if (!(await isUserInProject(userId, existingTask.projectId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const updateData: any = {}
    const allowedFields = [
      "title",
      "description",
      "status",
      "priority",
      "dueDate",
      "startDate",
      "estimatedHours",
      "assigneeId",
      "order",
      "parentId",
    ]

    for (const field of allowedFields) {
      if (field in body) {
        if (field === "dueDate" || field === "startDate") {
          updateData[field] = body[field] ? new Date(body[field]) : null
        } else {
          updateData[field] = body[field]
        }
      }
    }

    if (updateData.status === "done" && existingTask.status !== "done") {
      updateData.completedAt = new Date()
    } else if (updateData.status && updateData.status !== "done") {
      updateData.completedAt = null
    }

    const task = await db.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        assignee: {
          select: { id: true, name: true, avatar: true },
        },
        creator: {
          select: { id: true, name: true },
        },
        comments: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        subtasks: true,
      },
    })

    if (existingTask.projectId) {
      const totalTasks = await db.task.count({
        where: { projectId: existingTask.projectId },
      })
      const doneTasks = await db.task.count({
        where: { projectId: existingTask.projectId, status: "done" },
      })
      const progress =
        totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0
      await db.project.update({
        where: { id: existingTask.projectId },
        data: { progress },
      })
    }

    return NextResponse.json(task)
  } catch (error) {
    console.error("Failed to update task:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: TaskRouteParams) {
  try {
    const session = await auth()
    const userId = (session?.user as any)?.id as string | undefined

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { taskId } = await params

    const existingTask = await db.task.findUnique({
      where: { id: taskId },
      select: { id: true, projectId: true },
    })

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    if (!(await isUserInProject(userId, existingTask.projectId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await db.task.delete({ where: { id: taskId } })

    if (existingTask.projectId) {
      const totalTasks = await db.task.count({
        where: { projectId: existingTask.projectId },
      })
      const doneTasks = await db.task.count({
        where: { projectId: existingTask.projectId, status: "done" },
      })
      const progress =
        totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0
      await db.project.update({
        where: { id: existingTask.projectId },
        data: { progress },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete task:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
