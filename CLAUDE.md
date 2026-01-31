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

**Model Configuration** (`src/lib/ai-models.ts`):
- **GPT-4.1** (`OPENAI_CHAT_MODEL`): Default for general chat - smartest non-reasoning model
- **GPT-5.2** (`OPENAI_REASONING_MODEL`): For complex scheduling with reasoning effort

```typescript
import { openai } from "@ai-sdk/openai";
import { CHAT_MODEL, REASONING_MODEL, getReasoningOptions } from "@/lib/ai-models";

// General chat (no reasoning)
const result = streamText({
  model: openai(CHAT_MODEL),
  // ...
});

// Complex scheduling (with low reasoning)
const result = streamText({
  model: openai(REASONING_MODEL),
  providerOptions: getReasoningOptions("low"), // 'none' | 'low' | 'medium' | 'high'
  // ...
});
```

### AI State Awareness (Critical)

The AI assistant requires proper state awareness. See `docs/patterns/ai-assistant-state-awareness.md` for full details.

**Key files:**
- `src/lib/ai-context.ts` - Builds dynamic context (date, business state, alerts)
- `src/app/api/chat/messages/route.ts` - Persists conversation history

**Rules:**
1. System prompts MUST include current date/time via `buildAIContext()`
2. Chat messages MUST persist to database (user sees it = AI knows it)
3. AI can refresh state mid-conversation via `getCurrentContext` tool
4. Never generate schedules for past dates unless explicitly requested

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
| `src/lib/ai-models.ts` | AI model config (GPT-4.1/5.2) |
| `src/lib/ai-context.ts` | AI dynamic context builder |
| `src/lib/ai-tools.ts` | AI tool definitions |
| `src/app/api/auth/[...all]/route.ts` | Auth catch-all route |
| `src/app/api/chat/route.ts` | AI streaming endpoint |
| `src/app/api/chat/messages/route.ts` | Chat history persistence |

## Rules

1. Server Components by default - only use `"use client"` for useState/useEffect/onClick/browser APIs
2. Use shadcn/ui components from `src/components/ui/` before creating custom ones
3. Use semantic color variables (`text-foreground`, `bg-background`, etc.) - no custom hex colors
4. Never hardcode model names or API keys
5. Run lint and typecheck after all changes

## Git Workflow

**Commit frequently** - Make small, incremental commits as you work:
- Commit after completing each logical unit of work (a function, a component, a fix)
- Commit before moving to a different area of the codebase
- Commit working states before attempting risky changes
- Don't batch everything into one big commit at the end

Good commit rhythm: every 10-20 minutes of active coding, or after each meaningful change.

For comprehensive patterns and examples, see **AGENTS.md**.
