"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionContext } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { sendTemplatedEmail } from "@/lib/email";
import { emailOk } from "@/lib/validation";
import { LETTER_TITLES } from "@/lib/letters";

/**
 * RolDe Courier C3 — SENDING (Roland "Go for courier 3", 2026-07-04). A letter
 * leaves the clinic as a dispatch: an elegant RolDe-shell email carrying a
 * secure capability link, never the letter itself (PHI-minimal envelope — the
 * clinical content stays behind the token viewer, which doubles as the honest
 * "Opened" signal). The journey (queued → sent → opened / failed) is written
 * three ways, each for its reader: courier_dispatch_events for the record,
 * payload.status for the tile's Status Dot + Trail, the Activity Log for
 * governance. Gates honour the clinic's C2 Courier settings: delegated
 * sending, countersign, quiet hours (patients only — their evenings are
 * protected; a GP practice inbox is not asleep).
 */
export type ActionResult = { ok: true } | { ok: false; error: string };
const fail = (error: string): { ok: false; error: string } => ({ ok: false, error });

const TOKEN_DAYS = 30;

/** Countersign = a doctor-grade sender presses Send (DCB0129 thinking: the
 *  clinical sign-off is the SEND, so the sender must be able to give it). */
const SENIOR_SENDERS = ["caretaker", "curator", "clinician", "locum", "practitioner"];

/** Clinic-local clock for quiet hours — primary timezone per supported country. */
const COUNTRY_TZ: Record<string, string> = {
  GB: "Europe/London",
  IE: "Europe/Dublin",
  US: "America/New_York",
  CA: "America/Toronto",
  AU: "Australia/Sydney",
  NZ: "Pacific/Auckland",
};

const SETTINGS_DEFAULTS = {
  secure_link_default: true,
  typo_guard: true,
  countersign_required: false,
  delegated_sending: true,
  quiet_hours_enabled: false,
  quiet_start: "20:00",
  quiet_end: "08:00",
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

const siteUrl = () =>
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

/** Is the clinic's local wall-clock inside the quiet window? Handles windows
 *  that span midnight (20:00 → 08:00). */
function inQuietHours(country: string, start: string, end: string): boolean {
  const tz = COUNTRY_TZ[country] ?? "UTC";
  const now = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
  if (!/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end) || start === end) return false;
  return start < end ? now >= start && now < end : now >= start || now < end;
}

export type CourierRecipientInput = {
  kind: "gp" | "address_book" | "patient" | "custom";
  name: string;
  email: string;
  careProviderId?: string;
  addressBookId?: string;
};

export type CourierSendContext = {
  title: string;
  settings: { typo_guard: boolean; countersign_required: boolean };
  gp: { careProviderId: string; name: string; organisation: string | null; email: string | null } | null;
  patient: { name: string; email: string | null };
  addressBook: { id: string; kind: string; name: string; email: string }[];
  dispatches: { recipientName: string; status: string; sentAt: string | null }[];
};

/** Everything the Send sheet needs when it opens — recipients on file for THIS
 *  patient, the clinic's Courier settings, and the letter's send history. */
