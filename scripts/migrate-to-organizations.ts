/**
 * Migration Script: User Data to Organization-Based Multi-Tenancy
 *
 * This script migrates existing user data to the CampMinder organization.
 * It should be run once after deploying the schema changes.
 *
 * Run with: npx tsx scripts/migrate-to-organizations.ts
 */

import { db } from "../src/lib/db";
import {
  user,
  organization,
  member,
  employee,
  schedule,
  shift,
  timeOffRequest,
  employeePreference,
  fairnessMetric,
  schedulingConstraint,
  ptoBalance,
  scheduleAuditLog,
  ruleOverride,
} from "../src/lib/schema";
import { eq, isNull, and, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { ORGANIZATION_DOMAINS } from "../src/lib/organizations";

async function migrateToOrganizations() {
  console.log("Starting organization migration...\n");

  const campminderOrg = ORGANIZATION_DOMAINS.campminder;

  // 1. Create the CampMinder organization if it doesn't exist
  console.log(`Step 1: Creating organization: ${campminderOrg.name}`);

  const existingOrg = await db.query.organization.findFirst({
    where: eq(organization.id, campminderOrg.id),
  });

  if (!existingOrg) {
    await db.insert(organization).values({
      id: campminderOrg.id,
      name: campminderOrg.name,
      slug: campminderOrg.slug,
    });
    console.log(`  ✓ Created organization: ${campminderOrg.name}`);
  } else {
    console.log(`  ✓ Organization already exists: ${campminderOrg.name}`);
  }

  // 2. Get all existing users
  console.log("\nStep 2: Adding users as organization members");
  const existingUsers = await db.select().from(user);
  console.log(`  Found ${existingUsers.length} users to migrate`);

  let membersAdded = 0;
  for (const u of existingUsers) {
    // Check if already a member
    const existingMember = await db.query.member.findFirst({
      where: and(
        eq(member.userId, u.id),
        eq(member.organizationId, campminderOrg.id)
      ),
    });

    if (!existingMember) {
      // Determine role based on existing user.role
      const memberRole = u.role === "manager" ? "manager" : "member";

      await db.insert(member).values({
        id: nanoid(),
        organizationId: campminderOrg.id,
        userId: u.id,
        role: memberRole,
      });
      console.log(`  ✓ Added ${u.email} as ${memberRole}`);
      membersAdded++;
    } else {
      console.log(`  - ${u.email} already a member`);
    }
  }
  console.log(`  Total new members added: ${membersAdded}`);

  // 3. Update all data tables with organizationId
  console.log("\nStep 3: Updating data tables with organizationId");

  // Employee table
  const employeeResult = await db
    .update(employee)
    .set({ organizationId: campminderOrg.id })
    .where(isNull(employee.organizationId));
  console.log(`  ✓ Updated employee table`);

  // Schedule table
  await db
    .update(schedule)
    .set({ organizationId: campminderOrg.id })
    .where(isNull(schedule.organizationId));
  console.log(`  ✓ Updated schedule table`);

  // Shift table
  await db
    .update(shift)
    .set({ organizationId: campminderOrg.id })
    .where(isNull(shift.organizationId));
  console.log(`  ✓ Updated shift table`);

  // TimeOffRequest table
  await db
    .update(timeOffRequest)
    .set({ organizationId: campminderOrg.id })
    .where(isNull(timeOffRequest.organizationId));
  console.log(`  ✓ Updated time_off_request table`);

  // EmployeePreference table
  await db
    .update(employeePreference)
    .set({ organizationId: campminderOrg.id })
    .where(isNull(employeePreference.organizationId));
  console.log(`  ✓ Updated employee_preference table`);

  // FairnessMetric table
  await db
    .update(fairnessMetric)
    .set({ organizationId: campminderOrg.id })
    .where(isNull(fairnessMetric.organizationId));
  console.log(`  ✓ Updated fairness_metric table`);

  // SchedulingConstraint table
  await db
    .update(schedulingConstraint)
    .set({ organizationId: campminderOrg.id })
    .where(isNull(schedulingConstraint.organizationId));
  console.log(`  ✓ Updated scheduling_constraint table`);

  // PtoBalance table
  await db
    .update(ptoBalance)
    .set({ organizationId: campminderOrg.id })
    .where(isNull(ptoBalance.organizationId));
  console.log(`  ✓ Updated pto_balance table`);

  // ScheduleAuditLog table (nullable - historical)
  await db
    .update(scheduleAuditLog)
    .set({ organizationId: campminderOrg.id })
    .where(isNull(scheduleAuditLog.organizationId));
  console.log(`  ✓ Updated schedule_audit_log table`);

  // RuleOverride table (nullable - historical)
  await db
    .update(ruleOverride)
    .set({ organizationId: campminderOrg.id })
    .where(isNull(ruleOverride.organizationId));
  console.log(`  ✓ Updated rule_override table`);

  console.log("\n✅ Migration complete!");
  console.log("\nNext steps:");
  console.log(
    "1. Verify data in the database using Drizzle Studio: npm run db:studio"
  );
  console.log("2. Test the application to ensure all features work correctly");

  process.exit(0);
}

migrateToOrganizations().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
