"use client"

import * as React from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import {
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Plus,
  Circle,
} from "lucide-react"

interface TaskAssignee {
  id: string
  name: string | null
  avatar: string | null
}

interface Task {
  id: string
  title: string
  status: string
  priority: string
  assigneeId: string | null
  assignee?: TaskAssignee
  dueDate: string | null
  createdAt: string
}

interface TaskListProps {
  tasks: Task[]
  onTaskClick: (task: Task) => void
  onAddTask?: () => void
}

type SortField = "title" | "status" | "priority" | "dueDate" | "assignee"
type SortDirection = "asc" | "desc"

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

const priorityColor: Record<string, string> = {
  low: "border-blue-200 text-blue-700 bg-blue-50",
  medium: "border-amber-200 text-amber-700 bg-amber-50",
  high: "border-orange-200 text-orange-700 bg-orange-50",
  urgent: "border-red-200 text-red-700 bg-red-50",
}

const statusColor: Record<string, string> = {
  backlog: "border-gray-200 text-gray-600 bg-gray-50",
  todo: "border-blue-200 text-blue-600 bg-blue-50",
  in_progress: "border-amber-200 text-amber-700 bg-amber-50",
  review: "border-purple-200 text-purple-700 bg-purple-50",
  blocked: "border-red-200 text-red-600 bg-red-50",
  done: "border-emerald-200 text-emerald-700 bg-emerald-50",
}

const statusOrder = ["backlog", "todo", "in_progress", "review", "blocked", "done"]
const priorityOrder = ["low", "medium", "high", "urgent"]

function getInitials(name: string | null): string {
  if (!name) return "?"
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function TaskList({ tasks, onTaskClick, onAddTask }: TaskListProps) {
  const [sortField, setSortField] = React.useState<SortField>("status")
  const [sortDirection, setSortDirection] = React.useState<SortDirection>("asc")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [priorityFilter, setPriorityFilter] = React.useState<string>("all")
  const [selected, setSelected] = React.useState<Set<string>>(new Set())

  const handleSort = React.useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDirection((d) => (d === "asc" ? "desc" : "asc"))
      } else {
        setSortField(field)
        setSortDirection("asc")
      }
    },
    [sortField]
  )

  const filteredTasks = React.useMemo(() => {
    let result = [...tasks]

    if (statusFilter !== "all") {
      result = result.filter((t) => t.status === statusFilter)
    }
    if (priorityFilter !== "all") {
      result = result.filter((t) => t.priority === priorityFilter)
    }

    result.sort((a, b) => {
      let comparison = 0

      switch (sortField) {
        case "title":
          comparison = a.title.localeCompare(b.title)
          break
        case "status":
          comparison =
            statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status)
          break
        case "priority":
          comparison =
            priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority)
          break
        case "dueDate":
          const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity
          const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity
          comparison = aDate - bDate
          break
        case "assignee":
          const aName = a.assignee?.name || "zzz"
          const bName = b.assignee?.name || "zzz"
          comparison = aName.localeCompare(bName)
          break
      }

      return sortDirection === "desc" ? -comparison : comparison
    })

    return result
  }, [tasks, statusFilter, priorityFilter, sortField, sortDirection])

  const toggleSelectAll = React.useCallback(() => {
    if (selected.size === filteredTasks.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filteredTasks.map((t) => t.id)))
    }
  }, [selected.size, filteredTasks])

  const toggleSelect = React.useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="size-3 text-muted-foreground/50" />
    }
    return sortDirection === "asc" ? (
      <ChevronUp className="size-3" />
    ) : (
      <ChevronDown className="size-3" />
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v || "all")}>
            <SelectTrigger size="sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {statusOrder.map((s) => (
                <SelectItem key={s} value={s}>
                  {statusLabel[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v || "all")}>
            <SelectTrigger size="sm">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              {priorityOrder.map((p) => (
                <SelectItem key={p} value={p}>
                  {priorityLabel[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {onAddTask && (
          <Button size="sm" onClick={onAddTask}>
            <Plus className="size-3.5" />
            Add Task
          </Button>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox
                checked={selected.size === filteredTasks.length && filteredTasks.length > 0}
                onCheckedChange={toggleSelectAll}
              />
            </TableHead>
            <TableHead>
              <button
                className="flex items-center gap-1 hover:text-foreground"
                onClick={() => handleSort("title")}
              >
                Title
                <SortIcon field="title" />
              </button>
            </TableHead>
            <TableHead>
              <button
                className="flex items-center gap-1 hover:text-foreground"
                onClick={() => handleSort("status")}
              >
                Status
                <SortIcon field="status" />
              </button>
            </TableHead>
            <TableHead>
              <button
                className="flex items-center gap-1 hover:text-foreground"
                onClick={() => handleSort("priority")}
              >
                Priority
                <SortIcon field="priority" />
              </button>
            </TableHead>
            <TableHead>
              <button
                className="flex items-center gap-1 hover:text-foreground"
                onClick={() => handleSort("assignee")}
              >
                Assignee
                <SortIcon field="assignee" />
              </button>
            </TableHead>
            <TableHead>
              <button
                className="flex items-center gap-1 hover:text-foreground"
                onClick={() => handleSort("dueDate")}
              >
                Due Date
                <SortIcon field="dueDate" />
              </button>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredTasks.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                No tasks found
              </TableCell>
            </TableRow>
          )}
          {filteredTasks.map((task) => (
            <TableRow
              key={task.id}
              className="cursor-pointer"
              onClick={() => onTaskClick(task)}
            >
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selected.has(task.id)}
                  onCheckedChange={() => toggleSelect(task.id)}
                />
              </TableCell>
              <TableCell className="font-medium">
                {task.title}
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={cn("text-[10px] font-medium", statusColor[task.status])}
                >
                  {statusLabel[task.status]}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={cn("text-[10px] font-medium", priorityColor[task.priority])}
                >
                  {priorityLabel[task.priority]}
                </Badge>
              </TableCell>
              <TableCell>
                {task.assignee ? (
                  <div className="flex items-center gap-1.5">
                    <Avatar size="sm">
                      <AvatarImage
                        src={task.assignee.avatar || undefined}
                        alt={task.assignee.name || "User"}
                      />
                      <AvatarFallback>
                        {getInitials(task.assignee.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs">{task.assignee.name || "Unknown"}</span>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">Unassigned</span>
                )}
              </TableCell>
              <TableCell>
                {task.dueDate ? (
                  <span
                    className={cn(
                      "text-xs",
                      new Date(task.dueDate) < new Date() && task.status !== "done"
                        ? "text-red-500"
                        : "text-muted-foreground"
                    )}
                  >
                    {format(new Date(task.dueDate), "MMM d, yyyy")}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