export async function getCourierSendContext(
  entryId: string,
): Promise<{ ok: true; data: CourierSendContext } | { ok: false; error: string }> {
  const c = await requireClinic();
  if (!c) return fail("No clinic context for this user.");

  const { data: entry } = await c.supabase
    .from("patient_feed_entries")
    .select("id, patient_id, entry_type")
    .eq("id", entryId)
    .is("deleted_at", null)
    .maybeSingle();
  const title = entry ? LETTER_TITLES[entry.entry_type] : undefined;
  if (!entry || !title) return fail("That letter wasn’t found.");

  const [{ data: settings }, { data: gp }, { data: patient }, { data: book }, { data: sent }] =
    await Promise.all([
      c.supabase
        .from("clinic_courier_settings")
        .select("typo_guard, countersign_required")
        .eq("tenant_id", c.tenantId)
        .maybeSingle(),
      c.supabase
        .from("patient_care_providers")
        .select("id, name, organisation, email")
        .eq("patient_id", entry.patient_id)
        .eq("is_gp", true)
        .is("deleted_at", null)
        .maybeSingle(),
      c.supabase
        .from("patients")
        .select("first_name, last_name, email")
        .eq("id", entry.patient_id)
        .maybeSingle(),
      c.supabase
        .from("clinic_address_book")
        .select("id, kind, name, email")
        .eq("tenant_id", c.tenantId)
        .is("deleted_at", null)
        .not("email", "is", null)
        .order("kind")
        .order("name"),
      c.supabase
        .from("courier_dispatches")
        .select("recipient_name, status, sent_at")
        .eq("entry_id", entryId)
        .order("created_at", { ascending: false }),
    ]);
  if (!patient) return fail("That patient wasn’t found.");

  return {
    ok: true,
    data: {
      title,
      settings: {
        typo_guard: settings?.typo_guard ?? SETTINGS_DEFAULTS.typo_guard,
        countersign_required:
          settings?.countersign_required ?? SETTINGS_DEFAULTS.countersign_required,
      },
      gp: gp
        ? { careProviderId: gp.id, name: gp.name, organisation: gp.organisation, email: gp.email }
        : null,
      patient: {
        name: `${patient.first_name} ${patient.last_name}`.trim(),
        email: patient.email,
      },
      addressBook: (book ?? []).flatMap((b) =>
        b.email ? [{ id: b.id, kind: b.kind, name: b.name, email: b.email }] : [],
      ),
      dispatches: (sent ?? []).map((d) => ({
        recipientName: d.recipient_name,
        status: d.status,
        sentAt: d.sent_at,
      })),
    },
  };
}

