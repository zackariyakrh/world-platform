import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

interface AutomationRouteParams {
  params: Promise<{ automationId: string }>
}

export async function GET(
  request: NextRequest,
  { params }: AutomationRouteParams
) {
  try {
    const session = await auth()
    const userId = (session?.user as any)?.id as string | undefined

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { automationId } = await params

    const automation = await db.automation.findUnique({
      where: { id: automationId },
      include: {
        creator: {
          select: { id: true, name: true, avatar: true },
        },
      },
    })

    if (!automation) {
      return NextResponse.json(
        { error: "Automation not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(automation)
  } catch (error) {
    console.error("Failed to fetch automation:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: AutomationRouteParams
) {
  try {
    const session = await auth()
    const userId = (session?.user as any)?.id as string | undefined

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { automationId } = await params
    const body = await request.json()

    const automation = await db.automation.findUnique({
      where: { id: automationId },
      select: { id: true },
    })

    if (!automation) {
      return NextResponse.json(
        { error: "Automation not found" },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {}
    const allowedFields = ["name", "description", "isEnabled", "trigger", "actions"]

    for (const field of allowedFields) {
      if (field in body) {
        if (field === "trigger" || field === "actions") {
          updateData[field] =
            typeof body[field] === "string"
              ? body[field]
              : JSON.stringify(body[field])
        } else {
          updateData[field] = body[field]
        }
      }
    }

    const updated = await db.automation.update({
      where: { id: automationId },
      data: updateData,
      include: {
        creator: {
          select: { id: true, name: true, avatar: true },
        },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Failed to update automation:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: AutomationRouteParams
) {
  try {
    const session = await auth()
    const userId = (session?.user as any)?.id as string | undefined

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { automationId } = await params

    const automation = await db.automation.findUnique({
      where: { id: automationId },
      select: { id: true },
    })

    if (!automation) {
      return NextResponse.json(
        { error: "Automation not found" },
        { status: 404 }
      )
    }

    await db.automation.delete({ where: { id: automationId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete automation:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
