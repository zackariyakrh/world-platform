import { notFound, redirect } from "next/navigation"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { AIChatView } from "@/components/ai/ai-chat-view"

interface ConversationPageProps {
  params: Promise<{ conversationId: string }>
}

export default async function ConversationPage({ params }: ConversationPageProps) {
  const { conversationId } = await params
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/auth/login")
  }

  const conversation = await db.aIConversation.findFirst({
    where: { id: conversationId, userId: session.user.id },
    include: {
      model: true,
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  })

  if (!conversation) {
    notFound()
  }

  const models = await db.aIModel.findMany({
    where: { isEnabled: true },
    include: {
      provider: { select: { id: true, name: true, displayName: true } },
    },
    orderBy: [{ provider: { displayName: "asc" } }, { name: "asc" }],
  })

  const currentModel = conversation.model
    ? {
        id: conversation.model.id,
        name: conversation.model.name,
        displayName: conversation.model.displayName,
        modelId: conversation.model.modelId,
        providerId: conversation.model.providerId,
        provider: models.find((m) => m.providerId === conversation.model!.providerId)?.provider || {
          id: "",
          name: "",
          displayName: "",
        },
      }
    : null

  return (
    <div className="flex h-full flex-col">
      <AIChatView
        conversationId={conversationId}
        initialMessages={conversation.messages.map((m) => ({
          ...m,
          createdAt: m.createdAt.toISOString(),
        }))}
        availableModels={models.map((m) => ({
          id: m.id,
          name: m.name,
          displayName: m.displayName,
          modelId: m.modelId,
          providerId: m.providerId,
          provider: m.provider,
        }))}
        currentModel={currentModel}
      />
    </div>
  )
}
