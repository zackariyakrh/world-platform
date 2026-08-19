import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"
import bcrypt from "bcryptjs"

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./dev.db" })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("Seeding database...")

  const password = await bcrypt.hash("admin123", 10)
  const demoPassword = await bcrypt.hash("demo123", 10)

  // ─── Users ────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: "admin@nexus.app" },
    update: {},
    create: {
      email: "admin@nexus.app",
      name: "Admin Owner",
      username: "admin",
      passwordHash: password,
      role: "owner",
      isSuperAdmin: true,
      status: "online",
      bio: "Platform owner and administrator.",
      jobTitle: "CEO & Founder",
    },
  })

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: "alice@nexus.app" },
      update: {},
      create: {
        email: "alice@nexus.app",
        name: "Alice Chen",
        username: "alice",
        passwordHash: demoPassword,
        role: "admin",
        status: "online",
        bio: "Full-stack developer passionate about clean code.",
        jobTitle: "Lead Developer",
        timezone: "America/New_York",
      },
    }),
    prisma.user.upsert({
      where: { email: "bob@nexus.app" },
      update: {},
      create: {
        email: "bob@nexus.app",
        name: "Bob Martinez",
        username: "bob",
        passwordHash: demoPassword,
        role: "manager",
        status: "away",
        bio: "Project manager who keeps things on track.",
        jobTitle: "Project Manager",
        timezone: "America/Chicago",
      },
    }),
    prisma.user.upsert({
      where: { email: "carol@nexus.app" },
      update: {},
      create: {
        email: "carol@nexus.app",
        name: "Carol Johnson",
        username: "carol",
        passwordHash: demoPassword,
        role: "moderator",
        status: "busy",
        bio: "UX designer creating delightful experiences.",
        jobTitle: "Senior Designer",
        timezone: "America/Los_Angeles",
      },
    }),
    prisma.user.upsert({
      where: { email: "dave@nexus.app" },
      update: {},
      create: {
        email: "dave@nexus.app",
        name: "Dave Kim",
        username: "dave",
        passwordHash: demoPassword,
        role: "member",
        status: "dnd",
        bio: "Marketing specialist and content creator.",
        jobTitle: "Marketing Specialist",
        timezone: "Asia/Seoul",
      },
    }),
    prisma.user.upsert({
      where: { email: "eve@nexus.app" },
      update: {},
      create: {
        email: "eve@nexus.app",
        name: "Eve Williams",
        username: "eve",
        passwordHash: demoPassword,
        role: "guest",
        status: "offline",
        bio: "Freelance illustrator contributing to the design system.",
        jobTitle: "Freelance Illustrator",
        timezone: "Europe/London",
      },
    }),
  ])

  const allUsers = [admin, ...users]
  const [alice, bob, carol, dave, eve] = users
  console.log(`Created ${allUsers.length} users`)

  // ─── Workspace ────────────────────────────────────────────
  const workspace = await prisma.workspace.upsert({
    where: { slug: "nexus-hq" },
    update: {},
    create: {
      name: "Nexus HQ",
      slug: "nexus-hq",
      description: "The main workspace for the Nexus team.",
      color: "#6366f1",
      isPublic: false,
      ownerId: admin.id,
    },
  })

  // ─── Workspace Members ────────────────────────────────────
  const memberRoles: Array<{ idx: number; role: string }> = [
    { idx: 0, role: "admin" },
    { idx: 1, role: "manager" },
    { idx: 2, role: "moderator" },
    { idx: 3, role: "member" },
    { idx: 4, role: "guest" },
  ]

  await prisma.workspaceMember.upsert({
    where: {
      userId_workspaceId: { userId: admin.id, workspaceId: workspace.id },
    },
    update: { role: "owner" },
    create: { userId: admin.id, workspaceId: workspace.id, role: "owner" },
  })

  for (const { idx, role } of memberRoles) {
    await prisma.workspaceMember.upsert({
      where: {
        userId_workspaceId: {
          userId: allUsers[idx].id,
          workspaceId: workspace.id,
        },
      },
      update: { role },
      create: {
        userId: allUsers[idx].id,
        workspaceId: workspace.id,
        role,
      },
    })
  }
  console.log("Created workspace members")

  // ─── Channels ─────────────────────────────────────────────
  const channelData = [
    { name: "general", description: "General discussion for the whole team", type: "text" },
    { name: "announcements", description: "Important announcements and updates", type: "announcement", isReadOnly: true },
    { name: "development", description: "Development discussions and code reviews", type: "text" },
    { name: "marketing", description: "Marketing campaigns and strategy", type: "text" },
    { name: "design", description: "Design assets, feedback, and critiques", type: "text" },
    { name: "random", description: "Off-topic conversations and fun stuff", type: "text" },
    { name: "project-alpha", description: "Dedicated channel for Project Alpha", type: "text" },
    { name: "Meeting Room", description: "Voice channel for meetings and calls", type: "voice" },
  ]

  const channels = []
  for (const ch of channelData) {
    const channel = await prisma.channel.upsert({
      where: {
        id: `seed-${ch.name}`,
      },
      update: {},
      create: {
        id: `seed-${ch.name}`,
        name: ch.name,
        description: ch.description,
        type: ch.type,
        isReadOnly: ch.isReadOnly ?? false,
        workspaceId: workspace.id,
        creatorId: admin.id,
      },
    })
    channels.push(channel)
  }
  console.log(`Created ${channels.length} channels`)

  // ─── Projects ─────────────────────────────────────────────
  const project1 = await prisma.project.upsert({
    where: { id: "seed-project-redesign" },
    update: {},
    create: {
      id: "seed-project-redesign",
      name: "Website Redesign",
      description: "Complete overhaul of the corporate website with modern design and improved UX.",
      status: "active",
      priority: "high",
      startDate: new Date("2026-01-15"),
      dueDate: new Date("2026-06-30"),
      progress: 35,
      tags: JSON.stringify(["design", "frontend", "ux"]),
      workspaceId: workspace.id,
      ownerId: admin.id,
    },
  })

  const project2 = await prisma.project.upsert({
    where: { id: "seed-project-mobile" },
    update: {},
    create: {
      id: "seed-project-mobile",
      name: "Mobile App",
      description: "Native mobile application for iOS and Android platforms.",
      status: "active",
      priority: "urgent",
      startDate: new Date("2026-02-01"),
      dueDate: new Date("2026-09-15"),
      progress: 20,
      tags: JSON.stringify(["mobile", "react-native", "cross-platform"]),
      workspaceId: workspace.id,
      ownerId: admin.id,
    },
  })

  const project3 = await prisma.project.upsert({
    where: { id: "seed-project-ai" },
    update: {},
    create: {
      id: "seed-project-ai",
      name: "AI Integration",
      description: "Integrate AI-powered features into the platform including chat and content generation.",
      status: "active",
      priority: "medium",
      startDate: new Date("2026-03-01"),
      dueDate: new Date("2026-08-31"),
      progress: 10,
      tags: JSON.stringify(["ai", "machine-learning", "api"]),
      workspaceId: workspace.id,
      ownerId: alice.id,
    },
  })

  console.log("Created 3 projects")

  // ─── Project Members ──────────────────────────────────────
  const projectMemberships = [
    { projectId: project1.id, userId: admin.id, role: "lead" },
    { projectId: project1.id, userId: carol.id, role: "member" },
    { projectId: project1.id, userId: alice.id, role: "member" },
    { projectId: project2.id, userId: alice.id, role: "lead" },
    { projectId: project2.id, userId: bob.id, role: "member" },
    { projectId: project2.id, userId: dave.id, role: "member" },
    { projectId: project3.id, userId: alice.id, role: "lead" },
    { projectId: project3.id, userId: admin.id, role: "member" },
    { projectId: project3.id, userId: carol.id, role: "viewer" },
  ]

  for (const pm of projectMemberships) {
    await prisma.projectMember.upsert({
      where: { projectId_userId: { projectId: pm.projectId, userId: pm.userId } },
      update: { role: pm.role },
      create: pm,
    })
  }
  console.log("Created project memberships")

  // ─── Tasks ────────────────────────────────────────────────
  const taskData = [
    {
      id: "seed-task-1",
      title: "Design new landing page mockups",
      description: "Create wireframes and high-fidelity mockups for the new landing page.",
      status: "in_progress",
      priority: "high",
      projectId: project1.id,
      assigneeId: carol.id,
      creatorId: admin.id,
      dueDate: new Date("2026-04-01"),
      estimatedHours: 40,
      order: 0,
    },
    {
      id: "seed-task-2",
      title: "Set up CI/CD pipeline",
      description: "Configure GitHub Actions for automated testing and deployment.",
      status: "done",
      priority: "medium",
      projectId: project1.id,
      assigneeId: alice.id,
      creatorId: admin.id,
      completedAt: new Date("2026-02-28"),
      estimatedHours: 16,
      order: 1,
    },
    {
      id: "seed-task-3",
      title: "Implement responsive navigation",
      description: "Build the responsive navigation component with mobile hamburger menu.",
      status: "todo",
      priority: "high",
      projectId: project1.id,
      assigneeId: alice.id,
      creatorId: admin.id,
      dueDate: new Date("2026-04-15"),
      estimatedHours: 24,
      order: 2,
    },
    {
      id: "seed-task-4",
      title: "Write API documentation",
      description: "Document all REST API endpoints with examples and schemas.",
      status: "backlog",
      priority: "low",
      projectId: project1.id,
      creatorId: bob.id,
      estimatedHours: 32,
      order: 3,
    },
    {
      id: "seed-task-5",
      title: "Design mobile app wireframes",
      description: "Create initial wireframes for the mobile application screens.",
      status: "in_progress",
      priority: "urgent",
      projectId: project2.id,
      assigneeId: carol.id,
      creatorId: alice.id,
      dueDate: new Date("2026-03-30"),
      estimatedHours: 30,
      order: 0,
    },
    {
      id: "seed-task-6",
      title: "Set up React Native project",
      description: "Initialize the React Native project with Expo and configure the build system.",
      status: "done",
      priority: "high",
      projectId: project2.id,
      assigneeId: alice.id,
      creatorId: alice.id,
      completedAt: new Date("2026-02-15"),
      estimatedHours: 12,
      order: 1,
    },
    {
      id: "seed-task-7",
      title: "Implement push notifications",
      description: "Set up Firebase Cloud Messaging for iOS and Android push notifications.",
      status: "todo",
      priority: "medium",
      projectId: project2.id,
      assigneeId: alice.id,
      creatorId: alice.id,
      dueDate: new Date("2026-05-01"),
      estimatedHours: 20,
      order: 2,
    },
    {
      id: "seed-task-8",
      title: "Create marketing launch plan",
      description: "Develop a comprehensive marketing plan for the mobile app launch.",
      status: "in_progress",
      priority: "high",
      projectId: project2.id,
      assigneeId: dave.id,
      creatorId: bob.id,
      dueDate: new Date("2026-04-20"),
      estimatedHours: 24,
      order: 3,
    },
    {
      id: "seed-task-9",
      title: "Research AI chatbot frameworks",
      description: "Evaluate different AI chatbot frameworks and select the best fit.",
      status: "done",
      priority: "medium",
      projectId: project3.id,
      assigneeId: alice.id,
      creatorId: alice.id,
      completedAt: new Date("2026-03-15"),
      estimatedHours: 16,
      order: 0,
    },
    {
      id: "seed-task-10",
      title: "Build AI conversation API",
      description: "Implement the backend API for AI-powered conversations with streaming support.",
      status: "in_progress",
      priority: "high",
      projectId: project3.id,
      assigneeId: alice.id,
      creatorId: alice.id,
      dueDate: new Date("2026-05-15"),
      estimatedHours: 40,
      order: 1,
    },
    {
      id: "seed-task-11",
      title: "Design AI chat interface",
      description: "Create the UI/UX for the AI chat interface including message bubbles and typing indicators.",
      status: "review",
      priority: "medium",
      projectId: project3.id,
      assigneeId: carol.id,
      creatorId: alice.id,
      dueDate: new Date("2026-04-30"),
      estimatedHours: 24,
      order: 2,
    },
    {
      id: "seed-task-12",
      title: "Performance audit",
      description: "Run Lighthouse and performance audits on the current site and fix critical issues.",
      status: "blocked",
      priority: "urgent",
      projectId: project1.id,
      assigneeId: alice.id,
      creatorId: bob.id,
      dueDate: new Date("2026-04-10"),
      estimatedHours: 16,
      order: 4,
    },
    {
      id: "seed-task-13",
      title: "User acceptance testing",
      description: "Organize and run UAT sessions for the mobile app beta.",
      status: "todo",
      priority: "medium",
      projectId: project2.id,
      assigneeId: bob.id,
      creatorId: alice.id,
      dueDate: new Date("2026-07-01"),
      estimatedHours: 20,
      order: 4,
    },
  ]

  for (const task of taskData) {
    await prisma.task.upsert({
      where: { id: task.id },
      update: {},
      create: {
        ...task,
        tags: JSON.stringify([task.status]),
      },
    })
  }
  console.log(`Created ${taskData.length} tasks`)

  // ─── Calendar Events ──────────────────────────────────────
  const now = new Date()
  const existingEvents = await prisma.calendarEvent.findMany({
    where: { workspaceId: workspace.id },
    select: { title: true },
  })
  const existingEventTitles = new Set(existingEvents.map((e) => e.title))

  const calendarEvents = [
    {
      title: "Sprint Planning",
      description: "Bi-weekly sprint planning meeting for all projects.",
      startTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
      type: "meeting",
      color: "#6366f1",
      creatorId: admin.id,
      recurrence: "weekly",
    },
    {
      title: "Website Redesign Deadline",
      description: "Final deadline for the website redesign project.",
      startTime: new Date("2026-06-30"),
      endTime: new Date("2026-06-30"),
      allDay: true,
      type: "deadline",
      color: "#ef4444",
      creatorId: admin.id,
    },
    {
      title: "Design Review",
      description: "Review latest design mockups with the team.",
      startTime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000 + 1.5 * 60 * 60 * 1000),
      type: "meeting",
      color: "#8b5cf6",
      creatorId: carol.id,
    },
    {
      title: "Mobile App Kickoff",
      description: "Official kickoff meeting for the mobile app project.",
      startTime: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000 + 1 * 60 * 60 * 1000),
      type: "milestone",
      color: "#10b981",
      creatorId: alice.id,
    },
  ]

  let eventsCreated = 0
  for (const event of calendarEvents) {
    if (!existingEventTitles.has(event.title)) {
      await prisma.calendarEvent.create({
        data: { ...event, workspaceId: workspace.id },
      })
      eventsCreated++
    }
  }
  console.log(`Created ${eventsCreated} calendar events`)

  // ─── AI Providers ─────────────────────────────────────────
  const openai = await prisma.aIProvider.upsert({
    where: { name: "openai" },
    update: { apiKey: "sk-placeholder-openai" },
    create: {
      name: "openai",
      displayName: "OpenAI",
      apiKey: "sk-placeholder-openai",
      baseUrl: "https://api.openai.com/v1",
      isEnabled: true,
    },
  })

  const existingOpenaiModels = await prisma.aIModel.findMany({ where: { providerId: openai.id } })
  if (existingOpenaiModels.length === 0) {
    await prisma.aIModel.createMany({
      data: [
        {
          name: "gpt-4o",
          displayName: "GPT-4o",
          modelId: "gpt-4o",
          providerId: openai.id,
          maxTokens: 128000,
          temperature: 0.7,
          isDefault: true,
        },
        {
          name: "gpt-4o-mini",
          displayName: "GPT-4o Mini",
          modelId: "gpt-4o-mini",
          providerId: openai.id,
          maxTokens: 128000,
          temperature: 0.7,
        },
      ],
    })
  }

  const anthropic = await prisma.aIProvider.upsert({
    where: { name: "anthropic" },
    update: { apiKey: "sk-placeholder-anthropic" },
    create: {
      name: "anthropic",
      displayName: "Anthropic",
      apiKey: "sk-placeholder-anthropic",
      baseUrl: "https://api.anthropic.com/v1",
      isEnabled: true,
    },
  })

  const existingAnthropicModels = await prisma.aIModel.findMany({ where: { providerId: anthropic.id } })
  if (existingAnthropicModels.length === 0) {
    await prisma.aIModel.create({
      data: {
        name: "claude-sonnet-4-20250514",
        displayName: "Claude Sonnet 4",
        modelId: "claude-sonnet-4-20250514",
        providerId: anthropic.id,
        maxTokens: 200000,
        temperature: 0.7,
      },
    })
  }

  await prisma.aIProvider.upsert({
    where: { name: "google" },
    update: {},
    create: {
      name: "google",
      displayName: "Google AI",
      apiKey: "sk-placeholder-google",
      isEnabled: false,
    },
  })

  console.log("Created 3 AI providers")

  // ─── App Settings ─────────────────────────────────────────
  const settings: Array<{ key: string; value: string }> = [
    { key: "app.name", value: "Nexus" },
    { key: "app.logo", value: "/logo.svg" },
    { key: "app.favicon", value: "/favicon.ico" },
    { key: "app.description", value: "Collaboration platform for modern teams" },
    { key: "theme.primaryColor", value: "#6366f1" },
    { key: "theme.secondaryColor", value: "#8b5cf6" },
    { key: "theme.accentColor", value: "#06b6d4" },
    { key: "theme.backgroundColor", value: "#0f172a" },
    { key: "theme.surfaceColor", value: "#1e293b" },
    { key: "theme.textColor", value: "#f8fafc" },
    { key: "auth.allowRegistration", value: "true" },
    { key: "auth.requireEmailVerification", value: "false" },
    { key: "auth.sessionTimeout", value: "7" },
    { key: "workspace.allowPublicWorkspaces", value: "false" },
    { key: "workspace.maxMembers", value: "100" },
    { key: "ai.defaultProvider", value: "openai" },
    { key: "ai.maxTokensPerRequest", value: "4096" },
    { key: "notifications.emailEnabled", value: "true" },
    { key: "notifications.desktopEnabled", value: "true" },
    { key: "files.maxUploadSize", value: "104857600" },
    { key: "files.allowedTypes", value: "image/*,application/pdf,.doc,.docx,.txt,.csv" },
  ]

  for (const setting of settings) {
    await prisma.appSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    })
  }
  console.log(`Created ${settings.length} app settings`)

  console.log("Seeding complete!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
