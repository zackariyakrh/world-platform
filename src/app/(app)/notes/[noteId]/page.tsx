import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { NoteEditor } from "@/components/notes/note-editor"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Trash2 } from "lucide-react"
import Link from "next/link"

interface NoteDetailPageProps {
  params: Promise<{ noteId: string }>
}

export default async function NoteDetailPage({ params }: NoteDetailPageProps) {
  const session = await auth()
  const userId = (session?.user as any)?.id

  if (!userId) return null

  const { noteId } = await params

  const note = await db.note.findUnique({
    where: { id: noteId },
    include: { tags: true },
  })

  if (!note) {
    notFound()
  }

  if (note.creatorId !== userId) {
    notFound()
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon-sm" render={<Link href="/notes" />}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1" />
        <form
          action={async () => {
            "use server"
            await db.note.delete({ where: { id: noteId } })
          }}
        >
          <Button variant="destructive" size="sm" type="submit">
            <Trash2 className="size-3.5" />
            Delete
          </Button>
        </form>
      </div>

      <NoteEditor note={note} onSave={() => {}} />
    </div>
  )
}
