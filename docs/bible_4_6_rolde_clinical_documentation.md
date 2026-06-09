# RolDe — Bible 4.6: Module — Clinical Documentation

> *"Everything lives in the patient feed. No tab-jumping. No document hunting."* — Bible 0 §8.9
>
> Version 1.0 | Last Updated: 10 May 2026 | RolDe Ltd | CONFIDENTIAL
>
> Implementation specification for clinical documentation. Inherits from Bibles 0 v1.2, 4.0, 4.1, 4.2, 4.3, 4.4, and 4.5.

---

## How to Use This Document

This is the **implementation specification for RolDe's clinical documentation surface** — how clinical content gets into the patient record and how it lives there. Bible 4.4 §4 introduced the patient feed structurally; this Bible specifies how content flows through it in practice:

- The clinical note-writing experience (the bottom-left text input)
- The photo management system (5-photo aesthetic standard for Doc For Skin; general clinical photography for other specialties)
- Document upload and attachment patterns
- The OCR pipeline expanded (extending Bible 4.4 §7)
- Structured fields per specialty
- The consultation lifecycle (open → active → closed → summarised)
- The voice ambient AI integration with documentation (Phase 1.5)
- Versioning and edit tracking
- Print and export of clinical content

**Loading order for Claude Code sessions**:
1. Bible 0 v1.2 — group defaults (especially §8.9 everything-in-the-feed)
2. Bible 4.0 — RolDe constitution (Principle 7 — one canonical view)
3. Bible 4.1 — architecture
4. Bible 4.2 — design system (consultation screen, AI panel)
5. Bible 4.3 — multi-tenant foundation
6. Bible 4.4 — core modules (patient feed structure, schemas)
7. Bible 4.5 — prescribing (orders flow into the feed)
8. This Bible 4.6 — clinical documentation
9. Bible 4.7 — AI ambient (referenced for AI-promoted entries)

---

## Table of Contents

1. The Documentation Constitution
2. The Clinical Note-Writing Surface
3. The Note Persistence Pipeline
4. The Photo Management System
5. Document Upload and Attachment
6. The OCR Pipeline (Expanded)
7. Structured Fields and Forms
8. The Consultation Lifecycle
9. Voice Ambient AI Integration (Phase 1.5)
10. Versioning and Edit Tracking
11. Print and Export of Clinical Content
12. Search Within Documentation
13. The Documentation Permissions Matrix
14. Per-Tenant Configuration
15. Acceptance Criteria for "Documentation Module Is Built"

---

## 1. The Documentation Constitution

Three principles, inherited from prior Bibles, made fully operational here.

### 1.1 Everything Lives In The Feed

Bible 0 §8.9 / Bible 4.0 Principle 7. The patient feed is the **single canonical view** of a patient's clinical record. Every type of content — clinical notes, vital signs, photos, consents, letters drafted/sent, lab orders/results, radiology orders/results, scanned documents, AI promotions, alerts recorded — lives in the chronological feed.

There is no separate "photos" tab. No separate "documents" tab. No separate "consents" tab. No separate "letters" tab. The patient detail page (Bible 4.4 §2.6) has secondary tabs (Demographics, Allergies, Alerts, Appointments, Documents, Consents, Audit) for *summary views* of structured data, but the **Timeline** tab — the patient feed — remains the canonical place where clinical reasoning happens.

The "Documents" and "Consents" tabs on the patient detail page are convenience filters of the feed, not separate content stores.

### 1.2 iMessage Direction (Oldest Top, Newest Bottom)

Bible 0 §8.8 / Bible 4.2 §4. The feed flows top-to-bottom chronologically. View auto-scrolls to most recent on load. New saves animate in at the bottom. Conversation grows downward.

This applies to every clinical artefact. A photo uploaded today appears below a clinical note from yesterday. A scanned letter from 2018 appears at the top (or near the top, depending on how far back you scroll). The narrative is always chronological.

### 1.3 Documents Don't Live In Tabs; They Live In The Feed

When a clinician uploads a scanned referral letter, they don't navigate to a "Documents" page. They click an "Attach" button on the consultation screen → file uploads → OCR runs → feed entry appears in chronological position. The document IS the feed entry.

When a patient signs a consent form via the portal, the signed PDF doesn't sit in a separate consent vault. A `consent_signed` feed entry is created with the signed PDF linked. The consent IS in the feed.

This constitutional commitment shapes every documentation decision in this Bible.

---

## 2. The Clinical Note-Writing Surface

The bottom-left pane of the consultation screen (Bible 4.2 §3.5). Where the clinician types as the consultation unfolds.

### 2.1 The Input Behaviour

```
+------------------------------------------------------+
|                                                      |
|  Note for John Smith...                              |
|                                                      |
|  [____________________________________________]      |
|  [____________________________________________]      |
|  [____________________________________________]      |
|                                                      |
|                                          [Save ⌘+↵]  |
+------------------------------------------------------+
```

**Behaviour specifications**:

