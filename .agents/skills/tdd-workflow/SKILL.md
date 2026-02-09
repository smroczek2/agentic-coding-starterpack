---
name: tdd-workflow
description: Test-Driven Development workflow for all coding tasks. Enforces red-green-refactor cycle where tests are written before implementation. Use when writing code, implementing features, fixing bugs, or refactoring. Triggers on "tests", "TDD", "test coverage", "test-driven", code creation, feature implementation, or bug fixes.
---

# TDD Workflow

Enforces the Red-Green-Refactor cycle: write a failing test first, make it pass with minimum code, then clean up.

## Where This Fits

This skill governs HOW implementation happens — every piece of new code goes through RED → GREEN → REFACTOR.

- **Input**: Planned tasks from feature-builder or architecture planning
- **Governs**: All implementation work
- **Validates**: Code correctness through executable tests

## The Red-Green-Refactor Cycle

### 1. RED — Write a Failing Test

Write a test that describes the behavior you want. Run it. Watch it fail.

```bash
npm run test:watch  # Keep running during development
```

**What to test:**
- The expected behavior from the user's perspective
- Edge cases and error conditions
- Real code paths — not mock configurations

**The test must fail for the RIGHT reason:**
- Module not found → you haven't created the file yet (correct)
- Function returns wrong value → you haven't implemented the logic yet (correct)
- Test syntax error → fix the test first (wrong reason)

### 2. GREEN — Minimum Code to Pass

Write the simplest code that makes the test pass. Nothing more.

- Don't optimize
- Don't handle edge cases you haven't tested
- Don't add features the test doesn't cover
- If the simplest solution feels wrong, that's a signal to write more tests

### 3. REFACTOR — Clean Up, Keep Green

Now improve the code while keeping all tests passing.

- Extract functions, rename variables, reduce duplication
- Run tests after each change
- If a test fails, you broke something — undo and try again

```bash
# Tests should pass after every refactor step
npm run test
```

## Test Categories

### Unit Tests (Vitest)

Test pure functions, utilities, and isolated logic.

**Location**: `src/__tests__/unit/`
**Run**: `npm run test`

```typescript
// src/__tests__/unit/lib/utils.test.ts
import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("px-2", "py-1")).toBe("px-2 py-1");
  });

  it("resolves Tailwind conflicts", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
});
```

**Good unit test targets:**
- Utility functions (`cn`, formatters, validators)
- Data transformations (schema helpers, parsers)
- Business logic (calculations, status transitions)
- Zod schemas (validation rules)

### Integration Tests (Vitest)

Test API route handlers with real logic, mocking only the auth boundary.

**Location**: `src/__tests__/integration/`
**Run**: `npm run test`

```typescript
// src/__tests__/integration/api/tasks.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/tasks/route";
import { createMockSession } from "@/__tests__/helpers/auth";

// Mock ONLY the auth boundary — everything else runs for real
vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

describe("GET /api/tasks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    const { auth } = await import("@/lib/auth");
    vi.mocked(auth.api.getSession).mockResolvedValue(null);

    const request = new Request("http://localhost/api/tasks");
    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it("returns user tasks when authenticated", async () => {
    const { auth } = await import("@/lib/auth");
    const session = createMockSession();
    vi.mocked(auth.api.getSession).mockResolvedValue(session);

    const request = new Request("http://localhost/api/tasks");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty("tasks");
    expect(Array.isArray(data.tasks)).toBe(true);
  });
});
```

**Key principle**: Mock the auth boundary, not the subject under test. Route handler logic, validation, and response formatting all run for real.

### E2E Tests (Playwright)

Test real user flows through the browser.

**Location**: `e2e/`
**Run**: `npm run test:e2e`

```typescript
// e2e/tasks.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Tasks feature", () => {
  test("displays task list page", async ({ page }) => {
    await page.goto("/tasks");
    await expect(page.getByRole("heading", { name: /tasks/i })).toBeVisible();
  });

  test("shows empty state when no tasks exist", async ({ page }) => {
    await page.goto("/tasks");
    await expect(page.getByText(/no tasks yet/i)).toBeVisible();
  });
});
```

## What Makes a Good Test

### Tests MUST Exercise Real Code

