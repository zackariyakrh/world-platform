import { auth } from "@/lib/auth"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Settings } from "lucide-react"
import Link from "next/link"

export default async function SettingsPage() {
  const session = await auth()
  const userId = (session?.user as any)?.id

  if (!userId) return null

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-1">
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground glow-text">
          <Settings className="size-6 text-primary drop-shadow-[0_0_8px_oklch(from_var(--primary)_l_c_h_/_0.4)]" />
          Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList variant="line">
          <TabsTrigger value="profile">
            <Link href="/settings/profile">Profile</Link>
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Link href="/settings/notifications">Notifications</Link>
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Link href="/settings/appearance">Appearance</Link>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  )
}
