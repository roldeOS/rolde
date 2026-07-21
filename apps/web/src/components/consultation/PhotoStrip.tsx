"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { Segmented } from "@/components/ui/Segmented";
import { shrinkImage } from "@/lib/imageShrink";
import {
  listPatientPhotos,
  uploadPatientPhoto,
  removePatientPhoto,
  type PatientPhoto,
} from "@/app/(app)/patients/photoActions";
import { cn } from "@/lib/utils";

/**
 * PhotoStrip (Photo tool M1, Roland 2026-07-22) — capture + a square-thumbnail
 * strip inside the consult. "+ Add" opens the camera (on an iPad) or a file
 * picker (for DSLR shots); each photo is shrunk to WebP client-side, uploaded
 * to the private store, and shown as a uniform square tile with a before/after
 * tag. Tap a tile to view the full image. The gallery + before/after compare
 * come in Milestone 2.
 */
const PHASE_TINT: Record<string, string> = {
  before: "bg-sky/80 text-sky-900",
  after: "bg-bloom text-emerald-900",
  other: "bg-muted text-muted-foreground",
};

export function PhotoStrip({ patientId }: { patientId: string }) {
  const [photos, setPhotos] = useState<PatientPhoto[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [phase, setPhase] = useState<"before" | "after" | "other">("before");
  const [busy, setBusy] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<PatientPhoto | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    let live = true;
    void listPatientPhotos(patientId).then((r) => {
      if (!live) return;
      if (r.ok) setPhotos(r.data);
      setLoaded(true);
    });
    return () => {
      live = false;
    };
  }, [patientId]);

  async function onFiles(files: FileList | null) {
    if (!files || !files.length) return;
    setError(null);
    for (const file of Array.from(files)) {
      setBusy((n) => n + 1);
      try {
        const { master, thumb, width, height } = await shrinkImage(file);
        const fd = new FormData();
        fd.append("patient_id", patientId);
        fd.append("phase", phase);
        fd.append("master", master, "master.jpg");
        fd.append("thumb", thumb, "thumb.jpg");
        fd.append("width", String(width));
        fd.append("height", String(height));
        const r = await uploadPatientPhoto(fd);
        if (r.ok) setPhotos((p) => [r.photo, ...p]);
        else setError(r.error);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn’t add that photo.");
      } finally {
        setBusy((n) => n - 1);
      }
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  function remove(ph: PatientPhoto) {
    setPhotos((p) => p.filter((x) => x.id !== ph.id));
    startTransition(async () => {
      await removePatientPhoto(ph.id, patientId);
    });
  }

  return (
    <div className="mb-2 shrink-0">
      <div className="mb-1 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Photos</p>
        <Segmented
          options={[
            { value: "before", label: "Before" },
            { value: "after", label: "After" },
            { value: "other", label: "Other" },
          ]}
          value={phase}
          onChange={(v) => setPhase(v as "before" | "after" | "other")}
          className="w-44"
        />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => onFiles(e.target.files)}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex size-16 shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg border border-dashed border-border text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
        >
          {busy > 0 ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          <span className="text-[10px]">Add</span>
        </button>
        {photos.map((ph) => (
          <div key={ph.id} className="group relative size-16 shrink-0">
            <button
              type="button"
              onClick={() => setLightbox(ph)}
              className="block size-16 overflow-hidden rounded-lg bg-muted"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ph.thumbUrl} alt="Patient photo" className="size-full object-cover" />
            </button>
            <span
              className={cn(
                "pointer-events-none absolute top-1 left-1 rounded px-1 text-[9px] font-semibold capitalize",
                PHASE_TINT[ph.phase] ?? PHASE_TINT.other,
              )}
            >
              {ph.phase}
            </span>
            <button
              type="button"
              onClick={() => remove(ph)}
              title="Remove"
              className="absolute -top-1.5 -right-1.5 hidden size-5 items-center justify-center rounded-full bg-foreground text-background shadow group-hover:flex"
            >
              <X className="size-3" />
            </button>
          </div>
        ))}
        {loaded && photos.length === 0 && busy === 0 && (
          <p className="flex items-center text-xs text-muted-foreground">
            Add before and after photos — they shrink automatically and stay in the record.
          </p>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-critical">{error}</p>}
      {lightbox && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-foreground/70 p-6"
          onClick={() => setLightbox(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox.url}
            alt="Patient photo"
            className="max-h-full max-w-full rounded-lg shadow-overlay"
          />
        </div>
      )}
    </div>
  );
}