- **Multi-line auto-grow**: starts at 2 lines, grows up to 6 lines visible, scrolls internally beyond
- **Cmd/Ctrl+Enter**: commits the note to the feed (saves it as a `clinical_note` entry)
- **Tab**: indents (for nested bullet points), does not commit
- **Esc**: clears unsaved input (with confirmation if >50 chars)
- **Auto-save draft**: every 5 seconds, the current text is auto-saved as a draft (so accidental navigation doesn't lose work)
- **Markdown-light**: `-` creates bullet, `**bold**` formats bold, `#` heading; rendered live in the saved feed entry
- **Placeholder**: `"Note for [Patient First Name]..."` in `--text-tertiary`
- **Focus state**: dark border (`--border-focus`), no glow

### 2.2 The Auto-Save Draft Mechanism

While the clinician types, draft state is held in two places:

1. **Browser localStorage** (per-patient key) — survives accidental tab close
2. **Server-side `clinical_note_drafts` table** — survives device switch and clinician's other devices

```sql
CREATE TABLE clinical_note_drafts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id    UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  consultation_id UUID,
  
  draft_text    TEXT NOT NULL,
  word_count    INTEGER NOT NULL,
  
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id, patient_id, consultation_id)
);

CREATE INDEX idx_drafts_user_active ON clinical_note_drafts(user_id, updated_at DESC);
```

When the clinician opens a patient, the system checks for an existing draft and pre-populates the input field with a subtle indicator: *"Draft restored from 14 minutes ago"*.

When a note is committed (saved as feed entry), the corresponding draft is deleted.

### 2.3 The Save Flow

```
[Clinician types]
        |
        v
[Cmd/Ctrl+Enter pressed]
        |
        v
[Validate: not empty, length within reasonable bounds]
        |
        v
[Server action: insertFeedEntry(type='clinical_note', payload={text, word_count})]
        |
        v
[Database insert with audit log]
        |
        v
[Realtime broadcast to all open clients on this patient]
        |
        v
[Feed entry animates in at bottom of feed]
        |
        v
[Input field clears; draft deleted]
        |
        v
[AI panel may surface suggestions based on new note content]
```

End-to-end save target: **<400ms perceived latency** from Cmd+Enter to feed entry visible.

### 2.4 The Markdown-Light Formatting

A constrained subset of markdown supported:

| Input | Rendered |
|---|---|
| `-` at line start | Bullet |
| `1.` at line start | Numbered list |
| `**word**` | **word** |
| `*word*` | *word* |
| `# Heading` | Heading style |
| `---` on own line | Horizontal rule |
| `>` at line start | Blockquote (for "patient said...") |

NOT supported (deliberately, to avoid format-fighting):
- Tables (use vital signs structured entry)
- Images (use photo upload)
- Links (rendered as plain text)
- Code blocks (clinical work doesn't typically need them)

### 2.5 The AI's Reaction To Note-Writing

As the clinician types and commits notes, the AI server (Bible 4.7) processes the new content and may surface ambient suggestions. This is the persistent websocket pattern from Bible 4.1 §6.

The connection between note-writing and AI activation:

1. Clinician types → text streamed to AI server via websocket (debounced ~300ms)
2. AI server processes → may return: clarifying suggestion, differential update, drug suggestion, etc.
3. Suggestions appear as cards in the AI panel (bottom-right)

Note saving (committing the entry) is independent of AI streaming. The AI may have already surfaced suggestions before the note is even saved. The save commits the typed content as a permanent feed entry; AI suggestions remain as cards until promoted or dismissed.

### 2.6 The Note Length And Format Considerations

Clinical notes vary widely in length:
- **Brief check-in** (e.g. follow-up): 1-2 sentences
- **Standard consultation**: 1-3 paragraphs
- **Complex case**: multiple paragraphs with structured sections

RolDe doesn't enforce a length minimum or maximum. The clinician writes what they need. The AI helps by surfacing structured-format suggestions where appropriate (e.g. "Would you like to capture this as SBAR for the referral?"), but the format is the clinician's choice.

For specialty-specific structured documentation (e.g. DVLA assessment forms in Bible 5, aesthetic procedure notes in Bible 6), structured forms supplement the free-text field. See §7.

---

## 3. The Note Persistence Pipeline

When a `clinical_note` feed entry is created, it goes through a defined pipeline.

### 3.1 The Insert Flow

```typescript
// src/lib/notes/save.ts
'use server';

export async function saveClinicalNote(input: {
  patientId: string;
  consultationId?: string;
  appointmentId?: string;
  text: string;
}): Promise<FeedEntry> {
  const user = await auth.requireUser();
  const { tenantId } = await getTenantContext();
  
  // Validate
  if (input.text.trim().length === 0) {
    throw new Error('Note cannot be empty');
  }
  
  if (input.text.length > 50000) {
    throw new Error('Note exceeds maximum length (50,000 characters)');
  }
  
  // Permission check
  if (!await canWriteClinicalNotes(user.id, tenantId, input.patientId)) {
    throw new Error('Forbidden');
  }
  
  // Insert feed entry
  const entry = await insertFeedEntry({
    patientId: input.patientId,
    entryType: 'clinical_note',
    payload: {
      text: input.text,
      word_count: input.text.trim().split(/\s+/).length,
    },
    consultationId: input.consultationId,
    appointmentId: input.appointmentId,
  });
  
  // Delete the draft now that it's committed
  await supabase
    .from('clinical_note_drafts')
    .delete()
    .eq('user_id', user.id)
    .eq('patient_id', input.patientId);
  
  // Notify AI server (already aware via websocket, but explicit notification on commit)
  await notifyAIServerOfFeedEntry(entry);
  
  return entry;
}
```

### 3.2 The Edit Window

Per Bible 4.4 §4.6: clinical notes are editable by the author within 24 hours of creation.

After 24 hours: editing is locked. If the clinician realises a clarification is needed, they create a new note (e.g. *"Addendum to note 14:32 — should have read..."*). The original stands as written.

This is a deliberate clinical-record-integrity choice. Easy edits enable error correction; locked-after-24h prevents retrospective rewriting.

### 3.3 The Edit Pipeline

When the clinician edits a note within the window:

1. Original payload preserved in `feed_entry_versions` table (Bible 4.4 §4.6)
2. New payload written to `patient_feed_entries.payload`
3. `updated_at` and `updated_by` set
4. Audit log entry: `clinical_note.update` with before/after diff
5. Feed entry visually shows "(edited)" indicator next to timestamp
6. Click "(edited)" → modal showing edit history

```sql
-- Already specified in Bible 4.4 §4.6, repeated here for completeness
CREATE TABLE feed_entry_versions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id      UUID NOT NULL REFERENCES patient_feed_entries(id) ON DELETE CASCADE,
  payload       JSONB NOT NULL,
  edited_by     UUID NOT NULL REFERENCES auth.users(id),
  edited_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  edit_reason   TEXT
);

CREATE INDEX idx_versions_entry ON feed_entry_versions(entry_id, edited_at DESC);
```

### 3.4 The Delete Behaviour

Soft delete only (Bible 4.1 §5.3). The entry is hidden from default queries but visible to:
- Caretaker via "Show deleted" toggle in audit view
- Custodian via cross-tenant queries (audit-logged)

Hard delete is reserved for:
- GDPR right-to-erasure (with full audit log entry recording reason)
- Custodian-initiated cleanup of test data

Both hard-delete cases are extremely rare in production. The default operational pattern is: entries are never deleted; they are corrected with addenda.

### 3.5 The Caretaker Override

A Caretaker can edit/delete another clinician's note in exceptional circumstances (e.g. a junior clinician records something inappropriate; a clinician records into the wrong patient's record). This is:

- Audit-logged with both actors' identities
- Notification sent to the original author
- Never permitted on the AI's promoted entries (those are timestamped and immutable)

---

## 4. The Photo Management System

Bible 0 §8.9 / Bible 4.0 §10 specified photos as a feed entry type. This section operationalises in detail. The 5-photo aesthetic standard from your Cluster D Doc For Skin specs is implemented here.

### 4.1 The Photo Standards

Three photo standards are supported, configurable per service or per-tenant:

| Standard | Use Case | Photo Count | Angles |
|---|---|---|---|
| `five_photo` | Aesthetic medicine (Doc For Skin standard) | 5 | Frontal, L oblique, L lateral, R oblique, R lateral |
| `three_photo` | Some aesthetic + lesion documentation | 3 | Frontal, L lateral, R lateral |
| `single_photo` | General clinical photography | 1 | Free |
| `custom` | Specialty-defined sets | Variable | Per specialty Bible |

The five-photo standard is the operational default for aesthetic procedures. It captures sufficient angles for before/after comparison without overwhelming the workflow.

### 4.2 The Photo Upload Modal

Triggered by the "Photo" button in the right pane of the consultation screen, or by a button in the patient detail page.

```
+------------------------------------------------------------------+
|  Aesthetic Photography — Before / After Set            [X]      |
+------------------------------------------------------------------+
|                                                                  |
|  Session label:  [Botox session 1                     ▼]        |
|  (or [Custom session label_______________________])              |
|                                                                  |
|  Compare to previous set:  [None        ▼]                       |
|                                                                  |
|  ─────────────────────────────────────────────────────────────   |
|                                                                  |
|  +------------------+  +------------------+  +------------------+|
|  |                  |  |                  |  |                  ||
|  |    [+ Frontal]   |  |  [+ L Oblique]   |  |  [+ L Lateral]   ||
|  |                  |  |                  |  |                  ||
|  +------------------+  +------------------+  +------------------+|
|                                                                  |
|  +------------------+  +------------------+                      |
|  |                  |  |                  |                      |
|  |  [+ R Oblique]   |  |  [+ R Lateral]   |                      |
|  |                  |  |                  |                      |
|  +------------------+  +------------------+                      |
|                                                                  |
|  ─────────────────────────────────────────────────────────────   |
|                                                                  |
|  [Annotate selected photo]   [Watermark preview]                 |
|                                                                  |
|  [Save and add to feed]    [Cancel]                              |
+------------------------------------------------------------------+
```

DESIGN NEEDED: Photo upload modal visual treatment — Roland to design exact layout, slot dimensions, and the empty-state appearance for each photo angle.

### 4.3 The Upload Sources

Each photo slot offers three upload methods:

1. **From device** (file picker) — clinician selects from their computer
2. **From camera** (browser camera API) — direct capture via webcam or USB-connected camera
3. **From mobile** (QR code) — scan QR with phone, take photo, upload from phone

The mobile-via-QR pattern is genuinely useful for aesthetic clinics where photos are typically taken with a smartphone. Implementation:

1. Click "From mobile" on a slot
2. QR code displayed
3. Clinician (or assistant) scans with phone, opens a tenant-scoped upload page on phone
4. Takes photo on phone
5. Photo uploads to tenant storage
6. Browser detects upload via Realtime subscription
7. Photo appears in the slot

### 4.4 The Annotation System

Once photos are uploaded, the clinician can annotate them.

```
+------------------------------------------------------------------+
|  Annotate: Frontal — Botox session 1                    [X]     |
+------------------------------------------------------------------+
|                                                                  |
|  +------------------------------------------------------+        |
|  |                                                      |        |
|  |                                                      |        |
|  |              [Photo with annotation overlays]        |        |
|  |                                                      |        |
|  |                                                      |        |
|  +------------------------------------------------------+        |
|                                                                  |
|  Tools:  [○ Pin]  [→ Arrow]  [⬭ Circle]  [T Text]              |
|                                                                  |
|  Annotations:                                                    |
|   1. Glabella — 4 units Azzalure                                 |
|   2. Crow's feet (L) — 6 units                                   |
|   3. Crow's feet (R) — 6 units                                   |
|                                                                  |
|  [Save annotations]   [Discard]                                  |
+------------------------------------------------------------------+
```

Annotations are stored as structured data in the photo's metadata (not burnt into the image), so they can be:
- Edited later
- Hidden for printing
- Compared between before/after sets

```typescript
// PhotoSetPayload extension (extends Bible 4.4 §4.2)
{
  set_type: 'five_photo',
  session_label: 'Botox session 1',
  comparison_to_set_id: 'previous-set-uuid',  // Link to before set
  photos: [
    {
      angle: 'frontal',
      raw_url: 'https://storage.../patient-photos/uuid/raw/frontal.jpg',
      watermarked_url: 'https://storage.../patient-photos/uuid/watermarked/frontal.jpg',
      annotations: [
        {
          id: 'ann-1',
          type: 'pin',
          x: 0.5,           // 0.0-1.0 normalised coordinates
          y: 0.3,
          text: 'Glabella — 4 units Azzalure',
          color: '#000000',
          visible_in_print: true,
        },
        {
          id: 'ann-2',
          type: 'arrow',
          x_start: 0.4,
          y_start: 0.4,
          x_end: 0.45,
          y_end: 0.42,
          text: 'Crow\'s feet — 6 units',
          color: '#000000',
        }
      ]
    },
    // ... other 4 angles
  ]
}
```

### 4.5 The Watermarking Pipeline

Per Bible 4.1 §8.5 / Bible 4.2 §15:

1. Photo uploaded → lands in `patient-photos/<tenant>/raw/<photo_id>.jpg`
2. Edge Function `watermark_photo` triggered
3. Watermark applied per Caretaker configuration (text, position, opacity)
4. Watermarked version stored at `patient-photos/<tenant>/watermarked/<photo_id>.jpg`
5. Patient feed references the watermarked version
6. Raw version retained for high-quality export with audit-logged access

### 4.6 The Watermark Configuration

```json
{
  "aesthetic_photography": {
    "watermark": {
      "enabled": true,
      "text": "© Doc For Skin 2026",
      "include_clinic_logo": false,
      "include_date": true,
      "include_patient_id": false,
      "position": "bottom_right",
      "opacity": 0.5,
      "font_size": "small",
      "font_color": "#FFFFFF",
      "shadow": true
    }
  }
}
```

DESIGN NEEDED: Watermark visual treatment — Roland to design the exact font, opacity, and positioning for Doc For Skin.

### 4.7 The Carousel Viewer

When clicking a photo set in the patient feed, a carousel viewer opens:

```
+------------------------------------------------------------------+
|                                                            [X]   |
|                                                                  |
|  [< prev]   Frontal   1/5                              [next >]  |
|                                                                  |
|  +------------------------------------------------------+        |
|  |                                                      |        |
|  |                                                      |        |
|  |              [Full-resolution photo]                 |        |
|  |                                                      |        |
|  |                                                      |        |
|  +------------------------------------------------------+        |
|                                                                  |
|  Annotations: ●○○○ (4 of 5 visible)  [Toggle annotations]        |
|                                                                  |
|  Compare with:                                                   |
|  ○ Botox session 1 (3 weeks ago)                                 |
|  ● This session                                                  |
|                                                                  |
|  [Print this set]   [Download (clinician only)]                  |
+------------------------------------------------------------------+
```

The carousel allows:
- Swipe / arrow navigation between angles
- Full-resolution view
- Toggle annotations on/off
- Side-by-side comparison with previous session (split-screen mode)
- Print the set (with watermark)
- Download (clinician-only access; audit-logged)

### 4.8 The Side-By-Side Comparison

The most clinically valuable feature for aesthetic medicine. When a session has a `comparison_to_set_id`, the carousel offers split-screen mode:

```
+-----------------+-----------------+
|                 |                 |
|   Before        |    After        |
|   3 weeks ago   |    today        |
|                 |                 |
|   [photo]       |    [photo]      |
|                 |                 |
|                 |                 |
+-----------------+-----------------+
```

Sliding the centre divider lets the clinician (or patient, when shared) compare before and after.

This is exactly the feature aesthetic clinics rave about. RolDe ships it as default.

### 4.9 The Photo Feed Entry Display

In the patient feed, a photo set entry shows as:

```
+------------------------------------------------------+
|  [📷] Aesthetic photography — Botox session 1        |
|         10 May 2026 14:32  •  Roland Jayasekhar       |
+------------------------------------------------------+
|                                                      |
|  +-------+  +-------+  +-------+  +-------+ +-------+|
|  | thumb |  | thumb |  | thumb |  | thumb | | thumb ||
|  |  fr   |  |  L_o  |  |  L_l  |  |  R_o  | |  R_l  ||
|  +-------+  +-------+  +-------+  +-------+ +-------+|
|                                                      |
|  Compare with: Botox baseline (3 weeks ago)          |
|  Annotations: 3                                      |
|                                                      |
+------------------------------------------------------+
|  [View carousel]  [Compare side-by-side]  [Print]    |
+------------------------------------------------------+
```

Click any thumbnail → opens carousel at that angle. Click "Compare side-by-side" → opens split-screen with the linked previous set.

### 4.10 The Photo Privacy

Per Bible 4.4 §13 and Bible 4.3 §5.8:

- Photos are clinician-visible by default
- Patients do NOT see photos in their patient portal by default (Caretaker can configure exceptions per data type)
- Photos are NEVER promoted to ambient AI suggestions visible to patients

This default-no-patient-access protects patient confidentiality (some patients don't want to see clinical photos of themselves) and protects the clinician's clinical record from being misinterpreted out of context.

Caretaker can grant patient access on a per-photo-type basis (e.g. "Allow patients to see their own aesthetic before/after photos").

### 4.11 The Storage Cost Considerations

Photos are larger than typical feed entries:
- Average raw photo: 2-8 MB
- 5-photo set: 10-40 MB
- 100 patients × 5 sessions × 5 photos = 2,500-10,000 MB

Storage cost considerations:
- Supabase Storage (Bible 4.1 §8): generous free tier, predictable pricing at scale
- Phase 1: store all photos at full quality
- Phase 2 (if needed): tiered storage — recent (last 12 months) at full quality; older photos compressed to lower resolution but retained

Photo retention policy in tenant config:
- Default: indefinite (clinical records retained per UK regulations, typically 7+ years)
- Caretaker can configure per-clinic retention if appropriate (rare; mostly defaults to "keep forever")

---

## 5. Document Upload and Attachment

Beyond photos, clinicians need to attach various documents to patient records.

### 5.1 The Document Types

| Type | Examples | Feed Entry Type |
|---|---|---|
| Scanned letter | Letter from another hospital | `scanned_document` |
| Lab report PDF | External lab results | `lab_result` (with PDF attached) |
| Imaging report | Radiology report from external provider | `radiology_result` (with PDF attached) |
| Patient-uploaded document | Prescription from another doctor | `scanned_document` |
| Photograph (clinical, not aesthetic 5-set) | Lesion photograph | `single_photo` |
| Audio recording | Voice note (Phase 1.5) | `audio_recording` |
| Other | Generic documents | `scanned_document` |

### 5.2 The Upload Pattern

The upload flow on the consultation screen:

1. Click "+" button next to the text input field
2. Menu appears:
   - "Add photo (5-photo set)"
   - "Add single photo"
   - "Upload document"
   - "Voice note" (Phase 1.5)
3. Selected option opens appropriate upload modal
4. Once uploaded, feed entry created and appears in feed at chronological position

### 5.3 The Document Upload Modal

```
+------------------------------------------------------------------+
|  Upload document                                          [X]   |
+------------------------------------------------------------------+
|                                                                  |
|  [Drag and drop or click to upload]                              |
|                                                                  |
|  Supported formats: PDF, JPG, PNG, HEIC, TIFF, DOC, DOCX, TXT   |
|  Maximum size: 50 MB                                             |
|                                                                  |
|  ─────────────────────────────────────────────────────────────   |
|                                                                  |
|  Document type:  [Auto-detect              ▼]                    |
|                                                                  |
|  Date of document:  [10 May 2026  ▼]  ☑ Use today               |
|                                                                  |
|  Notes (optional):                                               |
|  [_____________________________________________________]        |
|                                                                  |
|  ☑ Run OCR to extract text                                       |
|  ☑ Run AI analysis to summarise and classify                     |
|                                                                  |
|  [Upload]   [Cancel]                                             |
+------------------------------------------------------------------+
```

### 5.4 The Upload Pipeline

1. File selected/dropped → uploaded directly to `patient-documents` bucket via Supabase Storage signed URL
2. Storage row created
3. Edge Function `process_uploaded_document` triggered:
   - Detects file type
   - For PDFs and images: triggers OCR (§6)
   - For DOC/DOCX: extracts text via mammoth.js or similar
   - For TXT: just reads
4. Once text is extracted, AI server called for summary and classification
5. Feed entry created (typically `scanned_document`) with all metadata
6. Original file preserved alongside extracted text and AI summary

### 5.5 The Document Categorisation

The AI categorises uploaded documents into types:

- `specialist_letter` — reply from a specialist
- `referral_letter` — incoming referral from another clinician
- `lab_report` — laboratory results document
- `imaging_report` — radiology / ultrasound report
- `discharge_summary` — hospital discharge document
- `prescription` — prescription from elsewhere
- `consent_form` — externally signed consent
- `medical_history` — historic medical record summary
- `patient_correspondence` — letter from patient
- `other` — fallback

The category affects how the document renders in the feed (which icon, which colour treatment).

### 5.6 The Patient-Uploaded Documents

Patients can upload documents via the patient portal:

- "Upload a document" button in patient portal
- Same supported formats
- Patient adds optional note ("This is from my GP visit on 1 May")
- Document uploaded to clinic, awaits clinician review
- Appears as "Patient-uploaded document — pending review" in clinic dashboard
- Clinician reviews → either accepts (becomes a feed entry) or declines (with optional message to patient)

This pattern exists for legitimate use cases (patient brings external documentation) without becoming a noise channel (clinician has reviewed gate).

---

## 6. The OCR Pipeline (Expanded)

Bible 4.4 §7 introduced OCR. This section expands implementation detail.

### 6.1 The Two-Phase OCR Strategy

| Phase | OCR Engine | When |
|---|---|---|
| Phase 1 | **Tesseract.js** (open source, runs on Edge Function) | At launch |
| Phase 1.5 | **Gemma 4 multimodal** (via AI server) | When Gemma 4 multimodal is integrated |

Phase 1 is sufficient for typed documents (referral letters, lab reports). Phase 1.5 is significantly better for handwritten, low-quality scans, and structured forms.

### 6.2 The Phase 1 Implementation (Tesseract)

```typescript
// supabase/functions/ocr_uploaded_document/index.ts
import Tesseract from 'tesseract.js';

export async function ocrDocument(documentUrl: string, patientId: string, tenantId: string) {
  const supabase = createServiceRoleClient();
  
  // Download document
  const response = await fetch(documentUrl);
  const buffer = await response.arrayBuffer();
  
  // For PDFs, render each page to image first
  let textPerPage: string[] = [];
  let confidencePerPage: number[] = [];
  
  if (documentUrl.endsWith('.pdf')) {
    const pages = await renderPDFPagesToImages(buffer);
    for (const pageImage of pages) {
      const { data } = await Tesseract.recognize(pageImage, 'eng');
      textPerPage.push(data.text);
      confidencePerPage.push(data.confidence / 100);
    }
  } else {
    // Image directly
    const { data } = await Tesseract.recognize(Buffer.from(buffer), 'eng');
    textPerPage = [data.text];
    confidencePerPage = [data.confidence / 100];
  }
  
  const fullText = textPerPage.join('\n\n--- PAGE BREAK ---\n\n');
  const avgConfidence = confidencePerPage.reduce((a, b) => a + b, 0) / confidencePerPage.length;
  
  // Submit to AI for summary/classification
  const aiResponse = await fetch(`${process.env.ROLDE_AI_SERVER_URL}/v1/document-analysis`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.ROLDE_AI_SERVER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text: fullText }),
  });
  
  const analysis = await aiResponse.json();
  
  // Create feed entry
  await insertFeedEntry({
    tenantId,
    patientId,
    entryType: 'scanned_document',
    payload: {
      original_filename: documentUrl.split('/').pop(),
      uploaded_at: new Date().toISOString(),
      ocr_extracted_text: fullText,
      ocr_confidence: avgConfidence,
      ocr_pages: textPerPage.length,
      ai_summary: analysis.summary,
      ai_key_findings: analysis.key_findings,
      document_type: analysis.document_type,
      source_clinic: analysis.source_clinic,
      document_date: analysis.document_date,
    },
    documentUrl,
  });
}
```

### 6.3 The Confidence Threshold Handling

OCR quality is variable. Confidence scoring guides the UX:

- **>= 0.85 confidence**: Document treated as reliable; AI summary shown prominently; "View original" available but not pushed
- **0.70 - 0.85 confidence**: Banner: "Moderate confidence OCR — please verify accuracy"; AI summary shown but with verification reminder
- **< 0.70 confidence**: Banner: "Low confidence OCR — original document recommended for clinical decisions"; AI summary collapsed by default; "View original" prominent

### 6.4 The Manual Correction

Clinicians can edit OCR-extracted text:

1. Click "(edit OCR text)" link on the feed entry
2. Modal opens with editable text alongside the original document image
3. Clinician corrects text
4. Save → text updated, audit log entry recorded ("OCR text corrected by [user]")
5. Original document never modified; only the extracted text representation

This matters for high-stakes scenarios where OCR misreads a critical value (e.g. "Creatinine 152" misread as "Creatinine 1.52").

### 6.5 The Re-OCR Action

If the clinician judges the OCR quality is too poor:

1. "Re-OCR this document" button on the feed entry
2. Choose engine: Tesseract (Phase 1 default) or Gemma 4 multimodal (Phase 1.5+)
3. Re-run OCR
4. New text replaces previous; both versions retained in `feed_entry_versions`

### 6.6 The Phase 1.5 Upgrade (Gemma 4 Multimodal)

When Gemma 4 multimodal is integrated, the OCR pipeline changes:

```typescript
// Phase 1.5 implementation (when Gemma 4 multimodal is online)
async function ocrDocumentViaGemma4(documentUrl: string, patientId: string, tenantId: string) {
  // Download document
  const response = await fetch(documentUrl);
  const buffer = await response.arrayBuffer();
  
  // Send directly to AI server's vision endpoint
  const aiResponse = await fetch(`${process.env.ROLDE_AI_SERVER_URL}/v1/document-vision-analysis`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.ROLDE_AI_SERVER_API_KEY}`,
      'Content-Type': 'application/octet-stream',
    },
    body: buffer,
  });
  
  const result = await aiResponse.json();
  // Gemma 4 returns: {
  //   extracted_text, confidence, structure (sections, tables, forms),
  //   summary, key_findings, document_type, source_clinic, document_date
  // }
  
  // Create feed entry with structured result
  await insertFeedEntry({
    tenantId, patientId,
    entryType: 'scanned_document',
    payload: {
      original_filename: documentUrl.split('/').pop(),
      uploaded_at: new Date().toISOString(),
      ocr_extracted_text: result.extracted_text,
      ocr_confidence: result.confidence,
      ocr_structure: result.structure,  // Tables, sections
      ai_summary: result.summary,
      ai_key_findings: result.key_findings,
      document_type: result.document_type,
      source_clinic: result.source_clinic,
      document_date: result.document_date,
      ocr_engine: 'gemma4_multimodal',
    },
    documentUrl,
  });
}
```

Migration: feature flag `NEXT_PUBLIC_USE_GEMMA4_VISION` controls which engine runs. When enabled, Gemma 4 is used; when disabled, Tesseract fallback. Documents already OCR'd are not auto-reprocessed; clinician can request re-OCR if needed.

### 6.7 The Structured Form Extraction (Phase 1.5+)

Gemma 4 multimodal can extract structured data from medical forms:

- Lab report → table of values with reference ranges
- Discharge summary → structured sections (presenting complaint, diagnosis, treatment, plan)
- DVLA D4 form → all field values

This goes beyond text extraction. Phase 1.5 can produce structured `lab_result` feed entries directly from PDF reports, without manual data entry.

---

## 7. Structured Fields and Forms

While free-text notes are the default, some clinical work needs structured data.

### 7.1 The Structured Forms Pattern

A structured form is a feed entry with a richer payload schema. Examples:

- **Vital signs** (Bible 4.4 §4.2 — already structured)
- **DVLA Group 2 medical assessment** (Bible 5 — Doc For Drivers)
- **Aesthetic procedure note** (Bible 6 — Doc For Skin)
- **Mental Health Act assessment** (future specialty Bible)
- **Pre-operative checklist** (future specialty Bible)
- **Post-procedure aftercare review** (Bible 6)

Each structured form is a feed entry with `entry_type` from the structured-form whitelist, with payload validated by the corresponding Zod schema.

### 7.2 The Form Rendering

In the consultation screen, structured forms render in the right pane (under the Procedures tab or specialty-specific tab) as a dedicated form interface. When saved, they appear in the feed as a feed entry with a structured-card visual treatment (vs the plain-text card used for free-text notes).

### 7.3 The Form Auto-Population

The AI can pre-populate structured forms from consultation context:

- Clinician begins DVLA assessment
- AI reads patient history, recent vital signs, current medications
- Form pre-populates with relevant fields filled in (e.g. "Cardiovascular: Hypertension — controlled, BP 132/84 today")
- Clinician reviews, edits, signs

Pre-population follows the agentic boundary (Bible 4.0 §4.3): drafts everything, sends nothing without approval. The AI fills the form; the clinician approves and signs.

### 7.4 The Form-to-Feed Mapping

When a structured form is saved:

- Feed entry created with full structured payload
- AI may also extract a free-text summary that gets added as a clinical_note feed entry
- Both entries linked via `consultation_id`
- The patient's chronological feed shows both, in order

This means the free-text feed retains its narrative chronology AND the structured data is queryable for reporting.

### 7.5 The Vital Signs Form (Universal Example)

The vital signs form is universal across all RolDe-powered products:

```
+------------------------------------------------------------------+
|  Vital Signs                                              [X]   |
+------------------------------------------------------------------+
|                                                                  |
|  Recorded by:  [Roland Jayasekhar]  at  [10 May 2026 14:32]     |
|                                                                  |
|  Temperature:        [37.8] °C                                   |
|  Heart rate:         [108]  bpm                                  |
|  Respiratory rate:   [22]   per minute                           |
|  Blood pressure:     [165] / [90]   mmHg                         |
|  SpO2:               [95]  % on    [air        ▼]                |
|  Consciousness:      [Alert                ▼]                    |
|                                                                  |
|  ─────────────────────────────────────────────────────────────   |
|                                                                  |
|  NEWS2 Score (calculated):                                       |
|  Temperature: +1                                                 |
|  HR: +1                                                          |
|  RR: +2                                                          |
|  BP: +1                                                          |
|  SpO2: +1                                                        |
|  Consciousness: 0                                                |
|  ─────────────                                                   |
|  TOTAL NEWS2: 6 (urgent escalation indicated)                    |
|                                                                  |
|  [Save vital signs]   [Cancel]                                   |
+------------------------------------------------------------------+
```

NEWS2 calculation is done client-side as the clinician enters values, with the score visible immediately.

The saved feed entry shows the structured values + the calculated NEWS2 + colour-coded out-of-range values.

---

## 8. The Consultation Lifecycle

Clinical work happens within consultations. RolDe models consultation as a discrete lifecycle.

### 8.1 The Consultation States

```
[opened]  ←─── Clinician clicks patient from dashboard or appointment
   |
   |  Clinician begins typing notes, ordering, etc.
   ↓
