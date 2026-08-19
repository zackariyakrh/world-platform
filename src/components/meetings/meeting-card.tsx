"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { Video, Clock, Users } from "lucide-react"

type MeetingData = {
  id: string
  title: string
  description?: string | null
  startTime: string | Date
  endTime?: string | Date | null
  status: string
  roomId: string
  participants: Array<{
    id: string
    role: string
    user: { id: string; name: string | null; avatar: string | null }
  }>
  creator: { id: string; name: string | null; avatar: string | null }
}

interface MeetingCardProps {
  meeting: MeetingData
  isPast?: boolean
}

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-500/10 text-blue-500 border-blue-500/20 shadow-[0_0_8px_oklch(0.60_0.20_250_/_0.15)]",
  active: "bg-green-500/10 text-green-500 border-green-500/20 shadow-[0_0_8px_oklch(0.65_0.20_155_/_0.15)] animate-[glow-pulse_2s_ease-in-out_infinite]",
  ended: "bg-muted text-muted-foreground border-border",
  cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
}

function getInitials(name: string | null): string {
  if (!name) return "?"
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function getDuration(start: string | Date, end?: string | Date | null): string {
  const s = new Date(start)
  const e = end ? new Date(end) : new Date(s.getTime() + 60 * 60 * 1000)
  const mins = Math.round((e.getTime() - s.getTime()) / 60000)
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  const remaining = mins % 60
  return remaining > 0 ? `${hrs}h ${remaining}m` : `${hrs}h`
}

export function MeetingCard({ meeting, isPast }: MeetingCardProps) {
  const startTime = new Date(meeting.startTime)
  const isJoinable =
    meeting.status === "scheduled" || meeting.status === "active"

  return (
    <div
      className={cn(
        "glow-card flex flex-col rounded-xl border border-border p-4 transition-all duration-300",
        isPast ? "opacity-70" : ""
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-foreground">
            {meeting.title}
          </h3>
          {meeting.description && (
            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
              {meeting.description}
            </p>
          )}
        </div>
        <Badge
          variant="outline"
          className={cn(
            "shrink-0 text-[10px] capitalize",
            statusColors[meeting.status] || statusColors.scheduled
          )}
        >
          {meeting.status}
        </Badge>
      </div>

      <div className="mt-3 flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="size-3.5" />
          {format(startTime, "MMM d, yyyy")} at {format(startTime, "h:mm a")}
          <span className="text-muted-foreground/60">
            ({getDuration(meeting.startTime, meeting.endTime)})
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="size-3.5" />
          {meeting.participants.length} participant
          {meeting.participants.length !== 1 ? "s" : ""}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <div className="flex -space-x-2">
          {meeting.participants.slice(0, 4).map((p) => (
            <Avatar key={p.id} size="sm">
              <AvatarImage src={p.user.avatar || undefined} />
              <AvatarFallback>{getInitials(p.user.name)}</AvatarFallback>
            </Avatar>
          ))}
          {meeting.participants.length > 4 && (
            <div className="flex size-6 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground ring-2 ring-background">
              +{meeting.participants.length - 4}
            </div>
          )}
        </div>

        <div className="ml-auto">
          {isJoinable ? (
            <Button size="sm" className="glow-button">
              <Video className="size-3.5" />
              Join
            </Button>
          ) : (
            <Button size="sm" variant="outline" disabled>
              Ended
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
