import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Runs on every request (Next 16 "proxy" convention; was `middleware`).
 * Refresh the Supabase session, then gate:
 * - Not signed in + not on a PUBLIC route → redirect to /login
 * - Signed in + on /login                 → redirect to /
 * (Subdomain→tenant resolution lands here next — Bible 4.1 §3.5.)
 */
export async function proxy(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);
  const path = request.nextUrl.pathname;
  const isLogin = path === "/login";
  // Routes the page-gate must NOT redirect to /login:
  //  - the auth screens (sign-in + the password-reset landing) and public legal
  //    pages (W0.2) — reachable WITHOUT a session;
  //  - `/api/*` and `/auth/*` — these return JSON / redirects and do their OWN
  //    auth (e.g. forgot-password, the generateLink confirm handler). Redirecting
  //    them to the /login HTML page would break the call. (The session is still
  //    refreshed above for every route.)
  const isPublic =
    isLogin ||
    path === "/reset" ||
    path.startsWith("/policy") ||
    path.startsWith("/api") ||
    path.startsWith("/auth") ||
    // Courier's secure token surfaces (C3 letters · T4 forms) — recipients
    // have no RolDe account; the long-random capability token in each URL is
    // the authorisation, enforced by the routes themselves.
    path.startsWith("/courier/");

  if (!user && !isPublic) {
    return redirectKeepingCookies(request, "/login", supabaseResponse);
  }
  if (user && isLogin) {
    return redirectKeepingCookies(request, "/", supabaseResponse);
  }
  return supabaseResponse;
}

function redirectKeepingCookies(
  request: NextRequest,
  pathname: string,
  from: NextResponse,
) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  const res = NextResponse.redirect(url);
  from.cookies.getAll().forEach((c) => res.cookies.set(c));
  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