[active]
   |
   |  Clinician explicitly closes ("End consultation")
   |  OR auto-timeout after 4 hours
   ↓
[closed]
   |
   |  Background job creates summary entry
   ↓
[summarised]
```

### 8.2 The Consultation ID

When a clinician opens a patient (via the dashboard or appointment list), a `consultation_id` UUID is generated. Every feed entry created during this session is tagged with this ID.

This serves multiple purposes:

- Filter feed to show only this consultation's entries ("Show this consultation only" button)
- Auto-generate discharge summary from this consultation's content (Bible 4.4 §5.6)
- Group orders for "Approve all and send" (Bible 4.5 §2.3)
- Analytics (consultation duration, entries created, AI usage)

### 8.3 The Open Action

```typescript
// src/lib/consultation/open.ts
'use server';

export async function openConsultation(input: {
  patientId: string;
  appointmentId?: string;
}): Promise<{ consultationId: string }> {
  const user = await auth.requireUser();
  const { tenantId } = await getTenantContext();
  
  // Permission check
  if (!await canConductConsultation(user.id, tenantId, input.patientId)) {
    throw new Error('Forbidden');
  }
  
  // Generate new consultation ID
  const consultationId = crypto.randomUUID();
  
  // Record consultation open
  await supabase.from('consultations').insert({
    id: consultationId,
    tenant_id: tenantId,
    patient_id: input.patientId,
    appointment_id: input.appointmentId,
    practitioner_id: user.id,
    status: 'active',
    opened_at: new Date(),
  });
  
  // If linked to an appointment, mark appointment as 'in_progress'
  if (input.appointmentId) {
    await supabase
      .from('appointments')
      .update({ status: 'in_progress', started_at: new Date() })
      .eq('id', input.appointmentId);
  }
  
  // Open AI session for this consultation
  await openAIConsultationSession(consultationId, input.patientId, tenantId);
  
  // Audit log
  await auditLog({
    tenantId,
    actorUserId: user.id,
    action: 'consultation.open',
    resourceType: 'consultation',
    resourceId: consultationId,
  });
  
  return { consultationId };
}
```

### 8.4 The Consultations Table

```sql
CREATE TYPE consultation_status AS ENUM (
  'active', 'closed', 'summarised', 'cancelled'
);