```typescript
// BAD — tests mock variables, not real behavior
it("returns true", () => {
  const result = true;
  expect(result).toBe(true);  // Tests nothing
});

// BAD — tests the mock, not the code
it("calls the database", () => {
  const mockDb = { query: vi.fn().mockResolvedValue([]) };
  mockDb.query("SELECT *");
  expect(mockDb.query).toHaveBeenCalled();  // Tests mock setup
});

// GOOD — tests real function behavior
it("merges conflicting Tailwind classes", () => {
  const result = cn("text-red-500", "text-blue-500");
  expect(result).toBe("text-blue-500");  // Tests real cn() logic
});

// GOOD — tests real API route handler
it("validates required title field", async () => {
  mockAuthSession();
  const request = new Request("http://localhost/api/tasks", {
    method: "POST",
    body: JSON.stringify({ title: "" }),
  });
  const response = await POST(request);
  expect(response.status).toBe(400);  // Tests real validation
});
```

### Mock Boundaries, Not Subjects

**The rule**: Only mock things at the BOUNDARY of your test — external services, auth, network calls. Never mock the thing you're testing.

```
What to mock:                    What NOT to mock:
✓ Auth sessions (auth.api)       ✗ The route handler itself
✓ External API calls             ✗ Database queries (in integration tests)
✓ Third-party services           ✗ Utility functions
✓ Environment-specific values    ✗ Business logic
```

### Test Names Describe Behavior

```typescript
// BAD — describes implementation
it("calls formatDate with timestamp");
it("sets state to loading");

// GOOD — describes behavior
it("displays dates in MM/DD/YYYY format");
it("shows loading spinner while fetching tasks");
it("returns 401 when session is missing");
```

## TDD Applied to Feature Building

### 1. After Planning, Write Tests First

For each planned component, write the test BEFORE the implementation:

**Database/API work:**
```
Plan: POST /api/tasks creates a new task
Test: POST with valid data returns 201 and the created task
Test: POST without title returns 400
Test: POST without auth returns 401
→ Now implement the route
```

**UI work:**
```
Plan: TaskList component shows user's tasks
Test: TaskList renders task titles
Test: TaskList shows empty state when no tasks
Test: TaskList shows loading state
→ Now implement the component
```

### 2. Work in Small Cycles

Don't write ALL tests upfront. Work in small RED → GREEN → REFACTOR cycles:

```
Cycle 1: Test "returns 401 unauthorized" → Implement auth check
Cycle 2: Test "returns tasks for user" → Implement GET handler
Cycle 3: Test "creates task with valid data" → Implement POST handler
Cycle 4: Test "validates required fields" → Add validation
```

Each cycle takes 5-15 minutes. The feature grows test by test.

## Test Helpers

### Auth Helper (`src/__tests__/helpers/auth.ts`)

```typescript
import { createMockSession, createAuthMock } from "@/__tests__/helpers/auth";

// Create a mock session with defaults
const session = createMockSession();

// Create with overrides
const session = createMockSession({
  user: { name: "Test User", email: "test@example.com" },
});

// Full auth mock setup
const { mockGetSession } = createAuthMock();
mockGetSession.mockResolvedValue(createMockSession());
```

### Database Helper (`src/__tests__/helpers/db.ts`)

```typescript
import { skipIfNoDatabase, getTestDatabaseUrl } from "@/__tests__/helpers/db";

// Skip tests that need a real database
skipIfNoDatabase();
```

## Commands Quick Reference

```bash
# Unit + Integration tests
npm run test           # Run once
npm run test:watch     # Watch mode (use during TDD)
npm run test:coverage  # With coverage report

# E2E tests
npm run test:e2e       # Run headless
npm run test:e2e:ui    # Interactive UI mode

# Run everything
npm run test:all       # Unit + Integration + E2E
```

## Anti-Patterns

### Never Do These

❌ **Write implementation before tests**
The whole point is to know what "done" looks like before you start coding.

❌ **Write tests that always pass**
```typescript
// This test passes even if the function is broken
it("does something", () => {
  expect(true).toBe(true);
});
```

❌ **Mock the subject under test**
```typescript
// You're testing the mock, not the real function
const calculateTotal = vi.fn().mockReturnValue(100);
expect(calculateTotal()).toBe(100);  // Useless
```

❌ **Test implementation details**
```typescript
// Brittle — breaks when you refactor internal naming
expect(component.state.internalFlag).toBe(true);
```

❌ **Skip the RED step**
If the test passes immediately, either:
- The behavior already exists (no new code needed)
- Your test doesn't actually check what you think it does

❌ **Write giant tests**
Each test should verify ONE behavior. If a test name has "and" in it, split it into two tests.

## Remember

- **RED first** — Always see the test fail before making it pass
- **Real code** — Tests exercise actual functions, routes, and components
- **Small cycles** — One test at a time, 5-15 minutes per cycle
- **Mock boundaries** — Only mock auth, external APIs, and services
- **Behavior over implementation** — Test what it does, not how it does it
- **Tests are documentation** — Good tests explain the system's behavior
- **Refactor with confidence** — Green tests mean your changes are safe