export async function sendLetter(
  entryId: string,
  recipient: CourierRecipientInput,
): Promise<ActionResult> {
  const c = await requireClinic();
  if (!c) return fail("No clinic context for this user.");

  const name = recipient.name.trim();
  const email = recipient.email.trim();
  if (!name) return fail("The recipient needs a name.");
  if (!emailOk(email)) return fail("That email doesn’t look right.");

  // The letter, through the caller's session (RLS re-checks the clinic).
  const { data: entry } = await c.supabase
    .from("patient_feed_entries")
    .select("id, tenant_id, patient_id, entry_type, payload, created_by")
    .eq("id", entryId)
    .is("deleted_at", null)
    .maybeSingle();
  const title = entry ? LETTER_TITLES[entry.entry_type] : undefined;
  if (!entry || !title) return fail("That letter wasn’t found.");

  const [{ data: settingsRow }, { data: tenant }, { data: sender }] = await Promise.all([
    c.supabase
      .from("clinic_courier_settings")
      .select(
        "countersign_required, delegated_sending, quiet_hours_enabled, quiet_start, quiet_end",
      )
      .eq("tenant_id", c.tenantId)
      .maybeSingle(),
    c.supabase.from("tenants").select("name, country").eq("id", c.tenantId).maybeSingle(),
    c.supabase
      .from("tenant_users")
      .select("display_name, designation")
      .eq("tenant_id", c.tenantId)
      .eq("user_id", c.userId)
      .maybeSingle(),
  ]);
  const settings = { ...SETTINGS_DEFAULTS, ...(settingsRow ?? {}) };

  // ── The C2 gates, in the order a clinic would explain them ──────────────
  if (!settings.delegated_sending && entry.created_by !== c.userId) {
    return fail("Delegated Sending is off for this clinic — only the letter’s author can send it.");
  }
  if (settings.countersign_required && !SENIOR_SENDERS.includes(c.role)) {
    return fail(
      "This clinic requires a countersign — a clinician (or the Caretaker) has to press Send.",
    );
  }
  if (
    recipient.kind === "patient" &&
    settings.quiet_hours_enabled &&
    inQuietHours(tenant?.country ?? "GB", settings.quiet_start, settings.quiet_end)
  ) {
    return fail(
      `Quiet Hours are on (${settings.quiet_start}–${settings.quiet_end}) — patient emails wait until morning.`,
    );
  }

  // ── The dispatch — created first, so even a failed send is a record ─────
  const token = crypto.randomBytes(32).toString("base64url");
  const { data: dispatch, error: dispatchErr } = await c.supabase
    .from("courier_dispatches")
    .insert({
      tenant_id: c.tenantId,
      entry_id: entry.id,
      patient_id: entry.patient_id,
      recipient_kind: recipient.kind,
      recipient_name: name,
      recipient_email: email,
      care_provider_id: recipient.careProviderId ?? null,
      address_book_id: recipient.addressBookId ?? null,
      channel: "secure_link",
      status: "queued",
      view_token: token,
      token_expires_at: new Date(Date.now() + TOKEN_DAYS * 86400_000).toISOString(),
      sent_by: c.userId,
    })
    .select("id")
    .single();
  if (dispatchErr || !dispatch) {
    if (dispatchErr) console.error("[courier send] dispatch", dispatchErr.message);
    return fail("That didn’t save — try again.");
  }
  await c.supabase.from("courier_dispatch_events").insert({
    dispatch_id: dispatch.id,
    tenant_id: c.tenantId,
    event: "queued",
    meta: { recipient_kind: recipient.kind },
  });

  // ── The envelope — clinic template if the clinic dressed its own Courier,
  //    else the platform one (the lookup is exact-scope, so we choose here) ──
  const admin = createAdminClient();
  const { data: clinicTpl } = await admin
    .from("email_templates")
    .select("id")
    .eq("slug", "courier-letter")
    .eq("tenant_id", c.tenantId)
    .eq("is_active", true)
    .maybeSingle();

  const clinicName = tenant?.name ?? "your clinic";
  const dn = sender?.display_name?.trim() ?? "";
  const desig = sender?.designation?.trim() ?? "";
  const senderName =
    (desig && dn && !dn.toLowerCase().startsWith(desig.toLowerCase()) ? `${desig} ${dn}` : dn) ||
    "The clinical team";
  const senderLine = `${senderName} at ${clinicName} has sent you a ${title.toLowerCase()} to read securely.`;

  const finish = async (
    patch: Record<string, string>,
    event: string,
    meta?: Record<string, string>,
  ) => {
    await c.supabase
      .from("courier_dispatches")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", dispatch.id);
    await c.supabase.from("courier_dispatch_events").insert({
      dispatch_id: dispatch.id,
      tenant_id: c.tenantId,
      event,
      meta: meta ?? null,
    });
  };
  const setTileStatus = async (status: string) => {
    const payload = { ...((entry.payload as Record<string, unknown> | null) ?? {}), status };
    await c.supabase.from("patient_feed_entries").update({ payload }).eq("id", entry.id);
  };

  try {
    await sendTemplatedEmail({
      slug: "courier-letter",
      to: email,
      toName: name,
      tenantId: clinicTpl ? c.tenantId : null,
      variables: {
        clinic_name: clinicName,
        recipient_name: name,
        sender_line: senderLine,
        secure_link: `${siteUrl()}/courier/view/${token}`,
      },
      idempotencyKey: `courier:${dispatch.id}`,
      source: "courier.send",
    });
  } catch (e) {
    console.error("[courier send]", e instanceof Error ? e.message : e);
    await finish(
      { status: "failed", failed_reason: e instanceof Error ? e.message : "send error" },
      "failed",
    );
    await setTileStatus("Send Failed");
    revalidatePath(`/patients/${entry.patient_id}`);
    return fail("The email couldn’t be sent — Courier has marked this dispatch Failed.");
  }

  await finish({ status: "sent", sent_at: new Date().toISOString() }, "sent");
  await setTileStatus(`Sent to ${name}`);
  await logAudit({
    tenantId: c.tenantId,
    actorUserId: c.userId,
    action: "courier.send",
    resourceType: "patient",
    resourceId: entry.patient_id,
    summary: `Sent a ${title} via Courier`,
    metadata: { entry_id: entry.id, dispatch_id: dispatch.id, recipient_kind: recipient.kind },
  });
  revalidatePath(`/patients/${entry.patient_id}`);
  return { ok: true };
}
