import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(
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

  const [mute, block] = await Promise.all([
    db.dMMute.findUnique({
      where: {
        userId_mutedUserId_conversationId: {
          userId: session.user.id,
          mutedUserId: otherParticipant.userId,
          conversationId,
        },
      },
    }),
    db.dMBlock.findUnique({
      where: {
        userId_blockedUserId_conversationId: {
          userId: session.user.id,
          blockedUserId: otherParticipant.userId,
          conversationId,
        },
      },
    }),
  ])

  return NextResponse.json({
    muted: !!mute,
    blocked: !!block,
  })
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

  await db.dMMessage.deleteMany({ where: { conversationId } })
  await db.dMMute.deleteMany({ where: { conversationId } })
  await db.dMBlock.deleteMany({ where: { conversationId } })
  await db.dMParticipant.deleteMany({ where: { conversationId } })
  await db.dMConversation.delete({ where: { id: conversationId } })

  return NextResponse.json({ deleted: true })
}
