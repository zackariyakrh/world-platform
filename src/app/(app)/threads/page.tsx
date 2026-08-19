import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { ThreadsClient } from "./threads-client"
import { MessageSquare } from "lucide-react"

export default async function ThreadsPage() {
  const session = await auth()
  const userId = (session?.user as any)?.id as string | undefined

  if (!userId) return null

  const userWorkspaces = await db.workspaceMember.findMany({
    where: { userId },
    select: { workspaceId: true },
  })
  const workspaceIds = userWorkspaces.map((w) => w.workspaceId)

  const workspaceChannelIds = (
    await db.channel.findMany({
      where: { workspaceId: { in: workspaceIds } },
      select: { id: true },
    })
  ).map((c) => c.id)

  const [threads, channels] = await Promise.all([
    db.thread.findMany({
      where: { channelId: { in: workspaceChannelIds } },
      include: {
        creator: {
          select: { id: true, name: true, avatar: true, email: true },
        },
        channel: {
          select: { id: true, name: true },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            content: true,
            createdAt: true,
            user: { select: { id: true, name: true, avatar: true } },
          },
        },
        followers: {
          select: { userId: true },
        },
      },
      orderBy: { lastReplyAt: "desc" },
    }),
    db.channel.findMany({
      where: { workspaceId: { in: workspaceIds }, type: "text" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ])

  const enrichedThreads = threads.map((t) => ({
    ...t,
    isFollowing: t.followers.some((f) => f.userId === userId),
    followerCount: t.followers.length,
    lastMessage: t.messages[0] ?? null,
    messages: undefined,
  }))

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-1">
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground glow-text">
          <MessageSquare className="size-6 text-primary drop-shadow-[0_0_8px_oklch(from_var(--primary)_l_c_h_/_0.4)]" />
          Threads
        </h1>
        <p className="text-sm text-muted-foreground">
          Conversations across your channels. Follow threads to stay updated.
        </p>
      </div>

      <ThreadsClient
        initialThreads={enrichedThreads as any}
        channels={channels as any}
        currentUserId={userId}
      />
    </div>
  )
}
