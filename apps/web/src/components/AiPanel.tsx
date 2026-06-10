import { Sparkles } from "lucide-react";
import { SectionExplainer } from "@/components/ui/SectionExplainer";

/**
 * The ambient AI panel (Bible 4.7; Roland 2026-06-10 — "the silent clerk").
 * THIS IS THE SELLING POINT: RolDe surfaces gentle, proactive suggestions on
 * its own — bloods to consider, a draft ready, an interaction noted — never a
 * chatbot waiting to be asked. The suggestion STREAM is the main event; the
 * "Ask RolDe" field is deliberately small and secondary at the foot.
 *
 * Until the self-hosted model (Bible 4.7) is connected the stream is quiet and
 * says so — clinical work continues unaffected (graceful degradation, 4.1 §6.4).
 */
export function AiPanel() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="glass sticky top-0 z-10 flex shrink-0 items-center justify-between px-4 py-2.5">
        <span className="flex items-center gap-1.5">
          <Sparkles className="size-3.5 text-info" />
          {/* Inter here — NOT the serif wordmark (Roland 2026-06-10). */}
          <span className="text-sm font-semibold tracking-tight">RolDe</span>
          <span className="text-xs text-muted-foreground">says…</span>
          <SectionExplainer
            label="RolDe says…"
            description="Ambient AI — a silent clerk. It watches as you work and gently surfaces suggestions; it never interrupts, and nothing it drafts is sent without your say-so."
            terms={[
              { term: "Suggestions", definition: "Investigations to consider, a draft letter ready for review, a safety note." },
              { term: "Ask RolDe", definition: "A small box at the foot for the occasional direct question — secondary to the ambient stream." },
            ]}
          />
        </span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="size-2 rounded-full bg-border" />
          Listening soon
        </span>
      </div>

      {/* The ambient suggestion stream (the main event). */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4">
        <div className="flex h-full items-center justify-center">
          <p className="text-center text-xs text-muted-foreground">
            RolDe will quietly surface suggestions here — investigations to
            consider, a draft letter ready for review, a safety note — as you
            work. Nothing to ask; it just helps.
          </p>
        </div>
      </div>

      {/* Secondary: the ask field, deliberately understated. */}
      <div className="shrink-0 px-4 py-3">
        <input
          disabled
          placeholder="Ask RolDe…"
          className="h-8 w-full rounded-lg bg-muted/60 px-3 text-xs outline-none disabled:opacity-60"
        />
      </div>
    </div>
  );
}
