"use client"

import { useState, useEffect, useCallback } from "react"
import {
  PhoneOff,
  Users,
  MessageSquare,
  X,
  Wifi,
  WifiOff,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { CallControls } from "./call-controls"
import { ParticipantGrid } from "./participant-grid"
import { cn } from "@/lib/utils"

interface CallParticipantData {
  id: string
  userId: string
  joinedAt: string
  leftAt: string | null
  user: {
    id: string
    name: string | null
    avatar: string | null
  }
}

interface CallOverlayProps {
  callId: string
  participants: CallParticipantData[]
  isHost: boolean
  onEndCall?: () => void
}

export function CallOverlay({
  callId,
  participants: initialParticipants,
  isHost,
  onEndCall,
}: CallOverlayProps) {
  const [isMuted, setIsMuted] = useState(false)
  const [hasVideo, setHasVideo] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [isHandRaised, setIsHandRaised] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [showParticipants, setShowParticipants] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "connecting" | "disconnected"
  >("connecting")

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((s) => s + 1)
    }, 1000)

    const connectTimeout = setTimeout(() => {
      setConnectionStatus("connected")
    }, 1500)

    return () => {
      clearInterval(timer)
      clearTimeout(connectTimeout)
    }
  }, [])

  const formatDuration = useCallback((totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    }
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
  }, [])

  const activeParticipants = initialParticipants.filter((p) => !p.leftAt)

  const gridParticipants = activeParticipants.map((p) => ({
    id: p.userId,
    name: p.user.name || "Unknown",
    hasVideo,
    isMuted: isMuted && p.userId === initialParticipants[0]?.userId,
    isScreenSharing: false,
  }))

  const handleEndCall = useCallback(() => {
    onEndCall?.()
  }, [onEndCall])

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold">Call</h2>
          <div className="flex items-center gap-1.5">
            {connectionStatus === "connected" && (
              <Wifi className="size-3.5 text-green-500" />
            )}
            {connectionStatus === "connecting" && (
              <Loader2 className="size-3.5 animate-spin text-yellow-500" />
            )}
            {connectionStatus === "disconnected" && (
              <WifiOff className="size-3.5 text-red-500" />
            )}
            <span className="text-xs text-muted-foreground">
              {connectionStatus === "connected" && "Connected"}
              {connectionStatus === "connecting" && "Connecting..."}
              {connectionStatus === "disconnected" && "Disconnected"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="secondary">
            {formatDuration(elapsedSeconds)}
          </Badge>
          <Badge variant="secondary">
            <Users className="mr-1 size-3" />
            {activeParticipants.length}
          </Badge>
        </div>
      </div>

      {/* Main content area */}
      <div className="relative flex min-h-0 flex-1">
        {/* Video grid */}
        <div className="flex-1 p-4">
          {gridParticipants.length > 0 ? (
            <ParticipantGrid participants={gridParticipants} />
          ) : (
            <div className="flex size-full items-center justify-center">
              <p className="text-muted-foreground">Waiting for participants...</p>
            </div>
          )}
        </div>

        {/* Participants sidebar */}
        {showParticipants && (
          <div className="w-72 border-l">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="text-sm font-semibold">Participants</h3>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setShowParticipants(false)}
              >
                <X className="size-4" />
              </Button>
            </div>
            <ScrollArea className="h-[calc(100%-48px)]">
              <div className="space-y-1 p-2">
                {activeParticipants.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 rounded-lg px-3 py-2"
                  >
                    <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                      {p.user.name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2) || "?"}
                    </div>
                    <div className="flex-1 truncate">
                      <p className="text-sm font-medium">{p.user.name || "Unknown"}</p>
                      {p.userId === initialParticipants[0]?.userId && (
                        <p className="text-xs text-muted-foreground">Host</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>

      {/* Controls bar */}
      <div className="flex justify-center border-t px-4 py-4">
        <CallControls
          onToggleMic={() => setIsMuted((m) => !m)}
          onToggleCamera={() => setHasVideo((v) => !v)}
          onShareScreen={() => setIsScreenSharing((s) => !s)}
          onEndCall={handleEndCall}
          onToggleChat={() => setShowChat((c) => !c)}
          onToggleParticipants={() => setShowParticipants((p) => !p)}
          onRaiseHand={() => setIsHandRaised((h) => !h)}
          isMuted={isMuted}
          hasVideo={hasVideo}
          isScreenSharing={isScreenSharing}
          isChatOpen={showChat}
          isParticipantsOpen={showParticipants}
          isHandRaised={isHandRaised}
        />
      </div>
    </div>
  )
}
