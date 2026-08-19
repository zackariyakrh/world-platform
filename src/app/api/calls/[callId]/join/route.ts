import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

interface JoinRouteParams {
  params: Promise<{ callId: string }>
}

export async function POST(request: NextRequest, { params }: JoinRouteParams) {
  try {
    const session = await auth()
    const userId = (session?.user as any)?.id as string | undefined

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { callId } = await params

    const call = await db.call.findUnique({
      where: { id: callId },
      select: { id: true, status: true },
    })

    if (!call) {
      return NextResponse.json({ error: "Call not found" }, { status: 404 })
    }

    if (call.status !== "active") {
      return NextResponse.json(
        { error: "This call has ended" },
        { status: 400 }
      )
    }

    const existingParticipant = await db.callParticipant.findFirst({
      where: {
        callId,
        userId,
      },
    })

    if (existingParticipant && !existingParticipant.leftAt) {
      return NextResponse.json(
        { error: "Already in this call" },
        { status: 409 }
      )
    }

    const participant = await db.callParticipant.create({
      data: {
        callId,
        userId,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        call: true,
      },
    })

    return NextResponse.json(participant, { status: 201 })
  } catch (error) {
    console.error("Failed to join call:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
