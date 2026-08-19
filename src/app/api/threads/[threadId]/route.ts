import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

interface RouteParams {
  params: Promise<{ threadId: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    const userId = (session?.user as any)?.id as string | undefined
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { threadId } = await params

    const thread = await db.thread.findUnique({
      where: { id: threadId },
      include: {
        creator: {
          select: { id: true, name: true, avatar: true, email: true },
        },
        channel: {
          select: { id: true, name: true },
        },
        messages: {
          orderBy: { createdAt: "asc" },
          include: {
            user: { select: { id: true, name: true, avatar: true } },
            reactions: true,
          },
        },
        followers: {
          select: { userId: true },
        },
      },
    })

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 })
    }

    return NextResponse.json({
      ...thread,
      isFollowing: thread.followers.some((f) => f.userId === userId),
      followerCount: thread.followers.length,
    })
  } catch (error) {
    console.error("Failed to fetch thread:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    const userId = (session?.user as any)?.id as string | undefined
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { threadId } = await params
    const body = await request.json()

    const thread = await db.thread.findUnique({
      where: { id: threadId },
      select: { id: true, creatorId: true },
    })

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 })
    }

    if (thread.creatorId !== userId) {
      return NextResponse.json({ error: "Only the thread creator can modify it" }, { status: 403 })
    }

    const updateData: any = {}
    if ("title" in body && typeof body.title === "string" && body.title.trim()) {
      updateData.title = body.title.trim()
    }
    if ("isClosed" in body && typeof body.isClosed === "boolean") {
      updateData.isClosed = body.isClosed
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
    }

    const updated = await db.thread.update({
      where: { id: threadId },
      data: updateData,
      include: {
        creator: {
          select: { id: true, name: true, avatar: true },
        },
        channel: {
          select: { id: true, name: true },
        },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Failed to update thread:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    const userId = (session?.user as any)?.id as string | undefined
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { threadId } = await params

    const thread = await db.thread.findUnique({
      where: { id: threadId },
      select: { id: true, creatorId: true },
    })

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 })
    }

    if (thread.creatorId !== userId) {
      return NextResponse.json({ error: "Only the thread creator can delete it" }, { status: 403 })
    }

    await db.thread.delete({ where: { id: threadId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete thread:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
