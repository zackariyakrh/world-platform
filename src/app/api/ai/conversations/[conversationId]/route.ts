import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { conversationId } = await params

    const conversation = await db.aIConversation.findFirst({
      where: { id: conversationId, userId: session.user.id },
      include: {
        model: {
          select: { id: true, name: true, displayName: true, modelId: true },
        },
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    })

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    return NextResponse.json({ conversation })
  } catch (error) {
    console.error("GET /api/ai/conversations/[conversationId] error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { conversationId } = await params

    const conversation = await db.aIConversation.findFirst({
      where: { id: conversationId, userId: session.user.id },
    })

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    await db.aIConversation.delete({ where: { id: conversationId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/ai/conversations/[conversationId] error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
