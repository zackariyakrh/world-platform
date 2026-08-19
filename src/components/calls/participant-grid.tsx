"use client"

import { Mic, MicOff } from "lucide-react"
import { cn } from "@/lib/utils"

interface Participant {
  id: string
  name: string
  hasVideo: boolean
  isMuted: boolean
  isScreenSharing: boolean
}

interface ParticipantGridProps {
  participants: Participant[]
}

function getGridClass(count: number) {
  if (count <= 1) return "grid-cols-1"
  if (count === 2) return "grid-cols-2"
  if (count <= 4) return "grid-cols-2"
  if (count <= 6) return "grid-cols-3"
  return "grid-cols-4"
}

function ParticipantTile({ participant }: { participant: Participant }) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-muted ring-1 ring-foreground/10">
      {participant.hasVideo ? (
        <div className="flex size-full items-center justify-center bg-gradient-to-br from-muted to-muted/50">
          <div className="flex size-20 items-center justify-center rounded-full bg-primary/10 text-2xl font-semibold text-primary">
            {participant.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)}
          </div>
        </div>
      ) : (
        <div className="flex size-full items-center justify-center bg-gradient-to-br from-muted to-muted/50">
          <div className="flex size-20 items-center justify-center rounded-full bg-primary/10 text-2xl font-semibold text-primary">
            {participant.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)}
          </div>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-gradient-to-t from-black/60 to-transparent p-3">
        <span className="text-sm font-medium text-white">{participant.name}</span>
        {participant.isMuted && (
          <div className="rounded-full bg-red-500/80 p-1">
            <MicOff className="size-3 text-white" />
          </div>
        )}
      </div>

      {participant.isScreenSharing && (
        <div className="absolute top-2 left-2 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
          Sharing
        </div>
      )}
    </div>
  )
}

export function ParticipantGrid({ participants }: ParticipantGridProps) {
  const screenSharer = participants.find((p) => p.isScreenSharing)

  if (screenSharer) {
    const others = participants.filter((p) => p.id !== screenSharer.id)
    return (
      <div className="flex size-full flex-col gap-2">
        <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl bg-muted ring-1 ring-foreground/10">
          <ParticipantTile participant={screenSharer} />
        </div>
        {others.length > 0 && (
          <div className="flex h-28 gap-2 overflow-x-auto">
            {others.map((p) => (
              <div key={p.id} className="h-full w-40 shrink-0">
                <ParticipantTile participant={p} />
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      className={cn(
        "grid size-full gap-2",
        getGridClass(participants.length)
      )}
    >
      {participants.map((p) => (
        <ParticipantTile key={p.id} participant={p} />
      ))}
    </div>
  )
}
