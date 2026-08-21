"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Database, CheckCircle, XCircle } from "lucide-react"
import { toast } from "sonner"

export default function AdminSeedPage() {
  const [loading, setLoading] = React.useState(false)
  const [result, setResult] = React.useState<{ success: boolean; message: string } | null>(null)

  async function handleSeed() {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch("/api/seed", { method: "POST" })
      const data = await res.json()
      setResult({ success: res.ok, message: data.message || data.error })
      if (res.ok) toast.success("Database seeded!")
      else toast.error(data.error)
    } catch {
      setResult({ success: false, message: "Network error" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Database className="size-6 text-primary" />
          Seed Database
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Populate the database with demo data: users, workspaces, channels, groups, projects, tasks, messages, events, and notes.
        </p>
      </div>

      <Button onClick={handleSeed} disabled={loading} className="glow-button gap-2 w-fit">
        {loading ? <Loader2 className="size-4 animate-spin" /> : <Database className="size-4" />}
        {loading ? "Seeding..." : "Seed Database"}
      </Button>

      {result && (
        <div className={`flex items-start gap-3 rounded-xl border p-4 ${result.success ? "border-emerald-500/30 bg-emerald-500/5" : "border-red-500/30 bg-red-500/5"}`}>
          {result.success ? (
            <CheckCircle className="size-5 text-emerald-500 shrink-0 mt-0.5" />
          ) : (
            <XCircle className="size-5 text-red-500 shrink-0 mt-0.5" />
          )}
          <p className="text-sm">{result.message}</p>
        </div>
      )}

      <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-2">This will create:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>20 demo users</li>
          <li>3 workspaces</li>
          <li>30 channels</li>
          <li>21 groups</li>
          <li>15 projects with tasks</li>
          <li>124+ messages</li>
          <li>18 calendar events</li>
          <li>12 notes</li>
          <li>15 friend relationships</li>
        </ul>
        <p className="mt-2 text-xs">Safe to run — skips if data already exists.</p>
      </div>
    </div>
  )
}
