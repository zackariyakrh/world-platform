"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  HelpCircle,
  MessageSquare,
  BookOpen,
  Bug,
  Mail,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Search,
} from "lucide-react"

const FAQ = [
  {
    q: "How do I change my password?",
    a: "Go to Settings > Profile and click 'Change Password'. You'll need to enter your current password and the new one.",
  },
  {
    q: "How do I create a channel?",
    a: "Click the + icon next to 'Channels' in the sidebar, or go to Explore > Channels and click 'Create Channel'. You need to be an admin or manager.",
  },
  {
    q: "How do I upload files?",
    a: "Go to the Files page from the sidebar, or drag and drop files into any message. Supported formats include images, documents, and code files.",
  },
  {
    q: "How do I enable dark mode?",
    a: "Click the theme toggle in the top-right header dropdown, or go to Settings > Appearance and select your preferred theme.",
  },
  {
    q: "How do I manage notifications?",
    a: "Go to Settings > Notifications to configure which events trigger in-app, email, or browser notifications.",
  },
  {
    q: "Can I use the app on mobile?",
    a: "Yes! Nexus is fully responsive. Open it in your mobile browser and add it to your home screen for an app-like experience.",
  },
  {
    q: "How do I invite team members?",
    a: "Go to Admin > Invitations to send invites by email. New users will be added to your workspace automatically.",
  },
  {
    q: "How do I use AI features?",
    a: "Click 'AI Assistant' in the sidebar. You can ask questions about your projects, get summaries, and generate content.",
  },
]

const QUICK_LINKS = [
  { label: "Profile Settings", href: "/settings/profile", icon: "👤" },
  { label: "Notifications", href: "/settings/notifications", icon: "🔔" },
  { label: "Appearance", href: "/settings/appearance", icon: "🎨" },
  { label: "Admin Panel", href: "/admin", icon: "⚙️" },
  { label: "Channels", href: "/explore", icon: "💬" },
  { label: "Projects", href: "/projects", icon: "📁" },
  { label: "AI Assistant", href: "/ai", icon: "🤖" },
  { label: "Calendar", href: "/calendar", icon: "📅" },
]

export default function HelpPage() {
  const [openFaq, setOpenFaq] = React.useState<number | null>(null)
  const [search, setSearch] = React.useState("")

  const filteredFaq = FAQ.filter(
    (item) =>
      item.q.toLowerCase().includes(search.toLowerCase()) ||
      item.a.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      <div>
        <h1 className="flex items-center gap-3 text-2xl font-bold">
          <HelpCircle className="size-7 text-primary" />
          Help & Support
        </h1>
        <p className="mt-2 text-muted-foreground">
          Find answers to common questions or get in touch with our team.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search help articles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border bg-muted/30 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="size-4" />
            Quick Links
          </CardTitle>
          <CardDescription>Jump to a specific section of the app</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {QUICK_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="flex items-center gap-2 rounded-lg border p-3 text-sm font-medium transition-colors hover:bg-muted"
              >
                <span className="text-base">{link.icon}</span>
                {link.label}
              </a>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <HelpCircle className="size-4" />
            Frequently Asked Questions
          </CardTitle>
          <CardDescription>
            {filteredFaq.length} article{filteredFaq.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {filteredFaq.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No results found. Try a different search term.
            </p>
          )}
          {filteredFaq.map((item, i) => (
            <div key={i} className="rounded-lg border">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="flex w-full items-center justify-between p-4 text-left text-sm font-medium transition-colors hover:bg-muted/50"
              >
                <span className="pr-4">{item.q}</span>
                {openFaq === i ? (
                  <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                )}
              </button>
              {openFaq === i && (
                <div className="border-t px-4 pb-4 pt-3 text-sm text-muted-foreground">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Contact Support */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="size-4" />
            Contact Support
          </CardTitle>
          <CardDescription>Can't find what you're looking for? Reach out to us.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-start gap-3 rounded-lg border p-4">
              <Mail className="mt-0.5 size-4 text-primary" />
              <div>
                <p className="text-sm font-medium">Email Us</p>
                <p className="text-xs text-muted-foreground">support@nexus.app</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border p-4">
              <Bug className="mt-0.5 size-4 text-primary" />
              <div>
                <p className="text-sm font-medium">Report a Bug</p>
                <p className="text-xs text-muted-foreground">github.com/nexus/issues</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg bg-muted/30 p-4">
            <p className="text-xs text-muted-foreground">
              Our support team typically responds within 24 hours during business days. For urgent issues, please
              include "URGENT" in your subject line.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Version Info */}
      <div className="flex items-center justify-between border-t pt-6">
        <p className="text-xs text-muted-foreground">Nexus Collaboration Platform</p>
        <Badge variant="secondary" className="text-[10px]">v1.0.0</Badge>
      </div>
    </div>
  )
}
