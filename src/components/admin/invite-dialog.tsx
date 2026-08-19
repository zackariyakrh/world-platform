"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { UserPlus, Copy, Check } from "lucide-react"

interface InviteDialogProps {
  onInvite: (data: {
    email: string
    firstName?: string
    lastName?: string
    role: string
    message?: string
  }) => Promise<void>
}

export function InviteDialog({ onInvite }: InviteDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  const [generatedLink, setGeneratedLink] = React.useState<string | null>(null)
  const [form, setForm] = React.useState({
    email: "",
    firstName: "",
    lastName: "",
    role: "member",
    message: "",
  })

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.email) return

    setLoading(true)
    try {
      await onInvite({
        email: form.email,
        firstName: form.firstName || undefined,
        lastName: form.lastName || undefined,
        role: form.role,
        message: form.message || undefined,
      })

      const token = crypto.randomUUID().replace(/-/g, "")
      const link = `${window.location.origin}/auth/invite/${token}`
      setGeneratedLink(link)
    } finally {
      setLoading(false)
    }
  }

  async function copyLink() {
    if (!generatedLink) return
    await navigator.clipboard.writeText(generatedLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleClose() {
    setOpen(false)
    setGeneratedLink(null)
    setForm({
      email: "",
      firstName: "",
      lastName: "",
      role: "member",
      message: "",
    })
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : handleClose())}>
      <DialogTrigger
        render={<Button size="sm" />}
      >
        <UserPlus className="size-3.5" />
        Invite User
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite a User</DialogTitle>
          <DialogDescription>
            Send an invitation to join the platform.
          </DialogDescription>
        </DialogHeader>

        {generatedLink ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              Invitation link generated. Copy and share it with the user:
            </p>
            <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2">
              <code className="flex-1 truncate text-xs text-foreground">
                {generatedLink}
              </code>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={copyLink}
              >
                {copied ? (
                  <Check className="size-3.5 text-green-500" />
                ) : (
                  <Copy className="size-3.5" />
                )}
              </Button>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="invite-email">Email *</Label>
              <Input
                id="invite-email"
                type="email"
                required
                placeholder="user@example.com"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="invite-first">First Name</Label>
                <Input
                  id="invite-first"
                  placeholder="Jane"
                  value={form.firstName}
                  onChange={(e) => updateField("firstName", e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="invite-last">Last Name</Label>
                <Input
                  id="invite-last"
                  placeholder="Doe"
                  value={form.lastName}
                  onChange={(e) => updateField("lastName", e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => v && updateField("role", v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="guest">Guest</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="invite-message">Message (optional)</Label>
              <Textarea
                id="invite-message"
                placeholder="Welcome to the team!"
                value={form.message}
                onChange={(e) => updateField("message", e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !form.email}>
                {loading ? "Sending..." : "Send Invitation"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
