import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

const MANAGER_ONLY_ROUTES = [
  "/employees",
  "/reports",
  "/api/employees",
  "/api/schedule/generate",
];

const PROTECTED_ROUTES = [
  "/schedule",
  "/time-off",
  "/my-schedule",
  "/dashboard",
  "/api/shifts",
  "/api/time-off",
  "/api/schedule",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if this is a protected route
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
  const isManagerRoute = MANAGER_ONLY_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // Skip middleware for non-protected routes
  if (!isProtectedRoute && !isManagerRoute) {
    return NextResponse.next();
  }

  try {
    // Get session from Better Auth
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    // No session - redirect to login
    if (!session) {
      const loginUrl = new URL("/", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check manager-only routes
    if (isManagerRoute) {
      const user = session.user as { role?: string };
      if (user.role !== "manager") {
        // API routes return 403
        if (pathname.startsWith("/api/")) {
          return NextResponse.json(
            { error: "Forbidden: Manager access required" },
            { status: 403 }
          );
        }
        // Page routes redirect to schedule
        return NextResponse.redirect(new URL("/my-schedule", request.url));
      }
    }

    return NextResponse.next();
  } catch {
    // On auth error, redirect to login
    const loginUrl = new URL("/", request.url);
    return NextResponse.redirect(loginUrl);
  }
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
