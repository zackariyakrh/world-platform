"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Save } from "lucide-react"

interface BrandingFormProps {
  branding: {
    appName: string
    logo: string
    favicon: string
    primaryColor: string
    secondaryColor: string
    accentColor: string
    description: string
  }
  onSave: (formData: FormData) => Promise<void>
}

export function BrandingForm({ branding, onSave }: BrandingFormProps) {
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
          <CardDescription>Basic application branding settings.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="app.name">App Name</Label>
            <p className="text-xs text-muted-foreground">This appears in the top-left corner of the sidebar</p>
            <Input
              id="app.name"
              name="app.name"
              defaultValue={branding.appName}
              placeholder="e.g. Nexus, My Company, Team Hub"
              className="max-w-md"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="app.description">Description</Label>
            <Textarea
              id="app.description"
              name="app.description"
              defaultValue={branding.description}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="app.logo">Logo URL</Label>
              <Input
                id="app.logo"
                name="app.logo"
                defaultValue={branding.logo}
                placeholder="/logo.svg"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="app.favicon">Favicon URL</Label>
              <Input
                id="app.favicon"
                name="app.favicon"
                defaultValue={branding.favicon}
                placeholder="/favicon.ico"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Colors</CardTitle>
          <CardDescription>Customize the platform color scheme.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="theme.primaryColor">Primary Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="theme.primaryColor"
                  name="theme.primaryColor"
                  defaultValue={branding.primaryColor}
                  className="size-8 cursor-pointer rounded border border-input"
                />
                <Input
                  defaultValue={branding.primaryColor}
                  className="h-8 flex-1 font-mono text-xs"
                  readOnly
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="theme.secondaryColor">Secondary Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="theme.secondaryColor"
                  name="theme.secondaryColor"
                  defaultValue={branding.secondaryColor}
                  className="size-8 cursor-pointer rounded border border-input"
                />
                <Input
                  defaultValue={branding.secondaryColor}
                  className="h-8 flex-1 font-mono text-xs"
                  readOnly
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="theme.accentColor">Accent Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="theme.accentColor"
                  name="theme.accentColor"
                  defaultValue={branding.accentColor}
                  className="size-8 cursor-pointer rounded border border-input"
                />
                <Input
                  defaultValue={branding.accentColor}
                  className="h-8 flex-1 font-mono text-xs"
                  readOnly
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Content</CardTitle>
          <CardDescription>Login page and footer customization.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="branding.loginBackground">Login Background URL</Label>
            <Input
              id="branding.loginBackground"
              name="branding.loginBackground"
              placeholder="/images/login-bg.jpg"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="branding.welcomeMessage">Welcome Message</Label>
            <Textarea
              id="branding.welcomeMessage"
              name="branding.welcomeMessage"
              placeholder="Welcome to Nexus!"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="branding.footerText">Footer Text</Label>
            <Input
              id="branding.footerText"
              name="branding.footerText"
              placeholder="Powered by Nexus"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={loading}>
          <Save className="size-3.5" />
          {loading ? "Saving..." : "Save Changes"}
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
