# AGENTS.md

**Machine-readable instructions for AI coding agents**

This is the primary source of truth for all AI coding assistants (Claude Code, Cursor, GitHub Copilot, etc.) working with this Next.js starter kit.

---

## Project Overview

Production-ready Next.js 15 starter kit with:
- **Framework**: Next.js 15 App Router, React 19, TypeScript (strict)
- **Auth**: Better Auth with Google OAuth
- **Database**: PostgreSQL + Drizzle ORM (postgres.js)
- **AI**: Vercel AI SDK with OpenAI
- **UI**: shadcn/ui (new-york style, neutral colors) + Tailwind CSS v4
- **Path Aliases**: `@/` → `src/`

---

## Setup Commands

```bash
# Install dependencies
npm install

# Development
npm run dev

# Build
npm run build

# Database operations
npm run db:push       # Push schema changes (dev)
npm run db:generate   # Generate migrations (prod)
npm run db:migrate    # Run migrations (prod)
npm run db:studio     # Open database GUI

# Testing
npm run test           # Unit + integration tests
npm run test:watch     # Watch mode (use during TDD)
npm run test:e2e       # E2E tests (Playwright)
npm run test:all       # All tests

# Quality checks (ALWAYS run after changes)
npm run lint
npm run typecheck
npm run test
```

---

## Core Principles (CRITICAL)

1. **Test-Driven Development** - Write failing tests BEFORE implementation (RED → GREEN → REFACTOR)
2. **Server Components by Default** - Only use `"use client"` when you need useState, useEffect, onClick, or browser APIs
3. **Always Filter by User ID** - All user-specific database queries MUST filter by `session.user.id`
4. **Use Existing Patterns** - Don't reinvent auth, database, or AI integration
5. **Environment Variables** - ALWAYS use `process.env.OPENAI_MODEL`, never hardcode model names
6. **Quality Checks Required** - Run `npm run lint && npm run typecheck && npm run test` after ALL changes
7. **Security First** - Check authentication, validate input, verify ownership on updates/deletes

---

## Project Structure

```
src/
├── app/                      # Next.js App Router
│   ├── api/
│   │   ├── auth/[...all]/   # Better Auth catch-all
│   │   └── chat/            # AI streaming endpoint
│   ├── dashboard/           # Protected pages
│   ├── chat/                # AI chat interface
│   └── page.tsx             # Public landing
├── components/
│   ├── auth/                # Auth components
│   └── ui/                  # shadcn/ui components
├── lib/
│   ├── auth.ts              # Better Auth server
│   ├── auth-client.ts       # Better Auth client
│   ├── db.ts                # Database connection
│   ├── schema.ts            # Drizzle schema
│   └── utils.ts             # Utilities
└── hooks/                   # Custom React hooks
```

---

## Database Schema

**Existing tables**: user, session, account, verification

**All new user-specific tables MUST include:**
```typescript
userId: uuid("user_id")
  .references(() => user.id, { onDelete: "cascade" })
  .notNull()
```

**Extending schema** (`src/lib/schema.ts`):
```typescript
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./schema";

export const yourTable = pgTable("your_table", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => user.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

**After schema changes**: Run `npm run db:push` (dev) or `npm run db:generate && npm run db:migrate` (prod)

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
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Your logic here
}
```

**Client Component:**
```typescript
"use client";
import { useSession, signIn, signOut } from "@/lib/auth-client";

export function MyComponent() {
  const { data: session, isPending } = useSession();
  if (isPending) return <div>Loading...</div>;
  if (!session) return <Button onClick={() => signIn.social({ provider: "google" })}>Sign In</Button>;
  return <div>Welcome {session.user.name}</div>;
}
```

---

## Database Query Patterns

**CRITICAL: Always filter by userId for user-specific data**

```typescript
import { db } from "@/lib/db";
import { yourTable } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

// SELECT - Get user's records only
const records = await db
  .select()
  .from(yourTable)
  .where(eq(yourTable.userId, session.user.id));

// INSERT - With user ownership
const [newRecord] = await db
  .insert(yourTable)
  .values({ userId: session.user.id, title: "Example" })
  .returning();

// UPDATE - With ownership verification (CRITICAL)
const [updated] = await db
  .update(yourTable)
  .set({ title: "Updated" })
  .where(and(
    eq(yourTable.id, recordId),
    eq(yourTable.userId, session.user.id)  // MUST verify ownership
  ))
  .returning();

// DELETE - With ownership verification
await db
  .delete(yourTable)
  .where(and(
    eq(yourTable.id, recordId),
    eq(yourTable.userId, session.user.id)
  ));
```

---

## AI Integration Pattern

**CRITICAL: Always use environment variable for model**

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

**Streaming API Route** (see `src/app/api/chat/route.ts`):
```typescript
export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  const result = streamText({
    model: openai(process.env.OPENAI_MODEL || "gpt-4o-mini"),
    messages: convertToModelMessages(messages),
  });
  return result.toUIMessageStreamResponse();
}
```

**Client Hook:**
```typescript
"use client";
import { useChat } from "@ai-sdk/react";

export function ChatComponent() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: "/api/chat",
  });
  // Render UI
}
```

---

## UI Component Guidelines

1. **Use shadcn/ui First** - Check `src/components/ui/` before creating custom components
2. **Install new components**: `pnpm dlx shadcn@latest add [component-name]`
3. **Styling**: Use Tailwind utilities ONLY, semantic color variables
4. **Responsive**: Mobile-first approach with `md:`, `lg:` breakpoints

**Semantic Colors:**
- `text-foreground` - Primary text
- `text-muted-foreground` - Secondary text
- `bg-background` - Main background
- `bg-card` - Card backgrounds
- `border-border` - Standard borders
- `bg-primary` - Primary buttons
- `bg-destructive` - Error states

