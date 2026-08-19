"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Bell,
  MessageSquare,
  CheckSquare,
  Calendar,
  AlertCircle,
  Users,
  Heart,
  FileText,
  Settings,
  Trash2,
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

interface NotificationListProps {
  notifications: NotificationData[]
  onRead?: (ids: string[]) => void
  onReadAll?: () => void
}

function getNotificationIcon(type: string) {
  switch (type) {
    case "mention":
      return <AtSignIcon className="size-4" />
    case "message":
      return <MessageSquare className="size-4" />
    case "task":
      return <CheckSquare className="size-4" />
    case "meeting":
      return <Calendar className="size-4" />
    case "system":
      return <Settings className="size-4" />
    case "invitation":
      return <Users className="size-4" />
    case "comment":
      return <MessageSquare className="size-4" />
    case "reaction":
      return <Heart className="size-4" />
    default:
      return <Bell className="size-4" />
  }
}

function getNotificationColor(type: string) {
  switch (type) {
    case "mention":
      return "text-blue-500 bg-blue-500/10"
    case "message":
      return "text-green-500 bg-green-500/10"
    case "task":
      return "text-orange-500 bg-orange-500/10"
    case "meeting":
      return "text-purple-500 bg-purple-500/10"
    case "system":
      return "text-gray-500 bg-gray-500/10"
    case "invitation":
      return "text-indigo-500 bg-indigo-500/10"
    case "comment":
      return "text-cyan-500 bg-cyan-500/10"
    case "reaction":
      return "text-pink-500 bg-pink-500/10"
    default:
      return "text-muted-foreground bg-muted"
  }
}

export function NotificationList({
  notifications,
  onRead,
  onReadAll,
}: NotificationListProps) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())

  const handleClick = React.useCallback(
    async (notification: NotificationData) => {
      if (!notification.isRead && onRead) {
        onRead([notification.id])
      }
      if (notification.url) {
        router.push(notification.url)
      }
    },
    [onRead, router]
  )

  const toggleSelect = React.useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const selectAll = React.useCallback(() => {
    if (selectedIds.size === notifications.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(notifications.map((n) => n.id)))
    }
  }, [selectedIds.size, notifications])

  return (
    <div className="flex flex-col">
      {notifications.length > 0 && (
        <div className="flex items-center justify-between border-b px-4 py-2">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="xs" onClick={selectAll}>
              {selectedIds.size === notifications.length
                ? "Deselect all"
                : "Select all"}
            </Button>
            {selectedIds.size > 0 && (
              <span className="text-xs text-muted-foreground">
                {selectedIds.size} selected
              </span>
            )}
          </div>
          {onReadAll && (
            <Button variant="ghost" size="xs" onClick={onReadAll}>
              Mark all as read
            </Button>
          )}
        </div>
      )}

      {notifications.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Bell className="mb-3 size-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No notifications</p>
        </div>
      )}

      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={cn(
            "group flex items-start gap-3 border-b px-4 py-3 transition-colors hover:bg-muted/50",
            !notification.isRead && "bg-muted/20"
          )}
        >
          <input
            type="checkbox"
            checked={selectedIds.has(notification.id)}
            onChange={() => toggleSelect(notification.id)}
            className="mt-1 size-3.5 shrink-0 rounded border-input accent-primary"
          />

          <div
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-full",
              getNotificationColor(notification.type)
            )}
          >
            {getNotificationIcon(notification.type)}
          </div>

          <button
            onClick={() => handleClick(notification)}
            className="min-w-0 flex-1 text-left"
          >
            <div className="flex items-baseline gap-2">
              <p
                className={cn(
                  "text-sm",
                  notification.isRead
                    ? "text-muted-foreground"
                    : "font-medium text-foreground"
                )}
              >
                {notification.title}
              </p>
              {!notification.isRead && (
                <div className="size-1.5 shrink-0 rounded-full bg-primary" />
              )}
            </div>
            {notification.content && (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {notification.content}
              </p>
            )}
            <span className="mt-0.5 block text-[10px] text-muted-foreground/60">
              {formatDistanceToNow(new Date(notification.createdAt), {
                addSuffix: true,
              })}
            </span>
          </button>
        </div>
      ))}
    </div>
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
