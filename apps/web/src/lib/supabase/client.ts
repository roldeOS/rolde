import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@rolde/db";

/**
 * Supabase client for browser (Client Components).
 * Uses the publishable/anon key — safe to expose.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
