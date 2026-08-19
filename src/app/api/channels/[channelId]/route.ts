import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const session = await auth()
    const userId = (session?.user as any)?.id as string | undefined

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { channelId } = await params

    const channel = await db.channel.findUnique({
      where: { id: channelId },
      include: {
        creator: { select: { id: true, name: true, avatar: true } },
        _count: { select: { members: true, messages: true } },
      },
    })

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 })
    }

    return NextResponse.json(channel)
  } catch (error) {
    console.error("Failed to fetch channel:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const session = await auth()
    const userId = (session?.user as any)?.id as string | undefined

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { channelId } = await params

    const channel = await db.channel.findUnique({
      where: { id: channelId },
      select: { id: true, workspaceId: true, creatorId: true },
    })

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 })
    }

    const globalUser = await db.user.findUnique({
      where: { id: userId },
      select: { role: true, isSuperAdmin: true },
    })

    const isPlatformAdmin =
      globalUser?.isSuperAdmin ||
      globalUser?.role === "owner" ||
      globalUser?.role === "admin"

    const workspaceMember = await db.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId: channel.workspaceId,
        },
      },
      select: { role: true },
    })

    const isWorkspaceAdmin =
      workspaceMember?.role === "owner" || workspaceMember?.role === "admin"

    const channelMember = await db.channelMember.findUnique({
      where: {
        userId_channelId: {
          userId,
          channelId,
        },
      },
      select: { role: true },
    })

    const isChannelAdmin = channelMember?.role === "admin"

    if (!isPlatformAdmin && !isWorkspaceAdmin && !isChannelAdmin) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, description, topic, isPrivate } = body

    const data: Record<string, unknown> = {}

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return NextResponse.json(
          { error: "Channel name must be a non-empty string" },
          { status: 400 }
        )
      }
      data.name = name.trim().toLowerCase().replace(/\s+/g, "-")
    }

    if (description !== undefined) {
      data.description = description || null
    }

    if (topic !== undefined) {
      data.topic = topic || null
    }

    if (isPrivate !== undefined) {
      data.isPrivate = Boolean(isPrivate)
    }

    const updated = await db.channel.update({
      where: { id: channelId },
      data,
      include: {
        creator: { select: { id: true, name: true, avatar: true } },
        _count: { select: { members: true, messages: true } },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Failed to update channel:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const session = await auth()
    const userId = (session?.user as any)?.id as string | undefined

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { channelId } = await params

    const channel = await db.channel.findUnique({
      where: { id: channelId },
      select: { id: true, workspaceId: true, creatorId: true },
    })

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 })
    }

    const globalUser = await db.user.findUnique({
      where: { id: userId },
      select: { role: true, isSuperAdmin: true },
    })

    const isPlatformAdmin =
      globalUser?.isSuperAdmin ||
      globalUser?.role === "owner" ||
      globalUser?.role === "admin"

    const workspaceMember = await db.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId: channel.workspaceId,
        },
      },
      select: { role: true },
    })

    const isWorkspaceAdmin =
      workspaceMember?.role === "owner" || workspaceMember?.role === "admin"

    const isCreator = channel.creatorId === userId

    if (!isPlatformAdmin && !isWorkspaceAdmin && !isCreator) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      )
    }

    await db.channel.delete({
      where: { id: channelId },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Failed to delete channel:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
