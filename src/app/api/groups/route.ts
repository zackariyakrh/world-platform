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

    const userWorkspace = await db.workspaceMember.findFirst({
      where: { userId },
      select: { workspaceId: true },
    })

    if (!userWorkspace) {
      return NextResponse.json([])
    }

    const groups = await db.group.findMany({
      where: {
        workspaceId: userWorkspace.workspaceId,
        OR: [
          { isPrivate: false },
          { members: { some: { userId } } },
          { creatorId: userId },
        ],
      },
      include: {
        _count: { select: { members: true } },
        creator: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(groups)
  } catch (error) {
    console.error("Failed to fetch groups:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const userId = (session?.user as any)?.id as string | undefined

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await db.user.findUnique({ where: { id: userId }, select: { role: true } })
    if (user?.role !== "owner" && user?.role !== "admin") {
      return NextResponse.json({ error: "Only admins can create groups" }, { status: 403 })
    }

    const userWorkspace = await db.workspaceMember.findFirst({
      where: { userId },
      select: { workspaceId: true },
    })

    if (!userWorkspace) {
      return NextResponse.json({ error: "No workspace found" }, { status: 400 })
    }

    const body = await request.json()
    const { name, description, isPrivate } = body

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Group name is required" }, { status: 400 })
    }

    const group = await db.group.create({
      data: {
        name: name.trim(),
        description: description || null,
        isPrivate: isPrivate || false,
        creatorId: userId,
        workspaceId: userWorkspace.workspaceId,
        members: {
          create: {
            userId,
            role: "admin",
          },
        },
      },
      include: {
        _count: { select: { members: true } },
        creator: { select: { id: true, name: true, avatar: true } },
      },
    })

    return NextResponse.json(group, { status: 201 })
  } catch (error) {
    console.error("Failed to create group:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
