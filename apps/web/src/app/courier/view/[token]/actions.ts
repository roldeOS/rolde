"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * The Courier viewer's one action: a HUMAN pressed "Open Letter". This is the
 * honest Opened signal (Courier C3) — link-scanner bots GET the page but never
 * POST, so the envelope step filters them out (no tracking pixels, ever). The
 * token is re-validated here; possession + validity IS the authorisation.
 */
export async function openLetter(token: string): Promise<void> {
  if (!token || token.length < 20) return;
  const admin = createAdminClient();

  const { data: d } = await admin
    .from("courier_dispatches")
    .select("id, tenant_id, entry_id, recipient_name, status, opened_at, token_expires_at")
    .eq("view_token", token)
    .maybeSingle();
  if (!d || d.opened_at || new Date(d.token_expires_at).getTime() < Date.now()) {
    revalidatePath(`/courier/view/${token}`);
    return;
  }

  await admin
    .from("courier_dispatches")
    .update({ status: "opened", opened_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", d.id);
  await admin.from("courier_dispatch_events").insert({
    dispatch_id: d.id,
    tenant_id: d.tenant_id,
    event: "opened",
  });

  // The tile's Status Dot goes green — merge, never clobber, the payload.
  const { data: entry } = await admin
    .from("patient_feed_entries")
    .select("payload")
    .eq("id", d.entry_id)
    .maybeSingle();
  if (entry) {
    const payload = {
      ...((entry.payload as Record<string, unknown> | null) ?? {}),
      status: `Opened by ${d.recipient_name}`,
    };
    await admin.from("patient_feed_entries").update({ payload }).eq("id", d.entry_id);
  }

  revalidatePath(`/courier/view/${token}`);
}
