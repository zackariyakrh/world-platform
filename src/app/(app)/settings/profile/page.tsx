"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Save, Loader2, Check, User, Camera, X } from "lucide-react"
import { toast } from "sonner"
import { SettingsTabs } from "@/components/settings/settings-tabs"

interface Profile {
  id: string
  name: string | null
  email: string
  username: string | null
  avatar: string | null
  bio: string | null
  jobTitle: string | null
  firstName: string | null
  lastName: string | null
  phone: string | null
  gender: string | null
  address: string | null
  timezone: string
  language: string
  status: string
  customStatus: string | null
}

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Kolkata",
  "Australia/Sydney",
  "Pacific/Auckland",
]

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "pt", label: "Portuguese" },
  { value: "ja", label: "Japanese" },
  { value: "zh", label: "Chinese" },
  { value: "ko", label: "Korean" },
]

export default function ProfileSettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [name, setName] = useState("")
  const [bio, setBio] = useState("")
  const [jobTitle, setJobTitle] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [gender, setGender] = useState("")
  const [address, setAddress] = useState("")
  const [timezone, setTimezone] = useState("UTC")
  const [language, setLanguage] = useState("en")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [removingAvatar, setRemovingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((data: Profile) => {
        setProfile(data)
        setName(data.name || "")
        setBio(data.bio || "")
        setJobTitle(data.jobTitle || "")
        setFirstName(data.firstName || "")
        setLastName(data.lastName || "")
        setPhone(data.phone || "")
        setGender(data.gender || "")
        setAddress(data.address || "")
        setTimezone(data.timezone)
        setLanguage(data.language)
      })
  }, [])

  function handleAvatarSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2MB")
      return
    }
    setAvatarFile(file)
    const reader = new FileReader()
    reader.onload = () => setAvatarPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  function removeAvatar() {
    setAvatarFile(null)
    setAvatarPreview(null)
    setRemovingAvatar(true)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      let avatarUrl = profile?.avatar || null
      if (removingAvatar) {
        avatarUrl = null
      } else if (avatarFile && avatarPreview) {
        avatarUrl = avatarPreview
      }

      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          bio,
          jobTitle,
          firstName,
          lastName,
          phone,
          gender,
          address,
          timezone,
          language,
          avatar: avatarUrl,
        }),
      })

      if (!res.ok) throw new Error("Failed to update")

      const updated = await res.json()
      setProfile(updated)
      setAvatarFile(null)
      setAvatarPreview(null)
      setRemovingAvatar(false)
      setSaved(true)
      toast.success("Profile updated")
      setTimeout(() => setSaved(false), 2000)
    } catch {
      toast.error("Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  if (!profile) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const initials = (profile.name || profile.email)
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <SettingsTabs />
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground glow-text">
            <User className="size-6 text-primary drop-shadow-[0_0_8px_oklch(from_var(--primary)_l_c_h_/_0.4)]" />
            Profile Settings
          </h1>
          <p className="text-sm text-muted-foreground">
            Update your personal information
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

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="glow-card lg:col-span-2">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Your profile information visible to other users
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <Avatar className="size-16">
                  {avatarPreview ? (
                    <AvatarImage src={avatarPreview} />
                  ) : profile.avatar && !removingAvatar ? (
                    <AvatarImage src={profile.avatar} />
                  ) : null}
                  <AvatarFallback className="text-lg">{initials}</AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <Camera className="size-5 text-white" />
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarSelect}
              />
              <div className="flex flex-col gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="size-3.5" />
                  Upload Photo
                </Button>
                {(avatarPreview || (profile.avatar && !removingAvatar)) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removeAvatar}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="size-3.5" />
                    Remove
                  </Button>
                )}
                <p className="text-xs text-muted-foreground">JPG, PNG or GIF. Max 2MB.</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Username</Label>
                <Input
                  value={profile.username || ""}
                  disabled
                  className="opacity-60"
                />
                <p className="text-xs text-muted-foreground">
                  Contact support to change your username
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Email</Label>
              <Input
                value={profile.email}
                disabled
                className="opacity-60"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="jobTitle">Job Title</Label>
              <Input
                id="jobTitle"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Software Engineer"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
                className="min-h-20"
              />
            </div>

            <div className="border-t pt-4 mt-2">
              <p className="text-xs font-medium uppercase text-muted-foreground mb-3">Personal Details</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Jane" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 mt-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 234 567 890" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Gender</Label>
                  <Select value={gender} onValueChange={(v) => setGender(v ?? "")}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 mt-4">
                <Label htmlFor="address">Address</Label>
                <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, City, Country" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glow-card">
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>
              Regional and language preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Timezone</Label>
              <Select value={timezone} onValueChange={(v) => v && setTimezone(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Language</Label>
              <Select value={language} onValueChange={(v) => v && setLanguage(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
