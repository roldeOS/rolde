"use server";

import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { sanitiseParts, type TemplatePart } from "@/lib/scribeTemplates";
import type { Json } from "@rolde/db";

/**
 * Scribe T2 — personal-template actions (Roland "go for Scribe T2",
 * 2026-07-13). A user's own templates, built from the same parts palette as
 * the curated library. Grammar as everywhere: tenant + owner from the SESSION
 * (RLS re-checks both), parts sanitised server-side (never trust a payload),
 * soft-delete only, expected failures RETURN { error }, saves audited
 * content-free.
 */
export type ActionResult = { ok: true } | { ok: false; error: string };
const fail = (error: string): { ok: false; error: string } => ({ ok: false, error });

export type PersonalTemplate = {
  id: string;
  name: string;
  specialty: string;
  parts: TemplatePart[];
};

async function requireClinic() {
  const ctx = await getSessionContext();
  const tenantId = ctx?.membership?.tenant_id;
  if (!ctx || !tenantId) return null;
  return { userId: ctx.user.id, tenantId, supabase: await createClient() };
}

/** The caller's own templates — the picker's "My Templates" section. */
export async function listMyTemplates(): Promise<
  { ok: true; data: PersonalTemplate[] } | { ok: false; error: string }
> {
  const c = await requireClinic();
  if (!c) return fail("No clinic context for this user.");
  const { data, error } = await c.supabase
    .from("user_templates")
    .select("id, name, specialty, parts")
    .eq("user_id", c.userId)
    .eq("tenant_id", c.tenantId)
    .is("deleted_at", null)
    .order("name");
  if (error) {
    console.error("[templates list]", error.message);
    return fail("Your templates couldn’t be loaded — try again.");
  }
  return {
    ok: true,
    data: (data ?? []).flatMap((t) => {
      const parts = sanitiseParts(t.parts);
      return parts
        ? [{ id: t.id, name: t.name, specialty: t.specialty, parts }]
        : [];
    }),
  };
}

export async function saveMyTemplate(input: {
  id?: string;
  name: string;
  specialty: string;
  parts: unknown;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const c = await requireClinic();
  if (!c) return fail("No clinic context for this user.");
  const name = String(input.name ?? "").trim().slice(0, 80);
  const specialty = String(input.specialty ?? "").trim().slice(0, 60) || "Personal";
  if (!name) return fail("The template needs a name.");
  const parts = sanitiseParts(input.parts);
  if (!parts) return fail("Add at least one complete part before saving.");

  let id = input.id?.trim() || "";
  if (id) {
    const { data: updated, error } = await c.supabase
      .from("user_templates")
      .update({
        name,
        specialty,
        parts: parts as unknown as Json,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", c.userId)
      .is("deleted_at", null)
      .select("id")
      .maybeSingle();
    if (error || !updated) {
      if (error) console.error("[template save]", error.message);
      return fail(error ? "That didn’t save — try again." : "That template wasn’t found.");
    }
  } else {
    const { data: created, error } = await c.supabase
      .from("user_templates")
      .insert({
        tenant_id: c.tenantId,
        user_id: c.userId,
        name,
        specialty,
        parts: parts as unknown as Json,
      })
      .select("id")
      .single();
    if (error || !created) {
      if (error) console.error("[template create]", error.message);
      return fail("That didn’t save — try again.");
    }
    id = created.id;
  }

  await logAudit({
    tenantId: c.tenantId,
    actorUserId: c.userId,
    action: input.id ? "template.edit" : "template.create",
    resourceType: "user_template",
    resourceId: id,
    summary: input.id ? "Edited a personal Scribe template" : "Created a personal Scribe template",
  });
  return { ok: true, id };
}

export async function deleteMyTemplate(id: string): Promise<ActionResult> {
  const c = await requireClinic();
  if (!c) return fail("No clinic context for this user.");
  const { data: removed, error } = await c.supabase
    .from("user_templates")
    .update({ deleted_at: new Date().toISOString(), deleted_by: c.userId })
    .eq("id", id)
    .eq("user_id", c.userId)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();
  if (error || !removed) {
    if (error) console.error("[template delete]", error.message);
    return fail(error ? "That didn’t save — try again." : "That template was already removed.");
  }
  await logAudit({
    tenantId: c.tenantId,
    actorUserId: c.userId,
    action: "template.delete",
    resourceType: "user_template",
    resourceId: id,
    summary: "Removed a personal Scribe template",
  });
  return { ok: true };
}
