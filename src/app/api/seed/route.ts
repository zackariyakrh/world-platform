import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}
function pickN<T>(arr: T[], n: number): T[] {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, n)
}
function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

const NAMES = [
  "Liam Carter", "Olivia Bennett", "Noah Thompson", "Emma Roberts",
  "William Hayes", "Sophia Foster", "James Mitchell", "Mia Carter",
  "Benjamin Ross", "Charlotte Gray", "Lucas Perry", "Amelia Stone",
  "Henry Wells", "Harper Marsh", "Alexander Cole", "Ella Price",
  "Daniel Hughes", "Grace Simmons", "Matthew Brooks", "Chloe Morgan",
]
const STATUSES = ["online", "away", "busy", "offline"]
const JOB_TITLES = [
  "Software Engineer", "Product Designer", "Project Manager", "Data Analyst",
  "DevOps Engineer", "Frontend Developer", "Backend Developer", "UX Designer",
  "Marketing Manager", "Sales Representative", "HR Coordinator", "QA Engineer",
]

export async function POST() {
  const session = await auth()
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await db.user.findUnique({ where: { id: userId }, select: { role: true } })
  if (user?.role !== "owner" && user?.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 })
  }

  const existingUsers = await db.user.count()
  if (existingUsers > 5) {
    return NextResponse.json({ error: "Data already seeded. Delete existing data first." }, { status: 400 })
  }

  // Find the owner (or use current user)
  const owner = await db.user.findFirst({ where: { role: "owner" } }) || await db.user.findFirst()
  if (!owner) return NextResponse.json({ error: "No users found" }, { status: 400 })
  const allUserRows = await db.user.findMany({ take: 25 })
  const allUserIds = allUserRows.map(u => u.id)

  // Create users
  const passwordHash = await (await import("bcryptjs")).hash("password123", 10)
  const newUserIds: string[] = []

  for (const fullName of NAMES) {
    const [firstName, lastName] = fullName.split(" ")
    const num = String(Math.floor(Math.random() * 900 + 100))
    const username = firstName.toLowerCase() + num
    try {
      const u = await db.user.create({
        data: {
          email: `${username}@example.com`,
          name: fullName, firstName, lastName, username, passwordHash,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
          jobTitle: pick(JOB_TITLES), status: pick(STATUSES), role: "member", isActive: true,
        },
      })
      newUserIds.push(u.id)
    } catch {}
  }

  const userIds = [owner.id, ...allUserIds.filter(id => id !== owner.id), ...newUserIds]

  // Workspaces
  const wsData = [
    { name: "Nexus HQ", slug: "nexus-hq", description: "Main company workspace" },
    { name: "Design Studio", slug: "design-studio", description: "Creative team workspace" },
    { name: "Marketing Ops", slug: "marketing-ops", description: "Marketing campaigns" },
  ]
  const wsIds: string[] = []
  for (const ws of wsData) {
    const w = await db.workspace.create({ data: { ...ws, isPublic: true, ownerId: owner.id } })
    wsIds.push(w.id)
    for (const uid of userIds) {
      await db.workspaceMember.upsert({
        where: { userId_workspaceId: { userId: uid, workspaceId: w.id } },
        update: {},
        create: { userId: uid, workspaceId: w.id, role: uid === owner.id ? "owner" : "member" },
      }).catch(() => {})
    }
  }

  // Channels
  const chData = [
    { name: "general", description: "General discussion", type: "text" },
    { name: "announcements", description: "Company announcements", type: "announcement" },
    { name: "engineering", description: "Technical discussions", type: "text" },
    { name: "design", description: "Design feedback", type: "text" },
    { name: "random", description: "Off-topic chat", type: "text" },
    { name: "help-desk", description: "Get help", type: "support" },
    { name: "leadership", description: "Leadership team", type: "text" },
    { name: "devops", description: "Infrastructure", type: "text" },
    { name: "product", description: "Product planning", type: "text" },
    { name: "watercooler", description: "Casual chat", type: "text" },
  ]
  const chIds: string[] = []
  for (const wsId of wsIds) {
    for (const ch of chData) {
      const c = await db.channel.create({
        data: { ...ch, isPrivate: ch.name === "leadership", workspaceId: wsId, creatorId: owner.id },
      })
      chIds.push(c.id)
      for (const uid of pickN(userIds, Math.floor(Math.random() * 10) + 5)) {
        await db.channelMember.create({
          data: { userId: uid, channelId: c.id, role: uid === owner.id ? "admin" : "member" },
        }).catch(() => {})
      }
    }
  }

  // Groups
  const gData = [
    { name: "Frontend Team", description: "React and UI devs", isPrivate: false },
    { name: "Backend Team", description: "Node.js and API devs", isPrivate: false },
    { name: "Design Guild", description: "UI/UX designers", isPrivate: false },
    { name: "DevOps Squad", description: "Infrastructure", isPrivate: true },
    { name: "Product Council", description: "Product managers", isPrivate: true },
    { name: "New Hires", description: "Onboarding group", isPrivate: false },
    { name: "Open Source", description: "OSS contributors", isPrivate: false },
  ]
  for (const wsId of wsIds) {
    for (const g of gData) {
      const group = await db.group.create({
        data: { ...g, workspaceId: wsId, creatorId: owner.id, members: { create: { userId: owner.id, role: "admin" } } },
      })
      for (const uid of pickN(userIds, Math.floor(Math.random() * 8) + 3)) {
        await db.groupMember.create({ data: { userId: uid, groupId: group.id, role: "member" } }).catch(() => {})
      }
    }
  }

  // Projects
  const pData = [
    { name: "Website Redesign", description: "Complete website redesign", status: "active", priority: "high", progress: 45 },
    { name: "Mobile App v2", description: "Native mobile app", status: "active", priority: "urgent", progress: 30 },
    { name: "API Gateway", description: "Centralized API gateway", status: "active", priority: "high", progress: 60 },
    { name: "Analytics Dashboard", description: "Real-time analytics", status: "active", priority: "medium", progress: 20 },
    { name: "Design System", description: "Shared component library", status: "active", priority: "medium", progress: 50 },
    { name: "CI/CD Pipeline", description: "Automated deployment", status: "active", priority: "high", progress: 75 },
    { name: "Documentation Portal", description: "Developer docs", status: "completed", priority: "medium", progress: 100 },
    { name: "Legacy Migration", description: "Migrate legacy systems", status: "active", priority: "low", progress: 10 },
  ]
  const projIds: string[] = []
  for (const wsId of wsIds) {
    for (const p of pickN(pData, 5)) {
      const proj = await db.project.create({
        data: {
          ...p, workspaceId: wsId, ownerId: owner.id,
          startDate: randomDate(new Date("2026-01-01"), new Date("2026-06-01")),
          dueDate: randomDate(new Date("2026-09-01"), new Date("2027-03-01")),
          members: { create: { userId: owner.id, role: "lead" } },
        },
      })
      projIds.push(proj.id)
      for (const uid of pickN(userIds, Math.floor(Math.random() * 5) + 2)) {
        await db.projectMember.create({ data: { userId: uid, projectId: proj.id, role: "member" } }).catch(() => {})
      }
    }
  }

  // Tasks
  const taskTitles = [
    "Set up scaffolding", "Design wireframes", "Implement auth flow", "Create API endpoints",
    "Write unit tests", "Set up CI/CD", "Design DB schema", "Build user dashboard",
    "Implement notifications", "Create onboarding", "Set up monitoring", "Write docs",
    "Implement search", "Build admin panel", "Create email templates", "Optimize queries",
    "Set up error tracking", "Implement file upload", "Build settings page", "Create analytics",
  ]
  for (const pid of projIds) {
    for (let i = 0; i < Math.floor(Math.random() * 8) + 5; i++) {
      await db.task.create({
        data: {
          title: pick(taskTitles), description: "Task description",
          status: pick(["backlog", "todo", "in_progress", "review", "blocked", "done"]),
          priority: pick(["low", "medium", "high", "urgent"]),
          dueDate: randomDate(new Date("2026-08-01"), new Date("2027-01-01")),
          estimatedHours: Math.floor(Math.random() * 40) + 1,
          projectId: pid, assigneeId: pick(userIds), creatorId: owner.id, order: i,
        },
      })
    }
  }

  // Messages
  const msgs = [
    "Hey team, great work!", "Has anyone seen the specs?", "Deployed the hotfix.",
    "Can someone review my PR?", "Client meeting went well.", "Let's sync tomorrow.",
    "Found a bug in login flow.", "Docs are live!", "Metrics look great.",
    "Coffee break?", "Deadline moved to Friday.", "Great user testing feedback.",
    "Working remotely today.", "Feature ready for QA.", "Schedule code review?",
    "Merged the branch.", "DB migration complete.", "Need help with that?",
    "Standup notes in channel.", "Happy Friday!",
  ]
  for (const chId of chIds.slice(0, 10)) {
    for (let i = 0; i < Math.floor(Math.random() * 15) + 5; i++) {
      await db.message.create({
        data: {
          content: pick(msgs), type: "text", channelId: chId,
          userId: pick(userIds), workspaceId: pick(wsIds),
          createdAt: randomDate(new Date("2026-07-01"), new Date("2026-08-21")),
        },
      })
    }
  }

  // Calendar Events
  const evData = [
    { title: "Sprint Planning", description: "Plan next sprint", type: "meeting", color: "#3b82f6" },
    { title: "Design Review", description: "Review mockups", type: "meeting", color: "#8b5cf6" },
    { title: "Product Demo", description: "Demo features", type: "meeting", color: "#10b981" },
    { title: "API Freeze", description: "No API changes", type: "deadline", color: "#ef4444" },
    { title: "v2.0 Release", description: "Major release", type: "milestone", color: "#06b6d4" },
    { title: "Team Building", description: "Offsite event", type: "event", color: "#ec4899" },
  ]
  for (const wsId of wsIds) {
    for (const e of pickN(evData, 4)) {
      const start = randomDate(new Date("2026-08-21"), new Date("2026-12-31"))
      const end = new Date(start.getTime() + (Math.random() * 3 + 1) * 3600000)
      await db.calendarEvent.create({
        data: { ...e, startTime: start, endTime: end, visibility: "public", workspaceId: wsId, creatorId: owner.id },
      })
    }
  }

  // Notes
  const notes = [
    { title: "Sprint Planning Notes", content: "# Sprint Planning\nGoals: Finalize Q3 roadmap, assign tasks, set milestones" },
    { title: "API Gateway Decision", content: "# API Gateway\nDecision: Going with Kong for flexibility" },
    { title: "Brand Guidelines", content: "# Brand\nPrimary: #3b82f6, Secondary: #8b5cf6" },
    { title: "Onboarding Checklist", content: "# Onboarding\n- Set up dev env\n- Get repo access\n- Meet the team" },
  ]
  for (const wsId of wsIds) {
    for (const n of notes) {
      await db.note.create({ data: { ...n, isPublished: true, workspaceId: wsId, creatorId: owner.id } })
    }
  }

  // Friend Requests
  for (let i = 0; i < 15; i++) {
    await db.friend.create({
      data: {
        userId: pick(userIds), friendId: pick(userIds.filter(u => u !== owner.id)),
        status: pick(["accepted", "pending"]),
      },
    }).catch(() => {})
  }

  return NextResponse.json({ success: true, message: "Seed data created successfully" })
}
