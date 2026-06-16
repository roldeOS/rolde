import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { roleCanAccess, canPrescribe } from "@/lib/access";

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
      .select("tenant_id, display_name, role, prescribing_rights, tenants(name, slug)")
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

/**
 * Gate a clinic module to the roles allowed by the access matrix (Bible 4.1 /
 * `lib/access.ts`). A staff role without access — and a Custodian, who does no
 * clinical work — gets a 404 (we don't reveal the page). This is the REAL gate;
 * hiding the nav item is only the matching UX. Returns the context on success.
 */
export async function requireModuleAccess(moduleKey: string) {
  const ctx = await getSessionContext();
  if (!roleCanAccess(ctx?.membership?.role, moduleKey)) notFound();
  return ctx;
}

/**
 * Prescribing gate (Roland 2026-06-16): the caretaker-set `prescribing_rights`
 * flag is the real control — even a doctor without it can't prescribe. Denied → 404.
 */
export async function requirePrescriber() {
  const ctx = await getSessionContext();
  if (!canPrescribe(ctx?.membership?.role, ctx?.membership?.prescribing_rights)) notFound();
  return ctx;
}
