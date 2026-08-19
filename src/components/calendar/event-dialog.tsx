"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { format } from "date-fns"
import {
  CalendarDays,
  MapPin,
  Link2,
  Bell,
  Repeat,
  Trash2,
  Eye,
  EyeOff,
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"

type CalendarEvent = {
  id: string
  title: string
  description?: string | null
  location?: string | null
  meetingLink?: string | null
  startTime: string | Date
  endTime: string | Date
  allDay: boolean
  recurrence?: string | null
  color?: string | null
  type: string
  participants?: Array<{
    id: string
    user: { id: string; name: string | null; avatar: string | null }
  }>
  reminders?: Array<{ id: string; minutes: number }>
}

interface EventDialogProps {
  event?: CalendarEvent
  onSave: (event: any) => void
  onClose: () => void
}

const eventTypeOptions = [
  { value: "event", label: "Event", color: "bg-purple-500" },
  { value: "meeting", label: "Meeting", color: "bg-blue-500" },
  { value: "deadline", label: "Deadline", color: "bg-red-500" },
  { value: "milestone", label: "Milestone", color: "bg-green-500" },
]

const recurrenceOptions = [
  { value: "none", label: "None" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
]

const reminderOptions = [
  { value: 5, label: "5 minutes before" },
  { value: 15, label: "15 minutes before" },
  { value: 30, label: "30 minutes before" },
  { value: 60, label: "1 hour before" },
  { value: 1440, label: "1 day before" },
]

export function EventDialog({ event, onSave, onClose }: EventDialogProps) {
  const [title, setTitle] = useState(event?.title ?? "")
  const [description, setDescription] = useState(event?.description ?? "")
  const [location, setLocation] = useState(event?.location ?? "")
  const [meetingLink, setMeetingLink] = useState(event?.meetingLink ?? "")
  const [type, setType] = useState(event?.type ?? "event")
  const [allDay, setAllDay] = useState(event?.allDay ?? false)
  const [recurrence, setRecurrence] = useState(event?.recurrence ?? "none")
  const [selectedReminders, setSelectedReminders] = useState<number[]>([])
  const [saving, setSaving] = useState(false)
  const [visibility, setVisibility] = useState<string>(
    (event as any)?.visibility ?? "private"
  )
  const [visibleToUserIds, setVisibleToUserIds] = useState<string[]>(
    (event as any)?.visibleToUsers?.map((v: any) => v.userId) ?? []
  )
  const [workspaceUsers, setWorkspaceUsers] = useState<
    { id: string; name: string; email: string; avatar: string | null }[]
  >([])

  const defaultStart = event?.startTime
    ? new Date(event.startTime)
    : new Date()
  const defaultEnd = event?.endTime
    ? new Date(event.endTime)
    : new Date(defaultStart.getTime() + 60 * 60 * 1000)

  const [startDate, setStartDate] = useState(format(defaultStart, "yyyy-MM-dd"))
  const [startTime, setStartTime] = useState(
    allDay ? "" : format(defaultStart, "HH:mm")
  )
  const [endDate, setEndDate] = useState(format(defaultEnd, "yyyy-MM-dd"))
  const [endTime, setEndTime] = useState(
    allDay ? "" : format(defaultEnd, "HH:mm")
  )

  useEffect(() => {
    if (event?.reminders) {
      setSelectedReminders(event.reminders.map((r) => r.minutes))
    }
  }, [event])

  useEffect(() => {
    if (visibility === "restricted" && workspaceUsers.length === 0) {
      fetch("/api/workspaces")
        .then((r) => r.json())
        .then((data) => {
          const users = data
            .flatMap((w: any) => w.members?.map((m: any) => m.user) || [])
            .filter(
              (u: any, i: number, arr: any[]) =>
                arr.findIndex((x: any) => x.id === u.id) === i
            )
          setWorkspaceUsers(users)
        })
        .catch(() => {})
    }
  }, [visibility])

  const handleSave = async () => {
    if (!title.trim()) return
    setSaving(true)

    try {
      const startDateTime = allDay
        ? new Date(`${startDate}T00:00:00`)
        : new Date(`${startDate}T${startTime || "00:00"}`)
      const endDateTime = allDay
        ? new Date(`${endDate}T23:59:59`)
        : new Date(`${endDate}T${endTime || "23:59"}`)

      const url = event?.id
        ? `/api/calendar/${event.id}`
        : "/api/calendar"
      const method = event?.id ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description || null,
          location: location || null,
          meetingLink: meetingLink || null,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          allDay,
          type,
          recurrence: recurrence === "none" ? null : recurrence,
          reminderMinutes: selectedReminders,
          visibility,
          visibleToUserIds: visibility === "restricted" ? visibleToUserIds : [],
        }),
      })

      if (res.ok) {
        const savedEvent = await res.json()
        onSave(savedEvent)
      }
    } catch (error) {
      console.error("Failed to save event:", error)
    } finally {
      setSaving(false)
    }
  }

  const toggleReminder = (minutes: number) => {
    setSelectedReminders((prev) =>
      prev.includes(minutes)
        ? prev.filter((m) => m !== minutes)
        : [...prev, minutes]
    )
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{event?.id ? "Edit Event" : "Create Event"}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="event-title">Title</Label>
            <Input
              id="event-title"
              placeholder="Event title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="event-description">Description</Label>
            <textarea
              id="event-description"
              placeholder="Add description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <Label className="flex items-center gap-2">
              <CalendarDays className="size-4 text-muted-foreground" />
              All day
            </Label>
            <Switch
              checked={allDay}
              onCheckedChange={(checked) => {
                setAllDay(checked)
                if (checked) {
                  setStartTime("")
                  setEndTime("")
                } else {
                  setStartTime(format(defaultStart, "HH:mm"))
                  setEndTime(format(defaultEnd, "HH:mm"))
                }
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Start</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              {!allDay && (
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>End</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
              {!allDay && (
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Event Type</Label>
            <div className="flex gap-2">
              {eventTypeOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setType(opt.value)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                    type === opt.value
                      ? "border-foreground/20 bg-muted text-foreground"
                      : "border-border text-muted-foreground hover:bg-muted/50"
                  )}
                >
                  <span className={cn("size-2 rounded-full", opt.color)} />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="event-location" className="gap-1.5">
              <MapPin className="size-3.5" />
              Location
            </Label>
            <Input
              id="event-location"
              placeholder="Add location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="event-link" className="gap-1.5">
              <Link2 className="size-3.5" />
              Meeting Link
            </Label>
            <Input
              id="event-link"
              placeholder="https://..."
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="gap-1.5">
              <Repeat className="size-3.5" />
              Recurrence
            </Label>
            <Select value={recurrence} onValueChange={(v) => setRecurrence(v ?? "none")}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {recurrenceOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="gap-1.5">
              <Bell className="size-3.5" />
              Reminders
            </Label>
            <div className="flex flex-wrap gap-2">
              {reminderOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => toggleReminder(opt.value)}
                  className={cn(
                    "rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
                    selectedReminders.includes(opt.value)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-muted/50"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="gap-1.5">
              <Eye className="size-3.5" />
              Visibility
            </Label>
            <div className="flex gap-2">
              {[
                { value: "private", label: "Private", icon: EyeOff, desc: "Only you" },
                { value: "public", label: "Public", icon: Eye, desc: "Everyone" },
                { value: "restricted", label: "Restricted", icon: Users, desc: "Select people" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setVisibility(opt.value)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                    visibility === opt.value
                      ? "border-foreground/20 bg-muted text-foreground"
                      : "border-border text-muted-foreground hover:bg-muted/50"
                  )}
                >
                  <opt.icon className="size-3.5" />
                  {opt.label}
                </button>
              ))}
            </div>
            {visibility === "restricted" && (
              <div className="flex flex-col gap-2 mt-1 max-h-40 overflow-y-auto rounded-lg border border-border p-2">
                {workspaceUsers.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No users found</p>
                ) : (
                  workspaceUsers.map((user) => (
                    <label
                      key={user.id}
                      className="flex items-center gap-2 rounded px-1 py-0.5 hover:bg-muted/50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={visibleToUserIds.includes(user.id)}
                        onChange={(e) => {
                          setVisibleToUserIds((prev) =>
                            e.target.checked
                              ? [...prev, user.id]
                              : prev.filter((id) => id !== user.id)
                          )
                        }}
                        className="size-3.5 rounded"
                      />
                      <span className="text-xs font-medium truncate">{user.name}</span>
                      <span className="text-[10px] text-muted-foreground truncate">{user.email}</span>
                    </label>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          {event?.id && (
            <Button
              variant="destructive"
              onClick={async () => {
                await fetch(`/api/calendar/${event.id}`, { method: "DELETE" })
                onClose()
              }}
              className="mr-auto"
            >
              <Trash2 className="size-4" />
              Delete
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !title.trim()}>
            {saving ? "Saving..." : event?.id ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
