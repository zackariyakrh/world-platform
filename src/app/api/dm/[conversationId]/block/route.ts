import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { conversationId } = await params

  const participant = await db.dMParticipant.findUnique({
    where: {
      conversationId_userId: {
        conversationId,
        userId: session.user.id,
      },
    },
  })

  if (!participant) {
    return NextResponse.json({ error: "Not a participant" }, { status: 403 })
  }

  const otherParticipant = await db.dMParticipant.findFirst({
    where: { conversationId, userId: { not: session.user.id } },
  })

  if (!otherParticipant) {
    return NextResponse.json({ error: "Other user not found" }, { status: 404 })
  }

  await db.dMBlock.upsert({
    where: {
      userId_blockedUserId_conversationId: {
        userId: session.user.id,
        blockedUserId: otherParticipant.userId,
        conversationId,
      },
    },
    create: {
      userId: session.user.id,
      blockedUserId: otherParticipant.userId,
      conversationId,
    },
    update: {},
  })

  return NextResponse.json({ blocked: true })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { conversationId } = await params

  await db.dMBlock.deleteMany({
    where: {
      userId: session.user.id,
      conversationId,
    },
  })

  return NextResponse.json({ blocked: false })
}
