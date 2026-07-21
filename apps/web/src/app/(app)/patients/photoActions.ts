"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

/**
 * Photo tool, Milestone 1 (Roland 2026-07-22) — the server side of patient
 * photos. The bytes are shrunk to WebP CLIENT-side before they ever reach us
 * (fast, tiny, keeps the DB + this action well under its body limit); here we
 * only validate, store in the private bucket via the caller's own session
 * (storage RLS tenant-scopes it), record the metadata row, and audit. Images
 * are served exclusively through short-lived SIGNED URLs — the bucket is
 * private, so nothing is ever world-readable.
 */
export type PatientPhoto = {
  id: string;
  phase: string;
  caption: string | null;
  thumbUrl: string;
  url: string;
  createdAt: string;
};

const MAX_MASTER_BYTES = 2_000_000; // the client sends a few hundred KB; this is headroom
const SIGN_TTL = 3600; // 1 hour

export async function listPatientPhotos(
  patientId: string,
): Promise<{ ok: true; data: PatientPhoto[] } | { ok: false; error: string }> {
  if (!patientId) return { ok: false, error: "No patient." };
  const ctx = await getSessionContext();
  if (!ctx?.membership?.tenant_id) return { ok: false, error: "No clinic context." };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("patient_photo")
    .select("id, phase, caption, storage_path, thumb_path, created_at")
    .eq("patient_id", patientId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) return { ok: false, error: error.message };
  const out: PatientPhoto[] = [];
  for (const r of data ?? []) {
    const [{ data: t }, { data: m }] = await Promise.all([
      supabase.storage.from("patient-photos").createSignedUrl(r.thumb_path, SIGN_TTL),
      supabase.storage.from("patient-photos").createSignedUrl(r.storage_path, SIGN_TTL),
    ]);
    out.push({
      id: r.id,
      phase: r.phase,
      caption: r.caption,
      thumbUrl: t?.signedUrl ?? "",
      url: m?.signedUrl ?? "",
      createdAt: r.created_at,
    });
  }
  return { ok: true, data: out };
}

export async function uploadPatientPhoto(
  formData: FormData,
): Promise<{ ok: true; photo: PatientPhoto } | { ok: false; error: string }> {
  const patientId = String(formData.get("patient_id") ?? "");
  const phaseRaw = String(formData.get("phase") ?? "other");
  const phase = phaseRaw === "before" || phaseRaw === "after" ? phaseRaw : "other";
  const master = formData.get("master");
  const thumb = formData.get("thumb");
  const width = Number(formData.get("width")) || null;
  const height = Number(formData.get("height")) || null;

  if (!patientId || !(master instanceof File) || !(thumb instanceof File))
    return { ok: false, error: "That didn’t upload — please try again." };
  // The client always converts to JPEG (universal canvas encoding); anything
  // else is refused at the door.
  if (master.type !== "image/jpeg" || thumb.type !== "image/jpeg")
    return { ok: false, error: "That image couldn’t be read — try a JPEG or PNG." };
  if (master.size > MAX_MASTER_BYTES || master.size === 0)
    return { ok: false, error: "That image is too large — please try again." };

  const ctx = await getSessionContext();
  const tenantId = ctx?.membership?.tenant_id;
  const userId = ctx?.user.id;
  if (!tenantId) return { ok: false, error: "No clinic context for this user." };

  const supabase = await createClient();
  // The patient must be visible to the caller (RLS also enforces; this is a
  // clean error rather than a silent storage-orphan).
  const { data: p } = await supabase.from("patients").select("id").eq("id", patientId).maybeSingle();
  if (!p) return { ok: false, error: "Patient not found in your clinic." };

  const uid = crypto.randomUUID();
  const base = `${tenantId}/${patientId}/${uid}`;
  const masterPath = `${base}.jpg`;
  const thumbPath = `${base}.thumb.jpg`;
  const mBuf = new Uint8Array(await master.arrayBuffer());
  const tBuf = new Uint8Array(await thumb.arrayBuffer());

  const up1 = await supabase.storage
    .from("patient-photos")
    .upload(masterPath, mBuf, { contentType: "image/jpeg", upsert: false });
  if (up1.error) return { ok: false, error: up1.error.message };
  const up2 = await supabase.storage
    .from("patient-photos")
    .upload(thumbPath, tBuf, { contentType: "image/jpeg", upsert: false });
  if (up2.error) {
    await supabase.storage.from("patient-photos").remove([masterPath]);
    return { ok: false, error: up2.error.message };
  }

  const { data: row, error } = await supabase
    .from("patient_photo")
    .insert({
      tenant_id: tenantId,
      patient_id: patientId,
      storage_path: masterPath,
      thumb_path: thumbPath,
      width,
      height,
      bytes: master.size,
      mime: "image/jpeg",
      phase,
      created_by: userId ?? null,
    })
    .select("id, phase, caption, created_at")
    .single();
  if (error || !row) {
    // Never leave orphaned bytes if the record didn't land.
    await supabase.storage.from("patient-photos").remove([masterPath, thumbPath]);
    return { ok: false, error: error?.message ?? "That didn’t save — please try again." };
  }

  await logAudit({
    tenantId,
    actorUserId: userId,
    action: "photo.add",
    resourceType: "patient",
    resourceId: patientId,
    summary: `Added a ${phase} photo`,
  });

  const [{ data: t }, { data: m }] = await Promise.all([
    supabase.storage.from("patient-photos").createSignedUrl(thumbPath, SIGN_TTL),
    supabase.storage.from("patient-photos").createSignedUrl(masterPath, SIGN_TTL),
  ]);
  revalidatePath(`/patients/${patientId}`);
  return {
    ok: true,
    photo: {
      id: row.id,
      phase: row.phase,
      caption: row.caption,
      thumbUrl: t?.signedUrl ?? "",
      url: m?.signedUrl ?? "",
      createdAt: row.created_at,
    },
  };
}

