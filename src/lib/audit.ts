/**
 * Audit Logging Library
 * Provides immutable audit trail functionality with tamper detection via checksums.
 */

import { db } from "./db";
import { scheduleAuditLog } from "./schema";
import { eq, desc } from "drizzle-orm";
import crypto from "crypto";

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "publish"
  | "archive"
  | "override"
  | "approve"
  | "deny"
  | "ai_tool_call"
  | "ai_proposal"
  | "bulk_operation";

export interface AuditLogEntry {
  userId: string;
  scheduleId?: string;
  shiftId?: string;
  action: AuditAction;
  previousState?: Record<string, unknown> | null;
  newState?: Record<string, unknown> | null;
  reason?: string;
  aiGenerated?: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * Generate a SHA-256 checksum for an audit log entry.
 * This allows tamper detection by verifying the checksum matches the entry data.
 */
function generateChecksum(entry: {
  userId: string;
  scheduleId?: string | null;
  shiftId?: string | null;
  action: string;
  previousState?: unknown;
  newState?: unknown;
  reason?: string | null;
  aiGenerated?: boolean;
  createdAt: Date;
}): string {
  const dataToHash = JSON.stringify({
    userId: entry.userId,
    scheduleId: entry.scheduleId,
    shiftId: entry.shiftId,
    action: entry.action,
    previousState: entry.previousState,
    newState: entry.newState,
    reason: entry.reason,
    aiGenerated: entry.aiGenerated,
    createdAt: entry.createdAt.toISOString(),
  });

  return crypto.createHash("sha256").update(dataToHash).digest("hex");
}

/**
 * Create an immutable audit log entry.
 * Once created, audit logs should never be updated or deleted.
 */
export async function createAuditLog(entry: AuditLogEntry): Promise<string> {
  const createdAt = new Date();

  // Include metadata in the new state if provided
  const newStateWithMetadata = entry.newState
    ? { ...entry.newState, _metadata: entry.metadata }
    : entry.metadata
      ? { _metadata: entry.metadata }
      : null;

  const checksum = generateChecksum({
    userId: entry.userId,
    scheduleId: entry.scheduleId,
    shiftId: entry.shiftId,
    action: entry.action,
    previousState: entry.previousState,
    newState: newStateWithMetadata,
    reason: entry.reason,
    aiGenerated: entry.aiGenerated ?? false,
    createdAt,
  });

  const [log] = await db
    .insert(scheduleAuditLog)
    .values({
      userId: entry.userId,
      scheduleId: entry.scheduleId,
      shiftId: entry.shiftId,
      action: entry.action,
      previousState: entry.previousState,
      newState: newStateWithMetadata,
      reason: entry.reason,
      aiGenerated: entry.aiGenerated ?? false,
      checksum,
      createdAt,
    })
    .returning({ id: scheduleAuditLog.id });

  return log.id;
}

/**
 * Verify the integrity of an audit log entry by recalculating its checksum.
 */
export async function verifyAuditLogIntegrity(logId: string): Promise<{
  valid: boolean;
  storedChecksum: string | null;
  calculatedChecksum: string;
}> {
  const [log] = await db
    .select()
    .from(scheduleAuditLog)
    .where(eq(scheduleAuditLog.id, logId));

  if (!log) {
    throw new Error(`Audit log ${logId} not found`);
  }

  const calculatedChecksum = generateChecksum({
    userId: log.userId,
    scheduleId: log.scheduleId,
    shiftId: log.shiftId,
    action: log.action,
    previousState: log.previousState,
    newState: log.newState,
    reason: log.reason,
    aiGenerated: log.aiGenerated,
    createdAt: log.createdAt,
  });

  return {
    valid: log.checksum === calculatedChecksum,
    storedChecksum: log.checksum,
    calculatedChecksum,
  };
}

/**
 * Get recent audit logs for a schedule.
 */
export async function getScheduleAuditLogs(
  scheduleId: string,
  options: { limit?: number; offset?: number } = {}
) {
  const { limit = 50, offset = 0 } = options;

  return db
    .select()
    .from(scheduleAuditLog)
    .where(eq(scheduleAuditLog.scheduleId, scheduleId))
    .orderBy(desc(scheduleAuditLog.createdAt))
    .limit(limit)
    .offset(offset);
}

/**
 * Get AI-generated audit logs for analysis.
 */
export async function getAIAuditLogs(
  userId: string,
  options: { limit?: number; since?: Date } = {}
) {
  const { limit = 100 } = options;

  return db
    .select()
    .from(scheduleAuditLog)
    .where(eq(scheduleAuditLog.userId, userId))
    .orderBy(desc(scheduleAuditLog.createdAt))
    .limit(limit);
}

/**
 * Log an AI tool call for audit purposes.
 */
export async function logAIToolCall(
  userId: string,
  toolName: string,
  input: Record<string, unknown>,
  output: Record<string, unknown>,
  scheduleId?: string
): Promise<string> {
  return createAuditLog({
    userId,
    scheduleId,
    action: "ai_tool_call",
    newState: {
      toolName,
      input,
      output,
      timestamp: new Date().toISOString(),
    },
    aiGenerated: true,
    metadata: {
      toolName,
    },
  });
}

/**
 * Log an AI proposal for schedule changes.
 */
export async function logAIProposal(
  userId: string,
  proposalId: string,
  changes: Array<{
    type: string;
    targetId?: string;
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  }>,
  status: "created" | "approved" | "rejected",
  scheduleId?: string
): Promise<string> {
  return createAuditLog({
    userId,
    scheduleId,
    action: "ai_proposal",
    newState: {
      proposalId,
      changes,
      status,
      timestamp: new Date().toISOString(),
    },
    aiGenerated: true,
    metadata: {
      proposalId,
      changeCount: changes.length,
      status,
    },
  });
}

/**
 * Log a shift creation.
 */
export async function logShiftCreation(
  userId: string,
  scheduleId: string,
  shiftId: string,
  shiftData: Record<string, unknown>,
  aiGenerated: boolean = false
): Promise<string> {
  return createAuditLog({
    userId,
    scheduleId,
    shiftId,
    action: "create",
    newState: shiftData,
    aiGenerated,
  });
}

/**
 * Log a shift update.
 */
export async function logShiftUpdate(
  userId: string,
  scheduleId: string,
  shiftId: string,
  previousData: Record<string, unknown>,
  newData: Record<string, unknown>,
  reason?: string,
  aiGenerated: boolean = false
): Promise<string> {
  return createAuditLog({
    userId,
    scheduleId,
    shiftId,
    action: "update",
    previousState: previousData,
    newState: newData,
    reason,
    aiGenerated,
  });
}

/**
 * Log a shift deletion.
 */
export async function logShiftDeletion(
  userId: string,
  scheduleId: string,
  shiftId: string,
  shiftData: Record<string, unknown>,
  reason?: string
): Promise<string> {
  return createAuditLog({
    userId,
    scheduleId,
    shiftId,
    action: "delete",
    previousState: shiftData,
    reason,
  });
}

/**
 * Log a rule override.
 */
export async function logRuleOverride(
  userId: string,
  scheduleId: string,
  shiftId: string,
  constraintName: string,
  justification: string,
  violationDetails: Record<string, unknown>
): Promise<string> {
  return createAuditLog({
    userId,
    scheduleId,
    shiftId,
    action: "override",
    newState: {
      constraintName,
      violationDetails,
    },
    reason: justification,
  });
}

/**
 * Log schedule publication.
 */
export async function logSchedulePublish(
  userId: string,
  scheduleId: string,
  scheduleData: Record<string, unknown>
): Promise<string> {
  return createAuditLog({
    userId,
    scheduleId,
    action: "publish",
    newState: scheduleData,
  });
}

/**
 * Log time-off approval.
 */
export async function logTimeOffApproval(
  userId: string,
  requestId: string,
  requestData: Record<string, unknown>
): Promise<string> {
  return createAuditLog({
    userId,
    action: "approve",
    newState: {
      requestId,
      ...requestData,
    },
  });
}

/**
 * Log time-off denial.
 */
export async function logTimeOffDenial(
  userId: string,
  requestId: string,
  requestData: Record<string, unknown>,
  denialReason: string
): Promise<string> {
  return createAuditLog({
    userId,
    action: "deny",
    newState: {
      requestId,
      ...requestData,
    },
    reason: denialReason,
  });
}
