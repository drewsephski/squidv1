/**
 * proxy.ts  (updated for Squid desktop)
 *
 * Changes from the original:
 *  - Detects desktop mode via NEXT_PUBLIC_SQUID_PORT env var
 *  - In desktop mode, skips auth redirect and auto-passes all requests
 *  - Web mode works exactly as before
 */
import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const isDesktop = Boolean(process.env.NEXT_PUBLIC_SQUID_PORT);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Health check for Playwright / dev tooling
  if (pathname.startsWith("/ping")) {
    return new Response("pong", { status: 200 });
  }

  if (pathname === "/admin") {
    return NextResponse.redirect(new URL("/admin/users", request.url));
  }

  // ── Desktop mode: no login required ────────────────────────────────────────
  // The app is local, single-user, and already "authenticated" by virtue of
  // running on the user's machine. Skip the session cookie check entirely.
  if (isDesktop) {
    return NextResponse.next();
  }

  // ── Web mode: require session cookie (original behaviour) ──────────────────
  const sessionCookie = getSessionCookie(request);
  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|api/auth|export|sign-in|sign-up).*)",
  ],
};
