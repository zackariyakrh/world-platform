import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { getAllSettings, setSetting } from "@/lib/settings"

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

  const settings = await getAllSettings()
  return NextResponse.json(settings)
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const body = await request.json()
    const { settings } = body

    if (!settings || typeof settings !== "object") {
      return NextResponse.json(
        { error: "settings object is required" },
        { status: 400 }
      )
    }

    const entries = Object.entries(settings) as [string, string][]
    for (const [key, value] of entries) {
      if (typeof key === "string" && typeof value === "string") {
        await setSetting(key, value)
      }
    }

    const updatedSettings = await getAllSettings()
    return NextResponse.json(updatedSettings)
  } catch (err) {
    console.error("Failed to update settings:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
