"use client"

import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Zap,
  Play,
  Bell,
  MessageSquare,
  CheckCircle,
  ArrowRight,
  Pencil,
  Trash2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { AutomationData } from "@/lib/types/automation"

interface AutomationCardProps {
  automation: AutomationData
  onToggle?: (id: string, enabled: boolean) => void
  onEdit?: (automation: AutomationData) => void
  onDelete?: (id: string) => void
}

function parseJsonSafe<T>(str: string, fallback: T): T {
  try {
    return JSON.parse(str) as T
  } catch {
    return fallback
  }
}

function getTriggerLabel(triggerType: string): string {
  const labels: Record<string, string> = {
    "task.overdue": "Task becomes overdue",
    "task.completed": "Task is completed",
    "project.completed": "Project is completed",
    "user.joins": "User joins workspace",
    "meeting.started": "Meeting starts",
    "message.sent": "Message is sent",
    "file.uploaded": "File is uploaded",
    "comment.added": "Comment is added",
  }
  return labels[triggerType] || triggerType
}

function getActionIcon(actionType: string) {
  switch (actionType) {
    case "notify":
      return <Bell className="size-3.5" />
    case "message":
      return <MessageSquare className="size-3.5" />
    case "status_change":
      return <CheckCircle className="size-3.5" />
    default:
      return <ArrowRight className="size-3.5" />
  }
}

function getActionLabel(actionType: string): string {
  const labels: Record<string, string> = {
    notify: "Send notification",
    message: "Send message",
    status_change: "Change status",
    create_task: "Create task",
    change_user_status: "Change user status",
  }
  return labels[actionType] || actionType
}

export function AutomationCard({
  automation,
  onToggle,
  onEdit,
  onDelete,
}: AutomationCardProps) {
  const trigger = parseJsonSafe<{ type: string; event: string }>(
    automation.trigger,
    { type: "event", event: "unknown" }
  )
  const actions = parseJsonSafe<Array<{ type: string }>>(
    automation.actions,
    []
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex size-9 items-center justify-center rounded-lg",
                automation.isEnabled
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <Zap className="size-4.5" />
            </div>
            <div>
              <CardTitle>{automation.name}</CardTitle>
              {automation.description && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {automation.description}
                </p>
              )}
            </div>
          </div>
          <Switch
            checked={automation.isEnabled}
            onCheckedChange={(checked) => onToggle?.(automation.id, checked)}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-mono text-[10px]">
              WHEN
            </Badge>
            <span className="text-sm">
              {getTriggerLabel(trigger.event)}
            </span>
          </div>

          {actions.length > 0 && (
            <div className="space-y-1.5">
              {actions.map((action, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-[10px]">
                    THEN
                  </Badge>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    {getActionIcon(action.type)}
                    {getActionLabel(action.type)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t">
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(automation)}
            >
              <Pencil className="mr-1 size-3" />
              Edit
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(automation.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="mr-1 size-3" />
              Delete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
