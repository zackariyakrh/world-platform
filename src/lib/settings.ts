import { db } from "@/lib/db"

export async function getSetting(key: string): Promise<string | null> {
  const setting = await db.appSetting.findUnique({ where: { key } })
  return setting?.value ?? null
}

export async function setSetting(key: string, value: string): Promise<void> {
  await db.appSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  })
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const settings = await db.appSetting.findMany()
  return Object.fromEntries(settings.map((s) => [s.key, s.value]))
}

export async function getBrandingSettings(): Promise<{
  appName: string
  logo: string
  favicon: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  description: string
}> {
  const brandingKeys = [
    "app.name",
    "app.logo",
    "app.favicon",
    "app.description",
    "theme.primaryColor",
    "theme.secondaryColor",
    "theme.accentColor",
  ]

  const settings = await db.appSetting.findMany({
    where: { key: { in: brandingKeys } },
  })

  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]))

  return {
    appName: map["app.name"] ?? "Nexus",
    logo: map["app.logo"] ?? "/logo.svg",
    favicon: map["app.favicon"] ?? "/favicon.ico",
    primaryColor: map["theme.primaryColor"] ?? "#6366f1",
    secondaryColor: map["theme.secondaryColor"] ?? "#8b5cf6",
    accentColor: map["theme.accentColor"] ?? "#06b6d4",
    description: map["app.description"] ?? "Collaboration platform for modern teams",
  }
}
