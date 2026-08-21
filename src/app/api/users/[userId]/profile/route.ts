import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await auth()
  const currentUserId = (session?.user as any)?.id as string | undefined
  if (!currentUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { userId } = await params
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 })
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      username: true,
      avatar: true,
      bio: true,
      jobTitle: true,
      customStatus: true,
      status: true,
      timezone: true,
      lastSeenAt: true,
      createdAt: true,
    },
  })

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const [
    commonWorkspaces,
    commonChannels,
    commonGroups,
    commonProjects,
    friendship,
  ] = await Promise.all([
    db.workspace.findMany({
      where: {
        members: { some: { userId: currentUserId } },
        AND: { members: { some: { userId } } },
      },
      select: { id: true, name: true, icon: true },
    }),
    db.channel.findMany({
      where: {
        members: { some: { userId: currentUserId } },
        AND: { members: { some: { userId } } },
      },
      select: { id: true, name: true, type: true },
    }),
    db.group.findMany({
      where: {
        members: { some: { userId: currentUserId } },
        AND: { members: { some: { userId } } },
      },
      select: { id: true, name: true, avatar: true },
    }),
    db.project.findMany({
      where: {
        members: { some: { userId: currentUserId } },
        AND: { members: { some: { userId } } },
      },
      select: { id: true, name: true },
    }),
    db.friend.findFirst({
      where: {
        OR: [
          { userId: currentUserId, friendId: userId, status: "accepted" },
          { userId, friendId: currentUserId, status: "accepted" },
        ],
      },
      select: { status: true },
    }),
  ])

  return NextResponse.json({
    ...user,
    friendshipStatus: friendship?.status || null,
    commonWorkspaces,
    commonChannels,
    commonGroups,
    commonProjects,
  })
}
