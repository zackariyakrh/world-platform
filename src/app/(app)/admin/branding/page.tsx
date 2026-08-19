import { auth } from "@/lib/auth"
import { getBrandingSettings, setSetting } from "@/lib/settings"
import { revalidatePath } from "next/cache"
import { BrandingForm } from "@/components/admin/branding-form"
import { Paintbrush } from "lucide-react"

export default async function AdminBrandingPage() {
  const branding = await getBrandingSettings()

  async function updateBranding(formData: FormData) {
    "use server"
    const session = await auth()
    if (!session?.user?.id) return

    const fields = [
      "app.name",
      "app.logo",
      "app.favicon",
      "app.description",
      "theme.primaryColor",
      "theme.secondaryColor",
      "theme.accentColor",
      "branding.loginBackground",
      "branding.welcomeMessage",
      "branding.footerText",
    ]

    for (const key of fields) {
      const value = formData.get(key)
      if (value !== null && value !== undefined) {
        await setSetting(key, String(value))
      }
    }

    revalidatePath("/admin/branding")
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-1">
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground glow-text">
          <Paintbrush className="size-6 text-primary drop-shadow-[0_0_8px_oklch(from_var(--primary)_l_c_h_/_0.4)]" />
          Branding
        </h1>
        <p className="text-sm text-muted-foreground">
          Customize the look and feel of your platform.
        </p>
      </div>

      <BrandingForm branding={branding} onSave={updateBranding} />
    </div>
  )
}
