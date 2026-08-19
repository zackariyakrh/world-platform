import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

interface CallRouteParams {
  params: Promise<{ callId: string }>
}

export async function GET(request: NextRequest, { params }: CallRouteParams) {
  try {
    const session = await auth()
    const userId = (session?.user as any)?.id as string | undefined

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { callId } = await params

    const call = await db.call.findUnique({
      where: { id: callId },
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

    if (!call) {
      return NextResponse.json({ error: "Call not found" }, { status: 404 })
    }

    return NextResponse.json(call)
  } catch (error) {
    console.error("Failed to fetch call:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: CallRouteParams) {
  try {
    const session = await auth()
    const userId = (session?.user as any)?.id as string | undefined

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { callId } = await params

    const call = await db.call.findUnique({
      where: { id: callId },
      select: { id: true, initiatorId: true, status: true },
    })

    if (!call) {
      return NextResponse.json({ error: "Call not found" }, { status: 404 })
    }

    if (call.initiatorId !== userId) {
      return NextResponse.json(
        { error: "Only the call initiator can end the call" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { status } = body

    const updatedCall = await db.call.update({
      where: { id: callId },
      data: {
        status: status || "ended",
        endedAt: new Date(),
      },
      include: {
        participants: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
        },
      },
    })

    return NextResponse.json(updatedCall)
  } catch (error) {
    console.error("Failed to update call:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: CallRouteParams) {
  try {
    const session = await auth()
    const userId = (session?.user as any)?.id as string | undefined

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { callId } = await params

    const call = await db.call.findUnique({
      where: { id: callId },
      select: { id: true, initiatorId: true },
    })

    if (!call) {
      return NextResponse.json({ error: "Call not found" }, { status: 404 })
    }

    if (call.initiatorId !== userId) {
      return NextResponse.json(
        { error: "Only the call initiator can delete the call" },
        { status: 403 }
      )
    }

    await db.call.delete({ where: { id: callId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete call:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
