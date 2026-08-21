import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

// GET - Get friend status for current user
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id

  const friendships = await db.friend.findMany({
    where: {
      OR: [
        { userId, status: "accepted" },
        { friendId: userId, status: "accepted" },
        { userId, status: "pending" },
        { friendId: userId, status: "pending" },
      ],
    },
    include: {
      user: { select: { id: true, name: true, username: true, avatar: true } },
      friend: { select: { id: true, name: true, username: true, avatar: true } },
    },
  })

  const friends: typeof friendships = []
  const pendingSent: typeof friendships = []
  const pendingReceived: typeof friendships = []

  for (const f of friendships) {
    if (f.status === "accepted") {
      friends.push(f)
    } else if (f.userId === userId) {
      pendingSent.push(f)
    } else {
      pendingReceived.push(f)
    }
  }

  return NextResponse.json({
    friends: friends.map((f) => f.userId === userId ? f.friend : f.user),
    pendingSent: pendingSent.map((f) => f.friend),
    pendingReceived: pendingReceived.map((f) => f.user),
  })
}

// POST - Send friend request
export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id

  try {
    const body = await request.json()
    const { friendId } = body

    if (!friendId || typeof friendId !== "string") {
      return NextResponse.json({ error: "friendId is required" }, { status: 400 })
    }

    if (friendId === userId) {
      return NextResponse.json({ error: "Cannot add yourself" }, { status: 400 })
    }

    const [targetUser, senderUser] = await Promise.all([
      db.user.findUnique({ where: { id: friendId }, select: { id: true, name: true } }),
      db.user.findUnique({ where: { id: userId }, select: { id: true, name: true } }),
    ])

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const senderName = senderUser?.name || "Someone"

    // Check existing friendship
    const existing = await db.friend.findFirst({
      where: {
        OR: [
          { userId, friendId },
          { userId: friendId, friendId: userId },
        ],
      },
    })

    if (existing) {
      if (existing.status === "accepted") {
        return NextResponse.json({ error: "Already friends" }, { status: 400 })
      }
      if (existing.status === "pending") {
        if (existing.userId === userId) {
          return NextResponse.json({ error: "Request already sent" }, { status: 400 })
        }
        // Auto-accept if the other user already sent a request
        await db.friend.update({ where: { id: existing.id }, data: { status: "accepted" } })

        // Notify both users
        await Promise.all([
          db.notification.create({
            data: {
              type: "friend_request",
              title: "Friend request accepted",
              content: `${senderName} accepted your friend request.`,
              url: "/people",
              userId: friendId,
            },
          }),
          db.notification.create({
            data: {
              type: "friend_request",
              title: "You are now friends",
              content: `You and ${senderName} are now friends.`,
              url: "/people",
              userId,
            },
          }),
        ])

        return NextResponse.json({ status: "accepted" })
      }
    }

    // Check shared group or workspace membership
    const sharedWorkspace = await db.workspaceMember.findFirst({
      where: {
        userId,
        workspace: { members: { some: { userId: friendId } } },
      },
    })

    const sharedGroup = await db.groupMember.findFirst({
      where: {
        userId,
        group: { members: { some: { userId: friendId } } },
      },
    })

    if (!sharedWorkspace && !sharedGroup) {
      return NextResponse.json({ error: "You can only add users in the same group or workspace" }, { status: 403 })
    }

    const friend = await db.friend.create({
      data: { userId, friendId, status: "pending" },
    })

    // Notify the recipient
    await db.notification.create({
      data: {
        type: "friend_request",
        title: "Friend request received",
        content: `${senderName} sent you a friend request.`,
        url: "/people",
        userId: friendId,
      },
    })

    return NextResponse.json({ status: "pending", id: friend.id })
  } catch (err) {
    console.error("Failed to send friend request:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH - Accept or decline friend request
export async function PATCH(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id

  try {
    const body = await request.json()
    const { friendId, action } = body

    if (!friendId || !action) {
      return NextResponse.json({ error: "friendId and action are required" }, { status: 400 })
    }

    const friendship = await db.friend.findFirst({
      where: { userId: friendId, friendId: userId, status: "pending" },
    })

    if (!friendship) {
      return NextResponse.json({ error: "Friend request not found" }, { status: 404 })
    }

    const recipientUser = await db.user.findUnique({ where: { id: userId }, select: { name: true } })
    const recipientName = recipientUser?.name || "Someone"

    if (action === "accept") {
      await db.friend.update({ where: { id: friendship.id }, data: { status: "accepted" } })

      // Notify the sender that their request was accepted
      await db.notification.create({
        data: {
          type: "friend_request",
          title: "Friend request accepted",
          content: `${recipientName} accepted your friend request.`,
          url: "/people",
          userId: friendId,
        },
      })

      return NextResponse.json({ status: "accepted" })
    } else if (action === "decline" || action === "remove") {
      await db.friend.delete({ where: { id: friendship.id } })

      // Notify the sender that their request was declined
      await db.notification.create({
        data: {
          type: "friend_request",
          title: "Friend request declined",
          content: `${recipientName} declined your friend request.`,
          url: "/people",
          userId: friendId,
        },
      })

      return NextResponse.json({ status: "removed" })
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (err) {
    console.error("Failed to update friend request:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE - Remove friend or cancel request
export async function DELETE(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id

  try {
    const body = await request.json()
    const { friendId } = body

    if (!friendId) {
      return NextResponse.json({ error: "friendId is required" }, { status: 400 })
    }

    const friendship = await db.friend.findFirst({
      where: {
        OR: [
          { userId, friendId },
          { userId: friendId, friendId: userId },
        ],
      },
    })

    if (!friendship) {
      return NextResponse.json({ error: "Friendship not found" }, { status: 404 })
    }

    await db.friend.delete({ where: { id: friendship.id } })
    return NextResponse.json({ status: "removed" })
  } catch (err) {
    console.error("Failed to remove friend:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
