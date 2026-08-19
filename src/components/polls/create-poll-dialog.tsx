"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Plus, X } from "lucide-react"

interface CreatePollDialogProps {
  onCreate: (poll: {
    question: string
    options: string[]
    isAnonymous: boolean
    allowMultiple: boolean
    expiresAt: string | null
  }) => void
  onClose: () => void
}

export function CreatePollDialog({ onCreate, onClose }: CreatePollDialogProps) {
  const [question, setQuestion] = useState("")
  const [options, setOptions] = useState<string[]>(["", ""])
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [allowMultiple, setAllowMultiple] = useState(false)
  const [expiresAt, setExpiresAt] = useState("")

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, ""])
    }
  }

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index))
    }
  }

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  const handleSubmit = () => {
    const validOptions = options.filter((o) => o.trim())
    if (!question.trim() || validOptions.length < 2) return

    onCreate({
      question: question.trim(),
      options: validOptions,
      isAnonymous,
      allowMultiple,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
    })
  }

  const isValid = question.trim() && options.filter((o) => o.trim()).length >= 2

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Poll</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="question">Question</Label>
            <Input
              id="question"
              placeholder="What do you want to ask?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Options</Label>
            <div className="space-y-2">
              {options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    placeholder={`Option ${index + 1}`}
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                  />
                  {options.length > 2 && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeOption(index)}
                    >
                      <X className="size-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            {options.length < 10 && (
              <Button
                variant="outline"
                size="sm"
                onClick={addOption}
                className="mt-1"
              >
                <Plus className="mr-1 size-3" />
                Add Option
              </Button>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Anonymous voting</Label>
                <p className="text-xs text-muted-foreground">
                  Hide who voted for what
                </p>
              </div>
              <Switch
                checked={isAnonymous}
                onCheckedChange={setIsAnonymous}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Multiple choices</Label>
                <p className="text-xs text-muted-foreground">
                  Allow selecting more than one option
                </p>
              </div>
              <Switch
                checked={allowMultiple}
                onCheckedChange={setAllowMultiple}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiry">Expiry (optional)</Label>
              <Input
                id="expiry"
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid}>
            Create Poll
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
