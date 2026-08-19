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

    const calls = await db.call.findMany({
      where: { status: "active" },
      include: {
        participants: {
          where: { leftAt: null },
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
        },
        initiator: {
          select: { id: true, name: true, avatar: true },
        },
      },
      orderBy: { startedAt: "desc" },
    })

    return NextResponse.json(calls)
  } catch (error) {
    console.error("Failed to fetch calls:", error)
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
    const { type, channel } = body

    if (!type || !["voice", "video"].includes(type)) {
      return NextResponse.json(
        { error: "Call type must be 'voice' or 'video'" },
        { status: 400 }
      )
    }

    const existingActive = await db.call.findFirst({
      where: {
        initiatorId: userId,
        status: "active",
      },
    })

    if (existingActive) {
      return NextResponse.json(
        { error: "You already have an active call" },
        { status: 409 }
      )
    }

    const call = await db.call.create({
      data: {
        type,
        status: "active",
        channel: channel || null,
        initiatorId: userId,
        participants: {
          create: {
            userId,
          },
        },
      },
      include: {
        participants: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
        },
        initiator: {
          select: { id: true, name: true, avatar: true },
        },
      },
    })

    return NextResponse.json(call, { status: 201 })
  } catch (error) {
    console.error("Failed to create call:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
