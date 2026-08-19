"use client"

import * as React from "react"
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import {
  Hash,
  Volume2,
  FileText,
  CheckSquare,
  User,
  Clock,
  ArrowRight,
} from "lucide-react"

interface SearchResult {
  id: string
  title: string
  subtitle?: string
  type: "channel" | "message" | "file" | "task" | "person"
  icon: React.ComponentType<{ className?: string }>
}

const mockRecentSearches = [
  { id: "r1", query: "project timeline", timestamp: "2 hours ago" },
  { id: "r2", query: "design review meeting", timestamp: "Yesterday" },
  { id: "r3", query: "API documentation", timestamp: "3 days ago" },
]

const mockResults: SearchResult[] = [
  {
    id: "ch-1",
    title: "general",
    subtitle: "Nexus Team",
    type: "channel",
    icon: Hash,
  },
  {
    id: "ch-2",
    title: "frontend",
    subtitle: "Nexus Team",
    type: "channel",
    icon: Hash,
  },
  {
    id: "ch-3",
    title: "standup",
    subtitle: "Nexus Team",
    type: "channel",
    icon: Volume2,
  },
  {
    id: "p-1",
    title: "Alice Chen",
    subtitle: "alice@nexus.dev",
    type: "person",
    icon: User,
  },
  {
    id: "p-2",
    title: "Bob Williams",
    subtitle: "bob@nexus.dev",
    type: "person",
    icon: User,
  },
  {
    id: "f-1",
    title: "Q4 Roadmap.pdf",
    subtitle: "Shared in #general",
    type: "file",
    icon: FileText,
  },
  {
    id: "t-1",
    title: "Implement auth flow",
    subtitle: "Assigned to you",
    type: "task",
    icon: CheckSquare,
  },
  {
    id: "t-2",
    title: "Design system update",
    subtitle: "Due in 3 days",
    type: "task",
    icon: CheckSquare,
  },
]

interface SearchDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [recentSearches, setRecentSearches] = React.useState(
    mockRecentSearches
  )

  const filteredResults = React.useMemo(() => {
    if (!searchQuery) return []
    const query = searchQuery.toLowerCase()
    return mockResults.filter(
      (r) =>
        r.title.toLowerCase().includes(query) ||
        r.subtitle?.toLowerCase().includes(query)
    )
  }, [searchQuery])

  const handleSelect = () => {
    if (searchQuery) {
      setRecentSearches((prev) => [
        { id: `r-${Date.now()}`, query: searchQuery, timestamp: "Just now" },
        ...prev.slice(0, 4),
      ])
    }
    setSearchQuery("")
    onOpenChange?.(false)
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search Nexus"
      description="Search messages, files, tasks, people, and channels"
    >
      <CommandInput
        placeholder="Type to search..."
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {!searchQuery && recentSearches.length > 0 && (
          <>
            <CommandGroup heading="Recent Searches">
              {recentSearches.map((search) => (
                <CommandItem
                  key={search.id}
                  value={search.query}
                  onSelect={() => {
                    setSearchQuery(search.query)
                  }}
                >
                  <Clock className="size-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span>{search.query}</span>
                    <span className="text-xs text-muted-foreground">
                      {search.timestamp}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {searchQuery && filteredResults.length > 0 && (
          <>
            {["channel", "person", "file", "task"].map((type) => {
              const typeResults = filteredResults.filter(
                (r) => r.type === type
              )
              if (typeResults.length === 0) return null

              const groupLabels: Record<string, string> = {
                channel: "Channels",
                person: "People",
                file: "Files",
                task: "Tasks",
              }

              return (
                <React.Fragment key={type}>
                  <CommandGroup heading={groupLabels[type]}>
                    {typeResults.map((result) => {
                      const Icon = result.icon
                      return (
                        <CommandItem
                          key={result.id}
                          value={`${type}-${result.id}`}
                          onSelect={() => handleSelect()}
                        >
                          <Icon className="size-4 text-muted-foreground" />
                          <div className="flex flex-col">
                            <span>{result.title}</span>
                            {result.subtitle && (
                              <span className="text-xs text-muted-foreground">
                                {result.subtitle}
                              </span>
                            )}
                          </div>
                          <CommandShortcut>
                            <ArrowRight className="size-3" />
                          </CommandShortcut>
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                  <CommandSeparator />
                </React.Fragment>
              )
            })}
          </>
        )}
      </CommandList>
    </CommandDialog>
  )
}

export { SearchDialog, type SearchDialogProps }
