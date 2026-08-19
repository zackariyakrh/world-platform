import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const userId = (session?.user as any)?.id as string | undefined

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")
    const search = searchParams.get("search")

    const where: Record<string, unknown> = { userId }

    if (type && type !== "all") {
      where.type = type
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { category: { contains: search } },
      ]
    }

    const bookmarks = await db.bookmark.findMany({
      where,
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(bookmarks)
  } catch (error) {
    console.error("Failed to fetch bookmarks:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const userId = (session?.user as any)?.id as string | undefined

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { type, refId, title, category } = body

    if (!type || !refId) {
      return NextResponse.json(
        { error: "Type and refId are required" },
        { status: 400 }
      )
    }

    const validTypes = ["message", "file", "task", "note", "ai_response"]
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: "Invalid bookmark type" },
        { status: 400 }
      )
    }

    const existing = await db.bookmark.findFirst({
      where: {
        userId,
        type,
        refId,
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: "Already bookmarked" },
        { status: 409 }
      )
    }

    const bookmark = await db.bookmark.create({
      data: {
        type,
        refId,
        title: title || null,
        category: category || null,
        userId,
      },
    })

    return NextResponse.json(bookmark, { status: 201 })
  } catch (error) {
    console.error("Failed to create bookmark:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    const userId = (session?.user as any)?.id as string | undefined

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "Bookmark ID is required" },
        { status: 400 }
      )
    }

    const bookmark = await db.bookmark.findUnique({
      where: { id },
      select: { id: true, userId: true },
    })

    if (!bookmark) {
      return NextResponse.json(
        { error: "Bookmark not found" },
        { status: 404 }
      )
    }

    if (bookmark.userId !== userId) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    await db.bookmark.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete bookmark:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
