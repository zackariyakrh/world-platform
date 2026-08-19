import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { NoteCard } from "@/components/notes/note-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { FileText, Plus, Search } from "lucide-react"
import Link from "next/link"
import { EmptyState } from "@/components/ui/empty-state"

interface NotesPageProps {
  searchParams: Promise<{ search?: string; tag?: string }>
}

export default async function NotesPage({ searchParams }: NotesPageProps) {
  const session = await auth()
  const userId = (session?.user as any)?.id

  if (!userId) return null

  const params = await searchParams
  const search = params.search
  const tag = params.tag

  const where: any = { creatorId: userId }

  if (search) {
    where.OR = [
      { title: { contains: search } },
      { content: { contains: search } },
    ]
  }

  if (tag) {
    where.tags = { some: { name: tag } }
  }

  const notes = await db.note.findMany({
    where,
    include: { tags: true },
    orderBy: { updatedAt: "desc" },
  })

  const allTags = await db.noteTag.findMany({
    where: { note: { creatorId: userId } },
    distinct: ["name"],
    select: { id: true, name: true, color: true },
  })

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-1">
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground glow-text">
          <FileText className="size-6 text-primary drop-shadow-[0_0_8px_oklch(from_var(--primary)_l_c_h_/_0.4)]" />
          Notes
        </h1>
        <p className="text-sm text-muted-foreground">
          Your personal knowledge base
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <form>
            <Input
              name="search"
              defaultValue={search || ""}
              placeholder="Search notes..."
              className="glow-input pl-9 transition-all duration-300"
            />
          </form>
        </div>
        <Button render={<Link href="/notes/new" />}>
          <Plus className="size-3.5" />
          New Note
        </Button>
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Badge variant={tag ? "outline" : "default"}>
            <Link href="/notes">All</Link>
          </Badge>
          {allTags.map((t) => (
            <Badge
              key={t.id}
              variant={tag === t.name ? "default" : "outline"}
              style={
                tag !== t.name && t.color
                  ? { borderColor: t.color, color: t.color }
                  : undefined
              }
            >
              <Link href={`/notes?tag=${encodeURIComponent(t.name)}${search ? `&search=${encodeURIComponent(search)}` : ""}`}>
                {t.name}
              </Link>
            </Badge>
          ))}
        </div>
      )}

      {notes.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No notes yet"
          description="Create your first note to get started"
          action={{
            label: "Create Note",
            onClick: () => {},
          }}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} />
          ))}
        </div>
      )}
    </div>
  )
}
