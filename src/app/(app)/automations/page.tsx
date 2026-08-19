import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { AutomationsClient } from "./automations-client"
import { Zap } from "lucide-react"

export default async function AutomationsPage() {
  const session = await auth()
  const userId = (session?.user as any)?.id as string | undefined

  if (!userId) return null

  const userWorkspace = await db.workspaceMember.findFirst({
    where: { userId },
    select: { workspaceId: true },
  })

  const automations = await db.automation.findMany({
    where: {
      workspaceId: userWorkspace?.workspaceId || undefined,
    },
    include: {
      creator: {
        select: { id: true, name: true, avatar: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground glow-text">
            <Zap className="size-6 text-primary drop-shadow-[0_0_8px_oklch(from_var(--primary)_l_c_h_/_0.4)]" />
            Automations
          </h1>
          <p className="text-sm text-muted-foreground">
            Create rules to automate your workflow.
          </p>
        </div>
      </div>

      {automations.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-border py-16 text-center">
          <Zap className="size-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            No automations yet
          </p>
          <p className="text-xs text-muted-foreground/70">
            Create your first automation to get started
          </p>
        </div>
      ) : (
        <AutomationsClient initialAutomations={automations as any} />
      )}
    </div>
  )
}
