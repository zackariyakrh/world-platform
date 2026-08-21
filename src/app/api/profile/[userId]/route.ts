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

  try {
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

    let myWorkspaceIds: string[] = []
    let theirWorkspaceIds: string[] = []
    let myChannelIds: string[] = []
    let theirChannelIds: string[] = []
    let myGroupIds: string[] = []
    let theirGroupIds: string[] = []
    let myProjectIds: string[] = []
    let theirProjectIds: string[] = []
    let friendshipStatus: string | null = null

    try {
      const [myW, theirW, myC, theirC, myG, theirG, myP, theirP, friendship] = await Promise.all([
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

      myWorkspaceIds = myW.map(m => m.workspaceId)
      theirWorkspaceIds = theirW.map(m => m.workspaceId)
      myChannelIds = myC.map(m => m.channelId)
      theirChannelIds = theirC.map(m => m.channelId)
      myGroupIds = myG.map(m => m.groupId)
      theirGroupIds = theirG.map(m => m.groupId)
      myProjectIds = myP.map(m => m.projectId)
      theirProjectIds = theirP.map(m => m.projectId)
      friendshipStatus = friendship?.status || null
    } catch (e) {
      console.error("Error fetching membership data:", e)
    }

    const commonWorkspaceIds = myWorkspaceIds.filter(id => theirWorkspaceIds.includes(id))
    const commonChannelIds = myChannelIds.filter(id => theirChannelIds.includes(id))
    const commonGroupIds = myGroupIds.filter(id => theirGroupIds.includes(id))
    const commonProjectIds = myProjectIds.filter(id => theirProjectIds.includes(id))

    const [commonWorkspaces, commonChannels, commonGroups, commonProjects] = await Promise.all([
      commonWorkspaceIds.length > 0
        ? db.workspace.findMany({ where: { id: { in: commonWorkspaceIds } }, select: { id: true, name: true, icon: true } })
        : [],
      commonChannelIds.length > 0
        ? db.channel.findMany({ where: { id: { in: commonChannelIds } }, select: { id: true, name: true, type: true } })
        : [],
      commonGroupIds.length > 0
        ? db.group.findMany({ where: { id: { in: commonGroupIds } }, select: { id: true, name: true, avatar: true } })
        : [],
      commonProjectIds.length > 0
        ? db.project.findMany({ where: { id: { in: commonProjectIds } }, select: { id: true, name: true } })
        : [],
    ])

    return NextResponse.json({
      ...user,
      friendshipStatus,
      commonWorkspaces,
      commonChannels,
      commonGroups,
      commonProjects,
    })
  } catch (err) {
    console.error("Failed to load user profile:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
