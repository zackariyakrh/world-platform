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

  const [myWorkspaces, theirWorkspaces, myChannels, theirChannels, myGroups, theirGroups, myProjects, theirProjects, friendship] = await Promise.all([
    db.workspaceMember.findMany({ where: { userId: currentUserId }, select: { workspaceId: true } }),
    db.workspaceMember.findMany({ where: { userId }, select: { workspaceId: true } }),
    db.channelMember.findMany({ where: { userId: currentUserId }, select: { channelId: true } }),
    db.channelMember.findMany({ where: { userId }, select: { channelId: true } }),
    db.groupMember.findMany({ where: { userId: currentUserId }, select: { groupId: true } }),
    db.groupMember.findMany({ where: { userId }, select: { groupId: true } }),
    db.projectMember.findMany({ where: { userId: currentUserId }, select: { projectId: true } }),
    db.projectMember.findMany({ where: { userId }, select: { projectId: true } }),
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

  const commonWorkspaceIds = myWorkspaces.map(m => m.workspaceId).filter(id => theirWorkspaces.some(m => m.workspaceId === id))
  const commonChannelIds = myChannels.map(m => m.channelId).filter(id => theirChannels.some(m => m.channelId === id))
  const commonGroupIds = myGroups.map(m => m.groupId).filter(id => theirGroups.some(m => m.groupId === id))
  const commonProjectIds = myProjects.map(m => m.projectId).filter(id => theirProjects.some(m => m.projectId === id))

  const [commonWorkspaces, commonChannels, commonGroups, commonProjects] = await Promise.all([
    commonWorkspaceIds.length > 0
      ? db.workspace.findMany({ where: { id: { in: commonWorkspaceIds } }, select: { id: true, name: true, icon: true } })
      : Promise.resolve([]),
    commonChannelIds.length > 0
      ? db.channel.findMany({ where: { id: { in: commonChannelIds } }, select: { id: true, name: true, type: true } })
      : Promise.resolve([]),
    commonGroupIds.length > 0
      ? db.group.findMany({ where: { id: { in: commonGroupIds } }, select: { id: true, name: true, avatar: true } })
      : Promise.resolve([]),
    commonProjectIds.length > 0
      ? db.project.findMany({ where: { id: { in: commonProjectIds } }, select: { id: true, name: true } })
      : Promise.resolve([]),
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
