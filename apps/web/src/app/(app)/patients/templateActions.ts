"use server";

import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { sanitiseParts, type TemplatePart } from "@/lib/scribeTemplates";
import { sanitizeMarks, type NoteMark } from "@/lib/richText";
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

export type AutotextShortcut = {
  id: string;
  shortcut: string;
  expansion: string;
  expansionMarks: NoteMark[];
};

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
    .eq("is_active", true)
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

// Letter-first, 1–24 chars (Roland 2026-07-21: ".r" allowed). NEVER
// digit-leading — clinical dose notation (" .5 ml") must never expand.
const SHORTCUT_RE = /^[a-z][a-z0-9-]{0,23}$/;

export async function listMyShortcuts(): Promise<
  { ok: true; data: AutotextShortcut[] } | { ok: false; error: string }
> {
  const c = await requireClinic();
  if (!c) return fail("No clinic context for this user.");
  const { data, error } = await c.supabase
    .from("user_autotext")
    .select("id, shortcut, expansion, expansion_marks")
    .eq("user_id", c.userId)
    .eq("tenant_id", c.tenantId)
    .is("deleted_at", null)
    .order("shortcut");
  if (error) {
    console.error("[autotext list]", error.message);
    return fail("Your shortcuts couldn’t be loaded — try again.");
  }
  return {
    ok: true,
    data: (data ?? []).map((r) => ({
      id: r.id,
      shortcut: r.shortcut,
      expansion: r.expansion,
      expansionMarks: sanitizeMarks(r.expansion_marks, r.expansion.length),
    })),
  };
}

