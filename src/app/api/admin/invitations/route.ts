import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), user: null }
  }
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, isSuperAdmin: true },
  })
  if (!user || (user.role !== "owner" && user.role !== "admin" && !user.isSuperAdmin)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }), user: null }
  }
  return { error: null, user }
}

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const invitations = await db.invitation.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      invitedBy: {
        select: { id: true, name: true, email: true },
      },
    },
  })

  return NextResponse.json(invitations)
}

export async function POST(request: NextRequest) {
  const { error, user } = await requireAdmin()
  if (error) return error

  try {
    const body = await request.json()
    const { email, firstName, lastName, role, message } = body

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const crypto = await import("crypto")
    const token = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const invitation = await db.invitation.create({
      data: {
        email: email.toLowerCase().trim(),
        firstName: firstName || null,
        lastName: lastName || null,
        role: role || "member",
        message: message || null,
        token,
        invitedById: user!.id,
        expiresAt,
      },
    })

    return NextResponse.json(invitation, { status: 201 })
  } catch (err) {
    console.error("Failed to create invitation:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const body = await request.json()
    const { invitationId, action } = body

    if (!invitationId || typeof invitationId !== "string") {
      return NextResponse.json({ error: "invitationId is required" }, { status: 400 })
    }

    if (action === "cancel") {
      const updated = await db.invitation.update({
        where: { id: invitationId },
        data: { status: "cancelled" },
      })
      return NextResponse.json(updated)
    }

    if (action === "resend") {
      const crypto = await import("crypto")
      const token = crypto.randomBytes(32).toString("hex")
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7)

      const updated = await db.invitation.update({
        where: { id: invitationId },
        data: {
          token,
          expiresAt,
          status: "pending",
        },
      })
      return NextResponse.json(updated)
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (err) {
    console.error("Failed to update invitation:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
