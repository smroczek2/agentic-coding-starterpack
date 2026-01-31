/**
 * Prepare Schema Migration
 *
 * This script truncates tables that need organizationId before schema push,
 * then the migration script can populate fresh data.
 */

import "dotenv/config";
import { db } from "../src/lib/db";
import { sql } from "drizzle-orm";

async function prepareSchemaForMigration() {
  console.log("Preparing database for organization schema migration...\n");

  try {
    // Truncate tables that will get organizationId column
    // Order matters due to foreign key constraints
    const tablesToTruncate = [
      "shift",
      "time_off_request",
      "employee_preference",
      "fairness_metric",
      "scheduling_constraint",
      "schedule_audit_log",
      "rule_override",
      "pto_balance",
      "schedule",
      "employee",
    ];

    for (const table of tablesToTruncate) {
      console.log(`Truncating ${table}...`);
      await db.execute(sql.raw(`TRUNCATE TABLE "${table}" CASCADE`));
    }

    console.log("\n✅ Tables truncated successfully!");
    console.log("Now run: npm run db:push");
    console.log("Then run: npx tsx scripts/migrate-to-organizations.ts");
  } catch (error) {
    console.error("Error preparing migration:", error);
    process.exit(1);
  }

  process.exit(0);
}

prepareSchemaForMigration();
