# Next.js Middleware Redirect Loop After Google OAuth Sign-in with Better Auth

---
title: "Next.js Middleware Redirect Loop After Google OAuth Sign-in"
category: runtime-errors
tags:
  - nextjs
  - middleware
  - better-auth
  - edge-runtime
  - oauth
  - redirect-loop
  - drizzle-orm
  - postgresql
severity: high
symptoms:
  - ERR_TOO_MANY_REDIRECTS error in browser after Google OAuth sign-in
  - INTERNAL_SERVER_ERROR in Better Auth logs with "Failed query"
  - Successful OAuth callback but immediate redirect loop
  - Database queries silently failing in Edge runtime
affected_components:
  - src/middleware.ts
  - src/lib/auth.ts
  - Better Auth session handling
  - Next.js Edge runtime
resolution_time: ~30 minutes
date_documented: 2026-01-30
---

## Problem

After successfully completing Google OAuth sign-in, the browser shows:

```
This page isn't working
localhost redirected you too many times.
Error code: ERR_TOO_MANY_REDIRECTS
```

Server logs show repeated errors:

```
ERROR [Better Auth]: INTERNAL_SERVER_ERROR Error: Failed query:
select "id", "expiresAt", "token"... from "session" where "session"."token" = $1
GET / 307 in 261ms
GET / 307 in 194ms
GET / 307 in 186ms
```

## Root Cause

**Next.js middleware runs in Edge runtime, which does not support Node.js database drivers.**

The middleware was importing the full `auth` object and calling `auth.api.getSession()`:

```typescript
// src/middleware.ts (BROKEN)
import { auth } from "@/lib/auth";  // This imports Drizzle/postgres client

export async function middleware(request: NextRequest) {
  try {
    // THIS FAILS - postgres client doesn't work in Edge runtime
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.redirect(loginUrl);
    }
  } catch {
    // Error caught, redirects to "/"
    return NextResponse.redirect(loginUrl);  // Creates infinite loop!
  }
}
```

**The failure chain:**
1. User completes OAuth, gets redirected to `/schedule`
2. Middleware tries to validate session via database query
3. Database query fails (postgres not supported in Edge)
4. Catch block redirects to `/`
5. User has session cookie, so something redirects back to `/schedule`
6. Repeat infinitely

## Solution

**Separate concerns between Edge runtime (middleware) and Node.js runtime (route handlers).**

### Fixed Middleware (Edge-safe)

```typescript
// src/middleware.ts (FIXED)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_ROUTES = ["/schedule", "/employees", "/time-off", "/reports"];
const PROTECTED_API_ROUTES = ["/api/shifts", "/api/schedule", "/api/employees"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtectedPage = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
  const isProtectedApi = PROTECTED_API_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (!isProtectedPage && !isProtectedApi) {
    return NextResponse.next();
  }

  // CORRECT: Only check cookie EXISTENCE, not validity
  const sessionCookie = request.cookies.get("better-auth.session_token");

  if (!sessionCookie?.value) {
    if (isProtectedApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Cookie exists - let request through for full validation in route handler
  return NextResponse.next();
}
```

### Route Handlers (Full Validation)

Route handlers run in Node.js runtime where database access works:

```typescript
// src/app/api/employees/route.ts
export async function GET() {
  // CORRECT: Full session validation in Node.js runtime
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Safe to query database here
  const employees = await db.select().from(employee)...
}
```

### Pages (Server Components)

```typescript
// src/app/schedule/page.tsx
export default async function SchedulePage() {
  // CORRECT: Full session validation in Node.js runtime
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/");
  }

  // Safe to fetch data
  const shifts = await db.select()...
}
```

## Architecture Pattern

| Layer | Runtime | Responsibility | Database Access |
|-------|---------|----------------|-----------------|
| Middleware | Edge | Cookie existence check | NO |
| Pages/Layouts | Node.js | Full session validation | YES |
| API Routes | Node.js | Session + authorization | YES |

```
Request Flow:

  Request → [Middleware]  → [Page/API Route]  → Response
              (Edge)           (Node.js)
                │                   │
                ▼                   ▼
           Cookie check      Full DB validation
           Fast reject       Session + roles
```

## Prevention

### Warning Signs in Code Review

Flag these as immediate problems in middleware files:

```typescript
// RED FLAGS - Never in middleware
import { db } from "@/lib/db";           // Database client
import { drizzle } from "drizzle-orm";   // ORM
import postgres from "postgres";          // Driver
import { auth } from "@/lib/auth";        // If auth uses DB adapter

const session = await auth.api.getSession(...);  // DB query
await db.select().from(users);                    // DB query
```

### Testing Checklist

After modifying middleware:

- [ ] `npm run build` completes without Edge runtime errors
- [ ] OAuth sign-in flow completes without redirect loop
- [ ] Protected routes redirect unauthenticated users once (not infinitely)
- [ ] API routes return 401 for missing session
- [ ] Manager-only operations still check roles (in route handlers)

## Related Documentation

- [Middleware Edge Runtime Auth Pattern](../../patterns/middleware-edge-runtime-auth.md)
- [Better Auth ADR](../../adr/0001-use-better-auth.md)
- [Security - Session Management](../../SECURITY.md)
- [Architecture Overview](../../architecture/OVERVIEW.md)

## Key Insight

The original middleware was architecturally flawed, not just buggy. Edge runtime is designed to be lightweight and fast - it intentionally excludes heavy dependencies like database drivers. The fix isn't a workaround; it's the correct pattern for Next.js + database-backed authentication.

**Middleware = gatekeeper (fast, lightweight)**
**Route handlers = validator (full access, authorization)**
