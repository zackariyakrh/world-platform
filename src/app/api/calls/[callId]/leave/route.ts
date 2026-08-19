import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

interface LeaveRouteParams {
  params: Promise<{ callId: string }>
}

export async function POST(request: NextRequest, { params }: LeaveRouteParams) {
  try {
    const session = await auth()
    const userId = (session?.user as any)?.id as string | undefined

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { callId } = await params

    const participant = await db.callParticipant.findFirst({
      where: {
        callId,
        userId,
      },
    })

    if (!participant || participant.leftAt) {
      return NextResponse.json(
        { error: "Not in this call" },
        { status: 400 }
      )
    }

    const updatedParticipant = await db.callParticipant.update({
      where: {
        id: participant.id,
      },
      data: {
        leftAt: new Date(),
      },
    })

    const activeParticipants = await db.callParticipant.count({
      where: {
        callId,
        leftAt: null,
      },
    })

    if (activeParticipants === 0) {
      await db.call.update({
        where: { id: callId },
        data: {
          status: "ended",
          endedAt: new Date(),
        },
      })
    }

    return NextResponse.json({ success: true, participant: updatedParticipant })
  } catch (error) {
    console.error("Failed to leave call:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
