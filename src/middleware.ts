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

  // Check for session cookie (Better Auth uses "better-auth.session_token")
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
