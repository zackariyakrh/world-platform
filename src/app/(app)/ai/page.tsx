import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Sparkles,
  Plus,
  MessageSquare,
  Clock,
  ArrowRight,
  Bot,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

export default async function AIHubPage() {
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) {
    redirect("/auth/login")
  }

  const [conversations, models] = await Promise.all([
    db.aIConversation.findMany({
      where: { userId },
      include: {
        model: {
          select: { id: true, name: true, displayName: true },
        },
        _count: { select: { messages: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
    db.aIModel.findMany({
      where: { isEnabled: true },
      include: {
        provider: { select: { id: true, name: true, displayName: true } },
      },
      orderBy: [{ provider: { displayName: "asc" } }, { name: "asc" }],
    }),
  ])

  const defaultModel = models.find((m) => m.isDefault) || models[0]

  const createConversation = async () => {
    "use server"

    const newConversation = await db.aIConversation.create({
      data: {
        userId,
        modelId: defaultModel?.id || null,
      },
    })

    redirect(`/ai/${newConversation.id}`)
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-1">
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground glow-text">
          <Sparkles className="size-6 text-primary drop-shadow-[0_0_8px_oklch(from_var(--primary)_l_c_h_/_0.4)]" />
          AI Assistant
        </h1>
        <p className="text-sm text-muted-foreground">
          Ask questions, brainstorm ideas, and get help with your work.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="glow-card sm:col-span-2 lg:col-span-1">
          <CardContent className="flex flex-col items-center gap-3 py-8">
            <div
              className="flex size-12 items-center justify-center rounded-2xl bg-primary/10"
              style={{ boxShadow: "0 0 20px oklch(from var(--primary) l c h / 0.2)" }}
            >
              <Sparkles className="size-6 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">Start a new chat</p>
              <p className="text-xs text-muted-foreground">
                Ask anything about your work
              </p>
            </div>
            <form action={createConversation}>
              <Button type="submit" className="gap-1.5">
                <Plus className="size-3.5" />
                New Conversation
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="glow-card">
          <CardContent className="flex flex-col gap-4 py-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 shadow-[0_0_12px_oklch(0.60_0.20_250_/_0.15)]">
                <Bot className="size-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{models.length}</p>
                <p className="text-xs text-muted-foreground">Models Available</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {models.slice(0, 5).map((model) => (
                <Badge key={model.id} variant="secondary" className="text-[10px]">
                  {model.displayName}
                </Badge>
              ))}
              {models.length > 5 && (
                <Badge variant="outline" className="text-[10px]">
                  +{models.length - 5} more
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="glow-card">
          <CardContent className="flex flex-col gap-4 py-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-green-500/10 shadow-[0_0_12px_oklch(0.65_0.20_160_/_0.15)]">
                <MessageSquare className="size-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{conversations.length}</p>
                <p className="text-xs text-muted-foreground">Conversations</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {conversations.filter((c) => c._count.messages > 0).length} with
              messages
            </p>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="mb-3 flex items-center gap-2">
          <Clock className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Recent Conversations</h2>
        </div>

        {conversations.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-12">
              <MessageSquare className="size-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                No conversations yet. Start your first chat!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-1">
            {conversations.map((conversation) => (
              <Link
                key={conversation.id}
                href={`/ai/${conversation.id}`}
                className="group flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <MessageSquare className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {conversation.title || "Untitled conversation"}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {conversation.model && (
                      <Badge variant="outline" className="text-[10px]">
                        {conversation.model.displayName}
                      </Badge>
                    )}
                    <span>{conversation._count.messages} messages</span>
                    <span>
                      {formatDistanceToNow(new Date(conversation.updatedAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </div>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