**Never use custom hex colors** - Always use semantic variables

---

## Security Checklist

✓ Check session in ALL protected routes and API endpoints
✓ Filter ALL user data queries by `session.user.id`
✓ Use `and(eq(table.id, id), eq(table.userId, session.user.id))` on updates/deletes
✓ Validate and sanitize all user input
✓ Use try/catch in API routes, log errors server-side
✓ Return user-friendly error messages (never expose internals)
✓ Never commit .env files

---

## Development Workflow

### The Development Loop

For non-trivial features, follow this connected workflow. Each phase activates the relevant skills automatically:

1. **Brainstorm** — Explore requirements → activates: smart-clarifier, starter-kit-intelligence
2. **Plan** — Architecture + task decomposition → activates: feature-builder, database-designer, api-route-builder, ui-developer
3. **Work** — TDD implementation (RED → GREEN → REFACTOR) → activates: tdd-workflow, feature-builder, database-designer, api-route-builder, ui-developer
4. **Review** — Security, quality, performance check → activates: code-reviewer
5. **Compound** — Document learnings in `docs/solutions/`

Workflow skills are available in `.agents/skills/workflow-*` (Codex) and `.claude/skills/workflow-*` (Claude Code).

For simple changes (single-file fix, obvious bug), start at step 3.

### Before Starting Any Feature

Check `docs/solutions/` for relevant past solutions — don't repeat solved problems.

---

## Testing (REQUIRED)

### TDD Workflow (CRITICAL)

1. **RED**: Write failing test first — describes what "done" looks like
2. **GREEN**: Minimum code to pass — nothing more
3. **REFACTOR**: Clean up while keeping tests green

### Test Commands

```bash
npm run test           # Unit + integration (Vitest)
npm run test:watch     # Watch mode for TDD
npm run test:e2e       # E2E browser tests (Playwright)
npm run test:all       # Everything
```

### Test Structure

```
src/__tests__/
  setup.ts                          # Global setup
  helpers/
    auth.ts                         # Mock sessions, auth boundary mocks
    db.ts                           # Test database utilities
  unit/                             # Pure function tests
  integration/                      # API route handler tests
e2e/                                # Browser flow tests (Playwright)
```

### Test Rules

- **Tests MUST exercise real code** — no `expect(true).toBe(true)`
- **Mock boundaries, not subjects** — mock auth sessions, not the code under test
- **Test behavior, not implementation** — assert what it does, not how
- **Each test verifies ONE behavior** — if the name has "and", split it

---

## Anti-Patterns (NEVER Do)

❌ Write implementation before tests
❌ Write tests that mock the subject under test
❌ Write tests that always pass (`expect(true).toBe(true)`)
❌ Skip the RED step — tests must fail before you make them pass
❌ Use `"use client"` on server components unnecessarily
❌ Hardcode model names or API keys
❌ Query database without filtering by userId for user data
❌ Skip authentication checks
❌ Create custom components when shadcn/ui has them
❌ Use custom hex colors outside design system
❌ Skip ownership verification on updates/deletes
❌ Forget to run lint, typecheck, and tests

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
import { streamText, generateText, generateObject } from "ai";
import { useChat } from "@ai-sdk/react";

// UI
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
```

---

## Environment Variables

Required in `.env`:
- `POSTGRES_URL` - Database connection
- `BETTER_AUTH_SECRET` - Auth secret (32 chars)
- `GOOGLE_CLIENT_ID` - OAuth client ID
- `GOOGLE_CLIENT_SECRET` - OAuth secret
- `OPENAI_API_KEY` - OpenAI key (optional)
- `OPENAI_MODEL` - Model name (default: gpt-4o-mini)
- `NEXT_PUBLIC_APP_URL` - App URL

---

## Context Maintenance

### When to Update Context Files

Update AGENTS.md, CLAUDE.md, or skill files when:
- A **new pattern** is established (e.g., new API convention, new component pattern)
- An **architecture decision** is made (document in `docs/adr/`)
- A **workflow changes** (e.g., new build step, new quality check)
- A **non-obvious solution** is found (document in `docs/solutions/`)

### What Belongs Where

| Content | Location |
|---------|----------|
| Universal conventions, patterns, architecture | `AGENTS.md` |
| Claude Code specific workflows, tool usage | `CLAUDE.md` |
| Specialized domain knowledge | `.claude/skills/*/SKILL.md` |
| Past solutions, gotchas, lessons learned | `docs/solutions/` |
| Architecture decisions | `docs/adr/` |

### File Size Rules

All context files MUST stay under **500 lines**. If a file grows beyond this:
- Extract specialized content to dedicated files
- Reference extracted content with file paths
- Keep the most-used patterns in the main file

### Query Live, Don't Duplicate

Use tools (MCP, context7, shadcn) to query live information instead of duplicating in context files:
- Component APIs → shadcn MCP
- Library documentation → context7
- Package versions → `package.json`
- Current database state → `npm run db:studio`

---

## Additional Resources

- `.agents/skills/` - Codex skills (workflow + domain)
- `.claude/skills/` - Claude Code skills (workflow + domain)
- `.cursor/rules/` - Cursor IDE rules
- `.github/agents/` - GitHub Copilot instructions
- `.codex/config.toml` - Codex project configuration
- `CLAUDE.md` - Claude Code specific instructions
- `docs/` - Additional documentation
- `README.md` - Setup guide

---

**Remember**: This starter kit is designed for test-driven, secure development. Write tests first, follow the patterns, check authentication, validate input, and always filter by userId.
