"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Trash2, Eye, EyeOff } from "lucide-react"

const PROVIDER_OPTIONS = [
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
  { value: "google", label: "Google AI" },
  { value: "xai", label: "xAI" },
  { value: "openrouter", label: "OpenRouter" },
  { value: "mistral", label: "Mistral" },
  { value: "deepseek", label: "DeepSeek" },
  { value: "custom", label: "Custom" },
]

interface ModelInput {
  name: string
  displayName: string
  modelId: string
  maxTokens: number
  temperature: number
  isEnabled: boolean
  isDefault: boolean
}

interface AIProviderDialogProps {
  provider?: {
    name: string
    displayName: string
    apiKey: string
    baseUrl?: string | null
    isEnabled: boolean
  }
  onSave: (data: {
    name: string
    displayName: string
    apiKey: string
    baseUrl?: string
    isEnabled: boolean
    models: ModelInput[]
  }) => Promise<void>
}

export function AIProviderDialog({ provider, onSave }: AIProviderDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [showApiKey, setShowApiKey] = React.useState(false)
  const [selectedProvider, setSelectedProvider] = React.useState(
    provider?.name ?? ""
  )
  const [displayName, setDisplayName] = React.useState(
    provider?.displayName ?? ""
  )
  const [apiKey, setApiKey] = React.useState(provider?.apiKey ?? "")
  const [baseUrl, setBaseUrl] = React.useState(provider?.baseUrl ?? "")
  const [isEnabled, setIsEnabled] = React.useState(provider?.isEnabled ?? true)
  const [models, setModels] = React.useState<ModelInput[]>([])

  function addModel() {
    setModels((prev) => [
      ...prev,
      {
        name: "",
        displayName: "",
        modelId: "",
        maxTokens: 4096,
        temperature: 0.7,
        isEnabled: true,
        isDefault: prev.length === 0,
      },
    ])
  }

  function updateModel(index: number, field: keyof ModelInput, value: string | number | boolean) {
    setModels((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m))
    )
  }

  function removeModel(index: number) {
    setModels((prev) => prev.filter((_, i) => i !== index))
  }

  function handleProviderChange(value: string) {
    setSelectedProvider(value)
    const opt = PROVIDER_OPTIONS.find((o) => o.value === value)
    if (opt && !displayName) {
      setDisplayName(opt.label)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedProvider || !apiKey) return

    setLoading(true)
    try {
      await onSave({
        name: selectedProvider,
        displayName: displayName || selectedProvider,
        apiKey,
        baseUrl: baseUrl || undefined,
        isEnabled,
        models,
      })
      setOpen(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus className="size-3.5" />
        Add Provider
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {provider ? "Edit Provider" : "Add AI Provider"}
          </DialogTitle>
          <DialogDescription>
            Configure an AI provider and its models.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Provider</Label>
            <Select value={selectedProvider} onValueChange={(v) => v && handleProviderChange(v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                {PROVIDER_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="provider-display">Display Name</Label>
            <Input
              id="provider-display"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="My OpenAI Provider"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="provider-key">API Key</Label>
            <div className="flex items-center gap-2">
              <Input
                id="provider-key"
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? (
                  <EyeOff className="size-3.5" />
                ) : (
                  <Eye className="size-3.5" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="provider-base">Base URL (optional)</Label>
            <Input
              id="provider-base"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.openai.com/v1"
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border px-3 py-2">
            <Label htmlFor="provider-enabled">Enabled</Label>
            <Switch
              id="provider-enabled"
              checked={isEnabled}
              onCheckedChange={setIsEnabled}
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label>Models</Label>
              <Button type="button" variant="ghost" size="xs" onClick={addModel}>
                <Plus className="size-3" />
                Add Model
              </Button>
            </div>

            {models.map((model, i) => (
              <div
                key={i}
                className="flex flex-col gap-2 rounded-lg border p-3"
              >
                <div className="flex items-center justify-between">
                  <Badge variant="outline">Model {i + 1}</Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => removeModel(i)}
                  >
                    <Trash2 className="size-3 text-destructive" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Display name"
                    value={model.displayName}
                    onChange={(e) => updateModel(i, "displayName", e.target.value)}
                  />
                  <Input
                    placeholder="Model ID (e.g. gpt-4o)"
                    value={model.modelId}
                    onChange={(e) => updateModel(i, "modelId", e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !selectedProvider || !apiKey}>
              {loading ? "Saving..." : "Save Provider"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
