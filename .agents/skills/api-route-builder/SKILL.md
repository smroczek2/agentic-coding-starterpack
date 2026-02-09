---
name: api-route-builder
description: Specialized in creating authenticated API routes with CRUD operations, validation, and error handling. Use when building new API endpoints for resources. Follows Next.js App Router patterns with Better Auth and Drizzle ORM.
---

# API Route Builder

Expert in building secure, type-safe API routes for Next.js App Router with authentication, validation, and database integration.

## When to Activate

Use this skill when:
- Creating new API endpoints
- Building CRUD operations for a resource
- Need to add authentication to an API route
- Implementing data validation
- Handling database operations in API routes

## List & Create Pattern

**File**: `src/app/api/[resource]/route.ts`

```typescript
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { yourTable } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// GET - List user's resources
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const items = await db
      .select()
      .from(yourTable)
      .where(eq(yourTable.userId, session.user.id));

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

// POST - Create new resource
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (!body.title) {
      return NextResponse.json({ error: "Title required" }, { status: 400 });
    }

    const [item] = await db
      .insert(yourTable)
      .values({ userId: session.user.id, ...body })
      .returning();

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}
```

## Single Resource Pattern

**File**: `src/app/api/[resource]/[id]/route.ts`

```typescript
import { and } from "drizzle-orm";

// GET single, PUT update, DELETE - all require ownership check
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const [updated] = await db
      .update(yourTable)
      .set({ ...body, updatedAt: new Date() })
      .where(and(
        eq(yourTable.id, params.id),
        eq(yourTable.userId, session.user.id) // CRITICAL
      ))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ item: updated });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
```

## Zod Validation Pattern

```typescript
import { z } from "zod";

const schema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = schema.parse(body);

    const [item] = await db
      .insert(yourTable)
      .values({ userId: session.user.id, ...validated })
      .returning();

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
```

## Security Checklist

✓ Check session first (auth.api.getSession)
✓ Return 401 if not authenticated
✓ Filter queries by session.user.id
✓ Verify ownership with and(eq(id), eq(userId))
✓ Validate all input
✓ Use try/catch for error handling
✓ Log errors server-side
✓ Return user-friendly error messages

## HTTP Status Codes

| Code | Usage |
|------|-------|
| 200 | Success (GET, PUT, DELETE) |
| 201 | Created (POST) |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (not authenticated) |
| 404 | Not Found |
| 500 | Internal Server Error |

## Anti-Patterns (Never Do These)

❌ Skip authentication checks
❌ Query without filtering by userId
❌ Update/delete without ownership verification
❌ Return raw error messages to users
❌ Hardcode values instead of using env vars
❌ Trust client-side input without validation
❌ Use GET for mutations
