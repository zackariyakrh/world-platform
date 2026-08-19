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
    const search = searchParams.get("search")
    const tag = searchParams.get("tag")

    const where: any = { creatorId: userId }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
      ]
    }

    if (tag) {
      where.tags = { some: { name: tag } }
    }

    const notes = await db.note.findMany({
      where,
      include: {
        tags: true,
      },
      orderBy: { updatedAt: "desc" },
    })

    return NextResponse.json(notes)
  } catch (error) {
    console.error("Failed to fetch notes:", error)
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
    const { title, content, isPublished, tags } = body

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        { error: "Note title is required" },
        { status: 400 }
      )
    }

    const userWorkspace = await db.workspaceMember.findFirst({
      where: { userId },
      select: { workspaceId: true },
    })

    const note = await db.note.create({
      data: {
        title: title.trim(),
        content: content || "",
        isPublished: isPublished || false,
        creatorId: userId,
        workspaceId: userWorkspace?.workspaceId || null,
        tags: tags
          ? {
              create: tags.map((t: { name: string; color?: string }) => ({
                name: t.name,
                color: t.color || null,
              })),
            }
          : undefined,
      },
      include: {
        tags: true,
      },
    })

    return NextResponse.json(note, { status: 201 })
  } catch (error) {
    console.error("Failed to create note:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
