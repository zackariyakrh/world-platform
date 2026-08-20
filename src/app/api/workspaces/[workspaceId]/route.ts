import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const session = await auth()
    const userId = (session?.user as any)?.id as string | undefined
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { workspaceId } = await params

    const membership = await db.workspaceMember.findFirst({
      where: { userId, workspaceId },
    })
    if (!membership || membership.role !== "owner") {
      return NextResponse.json({ error: "Only the owner can delete this workspace" }, { status: 403 })
    }

    await db.workspace.delete({ where: { id: workspaceId } })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Failed to delete workspace:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
