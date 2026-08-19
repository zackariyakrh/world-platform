"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Check, Lock } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface PollVoteData {
  id: string
  userId: string
}

interface PollOptionData {
  id: string
  text: string
  votes: PollVoteData[]
}

interface PollData {
  id: string
  question: string
  isAnonymous: boolean
  allowMultiple: boolean
  expiresAt: string | null
  options: PollOptionData[]
}

interface PollCardProps {
  poll: PollData
  onVote: (optionId: string) => void
  currentUserId?: string
}

export function PollCard({ poll, onVote, currentUserId }: PollCardProps) {
  const totalVotes = poll.options.reduce(
    (sum, opt) => sum + opt.votes.length,
    0
  )

  const userVotedOptionIds = currentUserId
    ? poll.options
        .filter((opt) => opt.votes.some((v) => v.userId === currentUserId))
        .map((opt) => opt.id)
    : []

  const hasVoted = userVotedOptionIds.length > 0
  const isExpired =
    poll.expiresAt && new Date(poll.expiresAt) < new Date()

  return (
    <div className="rounded-xl border p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <h4 className="text-sm font-semibold">{poll.question}</h4>
        <div className="flex shrink-0 gap-1.5">
          {poll.isAnonymous && (
            <Badge variant="secondary" className="text-[10px]">
              <Lock className="mr-1 size-2.5" />
              Anonymous
            </Badge>
          )}
          {poll.allowMultiple && (
            <Badge variant="secondary" className="text-[10px]">
              Multi-select
            </Badge>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {poll.options.map((option) => {
          const voteCount = option.votes.length
          const percentage =
            totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0
          const isSelected = userVotedOptionIds.includes(option.id)

          return (
            <div key={option.id} className="relative">
              {hasVoted || isExpired ? (
                <div className="relative overflow-hidden rounded-lg border">
                  <div
                    className={cn(
                      "absolute inset-0 rounded-lg transition-all duration-500",
                      isSelected ? "bg-primary/15" : "bg-muted/50"
                    )}
                    style={{ width: `${percentage}%` }}
                  />
                  <div className="relative flex items-center justify-between px-3 py-2">
                    <div className="flex items-center gap-2">
                      {isSelected && (
                        <Check className="size-3.5 text-primary" />
                      )}
                      <span className="text-sm">{option.text}</span>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">
                      {percentage}%
                    </span>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => onVote(option.id)}
                  disabled={!!isExpired}
                >
                  {option.text}
                </Button>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
        </span>
        {poll.expiresAt && (
          <span>
            {isExpired
              ? "Ended"
              : `Ends ${formatDistanceToNow(new Date(poll.expiresAt), { addSuffix: true })}`}
          </span>
        )}
      </div>
    </div>
  )
}
