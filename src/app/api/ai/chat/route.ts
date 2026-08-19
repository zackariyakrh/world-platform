import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

type ProviderName = string

interface ChatMessage {
  role: string
  content: string
}

async function callOpenAICompatible(
  baseUrl: string,
  apiKey: string,
  modelId: string,
  messages: ChatMessage[],
  temperature: number,
  maxTokens: number
): Promise<string> {
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: modelId,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Provider API error (${response.status}): ${errorBody}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error("Invalid OpenAI response: empty choices")
  return content
}

async function callAnthropic(
  apiKey: string,
  modelId: string,
  messages: ChatMessage[],
  temperature: number,
  maxTokens: number
): Promise<string> {
  const systemMessage = messages.find((m) => m.role === "system")
  const nonSystemMessages = messages.filter((m) => m.role !== "system")

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: modelId,
      max_tokens: maxTokens,
      temperature,
      system: systemMessage?.content || undefined,
      messages: nonSystemMessages.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      })),
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Anthropic API error (${response.status}): ${errorBody}`)
  }

  const data = await response.json()
  const text = data.content?.[0]?.text
  if (!text) throw new Error("Invalid Anthropic response: empty content")
  return text
}

async function callGoogle(
  apiKey: string,
  modelId: string,
  messages: ChatMessage[],
  temperature: number,
  maxTokens: number
): Promise<string> {
  const systemMessage = messages.find((m) => m.role === "system")
  const nonSystemMessages = messages.filter((m) => m.role !== "system")

  const contents = nonSystemMessages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }))

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents,
      systemInstruction: systemMessage
        ? { parts: [{ text: systemMessage.content }] }
        : undefined,
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
      },
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Google AI API error (${response.status}): ${errorBody}`)
  }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error("Invalid Google AI response: empty candidates")
  return text
}

async function callAIProvider(
  provider: { name: ProviderName; apiKey: string; baseUrl: string | null },
  model: { modelId: string; temperature: number; maxTokens: number },
  messages: ChatMessage[]
): Promise<string> {
  const { name, apiKey, baseUrl } = provider
  const { modelId, temperature, maxTokens } = model

  switch (name) {
    case "openai":
    case "deepseek":
    case "openrouter":
      return callOpenAICompatible(
        baseUrl || "https://api.openai.com/v1",
        apiKey,
        modelId,
        messages,
        temperature,
        maxTokens
      )
    case "anthropic":
      return callAnthropic(apiKey, modelId, messages, temperature, maxTokens)
    case "google":
      return callGoogle(apiKey, modelId, messages, temperature, maxTokens)
    default:
      throw new Error(`Unknown provider: ${name}`)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { conversationId, content, modelId } = body

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    if (!conversationId) {
      return NextResponse.json({ error: "conversationId is required" }, { status: 400 })
    }

    const conversation = await db.aIConversation.findFirst({
      where: { id: conversationId, userId: session.user.id },
      include: { model: true },
    })

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    const selectedModelId = modelId || conversation.modelId

    if (!selectedModelId) {
      return NextResponse.json(
        { error: "No model selected. Please configure a model." },
        { status: 400 }
      )
    }

    const model = await db.aIModel.findFirst({
      where: { id: selectedModelId, isEnabled: true },
      include: { provider: true },
    })

    if (!model) {
      return NextResponse.json({ error: "Model not found or disabled" }, { status: 404 })
    }

    if (!model.provider.isEnabled) {
      return NextResponse.json(
        { error: "AI provider is disabled" },
        { status: 400 }
      )
    }

    if (!model.provider.apiKey) {
      return NextResponse.json(
        { error: "API key not configured for this provider" },
        { status: 400 }
      )
    }

    await db.aIMessage.create({
      data: {
        content: content.trim(),
        role: "user",
        conversationId,
        modelId: selectedModelId,
      },
    })

    const history = await db.aIMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
    })

    const chatMessages: ChatMessage[] = [
      {
        role: "system",
        content:
          "You are a helpful AI assistant integrated into a collaboration platform called Nexus. You can help users with their work tasks, answer questions, and provide insights based on their workspace context. Be concise, helpful, and professional.",
      },
      ...history.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    ]

    if (!conversation.title && history.length <= 1) {
      const title =
        content.trim().length > 60
          ? content.trim().slice(0, 60) + "..."
          : content.trim()
      await db.aIConversation.update({
        where: { id: conversationId },
        data: { title },
      })
    }

    let responseContent: string
    try {
      responseContent = await callAIProvider(
        {
          name: model.provider.name,
          apiKey: model.provider.apiKey,
          baseUrl: model.provider.baseUrl,
        },
        {
          modelId: model.modelId,
          temperature: model.temperature,
          maxTokens: model.maxTokens,
        },
        chatMessages
      )
    } catch (providerError) {
      console.error("AI provider error:", providerError)
      return NextResponse.json(
        {
          error: "AI provider error",
          details:
            providerError instanceof Error
              ? providerError.message
              : "Unknown provider error",
        },
        { status: 502 }
      )
    }

    const assistantMessage = await db.aIMessage.create({
      data: {
        content: responseContent,
        role: "assistant",
        conversationId,
        modelId: selectedModelId,
      },
    })

    await db.aIConversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    })

    return NextResponse.json({
      message: {
        id: assistantMessage.id,
        content: assistantMessage.content,
        role: assistantMessage.role,
        createdAt: assistantMessage.createdAt.toISOString(),
      },
    })
  } catch (error) {
    console.error("POST /api/ai/chat error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
