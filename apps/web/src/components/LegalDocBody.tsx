import type { LegalVersion } from "@/lib/legal";

/**
 * Renders a legal document's body — the lead paragraph plus each Title-Cased
 * section (heading + paragraph + optional bullet list). Pure presentational, so
 * it works in BOTH the client in-app surface (`(app)/legal`) and the public
 * server-rendered `/policy/[slug]` pages from one source (`@/lib/legal`).
 */
export function LegalDocBody({ version }: { version: LegalVersion }) {
  return (
    <div className="space-y-5 text-sm leading-relaxed text-foreground/90">
      <p>{version.intro}</p>
      {version.sections.map((s, i) => (
        <section key={i} className="space-y-1.5">
          <h3 className="font-heading text-base font-semibold text-foreground">
            {s.heading}
          </h3>
          {s.body && <p>{s.body}</p>}
          {s.items && (
            <ul className="list-disc space-y-1 pl-5 text-foreground/85 marker:text-muted-foreground">
              {s.items.map((it, j) => (
                <li key={j}>{it}</li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
