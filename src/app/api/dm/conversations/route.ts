import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { userId: targetUserId } = body

    if (!targetUserId || typeof targetUserId !== "string") {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    if (targetUserId === session.user.id) {
      return NextResponse.json({ error: "Cannot create conversation with yourself" }, { status: 400 })
    }

    const targetUser = await db.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, name: true },
    })
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if a 1:1 conversation already exists between these two users
    const existingParticipants = await db.dMParticipant.findMany({
      where: { userId: { in: [session.user.id, targetUserId] } },
      select: { conversationId: true },
    })
    const conversationIds = [...new Set(existingParticipants.map((p) => p.conversationId))]

    for (const convId of conversationIds) {
      const conv = await db.dMConversation.findUnique({
        where: { id: convId },
        select: { isGroup: true, participants: { select: { userId: true } } },
      })
      if (conv && !conv.isGroup && conv.participants.length === 2) {
        const participantIds = conv.participants.map((p) => p.userId)
        if (participantIds.includes(session.user.id) && participantIds.includes(targetUserId)) {
          return NextResponse.json({ conversationId: convId })
        }
      }
    }

    // Create new conversation
    const conversation = await db.dMConversation.create({
      data: {
        isGroup: false,
        participants: {
          create: [
            { userId: session.user.id },
            { userId: targetUserId },
          ],
        },
      },
      select: { id: true },
    })

    return NextResponse.json({ conversationId: conversation.id })
  } catch (err) {
    console.error("Failed to create DM conversation:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
