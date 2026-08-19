import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"
import bcrypt from "bcryptjs"

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

  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      gender: true,
      address: true,
      avatar: true,
      role: true,
      isActive: true,
      createdAt: true,
      lastSeenAt: true,
    },
  })

  return NextResponse.json(users)
}

export async function PATCH(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const body = await request.json()
    const { userId, role, isActive, firstName, lastName, phone, gender, address } = body

    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    const updateData: Record<string, string | boolean> = {}

    if (role !== undefined) {
      const validRoles = ["owner", "admin", "manager", "moderator", "member", "guest"]
      if (!validRoles.includes(role)) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 })
      }
      updateData.role = role
    }

    if (isActive !== undefined) {
      updateData.isActive = Boolean(isActive)
    }

    if (firstName !== undefined) updateData.firstName = firstName
    if (lastName !== undefined) updateData.lastName = lastName
    if (firstName !== undefined || lastName !== undefined) {
      const existing = await db.user.findUnique({ where: { id: userId }, select: { firstName: true, lastName: true } })
      const fn = firstName ?? existing?.firstName ?? ""
      const ln = lastName ?? existing?.lastName ?? ""
      updateData.name = `${fn} ${ln}`.trim()
    }
    if (phone !== undefined) updateData.phone = phone
    if (gender !== undefined) updateData.gender = gender
    if (address !== undefined) updateData.address = address

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
    }

    const updated = await db.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        gender: true,
        address: true,
        role: true,
        isActive: true,
      },
    })

    return NextResponse.json(updated)
  } catch (err) {
    console.error("Failed to update user:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

const createUserSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  gender: z.string().optional(),
  address: z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["admin", "manager", "moderator", "member", "guest"]).default("member"),
})

export async function POST(request: NextRequest) {
  const { error: adminError, user: adminUser } = await requireAdmin()
  if (adminError) return adminError

  try {
    const body = await request.json()
    const parsed = createUserSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { firstName, lastName, email, password, role, phone, gender, address } = parsed.data

    const existingUser = await db.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    const name = `${firstName} ${lastName}`.trim()

    const user = await db.user.create({
      data: {
        name,
        firstName,
        lastName,
        email,
        phone: phone || null,
        gender: gender || null,
        address: address || null,
        passwordHash: hashedPassword,
        role,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        gender: true,
        address: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    })

    await db.auditLog.create({
      data: {
        userId: adminUser!.id,
        action: "USER_CREATED",
        resource: "user",
        resourceId: user.id,
        details: JSON.stringify({ email: user.email, role, createdByName: adminUser!.id }),
        ipAddress: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "unknown",
      },
    })

    return NextResponse.json(user, { status: 201 })
  } catch (err) {
    console.error("Failed to create user:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const { error: adminError, user: adminUser } = await requireAdmin()
  if (adminError) return adminError

  try {
    const body = await request.json()
    const { userId } = body

    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    const targetUser = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true },
    })

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (targetUser.role === "owner") {
      return NextResponse.json({ error: "Cannot delete the owner" }, { status: 400 })
    }

    if (userId === adminUser!.id) {
      return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 })
    }

    await db.user.delete({ where: { id: userId } })

    await db.auditLog.create({
      data: {
        userId: adminUser!.id,
        action: "USER_DELETED",
        resource: "user",
        resourceId: userId,
        details: JSON.stringify({ email: targetUser.email, deletedBy: adminUser!.id }),
        ipAddress: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "unknown",
      },
    })

    return new NextResponse(null, { status: 204 })
  } catch (err) {
    console.error("Failed to delete user:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
