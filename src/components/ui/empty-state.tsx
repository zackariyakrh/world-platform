"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { LucideIcon } from "lucide-react"

interface EmptyStateProps extends React.ComponentProps<"div"> {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex flex-col items-center justify-center gap-4 py-16 text-center",
        className
      )}
      {...props}
    >
      {Icon && (
        <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <Icon className="size-6" />
        </div>
      )}
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-medium text-foreground">{title}</h3>
        {description && (
          <p className="text-base text-muted-foreground">{description}</p>
        )}
      </div>
      {action && (
        <Button variant="outline" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}

export { EmptyState }
