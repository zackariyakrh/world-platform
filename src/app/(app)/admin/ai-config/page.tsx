import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AIProviderDialog } from "@/components/admin/ai-provider-dialog"
import { Bot, Check, X, Key, Sparkles } from "lucide-react"

function maskApiKey(key: string) {
  if (!key || key.length <= 8) return "••••••••"
  return "••••••••" + key.slice(-4)
}

export default async function AIConfigPage() {
  const providers = await db.aIProvider.findMany({
    orderBy: { name: "asc" },
    include: {
      models: {
        orderBy: { name: "asc" },
      },
    },
  })

  async function saveProvider(data: {
    name: string
    displayName: string
    apiKey: string
    baseUrl?: string
    isEnabled: boolean
    models: Array<{
      name: string
      displayName: string
      modelId: string
      maxTokens: number
      temperature: number
      isEnabled: boolean
      isDefault: boolean
    }>
  }) {
    "use server"
    const session = await auth()
    if (!session?.user?.id) return

    await db.aIProvider.upsert({
      where: { name: data.name },
      create: {
        name: data.name,
        displayName: data.displayName,
        apiKey: data.apiKey,
        baseUrl: data.baseUrl,
        isEnabled: data.isEnabled,
        models: {
          create: data.models.map((m) => ({
            name: m.name,
            displayName: m.displayName,
            modelId: m.modelId,
            maxTokens: m.maxTokens,
            temperature: m.temperature,
            isEnabled: m.isEnabled,
            isDefault: m.isDefault,
          })),
        },
      },
      update: {
        displayName: data.displayName,
        apiKey: data.apiKey || undefined,
        baseUrl: data.baseUrl,
        isEnabled: data.isEnabled,
      },
    })
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
            <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground glow-text">
              <Sparkles className="size-6 text-primary drop-shadow-[0_0_8px_oklch(from_var(--primary)_l_c_h_/_0.4)]" />
              AI Configuration
            </h1>
          <p className="text-sm text-muted-foreground">
            Manage AI providers, API keys, and model settings.
          </p>
        </div>
        <AIProviderDialog onSave={saveProvider} />
      </div>

      {providers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <Bot className="size-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              No AI providers configured. Add one to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {providers.map((provider) => (
            <Card key={provider.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                      <Bot className="size-4 text-muted-foreground" />
                    </div>
                    <div>
                      <CardTitle>{provider.displayName}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <span className="font-mono text-xs">{provider.name}</span>
                        {provider.isEnabled ? (
                          <Badge variant="default" className="text-[10px]">
                            <Check className="size-2.5" /> Enabled
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px]">
                            <X className="size-2.5" /> Disabled
                          </Badge>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
                  <Key className="size-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">API Key:</span>
                  <code className="text-xs text-foreground">
                    {maskApiKey(provider.apiKey)}
                  </code>
                </div>
                {provider.baseUrl && (
                  <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
                    <span className="text-xs text-muted-foreground">Base URL:</span>
                    <code className="text-xs text-foreground">
                      {provider.baseUrl}
                    </code>
                  </div>
                )}
                {provider.models.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-muted-foreground">
                      Models ({provider.models.length})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {provider.models.map((model) => (
                        <Badge
                          key={model.id}
                          variant={model.isEnabled ? "secondary" : "outline"}
                        >
                          {model.displayName}
                          {model.isDefault && " (default)"}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
