"use client"

import * as React from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, Check, Bot } from "lucide-react"

interface ModelProvider {
  id: string
  name: string
  displayName: string
}

interface AIModel {
  id: string
  name: string
  displayName: string
  modelId: string
  providerId: string
  provider: ModelProvider
}

interface ModelSelectorProps {
  models: AIModel[]
  selectedModelId?: string
  onSelect: (modelId: string) => void
}

function groupByProvider(models: AIModel[]): Record<string, AIModel[]> {
  const grouped: Record<string, AIModel[]> = {}
  for (const model of models) {
    const key = model.provider.displayName || model.provider.name
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(model)
  }
  return grouped
}

export function ModelSelector({ models, selectedModelId, onSelect }: ModelSelectorProps) {
  const grouped = groupByProvider(models)
  const selectedModel = models.find((m) => m.id === selectedModelId)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm" className="gap-2" />
        }
      >
        <Bot className="size-4" />
        <span className="max-w-[160px] truncate">
          {selectedModel ? selectedModel.displayName : "Select model"}
        </span>
        <ChevronDown className="size-3 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        {Object.entries(grouped).map(([providerName, providerModels]) => (
          <DropdownMenuGroup key={providerName}>
            <DropdownMenuLabel>{providerName}</DropdownMenuLabel>
            {providerModels.map((model) => (
              <DropdownMenuItem
                key={model.id}
                onClick={() => onSelect(model.id)}
                className="gap-2"
              >
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="truncate text-sm">{model.displayName}</span>
                  <Badge variant="secondary" className="shrink-0 text-[10px]">
                    {model.provider.name}
                  </Badge>
                </div>
                {model.id === selectedModelId && (
                  <Check className="size-4 shrink-0 text-primary" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        ))}
        {models.length === 0 && (
          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
            No models available
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
