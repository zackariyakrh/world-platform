import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

interface EventRouteParams {
  params: Promise<{ eventId: string }>
}

export async function GET(request: NextRequest, { params }: EventRouteParams) {
  try {
    const session = await auth()
    const userId = (session?.user as any)?.id as string | undefined

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { eventId } = await params

    const event = await db.calendarEvent.findUnique({
      where: { id: eventId },
      include: {
        participants: {
          include: {
            user: { select: { id: true, name: true, avatar: true, email: true } },
          },
        },
        creator: { select: { id: true, name: true, avatar: true } },
        reminders: true,
      },
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    return NextResponse.json(event)
  } catch (error) {
    console.error("Failed to fetch event:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: EventRouteParams) {
  try {
    const session = await auth()
    const userId = (session?.user as any)?.id as string | undefined

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { eventId } = await params
    const body = await request.json()

    const existing = await db.calendarEvent.findUnique({
      where: { id: eventId },
      select: { id: true, creatorId: true },
    })

    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    const updateData: any = {}
    const allowedFields = [
      "title",
      "description",
      "location",
      "meetingLink",
      "startTime",
      "endTime",
      "allDay",
      "recurrence",
      "color",
      "type",
    ]

    for (const field of allowedFields) {
      if (field in body) {
        if (field === "startTime" || field === "endTime") {
          updateData[field] = new Date(body[field])
        } else {
          updateData[field] = body[field]
        }
      }
    }

    if (body.participantIds) {
      await db.eventParticipant.deleteMany({ where: { eventId } })
      if (body.participantIds.length > 0) {
        updateData.participants = {
          create: body.participantIds.map((id: string) => ({
            userId: id,
            role: "attendee",
          })),
        }
      }
    }

    if (body.reminderMinutes) {
      await db.eventReminder.deleteMany({ where: { eventId } })
      if (body.reminderMinutes.length > 0) {
        updateData.reminders = {
          create: body.reminderMinutes.map((minutes: number) => ({
            minutes,
          })),
        }
      }
    }

    const event = await db.calendarEvent.update({
      where: { id: eventId },
      data: updateData,
      include: {
        participants: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
        },
        creator: { select: { id: true, name: true, avatar: true } },
        reminders: true,
      },
    })

    return NextResponse.json(event)
  } catch (error) {
    console.error("Failed to update event:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: EventRouteParams) {
  try {
    const session = await auth()
    const userId = (session?.user as any)?.id as string | undefined

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { eventId } = await params

    const existing = await db.calendarEvent.findUnique({
      where: { id: eventId },
      select: { id: true, creatorId: true },
    })

    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    await db.calendarEvent.delete({ where: { id: eventId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete event:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
