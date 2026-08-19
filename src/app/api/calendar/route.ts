import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const userId = (session?.user as any)?.id as string | undefined

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    })

    const { searchParams } = new URL(request.url)
    const month = searchParams.get("month")
    const year = searchParams.get("year")

    const where: any = {
      OR: [
        // Events the user created
        { creatorId: userId },
        // Events where user is a participant
        { participants: { some: { userId } } },
        // Public events in the user's workspace
        { visibility: "public" },
        // Events explicitly shared with this user
        { visibleToUsers: { some: { userId } } },
      ],
    }

    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1)
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59)
      where.startTime = { gte: startDate }
      where.endTime = { lte: endDate }
    }

    const events = await db.calendarEvent.findMany({
      where,
      include: {
        participants: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
        },
        visibleToUsers: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
        },
        creator: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { startTime: "asc" },
    })

    return NextResponse.json(events)
  } catch (error) {
    console.error("Failed to fetch calendar events:", error)
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
      location,
      meetingLink,
      startTime,
      endTime,
      allDay,
      recurrence,
      color,
      type,
      participantIds,
      visibility,
      visibleToUserIds,
      reminderMinutes,
    } = body

    if (!title || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Title, start time, and end time are required" },
        { status: 400 }
      )
    }

    const validVisibility = ["public", "private", "restricted"].includes(visibility)
      ? visibility
      : "private"

    const event = await db.calendarEvent.create({
      data: {
        title,
        description: description || null,
        location: location || null,
        meetingLink: meetingLink || null,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        allDay: allDay || false,
        recurrence: recurrence || null,
        color: color || null,
        type: type || "event",
        visibility: validVisibility,
        creatorId: userId,
        participants: participantIds?.length
          ? {
              create: participantIds.map((id: string) => ({
                userId: id,
                role: "attendee",
              })),
            }
          : undefined,
        visibleToUsers: validVisibility === "restricted" && visibleToUserIds?.length
          ? {
              create: visibleToUserIds.map((id: string) => ({
                userId: id,
              })),
            }
          : undefined,
        reminders: reminderMinutes?.length
          ? {
              create: reminderMinutes.map((minutes: number) => ({
                minutes,
              })),
            }
          : undefined,
      },
      include: {
        participants: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
        },
        visibleToUsers: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
        },
        creator: { select: { id: true, name: true, avatar: true } },
      },
    })

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    console.error("Failed to create calendar event:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
