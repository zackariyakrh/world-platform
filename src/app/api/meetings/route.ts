import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { randomBytes } from "crypto"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const userId = (session?.user as any)?.id as string | undefined

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    const where: any = {
      OR: [
        { creatorId: userId },
        { participants: { some: { userId } } },
      ],
    }

    if (status) {
      where.status = status
    }

    const meetings = await db.meeting.findMany({
      where,
      include: {
        participants: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
        },
        creator: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { startTime: "asc" },
    })

    return NextResponse.json(meetings)
  } catch (error) {
    console.error("Failed to fetch meetings:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const userId = (session?.user as any)?.id as string | undefined

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      description,
      startTime,
      duration,
      participantIds,
      isRecorded,
      password,
    } = body

    if (!title || !startTime) {
      return NextResponse.json(
        { error: "Title and start time are required" },
        { status: 400 }
      )
    }

    const roomId = randomBytes(16).toString("hex")
    const start = new Date(startTime)
    const end = new Date(start.getTime() + (duration || 60) * 60 * 1000)

    const meeting = await db.meeting.create({
      data: {
        title,
        description: description || null,
        startTime: start,
        endTime: end,
        roomId,
        password: password || null,
        isRecorded: isRecorded || false,
        creatorId: userId,
        participants: {
          create: [
            { userId, role: "host" },
            ...(participantIds || [])
              .filter((id: string) => id !== userId)
              .map((id: string) => ({
                userId: id,
                role: "participant" as const,
              })),
          ],
        },
      },
      include: {
        participants: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
        },
        creator: { select: { id: true, name: true, avatar: true } },
      },
    })

    return NextResponse.json(meeting, { status: 201 })
  } catch (error) {
    console.error("Failed to create meeting:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
