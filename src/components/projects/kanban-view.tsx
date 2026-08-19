"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { Plus, GripVertical } from "lucide-react"

interface KanbanTask {
  id: string
  title: string
  status: string
  priority: string
  assigneeId: string | null
  assignee?: {
    id: string
    name: string | null
    avatar: string | null
  }
  dueDate: string | null
  order: number
}

interface KanbanViewProps {
  tasks: KanbanTask[]
  onTaskMove: (taskId: string, newStatus: string) => void
  onTaskClick?: (task: KanbanTask) => void
  onAddTask?: (status: string) => void
}

interface KanbanColumn {
  id: string
  label: string
  color: string
}

const columns: KanbanColumn[] = [
  { id: "backlog", label: "Backlog", color: "bg-gray-400" },
  { id: "todo", label: "To Do", color: "bg-blue-500" },
  { id: "in_progress", label: "In Progress", color: "bg-amber-500" },
  { id: "review", label: "Review", color: "bg-purple-500" },
  { id: "blocked", label: "Blocked", color: "bg-red-500" },
  { id: "done", label: "Done", color: "bg-emerald-500" },
]

const priorityDot: Record<string, string> = {
  low: "bg-blue-400",
  medium: "bg-amber-400",
  high: "bg-orange-400",
  urgent: "bg-red-500",
}

const priorityLabel: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
}

function getInitials(name: string | null): string {
  if (!name) return "?"
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function KanbanView({ tasks, onTaskMove, onTaskClick, onAddTask }: KanbanViewProps) {
  const [draggedTask, setDraggedTask] = React.useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = React.useState<string | null>(null)

  const tasksByColumn = React.useMemo(() => {
    const grouped: Record<string, KanbanTask[]> = {}
    for (const col of columns) {
      grouped[col.id] = []
    }
    for (const task of tasks) {
      if (grouped[task.status]) {
        grouped[task.status].push(task)
      }
    }
    for (const col of columns) {
      grouped[col.id].sort((a, b) => a.order - b.order)
    }
    return grouped
  }, [tasks])

  const handleDragStart = React.useCallback(
    (e: React.DragEvent, taskId: string) => {
      setDraggedTask(taskId)
      e.dataTransfer.effectAllowed = "move"
      e.dataTransfer.setData("text/plain", taskId)
    },
    []
  )

  const handleDragEnd = React.useCallback(() => {
    setDraggedTask(null)
    setDragOverColumn(null)
  }, [])

  const handleDragOver = React.useCallback(
    (e: React.DragEvent, columnId: string) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = "move"
      setDragOverColumn(columnId)
    },
    []
  )

  const handleDragLeave = React.useCallback(() => {
    setDragOverColumn(null)
  }, [])

  const handleDrop = React.useCallback(
    (e: React.DragEvent, columnId: string) => {
      e.preventDefault()
      const taskId = e.dataTransfer.getData("text/plain")
      if (taskId) {
        onTaskMove(taskId, columnId)
      }
      setDraggedTask(null)
      setDragOverColumn(null)
    },
    [onTaskMove]
  )

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((column) => {
        const columnTasks = tasksByColumn[column.id] || []
        const isDragOver = dragOverColumn === column.id

        return (
          <div
            key={column.id}
            className={cn(
              "flex w-72 shrink-0 flex-col rounded-lg border bg-muted/30 transition-colors",
              isDragOver && "border-primary/50 bg-primary/5"
            )}
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <div className="flex items-center justify-between border-b px-3 py-2.5">
              <div className="flex items-center gap-2">
                <span className={cn("size-2 rounded-full", column.color)} />
                <span className="text-sm font-medium">{column.label}</span>
                <span className="flex size-5 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground">
                  {columnTasks.length}
                </span>
              </div>
              {onAddTask && (
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => onAddTask(column.id)}
                >
                  <Plus className="size-3.5" />
                </Button>
              )}
            </div>

            <ScrollArea className="flex-1 px-2 py-2">
              <div className="flex flex-col gap-2">
                {columnTasks.map((task) => {
                  const isDragging = draggedTask === task.id

                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => onTaskClick?.(task)}
                      className={cn(
                        "group/card cursor-pointer rounded-lg border border-l-4 bg-background p-3 shadow-sm transition-all hover:shadow-md",
                        `border-l-${priorityDot[task.priority]?.replace("bg-", "")}`,
                        isDragging && "opacity-50 shadow-lg scale-[1.02]"
                      )}
                      style={{
                        borderLeftColor:
                          task.priority === "urgent"
                            ? "#ef4444"
                            : task.priority === "high"
                              ? "#f97316"
                              : task.priority === "medium"
                                ? "#f59e0b"
                                : "#60a5fa",
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-medium leading-snug">
                          {task.title}
                        </h4>
                        <GripVertical className="size-4 shrink-0 text-muted-foreground/0 transition-colors group-hover/card:text-muted-foreground" />
                      </div>

                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              "size-2 rounded-full",
                              priorityDot[task.priority]
                            )}
                          />
                          <span className="text-[10px] text-muted-foreground">
                            {priorityLabel[task.priority]}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {task.dueDate && (
                            <span
                              className={cn(
                                "text-[10px] text-muted-foreground",
                                new Date(task.dueDate) < new Date() &&
                                  task.status !== "done" &&
                                  "text-red-500"
                              )}
                            >
                              {format(new Date(task.dueDate), "MMM d")}
                            </span>
                          )}

                          {task.assignee && (
                            <Avatar size="sm">
                              <AvatarImage
                                src={task.assignee.avatar || undefined}
                                alt={task.assignee.name || "User"}
                              />
                              <AvatarFallback className="text-[8px]">
                                {getInitials(task.assignee.name)}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}

                {columnTasks.length === 0 && (
                  <div className="flex h-20 items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground">
                    No tasks
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        )
      })}
    </div>
  )
}
