import { auth } from "@/lib/auth"
import { getAllSettings, setSetting } from "@/lib/settings"
import { revalidatePath } from "next/cache"
import { SettingsForm } from "@/components/admin/settings-form"
import { Server } from "lucide-react"

export default async function AdminSettingsPage() {
  const settings = await getAllSettings()

  async function updateSettings(formData: FormData) {
    "use server"
    const session = await auth()
    if (!session?.user?.id) return

    const entries = formData.entries()
    for (const [key, value] of entries) {
      if (typeof value === "string" && key.startsWith("setting.")) {
        const settingKey = key.replace("setting.", "")
        await setSetting(settingKey, value)
      }
    }

    revalidatePath("/admin/settings")
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-1">
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground glow-text">
          <Server className="size-6 text-primary drop-shadow-[0_0_8px_oklch(from_var(--primary)_l_c_h_/_0.4)]" />
          System Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Configure system-wide settings for your platform.
        </p>
      </div>

      <SettingsForm settings={settings} onSave={updateSettings} />
    </div>
  )
}
