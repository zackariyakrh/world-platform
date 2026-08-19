"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Save, Loader2, Check, Sun, Moon, Monitor, Palette } from "lucide-react"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { SettingsTabs } from "@/components/settings/settings-tabs"

const ACCENT_COLORS = [
  { name: "Indigo", value: "#6366f1" },
  { name: "Violet", value: "#8b5cf6" },
  { name: "Rose", value: "#f43f5e" },
  { name: "Pink", value: "#ec4899" },
  { name: "Orange", value: "#f97316" },
  { name: "Green", value: "#22c55e" },
  { name: "Cyan", value: "#06b6d4" },
  { name: "Blue", value: "#3b82f6" },
]

const FONT_SIZES = [
  { label: "Small", value: "small" },
  { label: "Default", value: "default" },
  { label: "Large", value: "large" },
]

export default function AppearanceSettingsPage() {
  const { theme, setTheme } = useTheme()
  const [accentColor, setAccentColor] = useState("#6366f1")
  const [compactMode, setCompactMode] = useState(false)
  const [fontSize, setFontSize] = useState("default")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      await new Promise((r) => setTimeout(r, 500))
      setSaved(true)
      toast.success("Appearance settings saved")
      setTimeout(() => setSaved(false), 2000)
    } catch {
      toast.error("Failed to save settings")
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
            <Palette className="size-6 text-primary drop-shadow-[0_0_8px_oklch(from_var(--primary)_l_c_h_/_0.4)]" />
            Appearance
          </h1>
          <p className="text-sm text-muted-foreground">
            Customize how Nexus looks and feels
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
            <CardTitle>Theme</CardTitle>
            <CardDescription>
              Select your preferred color scheme
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: "light", label: "Light", icon: Sun },
                { value: "dark", label: "Dark", icon: Moon },
                { value: "system", label: "System", icon: Monitor },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all duration-300",
                    theme === value
                      ? "border-primary bg-primary/5 shadow-[0_0_20px_oklch(from_var(--primary)_l_c_h_/_0.15)]"
                      : "border-transparent bg-muted/50 hover:bg-muted hover:shadow-[0_0_12px_oklch(from_var(--primary)_l_c_h_/_0.08)]"
                  )}
                >
                  <Icon className="size-5" />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="glow-card">
          <CardHeader>
            <CardTitle>Accent Color</CardTitle>
            <CardDescription>
              Choose your primary accent color
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {ACCENT_COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setAccentColor(color.value)}
                  className={cn(
                    "size-10 rounded-full border-2 transition-all duration-300 hover:scale-110",
                    accentColor === color.value
                      ? "border-foreground scale-110 shadow-[0_0_12px_rgba(99,102,241,0.4)]"
                      : "border-transparent hover:shadow-[0_0_8px_rgba(99,102,241,0.2)]"
                  )}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="glow-card">
          <CardHeader>
            <CardTitle>Font Size</CardTitle>
            <CardDescription>
              Adjust the text size across the app
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {FONT_SIZES.map(({ label, value }) => (
                <Button
                  key={value}
                  variant={fontSize === value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFontSize(value)}
                  className={fontSize === value ? "glow-button" : ""}
                >
                  {label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="glow-card">
          <CardHeader>
            <CardTitle>Display</CardTitle>
            <CardDescription>
              Adjust spacing and density preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-0.5">
                <Label className="text-sm">Compact Mode</Label>
                <p className="text-xs text-muted-foreground">
                  Reduce spacing for a denser layout
                </p>
              </div>
              <Switch
                size="sm"
                checked={compactMode}
                onCheckedChange={setCompactMode}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
