import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { SpotifyDashboardClient } from "./spotify-dashboard-client"

export default async function SpotifyPage(props: {
  searchParams: Promise<{ connected?: string; error?: string }>
}) {
  const session = await auth()
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) return null

  const connection = await db.spotifyConnection.findUnique({
    where: { userId },
    select: {
      spotifyDisplayName: true,
      spotifyAvatarUrl: true,
      spotifyUserId: true,
      showOnProfile: true,
      showCurrentlyPlaying: true,
      privacyLevel: true,
    },
  })

  const params = await props.searchParams

  return (
    <SpotifyDashboardClient
      connection={connection}
      justConnected={params.connected === "true"}
      error={params.error ?? null}
    />
  )
}
