import { createClient } from "@/lib/supabase/server";

/**
 * The authenticated user's session context for this request: who they are,
 * and (first-slice) which clinic they belong to, derived from their membership.
 * RLS scopes every read to their own tenant, so this can only ever return
 * the caller's own data. Subdomain→tenant routing layers on top later.
 */
export async function getSessionContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membership } = await supabase
    .from("tenant_users")
    .select("display_name, role, tenants(name, slug)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return { user, membership };
}
