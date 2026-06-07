import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Creates a typed Supabase client for the RolDe platform.
 *
 * Pass the project URL + publishable (anon) key — safe for the browser.
 * Server-side admin (service-role) access is wired separately inside
 * `apps/web` once auth lands; the service-role key NEVER reaches the client.
 */
export function createClient(url: string, key: string) {
  return createSupabaseClient<Database>(url, key);
}

export type { Database } from "./database.types";
