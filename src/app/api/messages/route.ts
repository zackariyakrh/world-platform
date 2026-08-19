import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const channelId = searchParams.get("channelId")
    const threadId = searchParams.get("threadId")
    const limit = parseInt(searchParams.get("limit") || "50")
    const before = searchParams.get("before")

    if (!channelId && !threadId) {
      return NextResponse.json({ error: "channelId or threadId required" }, { status: 400 })
    }

    const where: Record<string, unknown> = {}

    if (threadId) {
      where.threadId = threadId
    } else if (channelId) {
      where.channelId = channelId
      where.parentId = null
    }

    if (before) {
      where.createdAt = { lt: new Date(before) }
    }

    const messages = await db.message.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 100),
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

    return NextResponse.json({ messages: messages.reverse() })
  } catch (error) {
    console.error("GET /api/messages error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { channelId, content, replyToId } = body

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    if (!channelId) {
      return NextResponse.json({ error: "channelId is required" }, { status: 400 })
    }

    const channel = await db.channel.findUnique({ where: { id: channelId } })
    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 })
    }

    const message = await db.message.create({
      data: {
        content: content.trim(),
        channelId,
        userId: session.user.id,
        replyToId: replyToId || null,
      },
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
    }, { status: 201 })
  } catch (error) {
    console.error("POST /api/messages error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
