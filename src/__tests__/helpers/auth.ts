/**
 * Test helpers for authentication.
 *
 * These mock the auth BOUNDARY only — the session check at the edge of API routes.
 * All business logic, validation, database queries, and error handling run for real.
 */

/**
 * Creates a realistic session object matching the shape returned by
 * auth.api.getSession(). Use this when testing protected API routes
 * or server components.
 */
export function createMockSession(overrides?: {
  userId?: string;
  name?: string;
  email?: string;
}) {
  return {
    user: {
      id: overrides?.userId ?? "test-user-id-00000000",
      name: overrides?.name ?? "Test User",
      email: overrides?.email ?? "test@example.com",
      emailVerified: true,
      image: null,
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    },
    session: {
      id: "test-session-id-00000000",
      token: "test-session-token",
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24h from now
      userId: overrides?.userId ?? "test-user-id-00000000",
      ipAddress: "127.0.0.1",
      userAgent: "vitest",
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    },
  };
}

/**
 * Creates a mock for the auth module that returns a specific session.
 * Pass null for session to simulate an unauthenticated request.
 *
 * Usage in tests:
 *   vi.mock("@/lib/auth", () => createAuthMock(createMockSession()));
 *   vi.mock("@/lib/auth", () => createAuthMock(null)); // unauthenticated
 */
export function createAuthMock(
  session: ReturnType<typeof createMockSession> | null
) {
  return {
    auth: {
      api: {
        getSession: vi.fn().mockResolvedValue(session),
      },
    },
  };
}
