"use client"

import * as React from "react"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface AvatarGroupUser {
  id: string
  name: string
  image?: string | null
}

interface AvatarGroupProps extends React.ComponentProps<"div"> {
  users: AvatarGroupUser[]
  max?: number
  size?: "default" | "sm" | "lg"
}

function AvatarGroup({
  users,
  max = 5,
  size = "default",
  className,
  ...props
}: AvatarGroupProps) {
  const visible = users.slice(0, max)
  const remaining = users.length - max

  return (
    <div
      data-slot="avatar-group"
      className={cn(
        "flex -space-x-2 [&>[data-slot=avatar]]:ring-2 [&>[data-slot=avatar]]:ring-background",
        className
      )}
      {...props}
    >
      {visible.map((user) => (
        <Avatar key={user.id} size={size}>
          {user.image && <AvatarImage src={user.image} alt={user.name} />}
          <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
        </Avatar>
      ))}
      {remaining > 0 && (
        <Avatar size={size}>
          <AvatarFallback>+{remaining}</AvatarFallback>
        </Avatar>
      )}
    </div>
  )
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export { AvatarGroup, type AvatarGroupUser }
