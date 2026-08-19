import { db } from "@/lib/db"

const DEFAULT_BRANDING = {
  appName: "Nexus",
  logo: "/logo.svg",
  favicon: "/favicon.svg",
  primaryColor: "#6366f1",
  secondaryColor: "#8b5cf6",
  accentColor: "#06b6d4",
  description: "Collaboration platform for modern teams",
}

export async function getSetting(key: string): Promise<string | null> {
  try {
    const setting = await db.appSetting.findUnique({ where: { key } })
    return setting?.value ?? null
  } catch {
    return null
  }
}

export async function setSetting(key: string, value: string): Promise<void> {
  await db.appSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  })
}

export async function getAllSettings(): Promise<Record<string, string>> {
  try {
    const settings = await db.appSetting.findMany()
    return Object.fromEntries(settings.map((s) => [s.key, s.value]))
  } catch {
    return {}
  }
}

export async function getBrandingSettings(): Promise<typeof DEFAULT_BRANDING> {
  try {
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
      appName: map["app.name"] ?? DEFAULT_BRANDING.appName,
      logo: map["app.logo"] ?? DEFAULT_BRANDING.logo,
      favicon: map["app.favicon"] ?? DEFAULT_BRANDING.favicon,
      primaryColor: map["theme.primaryColor"] ?? DEFAULT_BRANDING.primaryColor,
      secondaryColor: map["theme.secondaryColor"] ?? DEFAULT_BRANDING.secondaryColor,
      accentColor: map["theme.accentColor"] ?? DEFAULT_BRANDING.accentColor,
      description: map["app.description"] ?? DEFAULT_BRANDING.description,
    }
  } catch {
    return DEFAULT_BRANDING
  }
}
