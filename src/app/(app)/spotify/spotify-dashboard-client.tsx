"use client"

import * as React from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Music,
  Link2,
  Search,
  ListMusic,
  Loader2,
  ExternalLink,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  X,
  Clock,
  RefreshCw,
  Headphones,
} from "lucide-react"

interface Connection {
  spotifyDisplayName: string
  spotifyAvatarUrl: string | null
  spotifyUserId: string
  showOnProfile: boolean
  showCurrentlyPlaying: boolean
  privacyLevel: string
}

interface SpotifyTrack {
  id: string
  name: string
  artists: Array<{ id: string; name: string }>
  album: { id: string; name: string; images: Array<{ url: string }> }
  duration_ms: number
  external_urls: { spotify: string }
}

interface CurrentlyPlaying {
  is_playing: boolean
  progress_ms: number
  item: SpotifyTrack | null
  device: { name: string; type: string; volume_percent: number }
  shuffle_state: boolean
  repeat_state: string
}

interface Playlist {
  id: string
  name: string
  description: string | null
  images: Array<{ url: string }>
  owner: { display_name: string }
  tracks: { total: number }
  external_urls: { spotify: string }
}

interface SpotifyDashboardClientProps {
  connection: Connection | null
  justConnected: boolean
  error: string | null
}

