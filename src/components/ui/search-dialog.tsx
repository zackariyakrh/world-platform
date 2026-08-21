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
  ArrowUpRight,
  MessageSquare,
  FolderKanban,
  StickyNote,
  Loader2,
  Search,
  Sparkles,
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

const typeConfig: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  channel: { label: "Channels", icon: Hash, color: "text-blue-500" },
  user: { label: "People", icon: User, color: "text-violet-500" },
  file: { label: "Files", icon: FileText, color: "text-amber-500" },
  task: { label: "Tasks", icon: CheckSquare, color: "text-emerald-500" },
  project: { label: "Projects", icon: FolderKanban, color: "text-rose-500" },
  note: { label: "Notes", icon: StickyNote, color: "text-teal-500" },
  message: { label: "Messages", icon: MessageSquare, color: "text-orange-500" },
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
        placeholder="Search anything..."
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <CommandList>
        <CommandEmpty>
          {loading ? (
            <div className="flex items-center justify-center gap-2.5 py-8">
              <Loader2 className="size-4 animate-spin text-muted-foreground/50" />
              <span className="text-sm text-muted-foreground/60">Searching...</span>
            </div>
          ) : searchQuery.trim() ? (
            <div className="flex flex-col items-center gap-2 py-8">
              <div className="flex size-10 items-center justify-center rounded-full bg-muted/50">
                <Search className="size-4 text-muted-foreground/40" />
              </div>
              <span className="text-sm text-muted-foreground/60">No results for &ldquo;{searchQuery}&rdquo;</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-8">
              <div className="flex size-10 items-center justify-center rounded-full bg-muted/50">
                <Sparkles className="size-4 text-muted-foreground/40" />
              </div>
              <span className="text-sm text-muted-foreground/60">Type to search across everything</span>
            </div>
          )}
        </CommandEmpty>

        {!searchQuery && recentSearches.length > 0 && (
          <CommandGroup heading="Recent">
            {recentSearches.map((search, i) => (
              <CommandItem
                key={`${search.query}-${i}`}
                value={`recent-${search.query}`}
                onSelect={() => setSearchQuery(search.query)}
              >
                <Clock className="size-4 text-muted-foreground/50" />
                <div className="flex flex-col min-w-0">
                  <span className="truncate text-sm">{search.query}</span>
                  <span className="text-[11px] text-muted-foreground/50">{search.time}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {!searchQuery && recentSearches.length === 0 && !loading && (
          <div className="flex flex-col items-center gap-3 py-10">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted/40">
              <Sparkles className="size-5 text-muted-foreground/30" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground/70">Quick search</p>
              <p className="mt-1 text-xs text-muted-foreground/40">Find channels, people, tasks, files & more</p>
            </div>
          </div>
        )}

        {searchQuery && hasResults && (
          <>
            {Object.entries(results).map(([type, items], groupIdx) => {
              if (!items.length) return null
              const config = typeConfig[type] || { label: type, icon: Hash, color: "text-muted-foreground" }
              const Icon = config.icon
              return (
                <React.Fragment key={type}>
                  {groupIdx > 0 && <CommandSeparator />}
                  <CommandGroup heading={config.label}>
                    {items.map((item, i) => (
                      <CommandItem
                        key={`${type}-${i}`}
                        value={`${type}-${item.title}-${i}`}
                        onSelect={() => handleSelect(item.url)}
                      >
                        <div className={`flex size-7 items-center justify-center rounded-md bg-muted/50 ${config.color}`}>
                          <Icon className="size-3.5" />
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="truncate text-sm font-medium">{item.title}</span>
                          {item.subtitle && (
                            <span className="text-[11px] text-muted-foreground/60 truncate">
                              {item.subtitle}
                            </span>
                          )}
                        </div>
                        <CommandShortcut>
                          <ArrowUpRight className="size-3.5 opacity-0 transition-opacity group-hover/command-item:opacity-100" />
                        </CommandShortcut>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </React.Fragment>
              )
            })}
          </>
        )}
      </CommandList>

      {/* Footer hint */}
      <div className="flex items-center gap-4 border-t border-border/30 px-4 py-2.5">
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/40">
          <kbd className="rounded border border-border/50 bg-muted/30 px-1 py-0.5 text-[10px] font-medium">↑↓</kbd>
          <span>Navigate</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/40">
          <kbd className="rounded border border-border/50 bg-muted/30 px-1 py-0.5 text-[10px] font-medium">↵</kbd>
          <span>Open</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/40">
          <kbd className="rounded border border-border/50 bg-muted/30 px-1 py-0.5 text-[10px] font-medium">Esc</kbd>
          <span>Close</span>
        </div>
      </div>
    </CommandDialog>
  )
}

export { SearchDialog, type SearchDialogProps }
