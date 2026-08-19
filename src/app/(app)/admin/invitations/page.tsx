import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { Badge } from "@/components/ui/badge"
import { InviteDialog } from "@/components/admin/invite-dialog"
import { Mail, Clock, Check, X, UserPlus } from "lucide-react"

export default async function AdminInvitationsPage() {
  const session = await auth()
  const userId = session?.user?.id

  const invitations = await db.invitation.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      invitedBy: {
        select: { id: true, name: true, email: true },
      },
    },
  })

  async function handleInvite(data: {
    email: string
    firstName?: string
    lastName?: string
    role: string
    message?: string
  }) {
    "use server"
    if (!userId) return

    const crypto = await import("crypto")
    const token = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    await db.invitation.create({
      data: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        message: data.message,
        token,
        invitedById: userId,
        expiresAt,
      },
    })
  }

  function statusVariant(status: string) {
    switch (status) {
      case "pending":
        return "secondary" as const
      case "accepted":
        return "default" as const
      case "expired":
        return "outline" as const
      case "cancelled":
        return "destructive" as const
      default:
        return "ghost" as const
    }
  }

  function statusIcon(status: string) {
    switch (status) {
      case "pending":
        return <Clock className="size-3" />
      case "accepted":
        return <Check className="size-3" />
      case "expired":
      case "cancelled":
        return <X className="size-3" />
      default:
        return null
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
            <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground glow-text">
              <UserPlus className="size-6 text-primary drop-shadow-[0_0_8px_oklch(from_var(--primary)_l_c_h_/_0.4)]" />
              Invitations
            </h1>
          <p className="text-sm text-muted-foreground">
            Manage pending and past invitations.
          </p>
        </div>
        <InviteDialog onInvite={handleInvite} />
      </div>

      {invitations.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-16 text-center">
          <Mail className="size-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No invitations yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {invitations.map((inv) => (
            <div
              key={inv.id}
              className="flex items-center gap-4 rounded-lg border px-4 py-3 transition-colors hover:bg-muted/50"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
                <Mail className="size-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">
                  {inv.email}
                </p>
                <p className="text-xs text-muted-foreground">
                  Invited by {inv.invitedBy.name ?? inv.invitedBy.email}
                  {inv.firstName ? ` — ${inv.firstName} ${inv.lastName ?? ""}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={statusVariant(inv.status)}>
                  <span className="inline-flex items-center gap-1">
                    {statusIcon(inv.status)}
                    {inv.status}
                  </span>
                </Badge>
                <Badge variant="outline">{inv.role}</Badge>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {new Date(inv.createdAt).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
