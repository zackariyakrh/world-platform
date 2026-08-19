import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { FileManager } from "@/components/files/file-manager"
import { File } from "lucide-react"

export default async function FilesPage() {
  const session = await auth()
  const userId = (session?.user as any)?.id as string | undefined

  if (!userId) return null

  const files = await db.file.findMany({
    where: {
      OR: [
        { uploaderId: userId },
        { workspace: { members: { some: { userId } } } },
      ],
    },
    include: {
      uploader: { select: { id: true, name: true, avatar: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      workspaceMembers: {
        select: {
          workspace: { select: { id: true, name: true } },
        },
      },
    },
  })

  const workspaces = user?.workspaceMembers.map((wm) => wm.workspace) ?? []

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-1">
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground glow-text">
          <File className="size-6 text-primary drop-shadow-[0_0_8px_oklch(from_var(--primary)_l_c_h_/_0.4)]" />
          Files
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage and share files across your workspaces.
        </p>
      </div>
      <FileManager
        files={files as any}
        workspaces={workspaces}
        currentUserId={userId}
      />
    </div>
  )
}
