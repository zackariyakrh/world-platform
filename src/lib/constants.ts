export const ROLES = {
  OWNER: "owner",
  ADMIN: "admin",
  MANAGER: "manager",
  MODERATOR: "moderator",
  MEMBER: "member",
  GUEST: "guest",
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

export const PERMISSIONS = [
  "workspace.create",
  "workspace.edit",
  "workspace.delete",
  "workspace.manage_members",
  "workspace.view",
  "channel.create",
  "channel.edit",
  "channel.delete",
  "channel.manage_members",
  "channel.mute",
  "message.send",
  "message.edit_own",
  "message.edit_any",
  "message.delete_own",
  "message.delete_any",
  "message.pin",
  "message.react",
  "task.create",
  "task.edit_own",
  "task.edit_any",
  "task.delete",
  "task.assign",
  "project.create",
  "project.edit",
  "project.delete",
  "project.manage_members",
  "calendar.create",
  "calendar.edit_own",
  "calendar.edit_any",
  "calendar.delete",
  "meeting.create",
  "meeting.manage",
  "file.upload",
  "file.delete_own",
  "file.delete_any",
  "ai.use",
  "ai.manage_providers",
  "settings.view",
  "settings.edit",
  "audit.view",
  "admin.manage",
] as const

export type Permission = (typeof PERMISSIONS)[number]

export const CHANNEL_TYPES = {
  TEXT: "text",
  VOICE: "voice",
  VIDEO: "video",
  ANNOUNCEMENT: "announcement",
  SUPPORT: "support",
} as const

export type ChannelType = (typeof CHANNEL_TYPES)[keyof typeof CHANNEL_TYPES]

export const TASK_STATUSES = {
  BACKLOG: "backlog",
  TODO: "todo",
  IN_PROGRESS: "in_progress",
  REVIEW: "review",
  BLOCKED: "blocked",
  DONE: "done",
} as const

export type TaskStatus = (typeof TASK_STATUSES)[keyof typeof TASK_STATUSES]

export const TASK_PRIORITIES = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  URGENT: "urgent",
} as const

export type TaskPriority = (typeof TASK_PRIORITIES)[keyof typeof TASK_PRIORITIES]

export const PROJECT_STATUSES = {
  ACTIVE: "active",
  ARCHIVED: "archived",
  COMPLETED: "completed",
} as const

export type ProjectStatus = (typeof PROJECT_STATUSES)[keyof typeof PROJECT_STATUSES]

export const MEETING_STATUSES = {
  SCHEDULED: "scheduled",
  ACTIVE: "active",
  ENDED: "ended",
  CANCELLED: "cancelled",
} as const

export type MeetingStatus = (typeof MEETING_STATUSES)[keyof typeof MEETING_STATUSES]

export const NOTIFICATION_TYPES = {
  MENTION: "mention",
  MESSAGE: "message",
  TASK: "task",
  MEETING: "meeting",
  SYSTEM: "system",
  INVITATION: "invitation",
  COMMENT: "comment",
  REACTION: "reaction",
} as const

export type NotificationType = (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES]

export const AI_PROVIDERS = [
  { id: "openai", name: "OpenAI" },
  { id: "anthropic", name: "Anthropic" },
  { id: "google", name: "Google AI" },
  { id: "xai", name: "xAI" },
  { id: "openrouter", name: "OpenRouter" },
  { id: "mistral", name: "Mistral" },
  { id: "deepseek", name: "DeepSeek" },
] as const

export type AIProviderId = (typeof AI_PROVIDERS)[number]["id"]

export const DEFAULT_AVATAR_URL = "/avatars/default.png"

export const APP_NAME = "Nexus"
