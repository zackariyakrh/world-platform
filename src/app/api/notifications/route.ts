import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "30")
    const before = searchParams.get("before")
    const type = searchParams.get("type")

    const where: Record<string, unknown> = { userId: session.user.id }

    if (before) {
      where.createdAt = { lt: new Date(before) }
    }

    if (type) {
      where.type = type
    }

    const notifications = await db.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 100),
    })

    return NextResponse.json({ notifications })
  } catch (error) {
    console.error("GET /api/notifications error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { ids, isRead } = body

    if (!ids || !Array.isArray(ids)) {
      return NextResponse.json({ error: "ids array is required" }, { status: 400 })
    }

    await db.notification.updateMany({
      where: {
        id: { in: ids },
        userId: session.user.id,
      },
      data: { isRead: typeof isRead === "boolean" ? isRead : true },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("PATCH /api/notifications error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
