/**
 * Test helpers for database operations.
 *
 * These provide utilities for integration tests that need a real database.
 * Tests using these helpers require a running PostgreSQL instance and
 * the TEST_POSTGRES_URL environment variable to be set.
 *
 * For unit tests that don't need a database, use vi.mock() to mock
 * the @/lib/db module instead.
 */

/**
 * Checks if a test database connection is available.
 * Use this to conditionally skip database-dependent tests.
 */
export function isTestDatabaseAvailable(): boolean {
  return Boolean(
    process.env.TEST_POSTGRES_URL || process.env.POSTGRES_URL
  );
}

/**
 * Gets the database URL for testing.
 * Prefers TEST_POSTGRES_URL, falls back to POSTGRES_URL.
 *
 * WARNING: Never use a production database URL here.
 * Tests may create, modify, and delete data.
 */
export function getTestDatabaseUrl(): string | undefined {
  return process.env.TEST_POSTGRES_URL || process.env.POSTGRES_URL;
}

/**
 * Helper to skip a test if no test database is available.
 * Use at the top of integration test files:
 *
 *   import { skipIfNoDatabase } from "@/__tests__/helpers/db";
 *   skipIfNoDatabase();
 */
export function skipIfNoDatabase() {
  if (!isTestDatabaseAvailable()) {
    test.skip("Skipping: no test database available (set TEST_POSTGRES_URL)");
  }
}
