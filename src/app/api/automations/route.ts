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

    const userWorkspace = await db.workspaceMember.findFirst({
      where: { userId },
      select: { workspaceId: true },
    })

    const automations = await db.automation.findMany({
      where: {
        workspaceId: userWorkspace?.workspaceId || undefined,
      },
      include: {
        creator: {
          select: { id: true, name: true, avatar: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(automations)
  } catch (error) {
    console.error("Failed to fetch automations:", error)
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
    const { name, description, isEnabled, trigger, actions } = body

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Automation name is required" },
        { status: 400 }
      )
    }

    if (!trigger) {
      return NextResponse.json(
        { error: "Trigger is required" },
        { status: 400 }
      )
    }

    if (!actions || !Array.isArray(actions) || actions.length === 0) {
      return NextResponse.json(
        { error: "At least one action is required" },
        { status: 400 }
      )
    }

    const userWorkspace = await db.workspaceMember.findFirst({
      where: { userId },
      select: { workspaceId: true },
    })

    const automation = await db.automation.create({
      data: {
        name: name.trim(),
        description: description || null,
        isEnabled: isEnabled ?? true,
        trigger: typeof trigger === "string" ? trigger : JSON.stringify(trigger),
        actions: typeof actions === "string" ? actions : JSON.stringify(actions),
        creatorId: userId,
        workspaceId: userWorkspace?.workspaceId || null,
      },
      include: {
        creator: {
          select: { id: true, name: true, avatar: true },
        },
      },
    })

    return NextResponse.json(automation, { status: 201 })
  } catch (error) {
    console.error("Failed to create automation:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
