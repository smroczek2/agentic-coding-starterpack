# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Reference

**Stack**: Next.js 15 (App Router) | React 19 | TypeScript | Better Auth | Drizzle ORM + PostgreSQL | Vercel AI SDK | shadcn/ui + Tailwind CSS v4

**Path alias**: `@/` → `src/`

## Commands

```bash
# Development
npm run dev              # Start dev server (Turbopack)
npm run build            # Production build (runs migrations)

# Quality checks (ALWAYS run after changes)
npm run lint             # ESLint
npm run typecheck        # TypeScript validation

# Database
npm run db:push          # Push schema changes (development)
npm run db:generate      # Generate migrations (production)
npm run db:migrate       # Run migrations (production)
npm run db:studio        # Open Drizzle Studio GUI
npm run db:reset         # Drop all tables and push schema
```

## Architecture

### Authentication Flow

**Server-side** (`src/lib/auth.ts`):
```typescript
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const session = await auth.api.getSession({ headers: await headers() });
if (!session) redirect("/");
```

**Client-side** (`src/lib/auth-client.ts`):
```typescript
import { useSession, signIn, signOut } from "@/lib/auth-client";
```

### Database Pattern

Schema lives in `src/lib/schema.ts`. All user tables MUST include:
```typescript
userId: text("user_id").references(() => user.id, { onDelete: "cascade" }).notNull()
```

**Critical**: Always filter queries by `session.user.id` and verify ownership on updates/deletes using `and(eq(table.id, id), eq(table.userId, session.user.id))`.

### AI Integration

Always use environment variable for model:
```typescript
import { openai } from "@ai-sdk/openai";
const result = streamText({
  model: openai(process.env.OPENAI_MODEL || "gpt-5-mini"),
  // ...
});
```

## Claude Code Skills

Available skills in `.claude/skills/`:
- `smart-clarifier` - Asks clarifying questions before building
- `feature-builder` - Orchestrates full-stack feature implementation
- `database-designer` - Drizzle schema design
- `api-route-builder` - Authenticated API routes
- `ui-developer` - shadcn/ui components and layouts
- `starter-kit-intelligence` - Project pattern knowledge

### Smart Clarifier Requirement

**When using `smart-clarifier`, ALWAYS use the `AskUserQuestion` tool** - never output questions as plain text. Present 1-7 questions with 2-4 concrete options each.

## MCP Servers

Configured in `.mcp.json`:
- **shadcn** - Component registry and docs
- **context7** - Library documentation
- **puppeteer** - Browser automation

## Key Files

| Path | Purpose |
|------|---------|
| `src/lib/auth.ts` | Better Auth server config |
| `src/lib/auth-client.ts` | Client auth hooks |
| `src/lib/db.ts` | Database connection |
| `src/lib/schema.ts` | Drizzle schema |
| `src/app/api/auth/[...all]/route.ts` | Auth catch-all route |
| `src/app/api/chat/route.ts` | AI streaming endpoint |

## Rules

1. Server Components by default - only use `"use client"` for useState/useEffect/onClick/browser APIs
2. Use shadcn/ui components from `src/components/ui/` before creating custom ones
3. Use semantic color variables (`text-foreground`, `bg-background`, etc.) - no custom hex colors
4. Never hardcode model names or API keys
5. Run lint and typecheck after all changes

For comprehensive patterns and examples, see **AGENTS.md**.
