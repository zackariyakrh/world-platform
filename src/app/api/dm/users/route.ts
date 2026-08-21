import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const currentUser = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  })

  if (!currentUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const isAdmin = currentUser.role === "owner" || currentUser.role === "admin"

  let users: { id: string; name: string | null; username: string | null; avatar: string | null; status: string }[]

  if (isAdmin) {
    // Admins can message all users
    users = await db.user.findMany({
      where: { id: { not: currentUser.id }, isActive: true },
      select: { id: true, name: true, username: true, avatar: true, status: true },
      orderBy: { name: "asc" },
    })
  } else {
    // Members can only message friends
    const friendships = await db.friend.findMany({
      where: {
        OR: [
          { userId: currentUser.id, status: "accepted" },
          { friendId: currentUser.id, status: "accepted" },
        ],
      },
      select: {
        user: { select: { id: true, name: true, username: true, avatar: true, status: true } },
        friend: { select: { id: true, name: true, username: true, avatar: true, status: true } },
      },
    })

    const userMap = new Map<string, { id: string; name: string | null; username: string | null; avatar: string | null; status: string }>()
    for (const f of friendships) {
      if (f.user.id !== currentUser.id) userMap.set(f.user.id, f.user)
      if (f.friend.id !== currentUser.id) userMap.set(f.friend.id, f.friend)
    }
    users = Array.from(userMap.values()).sort((a, b) => (a.name || "").localeCompare(b.name || ""))
  }

  return NextResponse.json(users)
}
