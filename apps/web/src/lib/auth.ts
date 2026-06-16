import { notFound } from "next/navigation";
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

  const [{ data: membership }, { data: custodian }] = await Promise.all([
    supabase
      .from("tenant_users")
      .select("tenant_id, display_name, role, tenants(name, slug)")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("custodian_users")
      .select("user_id, display_name, title, photo_url")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  return { user, membership, custodian, isCustodian: !!custodian };
}

/**
 * Gate a Custodian-only surface (the platform console). Non-custodians (and
 * unauthenticated callers) get a 404 — we don't reveal the page exists. Returns
 * the context for the page to use.
 */
export async function requireCustodian() {
  const ctx = await getSessionContext();
  if (!ctx?.isCustodian) notFound();
  return ctx;
}
