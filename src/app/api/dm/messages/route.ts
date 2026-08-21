import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(request: NextRequest) {
  const session = await auth()
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { conversationId, content } = body

    if (!conversationId || typeof conversationId !== "string") {
      return NextResponse.json({ error: "conversationId is required" }, { status: 400 })
    }
    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json({ error: "content is required" }, { status: 400 })
    }

    const conversation = await db.dMConversation.findUnique({
      where: { id: conversationId },
      include: { participants: { select: { userId: true } } },
    })
    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    const isParticipant = conversation.participants.some((p) => p.userId === userId)
    if (!isParticipant) {
      return NextResponse.json({ error: "Not a participant" }, { status: 403 })
    }

    const message = await db.dMMessage.create({
      data: {
        content: content.trim(),
        conversationId,
        senderId: userId,
      },
      include: {
        sender: {
          select: { id: true, name: true, username: true, avatar: true },
        },
      },
    })

    await db.dMConversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    })

    await db.dMParticipant.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId: userId,
        },
      },
      data: { lastRead: new Date() },
    })

    return NextResponse.json({
      id: message.id,
      content: message.content,
      type: message.type,
      isEdited: message.isEdited,
      isDeleted: message.isDeleted,
      conversationId: message.conversationId,
      senderId: message.senderId,
      replyToId: message.replyToId,
      createdAt: message.createdAt.toISOString(),
      updatedAt: message.updatedAt.toISOString(),
      sender: message.sender,
    })
  } catch (err) {
    console.error("Failed to send DM message:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
