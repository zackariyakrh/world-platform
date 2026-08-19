"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type StatusType = "online" | "away" | "busy" | "dnd" | "offline"

interface StatusBadgeProps extends React.ComponentProps<"span"> {
  status: StatusType
  size?: "sm" | "default" | "lg"
}

const statusColors: Record<StatusType, string> = {
  online: "bg-emerald-500",
  away: "bg-amber-500",
  busy: "bg-red-500",
  dnd: "bg-red-500",
  offline: "bg-muted-foreground/50",
}

const statusSizes: Record<string, string> = {
  sm: "size-2",
  default: "size-2.5",
  lg: "size-3",
}

function StatusBadge({
  status,
  size = "default",
  className,
  ...props
}: StatusBadgeProps) {
  return (
    <span
      data-slot="status-badge"
      className={cn(
        "inline-block shrink-0 rounded-full ring-2 ring-background",
        statusColors[status],
        statusSizes[size],
        className
      )}
      title={status}
      {...props}
    />
  )
}

export { StatusBadge, type StatusType }
