import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

interface RouteContext {
  params: Promise<{ messageId: string }>
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { messageId } = await context.params

    const existing = await db.message.findUnique({ where: { id: messageId } })
    if (!existing) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 })
    }

    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { content } = body

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    const message = await db.message.update({
      where: { id: messageId },
      data: { content: content.trim(), isEdited: true },
      include: {
        user: {
          select: { id: true, name: true, username: true, avatar: true },
        },
        reactions: {
          include: {
            user: { select: { id: true, name: true, username: true, avatar: true } },
          },
        },
        replies: {
          select: { id: true },
        },
      },
    })

    return NextResponse.json({
      ...message,
      createdAt: message.createdAt.toISOString(),
      updatedAt: message.updatedAt.toISOString(),
    })
  } catch (error) {
    console.error("PATCH /api/messages/[messageId] error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { messageId } = await context.params

    const existing = await db.message.findUnique({ where: { id: messageId } })
    if (!existing) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 })
    }

    const user = await db.user.findUnique({ where: { id: session.user.id } })
    const isAdmin = user?.role === "admin" || user?.role === "owner" || user?.isSuperAdmin

    if (existing.userId !== session.user.id && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await db.message.update({
      where: { id: messageId },
      data: { isDeleted: true, content: "This message was deleted" },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/messages/[messageId] error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
