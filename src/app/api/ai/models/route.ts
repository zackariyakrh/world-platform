import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const models = await db.aIModel.findMany({
      where: { isEnabled: true },
      include: { provider: { select: { id: true, name: true, displayName: true } } },
      orderBy: [{ provider: { displayName: "asc" } }, { name: "asc" }],
    })

    return NextResponse.json({ models })
  } catch (error) {
    console.error("GET /api/ai/models error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
