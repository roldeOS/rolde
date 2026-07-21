import { toSegments, highlightBg, type NoteMark } from "@/lib/richText";

/**
 * InlineText (B6) — renders a run of plain text with its sidecar formatting
 * marks: bold · italic · underline · strikethrough · highlight (in its chosen
 * Earth & Bloom colour). No marks → the bare string, so callers pay nothing
 * when a note is unformatted.
 */
export function InlineText({ text, marks }: { text: string; marks?: NoteMark[] }) {
  if (!marks || marks.length === 0) return <>{text}</>;
  const segs = toSegments(text, marks);
  return (
    <>
      {segs.map((s, i) => {
        let node: React.ReactNode = s.text;
        if (s.b) node = <strong className="font-semibold">{node}</strong>;
        if (s.i) node = <em>{node}</em>;
        if (s.u) node = <u>{node}</u>;
        if (s.s) node = <s>{node}</s>;
        if (s.h)
          node = (
            <mark
              className="rounded-[3px] px-0.5 text-inherit"
              style={{ backgroundColor: highlightBg(s.hc) }}
            >
              {node}
            </mark>
          );
        return <span key={i}>{node}</span>;
      })}
    </>
  );
}
