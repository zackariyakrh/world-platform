"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import {
  Hash,
  Search,
  Pin,
  Settings,
  ChevronDown,
  Users,
} from "lucide-react"

interface ChannelHeaderProps {
  channel: {
    id: string
    name: string
    topic: string | null
    memberCount: number
  }
}

export function ChannelHeader({ channel }: ChannelHeaderProps) {
  const [searchOpen, setSearchOpen] = React.useState(false)
  const [mobileOpen, setMobileOpen] = React.useState(true)

  return (
    <div className="flex items-center gap-2 border-b px-4 py-2.5 shadow-[0_1px_2px_oklch(from_var(--glow)_l_c_h_/_0.04)]">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <div className="flex items-center gap-1">
          <Hash className="size-4 shrink-0 text-primary drop-shadow-[0_0_4px_oklch(from_var(--primary)_l_c_h_/_0.3)]" />
          <h2 className="truncate text-sm font-semibold">{channel.name}</h2>
        </div>

        {channel.topic && (
          <>
            <Separator orientation="vertical" className="h-4" />
            <p className="hidden truncate text-xs text-muted-foreground md:block">
              {channel.topic}
            </p>
          </>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button variant="ghost" size="icon-sm" />
              }
            >
              <Users className="size-4" />
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {channel.memberCount} {channel.memberCount === 1 ? "member" : "members"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button variant="ghost" size="icon-sm" />
              }
            >
              <Search className="size-4" />
            </TooltipTrigger>
            <TooltipContent side="bottom">Search in channel</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button variant="ghost" size="icon-sm" />
              }
            >
              <Pin className="size-4" />
            </TooltipTrigger>
            <TooltipContent side="bottom">Pinned messages</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon-sm" />
            }
          >
            <Settings className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="end">
            <DropdownMenuItem>Channel settings</DropdownMenuItem>
            <DropdownMenuItem>Members</DropdownMenuItem>
            <DropdownMenuItem>Notifications</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
