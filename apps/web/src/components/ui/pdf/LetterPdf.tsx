import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";

/**
 * LetterPdf — the URDS PDF Kit's clinical LETTER document (Roland 2026-07-01:
 * "letters need to look official… PDF-enabled"). The prose sibling of AuditPdf:
 * the same branded header band (wordmark · title · clinic logo, gold rule) and
 * audit footer (Confidential · ref · generated-by · Page X/Y · SHA-256), with a
 * letter body in the middle — date, patient identifiers block, salutation-free
 * verbatim body paragraphs, and the author's sign-off. Rendered server-side.
 */

export interface LetterPdfData {
  /** e.g. "Referral Letter" · "Sick Note" · "Discharge Summary" · "GP Letter". */
  title: string;
  /** The letter text, verbatim; blank lines split paragraphs. */
  bodyText: string;
  letterDate: string;
  patient: {
    name: string;
    dob?: string;
    patientNo?: string;
    addressLines?: string[];
  };
  author?: { name?: string; role?: string };
  brand: {
    product: string;
    clinic?: string;
    wordmarkPng?: string | null;
    logoPng?: string | null;
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
};

const styles = StyleSheet.create({
  page: { paddingTop: 84, paddingBottom: 64, paddingHorizontal: 56, fontSize: 10, color: C.ink, fontFamily: "Helvetica", lineHeight: 1.5 },
  // ── Header band (identical grammar to AuditPdf) ──
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
  goldRule: { position: "absolute", left: 32, right: 32, top: 56, height: 1.4, backgroundColor: C.gold },
  // ── Letter body ──
  dateLine: { fontSize: 10, color: C.ink, marginBottom: 14 },
  idBlock: { backgroundColor: C.parchment, borderRadius: 4, paddingVertical: 8, paddingHorizontal: 12, marginBottom: 18 },
  idTitle: { fontSize: 8, fontFamily: "Helvetica-Bold", color: C.muted, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 3 },
  idRow: { flexDirection: "row", flexWrap: "wrap" },
  idItem: { fontSize: 9.5, color: C.ink, marginRight: 18 },
  idLabel: { color: C.muted },
  // Left-aligned, never justified — justified PDF text hyphen-breaks words
  // ("ex-amination"), which is not how a clinical letter reads (Roland 2026-07-02).
  salutation: { marginBottom: 10 },
  para: { marginBottom: 10, textAlign: "left" },
  signoff: { marginTop: 26 },
  signName: { fontSize: 10.5, fontFamily: "Helvetica-Bold", color: C.ink },
  signRole: { fontSize: 9, color: C.muted, marginTop: 2 },
  signClinic: { fontSize: 9, color: C.muted },
  // ── Footer (identical grammar to AuditPdf) ──
  footer: { position: "absolute", bottom: 22, left: 32, right: 32 },
  footRule: { borderTopWidth: 0.5, borderTopColor: C.border, marginBottom: 6 },
  footRow: { flexDirection: "row", justifyContent: "space-between" },
  footText: { fontSize: 6.8, color: C.faint },
});

export function LetterPdf(data: LetterPdfData) {
  const { title, bodyText, letterDate, patient, author, brand, reference, fingerprint, generatedAt } = data;
  let paragraphs = bodyText.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  // Proper letter format (Roland 2026-07-02): a "Dear …" opener renders as the
  // salutation on its own line, and sets the correct UK sign-off — a NAMED
  // recipient closes "Yours sincerely"; "Dear Sir/Madam" closes "Yours faithfully".
  let salutation: string | undefined;
  if (/^dear\b/i.test(paragraphs[0] ?? "")) {
    salutation = paragraphs[0];
    paragraphs = paragraphs.slice(1);
  }
  const signOff =
    salutation && !/sir|madam|colleague/i.test(salutation) ? "Yours sincerely," : "Yours faithfully,";
  const stamp = `Generated ${generatedAt}`;

  return (
    <Document
      title={`${title} — ${patient.name}`}
      author={author?.name || brand.product}
      subject={`${title}${brand.clinic ? ` — ${brand.clinic}` : ""} · ${reference}`}
      creator={brand.product}
      producer={`${brand.product} · URDS PDF Kit`}
    >
      <Page size="A4" style={styles.page} wrap>
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
            </View>
            <View style={styles.headRight}>
              {brand.logoPng ? <Image style={styles.logo} src={brand.logoPng} /> : null}
            </View>
          </View>
        </View>
        <View style={styles.goldRule} fixed />

        <Text style={styles.dateLine}>{letterDate}</Text>

        {/* Patient identifiers — the clinical-standard block every letter carries. */}
        <View style={styles.idBlock} wrap={false}>
          <Text style={styles.idTitle}>Re</Text>
          <View style={styles.idRow}>
            <Text style={styles.idItem}>{patient.name}</Text>
            {patient.dob ? (
              <Text style={styles.idItem}>
                <Text style={styles.idLabel}>DOB </Text>
                {patient.dob}
              </Text>
            ) : null}
            {patient.patientNo ? (
              <Text style={styles.idItem}>
                <Text style={styles.idLabel}>Patient No. </Text>
                {patient.patientNo}
              </Text>
            ) : null}
          </View>
          {patient.addressLines?.length ? (
            <Text style={[styles.idItem, { marginTop: 2 }]}>{patient.addressLines.join(", ")}</Text>
          ) : null}
        </View>

        {salutation ? <Text style={styles.salutation}>{salutation}</Text> : null}

        {paragraphs.map((p, i) => (
          <Text key={i} style={styles.para}>
            {p}
          </Text>
        ))}

        {/* Sign-off — who wrote it, in what role, at which clinic. */}
        <View style={styles.signoff} wrap={false}>
          <Text>{signOff}</Text>
          {author?.name ? <Text style={[styles.signName, { marginTop: 14 }]}>{author.name}</Text> : null}
          {author?.role ? <Text style={styles.signRole}>{author.role}</Text> : null}
          {brand.clinic ? <Text style={styles.signClinic}>{brand.clinic}</Text> : null}
        </View>

        <View style={styles.footer} fixed>
          <View style={styles.footRule} />
          <View style={styles.footRow}>
            <Text style={styles.footText}>
              Confidential · {brand.clinic || brand.product} · Ref {reference}
            </Text>
            <Text style={styles.footText}>{stamp}</Text>
            <Text style={styles.footText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
          </View>
          <Text
            style={[styles.footText, { marginTop: 2 }]}
            render={({ pageNumber, totalPages }) =>
              pageNumber === totalPages ? `Integrity SHA-256 · ${fingerprint}` : ""
            }
            fixed
          />
        </View>
      </Page>
    </Document>
  );
}
