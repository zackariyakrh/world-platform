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

function maskApiKey(key: string): string {
  if (!key || key.length <= 8) return "••••••••"
  return "••••••••" + key.slice(-4)
}

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const providers = await db.aIProvider.findMany({
    orderBy: { name: "asc" },
    include: {
      models: {
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          displayName: true,
          modelId: true,
          maxTokens: true,
          temperature: true,
          isEnabled: true,
          isDefault: true,
        },
      },
    },
  })

  const masked = providers.map((p) => ({
    ...p,
    apiKey: maskApiKey(p.apiKey),
  }))

  return NextResponse.json(masked)
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const body = await request.json()
    const { name, displayName, apiKey, baseUrl, isEnabled, models } = body

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Provider name is required" }, { status: 400 })
    }

    const provider = await db.aIProvider.upsert({
      where: { name },
      create: {
        name,
        displayName: displayName || name,
        apiKey: apiKey || "",
        baseUrl: baseUrl || null,
        isEnabled: isEnabled !== false,
        models: models
          ? {
              create: models.map((m: {
                name: string
                displayName?: string
                modelId: string
                maxTokens?: number
                temperature?: number
                isEnabled?: boolean
                isDefault?: boolean
              }) => ({
                name: m.name,
                displayName: m.displayName || m.name,
                modelId: m.modelId,
                maxTokens: m.maxTokens || 4096,
                temperature: m.temperature || 0.7,
                isEnabled: m.isEnabled !== false,
                isDefault: m.isDefault || false,
              })),
            }
          : undefined,
      },
      update: {
        displayName: displayName || undefined,
        apiKey: apiKey || undefined,
        baseUrl: baseUrl !== undefined ? baseUrl : undefined,
        isEnabled: isEnabled !== undefined ? isEnabled : undefined,
      },
    })

    return NextResponse.json({
      ...provider,
      apiKey: maskApiKey(provider.apiKey),
    })
  } catch (err) {
    console.error("Failed to save AI provider:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const { searchParams } = new URL(request.url)
    const name = searchParams.get("name")

    if (!name) {
      return NextResponse.json({ error: "Provider name is required" }, { status: 400 })
    }

    await db.aIProvider.delete({ where: { name } })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Failed to delete AI provider:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
