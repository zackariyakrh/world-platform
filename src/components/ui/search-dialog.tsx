"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
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
  FileText,
  CheckSquare,
  User,
  Clock,
  ArrowRight,
  MessageSquare,
  FolderKanban,
  StickyNote,
  Loader2,
} from "lucide-react"

interface SearchItem {
  type: string
  title: string
  subtitle: string
  url: string
}

interface SearchDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const typeConfig: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  channel: { label: "Channels", icon: Hash },
  user: { label: "People", icon: User },
  file: { label: "Files", icon: FileText },
  task: { label: "Tasks", icon: CheckSquare },
  project: { label: "Projects", icon: FolderKanban },
  note: { label: "Notes", icon: StickyNote },
  message: { label: "Messages", icon: MessageSquare },
}

function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = React.useState("")
  const [results, setResults] = React.useState<Record<string, SearchItem[]>>({})
  const [loading, setLoading] = React.useState(false)
  const [recentSearches, setRecentSearches] = React.useState<Array<{ query: string; time: string }>>([])

  React.useEffect(() => {
    if (!searchQuery.trim()) {
      setResults({})
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery.trim())}`)
        if (res.ok) {
          const data = await res.json()
          setResults(data)
        }
      } catch {
        setResults({})
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  function handleSelect(url: string) {
    if (searchQuery.trim()) {
      setRecentSearches((prev) => [
        { query: searchQuery.trim(), time: "Just now" },
        ...prev.filter((r) => r.query !== searchQuery.trim()).slice(0, 4),
      ])
    }
    setSearchQuery("")
    onOpenChange?.(false)
    router.push(url)
  }

  const hasResults = Object.values(results).some((arr) => arr.length > 0)

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
        <CommandEmpty>
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Searching...
            </div>
          ) : (
            "No results found."
          )}
        </CommandEmpty>

        {!searchQuery && recentSearches.length > 0 && (
          <>
            <CommandGroup heading="Recent Searches">
              {recentSearches.map((search, i) => (
                <CommandItem
                  key={`${search.query}-${i}`}
                  value={`recent-${search.query}`}
                  onSelect={() => setSearchQuery(search.query)}
                >
                  <Clock className="size-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span>{search.query}</span>
                    <span className="text-xs text-muted-foreground">{search.time}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {searchQuery && hasResults && (
          <>
            {Object.entries(results).map(([type, items]) => {
              if (!items.length) return null
              const config = typeConfig[type] || { label: type, icon: Hash }
              const Icon = config.icon
              return (
                <React.Fragment key={type}>
                  <CommandGroup heading={config.label}>
                    {items.map((item, i) => (
                      <CommandItem
                        key={`${type}-${i}`}
                        value={`${type}-${item.title}-${i}`}
                        onSelect={() => handleSelect(item.url)}
                      >
                        <Icon className="size-4 text-muted-foreground" />
                        <div className="flex flex-col min-w-0">
                          <span className="truncate">{item.title}</span>
                          {item.subtitle && (
                            <span className="text-xs text-muted-foreground truncate">
                              {item.subtitle}
                            </span>
                          )}
                        </div>
                        <CommandShortcut>
                          <ArrowRight className="size-3" />
                        </CommandShortcut>
                      </CommandItem>
                    ))}
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