CREATE TABLE consultations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  patient_id        UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  practitioner_id   UUID NOT NULL REFERENCES auth.users(id),
  appointment_id    UUID REFERENCES appointments(id),
  
  status            consultation_status NOT NULL DEFAULT 'active',
  
  opened_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at         TIMESTAMPTZ,
  closed_by         UUID REFERENCES auth.users(id),
  
  -- Summary fields (populated when status → 'summarised')
  summary_text      TEXT,
  summary_generated_at TIMESTAMPTZ,
  
  -- Statistics (populated when closed)
  duration_seconds  INTEGER,
  feed_entries_count INTEGER,
  ai_suggestions_shown INTEGER,
  ai_suggestions_accepted INTEGER,
  
  -- Voice recording (Phase 1.5)
  audio_recording_url TEXT,
  audio_consent_signed_id UUID,  -- Link to consent record
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_consultations_practitioner ON consultations(practitioner_id, opened_at DESC);
CREATE INDEX idx_consultations_patient ON consultations(patient_id, opened_at DESC);
CREATE INDEX idx_consultations_active ON consultations(tenant_id) WHERE status = 'active';
```

### 8.5 The Close Action

The clinician closes a consultation explicitly:

- Click "End consultation" button (in the bottom-right of the consultation screen, near the AI panel)
- Confirmation dialog: "End consultation? Any drafts will remain editable for 24h."
- On confirm:
  - Consultation status → 'closed'
  - All draft orders that haven't been approved are flagged "draft consultation ended" but not auto-discarded
  - Linked appointment status → 'completed'
  - Background job triggered to generate discharge summary

### 8.6 The Auto-Timeout

If a consultation remains `active` for 4 hours without any new activity, it auto-closes:

- pg_cron runs hourly to detect stale consultations
- Stale = no feed entries created, no draft updates, no API activity in last 4 hours
- Auto-close triggers same flow as explicit close, but with reason "auto-timeout"

This prevents consultations from staying "open" indefinitely, which would distort analytics and prevent clean discharge summary generation.

### 8.7 The Discharge Summary Generation

Per Bible 4.4 §5.6:

1. Consultation closes
2. Edge Function `generate_discharge_summary` triggered (after 5-minute delay to allow any final edits)
3. AI reads all feed entries with this consultation_id
4. AI drafts discharge summary in standard format
5. Letter row created with status `draft_ready`
6. Clinician notified via dashboard or email (per tenant config)
7. Clinician reviews, approves, sends (typically to patient's GP)

The 5-minute delay is intentional. Sometimes clinicians close a consultation, realise they forgot something, reopen briefly, add content, close again. The delay prevents discharge summary draft from being immediately stale.

### 8.8 The Consultation Statistics

When a consultation closes, the statistics are computed and stored:

- `duration_seconds`: closed_at - opened_at
- `feed_entries_count`: count of feed entries with this consultation_id
- `ai_suggestions_shown`: count of AI cards shown during this consultation
- `ai_suggestions_accepted`: count of AI cards promoted to feed via "Add to notes"

These statistics power:

- Per-clinician productivity metrics (Caretaker admin)
- Per-tenant usage metrics (Custodian dashboard)
- AI effectiveness metrics (does the AI's value scale with consultation complexity?)

Constitutional caveat (Bible 4.0 §6.3): RolDe does NOT use these to pressure clinicians into seeing more patients or working faster. They are operational metrics for understanding the platform's behaviour, not performance targets imposed on clinicians.

---

## 9. Voice Ambient AI Integration (Phase 1.5)

Per Cluster D3 — voice ambient AI listens to the consultation and generates documentation. Phase 1.5 (after launch, when engineering capacity allows).

### 9.1 The Voice Workflow

1. **Patient consents** to voice recording (Bible 0 §12.6 — pre-consultation onboarding email collected this consent)
2. **Consultation opens** with voice enabled (toggleable per consultation by clinician)
3. **Recording begins** — audio captured via browser microphone API
4. **Real-time streaming** to AI server — Gemma 4 multimodal processes audio
5. **AI transcribes + annotates** in real time:
   - Speaker diarisation (clinician vs patient)
   - Note draft populated in bottom-left input field as the consultation unfolds
   - Vital signs extracted automatically when stated ("BP 132 over 84")
   - Drug doses extracted ("Started on amoxicillin 500mg three times daily")
6. **Clinician reviews** — the auto-populated note is editable; clinician can correct AI's transcription
7. **Save** — when clinician saves the note, the consultation transcript is stored as an `audio_recording` feed entry alongside the transcribed `clinical_note`
8. **Audio retention** — per tenant config (default 30 days, then deleted; transcript retained)

### 9.2 The Consent Patterns

Voice recording requires explicit patient consent. Three layers:

1. **Tenant-level**: Caretaker enables voice ambient AI module in clinic settings
2. **Patient-level**: patient signs consent during onboarding (or in-clinic)
3. **Consultation-level**: clinician confirms patient is aware before each recording session

If any layer is missing, voice recording cannot proceed.

### 9.3 The Audio Recording Feed Entry

```typescript
// AudioRecordingPayload schema
{
  audio_url: 'https://storage.../audio-recordings/<tenant>/<consultation_uuid>.mp3',
  duration_seconds: 1247,
  consent_signed_id: 'consent-uuid',
  language: 'en',
  speakers_detected: 2,
  transcript: '...',
  transcript_confidence: 0.93,
  processed_by: 'gemma4_multimodal',
  retention_expires_at: '2026-06-09T00:00:00Z'  // Default 30 days
}
```

### 9.4 The Audio Storage and Retention

Audio recordings are stored in `audio-recordings` bucket (Bible 4.1 §8.2).

Encryption: per-tenant encryption key applied at rest (additional layer beyond Supabase Storage default).

Retention default: 30 days, then auto-deleted via pg_cron job. Transcript retained in feed entry indefinitely.

Caretaker can extend retention up to 1 year for specific cases (e.g. medico-legal documentation needs).

### 9.5 The Phase 1 Fallback

Phase 1 (without voice ambient AI), the bottom-left input field is purely clinician-typed. Voice can be added by:

1. Clinician dictates into a third-party tool (Wispr Flow, Apple Dictation, etc.)
2. Pastes the transcribed text into RolDe's input field
3. Saves as normal clinical note

This is a workable Phase 1 pattern. Phase 1.5 brings native integration so the dictation happens within RolDe.

### 9.6 The Voice Privacy

Voice recordings are sensitive. Privacy guarantees:

- Audio never leaves Roland's M4 Max (or future Mac Studio) — processed locally by Gemma 4
- Transcript stored in tenant-isolated database row
- Access audit-logged
- Patients can request audio deletion at any time (via patient portal "Manage my data")
- Custodian access to audio is genuinely rare — would require explicit medico-legal justification

---

## 10. Versioning and Edit Tracking

Every change to a feed entry is tracked. Bible 4.4 §4.6 introduced this; this section operationalises.

### 10.1 The Versioning Coverage

| Entry Type | Versioned? | Edit Window |
|---|---|---|
| Clinical note | Yes | 24h by author; Caretaker override always |
| Vital signs | Yes | 24h by author |
| Prescription | Drafts only | While status='draft' |
| Lab order / Radiology order | Drafts only | While status='draft' |
| Photo set | Annotations versioned; photos themselves immutable | Annotations editable always; photos never modified |
| Consent signed | Never editable | Once signed, locked forever |
| Referral letter | Drafts only | While status='draft' |
| Discharge summary | Drafts only | While status='draft' |
| AI promotion | Yes (within 24h) | The text the clinician promoted may be re-edited |
| Scanned document | OCR text editable | Original document never modified |

### 10.2 The Edit History UI

When viewing a feed entry that has been edited:

- "(edited)" indicator visible next to timestamp
- Click "(edited)" → modal opens showing all versions

```
+------------------------------------------------------------------+
|  Edit History — Clinical note                            [X]    |
+------------------------------------------------------------------+
|                                                                  |
|  Current version (10 May 2026 14:45)                             |
|  Edited by Roland Jayasekhar                                     |
|                                                                  |
|  [text shown with diff highlights vs. previous version]          |
|                                                                  |
|  ─────────────────────────────────────────────────────────────   |
|                                                                  |
|  Version 2 (10 May 2026 14:38)                                   |
|  Edited by Roland Jayasekhar                                     |
|                                                                  |
|  [text shown with diff highlights vs. version 1]                 |
|                                                                  |
|  ─────────────────────────────────────────────────────────────   |
|                                                                  |
|  Version 1 (10 May 2026 14:32) — original                        |
|  Created by Roland Jayasekhar                                    |
|                                                                  |
|  [original text]                                                 |
|                                                                  |
+------------------------------------------------------------------+
```

Diff visualisation: standard inline diff (added text underlined; removed text struck through).

### 10.3 The Audit Trail vs Edit History

Two related but distinct concepts:

- **Edit history** (`feed_entry_versions` table): the actual content versions
- **Audit log** (`audit_log` table per Bible 4.1 §5.4): the actions taken (who, when, why)

When a clinician edits a note:
- New row in `feed_entry_versions` with the new content
- New row in `audit_log` with action='clinical_note.update', actor, timestamp, reason if provided

Edit history is reconstructable from `feed_entry_versions`. Audit log shows what *happened*. Both retained indefinitely.

### 10.4 The Caretaker Edit Override

A Caretaker editing another clinician's note (per §3.5):

- Audit log entry: action='clinical_note.steward_override_edit'
- Notification sent to original author
- Edit history shows Caretaker as the editor with explicit Caretaker badge in UI
- Reason for override required and stored

### 10.5 The Reason Required For Edits

All edits to clinical content require a brief reason. Implementation:

- Edit modal asks: "Reason for this edit (brief)"
- Common preset reasons: "Typo correction", "Clarifying detail", "Adding information omitted at time of writing"
- Custom reason free-text option
- Reason stored in `feed_entry_versions.edit_reason` and `audit_log.metadata`

This is the kind of friction that genuinely earns trust. A clinical record that shows every edit with reason is far more credible than a record that silently mutates.

---

## 11. Print and Export of Clinical Content

Sometimes clinical content needs to leave the system as a physical or transferable artefact.

### 11.1 The Print Targets

| What | Print Triggered By | Format |
|---|---|---|
| Single feed entry | "Print" button on entry footer | PDF, single page or multi-page as needed |
| Consultation summary | "Print this consultation" from consultation menu | PDF, structured |
| Patient timeline | "Print timeline" from patient detail | PDF, multiple pages |
| Photo set | "Print" from carousel | PDF with photos at standard sizes |
| Letter (referral, discharge, etc.) | Auto-generated when needed | PDF (Bible 4.4 §5.5) |
| Prescription | Auto-generated for paper-print routing | PDF (Bible 4.5 §3.6) |

### 11.2 The Print Template

DESIGN NEEDED: Print template visual treatment — Roland to design header/footer for tenant branding, page layout, typography for printed clinical content.

Common print template structure:

```
+------------------------------------------------------+
|  [Tenant logo]            [Tenant name]              |
|                           [Tenant address]           |
|  Date printed: 10 May 2026                           |
|  Patient: John Smith (DOB 15 Mar 1962, NHS xxxx)     |
|  ─────────────────────────────────────────────────   |
|                                                      |
|  [Content]                                           |
|                                                      |
|                                                      |
|  ─────────────────────────────────────────────────   |
|  Page 1 of 3                                         |
|  Confidential — for use by named clinician/clinic   |
|  RolDe document — printed [timestamp]                |
+------------------------------------------------------+
```

### 11.3 The Export Formats

Beyond printing (PDF), some workflows need data export:

- **JSON archive** (full patient record for SAR or migration)
- **CSV** (audit log; appointment list; referral list)
- **DICOM** (Phase 2 — for imaging when integrated with PACS)

JSON archive structure:

```json
{
  "export_metadata": {
    "tenant": "Doc For Skin",
    "patient_id": "uuid",
    "exported_at": "2026-05-10T14:32:00Z",
    "exported_by": "Roland Jayasekhar (Caretaker)",
    "export_reason": "Subject Access Request",
    "format_version": "1.0"
  },
  "patient": { /* patient demographics */ },
  "allergies": [...],
  "alerts": [...],
  "feed_entries": [
    /* all feed entries with payloads */
  ],
  "appointments": [...],
  "consultations": [...],
  "letters": [...],
  "documents": [
    /* references to original files; files included in archive ZIP */
  ],
  "audit_log": [
    /* all audit log entries for this patient */
  ]
}
```

The JSON archive is delivered as a ZIP containing the JSON manifest plus all referenced files (PDFs, photos, audio recordings).

### 11.4 The Export Audit

Every export is audit-logged:

- Action type
- What was exported (patient, date range, entry types)
- Who exported it
- Why (reason required)
- Where it was sent (download link, email recipient, etc.)

This is critical for SAR compliance and breach investigation.

### 11.5 The Patient-Initiated Export

Patients can request their own data via patient portal:

- "Download my record" action
- Generates a PDF + JSON archive
- Sent via secure download link (signed URL, 7-day expiry)
- Audit-logged

This satisfies UK GDPR right of subject access without manual processing by clinic staff.

---

## 12. Search Within Documentation

Bible 4.1 §2.1 specified pg_trgm + tsvector. This section operationalises documentation search.

### 12.1 The Search Targets

| Where | Searchable Content |
|---|---|
| Within a single patient's feed | All feed entries' text content (notes, OCR'd text, AI summaries, structured payloads) |
| Across all of a clinician's patients | Same, scoped to their assigned patients |
| Across the entire tenant | Same, Caretaker-only (or specific elevated roles) |
| Custodian cross-tenant | Audit-logged access only |

### 12.2 The Search Index

A materialised tsvector column or per-table indexing:

```sql
-- Already specified in Bible 4.4 §4.1
CREATE INDEX idx_feed_search ON patient_feed_entries USING gin (
  to_tsvector('english', COALESCE(payload->>'text', '') || ' ' ||
              COALESCE(payload->>'title', '') || ' ' ||
              COALESCE(payload->>'ocr_extracted_text', '') || ' ' ||
              COALESCE(payload->>'ai_summary', ''))
);
```

### 12.3 The Patient-Scoped Search

The clinician on a patient page can search within that patient's record:

```
+------------------------------------------------------------------+
|  Search John Smith's record:    [pyelonephritis____]      [🔍]  |
+------------------------------------------------------------------+
|                                                                  |
|  3 results found:                                                |
|                                                                  |
|  📝 Clinical note — 8 May 2026                                    |
|  "...working diagnosis of acute pyelonephritis..."               |
|  → Show full note                                                |
|                                                                  |
|  📋 Lab result — 8 May 2026                                       |
|  "WCC 18.4 elevated; pattern consistent with bacterial..."       |
|  → Show full result                                              |
|                                                                  |
|  📨 Referral letter — 8 May 2026                                 |
|  "Referral to Rheumatology re. acute pyelonephritis..."          |
|  → Show full letter                                              |
|                                                                  |
+------------------------------------------------------------------+
```

Hits are highlighted in context. Click result → navigates to that entry in the feed view.

### 12.4 The Tenant-Wide Search

For Caretakers and elevated roles:

- Search across all patients' records
- Useful for: "Find all patients on warfarin", "Find all aesthetic patients with complications", "Find unactioned referrals"
- Permission required: explicit Caretaker role + audit logging on each tenant-wide search query

### 12.5 The Search Performance

Target: <200ms response for patient-scoped search; <500ms for tenant-wide search.

Achieved via:
- GIN index on tsvector columns
- Tenant-scoped queries (RLS) provide query selectivity
- Result limit (default 50, expandable)
- Search results cached per query for 60 seconds (rare query repetition mitigation)

---

## 13. The Documentation Permissions Matrix

Inherits from Bible 4.4 §13. Documentation-specific capabilities:

| Capability | Custodian | Caretaker | Clinician | Locum | Nurse | Concierge | Cofferer | Patient |
|---|---|---|---|---|---|---|---|---|
| Write clinical note | No | Yes | Yes | Yes | Yes | No | No | No |
| Edit own note (24h) | No | Yes | Yes | Yes | Yes | No | No | No |
| Edit other's note | No | Yes (with reason) | No | No | No | No | No | No |
| Delete note (soft) | No | Yes (with reason) | No | No | No | No | No | No |
| Hard delete (GDPR) | A | Request only | No | No | No | No | No | Request only (own) |
| Upload photo | No | Yes | Yes | Yes | Yes | No | No | Self via portal (Phase 2) |
| Annotate photo | No | Yes | Yes | Yes | Yes (assigned) | No | No | No |
| View photos | A | Yes | Yes (assigned) | Yes | Yes (assigned) | No | No | No (default; Caretaker can grant) |
| Upload document | No | Yes | Yes | Yes | Yes | Yes | No | Yes (review queue) |
| OCR document | A | Yes (auto) | Yes (auto) | Yes (auto) | Yes (auto) | No | No | N/A |
| Manually correct OCR | No | Yes | Yes | Yes | Yes | No | No | No |
| Re-OCR document | No | Yes | Yes | Yes | Yes | No | No | No |
| Save vital signs | No | Yes | Yes | Yes | Yes | No | No | No |
| Save structured form | No | Yes | Yes | Yes | Where allowed | No | No | No |
| Open consultation | No | Yes | Yes | Yes | Yes | No | No | No |
| Close consultation | No | Yes | Yes (own) | Yes (own) | Yes (own) | No | No | No |
| Print feed entry | A | Yes | Yes | Yes | Yes | Yes (with reason) | No | Self only |
| Print patient timeline | A | Yes | Yes | Yes | Yes | No | No | Self only |
| Export patient JSON | A | Yes | No | No | No | No | No | Self only |
| Search within patient | A | Yes | Yes (assigned) | Yes | Yes (assigned) | Yes (demographics only) | No | Self only |
| Search tenant-wide | A | Yes | No | No | No | No | No | No |

A = Audit-logged Custodian elevation pattern.

---

## 14. Per-Tenant Configuration

```json
{
  "clinical_documentation": {
    "note_max_length": 50000,
    "edit_window_hours": 24,
    "auto_save_interval_seconds": 5,
    "markdown_light_enabled": true,
    
    "structured_forms": {
      "vital_signs": { "enabled": true, "auto_calculate_news2": true },
      "specialty_forms": [/* per-specialty list per Bibles 5, 6, future */]
    }
  },
  
  "photography": {
    "default_standard": "single_photo",   // Tenant-wide; per-service may override
    "five_photo_enabled": true,
    "three_photo_enabled": true,
    "camera_capture_enabled": true,
    "mobile_qr_upload_enabled": true,
    "annotation_enabled": true,
    "side_by_side_compare_enabled": true,
    "watermark": {
      "enabled": false,                    // Default off; Doc For Skin enables
      "text": null,
      "position": "bottom_right",
      "opacity": 0.5
    },
    "retention_policy": "indefinite",
    "patient_portal_visibility": "none"   // 'none' | 'after_signoff' | 'always'
  },
  
  "documents": {
    "max_file_size_mb": 50,
    "allowed_formats": ["pdf", "jpg", "png", "heic", "tiff", "doc", "docx", "txt"],
    "ocr_engine": "tesseract",            // 'tesseract' | 'gemma4_multimodal'
    "ocr_auto_run": true,
    "ai_classification_enabled": true,
    "patient_uploads_enabled": true,
    "patient_upload_review_required": true
  },
  
  "consultations": {
    "auto_close_inactive_hours": 4,
    "discharge_summary_auto_generate": true,
    "discharge_summary_delay_minutes": 5,
    "voice_ambient_enabled": false,        // Phase 1.5
    "voice_consent_required": true,
    "audio_retention_days": 30
  }
}
```

---

## 15. Acceptance Criteria for "Documentation Module Is Built"

### 15.1 The Note-Writing Acceptance

- [ ] Bottom-left input field renders correctly with auto-grow
- [ ] Cmd/Ctrl+Enter saves; tab indents; Esc clears with confirmation
- [ ] Auto-save draft works at 5-second interval
- [ ] Draft restored on patient reopen
- [ ] Markdown-light formatting renders correctly
- [ ] Note saves end-to-end in <400ms
- [ ] Real-time broadcast to other open clients on same patient
- [ ] AI receives notes via websocket with debouncing

### 15.2 The Edit Window Acceptance

- [ ] Edits within 24h work
- [ ] Edits after 24h locked (UI prevents)
- [ ] Edit reason required and stored
- [ ] Version history available via "(edited)" link
- [ ] Diff visualisation correct
- [ ] Caretaker override audit-logged with notification to author

### 15.3 The Photo Management Acceptance

- [ ] 5-photo aesthetic standard configurable for tenant
- [ ] Upload from device works
- [ ] Upload from camera works (browser camera API)
- [ ] Upload from mobile via QR works
- [ ] Annotation tools (pin, arrow, circle, text) all functional
- [ ] Watermarking pipeline runs correctly per Caretaker config
- [ ] Carousel viewer works with all 5 angles
- [ ] Side-by-side comparison with previous set works
- [ ] Photos appear correctly in feed
- [ ] Patient portal default visibility = none enforced

### 15.4 The Document Upload Acceptance

- [ ] Drag-and-drop upload works for all supported formats
- [ ] OCR auto-runs for PDF and images
- [ ] AI summary and classification populate
- [ ] Confidence threshold UX correctly differentiates high/medium/low
- [ ] Manual OCR correction works
- [ ] Re-OCR action works
- [ ] Patient-uploaded documents flow through review queue

### 15.5 The Vital Signs Acceptance

- [ ] Form renders correctly with all required fields
- [ ] NEWS2 calculation correct
- [ ] Out-of-range values colour-flagged
- [ ] Save creates feed entry with structured payload
- [ ] Recent vital signs always visible on top strip

### 15.6 The Consultation Lifecycle Acceptance

- [ ] Open consultation generates consultation_id
- [ ] Feed entries during consultation tagged with consultation_id
- [ ] Close consultation triggers discharge summary draft after 5min delay
- [ ] Auto-timeout works at 4h inactivity
- [ ] Statistics computed correctly
- [ ] Linked appointment updates correctly

### 15.7 The Print and Export Acceptance

- [ ] Single feed entry print produces correct PDF
- [ ] Patient timeline print works
- [ ] JSON archive export for SAR works end-to-end
- [ ] Patient-initiated export from portal works
- [ ] All exports audit-logged

### 15.8 The Search Acceptance

- [ ] Within-patient search returns results in <200ms
- [ ] Search hits highlighted in context
- [ ] Tenant-wide search works for Caretakers
- [ ] Tenant-wide search audit-logged

### 15.9 The Operational Acceptance

- [ ] Roland uses the consultation note input for actual consultations
- [ ] Roland uploads aesthetic photo set at Doc For Skin and views carousel
- [ ] At least one document uploaded, OCR'd, and summarised correctly
- [ ] At least one consultation closed and discharge summary auto-generated
- [ ] At least one note edited within window with reason
- [ ] At least one patient SAR processed via JSON export

When all 15.1-15.9 criteria pass, RolDe Phase 1 documentation module is built.

---

## End of Bible 4.6

This is the documentation surface — where clinical reasoning gets recorded, where photos and documents accumulate, where the everything-in-the-feed principle lives in code. Every consultation produces feed entries. Every entry is searchable, editable within window, exportable, printable. Every photo, every document, every note flows through one pipeline and lives in one place.

When in doubt about a documentation decision: does it preserve the patient feed as canonical? Does it earn the clinician's trust through transparency (edit history, audit logs)? Does it serve the constitutional principle that calmness in the working surface is non-negotiable?

The next sub-Bible to draft is **4.7 — RolDe Ambient Clinical AI** (the deepest Bible — Gemma 4 31B fine-tuning pipeline, RAG architecture, the Validated Correction Pipeline, the Custodian Update Console, continuous patient monitoring rules in code, voice ambient AI, and every architectural decision from the AI architecture file).

— Roland Manoj Jayasekhar, with Devipangaj
RoDee, May 2026
