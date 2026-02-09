---
name: feature-builder
description: Orchestrates full-stack feature implementation using Next.js 15 App Router patterns, Better Auth, Drizzle ORM, and shadcn/ui. Designs data models, creates authenticated API routes, builds UI components. Integrates with existing auth/database/AI systems. Uses test-driven development. Activates after requirements are clarified.
---

# Feature Builder

Guides full-stack feature implementation that integrates seamlessly with the starter kit's existing authentication, database, and AI capabilities.

## Where This Fits

This skill handles planning and implementation of features.

- **Input**: Requirements from smart-clarifier or brainstorming
- **Output**: Working, tested feature
- **Next**: Code review, then document learnings

## Activation

Use this skill after:
- Requirements have been gathered and clarified
- User confirms they want to proceed with implementation
- Clear understanding of what to build exists

## Implementation Workflow

### Phase 1: Plan Architecture (Don't Code Yet!)

Before writing any code, plan:

**Data Model:**
- What database tables are needed?
- Fields and their types?
- Relationships to existing `user` table?
- Should records cascade delete when user is deleted?
- Indexes needed for performance?

**API Routes:**
- What endpoints are needed?
- HTTP methods (GET, POST, PUT, DELETE)?
- Which need authentication?
- Request and response shapes?

**UI Pages & Components:**
- What routes/pages are needed?
- Which are protected (require auth)?
- What shadcn/ui components to use?
- Server components vs client components?

**Integration Points:**
- How does this use Better Auth?
- Does it need AI features (OpenAI)?
- External APIs or services?

### Phase 2: Decompose into Tasks

Break the plan into small, testable units of work. Each task should be 3-5 file changes maximum.

**Example decomposition:**
```
Task Management Feature:

Task 1: Database schema + migration
  - src/lib/schema.ts (add tasks table)
  - db:push

Task 2: GET /api/tasks endpoint
  - src/app/api/tasks/route.ts (GET handler)
  - src/__tests__/integration/api/tasks.test.ts (GET tests)

Task 3: POST /api/tasks endpoint
  - src/app/api/tasks/route.ts (add POST handler)
  - src/__tests__/integration/api/tasks.test.ts (POST tests)

Task 4: Task list page + components
  - src/app/tasks/page.tsx
  - src/components/tasks/task-list.tsx
  - e2e/tasks.spec.ts
```

**Why decompose?** Small tasks are easier to test, review, and debug. Each task has a clear "done" state: tests pass.

### Phase 3: Write Failing Tests (RED)

**Before implementing each task**, write tests that describe the expected behavior.

For API routes:
```typescript
// Write this FIRST — before the route handler exists
describe("GET /api/tasks", () => {
  it("returns 401 when not authenticated", async () => {
    // ...mock auth to return null
    const response = await GET(request);
    expect(response.status).toBe(401);
  });

  it("returns user tasks when authenticated", async () => {
    // ...mock auth with valid session
    const response = await GET(request);
    expect(response.status).toBe(200);
  });
});
```

For UI components:
```typescript
// e2e/tasks.spec.ts — write FIRST
test("task list page shows user tasks", async ({ page }) => {
  await page.goto("/tasks");
  await expect(page.getByRole("heading", { name: /tasks/i })).toBeVisible();
});
```

Run the tests — they should fail. Now you know exactly what "done" looks like.

### Phase 4: Database Setup (GREEN)

**Define Schema in `src/lib/schema.ts`:**

```typescript
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./schema";

export const tasks = pgTable("tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("todo"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

**Key Patterns:**
- UUID primary keys: `uuid("id").defaultRandom().primaryKey()`
- Foreign keys with cascade: `references(() => user.id, { onDelete: "cascade" })`
- Timestamps: `timestamp("created_at").defaultNow().notNull()`

**Push schema**: `npm run db:push` (dev) or `npm run db:generate && npm run db:migrate` (prod)

### Phase 5: Build API Routes (GREEN)

Implement the minimum code to make your Phase 3 tests pass.

**Authenticated API Route Pattern:**

```typescript
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tasks } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.userId, session.user.id));

    return NextResponse.json({ tasks: userTasks });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}
```

**Run tests after each handler.** When they go green, move to the next task.

**API Route Checklist:**
- ✓ Check session first (401 if not authenticated)
- ✓ Validate all user input (400 for validation errors)
- ✓ Filter queries by `session.user.id`
- ✓ Use `and()` for ownership checks on updates/deletes
- ✓ Handle errors with try/catch
- ✓ Return appropriate status codes

### Phase 6: Build UI Components (GREEN)

**Protected Page:**
```typescript
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function TasksPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) redirect("/");

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Tasks</h1>
      <TaskList />
    </main>
  );
}
```

**Client Component:**
```typescript
"use client";
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function TaskList() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchTasks(); }, []);

  async function fetchTasks() {
    try {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      setTasks(data.tasks);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <Card key={task.id}>
          <CardHeader>
            <CardTitle>{task.title}</CardTitle>
          </CardHeader>
          <CardContent>{task.description}</CardContent>
        </Card>
      ))}
    </div>
  );
}
```

**Install shadcn/ui components as needed:**
```bash
pnpm dlx shadcn@latest add card button input form
```

### Phase 7: Add AI Features (If Needed)

```typescript
import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";

// CRITICAL: Always use environment variable
const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

const result = streamText({
  model: openai(model),
  messages: [...],
});
```

Follow the pattern in `src/app/api/chat/route.ts` for streaming chat.

### Phase 8: Quality Checks (REFACTOR)

Run all quality checks. Fix everything before considering the feature done.

```bash
npm run lint        # Fix all linting errors
npm run typecheck   # Fix all type errors
npm run test        # All unit + integration tests pass
npm run test:e2e    # All E2E tests pass (if applicable)
```

Refactor while tests stay green:
- Extract shared logic into utility functions
- Improve naming and readability
- Remove duplication
- Ensure consistent patterns with existing code

### Phase 9: Document & Compound

After the feature is complete and all checks pass:

1. **Update context if needed** — If you established new patterns or conventions, update AGENTS.md
2. **Document non-obvious solutions** — Add to `docs/solutions/` if the solution involved:
   - A non-obvious pattern or gotcha
   - A debugging breakthrough
   - A performance optimization
   - An integration pattern worth remembering
3. **Create ADR** — If architecture decisions were made, add to `docs/adr/`

## Security Checklist

**CRITICAL — Review every feature:**

✓ **Authentication checks** in all protected routes and API endpoints
✓ **User-specific data filtering** — all queries filtered by `session.user.id`
✓ **Ownership verification** on updates/deletes with `and(eq(table.id, id), eq(table.userId, session.user.id))`
✓ **Input validation** — validate all user input before database operations
✓ **Error handling** — try/catch in all API routes, log errors server-side

## Core Principles

**1. Test-Driven Development**
Write failing tests before implementation. Tests describe what "done" looks like.

**2. Extend, Don't Rebuild**
Use Better Auth, existing DB connection, shadcn/ui components. Follow existing patterns.

**3. Simple Over Clever**
Straightforward code > complex abstractions. Readable > concise.

**4. Security First**
Always check authentication. Always filter by user ID. Always validate input.

**5. Small Iterations**
Work in RED → GREEN → REFACTOR cycles. Each task is 3-5 files max.

## After Implementation

1. All tests pass (`npm run test:all`)
2. Lint and typecheck clean (`npm run lint && npm run typecheck`)
3. Briefly explain what you built and how it integrates
4. Note any new patterns established for context updates
