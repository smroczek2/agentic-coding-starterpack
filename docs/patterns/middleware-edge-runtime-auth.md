# Middleware Auth Pattern: Edge Runtime Cookie Check

## Problem

Next.js middleware runs in the Edge runtime, which has limited API support. When using Better Auth with a PostgreSQL database adapter, calling `auth.api.getSession()` in middleware fails because the postgres client is not compatible with the Edge runtime.

### Symptom

After OAuth sign-in, users experience infinite redirect loops. The browser shows repeated redirects between the home page and login URL.

### Root Cause

```typescript
// src/middleware.ts - BROKEN CODE
import { auth } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtectedPage = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (!isProtectedPage) {
    return NextResponse.next();
  }

  try {
    // THIS FAILS IN EDGE RUNTIME
    // The postgres client in Better Auth cannot run in Edge runtime
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (!session) {
      return NextResponse.redirect(loginUrl);
    }
  } catch {
    // Error caught, redirects to "/" creating infinite loop
    return NextResponse.redirect(loginUrl);
  }
}
```

The `auth.api.getSession()` call attempts to query the database via the postgres client, which throws an error in Edge runtime. The catch block then redirects, and since the user IS authenticated (cookie exists), this creates a redirect loop.

---

## Solution

Split authentication into two layers:

1. **Middleware (Edge Runtime)**: Lightweight cookie existence check only
2. **Route Handlers/Pages (Node.js Runtime)**: Full session validation with database queries

### Working Middleware Implementation

```typescript
// src/middleware.ts - WORKING CODE
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_ROUTES = [
  "/schedule",
  "/time-off",
  "/my-schedule",
  "/dashboard",
  "/employees",
  "/reports",
];

const PROTECTED_API_ROUTES = [
  "/api/shifts",
  "/api/time-off",
  "/api/schedule",
  "/api/employees",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if this is a protected route
  const isProtectedPage = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
  const isProtectedApi = PROTECTED_API_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // Skip middleware for non-protected routes
  if (!isProtectedPage && !isProtectedApi) {
    return NextResponse.next();
  }

  // CORRECT: Only check cookie existence in Edge runtime
  // Better Auth uses "better-auth.session_token" as the cookie name
  const sessionCookie = request.cookies.get("better-auth.session_token");

  if (!sessionCookie?.value) {
    // No session cookie - redirect pages to login, return 401 for API
    if (isProtectedApi) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    const loginUrl = new URL("/", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Session cookie exists - let the request through
  // Full session validation happens in the actual route handlers
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/schedule/:path*",
    "/employees/:path*",
    "/time-off/:path*",
    "/reports/:path*",
    "/my-schedule/:path*",
    "/dashboard/:path*",
    "/api/employees/:path*",
    "/api/shifts/:path*",
    "/api/time-off/:path*",
    "/api/schedule/:path*",
  ],
};
```

### Route Handler Validation (Node.js Runtime)

API routes perform full session validation:

```typescript
// src/app/api/employees/route.ts
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { employee } from "@/lib/schema";
import { eq, and, isNull } from "drizzle-orm";

export async function GET() {
  // Full session validation - runs in Node.js runtime
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Query database filtered by authenticated user
  const employees = await db
    .select()
    .from(employee)
    .where(
      and(
        eq(employee.userId, session.user.id),
        isNull(employee.deletedAt)
      )
    );

  return NextResponse.json({ employees });
}
```

### Server Component Validation (Node.js Runtime)

Protected pages also perform full validation:

```typescript
// src/app/schedule/page.tsx
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function SchedulePage() {
  // Full session validation - runs in Node.js runtime
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/");
  }

  // ... rest of page component
}
```

---

## Architecture Diagram

```
User Request
     |
     v
+--------------------+
|    Middleware      |  <-- Edge Runtime
|  (Cookie Check)    |
+--------------------+
     |
     | Cookie exists?
     |
     +---> No  --> Redirect to "/" (pages)
     |             Return 401 (API)
     |
     +---> Yes --> Continue to route
                        |
                        v
          +-------------------------+
          |   Route Handler/Page    |  <-- Node.js Runtime
          | (Full Session Validate) |
          +-------------------------+
                        |
                        | Session valid?
                        |
                        +---> No  --> Return 401/Redirect
                        |
                        +---> Yes --> Execute business logic
                                      Query database with user.id
```

---

## Key Points

### Why Cookie Check is Sufficient in Middleware

1. **Fast fail for unauthenticated users**: Users without a cookie are quickly redirected
2. **No database overhead**: Avoids Edge runtime limitations
3. **Session still validated**: Route handlers verify the session is actually valid
4. **Defense in depth**: Two layers of protection

### Security Considerations

- Cookie existence does not prove authentication validity
- A tampered or expired cookie will pass middleware but fail route validation
- This is acceptable because:
  - Route handlers always validate fully
  - Invalid sessions result in 401 responses
  - The worst case is one extra round trip for an invalid cookie

### Cookie Name

Better Auth uses `better-auth.session_token` as the default cookie name. If you customize this in your Better Auth configuration, update the middleware accordingly.

---

## Common Mistakes to Avoid

### 1. Calling auth.api.getSession() in Middleware

```typescript
// WRONG - Will fail in Edge runtime
const session = await auth.api.getSession({ headers: request.headers });
```

### 2. Skipping Route Handler Validation

```typescript
// WRONG - Assumes middleware already validated
export async function GET() {
  // Missing session check!
  const data = await db.select().from(table);
  return NextResponse.json(data);
}
```

### 3. Not Filtering by User ID

```typescript
// WRONG - Returns all users' data
const items = await db.select().from(item);

// CORRECT - Filter by authenticated user
const items = await db
  .select()
  .from(item)
  .where(eq(item.userId, session.user.id));
```

---

## Related Files

- `/src/middleware.ts` - Edge runtime cookie check
- `/src/lib/auth.ts` - Better Auth configuration
- `/src/app/api/*/route.ts` - API routes with full session validation
- `/src/app/*/page.tsx` - Server components with full session validation

## Related Documentation

- [Next.js Edge Runtime](https://nextjs.org/docs/app/building-your-application/rendering/edge-and-nodejs-runtimes)
- [Better Auth Documentation](https://better-auth.com)
- [Drizzle ORM](https://orm.drizzle.team)
