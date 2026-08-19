import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { ChatView } from "@/components/chat/chat-view"
import { ChannelHeader } from "@/components/chat/channel-header"

interface ChannelPageProps {
  params: Promise<{ channelId: string }>
}

export default async function ChannelPage({ params }: ChannelPageProps) {
  const { channelId } = await params
  const session = await auth()

  const channel = await db.channel.findUnique({
    where: { id: channelId },
    include: {
      _count: { select: { members: true } },
    },
  })

  if (!channel) {
    notFound()
  }

  const messages = await db.message.findMany({
    where: { channelId, parentId: null },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      user: true,
      reactions: {
        include: { user: true },
      },
      replies: {
        select: { id: true },
      },
    },
  })

  const reversedMessages = messages.reverse()

  return (
    <div className="flex h-full flex-col">
      <ChannelHeader
        channel={{
          id: channel.id,
          name: channel.name,
          topic: channel.topic,
          memberCount: channel._count.members,
        }}
      />
      <ChatView
        channelId={channelId}
        initialMessages={    reversedMessages.map((m: (typeof messages)[number]) => ({
          ...m,
          createdAt: m.createdAt.toISOString(),
          updatedAt: m.updatedAt.toISOString(),
        }))}
        channel={{
          id: channel.id,
          name: channel.name,
          topic: channel.topic,
          memberCount: channel._count.members,
        }}
      />
    </div>
  )
}
