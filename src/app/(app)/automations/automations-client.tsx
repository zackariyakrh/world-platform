"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { AutomationCard } from "@/components/automations/automation-card"
import { AutomationBuilder } from "@/components/automations/automation-builder"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import type { AutomationData } from "@/lib/types/automation"
import type { AutomationSaveData } from "@/lib/types/automation"

interface AutomationsClientProps {
  initialAutomations: AutomationData[]
}

export function AutomationsClient({ initialAutomations }: AutomationsClientProps) {
  const [automations, setAutomations] = useState(initialAutomations)
  const [showBuilder, setShowBuilder] = useState(false)
  const [editingAutomation, setEditingAutomation] = useState<
    AutomationSaveData | undefined
  >()

  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      const res = await fetch(`/api/automations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isEnabled: enabled }),
      })

      if (!res.ok) throw new Error("Failed to update")

      setAutomations((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, isEnabled: enabled } : a
        )
      )
      toast.success(`Automation ${enabled ? "enabled" : "disabled"}`)
    } catch {
      toast.error("Failed to update automation")
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/automations/${id}`, {
        method: "DELETE",
      })

      if (!res.ok) throw new Error("Failed to delete")

      setAutomations((prev) => prev.filter((a) => a.id !== id))
      toast.success("Automation deleted")
    } catch {
      toast.error("Failed to delete automation")
    }
  }

  const handleSave = async (data: AutomationSaveData | null) => {
    if (!data || !data.name) {
      setShowBuilder(false)
      setEditingAutomation(undefined)
      return
    }

    try {
      const isEditing = !!data.id
      const url = isEditing ? `/api/automations/${data.id}` : "/api/automations"
      const method = isEditing ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!res.ok) throw new Error("Failed to save")

      const saved = await res.json()

      if (isEditing) {
        setAutomations((prev) =>
          prev.map((a) => (a.id === saved.id ? saved : a))
        )
      } else {
        setAutomations((prev) => [saved, ...prev])
      }

      toast.success(`Automation ${isEditing ? "updated" : "created"}`)
    } catch {
      toast.error("Failed to save automation")
    } finally {
      setShowBuilder(false)
      setEditingAutomation(undefined)
    }
  }

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={() => setShowBuilder(true)}>
          <Plus className="mr-1 size-4" />
          New Automation
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {automations.map((automation) => (
          <AutomationCard
            key={automation.id}
            automation={automation}
            onToggle={handleToggle}
            onEdit={(a) => {
              setEditingAutomation(a)
              setShowBuilder(true)
            }}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {showBuilder && (
        <AutomationBuilder
          automation={editingAutomation}
          onSave={handleSave}
        />
      )}
    </>
  )
}
