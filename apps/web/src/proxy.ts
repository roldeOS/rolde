import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Runs on every request (Next 16 "proxy" convention; was `middleware`).
 * Refresh the Supabase session, then gate:
 * - Not signed in + not on /login  → redirect to /login
 * - Signed in + on /login          → redirect to /
 * (Subdomain→tenant resolution lands here next — Bible 4.1 §3.5.)
 */
export async function proxy(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);
  const isLogin = request.nextUrl.pathname === "/login";

  if (!user && !isLogin) {
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
