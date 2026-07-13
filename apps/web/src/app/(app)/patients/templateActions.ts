"use server";

import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { sanitiseParts, type TemplatePart } from "@/lib/scribeTemplates";
import type { Json } from "@rolde/db";

/**
 * Scribe T2 + T2.5 actions.
 *
 * CLINIC TEMPLATES (governance rework, Roland 2026-07-13: "Only Caretakers
 * should be able to design and add templates"): a template is clinic-official
 * clinical documentation — the Caretaker designs it, the whole team fills it
 * (the governance NHS-grade systems apply to their template libraries;
 * documentation structure is a clinical-safety artefact). Team-read +
 * Caretaker-write, enforced BOTH here and by RLS.
 *
 * AUTOTEXT SHORTCUTS (T2.5, the Carebit steal) stay PERSONAL: a shortcut is a
 * typing aid — its text lands under the author's own eyes and signature, so
 * governance rides the note, not the snippet.
 */
export type ActionResult = { ok: true } | { ok: false; error: string };
const fail = (error: string): { ok: false; error: string } => ({ ok: false, error });

export type ClinicTemplate = {
  id: string;
  name: string;
  specialty: string;
  parts: TemplatePart[];
};

export type AutotextShortcut = { id: string; shortcut: string; expansion: string };

async function requireClinic() {
  const ctx = await getSessionContext();
  const tenantId = ctx?.membership?.tenant_id;
  if (!ctx || !tenantId) return null;
  return {
    userId: ctx.user.id,
    tenantId,
    role: ctx.membership?.role ?? "",
    supabase: await createClient(),
  };
}

/** The clinic's template library — every team member reads it. */
export async function listClinicTemplates(): Promise<
  { ok: true; data: ClinicTemplate[] } | { ok: false; error: string }
> {
  const c = await requireClinic();
  if (!c) return fail("No clinic context for this user.");
  const { data, error } = await c.supabase
    .from("clinic_templates")
    .select("id, name, specialty, parts")
    .eq("tenant_id", c.tenantId)
    .is("deleted_at", null)
    .order("name");
  if (error) {
    console.error("[templates list]", error.message);
    return fail("The clinic templates couldn’t be loaded — try again.");
  }
  return {
    ok: true,
    data: (data ?? []).flatMap((t) => {
      const parts = sanitiseParts(t.parts);
      return parts ? [{ id: t.id, name: t.name, specialty: t.specialty, parts }] : [];
    }),
  };
}

export async function saveClinicTemplate(input: {
  id?: string;
  name: string;
  specialty: string;
  parts: unknown;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const c = await requireClinic();
  if (!c) return fail("No clinic context for this user.");
  // The Caretaker designs the clinic's documentation (Roland's governance
  // ruling) — RLS re-checks this independently.
  if (c.role !== "caretaker")
    return fail("Clinic templates are designed by the Caretaker.");
  const name = String(input.name ?? "").trim().slice(0, 80);
  const specialty = String(input.specialty ?? "").trim().slice(0, 60) || "Clinic";
  if (!name) return fail("The template needs a name.");
  const parts = sanitiseParts(input.parts);
  if (!parts) return fail("Add at least one complete part before saving.");

  let id = input.id?.trim() || "";
  if (id) {
    const { data: updated, error } = await c.supabase
      .from("clinic_templates")
      .update({
        name,
        specialty,
        parts: parts as unknown as Json,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("tenant_id", c.tenantId)
      .is("deleted_at", null)
      .select("id")
      .maybeSingle();
    if (error || !updated) {
      if (error) console.error("[template save]", error.message);
      return fail(error ? "That didn’t save — try again." : "That template wasn’t found.");
    }
  } else {
    const { data: created, error } = await c.supabase
      .from("clinic_templates")
      .insert({
        tenant_id: c.tenantId,
        created_by: c.userId,
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
    resourceType: "clinic_template",
    resourceId: id,
    summary: input.id ? "Edited a clinic Scribe template" : "Created a clinic Scribe template",
  });
  return { ok: true, id };
}

export async function deleteClinicTemplate(id: string): Promise<ActionResult> {
  const c = await requireClinic();
  if (!c) return fail("No clinic context for this user.");
  if (c.role !== "caretaker")
    return fail("Clinic templates are designed by the Caretaker.");
  const { data: removed, error } = await c.supabase
    .from("clinic_templates")
    .update({ deleted_at: new Date().toISOString(), deleted_by: c.userId })
    .eq("id", id)
    .eq("tenant_id", c.tenantId)
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
    resourceType: "clinic_template",
    resourceId: id,
    summary: "Removed a clinic Scribe template",
  });
  return { ok: true };
}

// ── T2.5 — personal autotext shortcuts ────────────────────────────────────

const SHORTCUT_RE = /^[a-z0-9-]{2,24}$/;

export async function listMyShortcuts(): Promise<
  { ok: true; data: AutotextShortcut[] } | { ok: false; error: string }
> {
  const c = await requireClinic();
  if (!c) return fail("No clinic context for this user.");
  const { data, error } = await c.supabase
    .from("user_autotext")
    .select("id, shortcut, expansion")
    .eq("user_id", c.userId)
    .eq("tenant_id", c.tenantId)
    .is("deleted_at", null)
    .order("shortcut");
  if (error) {
    console.error("[autotext list]", error.message);
    return fail("Your shortcuts couldn’t be loaded — try again.");
  }
  return { ok: true, data: data ?? [] };
}

export async function saveMyShortcut(input: {
  shortcut: string;
  expansion: string;
}): Promise<{ ok: true; data: AutotextShortcut } | { ok: false; error: string }> {
  const c = await requireClinic();
  if (!c) return fail("No clinic context for this user.");
  const shortcut = String(input.shortcut ?? "").trim().toLowerCase().replace(/^\./, "");
  const expansion = String(input.expansion ?? "").trim().slice(0, 500);
  if (!SHORTCUT_RE.test(shortcut))
    return fail("Shortcuts are 2–24 letters, numbers or dashes — e.g. “sn”.");
  if (!expansion) return fail("The shortcut needs its expansion text.");

  const { data: created, error } = await c.supabase
    .from("user_autotext")
    .insert({ tenant_id: c.tenantId, user_id: c.userId, shortcut, expansion })
    .select("id, shortcut, expansion")
    .single();
  if (error || !created) {
    if (error) console.error("[autotext save]", error.message);
    return fail(
      error?.code === "23505"
        ? `You already have a “.${shortcut}” shortcut — remove it first.`
        : "That didn’t save — try again.",
    );
  }
  return { ok: true, data: created };
}

export async function deleteMyShortcut(id: string): Promise<ActionResult> {
  const c = await requireClinic();
  if (!c) return fail("No clinic context for this user.");
  const { data: removed, error } = await c.supabase
    .from("user_autotext")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", c.userId)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();
  if (error || !removed) {
    if (error) console.error("[autotext delete]", error.message);
    return fail(error ? "That didn’t save — try again." : "That shortcut was already removed.");
  }
  return { ok: true };
}
