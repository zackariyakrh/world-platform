"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { MobileNav } from "@/components/layout/mobile-nav"
import { SearchDialog } from "@/components/ui/search-dialog"
import { useMusicStore } from "@/stores/music-store"
import { GlobalMusicPlayerBar } from "@/components/music/global-music-player-bar"

interface AppLayoutProps {
  children: React.ReactNode
  workspaceId?: string
  title?: string
  channelId?: string
  onChannelSelect?: (channelId: string) => void
  headerActions?: React.ReactNode
  notificationCount?: number
  userName?: string | null
  userEmail?: string | null
  userAvatar?: string | null
  userRole?: string
  appName?: string
}

function AppLayout({
  children,
  workspaceId,
  title,
  channelId,
  onChannelSelect,
  headerActions,
  notificationCount = 0,
  userName,
  userEmail,
  userAvatar,
  userRole,
  appName,
}: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false)
  const [searchOpen, setSearchOpen] = React.useState(false)

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setSearchOpen(true)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <div className="flex h-screen overflow-hidden" style={{ "--sidebar-width": sidebarCollapsed ? "68px" : "256px" } as React.CSSProperties}>
      <Sidebar
        workspaceId={workspaceId}
        currentChannelId={channelId}
        open={sidebarOpen}
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
        onChannelSelect={(id) => {
          onChannelSelect?.(id)
          setSidebarOpen(false)
        }}
        userRole={userRole}
        appName={appName}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          title={title}
          actions={headerActions}
          onMenuClick={() => setSidebarOpen(true)}
          onSearchClick={() => setSearchOpen(true)}
          notificationCount={notificationCount}
          userName={userName}
          userEmail={userEmail}
          userAvatar={userAvatar}
        />

        <main className="relative flex-1 overflow-y-auto" id="main-content">
          {children}
        </main>

        <GlobalMusicPlayerBar />
      </div>

      <MobileNav
        activeHref={channelId ? `/channels/${channelId}` : "/"}
      />

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  )
}

export { AppLayout, type AppLayoutProps }
