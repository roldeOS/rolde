"use client";

import { useRef, useState } from "react";
import { Camera, Plus, X, Loader2 } from "lucide-react";
import { AnchoredPopover } from "@/components/ui/AnchoredPopover";
import { Segmented } from "@/components/ui/Segmented";
import { CARD_ICON_TEXT } from "@/lib/cardTones";
import { shrinkImage } from "@/lib/imageShrink";
import {
  uploadPatientPhoto,
  removePatientPhoto,
  type PatientPhoto,
} from "@/app/(app)/patients/photoActions";
import { cn } from "@/lib/utils";

// Step A default protocol (Caretaker-editable in Step B). A 5-view facial sweep.
const DEFAULT_VIEWS = ["Front", "Left 45", "Left", "Right 45", "Right"];

/**
 * PhotoCaptureButton (Photo M2, Roland 2026-07-22) — a camera chip in the
 * Scribe header (beside Templates). It STAGES photos for the note being
 * written: each is shrunk client-side, uploaded (unattached), and shown in the
 * popover; on Save the workspace attaches them to the new Clinical Note, and
 * they render in that note's tile. Camera on iPad, file upload on desktop.
 */
export function PhotoCaptureButton({
  patientId,
  staged,
  onStage,
  onUnstage,
  showLabel,
}: {
  patientId: string;
  staged: PatientPhoto[];
  onStage: (p: PatientPhoto) => void;
  onUnstage: (id: string) => void;
  showLabel: boolean;
}) {
  const [btn, setBtn] = useState<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<"before" | "after" | "other">("before");
  // Multi-angle Step A — the view/angle this shot is (before/after pair BY view).
  // Default set for now; the per-clinic protocol editor (Caretaker) is Step B.
  const [view, setView] = useState("");
  const [busy, setBusy] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
        fd.append("view", view.trim());
        fd.append("master", master, "master.jpg");
        fd.append("thumb", thumb, "thumb.jpg");
        fd.append("width", String(width));
        fd.append("height", String(height));
        const r = await uploadPatientPhoto(fd);
        if (r.ok) onStage(r.photo);
        else setError(r.error);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn’t add that photo.");
      } finally {
        setBusy((n) => n - 1);
      }
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  function unstage(p: PatientPhoto) {
    onUnstage(p.id);
    void removePatientPhoto(p.id, patientId);
  }

  const beforeN = staged.filter((p) => p.phase === "before").length;
  const afterN = staged.filter((p) => p.phase === "after").length;

  return (
    <>
      <button
        ref={setBtn}
        onClick={() => setOpen((v) => !v)}
        aria-label="Photos"
        className="group/tip relative order-2 flex h-7 items-center gap-1 rounded-lg bg-card px-2 text-xs font-medium text-muted-foreground shadow-sm ring-1 ring-black/[0.05] transition-shadow hover:text-foreground hover:shadow"
      >
        <Camera className={cn("size-3.5", CARD_ICON_TEXT.sky)} />
        {showLabel ? (
          <span>Photos{staged.length ? ` · ${staged.length}` : ""}</span>
        ) : (
          staged.length > 0 && (
            <span className="rounded-full bg-sky/50 px-1 text-[10px] font-semibold text-sky-900">
              {staged.length}
            </span>
          )
        )}
        {!showLabel && (
          <span
            role="tooltip"
            className="pointer-events-none absolute top-[calc(100%+7px)] left-1/2 z-50 -translate-x-1/2 rounded-md bg-foreground px-2 py-1 text-[11px] font-medium whitespace-nowrap text-background opacity-0 shadow-md transition-opacity duration-100 group-hover/tip:opacity-100"
          >
            Photos
          </span>
        )}
      </button>
      <AnchoredPopover
        anchor={btn}
        open={open}
        onClose={() => setOpen(false)}
        width={280}
        icon={Camera}
        title="Photos"
        subtitle="They attach to this note when you save"
        tone="sky"
        className="space-y-2 p-2"
      >
        <Segmented
          options={[
            { value: "before", label: beforeN ? `Before (${beforeN})` : "Before" },
            { value: "after", label: afterN ? `After (${afterN})` : "After" },
            { value: "other", label: "Other" },
          ]}
          value={phase}
          onChange={(v) => setPhase(v as "before" | "after" | "other")}
          className="w-full"
        />
        {/* Multi-angle Step A — tag the view/angle so Before/After pair by view. */}
        <div className="space-y-1">
          <input
            value={view}
            onChange={(e) => setView(e.target.value.slice(0, 40))}
            placeholder="View / angle — optional (e.g. Front)"
            className="w-full rounded-md border border-border bg-card px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-sky-400"
          />
          <div className="flex flex-wrap gap-1">
            {DEFAULT_VIEWS.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView((cur) => (cur === v ? "" : v))}
                className={cn(
                  "rounded-md px-1.5 py-0.5 text-[10px] font-medium transition-colors",
                  view === v
                    ? "bg-sky/40 text-sky-900"
                    : "bg-muted text-muted-foreground hover:text-foreground",
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => onFiles(e.target.files)}
        />
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex size-14 shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg border border-dashed border-border text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
          >
            {busy > 0 ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            <span className="text-[10px]">Add</span>
          </button>
          {staged.map((p) => (
            <div key={p.id} className="group relative size-14">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.thumbUrl} alt="Staged photo" className="size-14 rounded-lg object-cover" />
              <span className="absolute top-0.5 left-0.5 rounded bg-foreground/70 px-1 text-[8px] font-semibold text-background capitalize">
                {p.phase}
              </span>
              {p.view && (
                <span className="absolute right-0.5 bottom-0.5 max-w-[52px] truncate rounded bg-sky-600/85 px-1 text-[8px] font-semibold text-white">
                  {p.view}
                </span>
              )}
              <button
                type="button"
                onClick={() => unstage(p)}
                title="Remove"
                className="absolute -top-1.5 -right-1.5 hidden size-4 items-center justify-center rounded-full bg-foreground text-background group-hover:flex"
              >
                <X className="size-2.5" />
              </button>
            </div>
          ))}
        </div>
        {error && <p className="text-xs text-critical">{error}</p>}
        <p className="text-[11px] text-muted-foreground">
          Tag each Before or After, then Save the note — the photos land in the record with it.
        </p>
      </AnchoredPopover>
    </>
  );
}
