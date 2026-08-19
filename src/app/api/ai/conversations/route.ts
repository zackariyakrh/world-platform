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
    const limit = parseInt(searchParams.get("limit") || "20")

    const conversations = await db.aIConversation.findMany({
      where: { userId: session.user.id },
      include: {
        model: {
          select: { id: true, name: true, displayName: true },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { content: true, role: true, createdAt: true },
        },
        _count: { select: { messages: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: Math.min(limit, 50),
    })

    return NextResponse.json({ conversations })
  } catch (error) {
    console.error("GET /api/ai/conversations error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, modelId } = body

    const conversation = await db.aIConversation.create({
      data: {
        title: title || null,
        userId: session.user.id,
        modelId: modelId || null,
      },
      include: {
        model: {
          select: { id: true, name: true, displayName: true },
        },
      },
    })

    return NextResponse.json({ conversation }, { status: 201 })
  } catch (error) {
    console.error("POST /api/ai/conversations error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
