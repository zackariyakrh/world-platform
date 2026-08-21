import { notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { DMView } from "@/components/dm/dm-view"

interface DMConversationPageProps {
  params: Promise<{ conversationId: string }>
}

export default async function DMConversationPage({ params }: DMConversationPageProps) {
  const { conversationId } = await params
  const session = await auth()
  const userId = (session?.user as any)?.id as string | undefined

  if (!userId) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Please sign in.</p>
      </div>
    )
  }

  const conversation = await db.dMConversation.findUnique({
    where: { id: conversationId },
    include: {
      participants: {
        include: { user: true },
      },
    },
  })

  if (!conversation) {
    notFound()
  }

  const isParticipant = conversation.participants.some((p) => p.userId === userId)
  if (!isParticipant) {
    notFound()
  }

  const otherParticipant = conversation.participants.find(
    (p) => p.userId !== userId
  )
  const otherUser = otherParticipant?.user

  if (!otherUser) {
    notFound()
  }

  const messages = await db.dMMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    take: 100,
  })

  return (
    <div className="flex h-full flex-col">
      <DMView
        conversationId={conversationId}
        initialMessages={messages.map((m) => ({
          ...m,
          createdAt: m.createdAt.toISOString(),
          updatedAt: m.updatedAt.toISOString(),
        }))}
        otherUser={{
          id: otherUser.id,
          name: otherUser.name,
          username: otherUser.username,
          avatar: otherUser.avatar,
          status: otherUser.status,
          bio: otherUser.bio,
          jobTitle: otherUser.jobTitle,
          customStatus: otherUser.customStatus,
          lastSeenAt: otherUser.lastSeenAt?.toISOString() || null,
          createdAt: otherUser.createdAt.toISOString(),
        }}
      />
    </div>
  )
}