/** Attach staged photos (feed_entry_id null) to the note that was just saved —
 *  they become part of that Clinical Note (Roland 2026-07-22). */
export async function attachPhotosToEntry(
  photoIds: string[],
  entryId: string,
  patientId: string,
): Promise<{ ok: boolean }> {
  if (!photoIds.length) return { ok: true };
  const ctx = await getSessionContext();
  if (!ctx?.membership?.tenant_id) return { ok: false };
  const supabase = await createClient();
  const { error } = await supabase
    .from("patient_photo")
    .update({ feed_entry_id: entryId })
    .in("id", photoIds)
    .is("feed_entry_id", null);
  if (error) return { ok: false };
  revalidatePath(`/patients/${patientId}`);
  return { ok: true };
}

/** Bulk soft-delete (used when a draft with staged photos is discarded). */
export async function discardStagedPhotos(
  photoIds: string[],
  patientId: string,
): Promise<{ ok: boolean }> {
  if (!photoIds.length) return { ok: true };
  const ctx = await getSessionContext();
  if (!ctx?.membership?.tenant_id) return { ok: false };
  const supabase = await createClient();
  await supabase
    .from("patient_photo")
    .update({ deleted_at: new Date().toISOString() })
    .in("id", photoIds)
    .is("feed_entry_id", null);
  revalidatePath(`/patients/${patientId}`);
  return { ok: true };
}

export async function removePatientPhoto(
  id: string,
  patientId: string,
): Promise<{ ok: boolean; error?: string }> {
  const ctx = await getSessionContext();
  const tenantId = ctx?.membership?.tenant_id;
  if (!tenantId) return { ok: false, error: "No clinic context." };
  const supabase = await createClient();
  // Soft-delete only — a clinical image is never hard-erased (records law).
  const { error } = await supabase
    .from("patient_photo")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  await logAudit({
    tenantId,
    actorUserId: ctx.user.id,
    action: "photo.remove",
    resourceType: "patient",
    resourceId: patientId,
    summary: "Removed a photo",
  });
  revalidatePath(`/patients/${patientId}`);
  return { ok: true };
}
