import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";

/**
 * AuditPdf — the URDS PDF Kit's audit-grade document (Wave C; URDS §9.5).
 *
 * Rendered server-side (sharp rasterises the clinic SVG logo → PNG first). Every
 * page carries the branded header (RolDe OS wordmark + clinic name · the clinic's
 * own logo top-RIGHT · document title + scope) and the audit footer (Confidential ·
 * clinic · exported by <name> (role) · date+time+tz · export reference · Page X/Y).
 * Built as React components so it's the natural PDF arm of the URDS — mindate ports it.
 */

export interface AuditColumn {
  key: string;
  header: string;
  align?: "left" | "right";
  /** Relative width weight (default 1). */
  w?: number;
}

export interface AuditPdfData {
  title: string;
  scope?: string;
  columns: AuditColumn[];
  rows: Record<string, string>[];
  orientation?: "portrait" | "landscape";
  brand: {
    product: string;
    clinic?: string;
    /** The RolDe OS wordmark (rasterised SVG) — the product brand, top-left. */
    wordmarkPng?: string | null;
    /** The clinic's own logo (rasterised SVG) — top-right. */
    logoPng?: string | null;
    exporterName?: string;
    exporterRole?: string;
  };
  reference: string;
  fingerprint: string;
  generatedAt: string;
}

const C = {
  ink: "#18181b",
  muted: "#71717a",
  faint: "#8c8c91",
  parchment: "#f0efeb",
  gold: "#d4a843",
  border: "#e4e2dc",
  line: "#ececec",
  alt: "#faf9f7",
};

const styles = StyleSheet.create({
  page: { paddingTop: 72, paddingBottom: 54, paddingHorizontal: 32, fontSize: 7, color: C.ink, fontFamily: "Helvetica" },
  // ── Header band (fixed, every page) — wordmark left · title CENTRED · logo right,
  //    all on one slim band to save vertical space (Roland 2026-06-21). ──
  header: { position: "absolute", top: 0, left: 0, right: 0, height: 58, backgroundColor: C.parchment, paddingHorizontal: 32, paddingTop: 10 },
  headRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headLeft: { flexGrow: 1, flexBasis: 0, alignItems: "flex-start" },
  headCenter: { flexGrow: 1.4, flexBasis: 0, alignItems: "center" },
  headRight: { flexGrow: 1, flexBasis: 0, alignItems: "flex-end" },
  wordmark: { fontSize: 13, fontFamily: "Helvetica-Bold", color: C.ink },
  wordmarkImg: { height: 17, maxWidth: 160, objectFit: "contain" },
  clinicName: { fontSize: 8.5, color: C.muted, marginTop: 3 },
  logo: { maxHeight: 30, maxWidth: 150, objectFit: "contain" },
  title: { fontSize: 12, fontFamily: "Helvetica-Bold", color: C.ink, textAlign: "center" },
  scope: { fontSize: 7.5, color: C.muted, marginTop: 2, textAlign: "center" },
  goldRule: { position: "absolute", left: 32, right: 32, top: 56, height: 1.4, backgroundColor: C.gold },
  // ── Table ──
  theadRow: { flexDirection: "row", backgroundColor: C.parchment, borderBottomWidth: 1, borderBottomColor: C.gold },
  th: { fontSize: 7.2, fontFamily: "Helvetica-Bold", color: C.ink, paddingVertical: 5, paddingHorizontal: 5 },
  tr: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: C.line },
  trAlt: { backgroundColor: C.alt },
  td: { fontSize: 7, color: "#27272a", paddingVertical: 4.5, paddingHorizontal: 5 },
  // ── Footer (fixed, every page) ──
  footer: { position: "absolute", bottom: 22, left: 32, right: 32 },
  footRule: { borderTopWidth: 0.5, borderTopColor: C.border, marginBottom: 6 },
  footRow: { flexDirection: "row", justifyContent: "space-between" },
  footText: { fontSize: 6.8, color: C.faint },
});

function cellStyle(col: AuditColumn) {
  return { flexGrow: col.w ?? 1, flexBasis: 0, textAlign: (col.align ?? "left") as "left" | "right" };
}

export function AuditPdf(data: AuditPdfData) {
  const { title, scope, columns, rows, orientation = "landscape", brand, reference, fingerprint, generatedAt } = data;
  const stamp = brand.exporterName
    ? `Exported by ${brand.exporterName}${brand.exporterRole ? ` (${brand.exporterRole})` : ""} · ${generatedAt}`
    : `Exported ${generatedAt}`;

  return (
    <Document
      title={title}
      author={brand.exporterName || brand.product}
      subject={`${title}${brand.clinic ? ` — ${brand.clinic}` : ""} · ${reference}`}
      creator={brand.product}
      producer={`${brand.product} · URDS PDF Kit`}
    >
      <Page size="A4" orientation={orientation} style={styles.page} wrap>
        {/* Header band — wordmark left · title CENTRED · logo right; repeats every page */}
        <View style={styles.header} fixed>
          <View style={styles.headRow}>
            <View style={styles.headLeft}>
              {brand.wordmarkPng ? (
                <Image style={styles.wordmarkImg} src={brand.wordmarkPng} />
              ) : (
                <Text style={styles.wordmark}>{brand.product}</Text>
              )}
              {brand.clinic ? <Text style={styles.clinicName}>{brand.clinic}</Text> : null}
            </View>
            <View style={styles.headCenter}>
              <Text style={styles.title}>{title}</Text>
              {scope ? <Text style={styles.scope}>{scope}</Text> : null}
            </View>
            <View style={styles.headRight}>
              {brand.logoPng ? <Image style={styles.logo} src={brand.logoPng} /> : null}
            </View>
          </View>
        </View>
        <View style={styles.goldRule} fixed />

        {/* Table header — repeats on every page */}
        <View style={styles.theadRow} fixed>
          {columns.map((c) => (
            <Text key={c.key} style={[styles.th, cellStyle(c)]}>
              {c.header}
            </Text>
          ))}
        </View>

        {/* Rows */}
        {rows.map((row, i) => (
          <View key={i} style={[styles.tr, i % 2 === 1 ? styles.trAlt : {}]} wrap={false}>
            {columns.map((c) => (
              <Text key={c.key} style={[styles.td, cellStyle(c)]}>
                {row[c.key] ?? ""}
              </Text>
            ))}
          </View>
        ))}

        {/* Footer — audit provenance, repeats on every page */}
        <View style={styles.footer} fixed>
          <View style={styles.footRule} />
          <View style={styles.footRow}>
            <Text style={styles.footText}>
              Confidential · {brand.clinic || brand.product} · Ref {reference}
            </Text>
            <Text style={styles.footText}>{stamp}</Text>
            <Text style={styles.footText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
          </View>
          <Text style={[styles.footText, { marginTop: 2 }]}>Integrity SHA-256 · {fingerprint}</Text>
        </View>
      </Page>
    </Document>
  );
}
