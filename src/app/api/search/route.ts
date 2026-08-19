import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

interface SearchResult {
  type: string
  title: string
  subtitle: string
  url: string
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const userId = (session?.user as any)?.id as string | undefined

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")

    if (!query || !query.trim()) {
      return NextResponse.json({ error: "Search query is required" }, { status: 400 })
    }

    const searchTerm = query.trim()
    const limit = 5

    const userWorkspaces = await db.workspaceMember.findMany({
      where: { userId },
      select: { workspaceId: true },
    })
    const workspaceIds = userWorkspaces.map((w) => w.workspaceId)

    const [messages, users, channels, tasks, projects, notes, files] =
      await Promise.all([
        db.message.findMany({
          where: {
            content: { contains: searchTerm },
            channel: { workspaceId: { in: workspaceIds } },
          },
          select: {
            id: true,
            content: true,
            channel: { select: { name: true } },
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: limit,
        }),
        db.user.findMany({
          where: {
            OR: [
              { name: { contains: searchTerm } },
              { email: { contains: searchTerm } },
              { username: { contains: searchTerm } },
            ],
            isActive: true,
          },
          select: {
            id: true,
            name: true,
            email: true,
            jobTitle: true,
          },
          take: limit,
        }),
        db.channel.findMany({
          where: {
            name: { contains: searchTerm },
            workspaceId: { in: workspaceIds },
          },
          select: {
            id: true,
            name: true,
            description: true,
            type: true,
          },
          take: limit,
        }),
        db.task.findMany({
          where: {
            title: { contains: searchTerm },
            OR: [
              { projectId: { in: (await db.project.findMany({ where: { workspaceId: { in: workspaceIds } }, select: { id: true } })).map((p) => p.id) } },
              { creatorId: userId },
              { assigneeId: userId },
            ],
          },
          select: {
            id: true,
            title: true,
            status: true,
            project: { select: { name: true } },
          },
          orderBy: { updatedAt: "desc" },
          take: limit,
        }),
        db.project.findMany({
          where: {
            workspaceId: { in: workspaceIds },
            OR: [
              { name: { contains: searchTerm } },
              { description: { contains: searchTerm } },
            ],
          },
          select: {
            id: true,
            name: true,
            description: true,
            status: true,
          },
          take: limit,
        }),
        db.note.findMany({
          where: {
            creatorId: userId,
            OR: [
              { title: { contains: searchTerm } },
              { content: { contains: searchTerm } },
            ],
          },
          select: {
            id: true,
            title: true,
            content: true,
          },
          take: limit,
        }),
        db.file.findMany({
          where: {
            workspaceId: { in: workspaceIds },
            OR: [
              { name: { contains: searchTerm } },
              { originalName: { contains: searchTerm } },
            ],
          },
          select: {
            id: true,
            name: true,
            originalName: true,
            mimeType: true,
          },
          take: limit,
        }),
      ])

    const results: Record<string, SearchResult[]> = {
      messages: messages.map((m) => ({
        type: "message",
        title: m.content.slice(0, 80),
        subtitle: m.channel?.name || "Unknown channel",
        url: `/channels/${m.channel?.name || ""}`,
      })),
      users: users.map((u) => ({
        type: "user",
        title: u.name || u.email,
        subtitle: u.jobTitle || u.email,
        url: `/dms`,
      })),
      channels: channels.map((c) => ({
        type: "channel",
        title: `#${c.name}`,
        subtitle: c.description || `${c.type} channel`,
        url: `/channels/${c.id}`,
      })),
      tasks: tasks.map((t) => ({
        type: "task",
        title: t.title,
        subtitle: t.project?.name || t.status,
        url: `/projects${t.project ? `/${t.project.name}` : ""}`,
      })),
      projects: projects.map((p) => ({
        type: "project",
        title: p.name,
        subtitle: p.description || p.status,
        url: `/projects`,
      })),
      notes: notes.map((n) => ({
        type: "note",
        title: n.title,
        subtitle: n.content.slice(0, 80),
        url: `/notes/${n.id}`,
      })),
      files: files.map((f) => ({
        type: "file",
        title: f.originalName,
        subtitle: f.mimeType,
        url: `/files`,
      })),
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error("Search failed:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
