"use client"

import * as React from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { MobileNav } from "@/components/layout/mobile-nav"
import { SearchDialog } from "@/components/ui/search-dialog"

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
}: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
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
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        workspaceId={workspaceId}
        currentChannelId={channelId}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onChannelSelect={(id) => {
          onChannelSelect?.(id)
          setSidebarOpen(false)
        }}
        userRole={userRole}
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

        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          {children}
        </main>
      </div>

      <MobileNav
        activeHref={channelId ? `/channels/${channelId}` : "/"}
      />

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  )
}

export { AppLayout, type AppLayoutProps }
