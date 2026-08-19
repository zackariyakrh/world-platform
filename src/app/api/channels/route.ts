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

    let targetWorkspaceId: string | null = workspaceId

    if (!targetWorkspaceId) {
      const membership = await db.workspaceMember.findFirst({
        where: { userId },
        select: { workspaceId: true },
      })
      targetWorkspaceId = membership?.workspaceId ?? null
    }

    if (!targetWorkspaceId) {
      return NextResponse.json({ error: "No workspace found" }, { status: 400 })
    }

    const channels = await db.channel.findMany({
      where: { workspaceId: targetWorkspaceId },
      include: {
        creator: { select: { id: true, name: true, avatar: true } },
        _count: { select: { members: true, messages: true } },
      },
      orderBy: { createdAt: "asc" },
    })

    return NextResponse.json(channels)
  } catch (error) {
    console.error("Failed to fetch channels:", error)
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
    const { name, description, type, isPrivate, topic, workspaceId } = body

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Channel name is required" },
        { status: 400 }
      )
    }

    let targetWorkspaceId: string | null = workspaceId
    if (!targetWorkspaceId) {
      const membership = await db.workspaceMember.findFirst({
        where: { userId },
        select: { workspaceId: true },
      })
      targetWorkspaceId = membership?.workspaceId ?? null
    }

    if (!targetWorkspaceId) {
      return NextResponse.json({ error: "No workspace found" }, { status: 400 })
    }

    const channel = await db.channel.create({
      data: {
        name: name.trim().toLowerCase().replace(/\s+/g, "-"),
        description: description || null,
        type: type || "text",
        isPrivate: isPrivate || false,
        topic: topic || null,
        workspaceId: targetWorkspaceId,
        creatorId: userId,
        members: {
          create: {
            userId,
            role: "admin",
          },
        },
      },
      include: {
        creator: { select: { id: true, name: true, avatar: true } },
        _count: { select: { members: true } },
      },
    })

    return NextResponse.json(channel, { status: 201 })
  } catch (error) {
    console.error("Failed to create channel:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
