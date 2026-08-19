import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { readFile, unlink } from "fs/promises"

interface FileRouteParams {
  params: Promise<{ fileId: string }>
}

export async function GET(request: NextRequest, { params }: FileRouteParams) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { fileId } = await params

    const file = await db.file.findUnique({
      where: { id: fileId },
    })

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    if (!file.path) {
      return NextResponse.json({ error: "File path missing" }, { status: 404 })
    }

    const buffer = await readFile(file.path)

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": file.mimeType,
        "Content-Disposition": `attachment; filename="${file.originalName}"`,
        "Content-Length": String(file.size),
      },
    })
  } catch (error) {
    console.error("Failed to download file:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: FileRouteParams) {
  try {
    const session = await auth()
    const userId = (session?.user as any)?.id as string | undefined

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { fileId } = await params

    const file = await db.file.findUnique({
      where: { id: fileId },
      select: { id: true, path: true, uploaderId: true },
    })

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    if (file.uploaderId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (file.path) {
      try {
        await unlink(file.path)
      } catch {
        // File may already be deleted from disk
      }
    }

    await db.file.delete({ where: { id: fileId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete file:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
