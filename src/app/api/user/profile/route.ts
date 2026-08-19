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

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
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

    const user = await db.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
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
