import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id

  const participations = await db.dMParticipant.findMany({
    where: { userId },
    include: {
      conversation: {
        include: {
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
          participants: {
            include: {
              user: { select: { id: true, name: true, username: true, avatar: true, status: true } },
            },
          },
        },
      },
    },
    orderBy: {
      conversation: { updatedAt: "desc" },
    },
  })

  const conversations = participations.map((p) => {
    const otherParticipant = p.conversation.participants.find(
      (pp) => pp.userId !== userId
    )
    const otherUser = otherParticipant?.user || {
      id: "",
      name: "Unknown",
      username: null,
      avatar: null,
      status: "offline",
    }
    const lastMessage = p.conversation.messages[0]
    const unreadCount = p.lastRead
      ? p.conversation.messages.filter(
          (m) => m.senderId !== userId && m.createdAt > p.lastRead!
        ).length
      : 0

    return {
      id: p.conversation.id,
      lastMessage: lastMessage?.content || null,
      lastMessageAt: lastMessage?.createdAt.toISOString() || null,
      unreadCount,
      otherUser: {
        id: otherUser.id,
        name: otherUser.name,
        username: otherUser.username,
        avatar: otherUser.avatar,
        status: otherUser.status,
      },
    }
  })

  return NextResponse.json(conversations)
}