export function SpotifyDashboardClient({ connection: initialConnection, justConnected, error }: SpotifyDashboardClientProps) {
  const [connection, setConnection] = React.useState<Connection | null>(initialConnection)
  const [connecting, setConnecting] = React.useState(false)
  const [current, setCurrent] = React.useState<CurrentlyPlaying | null>(null)
  const [loadingPlayer, setLoadingPlayer] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [searchResults, setSearchResults] = React.useState<any>(null)
  const [searching, setSearching] = React.useState(false)
  const [playlists, setPlaylists] = React.useState<Playlist[]>([])
  const [loadingPlaylists, setLoadingPlaylists] = React.useState(false)
  const [playlistDetail, setPlaylistDetail] = React.useState<any>(null)
  const [detailOpen, setDetailOpen] = React.useState(false)
  const [loadingDetail, setLoadingDetail] = React.useState(false)
  const searchTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(() => {
    if (justConnected) {
      toast.success("Spotify connected successfully!")
      fetchConnection()
    }
    if (error) {
      const messages: Record<string, string> = {
        denied: "Spotify authorization was denied.",
        missing_params: "Missing authorization parameters.",
        invalid_state: "Invalid authorization state. Please try again.",
        callback_failed: "Failed to complete Spotify connection.",
      }
      toast.error(messages[error] || "Spotify connection failed.")
    }
  }, [justConnected, error])

  React.useEffect(() => {
    if (connection) {
      fetchPlayer()
      const interval = setInterval(fetchPlayer, 15000)
      return () => clearInterval(interval)
    }
  }, [connection])

  async function fetchConnection() {
    try {
      const res = await fetch("/api/spotify")
      if (res.ok) {
        const data = await res.json()
        if (data.connected) setConnection(data)
      }
    } catch {}
  }

  async function handleConnect() {
    setConnecting(true)
    try {
      const res = await fetch("/api/spotify", { method: "POST" })
      if (res.ok) {
        const { authUrl } = await res.json()
        window.location.href = authUrl
      } else {
        toast.error("Failed to initiate Spotify connection")
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setConnecting(false)
    }
  }

  async function handleDisconnect() {
    try {
      await fetch("/api/spotify", { method: "DELETE" })
      setConnection(null)
      setCurrent(null)
      setPlaylists([])
      setSearchResults(null)
      toast.success("Spotify disconnected")
    } catch {
      toast.error("Failed to disconnect")
    }
  }

  async function fetchPlayer() {
    try {
      const res = await fetch("/api/spotify/player")
      if (res.ok) {
        const data = await res.json()
        setCurrent(data.currentlyPlaying || null)
      }
    } catch {}
  }

  async function playerAction(action: string, extra?: any) {
    try {
      await fetch("/api/spotify/player", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      })
      setTimeout(fetchPlayer, 500)
    } catch (e: any) {
      toast.error(e.message || "Playback control failed")
    }
  }

  function handleSearch(query: string) {
    setSearchQuery(query)
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    if (!query.trim()) {
      setSearchResults(null)
      return
    }
    searchTimeoutRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/spotify/search?q=${encodeURIComponent(query)}&type=track,artist,album,playlist&limit=20`)
        if (res.ok) setSearchResults(await res.json())
      } catch {} finally {
        setSearching(false)
      }
    }, 400)
  }

  async function fetchPlaylists() {
    setLoadingPlaylists(true)
    try {
      const res = await fetch("/api/spotify/playlists")
      if (res.ok) {
        const data = await res.json()
        setPlaylists(data.items || [])
      }
    } catch {} finally {
      setLoadingPlaylists(false)
    }
  }

  async function fetchPlaylistDetail(id: string) {
    setDetailOpen(true)
    setLoadingDetail(true)
    try {
      const res = await fetch(`/api/spotify/playlists/${id}`)
      if (res.ok) setPlaylistDetail(await res.json())
    } catch {} finally {
      setLoadingDetail(false)
    }
  }

  async function updateSettings(partial: Partial<Connection>) {
    try {
      const res = await fetch("/api/spotify", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(partial),
      })
      if (res.ok) {
        const data = await res.json()
        setConnection((prev) => prev ? { ...prev, ...data } : prev)
        toast.success("Settings updated")
      }
    } catch {
      toast.error("Failed to update settings")
    }
  }

  function formatMs(ms: number) {
    const mins = Math.floor(ms / 60000)
    const secs = Math.floor((ms % 60000) / 1000)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  if (!connection) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <div className="flex flex-col gap-1">
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground glow-text">
            <Music className="size-6 text-[#1DB954] drop-shadow-[0_0_8px_rgba(29,185,84,0.4)]" />
            Spotify
          </h1>
          <p className="text-base text-muted-foreground">Connect your Spotify account to listen and manage music.</p>
        </div>
        <div className="glow-card flex flex-col items-center justify-center gap-6 rounded-xl bg-card p-12 text-center">
          <div className="flex size-20 items-center justify-center rounded-2xl bg-[#1DB954]/10">
            <Music className="size-10 text-[#1DB954]" />
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-semibold text-foreground">Connect your Spotify account</h2>
            <p className="text-sm text-muted-foreground max-w-md">
              Link your Spotify account to search music, control playback, and show what you&apos;re listening to on your profile.
            </p>
          </div>
          <Button onClick={handleConnect} disabled={connecting} className="glow-button bg-[#1DB954] hover:bg-[#1ed760] text-white">
            {connecting ? <Loader2 className="size-4 animate-spin" /> : <Link2 className="size-4" />}
            Connect Spotify
          </Button>
          <p className="text-xs text-muted-foreground">
            You&apos;ll be redirected to Spotify to authorize this application.
          </p>
        </div>
      </div>
    )
  }

  const track = current?.item
  const isPlaying = current?.is_playing ?? false

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground glow-text">
            <Music className="size-6 text-[#1DB954] drop-shadow-[0_0_8px_rgba(29,185,84,0.4)]" />
            Spotify
          </h1>
          <p className="text-base text-muted-foreground">Connected as <span className="font-medium text-foreground">{connection.spotifyDisplayName}</span></p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-[#1DB954]/10 text-[#1DB954] border-[#1DB954]/20">
            Connected
          </Badge>
          <Button variant="outline" size="sm" onClick={handleDisconnect} className="text-destructive hover:bg-destructive/10">
            Disconnect
          </Button>
        </div>
      </div>

      {/* Currently Playing Card */}
      <div className="glow-card rounded-xl bg-card p-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase mb-4">
          <Headphones className="size-4" />
          Currently Playing
        </h3>
        {track ? (
          <div className="flex items-center gap-4">
            {track.album.images[0] && (
              <img src={track.album.images[0].url} alt={track.album.name} className="size-20 rounded-lg object-cover shadow-lg" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-lg font-semibold text-foreground truncate">{track.name}</p>
              <p className="text-sm text-muted-foreground truncate">
                {track.artists.map((a) => a.name).join(", ")}
              </p>
              <p className="text-xs text-muted-foreground truncate">{track.album.name}</p>
              {current && (
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-muted-foreground">{formatMs(current.progress_ms)}</span>
                  <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#1DB954] transition-all"
                      style={{ width: `${(current.progress_ms / track.duration_ms) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{formatMs(track.duration_ms)}</span>
                </div>
              )}
            </div>
            <div className="flex flex-col items-center gap-1">
              <p className="text-xs text-muted-foreground">{current?.device.name}</p>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon-sm" onClick={() => playerAction("previous")}>
                  <SkipBack className="size-4" />
                </Button>
                <Button
                  size="sm"
                  className="rounded-full bg-[#1DB954] hover:bg-[#1ed760] text-white size-9"
                  onClick={() => playerAction(isPlaying ? "pause" : "play")}
                >
                  {isPlaying ? <Pause className="size-4" /> : <Play className="size-4 ml-0.5" />}
                </Button>
                <Button variant="ghost" size="icon-sm" onClick={() => playerAction("next")}>
                  <SkipForward className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 py-4 text-muted-foreground">
            <Music className="size-8" />
            <p className="text-sm">No music currently playing</p>
          </div>
        )}
      </div>

      {/* Search + Playlists in 2 columns */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Search */}
        <div className="glow-card rounded-xl bg-card p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase mb-4">
            <Search className="size-4" />
            Search Music
          </h3>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search songs, artists, albums..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {searching && <div className="flex justify-center py-4"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>}
          {searchResults?.tracks?.items && (
            <div className="flex flex-col gap-1 max-h-80 overflow-y-auto">
              {searchResults.tracks.items.map((track: SpotifyTrack) => (
                <div key={track.id} className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-muted/50 group">
                  {track.album.images[track.album.images.length - 1] && (
                    <img src={track.album.images[track.album.images.length - 1].url} alt="" className="size-10 rounded object-cover" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{track.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{track.artists.map((a) => a.name).join(", ")}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatMs(track.duration_ms)}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-[#1DB954]"
                    onClick={() => playerAction("play", { trackUri: track.external_urls.spotify })}
                  >
                    <Play className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Playlists */}
        <div className="glow-card rounded-xl bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase">
              <ListMusic className="size-4" />
              Your Playlists
            </h3>
            {playlists.length === 0 && (
              <Button variant="outline" size="sm" onClick={fetchPlaylists} disabled={loadingPlaylists}>
                {loadingPlaylists ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
                Load
              </Button>
            )}
          </div>
          {playlists.length > 0 ? (
            <div className="flex flex-col gap-1 max-h-80 overflow-y-auto">
              {playlists.map((pl) => (
                <button
                  key={pl.id}
                  onClick={() => fetchPlaylistDetail(pl.id)}
                  className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-muted/50 text-left"
                >
                  {pl.images[0] ? (
                    <img src={pl.images[0].url} alt="" className="size-10 rounded object-cover" />
                  ) : (
                    <div className="flex size-10 items-center justify-center rounded bg-muted">
                      <ListMusic className="size-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{pl.name}</p>
                    <p className="text-xs text-muted-foreground">{pl.tracks.total} tracks</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              {loadingPlaylists ? "Loading playlists..." : "Click Load to see your playlists"}
            </p>
          )}
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="glow-card rounded-xl bg-card p-5">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-4">Privacy Settings</h3>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Show on profile</p>
              <p className="text-xs text-muted-foreground">Display your Spotify connection on your profile</p>
            </div>
            <Switch checked={connection.showOnProfile} onCheckedChange={(v) => updateSettings({ showOnProfile: v })} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Show currently playing</p>
              <p className="text-xs text-muted-foreground">Show what you&apos;re listening to</p>
            </div>
            <Switch checked={connection.showCurrentlyPlaying} onCheckedChange={(v) => updateSettings({ showCurrentlyPlaying: v })} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Activity visibility</p>
              <p className="text-xs text-muted-foreground">Who can see your Spotify activity</p>
            </div>
            <Select value={connection.privacyLevel} onValueChange={(v) => { if (v) updateSettings({ privacyLevel: v }) }}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="everyone">Everyone</SelectItem>
                <SelectItem value="members">Members only</SelectItem>
                <SelectItem value="hidden">Hidden</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Playlist Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          {loadingDetail ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : playlistDetail ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ListMusic className="size-5 text-[#1DB954]" />
                  {playlistDetail.name}
                </DialogTitle>
              </DialogHeader>
              <p className="text-xs text-muted-foreground">{playlistDetail.description}</p>
              <div className="flex flex-col gap-1">
                {playlistDetail.tracks?.items?.map((item: any, idx: number) => {
                  const t = item.track
                  if (!t) return null
                  return (
                    <div key={t.id + idx} className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-muted/50">
                      <span className="w-5 text-xs text-muted-foreground text-right">{idx + 1}</span>
                      {t.album?.images?.[t.album.images.length - 1] && (
                        <img src={t.album.images[t.album.images.length - 1].url} alt="" className="size-8 rounded object-cover" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{t.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{t.artists?.map((a: any) => a.name).join(", ")}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{formatMs(t.duration_ms)}</span>
                    </div>
                  )
                })}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
