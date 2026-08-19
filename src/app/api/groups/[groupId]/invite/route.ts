import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const session = await auth()
    const userId = (session?.user as any)?.id as string | undefined

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { groupId } = await params

    const group = await db.group.findUnique({
      where: { id: groupId },
      select: { id: true, name: true },
    })

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 })
    }

    const user = await db.user.findUnique({ where: { id: userId }, select: { role: true } })
    if (user?.role !== "owner" && user?.role !== "admin") {
      const membership = await db.groupMember.findUnique({
        where: { groupId_userId: { groupId, userId } },
      })
      if (!membership || membership.role !== "admin") {
        return NextResponse.json({ error: "Only admins can invite" }, { status: 403 })
      }
    }

    const body = await request.json()
    const { userIds } = body

    if (!userIds?.length) {
      return NextResponse.json({ error: "User IDs are required" }, { status: 400 })
    }

    const invitations = await Promise.all(
      userIds.map(async (targetUserId: string) => {
        const existingMember = await db.groupMember.findUnique({
          where: { groupId_userId: { groupId, userId: targetUserId } },
        })
        if (existingMember) return null

        const existingInvite = await db.groupInvitation.findUnique({
          where: { groupId_userId: { groupId, userId: targetUserId } },
        })
        if (existingInvite) return null

        return db.groupInvitation.create({
          data: {
            groupId,
            userId: targetUserId,
            invitedById: userId,
          },
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true } },
          },
        })
      })
    )

    return NextResponse.json(invitations.filter(Boolean), { status: 201 })
  } catch (error) {
    console.error("Failed to invite users:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
