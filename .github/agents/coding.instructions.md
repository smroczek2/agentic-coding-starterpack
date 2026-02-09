# Coding Instructions for GitHub Copilot

**For comprehensive architecture, patterns, and security requirements, see AGENTS.md in the project root.**

This file contains GitHub Copilot-specific instructions and quick reference.

---

## Project Overview

Production-ready Next.js 15 starter kit with:
- Next.js 15 App Router, React 19, TypeScript (strict)
- Better Auth with Google OAuth
- PostgreSQL + Drizzle ORM
- Vercel AI SDK with OpenAI
- shadcn/ui + Tailwind CSS v4

---

## Critical Principles

1. **Test-Driven Development** - Write failing tests BEFORE implementation. RED → GREEN → REFACTOR.
2. **Server Components by Default** - Only use `"use client"` when needed (useState, onClick, etc.)
3. **Always Filter by User ID** - All user data queries MUST filter by `session.user.id`
4. **Environment Variables** - ALWAYS use `process.env.OPENAI_MODEL`, never hardcode
5. **Quality Checks** - Run `npm run lint && npm run typecheck && npm run test` after changes
6. **Security First** - Check auth, validate input, verify ownership

---

## Setup Commands

```bash
npm install          # Install dependencies
npm run dev          # Development server
npm run build        # Build for production
npm run lint         # ESLint (run after changes)
npm run typecheck    # TypeScript validation (run after changes)
npm run test         # Run unit/integration tests
npm run test:watch   # Run tests in watch mode
npm run test:e2e     # Run E2E tests (requires dev server)
npm run test:all     # Run all tests (unit + E2E)
npm run db:push      # Push schema changes (dev)
npm run db:generate  # Generate migrations (prod)
npm run db:migrate   # Run migrations (prod)
```

---

## Authentication Pattern

**Protected Server Component:**
```typescript
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/");
  return <div>Welcome {session.user.name}</div>;
}
```

**Protected API Route:**
```typescript
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // Your logic here
}
```

---

## Database Pattern

**Extending Schema:**
```typescript
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./schema";

export const yourTable = pgTable("your_table", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => user.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

**Query with User Filter (CRITICAL):**
```typescript
import { db } from "@/lib/db";
import { yourTable } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

// ✓ CORRECT - Always filter by userId
const records = await db
  .select()
  .from(yourTable)
  .where(eq(yourTable.userId, session.user.id));

// ✓ CORRECT - Verify ownership on update/delete
const [updated] = await db
  .update(yourTable)
  .set({ title: "Updated" })
  .where(and(
    eq(yourTable.id, recordId),
    eq(yourTable.userId, session.user.id)
  ))
  .returning();
```

---

## AI Integration Pattern

**CRITICAL: Use environment variable for model**

```typescript
import { openai } from "@ai-sdk/openai";
import { streamText, UIMessage, convertToModelMessages } from "ai";

// ✓ CORRECT
const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
const result = streamText({
  model: openai(model),
  messages: convertToModelMessages(messages),
});

// ✗ WRONG - Never hardcode
// model: openai("gpt-4o-mini")
```

---

## UI Guidelines

1. **Use shadcn/ui First** - Check `src/components/ui/` before creating custom components
2. **Install**: `pnpm dlx shadcn@latest add [component-name]`
3. **Styling**: Use Tailwind utilities only, semantic color variables
4. **Responsive**: Mobile-first with `md:`, `lg:` breakpoints

**Semantic Colors:**
- `text-foreground` / `text-muted-foreground`
- `bg-background` / `bg-card`
- `border-border`
- `bg-primary` / `bg-destructive`

**Never use custom hex colors**

---

## Testing (REQUIRED)

### TDD Workflow

Every new feature, bug fix, or refactor follows RED → GREEN → REFACTOR:

1. **RED** — Write a failing test that describes the expected behavior
2. **GREEN** — Write the minimum code to make the test pass
3. **REFACTOR** — Clean up while keeping tests green

### Test Structure

```
src/__tests__/
  setup.ts                       # Global test setup
  helpers/
    auth.ts                      # createMockSession(), mockAuthModule()
    db.ts                        # Test database utilities
  unit/lib/                      # Unit tests for pure functions
  integration/api/               # Integration tests for API routes
e2e/                             # Playwright E2E browser tests
```

### Test Rules

- **Test REAL code** — Call actual functions, assert actual behavior
- **Mock boundaries, not subjects** — Mock auth sessions, NOT the function under test
- **Use existing helpers** — `createMockSession()` and `mockAuthModule()` from `src/__tests__/helpers/auth.ts`
- **No trivial tests** — `expect(true).toBe(true)` is not a test
- **Test edge cases** — Empty input, unauthorized access, missing data, error paths

### API Route Test Pattern

```typescript
import { GET } from "@/app/api/your-route/route";
import { vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn().mockResolvedValue({
        user: { id: "test-user-id", name: "Test User", email: "test@test.com" },
        session: { id: "test-session-id" },
      }),
    },
  },
}));

describe("GET /api/your-route", () => {
  it("returns expected data for authenticated user", async () => {
    const request = new Request("http://localhost:3000/api/your-route");
    const response = await GET(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    // Assert real response shape and values
  });
});
```

---

## Security Checklist

✓ Check session in ALL protected routes
✓ Filter ALL user data by `session.user.id`
✓ Verify ownership on updates/deletes: `and(eq(table.id, id), eq(table.userId, userId))`
✓ Validate all user input
✓ Use try/catch in API routes
✓ Return user-friendly errors

---

## Common Imports

```typescript
// Auth
import { auth } from "@/lib/auth";
import { useSession, signIn, signOut } from "@/lib/auth-client";

// Database
import { db } from "@/lib/db";
import { eq, and, or, desc } from "drizzle-orm";

// AI SDK
import { openai } from "@ai-sdk/openai";
import { streamText, generateText } from "ai";
import { useChat } from "@ai-sdk/react";

// UI
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
```

---

## Anti-Patterns (NEVER)

❌ Write implementation before tests (TDD: test first)
❌ Write tests that mock the function under test
❌ Write tests that always pass regardless of implementation
❌ Skip running tests after changes
❌ Use `"use client"` unnecessarily
❌ Hardcode model names or API keys
❌ Query without filtering by userId
❌ Skip authentication checks
❌ Use custom colors outside design system
❌ Skip lint and typecheck

---

**See AGENTS.md for complete patterns, architecture, and security requirements.**
