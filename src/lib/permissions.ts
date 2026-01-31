/**
 * Permissions and Access Control
 *
 * Defines roles and permissions for organization-based multi-tenancy.
 * Uses Better Auth's access control system.
 */

import { createAccessControl } from "better-auth/plugins/access";

/**
 * Permission statement defining all resources and actions
 */
export const statement = {
  // Organization management
  organization: ["update", "delete"],
  member: ["create", "update", "delete"],
  invitation: ["create", "cancel"],

  // Application-specific permissions
  schedule: ["create", "read", "update", "delete", "publish"],
  employee: ["create", "read", "update", "delete"],
  timeOff: ["create", "read", "approve", "deny"],
  reports: ["read", "export"],
} as const;

export const ac = createAccessControl(statement);

/**
 * Owner: Full access including org deletion
 * - Organization creator/owner
 * - Can delete org, transfer ownership, manage all members
 */
export const owner = ac.newRole({
  organization: ["update", "delete"],
  member: ["create", "update", "delete"],
  invitation: ["create", "cancel"],
  schedule: ["create", "read", "update", "delete", "publish"],
  employee: ["create", "read", "update", "delete"],
  timeOff: ["create", "read", "approve", "deny"],
  reports: ["read", "export"],
});

/**
 * Admin: Everything except org deletion
 * - Full administrative access
 * - Can manage members but not delete org
 */
export const admin = ac.newRole({
  organization: ["update"],
  member: ["create", "update", "delete"],
  invitation: ["create", "cancel"],
  schedule: ["create", "read", "update", "delete", "publish"],
  employee: ["create", "read", "update", "delete"],
  timeOff: ["create", "read", "approve", "deny"],
  reports: ["read", "export"],
});

/**
 * Manager: Scheduling operations
 * - Create/edit schedules, manage employees, approve time-off
 * - No member management
 */
export const manager = ac.newRole({
  schedule: ["create", "read", "update", "publish"],
  employee: ["create", "read", "update"],
  timeOff: ["create", "read", "approve", "deny"],
  reports: ["read"],
});

/**
 * Member: Read-only + self-service
 * - View schedules, submit own time-off requests
 */
export const member = ac.newRole({
  schedule: ["read"],
  employee: ["read"],
  timeOff: ["create", "read"], // Can only create own requests
  reports: ["read"],
});

/**
 * All roles for export
 */
export const roles = { owner, admin, manager, member };

/**
 * Role hierarchy for permission checks
 * Higher index = more permissions
 */
export const ROLE_HIERARCHY = ["member", "manager", "admin", "owner"] as const;
export type OrgRole = (typeof ROLE_HIERARCHY)[number];

/**
 * Check if a role has at least the same level as another role
 */
export function hasRoleLevel(userRole: string, requiredRole: OrgRole): boolean {
  const userIndex = ROLE_HIERARCHY.indexOf(userRole as OrgRole);
  const requiredIndex = ROLE_HIERARCHY.indexOf(requiredRole);
  return userIndex >= requiredIndex;
}
