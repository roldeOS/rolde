import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@rolde/db";

/**
 * Supabase client for the server (Server Components, Route Handlers, Server Actions).
 * `cookies()` is async in Next 15+ — hence the await. This client reads the auth
 * session from cookies and refreshes it via the cookie adapter.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component (cookies are read-only there).
            // Safe to ignore — the middleware refreshes the session on each request.
          }
        },
      },
    },
  );
}
