"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { emailOk, phonePlausible } from "@/lib/validation";

/**
 * The Courier Address Book actions (C2) — the clinic-level directory Courier
 * sends to. Grammar as everywhere: tenant from the SESSION, RLS re-checks,
 * expected failures RETURN { error }, soft-delete only (a sent letter must
 * forever know where it went), every change Activity-Logged.
 */
export type ActionResult = { ok: true } | { ok: false; error: string };
const fail = (error: string): ActionResult => ({ ok: false, error });

const KINDS = [
  "gp_practice",
  "pharmacy",
  "laboratory",
  "hospital",
  "clinic",
  "specialist",
  "other",
] as const;
const asKind = (v: string) => ((KINDS as readonly string[]).includes(v) ? v : "other");

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();
const orNull = (v: string) => (v ? v : null);

async function requireClinic() {
  const ctx = await getSessionContext();
  const tenantId = ctx?.membership?.tenant_id;
  if (!ctx || !tenantId) return null;
  return { userId: ctx.user.id, tenantId, supabase: await createClient() };
}

export async function saveAddressBookEntry(formData: FormData): Promise<ActionResult> {
  const id = str(formData, "id"); // empty = add
  const name = str(formData, "name");
  if (!name) return fail("The entry needs a name.");
  const c = await requireClinic();
  if (!c) return fail("No clinic context for this user.");

  const fields = {
    kind: asKind(str(formData, "kind")),
    name,
    contact_name: orNull(str(formData, "contact_name")),
    email: orNull(str(formData, "email")),
    phone: orNull(str(formData, "phone")),
    address_line1: orNull(str(formData, "address_line1")),
    address_line2: orNull(str(formData, "address_line2")),
    city: orNull(str(formData, "city")),
    postcode: orNull(str(formData, "postcode")),
    notes: orNull(str(formData, "notes")),
  };
  if (fields.email && !emailOk(fields.email)) return fail("That email doesn’t look right.");
  if (fields.phone && !phonePlausible(fields.phone))
    return fail("That phone number doesn’t look right.");

  if (id) {
    const { data: updated, error } = await c.supabase
      .from("clinic_address_book")
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("tenant_id", c.tenantId)
      .is("deleted_at", null)
      .select("id")
      .maybeSingle();
    if (error || !updated) {
      if (error) console.error("[address book edit]", error.message);
      return fail(error ? "That didn’t save — try again." : "That entry wasn’t found.");
    }
  } else {
    const { error } = await c.supabase.from("clinic_address_book").insert({
      ...fields,
      tenant_id: c.tenantId,
      created_by: c.userId,
    });
    if (error) {
      console.error("[address book add]", error.message);
      return fail("That didn’t save — try again.");
    }
  }

  await logAudit({
    tenantId: c.tenantId,
    actorUserId: c.userId,
    action: id ? "courier.address_edit" : "courier.address_add",
    resourceType: "address_book",
    resourceId: id || undefined,
    summary: id ? "Edited a Courier address-book entry" : "Added a Courier address-book entry",
  });
  revalidatePath("/settings/courier");
  return { ok: true };
}

export async function removeAddressBookEntry(formData: FormData): Promise<ActionResult> {
  const id = str(formData, "id");
  if (!id) return fail("Missing entry.");
  const c = await requireClinic();
  if (!c) return fail("No clinic context for this user.");

  const { data: removed, error } = await c.supabase
    .from("clinic_address_book")
    .update({ deleted_at: new Date().toISOString(), deleted_by: c.userId })
    .eq("id", id)
    .eq("tenant_id", c.tenantId)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();
  if (error || !removed) {
    if (error) console.error("[address book remove]", error.message);
    return fail(error ? "That didn’t save — try again." : "That entry was already removed.");
  }

  await logAudit({
    tenantId: c.tenantId,
    actorUserId: c.userId,
    action: "courier.address_remove",
    resourceType: "address_book",
    resourceId: id,
    summary: "Removed a Courier address-book entry",
  });
  revalidatePath("/settings/courier");
  return { ok: true };
}
