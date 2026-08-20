import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; memberId: string }> }
) {
  try {
    const session = await auth()
    const userId = (session?.user as any)?.id as string | undefined
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { workspaceId, memberId } = await params

    const callerMembership = await db.workspaceMember.findFirst({
      where: { userId, workspaceId },
    })
    if (!callerMembership || (callerMembership.role !== "owner" && callerMembership.role !== "admin")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const targetMembership = await db.workspaceMember.findFirst({
      where: { userId: memberId, workspaceId },
    })
    if (!targetMembership) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }
    if (targetMembership.role === "owner") {
      return NextResponse.json({ error: "Cannot remove the workspace owner" }, { status: 403 })
    }

    await db.workspaceMember.delete({
      where: { userId_workspaceId: { userId: memberId, workspaceId } },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Failed to remove member:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
