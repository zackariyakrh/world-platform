import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

const UPLOAD_DIR = path.join(process.cwd(), "uploads")

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const userId = (session?.user as any)?.id as string | undefined

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const folder = searchParams.get("folder") || "/"
    const workspaceId = searchParams.get("workspaceId")
    const projectId = searchParams.get("projectId")
    const search = searchParams.get("search")
    const sort = searchParams.get("sort") || "createdAt"
    const order = searchParams.get("order") || "desc"

    const where: any = {
      OR: [
        { uploaderId: userId },
        { workspace: { members: { some: { userId } } } },
      ],
    }

    if (folder) where.folder = folder
    if (workspaceId) where.workspaceId = workspaceId
    if (projectId) where.projectId = projectId
    if (search) {
      where.AND = [
        { name: { contains: search } },
      ]
    }

    const files = await db.file.findMany({
      where,
      include: {
        uploader: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { [sort]: order },
    })

    return NextResponse.json(files)
  } catch (error) {
    console.error("Failed to fetch files:", error)
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

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const folder = (formData.get("folder") as string) || "/"
    const workspaceId = formData.get("workspaceId") as string | null
    const projectId = formData.get("projectId") as string | null
    const channelId = formData.get("channelId") as string | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const ext = path.extname(file.name)
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`
    const uploadPath = path.join(UPLOAD_DIR, uniqueName)

    await mkdir(UPLOAD_DIR, { recursive: true })
    await writeFile(uploadPath, buffer)

    const dbFile = await db.file.create({
      data: {
        name: uniqueName,
        originalName: file.name,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        url: `/api/files/${uniqueName}`,
        path: uploadPath,
        folder,
        workspaceId: workspaceId || null,
        projectId: projectId || null,
        channelId: channelId || null,
        uploaderId: userId,
      },
      include: {
        uploader: { select: { id: true, name: true, avatar: true } },
      },
    })

    return NextResponse.json(dbFile, { status: 201 })
  } catch (error) {
    console.error("Failed to upload file:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
