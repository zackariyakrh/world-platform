"use client"

import { useState, useMemo, useCallback } from "react"
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday,
  isSameMonth,
  parseISO,
} from "date-fns"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  CalendarDays,
  Clock,
  MapPin,
  Eye,
  EyeOff,
  Users,
} from "lucide-react"
import { EventDialog } from "@/components/calendar/event-dialog"

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
  visibility?: string
  participants?: Array<{
    id: string
    user: { id: string; name: string | null; avatar: string | null }
  }>
  creator?: { id: string; name: string | null; avatar: string | null }
}

type ViewMode = "month" | "week" | "day"

const eventTypeColors: Record<string, string> = {
  meeting: "bg-blue-500",
  deadline: "bg-red-500",
  milestone: "bg-green-500",
  event: "bg-purple-500",
}

const eventTypeBadgeColors: Record<string, string> = {
  meeting: "text-blue-500 bg-blue-500/10 border-blue-500/20",
  deadline: "text-red-500 bg-red-500/10 border-red-500/20",
  milestone: "text-green-500 bg-green-500/10 border-green-500/20",
  event: "text-purple-500 bg-purple-500/10 border-purple-500/20",
}

function VisibilityIcon({ visibility, className }: { visibility?: string; className?: string }) {
  if (visibility === "public") return <Eye className={cn("size-2.5 shrink-0", className)} />
  if (visibility === "restricted") return <Users className={cn("size-2.5 shrink-0", className)} />
  return <EyeOff className={cn("size-2.5 shrink-0", className)} />
}

interface CalendarViewProps {
  initialEvents: CalendarEvent[]
}

