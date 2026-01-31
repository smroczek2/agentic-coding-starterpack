import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { FullConfig } from '@playwright/test';
import postgres from 'postgres';
import * as crypto from 'crypto';
import * as fs from 'fs';

/**
 * Global Setup for Playwright Tests
 *
 * Creates test users and sessions directly in the database,
 * then saves the session cookies for authenticated tests.
 */

// Test user configuration
const TEST_MANAGER = {
  id: 'test-manager-001',
  name: 'Test Manager',
  email: 'test-manager@example.com',
  role: 'manager',
  isSchedulable: false,
};

const TEST_MEMBER = {
  id: 'test-member-001',
  name: 'Test Team Member',
  email: 'test-member@example.com',
  role: 'team_member',
  isSchedulable: true,
};

// Generate a secure random token
function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Generate session expiry (30 days from now)
function getSessionExpiry(): Date {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 30);
  return expiry;
}

async function globalSetup(config: FullConfig) {
  console.log('🔐 Setting up test authentication...');

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.warn('⚠️ DATABASE_URL not set - skipping auth setup');
    console.warn('   Tests requiring authentication will be skipped');
    return;
  }

  const sql = postgres(connectionString, { max: 1 });

  try {
    // Create test users if they don't exist
    const now = new Date();

    // Create manager user
    await sql`
      INSERT INTO "user" (id, name, email, role, "isSchedulable", "createdAt", "updatedAt")
      VALUES (${TEST_MANAGER.id}, ${TEST_MANAGER.name}, ${TEST_MANAGER.email}, ${TEST_MANAGER.role}, ${TEST_MANAGER.isSchedulable}, ${now}, ${now})
      ON CONFLICT (id) DO UPDATE SET
        name = ${TEST_MANAGER.name},
        email = ${TEST_MANAGER.email},
        role = ${TEST_MANAGER.role},
        "isSchedulable" = ${TEST_MANAGER.isSchedulable},
        "updatedAt" = ${now}
    `;

    // Create team member user
    await sql`
      INSERT INTO "user" (id, name, email, role, "isSchedulable", "createdAt", "updatedAt")
      VALUES (${TEST_MEMBER.id}, ${TEST_MEMBER.name}, ${TEST_MEMBER.email}, ${TEST_MEMBER.role}, ${TEST_MEMBER.isSchedulable}, ${now}, ${now})
      ON CONFLICT (id) DO UPDATE SET
        name = ${TEST_MEMBER.name},
        email = ${TEST_MEMBER.email},
        role = ${TEST_MEMBER.role},
        "isSchedulable" = ${TEST_MEMBER.isSchedulable},
        "updatedAt" = ${now}
    `;

    console.log('✅ Test users created');

    // Generate session tokens
    const managerSessionId = `session-manager-${Date.now()}`;
    const memberSessionId = `session-member-${Date.now()}`;
    const managerToken = generateToken();
    const memberToken = generateToken();
    const expiry = getSessionExpiry();

    // Delete old test sessions
    await sql`DELETE FROM "session" WHERE "userId" IN (${TEST_MANAGER.id}, ${TEST_MEMBER.id})`;

    // Create new sessions
    await sql`
      INSERT INTO "session" (id, "expiresAt", token, "createdAt", "updatedAt", "userId")
      VALUES (${managerSessionId}, ${expiry}, ${managerToken}, ${now}, ${now}, ${TEST_MANAGER.id})
    `;

    await sql`
      INSERT INTO "session" (id, "expiresAt", token, "createdAt", "updatedAt", "userId")
      VALUES (${memberSessionId}, ${expiry}, ${memberToken}, ${now}, ${now}, ${TEST_MEMBER.id})
    `;

    console.log('✅ Test sessions created');

    // Create auth state directory
    const authDir = path.join(process.cwd(), 'playwright', '.auth');
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }

    // Get base URL from config
    const baseURL = config.projects[0].use?.baseURL || 'http://localhost:3000';
    const url = new URL(baseURL);

    // Save manager auth state
    const managerAuthState = {
      cookies: [
        {
          name: 'better-auth.session_token',
          value: managerToken,
          domain: url.hostname,
          path: '/',
          expires: Math.floor(expiry.getTime() / 1000),
          httpOnly: true,
          secure: url.protocol === 'https:',
          sameSite: 'Lax' as const,
        },
      ],
      origins: [],
    };

    // Save member auth state
    const memberAuthState = {
      cookies: [
        {
          name: 'better-auth.session_token',
          value: memberToken,
          domain: url.hostname,
          path: '/',
          expires: Math.floor(expiry.getTime() / 1000),
          httpOnly: true,
          secure: url.protocol === 'https:',
          sameSite: 'Lax' as const,
        },
      ],
      origins: [],
    };

    fs.writeFileSync(
      path.join(authDir, 'manager.json'),
      JSON.stringify(managerAuthState, null, 2)
    );

    fs.writeFileSync(
      path.join(authDir, 'member.json'),
      JSON.stringify(memberAuthState, null, 2)
    );

    console.log('✅ Auth state files saved');

    // Create test employees for the manager
    const employeeColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
    const employees = [
      { name: 'Alice Johnson', email: 'alice@example.com', preference: 'early' },
      { name: 'Bob Smith', email: 'bob@example.com', preference: 'mid' },
      { name: 'Carol Davis', email: 'carol@example.com', preference: 'late' },
      { name: 'David Wilson', email: 'david@example.com', preference: 'mid' },
      { name: 'Eve Brown', email: 'eve@example.com', preference: 'early' },
    ];

    // Generate consistent UUIDs for test employees (using v4-like format with predictable values)
    const employeeUuids = [
      '00000000-0000-4000-8000-000000000001',
      '00000000-0000-4000-8000-000000000002',
      '00000000-0000-4000-8000-000000000003',
      '00000000-0000-4000-8000-000000000004',
      '00000000-0000-4000-8000-000000000005',
    ];

    for (let i = 0; i < employees.length; i++) {
      const emp = employees[i];
      await sql`
        INSERT INTO "employee" (id, "userId", name, email, "timeZone", "shiftPreference", "colorCode", "displayOrder", status, "maxHoursPerWeek", version, "createdAt", "updatedAt")
        VALUES (
          ${employeeUuids[i]},
          ${TEST_MANAGER.id},
          ${emp.name},
          ${emp.email},
          'America/Denver',
          ${emp.preference},
          ${employeeColors[i]},
          ${i},
          'active',
          40,
          1,
          ${now},
          ${now}
        )
        ON CONFLICT (id) DO UPDATE SET
          name = ${emp.name},
          email = ${emp.email},
          "shiftPreference" = ${emp.preference},
          "updatedAt" = ${now}
      `;
    }

    console.log('✅ Test employees created');

    // Create a test schedule
    const scheduleStart = new Date();
    scheduleStart.setDate(scheduleStart.getDate() - scheduleStart.getDay()); // Start of week
    const scheduleEnd = new Date(scheduleStart);
    scheduleEnd.setDate(scheduleEnd.getDate() + 6); // End of week

    const scheduleUuid = '00000000-0000-4000-8000-000000000101';
    await sql`
      INSERT INTO "schedule" (id, "userId", name, "startDate", "endDate", status, version, "createdAt", "updatedAt")
      VALUES (
        ${scheduleUuid},
        ${TEST_MANAGER.id},
        'Test Week Schedule',
        ${scheduleStart.toISOString().split('T')[0]},
        ${scheduleEnd.toISOString().split('T')[0]},
        'published',
        1,
        ${now},
        ${now}
      )
      ON CONFLICT (id) DO UPDATE SET
        "startDate" = ${scheduleStart.toISOString().split('T')[0]},
        "endDate" = ${scheduleEnd.toISOString().split('T')[0]},
        "updatedAt" = ${now}
    `;

    console.log('✅ Test schedule created');

    // Create some test time-off requests
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const futureDate2 = new Date(futureDate);
    futureDate2.setDate(futureDate2.getDate() + 1);

    const ptoPendingUuid = '00000000-0000-4000-8000-000000000201';
    const ptoApprovedUuid = '00000000-0000-4000-8000-000000000202';

    await sql`
      INSERT INTO "time_off_request" (id, "userId", "employeeId", "startDate", "endDate", type, status, reason, "createdAt", "updatedAt")
      VALUES (
        ${ptoPendingUuid},
        ${TEST_MANAGER.id},
        ${employeeUuids[0]},
        ${futureDate.toISOString().split('T')[0]},
        ${futureDate2.toISOString().split('T')[0]},
        'pto',
        'pending',
        'Test vacation request',
        ${now},
        ${now}
      )
      ON CONFLICT (id) DO UPDATE SET
        "startDate" = ${futureDate.toISOString().split('T')[0]},
        "endDate" = ${futureDate2.toISOString().split('T')[0]},
        "updatedAt" = ${now}
    `;

    await sql`
      INSERT INTO "time_off_request" (id, "userId", "employeeId", "startDate", "endDate", type, status, reason, "reviewedBy", "reviewedAt", "createdAt", "updatedAt")
      VALUES (
        ${ptoApprovedUuid},
        ${TEST_MANAGER.id},
        ${employeeUuids[1]},
        ${futureDate.toISOString().split('T')[0]},
        ${futureDate.toISOString().split('T')[0]},
        'sick',
        'approved',
        'Doctor appointment',
        ${TEST_MANAGER.id},
        ${now},
        ${now},
        ${now}
      )
      ON CONFLICT (id) DO UPDATE SET
        status = 'approved',
        "updatedAt" = ${now}
    `;

    console.log('✅ Test time-off requests created');

    console.log('🎉 Test authentication setup complete!');
  } catch (error) {
    console.error('❌ Auth setup failed:', error);
    console.warn('   Tests requiring authentication will be skipped');
  } finally {
    await sql.end();
  }
}

export default globalSetup;
