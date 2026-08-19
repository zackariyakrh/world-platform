import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

interface NoteRouteParams {
  params: Promise<{ noteId: string }>
}

export async function GET(request: NextRequest, { params }: NoteRouteParams) {
  try {
    const session = await auth()
    const userId = (session?.user as any)?.id as string | undefined

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { noteId } = await params

    const note = await db.note.findUnique({
      where: { id: noteId },
      include: { tags: true },
    })

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 })
    }

    return NextResponse.json(note)
  } catch (error) {
    console.error("Failed to fetch note:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: NoteRouteParams) {
  try {
    const session = await auth()
    const userId = (session?.user as any)?.id as string | undefined

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { noteId } = await params
    const body = await request.json()

    const existing = await db.note.findUnique({
      where: { id: noteId },
      select: { id: true, creatorId: true },
    })

    if (!existing) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 })
    }

    if (existing.creatorId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { title, content, isPublished, tags } = body

    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (content !== undefined) updateData.content = content
    if (isPublished !== undefined) updateData.isPublished = isPublished

    if (tags !== undefined && Array.isArray(tags)) {
      await db.noteTag.deleteMany({ where: { noteId } })
      if (tags.length > 0) {
        await db.noteTag.createMany({
          data: tags.map((t: { name: string; color?: string }) => ({
            noteId,
            name: t.name,
            color: t.color || null,
          })),
        })
      }
    }

    const note = await db.note.update({
      where: { id: noteId },
      data: updateData,
      include: { tags: true },
    })

    return NextResponse.json(note)
  } catch (error) {
    console.error("Failed to update note:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: NoteRouteParams) {
  try {
    const session = await auth()
    const userId = (session?.user as any)?.id as string | undefined

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { noteId } = await params

    const existing = await db.note.findUnique({
      where: { id: noteId },
      select: { id: true, creatorId: true },
    })

    if (!existing) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 })
    }

    if (existing.creatorId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await db.note.delete({ where: { id: noteId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete note:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
