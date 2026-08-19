import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

const USERNAME_COOLDOWN_DAYS = 7

export async function GET() {
  try {
    const session = await auth()
    const userId = (session?.user as any)?.id as string | undefined

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        usernameChangedAt: true,
        avatar: true,
        bio: true,
        jobTitle: true,
        firstName: true,
        lastName: true,
        phone: true,
        gender: true,
        address: true,
        timezone: true,
        language: true,
        status: true,
        customStatus: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Failed to fetch profile:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    const userId = (session?.user as any)?.id as string | undefined

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    const allowedFields = [
      "name",
      "bio",
      "jobTitle",
      "firstName",
      "lastName",
      "phone",
      "gender",
      "address",
      "timezone",
      "language",
      "avatar",
      "customStatus",
    ]

    const updateData: any = {}
    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field] || null
      }
    }

    // Handle username change with cooldown
    if (body.username !== undefined) {
      const newUsername = body.username?.trim() || null

      if (newUsername && newUsername !== "") {
        // Validate format
        if (newUsername.length < 3) {
          return NextResponse.json({ error: "Username must be at least 3 characters" }, { status: 400 })
        }
        if (!/^[a-zA-Z0-9_-]+$/.test(newUsername)) {
          return NextResponse.json({ error: "Username can only contain letters, numbers, underscores, and hyphens" }, { status: 400 })
        }

        // Check cooldown
        const currentUser = await db.user.findUnique({
          where: { id: userId },
          select: { username: true, usernameChangedAt: true },
        })

        if (currentUser?.usernameChangedAt) {
          const lastChanged = new Date(currentUser.usernameChangedAt)
          const cooldownEnd = new Date(lastChanged.getTime() + USERNAME_COOLDOWN_DAYS * 24 * 60 * 60 * 1000)
          if (new Date() < cooldownEnd) {
            const daysLeft = Math.ceil((cooldownEnd.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
            return NextResponse.json(
              { error: `You can change your username again in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}` },
              { status: 400 }
            )
          }
        }

        // Check uniqueness
        if (newUsername !== currentUser?.username) {
          const existing = await db.user.findUnique({ where: { username: newUsername } })
          if (existing) {
            return NextResponse.json({ error: "This username is already taken" }, { status: 400 })
          }
        }

        updateData.username = newUsername
        updateData.usernameChangedAt = new Date()
      }
    }

    const user = await db.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        usernameChangedAt: true,
        avatar: true,
        bio: true,
        jobTitle: true,
        firstName: true,
        lastName: true,
        phone: true,
        gender: true,
        address: true,
        timezone: true,
        language: true,
        status: true,
        customStatus: true,
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error("Failed to update profile:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
