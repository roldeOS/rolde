import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@rolde/db";

/**
 * Service-role Supabase client — SERVER ONLY. Bypasses RLS, so it must NEVER be
 * imported into client code or exposed to the browser. Used by trusted server
 * paths (the email send pipeline, auth-link minting) that need to read any
 * template and write the send log regardless of the caller's session.
 *
 * Lazy-initialised so `next build` succeeds even before the key is present; it
 * only throws when actually called without `SUPABASE_SERVICE_ROLE_KEY`.
 */
let cached: SupabaseClient<Database> | null = null;

export function createAdminClient(): SupabaseClient<Database> {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase admin client needs NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
  cached = createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cached;
}
