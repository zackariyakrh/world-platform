import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id
  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q")?.trim()

  if (!q || q.length < 2) {
    return NextResponse.json([])
  }

  // Find users matching the search query
  const users = await db.user.findMany({
    where: {
      id: { not: userId },
      isActive: true,
      OR: [
        { username: { contains: q } },
        { name: { contains: q } },
        { firstName: { contains: q } },
        { lastName: { contains: q } },
        { email: { contains: q } },
      ],
    },
    select: {
      id: true,
      name: true,
      username: true,
      avatar: true,
      status: true,
      jobTitle: true,
    },
    take: 20,
    orderBy: { name: "asc" },
  })

  // Get current user's friendships
  const friendships = await db.friend.findMany({
    where: {
      OR: [
        { userId, status: "accepted" },
        { friendId: userId, status: "accepted" },
        { userId, status: "pending" },
        { friendId: userId, status: "pending" },
      ],
    },
    select: { userId: true, friendId: true, status: true },
  })

  const friendMap = new Map<string, string>()
  for (const f of friendships) {
    const otherId = f.userId === userId ? f.friendId : f.userId
    friendMap.set(otherId, f.status)
  }

  // Get current user's group and workspace memberships
  const [myGroupMembers, myWorkspaceMembers] = await Promise.all([
    db.groupMember.findMany({
      where: { userId },
      select: { groupId: true },
    }),
    db.workspaceMember.findMany({
      where: { userId },
      select: { workspaceId: true },
    }),
  ])

  const myGroupIds = myGroupMembers.map((m) => m.groupId)
  const myWorkspaceIds = myWorkspaceMembers.map((m) => m.workspaceId)

  // For each user, check if they share a group or workspace
  const userIds = users.map((u) => u.id)

  const [sharedGroupMembers, sharedWorkspaceMembers] = await Promise.all([
    myGroupIds.length > 0 ? db.groupMember.findMany({
      where: { userId: { in: userIds }, groupId: { in: myGroupIds } },
      select: { userId: true, groupId: true },
    }) : [],
    myWorkspaceIds.length > 0 ? db.workspaceMember.findMany({
      where: { userId: { in: userIds }, workspaceId: { in: myWorkspaceIds } },
      select: { userId: true, workspaceId: true },
    }) : [],
  ])

  const sharedGroupsByUser = new Map<string, number>()
  for (const m of sharedGroupMembers) {
    sharedGroupsByUser.set(m.userId, (sharedGroupsByUser.get(m.userId) || 0) + 1)
  }

  const sharedWorkspacesByUser = new Map<string, number>()
  for (const m of sharedWorkspaceMembers) {
    sharedWorkspacesByUser.set(m.userId, (sharedWorkspacesByUser.get(m.userId) || 0) + 1)
  }

  const results = users.map((u) => ({
    ...u,
    friendshipStatus: friendMap.get(u.id) || null,
    sharedGroups: sharedGroupsByUser.get(u.id) || 0,
    sharedWorkspaces: sharedWorkspacesByUser.get(u.id) || 0,
    canAddFriend: (sharedGroupsByUser.has(u.id) || sharedWorkspacesByUser.has(u.id)) && !friendMap.has(u.id),
  }))

  return NextResponse.json(results)
}
