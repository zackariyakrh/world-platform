import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { DMList } from "@/components/dm/dm-list"

export default async function DMsPage() {
  const session = await auth()
  const userId = (session?.user as any)?.id as string | undefined

  if (!userId) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Please sign in to view messages.</p>
      </div>
    )
  }

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
            include: { user: true },
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

  return (
    <div className="h-full">
      <DMList conversations={conversations} />
    </div>
  )
}
