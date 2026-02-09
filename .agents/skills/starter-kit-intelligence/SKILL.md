---
name: starter-kit-intelligence
description: Deep knowledge of Next.js 15 App Router, Better Auth, Drizzle ORM with PostgreSQL, Vercel AI SDK with OpenAI, and shadcn/ui integration patterns. Use when extending authentication, database schema, AI features, or understanding how existing systems are configured. Provides integration patterns and project structure guidance for this starter kit.
---

# Starter Kit Intelligence

Knowledge of this Next.js agentic coding starter kit's tech stack, project structure, and integration patterns.

## Tech Stack Overview

**Framework:** Next.js 15 with App Router (Turbopack for dev), React 19, TypeScript (strict)
**Auth:** Better Auth with Google OAuth — Server: `@/lib/auth`, Client: `@/lib/auth-client`
**Database:** PostgreSQL with Drizzle ORM (postgres.js driver) — Connection: `@/lib/db`, Schema: `@/lib/schema`
**AI:** Vercel AI SDK with OpenAI — Model via `OPENAI_MODEL` env var, Chat: `/api/chat`
**UI:** shadcn/ui (new-york style, neutral colors) + Tailwind CSS v4, Lucide React icons
**Path Aliases:** `@/` → `src/`

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/
│   │   ├── auth/[...all]/ # Better Auth catch-all
│   │   └── chat/          # AI streaming endpoint
│   ├── dashboard/         # Protected page
│   ├── chat/              # Protected AI chat
│   └── page.tsx           # Landing page
├── components/
│   ├── auth/              # Auth components
│   └── ui/                # shadcn/ui components
├── hooks/                 # Custom React hooks
├── __tests__/             # Unit + integration tests
│   ├── helpers/           # Test utilities (auth, db)
│   ├── unit/              # Pure function tests
│   └── integration/       # API route tests
└── lib/
    ├── auth.ts            # Better Auth server
    ├── auth-client.ts     # Better Auth client
    ├── db.ts              # Database connection
    ├── schema.ts          # Drizzle schema
    └── utils.ts           # Utilities (cn, etc.)
e2e/                       # Playwright E2E tests
```

## Existing Tables

**user:** id, name, email (unique), emailVerified, image, createdAt, updatedAt
**session:** id, token, expiresAt, userId (FK → user, cascade), ipAddress, userAgent
**account:** OAuth provider accounts, links to user (cascade delete)
**verification:** Email verification tokens

## Key Patterns

### Auth: Server Component
```typescript
const session = await auth.api.getSession({ headers: await headers() });
if (!session) redirect("/");
```

### Auth: Client Component
```typescript
const { data: session, isPending } = useSession();
```

### Auth: API Route
```typescript
const session = await auth.api.getSession({ headers: await headers() });
if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
```

### AI: Always use env var
```typescript
const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
const result = streamText({ model: openai(model), messages });
```

### Database: Always filter by userId
```typescript
const records = await db.select().from(table).where(eq(table.userId, session.user.id));
```

## Available Scripts

```bash
npm run dev          # Development with Turbopack
npm run build        # Production build
npm run lint         # ESLint
npm run typecheck    # TypeScript validation
npm run test         # Unit + integration tests
npm run test:watch   # Watch mode for TDD
npm run test:e2e     # Playwright E2E tests
npm run test:all     # All tests
npm run db:push      # Push schema (dev)
npm run db:generate  # Generate migrations (prod)
npm run db:migrate   # Run migrations (prod)
npm run db:studio    # Open Drizzle Studio GUI
npm run db:reset     # Reset database
```

## Environment Variables

Required in `.env`:
- `POSTGRES_URL` — Database connection
- `BETTER_AUTH_SECRET` — Auth secret (32 chars)
- `GOOGLE_CLIENT_ID` — OAuth client ID
- `GOOGLE_CLIENT_SECRET` — OAuth secret
- `OPENAI_API_KEY` — OpenAI key (optional)
- `OPENAI_MODEL` — Model name (default: gpt-4o-mini)
- `NEXT_PUBLIC_APP_URL` — App URL
