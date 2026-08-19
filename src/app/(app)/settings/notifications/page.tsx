"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Save, Loader2, Check, Bell } from "lucide-react"
import { toast } from "sonner"
import { SettingsTabs } from "@/components/settings/settings-tabs"

interface NotificationSettings {
  messages: boolean
  mentions: boolean
  tasks: boolean
  meetings: boolean
  comments: boolean
  reactions: boolean
  channels: boolean
  system: boolean
  emailMessages: boolean
  emailMentions: boolean
  emailTasks: boolean
  emailMeetings: boolean
  browserNotifications: boolean
}

const defaultSettings: NotificationSettings = {
  messages: true,
  mentions: true,
  tasks: true,
  meetings: true,
  comments: true,
  reactions: true,
  channels: true,
  system: true,
  emailMessages: false,
  emailMentions: true,
  emailTasks: true,
  emailMeetings: true,
  browserNotifications: true,
}

export default function NotificationsSettingsPage() {
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const updateSetting = (key: keyof NotificationSettings, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      await new Promise((r) => setTimeout(r, 500))
      setSaved(true)
      toast.success("Notification preferences saved")
      setTimeout(() => setSaved(false), 2000)
    } catch {
      toast.error("Failed to save preferences")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <SettingsTabs />
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground glow-text">
            <Bell className="size-6 text-primary drop-shadow-[0_0_8px_oklch(from_var(--primary)_l_c_h_/_0.4)]" />
            Notification Preferences
          </h1>
          <p className="text-sm text-muted-foreground">
            Choose what notifications you receive and how
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="glow-button">
          {saving ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : saved ? (
            <Check className="size-3.5" />
          ) : (
            <Save className="size-3.5" />
          )}
          {saving ? "Saving..." : saved ? "Saved" : "Save Changes"}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glow-card">
          <CardHeader>
            <CardTitle>In-App Notifications</CardTitle>
            <CardDescription>
              Notifications shown inside Nexus
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {[
              { key: "messages" as const, label: "Direct messages", desc: "When someone sends you a DM" },
              { key: "mentions" as const, label: "Mentions", desc: "When someone mentions you" },
              { key: "tasks" as const, label: "Task updates", desc: "Task assignments and status changes" },
              { key: "meetings" as const, label: "Meetings", desc: "Meeting invites and reminders" },
              { key: "comments" as const, label: "Comments", desc: "Replies to your tasks and items" },
              { key: "reactions" as const, label: "Reactions", desc: "When someone reacts to your messages" },
              { key: "channels" as const, label: "Channel activity", desc: "New channels and updates" },
              { key: "system" as const, label: "System", desc: "System announcements and updates" },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-0.5">
                  <Label className="text-sm">{label}</Label>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
                <Switch
                  size="sm"
                  checked={settings[key]}
                  onCheckedChange={(checked) => updateSetting(key, checked)}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card className="glow-card">
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>
                Receive email summaries for important events
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {[
                { key: "emailMessages" as const, label: "Direct messages", desc: "Email for new DMs" },
                { key: "emailMentions" as const, label: "Mentions", desc: "Email when mentioned" },
                { key: "emailTasks" as const, label: "Task assignments", desc: "Email for task assignments" },
                { key: "emailMeetings" as const, label: "Meeting invites", desc: "Email for meeting invites" },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between gap-4">
                  <div className="flex flex-col gap-0.5">
                    <Label className="text-sm">{label}</Label>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                  <Switch
                    size="sm"
                    checked={settings[key]}
                    onCheckedChange={(checked) => updateSetting(key, checked)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="glow-card">
            <CardHeader>
              <CardTitle>Browser Notifications</CardTitle>
              <CardDescription>
                Desktop push notifications in your browser
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-0.5">
                  <Label className="text-sm">Push notifications</Label>
                  <p className="text-xs text-muted-foreground">
                    Show browser notifications for real-time updates
                  </p>
                </div>
                <Switch
                  size="sm"
                  checked={settings.browserNotifications}
                  onCheckedChange={(checked) =>
                    updateSetting("browserNotifications", checked)
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
