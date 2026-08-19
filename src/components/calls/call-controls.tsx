"use client"

import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  PhoneOff,
  MessageSquare,
  Users,
  Hand,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface CallControlsProps {
  onToggleMic: () => void
  onToggleCamera: () => void
  onShareScreen: () => void
  onEndCall: () => void
  onToggleChat?: () => void
  onToggleParticipants?: () => void
  onRaiseHand?: () => void
  isMuted: boolean
  hasVideo: boolean
  isScreenSharing: boolean
  isChatOpen?: boolean
  isParticipantsOpen?: boolean
  isHandRaised?: boolean
}

export function CallControls({
  onToggleMic,
  onToggleCamera,
  onShareScreen,
  onEndCall,
  onToggleChat,
  onToggleParticipants,
  onRaiseHand,
  isMuted,
  hasVideo,
  isScreenSharing,
  isChatOpen,
  isParticipantsOpen,
  isHandRaised,
}: CallControlsProps) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-background/80 px-4 py-3 backdrop-blur-md ring-1 ring-foreground/10">
      <Button
        variant={isMuted ? "destructive" : "ghost"}
        size="icon"
        onClick={onToggleMic}
        className="rounded-full"
      >
        {isMuted ? <MicOff className="size-5" /> : <Mic className="size-5" />}
      </Button>

      <Button
        variant={!hasVideo ? "destructive" : "ghost"}
        size="icon"
        onClick={onToggleCamera}
        className="rounded-full"
      >
        {hasVideo ? (
          <Video className="size-5" />
        ) : (
          <VideoOff className="size-5" />
        )}
      </Button>

      <Button
        variant={isScreenSharing ? "secondary" : "ghost"}
        size="icon"
        onClick={onShareScreen}
        className={cn(
          "rounded-full",
          isScreenSharing && "bg-primary/20 text-primary"
        )}
      >
        <Monitor className="size-5" />
      </Button>

      {onRaiseHand && (
        <Button
          variant={isHandRaised ? "secondary" : "ghost"}
          size="icon"
          onClick={onRaiseHand}
          className={cn(
            "rounded-full",
            isHandRaised && "bg-yellow-500/20 text-yellow-500"
          )}
        >
          <Hand className="size-5" />
        </Button>
      )}

      {onToggleChat && (
        <Button
          variant={isChatOpen ? "secondary" : "ghost"}
          size="icon"
          onClick={onToggleChat}
          className="rounded-full"
        >
          <MessageSquare className="size-5" />
        </Button>
      )}

      {onToggleParticipants && (
        <Button
          variant={isParticipantsOpen ? "secondary" : "ghost"}
          size="icon"
          onClick={onToggleParticipants}
          className="rounded-full"
        >
          <Users className="size-5" />
        </Button>
      )}

      <div className="mx-1 h-6 w-px bg-border" />

      <Button
        variant="destructive"
        size="icon"
        onClick={onEndCall}
        className="rounded-full"
      >
        <PhoneOff className="size-5" />
      </Button>
    </div>
  )
}
