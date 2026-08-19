import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { MeetingCard } from "@/components/meetings/meeting-card"
import { MeetingDialog } from "@/components/meetings/meeting-dialog"
import { Button } from "@/components/ui/button"
import { Video, Plus } from "lucide-react"

export default async function MeetingsPage() {
  const session = await auth()
  const userId = (session?.user as any)?.id as string | undefined

  if (!userId) return null

  const now = new Date()

  const [upcomingMeetings, pastMeetings] = await Promise.all([
    db.meeting.findMany({
      where: {
        OR: [
          { creatorId: userId },
          { participants: { some: { userId } } },
        ],
        startTime: { gte: now },
        status: { notIn: ["cancelled"] },
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
    }),
    db.meeting.findMany({
      where: {
        OR: [
          { creatorId: userId },
          { participants: { some: { userId } } },
        ],
        AND: [
          {
            OR: [
              { startTime: { lt: now } },
              { status: { in: ["ended", "cancelled"] } },
            ],
          },
        ],
      },
      include: {
        participants: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
        },
        creator: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { startTime: "desc" },
      take: 20,
    }),
  ])

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground glow-text">
            <Video className="size-6 text-primary drop-shadow-[0_0_8px_oklch(from_var(--primary)_l_c_h_/_0.4)]" />
            Meetings
          </h1>
          <p className="text-sm text-muted-foreground">
            Schedule and join video meetings.
          </p>
        </div>
        <MeetingDialog>
          <Button>
            <Plus className="size-4" />
            New Meeting
          </Button>
        </MeetingDialog>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          Upcoming ({upcomingMeetings.length})
        </h2>
        {upcomingMeetings.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-border py-12 text-center">
            <Video className="size-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              No upcoming meetings
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingMeetings.map((meeting) => (
              <MeetingCard key={meeting.id} meeting={meeting as any} />
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          Past ({pastMeetings.length})
        </h2>
        {pastMeetings.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No past meetings
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pastMeetings.map((meeting) => (
              <MeetingCard key={meeting.id} meeting={meeting as any} isPast />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
