import { db } from "@/lib/db"

export async function logAudit(
  userId: string | null,
  action: string,
  resource: string,
  resourceId: string,
  details?: Record<string, unknown> | string | null,
  ipAddress?: string
): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        userId,
        action,
        resource,
        resourceId,
        details: details
          ? typeof details === "string"
            ? details
            : JSON.stringify(details)
          : null,
        ipAddress: ipAddress ?? null,
      },
    })
  } catch (error) {
    console.error("Failed to write audit log:", error)
  }
}
