"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Bell,
  MessageSquare,
  CheckSquare,
  Calendar,
  Settings,
  Users,
  Heart,
  ArrowRight,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface NotificationData {
  id: string
  type: string
  title: string
  content?: string | null
  url?: string | null
  isRead: boolean
  createdAt: string
}

interface NotificationBellProps {
  count: number
  recentNotifications: NotificationData[]
}

function getNotificationIcon(type: string) {
  switch (type) {
    case "mention":
      return <AtSignIcon className="size-3.5" />
    case "message":
      return <MessageSquare className="size-3.5" />
    case "task":
      return <CheckSquare className="size-3.5" />
    case "meeting":
      return <Calendar className="size-3.5" />
    case "system":
      return <Settings className="size-3.5" />
    case "invitation":
      return <Users className="size-3.5" />
    case "reaction":
      return <Heart className="size-3.5" />
    default:
      return <Bell className="size-3.5" />
  }
}

export function NotificationBell({ count, recentNotifications }: NotificationBellProps) {
  const router = useRouter()

  const handleMarkAllRead = React.useCallback(async () => {
    try {
      await fetch("/api/notifications/read-all", { method: "POST" })
      router.refresh()
    } catch (error) {
      console.error("Failed to mark all as read:", error)
    }
  }, [router])

  const handleClick = React.useCallback(
    async (notification: NotificationData) => {
      if (!notification.isRead) {
        try {
          await fetch("/api/notifications", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids: [notification.id], isRead: true }),
          })
        } catch (error) {
          console.error("Failed to mark as read:", error)
        }
      }
      if (notification.url) {
        router.push(notification.url)
      } else {
        router.push("/notifications")
      }
    },
    [router]
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon-sm" className="relative" />
        }
      >
        <Bell className="size-4" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[9px] font-medium text-destructive-foreground">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2 py-1.5">
          <span className="text-sm font-semibold">Notifications</span>
          {count > 0 && (
            <Button variant="ghost" size="xs" onClick={handleMarkAllRead}>
              Mark all read
            </Button>
          )}
        </div>

        <DropdownMenuSeparator />

        {recentNotifications.length === 0 && (
          <div className="flex flex-col items-center py-8 text-center">
            <Bell className="mb-2 size-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No notifications</p>
          </div>
        )}

        {recentNotifications.slice(0, 8).map((notification) => (
          <DropdownMenuItem
            key={notification.id}
            onClick={() => handleClick(notification)}
            className={cn(
              "flex items-start gap-2.5 px-2 py-2",
              !notification.isRead && "bg-muted/30"
            )}
          >
            <div className="mt-0.5 text-muted-foreground">
              {getNotificationIcon(notification.type)}
            </div>
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "text-xs",
                  notification.isRead
                    ? "text-muted-foreground"
                    : "font-medium text-foreground"
                )}
              >
                {notification.title}
              </p>
              {notification.content && (
                <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                  {notification.content}
                </p>
              )}
              <span className="mt-0.5 block text-[10px] text-muted-foreground/60">
                {formatDistanceToNow(new Date(notification.createdAt), {
                  addSuffix: true,
                })}
              </span>
            </div>
            {!notification.isRead && (
              <div className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
            )}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => router.push("/notifications")}
          className="justify-center text-xs text-muted-foreground"
        >
          View all notifications
          <ArrowRight className="ml-1 size-3" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function AtSignIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8" />
    </svg>
  )
}
