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
    const filter = searchParams.get("filter") // "mine", "followed", or null (all)
    const channelId = searchParams.get("channelId")

    const userWorkspaces = await db.workspaceMember.findMany({
      where: { userId },
      select: { workspaceId: true },
    })
    const workspaceIds = userWorkspaces.map((w) => w.workspaceId)

    const workspaceChannelIds = (
      await db.channel.findMany({
        where: { workspaceId: { in: workspaceIds } },
        select: { id: true },
      })
    ).map((c) => c.id)

    let where: any = {
      channelId: { in: workspaceChannelIds },
    }

    if (channelId) {
      where.channelId = channelId
    }

    if (filter === "mine") {
      where.creatorId = userId
    } else if (filter === "followed") {
      where.followers = { some: { userId } }
    }

    const threads = await db.thread.findMany({
      where,
      include: {
        creator: {
          select: { id: true, name: true, avatar: true, email: true },
        },
        channel: {
          select: { id: true, name: true },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            content: true,
            createdAt: true,
            user: { select: { id: true, name: true, avatar: true } },
          },
        },
        followers: {
          select: { userId: true },
        },
      },
      orderBy: { lastReplyAt: "desc" },
    })

    const result = threads.map((t) => ({
      ...t,
      isFollowing: t.followers.some((f) => f.userId === userId),
      followerCount: t.followers.length,
      lastMessage: t.messages[0] ?? null,
      messages: undefined,
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error("Failed to fetch threads:", error)
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
    const { title, channelId } = body

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    if (!channelId || typeof channelId !== "string") {
      return NextResponse.json({ error: "channelId is required" }, { status: 400 })
    }

    const channel = await db.channel.findUnique({
      where: { id: channelId },
      select: { id: true, workspaceId: true },
    })

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 })
    }

    const member = await db.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId: channel.workspaceId } },
    })

    if (!member) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 })
    }

    const thread = await db.thread.create({
      data: {
        title: title.trim(),
        channelId,
        creatorId: userId,
        replyCount: 0,
      },
      include: {
        creator: {
          select: { id: true, name: true, avatar: true },
        },
        channel: {
          select: { id: true, name: true },
        },
      },
    })

    await db.auditLog.create({
      data: {
        userId,
        action: "THREAD_CREATED",
        resource: "thread",
        resourceId: thread.id,
        details: JSON.stringify({ title: thread.title, channelId }),
        ipAddress: request.headers.get("x-forwarded-for") ?? "unknown",
      },
    })

    return NextResponse.json(thread, { status: 201 })
  } catch (error) {
    console.error("Failed to create thread:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
