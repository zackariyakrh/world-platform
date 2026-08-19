import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { BookmarksClient } from "./bookmarks-client"
import { Bookmark } from "lucide-react"

export default async function BookmarksPage() {
  const session = await auth()
  const userId = (session?.user as any)?.id as string | undefined

  if (!userId) return null

  const bookmarks = await db.bookmark.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground glow-text">
            <Bookmark className="size-6 text-primary drop-shadow-[0_0_8px_oklch(from_var(--primary)_l_c_h_/_0.4)]" />
            Bookmarks
          </h1>
          <p className="text-sm text-muted-foreground">
            Your saved items for quick access.
          </p>
        </div>
      </div>

      {bookmarks.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-border py-16 text-center">
          <Bookmark className="size-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            No bookmarks yet
          </p>
          <p className="text-xs text-muted-foreground/70">
            Bookmark messages, files, tasks, and more
          </p>
        </div>
      ) : (
        <BookmarksClient initialBookmarks={bookmarks as any} />
      )}
    </div>
  )
}
