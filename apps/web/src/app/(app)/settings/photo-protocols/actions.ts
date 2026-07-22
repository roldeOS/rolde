"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

/**
 * Photo Protocols (multi-angle Step B). A protocol = a named, ordered list of
 * views (any count) a clinic shoots. Caretaker-owned; read by the whole clinic
 * (the capture grid uses them). RLS re-enforces the caretaker write-gate.
 */
export type PhotoProtocol = { id: string; name: string; views: string[] };
export type ActionResult = { ok: true } | { ok: false; error: string };

const isCaretaker = (ctx: Awaited<ReturnType<typeof getSessionContext>>) =>
  ctx?.membership?.role === "caretaker" || Boolean(ctx?.isCustodian);

export async function listPhotoProtocols(): Promise<PhotoProtocol[]> {
  const ctx = await getSessionContext();
  if (!ctx?.membership?.tenant_id) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("clinic_photo_protocol")
    .select("id, name, views")
    .is("deleted_at", null)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  return (data ?? []).map((p) => ({ id: p.id, name: p.name, views: p.views ?? [] }));
}

export async function savePhotoProtocol(formData: FormData): Promise<ActionResult> {
  const ctx = await getSessionContext();
  const tenantId = ctx?.membership?.tenant_id;
  if (!ctx || !tenantId) return { ok: false, error: "No clinic context for this user." };
  if (!isCaretaker(ctx))
    return { ok: false, error: "Only your clinic’s Caretaker can edit photo protocols." };

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim().slice(0, 60);
  if (!name) return { ok: false, error: "Give the protocol a name." };
  let views: string[] = [];
  try {
    const parsed = JSON.parse(String(formData.get("views") ?? "[]"));
    if (Array.isArray(parsed))
      views = parsed
        .map((v) => String(v).trim().slice(0, 40))
        .filter(Boolean)
        .slice(0, 30);
  } catch {
    views = [];
  }

  const supabase = await createClient();
  if (id) {
    const { error } = await supabase
      .from("clinic_photo_protocol")
      .update({ name, views, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase
      .from("clinic_photo_protocol")
      .insert({ tenant_id: tenantId, name, views });
    if (error) return { ok: false, error: error.message };
  }
  await logAudit({
    tenantId,
    actorUserId: ctx.user.id,
    action: "photo_protocol.save",
    resourceType: "tenant",
    resourceId: tenantId,
    summary: `Saved photo protocol “${name}”`,
  });
  revalidatePath("/settings/photo-protocols");
  return { ok: true };
}

export async function deletePhotoProtocol(id: string): Promise<ActionResult> {
  const ctx = await getSessionContext();
  const tenantId = ctx?.membership?.tenant_id;
  if (!ctx || !tenantId) return { ok: false, error: "No clinic context for this user." };
  if (!isCaretaker(ctx))
    return { ok: false, error: "Only your clinic’s Caretaker can edit photo protocols." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("clinic_photo_protocol")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  await logAudit({
    tenantId,
    actorUserId: ctx.user.id,
    action: "photo_protocol.delete",
    resourceType: "tenant",
    resourceId: tenantId,
    summary: "Removed a photo protocol",
  });
  revalidatePath("/settings/photo-protocols");
  return { ok: true };
}
