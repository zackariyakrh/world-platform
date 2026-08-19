import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const session = await auth()
    const userId = (session?.user as any)?.id as string | undefined

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const memberships = await db.workspaceMember.findMany({
      where: { userId },
      include: {
        workspace: {
          include: {
            _count: {
              select: { members: true, channels: true, projects: true },
            },
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    })

    const workspaces = memberships.map((m) => m.workspace)

    return NextResponse.json(workspaces)
  } catch (error) {
    console.error("Failed to fetch workspaces:", error)
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
    const { name, description, icon, color } = body

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Workspace name is required" },
        { status: 400 }
      )
    }

    const slug = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")

    const existingSlug = await db.workspace.findUnique({ where: { slug } })
    if (existingSlug) {
      return NextResponse.json(
        { error: "A workspace with a similar name already exists" },
        { status: 409 }
      )
    }

    const workspace = await db.workspace.create({
      data: {
        name: name.trim(),
        slug,
        description: description || null,
        icon: icon || null,
        color: color || null,
        ownerId: userId,
        members: {
          create: {
            userId,
            role: "owner",
          },
        },
      },
      include: {
        members: true,
        _count: {
          select: { channels: true, projects: true },
        },
      },
    })

    return NextResponse.json(workspace, { status: 201 })
  } catch (error) {
    console.error("Failed to create workspace:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
