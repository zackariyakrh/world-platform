import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

interface RouteParams {
  params: Promise<{ threadId: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    const userId = (session?.user as any)?.id as string | undefined
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { threadId } = await params

    const thread = await db.thread.findUnique({
      where: { id: threadId },
      select: { id: true },
    })

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 })
    }

    const existing = await db.threadFollower.findUnique({
      where: { threadId_userId: { threadId, userId } },
    })

    if (existing) {
      return NextResponse.json({ error: "Already following" }, { status: 409 })
    }

    await db.threadFollower.create({
      data: { threadId, userId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to follow thread:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    const userId = (session?.user as any)?.id as string | undefined
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { threadId } = await params

    await db.threadFollower.deleteMany({
      where: { threadId, userId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to unfollow thread:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
