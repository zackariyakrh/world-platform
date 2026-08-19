"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import {
  Calendar,
  User,
  MessageSquare,
  Paperclip,
  CheckSquare,
  Clock,
  Trash2,
  MoreHorizontal,
} from "lucide-react"

interface TaskComment {
  id: string
  content: string
  userId: string
  user: {
    id: string
    name: string | null
    avatar: string | null
  }
  createdAt: string
  updatedAt: string
}

interface TaskSubtask {
  id: string
  title: string
  status: string
  isDone?: boolean
}

interface TaskDetailData {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  dueDate: string | null
  startDate: string | null
  estimatedHours: number | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
  assigneeId: string | null
  assignee?: {
    id: string
    name: string | null
    avatar: string | null
  }
  creator?: {
    id: string
    name: string | null
    avatar: string | null
  }
  comments: TaskComment[]
  subtasks: TaskSubtask[]
}

interface TaskDetailProps {
  task: TaskDetailData
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: (updates: Partial<TaskDetailData>) => void
}

const statusLabel: Record<string, string> = {
  backlog: "Backlog",
  todo: "To Do",
  in_progress: "In Progress",
  review: "Review",
  blocked: "Blocked",
  done: "Done",
}

const priorityLabel: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
}

const priorityDot: Record<string, string> = {
  low: "bg-blue-400",
  medium: "bg-amber-400",
  high: "bg-orange-400",
  urgent: "bg-red-500",
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

export function TaskDetail({ task, open, onOpenChange, onUpdate }: TaskDetailProps) {
  const [title, setTitle] = React.useState(task.title)
  const [description, setDescription] = React.useState(task.description || "")
  const [commentText, setCommentText] = React.useState("")
  const [newSubtask, setNewSubtask] = React.useState("")
  const [subtasks, setSubtasks] = React.useState<TaskSubtask[]>(task.subtasks)
  const [comments, setComments] = React.useState<TaskComment[]>(task.comments)

  React.useEffect(() => {
    setTitle(task.title)
    setDescription(task.description || "")
    setSubtasks(task.subtasks)
    setComments(task.comments)
  }, [task])

  const handleTitleBlur = React.useCallback(() => {
    if (title !== task.title) {
      onUpdate({ title })
    }
  }, [title, task.title, onUpdate])

  const handleDescriptionBlur = React.useCallback(() => {
    if (description !== (task.description || "")) {
      onUpdate({ description })
    }
  }, [description, task.description, onUpdate])

  const handleStatusChange = React.useCallback(
    (value: string | null) => {
      if (value) onUpdate({ status: value })
    },
    [onUpdate]
  )

  const handlePriorityChange = React.useCallback(
    (value: string | null) => {
      if (value) onUpdate({ priority: value })
    },
    [onUpdate]
  )

  const handleToggleSubtask = React.useCallback((subtaskId: string) => {
    setSubtasks((prev) =>
      prev.map((s) =>
        s.id === subtaskId ? { ...s, isDone: !s.isDone } : s
      )
    )
  }, [])

  const handleAddSubtask = React.useCallback(() => {
    if (!newSubtask.trim()) return
    const subtask: TaskSubtask = {
      id: `temp-${Date.now()}`,
      title: newSubtask.trim(),
      status: "todo",
      isDone: false,
    }
    setSubtasks((prev) => [...prev, subtask])
    setNewSubtask("")
  }, [newSubtask])

  const handleRemoveSubtask = React.useCallback((subtaskId: string) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== subtaskId))
  }, [])

  const handleAddComment = React.useCallback(() => {
    if (!commentText.trim()) return
    const comment: TaskComment = {
      id: `temp-${Date.now()}`,
      content: commentText.trim(),
      userId: "current",
      user: {
        id: "current",
        name: "You",
        avatar: null,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setComments((prev) => [...prev, comment])
    setCommentText("")
  }, [commentText])

  const completedSubtasks = subtasks.filter((s) => s.isDone).length
  const totalSubtasks = subtasks.length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="border-b px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-1">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleBlur}
                className="w-full bg-transparent text-lg font-semibold outline-none placeholder:text-muted-foreground"
                placeholder="Task title"
              />
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Created {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}</span>
                {task.creator && (
                  <>
                    <span>by</span>
                    <span className="font-medium text-foreground">{task.creator.name || "Unknown"}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-160px)]">
          <div className="grid grid-cols-[1fr_240px] gap-6 p-6">
            <div className="space-y-6">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Description
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={handleDescriptionBlur}
                  placeholder="Add a description..."
                  className="min-h-[120px] text-sm"
                />
              </div>

              {totalSubtasks > 0 && (
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <CheckSquare className="size-3.5" />
                      Subtasks ({completedSubtasks}/{totalSubtasks})
                    </label>
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{
                          width: `${totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    {subtasks.map((subtask) => (
                      <div
                        key={subtask.id}
                        className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-muted/50"
                      >
                        <Checkbox
                          checked={subtask.isDone}
                          onCheckedChange={() => handleToggleSubtask(subtask.id)}
                        />
                        <span
                          className={cn(
                            "flex-1 text-sm",
                            subtask.isDone && "text-muted-foreground line-through"
                          )}
                        >
                          {subtask.title}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => handleRemoveSubtask(subtask.id)}
                        >
                          <Trash2 className="size-3 text-muted-foreground" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Input
                      value={newSubtask}
                      onChange={(e) => setNewSubtask(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          handleAddSubtask()
                        }
                      }}
                      placeholder="Add subtask..."
                      className="h-7 text-sm"
                    />
                    <Button size="sm" variant="ghost" onClick={handleAddSubtask}>
                      Add
                    </Button>
                  </div>
                </div>
              )}

              <Separator />

              <div>
                <label className="mb-3 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <MessageSquare className="size-3.5" />
                  Comments ({comments.length})
                </label>
                <div className="space-y-3">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <Avatar size="sm">
                        <AvatarImage
                          src={comment.user.avatar || undefined}
                          alt={comment.user.name || "User"}
                        />
                        <AvatarFallback className="text-[8px]">
                          {getInitials(comment.user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-medium">
                            {comment.user.name || "Unknown"}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="mt-0.5 whitespace-pre-wrap text-sm">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  ))}

                  <div className="flex items-start gap-3 pt-2">
                    <Avatar size="sm">
                      <AvatarFallback className="text-[8px]">Y</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <Textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Write a comment..."
                        className="min-h-[60px] text-sm"
                      />
                      <Button
                        size="sm"
                        disabled={!commentText.trim()}
                        onClick={handleAddComment}
                      >
                        Comment
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Status
                  </label>
                  <Select value={task.status} onValueChange={handleStatusChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusLabel).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Priority
                  </label>
                  <Select value={task.priority} onValueChange={handlePriorityChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(priorityLabel).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          <div className="flex items-center gap-1.5">
                            <span className={cn("size-2 rounded-full", priorityDot[value])} />
                            {label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Assignee
                  </label>
                  <div className="flex items-center gap-2 rounded-lg border p-2 text-sm">
                    {task.assignee ? (
                      <>
                        <Avatar size="sm">
                          <AvatarImage
                            src={task.assignee.avatar || undefined}
                            alt={task.assignee.name || "User"}
                          />
                          <AvatarFallback className="text-[8px]">
                            {getInitials(task.assignee.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{task.assignee.name || "Unknown"}</span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">Unassigned</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Due Date
                  </label>
                  <div className="flex items-center gap-2 rounded-lg border p-2 text-sm">
                    <Calendar className="size-4 text-muted-foreground" />
                    {task.dueDate ? (
                      <span
                        className={cn(
                          new Date(task.dueDate) < new Date() &&
                            task.status !== "done" &&
                            "text-red-500"
                        )}
                      >
                        {new Date(task.dueDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">No due date</span>
                    )}
                  </div>
                </div>

                {task.estimatedHours && (
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Estimated Hours
                    </label>
                    <div className="flex items-center gap-2 rounded-lg border p-2 text-sm">
                      <Clock className="size-4 text-muted-foreground" />
                      <span>{task.estimatedHours}h</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
