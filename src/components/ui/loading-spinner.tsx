"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Loader2Icon } from "lucide-react"

interface LoadingSpinnerProps extends React.ComponentProps<"div"> {
  size?: "sm" | "default" | "lg"
  label?: string
}

const spinnerSizes = {
  sm: "size-4",
  default: "size-6",
  lg: "size-8",
}

function LoadingSpinner({
  size = "default",
  label,
  className,
  ...props
}: LoadingSpinnerProps) {
  return (
    <div
      data-slot="loading-spinner"
      className={cn(
        "flex flex-col items-center justify-center gap-2",
        className
      )}
      role="status"
      {...props}
    >
      <Loader2Icon
        className={cn("animate-spin text-muted-foreground", spinnerSizes[size])}
      />
      {label && (
        <p className="text-sm text-muted-foreground">{label}</p>
      )}
      <span className="sr-only">Loading...</span>
    </div>
  )
}

type SkeletonProps = React.ComponentProps<"div">

function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-lg bg-muted", className)}
      {...props}
    />
  )
}

export { LoadingSpinner, Skeleton }
