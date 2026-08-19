"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Save } from "lucide-react"

interface SettingsFormProps {
  settings: Record<string, string>
  onSave: (formData: FormData) => Promise<void>
}

function SettingField({
  label,
  settingKey,
  settings,
  type = "text",
  placeholder,
  multiline,
}: {
  label: string
  settingKey: string
  settings: Record<string, string>
  type?: string
  placeholder?: string
  multiline?: boolean
}) {
  const name = `setting.${settingKey}`
  const defaultValue = settings[settingKey] ?? ""

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      {multiline ? (
        <Textarea id={name} name={name} defaultValue={defaultValue} placeholder={placeholder} />
      ) : (
        <Input
          id={name}
          name={name}
          type={type}
          defaultValue={defaultValue}
          placeholder={placeholder}
        />
      )}
    </div>
  )
}

export function SettingsForm({ settings, onSave }: SettingsFormProps) {
  const [loading, setLoading] = React.useState(false)
  const [saved, setSaved] = React.useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setSaved(false)
    try {
      const form = new FormData(e.currentTarget)
      await onSave(form)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>Basic application settings.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <SettingField
            label="App Name"
            settingKey="app.name"
            settings={settings}
            placeholder="Nexus"
          />
          <SettingField
            label="App URL"
            settingKey="app.url"
            settings={settings}
            placeholder="https://nexus.example.com"
          />
          <SettingField
            label="App Description"
            settingKey="app.description"
            settings={settings}
            placeholder="Collaboration platform for modern teams"
            multiline
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Email</CardTitle>
          <CardDescription>Email delivery and SMTP configuration.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <SettingField
            label="SMTP Host"
            settingKey="email.smtpHost"
            settings={settings}
            placeholder="smtp.gmail.com"
          />
          <div className="grid grid-cols-2 gap-4">
            <SettingField
              label="SMTP Port"
              settingKey="email.smtpPort"
              settings={settings}
              placeholder="587"
            />
            <SettingField
              label="SMTP User"
              settingKey="email.smtpUser"
              settings={settings}
              placeholder="user@example.com"
            />
          </div>
          <SettingField
            label="SMTP Password"
            settingKey="email.smtpPassword"
            settings={settings}
            type="password"
            placeholder="••••••••"
          />
          <SettingField
            label="From Address"
            settingKey="email.fromAddress"
            settings={settings}
            placeholder="noreply@nexus.example.com"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Storage</CardTitle>
          <CardDescription>File storage configuration.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <SettingField
            label="Storage Provider"
            settingKey="storage.provider"
            settings={settings}
            placeholder="local"
          />
          <SettingField
            label="Max Upload Size (MB)"
            settingKey="storage.maxUploadSize"
            settings={settings}
            placeholder="50"
          />
          <SettingField
            label="Storage Path"
            settingKey="storage.path"
            settings={settings}
            placeholder="/uploads"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>Authentication and security settings.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <SettingField
            label="Session Timeout (hours)"
            settingKey="security.sessionTimeout"
            settings={settings}
            placeholder="24"
          />
          <SettingField
            label="Max Login Attempts"
            settingKey="security.maxLoginAttempts"
            settings={settings}
            placeholder="5"
          />
          <SettingField
            label="Password Min Length"
            settingKey="security.passwordMinLength"
            settings={settings}
            placeholder="8"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Notification preferences.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <SettingField
            label="Email Notifications"
            settingKey="notifications.email"
            settings={settings}
            placeholder="enabled"
          />
          <SettingField
            label="Webhook URL"
            settingKey="notifications.webhookUrl"
            settings={settings}
            placeholder="https://hooks.slack.com/..."
          />
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={loading}>
          <Save className="size-3.5" />
          {loading ? "Saving..." : "Save Settings"}
        </Button>
        {saved && (
          <span className="text-sm text-green-600 dark:text-green-400">
            Settings saved successfully.
          </span>
        )}
      </div>
    </form>
  )
}
