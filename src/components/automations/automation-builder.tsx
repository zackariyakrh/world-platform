"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Zap,
  Plus,
  X,
  Bell,
  MessageSquare,
  CheckCircle,
  ArrowRight,
  GitBranch,
} from "lucide-react"
import type { AutomationSaveData } from "@/lib/types/automation"

interface AutomationBuilderProps {
  automation?: AutomationSaveData
  onSave: (data: AutomationSaveData | null) => any
}

const TRIGGER_OPTIONS = [
  { value: "task.overdue", label: "Task becomes overdue" },
  { value: "task.completed", label: "Task is completed" },
  { value: "project.completed", label: "Project is completed" },
  { value: "user.joins", label: "User joins workspace" },
  { value: "meeting.started", label: "Meeting starts" },
  { value: "message.sent", label: "Message is sent" },
  { value: "file.uploaded", label: "File is uploaded" },
  { value: "comment.added", label: "Comment is added" },
]

const CONDITION_FIELDS = [
  { value: "priority", label: "Priority" },
  { value: "status", label: "Status" },
  { value: "assignee", label: "Assignee" },
  { value: "project", label: "Project" },
  { value: "type", label: "Type" },
]

const CONDITION_OPERATORS = [
  { value: "equals", label: "Equals" },
  { value: "not_equals", label: "Not equals" },
  { value: "contains", label: "Contains" },
  { value: "greater_than", label: "Greater than" },
  { value: "less_than", label: "Less than" },
]

const ACTION_OPTIONS = [
  { value: "notify", label: "Send notification", icon: Bell },
  { value: "message", label: "Send message", icon: MessageSquare },
  { value: "status_change", label: "Change status", icon: CheckCircle },
  { value: "create_task", label: "Create task", icon: Plus },
  { value: "change_user_status", label: "Change user status", icon: ArrowRight },
]

interface Condition {
  field: string
  operator: string
  value: string
}

interface Action {
  type: string
  target?: string
  template?: string
}

export function AutomationBuilder({ automation, onSave }: AutomationBuilderProps) {
  const [name, setName] = useState(automation?.name || "")
  const [description, setDescription] = useState(automation?.description || "")
  const [isEnabled, setIsEnabled] = useState(automation?.isEnabled ?? true)

  const initialTrigger = automation?.trigger
    ? (() => {
        try {
          return JSON.parse(automation.trigger)
        } catch {
          return { type: "event", event: "" }
        }
      })()
    : { type: "event", event: "" }

  const initialActions = automation?.actions
    ? (() => {
        try {
          return JSON.parse(automation.actions)
        } catch {
          return []
        }
      })()
    : []

  const [triggerEvent, setTriggerEvent] = useState(initialTrigger.event || "")
  const [conditions, setConditions] = useState<Condition[]>([])
  const [actions, setActions] = useState<Action[]>(
    Array.isArray(initialActions) ? initialActions : []
  )

  const addCondition = () => {
    setConditions([...conditions, { field: "", operator: "equals", value: "" }])
  }

  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index))
  }

  const updateCondition = (index: number, update: Partial<Condition>) => {
    const newConditions = [...conditions]
    newConditions[index] = { ...newConditions[index], ...update }
    setConditions(newConditions)
  }

  const addAction = () => {
    setActions([...actions, { type: "", target: "", template: "" }])
  }

  const removeAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index))
  }

  const updateAction = (index: number, update: Partial<Action>) => {
    const newActions = [...actions]
    newActions[index] = { ...newActions[index], ...update }
    setActions(newActions)
  }

  const handleSave = () => {
    if (!name.trim() || !triggerEvent || actions.length === 0) return

    onSave({
      id: automation?.id,
      name: name.trim(),
      description: description.trim() || null,
      isEnabled,
      trigger: JSON.stringify({ type: "event", event: triggerEvent }),
      actions: JSON.stringify(actions.filter((a) => a.type)),
    })
  }

  const isValid = name.trim() && triggerEvent && actions.length > 0 && actions.some((a) => a.type)

  return (
    <Dialog open onOpenChange={(open) => !open && onSave(null)}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="size-4" />
            {automation?.id ? "Edit Automation" : "New Automation"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic info */}
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="e.g., Notify on task overdue"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                placeholder="What does this automation do?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Enabled</Label>
              <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
            </div>
          </div>

          {/* Step 1: Trigger */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-mono">
                WHEN
              </Badge>
              <span className="text-sm font-medium">Trigger</span>
            </div>
            <Select value={triggerEvent} onValueChange={setTriggerEvent}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a trigger event" />
              </SelectTrigger>
              <SelectContent>
                {TRIGGER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Step 2: Conditions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono">
                  IF
                </Badge>
                <span className="text-sm font-medium">Conditions (optional)</span>
              </div>
              <Button variant="outline" size="sm" onClick={addCondition}>
                <Plus className="mr-1 size-3" />
                Add
              </Button>
            </div>
            {conditions.map((condition, index) => (
              <div key={index} className="flex items-center gap-2">
                <Select
                  value={condition.field}
                  onValueChange={(v) => v && updateCondition(index, { field: v })}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Field" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONDITION_FIELDS.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={condition.operator}
                  onValueChange={(v) =>
                    v && updateCondition(index, { operator: v })
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Operator" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONDITION_OPERATORS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Value"
                  value={condition.value}
                  onChange={(e) =>
                    updateCondition(index, { value: e.target.value })
                  }
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeCondition(index)}
                >
                  <X className="size-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Step 3: Actions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="destructive" className="font-mono">
                  THEN
                </Badge>
                <span className="text-sm font-medium">Actions</span>
              </div>
              <Button variant="outline" size="sm" onClick={addAction}>
                <Plus className="mr-1 size-3" />
                Add
              </Button>
            </div>
            {actions.map((action, index) => (
              <div key={index} className="space-y-2 rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <Select
                    value={action.type}
                    onValueChange={(v) => v && updateAction(index, { type: v })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select an action" />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTION_OPTIONS.map((a) => (
                        <SelectItem key={a.value} value={a.value}>
                          <div className="flex items-center gap-2">
                            <a.icon className="size-3.5" />
                            {a.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeAction(index)}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
                {action.type === "notify" && (
                  <Input
                    placeholder="Notification message template"
                    value={action.template || ""}
                    onChange={(e) =>
                      updateAction(index, { template: e.target.value })
                    }
                  />
                )}
                {action.type === "message" && (
                  <Input
                    placeholder="Message to send"
                    value={action.template || ""}
                    onChange={(e) =>
                      updateAction(index, { template: e.target.value })
                    }
                  />
                )}
              </div>
            ))}
            {actions.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-4">
                Add at least one action
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onSave(null)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!isValid}>
            {automation?.id ? "Save Changes" : "Create Automation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