export async function saveMyShortcut(input: {
  id?: string;
  shortcut: string;
  expansion: string;
  marks?: NoteMark[];
}): Promise<{ ok: true; data: AutotextShortcut } | { ok: false; error: string }> {
  const c = await requireClinic();
  if (!c) return fail("No clinic context for this user.");
  const shortcut = String(input.shortcut ?? "").trim().toLowerCase().replace(/^\./, "");
  // Generous ceiling — a Snip can be a whole multi-paragraph standard letter,
  // not a one-liner (Roland 2026-07-23). This is a sanity guard, not a limit.
  const expansion = String(input.expansion ?? "").trim().slice(0, 20000);
  if (!SHORTCUT_RE.test(shortcut))
    return fail("Shortcuts start with a letter (1–24 letters, numbers or dashes) — e.g. “r” or “sn”.");
  if (!expansion) return fail("The shortcut needs its expansion text.");
  const marks = sanitizeMarks(input.marks ?? [], expansion.length);
  const fields = {
    shortcut,
    expansion,
    expansion_marks: marks as unknown as Json,
    updated_at: new Date().toISOString(),
  };

  // Edit an existing shortcut (own it) vs create a new one.
  const q = input.id
    ? c.supabase
        .from("user_autotext")
        .update(fields)
        .eq("id", input.id)
        .eq("user_id", c.userId)
    : c.supabase
        .from("user_autotext")
        .insert({ tenant_id: c.tenantId, user_id: c.userId, ...fields });
  const { data: created, error } = await q
    .select("id, shortcut, expansion, expansion_marks")
    .single();
  if (error || !created) {
    if (error) console.error("[autotext save]", error.message);
    return fail(
      error?.code === "23505"
        ? `You already have a “.${shortcut}” shortcut — remove it first.`
        : "That didn’t save — try again.",
    );
  }
  return {
    ok: true,
    data: {
      id: created.id,
      shortcut: created.shortcut,
      expansion: created.expansion,
      expansionMarks: sanitizeMarks(created.expansion_marks, created.expansion.length),
    },
  };
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


// ── T3 — the Caretaker's governance card (Settings → Scribe Templates) ────

export type ClinicTemplateAdmin = ClinicTemplate & {
  is_active: boolean;
  patient_facing: boolean;
};

/** The FULL library for the Settings card — retired templates included. */
export async function listClinicTemplatesAdmin(): Promise<
  { ok: true; data: ClinicTemplateAdmin[] } | { ok: false; error: string }
> {
  const c = await requireClinic();
  if (!c) return fail("No clinic context for this user.");
  const { data, error } = await c.supabase
    .from("clinic_templates")
    .select("id, name, specialty, parts, is_active, patient_facing")
    .eq("tenant_id", c.tenantId)
    .is("deleted_at", null)
    .order("name");
  if (error) {
    console.error("[templates admin list]", error.message);
    return fail("The clinic templates couldn’t be loaded — try again.");
  }
  return {
    ok: true,
    data: (data ?? []).flatMap((t) => {
      const parts = sanitiseParts(t.parts);
      return parts
        ? [{ id: t.id, name: t.name, specialty: t.specialty, parts,
             is_active: t.is_active, patient_facing: t.patient_facing }]
        : [];
    }),
  };
}

/** Activate/retire + patient-facing eligibility — Caretaker only. Retiring
 *  removes a template from the picker; history is safe (the snapshot law). */
export async function setTemplateFlags(input: {
  id: string;
  is_active?: boolean;
  patient_facing?: boolean;
}): Promise<ActionResult> {
  const c = await requireClinic();
  if (!c) return fail("No clinic context for this user.");
  if (c.role !== "caretaker")
    return fail("Clinic templates are governed by the Caretaker.");
  const patch: { is_active?: boolean; patient_facing?: boolean; updated_at: string } = {
    updated_at: new Date().toISOString(),
  };
  if (typeof input.is_active === "boolean") patch.is_active = input.is_active;
  if (typeof input.patient_facing === "boolean") patch.patient_facing = input.patient_facing;
  const { data: updated, error } = await c.supabase
    .from("clinic_templates")
    .update(patch)
    .eq("id", input.id)
    .eq("tenant_id", c.tenantId)
    .is("deleted_at", null)
    .select("id, is_active, patient_facing")
    .maybeSingle();
  if (error || !updated) {
    if (error) console.error("[template flags]", error.message);
    return fail(error ? "That didn’t save — try again." : "That template wasn’t found.");
  }
  await logAudit({
    tenantId: c.tenantId,
    actorUserId: c.userId,
    action: "template.flags",
    resourceType: "clinic_template",
    resourceId: input.id,
    summary:
      typeof input.is_active === "boolean"
        ? input.is_active
          ? "Reactivated a clinic Scribe template"
          : "Retired a clinic Scribe template"
        : input.patient_facing
          ? "Marked a template patient-facing eligible"
          : "Removed a template’s patient-facing eligibility",
  });
  return { ok: true };
}

// ── The clinic's body-map colour legend (Roland approved 2026-07-13) ──────

export type BodymapLegend = Record<string, string>;

export async function getBodymapLegend(): Promise<
  { ok: true; data: BodymapLegend } | { ok: false; error: string }
> {
  const c = await requireClinic();
  if (!c) return fail("No clinic context for this user.");
  const { data, error } = await c.supabase
    .from("clinic_bodymap_legend")
    .select("labels")
    .eq("tenant_id", c.tenantId)
    .maybeSingle();
  if (error) {
    console.error("[legend read]", error.message);
    return fail("The colour legend couldn’t be loaded — try again.");
  }
  const raw = (data?.labels ?? {}) as Record<string, unknown>;
  const out: BodymapLegend = {};
  for (const [k, v] of Object.entries(raw))
    if (typeof v === "string" && v.trim()) out[k] = v.trim().slice(0, 40);
  return { ok: true, data: out };
}

/** The Caretaker names the clinic's colours — the names print on the record. */
export async function saveBodymapLegend(labels: BodymapLegend): Promise<ActionResult> {
  const c = await requireClinic();
  if (!c) return fail("No clinic context for this user.");
  if (c.role !== "caretaker")
    return fail("The colour legend is governed by the Caretaker.");
  const TONES = ["coral", "amber", "sage", "lavender", "sky"];
  const clean: BodymapLegend = {};
  for (const t of TONES) {
    const v = String(labels?.[t] ?? "").trim().slice(0, 40);
    if (v) clean[t] = v;
  }
  const { error } = await c.supabase
    .from("clinic_bodymap_legend")
    .upsert({ tenant_id: c.tenantId, labels: clean, updated_at: new Date().toISOString() });
  if (error) {
    console.error("[legend save]", error.message);
    return fail("That didn’t save — try again.");
  }
  await logAudit({
    tenantId: c.tenantId,
    actorUserId: c.userId,
    action: "template.legend",
    resourceType: "clinic_template",
    summary: "Updated the body-map colour legend",
  });
  return { ok: true };
}
