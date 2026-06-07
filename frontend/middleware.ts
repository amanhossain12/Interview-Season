import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_ROUTES = ["/login", "/register", "/forgot-password"];

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/interview",
  "/resume",
  "/coding",
  "/roadmap",
  "/job-match",
  "/admin",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Read auth cookie written by authStore.syncAuthCookie() ──
  const authCookie = request.cookies.get("interviewai-auth");
  let isAuthenticated = false;
  let userRole = "ROLE_CANDIDATE";

  if (authCookie?.value) {
    try {
      const authData = JSON.parse(decodeURIComponent(authCookie.value));
      isAuthenticated = authData.state?.isAuthenticated === true;
      userRole = authData.state?.user?.role || "ROLE_CANDIDATE";
    } catch {
      // Malformed cookie — treat as unauthenticated
    }
  }

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));

  // 1. Logged-in user visiting /login or /register → send to /interview
  if (isAuthenticated && isAuthRoute) {
    console.log("[MIDDLEWARE] Authenticated user on auth route → /interview");
    return NextResponse.redirect(new URL("/interview", request.url));
  }

  // 2. Unauthenticated user visiting a protected route → send to /login
  if (!isAuthenticated && isProtected) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    console.log("[MIDDLEWARE] Unauthenticated → /login from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Admin route guard
  if (pathname.startsWith("/admin") && userRole !== "ROLE_ADMIN") {
    return NextResponse.redirect(new URL("/interview", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
