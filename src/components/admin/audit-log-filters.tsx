"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Filter, X } from "lucide-react"

export function AuditLogFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [user, setUser] = React.useState(searchParams.get("user") ?? "")
  const [action, setAction] = React.useState(searchParams.get("action") ?? "")

  function applyFilters() {
    const params = new URLSearchParams()
    if (user) params.set("user", user)
    if (action) params.set("action", action)
    router.push(`/admin/audit?${params.toString()}`)
  }

  function clearFilters() {
    setUser("")
    setAction("")
    router.push("/admin/audit")
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      applyFilters()
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Filter className="size-3.5 text-muted-foreground" />
      <Input
        placeholder="User ID"
        value={user}
        onChange={(e) => setUser(e.target.value)}
        onKeyDown={handleKeyDown}
        className="h-8 w-40"
      />
      <Input
        placeholder="Action (e.g. user.invite)"
        value={action}
        onChange={(e) => setAction(e.target.value)}
        onKeyDown={handleKeyDown}
        className="h-8 w-48"
      />
      <Button size="xs" onClick={applyFilters}>
        Filter
      </Button>
      {(user || action) && (
        <Button size="xs" variant="ghost" onClick={clearFilters}>
          <X className="size-3" />
          Clear
        </Button>
      )}
    </div>
  )
}
