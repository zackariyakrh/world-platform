import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { CalendarView } from "@/components/calendar/calendar-view"
import { startOfMonth, endOfMonth } from "date-fns"
import { CalendarDays } from "lucide-react"

export default async function CalendarPage() {
  const session = await auth()
  const userId = (session?.user as any)?.id as string | undefined

  if (!userId) return null

  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  const events = await db.calendarEvent.findMany({
    where: {
      OR: [
        { creatorId: userId },
        { participants: { some: { userId } } },
      ],
      startTime: { gte: monthStart },
      endTime: { lte: monthEnd },
    },
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

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-1">
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground glow-text">
          <CalendarDays className="size-6 text-primary drop-shadow-[0_0_8px_oklch(from_var(--primary)_l_c_h_/_0.4)]" />
          Calendar
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your events, meetings, and deadlines.
        </p>
      </div>
      <CalendarView initialEvents={events as any} />
    </div>
  )
}
