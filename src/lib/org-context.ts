/**
 * Organization Context Helpers
 *
 * Provides utilities for getting organization context from sessions
 * and checking permissions in API routes.
 */

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { member } from "@/lib/schema";
import { eq } from "drizzle-orm";

export interface OrgContext {
  userId: string;
  organizationId: string;
  role: string;
  userName: string;
  userEmail: string;
}

/**
 * Get organization context from session
 * Includes the user's role within the organization
 */
export async function getOrgContext(): Promise<OrgContext | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  // Get user's membership in any organization
  // For this app, users are auto-assigned to one org based on domain
  const membership = await db.query.member.findFirst({
    where: eq(member.userId, session.user.id),
  });

  if (!membership) return null;

  return {
    userId: session.user.id,
    organizationId: membership.organizationId,
    role: membership.role,
    userName: session.user.name,
    userEmail: session.user.email,
  };
}

/**
 * Require organization context (throws if not available)
 */
export async function requireOrgContext(): Promise<OrgContext> {
  const ctx = await getOrgContext();
  if (!ctx) {
    throw new Error("Unauthorized or no active organization");
  }
  return ctx;
}

/**
 * Permission definitions for each role
 */
const ROLE_PERMISSIONS: Record<string, Record<string, string[]>> = {
  owner: {
    organization: ["update", "delete"],
    member: ["create", "update", "delete"],
    invitation: ["create", "cancel"],
    schedule: ["create", "read", "update", "delete", "publish"],
    employee: ["create", "read", "update", "delete"],
    timeOff: ["create", "read", "approve", "deny"],
    reports: ["read", "export"],
  },
  admin: {
    organization: ["update"],
    member: ["create", "update", "delete"],
    invitation: ["create", "cancel"],
    schedule: ["create", "read", "update", "delete", "publish"],
    employee: ["create", "read", "update", "delete"],
    timeOff: ["create", "read", "approve", "deny"],
    reports: ["read", "export"],
  },
  manager: {
    schedule: ["create", "read", "update", "publish"],
    employee: ["create", "read", "update"],
    timeOff: ["create", "read", "approve", "deny"],
    reports: ["read"],
  },
  member: {
    schedule: ["read"],
    employee: ["read"],
    timeOff: ["create", "read"],
    reports: ["read"],
  },
};

/**
 * Check if user has permission for an action
 */
export async function hasPermission(
  resource: string,
  action: string
): Promise<boolean> {
  const ctx = await getOrgContext();
  if (!ctx) return false;

  const rolePerms = ROLE_PERMISSIONS[ctx.role];
  if (!rolePerms) return false;

  const resourcePerms = rolePerms[resource];
  if (!resourcePerms) return false;

  return resourcePerms.includes(action);
}

/**
 * Check if user has permission using existing context
 */
export function hasPermissionWithContext(
  ctx: OrgContext,
  resource: string,
  action: string
): boolean {
  const rolePerms = ROLE_PERMISSIONS[ctx.role];
  if (!rolePerms) return false;

  const resourcePerms = rolePerms[resource];
  if (!resourcePerms) return false;

  return resourcePerms.includes(action);
}

/**
 * Require permission (throws if denied)
 */
export async function requirePermission(
  resource: string,
  action: string
): Promise<void> {
  const allowed = await hasPermission(resource, action);
  if (!allowed) {
    throw new Error(`Permission denied: ${resource}:${action}`);
  }
}