export function CalendarView({ initialEvents }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>("month")
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showEventDialog, setShowEventDialog] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | undefined>()
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents)

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const weekStart = startOfWeek(currentDate)
  const weekEnd = endOfWeek(currentDate)
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })

  const eventsForDay = useCallback(
    (day: Date) =>
      events.filter((e) => {
        const eventStart = typeof e.startTime === "string" ? parseISO(e.startTime) : e.startTime
        return isSameDay(eventStart, day)
      }),
    [events]
  )

  const upcomingEvents = useMemo(() => {
    const now = new Date()
    return events
      .filter((e) => {
        const start = typeof e.startTime === "string" ? parseISO(e.startTime) : e.startTime
        return start >= now
      })
      .sort((a, b) => {
        const aStart = typeof a.startTime === "string" ? parseISO(a.startTime) : a.startTime
        const bStart = typeof b.startTime === "string" ? parseISO(b.startTime) : b.startTime
        return aStart.getTime() - bStart.getTime()
      })
      .slice(0, 8)
  }, [events])

  const handlePrev = () => {
    if (viewMode === "month") setCurrentDate(subMonths(currentDate, 1))
    else if (viewMode === "week") {
      const d = new Date(currentDate)
      d.setDate(d.getDate() - 7)
      setCurrentDate(d)
    } else {
      const d = new Date(currentDate)
      d.setDate(d.getDate() - 1)
      setCurrentDate(d)
    }
  }

  const handleNext = () => {
    if (viewMode === "month") setCurrentDate(addMonths(currentDate, 1))
    else if (viewMode === "week") {
      const d = new Date(currentDate)
      d.setDate(d.getDate() + 7)
      setCurrentDate(d)
    } else {
      const d = new Date(currentDate)
      d.setDate(d.getDate() + 1)
      setCurrentDate(d)
    }
  }

  const handleToday = () => {
    setCurrentDate(new Date())
    setSelectedDate(new Date())
  }

  const handleCreateEvent = () => {
    setEditingEvent(undefined)
    setShowEventDialog(true)
  }

  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event)
    setShowEventDialog(true)
  }

  const handleSaveEvent = (savedEvent: any) => {
    setEvents((prev) => {
      const idx = prev.findIndex((e) => e.id === savedEvent.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = savedEvent
        return next
      }
      return [...prev, savedEvent]
    })
    setShowEventDialog(false)
    setEditingEvent(undefined)
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleToday}>
            Today
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={handlePrev}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={handleNext}>
            <ChevronRight className="size-4" />
          </Button>
          <h2 className="text-lg font-semibold text-foreground">
            {viewMode === "day"
              ? format(currentDate, "MMMM d, yyyy")
              : format(currentDate, "MMMM yyyy")}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border bg-muted p-0.5">
            {(["month", "week", "day"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  "rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors",
                  viewMode === mode
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {mode}
              </button>
            ))}
          </div>
          <Button size="sm" onClick={handleCreateEvent}>
            <Plus className="size-4" />
            New Event
          </Button>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 min-w-0">
          {viewMode === "month" && (
            <div className="rounded-xl border border-border">
              <div className="grid grid-cols-7 border-b border-border">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div
                    key={day}
                    className="px-2 py-2 text-center text-xs font-medium text-muted-foreground"
                  >
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {calendarDays.map((day) => {
                  const dayEvents = eventsForDay(day)
                  const inMonth = isSameMonth(day, currentDate)
                  const today = isToday(day)
                  const selected = selectedDate && isSameDay(day, selectedDate)

                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day)}
                      className={cn(
                        "relative min-h-[80px] border-b border-r border-border p-1 text-left transition-colors hover:bg-muted/50",
                        !inMonth && "bg-muted/20 text-muted-foreground/50",
                        selected && "bg-muted/50",
                      )}
                    >
                      <span
                        className={cn(
                          "inline-flex size-6 items-center justify-center rounded-full text-xs font-medium",
                          today && "bg-primary text-primary-foreground",
                          !today && "text-foreground"
                        )}
                      >
                        {format(day, "d")}
                      </span>
                      <div className="mt-0.5 flex flex-col gap-0.5">
                        {dayEvents.slice(0, 3).map((event) => {
                          const colorClass =
                            event.type && eventTypeColors[event.type]
                              ? eventTypeColors[event.type]
                              : "bg-gray-400"
                          return (
                            <button
                              key={event.id}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEditEvent(event)
                              }}
                              className="flex items-center gap-1 truncate rounded px-1 py-0.5 text-[10px] font-medium text-white transition-colors hover:opacity-80"
                            >
                              <span className={cn("size-1.5 shrink-0 rounded-full", colorClass)} />
                              <span className="truncate">{event.title}</span>
                              <VisibilityIcon visibility={event.visibility} className="text-white/60" />
                            </button>
                          )
                        })}
                        {dayEvents.length > 3 && (
                          <span className="px-1 text-[10px] text-muted-foreground">
                            +{dayEvents.length - 3} more
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {viewMode === "week" && (
            <div className="rounded-xl border border-border">
              <div className="grid grid-cols-7 border-b border-border">
                {weekDays.map((day) => {
                  const today = isToday(day)
                  return (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        "px-2 py-3 text-center border-r border-border last:border-r-0",
                        today && "bg-primary/5"
                      )}
                    >
                      <div className="text-xs font-medium text-muted-foreground">
                        {format(day, "EEE")}
                      </div>
                      <div
                        className={cn(
                          "mt-1 inline-flex size-7 items-center justify-center rounded-full text-sm font-semibold",
                          today && "bg-primary text-primary-foreground"
                        )}
                      >
                        {format(day, "d")}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="grid grid-cols-7 min-h-[400px]">
                {weekDays.map((day) => {
                  const dayEvents = eventsForDay(day)
                  return (
                    <div
                      key={day.toISOString()}
                      className="border-r border-border p-1 last:border-r-0"
                    >
                      {dayEvents.map((event) => {
                        const eventStart = typeof event.startTime === "string" ? parseISO(event.startTime) : event.startTime
                        const colorClass =
                          event.type && eventTypeColors[event.type]
                            ? eventTypeColors[event.type]
                            : "bg-gray-400"
                        return (
                          <button
                            key={event.id}
                            onClick={() => handleEditEvent(event)}
                            className={cn(
                              "mb-1 w-full truncate rounded px-1.5 py-1 text-left text-xs text-white transition-colors hover:opacity-80",
                              colorClass
                            )}
                          >
                            {event.allDay ? event.title : format(eventStart, "h:mm a") + " " + event.title}
                          </button>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {viewMode === "day" && (
            <div className="rounded-xl border border-border">
              <div className="border-b border-border px-4 py-3">
                <div className="text-sm font-medium text-muted-foreground">
                  {format(currentDate, "EEEE")}
                </div>
              </div>
              <div className="divide-y divide-border">
                {Array.from({ length: 24 }, (_, i) => {
                  const hour = i
                  const hourEvents = eventsForDay(currentDate).filter((e) => {
                    const start = typeof e.startTime === "string" ? parseISO(e.startTime) : e.startTime
                    return start.getHours() === hour
                  })
                  return (
                    <div key={hour} className="flex min-h-[48px]">
                      <div className="w-16 shrink-0 px-2 py-1 text-right text-xs text-muted-foreground">
                        {format(new Date(2000, 0, 1, hour), "h a")}
                      </div>
                      <div className="flex-1 border-l border-border p-1">
                        {hourEvents.map((event) => {
                          const start = typeof event.startTime === "string" ? parseISO(event.startTime) : event.startTime
                          const end = typeof event.endTime === "string" ? parseISO(event.endTime) : event.endTime
                          const colorClass =
                            event.type && eventTypeColors[event.type]
                              ? eventTypeColors[event.type]
                              : "bg-gray-400"
                          return (
                            <button
                              key={event.id}
                              onClick={() => handleEditEvent(event)}
                              className={cn(
                                "mb-0.5 w-full truncate rounded px-2 py-1 text-xs font-medium text-white transition-colors hover:opacity-80",
                                colorClass
                              )}
                            >
                              {format(start, "h:mm a")} - {format(end, "h:mm a")} | {event.title}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div className="hidden w-64 shrink-0 flex-col gap-4 lg:flex">
          <MiniCalendar
            currentDate={currentDate}
            onDateSelect={setSelectedDate}
            selectedDate={selectedDate}
            events={events}
          />

          <div className="rounded-xl border border-border p-3">
            <h3 className="mb-2 text-sm font-semibold text-foreground">
              Upcoming Events
            </h3>
            {upcomingEvents.length === 0 ? (
              <p className="text-xs text-muted-foreground">No upcoming events</p>
            ) : (
              <div className="flex flex-col gap-2">
                {upcomingEvents.map((event) => {
                  const start = typeof event.startTime === "string" ? parseISO(event.startTime) : event.startTime
                  const colorClass =
                    event.type && eventTypeBadgeColors[event.type]
                      ? eventTypeBadgeColors[event.type]
                      : "text-gray-500 bg-gray-500/10 border-gray-500/20"
                  return (
                    <button
                      key={event.id}
                      onClick={() => handleEditEvent(event)}
                      className="flex flex-col gap-1 rounded-lg border border-border p-2 text-left transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "size-2 shrink-0 rounded-full",
                            event.type && eventTypeColors[event.type]
                              ? eventTypeColors[event.type]
                              : "bg-gray-400"
                          )}
                        />
                        <span className="truncate text-xs font-medium text-foreground">
                          {event.title}
                        </span>
                        <VisibilityIcon visibility={event.visibility} className="text-muted-foreground" />
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock className="size-3" />
                        {format(start, "MMM d, h:mm a")}
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <MapPin className="size-3" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedDate && viewMode !== "day" && (
        <div className="rounded-xl border border-border p-4">
          <h3 className="mb-2 text-sm font-semibold text-foreground">
            Events on {format(selectedDate, "MMMM d, yyyy")}
          </h3>
          {eventsForDay(selectedDate).length === 0 ? (
            <p className="text-xs text-muted-foreground">No events on this day</p>
          ) : (
            <div className="flex flex-col gap-2">
              {eventsForDay(selectedDate).map((event) => {
                const start = typeof event.startTime === "string" ? parseISO(event.startTime) : event.startTime
                const end = typeof event.endTime === "string" ? parseISO(event.endTime) : event.endTime
                return (
                  <button
                    key={event.id}
                    onClick={() => handleEditEvent(event)}
                    className="flex items-center gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:bg-muted/50"
                  >
                    <div
                      className={cn(
                        "size-3 shrink-0 rounded-full",
                        event.type && eventTypeColors[event.type]
                          ? eventTypeColors[event.type]
                          : "bg-gray-400"
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {event.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {event.allDay
                          ? "All day"
                          : `${format(start, "h:mm a")} - ${format(end, "h:mm a")}`}
                      </p>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {event.type}
                    </Badge>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {showEventDialog && (
        <EventDialog
          event={editingEvent}
          onSave={handleSaveEvent}
          onClose={() => {
            setShowEventDialog(false)
            setEditingEvent(undefined)
          }}
        />
      )}
    </div>
  )
}

function MiniCalendar({
  currentDate,
  onDateSelect,
  selectedDate,
  events,
}: {
  currentDate: Date
  onDateSelect: (date: Date) => void
  selectedDate: Date | null
  events: CalendarEvent[]
}) {
  const miniMonthStart = startOfMonth(currentDate)
  const miniMonthEnd = endOfMonth(currentDate)
  const miniStart = startOfWeek(miniMonthStart)
  const miniEnd = endOfWeek(miniMonthEnd)
  const miniDays = eachDayOfInterval({ start: miniStart, end: miniEnd })

  return (
    <div className="rounded-xl border border-border p-3">
      <div className="mb-2 text-center text-xs font-semibold text-foreground">
        {format(currentDate, "MMMM yyyy")}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div
            key={i}
            className="flex size-6 items-center justify-center text-[10px] font-medium text-muted-foreground"
          >
            {d}
          </div>
        ))}
        {miniDays.map((day) => {
          const inMonth = isSameMonth(day, currentDate)
          const today = isToday(day)
          const selected = selectedDate && isSameDay(day, selectedDate)
          const hasEvents = events.some((e) => {
            const s = typeof e.startTime === "string" ? parseISO(e.startTime) : e.startTime
            return isSameDay(s, day)
          })
          return (
            <button
              key={day.toISOString()}
              onClick={() => onDateSelect(day)}
              className={cn(
                "flex size-6 items-center justify-center rounded-full text-[10px] transition-colors",
                !inMonth && "text-muted-foreground/30",
                today && "bg-primary text-primary-foreground font-bold",
                selected && !today && "bg-muted text-foreground",
                hasEvents && !today && !selected && "font-semibold text-foreground"
              )}
            >
              {format(day, "d")}
            </button>
          )
        })}
      </div>
    </div>
  )
}
