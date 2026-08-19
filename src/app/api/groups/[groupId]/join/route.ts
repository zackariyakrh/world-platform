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
      select: { id: true, name: true, isPrivate: true },
    })

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 })
    }

    const existingMember = await db.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    })
    if (existingMember) {
      return NextResponse.json({ error: "Already a member" }, { status: 400 })
    }

    if (group.isPrivate) {
      const invitation = await db.groupInvitation.findUnique({
        where: { groupId_userId: { groupId, userId } },
      })
      if (!invitation || invitation.status !== "pending") {
        return NextResponse.json({ error: "This is a private group. You need an invitation." }, { status: 403 })
      }

      await db.groupInvitation.update({
        where: { id: invitation.id },
        data: { status: "accepted" },
      })
    }

    const member = await db.groupMember.create({
      data: {
        groupId,
        userId,
        role: "member",
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    })

    return NextResponse.json(member, { status: 201 })
  } catch (error) {
    console.error("Failed to join group:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
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

    const membership = await db.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    })

    if (!membership) {
      return NextResponse.json({ error: "Not a member" }, { status: 400 })
    }

    await db.groupMember.delete({
      where: { id: membership.id },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Failed to leave group:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
