# RolDe — Bible 4.7: Ambient Clinical AI

> *"RolDe drafts everything autonomously. RolDe sends nothing autonomously."* — Bible 4.0 Principle 4
>
> *"Authority comes from sources, not voices."* — Bible 4.0 Principle 3
>
> Version 1.0 | Last Updated: 10 May 2026 | RolDe Ltd | CONFIDENTIAL
>
> Implementation specification for RolDe's clinical AI. Inherits from Bibles 0 v1.2, 4.0, 4.1, 4.2, 4.3, 4.4, 4.5, and 4.6 v1.1.

---

## How to Use This Document

This is the **deepest sub-Bible** in the RolDe family. It covers everything about how RolDe's intelligence works:

- The base model: Gemma 4 31B (Apache 2.0)
- The inference architecture (MLX, Ollama, Cloudflare Tunnel)
- The training data pipeline (the crown jewel — Bible 4.0 Principle 9)
- The fine-tuning pipeline (LoRA on M4 Max, model-agnostic design)
- The RAG architecture (Supabase pgvector + PubMedBERT + NICE/SIGN/eMC corpus)
- The two-layer AI architecture (global LoRA + tenant-specific RAG)
- The per-user personalisation pattern (per-clinician language LoRA adapters)
- The Validated Correction Pipeline (clinician thumbs-down → Custodian review → training data)
- The Custodian Update Console (Roland's AI management surface)
- The continuous patient monitoring service rules in code
- The trigger heuristics for ambient AI behaviours (when does the AI surface a card? When does it draft a discharge summary?)
- The voice ambient AI architecture (Phase 1.5)
- Confidence-aware output (the "I don't know" pattern)
- The agentic boundary in code (drafts everything, sends nothing without approval)
- The shadow-comparison + 30-day rollback protocol for model updates
- The training data sourcing strategy (NICE, SIGN, eMC, BMJ Open, PLOS Medicine, PubMed abstracts)
- The Claude API fallback architecture (Phase 2 premium tier only)

**Loading order for Claude Code sessions**:
1. Bible 0 v1.2 — group defaults (especially §9.7 AI architecture summary)
2. Bible 4.0 — RolDe constitution (especially Principles 3, 4, 5, 9 — AI-relevant)
3. Bible 4.1 — architecture (especially §6 web/AI separation, §1.2 self-hosted intelligence constitution)
4. Bible 4.2 — design system (AI panel, card patterns)
5. Bible 4.3 — multi-tenant foundation (Custodian Update Console placement)
6. Bible 4.4 — core modules (continuous patient monitoring placement, closed-loop referral pipeline)
7. Bible 4.5 — prescribing (drug safety check architecture inherited)
8. Bible 4.6 — clinical documentation (discharge summary trigger interface, voice integration)
9. This Bible 4.7 — AI implementation
10. Bible 4.8 — roadmap (when next)

This Bible is implementation-detailed where it matters and intentionally architectural where Bible 4.7 is the wrong place for code. The fine-tuning pipeline scripts live in the codebase, not in this document. What lives here is the *design* of the pipeline — the schemas, contracts, decision points, and constitutional commitments.

---

## Table of Contents

1. The AI Constitution (RolDe-Specific)
2. The Base Model: Gemma 4 31B (Apache 2.0)
3. The Inference Stack
4. The AI Server Architecture
5. The RAG Architecture
6. The Training Data: The Crown Jewel
7. The Fine-Tuning Pipeline
8. The Two-Layer AI Architecture (Global + Tenant)
9. The Per-User Personalisation
10. The Validated Correction Pipeline
11. The Custodian Update Console
12. The Continuous Patient Monitoring (Implementation)
13. The Ambient AI Trigger Heuristics
14. The Direct Query Architecture
15. The Confidence-Aware Output
16. The Voice Ambient AI (Phase 1.5)
17. The Discharge Summary Drafting Logic
18. The Shadow Comparison and Rollback
19. The Claude API Fallback (Phase 2)
20. The Drug Safety Reasoning
21. The AI Server API Contract
22. The Cost and Performance Budget
23. The Privacy and Data Governance
24. Acceptance Criteria for "Ambient AI Is Built"

---

## 1. The AI Constitution (RolDe-Specific)

Six commitments inherited and locked. Every implementation detail in this Bible derives from these.

### 1.1 Drafts Autonomously, Sends Nothing Autonomously

Bible 4.0 Principle 4 / §4.3. The defining behavioural rule. Drafting is continuous, ambient, ahead-of-the-curve. Transmission requires explicit clinician authorisation. Both halves are absolute.

### 1.2 Authority Comes From Sources, Not Voices

Bible 4.0 Principle 3. Clinical truth comes from authoritative sources (NICE, SIGN, eMC, peer-reviewed evidence). Clinicians use clinical truth; they do not arbitrate it. Tenant-local guidelines inform their own clinic's AI but never propagate globally.

### 1.3 Honest About Uncertainty

Bible 4.0 Principle 5. When RolDe doesn't have a confident answer, it says so plainly, points to authoritative sources, and stays quiet on that aspect. Hallucination is a brand-defining refusal — RolDe prefers honest uncertainty over confident wrong answers, every time.

### 1.4 Training Data Is The Crown Jewel

Bible 4.0 Principle 9. The clinical training corpus accumulated over months and years is RoDee's irreplaceable asset. Models are interchangeable substrates; the data outlives any model choice. Versioned, encrypted, multi-backup, audit-logged, never deleted.

### 1.5 Self-Hosted, Replaceable

Bible 4.1 §1.2 / §1.4. The model runs on infrastructure RoDee Ltd controls. Per-token rental is never the operational model. Every dependency is replaceable — Apache 2.0 base model, open-source frameworks, portable training pipeline.

### 1.6 The Custodian-Only Update Authority

Bible 0 §12.9. Only the Custodian (Roland personally; future RoDee operations team) can promote a fine-tuned model to production. Every promotion is audit-logged. Every promotion is preceded by 48-hour shadow comparison and followed by 30-day rollback window.

These six are the constitutional foundation. The rest of this Bible operationalises them.

---

## 2. The Base Model: Gemma 4 31B (Apache 2.0)

### 2.1 The Choice

**Gemma 4 31B** is the chosen base model. Verified Apache 2.0 licence (Google Open Source Blog, 2 April 2026). Frontier-tier benchmarks running on consumer hardware:

- 89.2% AIME 2026 (mathematical reasoning)
- 84.3% GPQA Diamond (graduate-level science)
- 1,452 ELO LMArena (human preference)
- Strong medical reasoning at zero-shot baseline

The Apache 2.0 licence is the constitutional fact that makes Gemma 4 the right choice over alternatives:

- **No usage restrictions** (vs MedGemma's commercial-use carve-outs that surfaced in April 2025)
- **No revenue-cap clauses** (vs Llama's 700M MAU restriction)
- **No "responsible AI use" subjective gates** (vs many newer model licences with vague terms)
- **Full fine-tuning rights** (no derivative-work restrictions)
- **Full redistribution rights** (we can ship our fine-tuned weights to enterprise customers if needed)

### 2.2 The Quantisation Strategy

Gemma 4 31B at full precision (bf16) requires ~62GB of VRAM. On Roland's M4 Max 48GB MacBook Pro, this won't fit. Quantisation is mandatory.

| Quantisation | VRAM | Quality Loss | Use |
|---|---|---|---|
| bf16 (full precision) | 62GB | None | Reference (cloud GPU only) |
| Q8 | 33GB | <1% on benchmarks | M5 Studio Phase 2 production |
| **Q4_K_M (4-bit)** | **18GB** | **~2% on benchmarks** | **M4 Max Phase 1 production** |
| Q3_K_M | 14GB | ~5% on benchmarks | Last-resort fallback |
| Q2_K | 12GB | >10% — unacceptable for clinical | Never |

**Phase 1 commitment**: Gemma 4 31B at Q4_K_M (4-bit). 18GB VRAM, fits comfortably on M4 Max 48GB with headroom for context window, RAG embeddings, and OS overhead. ~2% quality degradation is acceptable for the cost-saving benefit. Quality is regained at Phase 2 (M5 Studio with more VRAM allowing Q8).

The quantised model file lives at `/Volumes/CrownJewel/models/gemma-4-31b-q4-k-m.gguf` on Roland's M4 Max (encrypted external SSD; constitutional protection per §6.5).

### 2.3 The Context Window

Gemma 4 31B's native context window is 1M tokens (verified at release). RolDe operates well within this:

- A complete consultation with full patient history: ~30k-80k tokens
- A complete clinical reasoning trace with citations: ~10k-15k tokens
- The fine-tuning context for typical training examples: ~5k-15k tokens

Context budget per inference call (target):

| Use Case | Input | Output | Total |
|---|---|---|---|
| Ambient suggestion | ~20k (current consultation + relevant history + RAG) | ~500 | ~21k |
| Direct query | ~5k (question + RAG citations) | ~1k | ~6k |
| Discharge summary draft | ~30k (full consultation + patient context + RAG) | ~2k | ~32k |
| Lab result synthesis | ~10k (results + relevant history + reference ranges) | ~300 | ~10.3k |

Even the largest call uses 3.2% of context budget. We have 30× headroom for future use cases.

### 2.4 The Model File Lifecycle

The base model file is downloaded once and held permanently. New base model versions (Gemma 4.1, Gemma 5) trigger a deliberate evaluation + migration process per the Custodian Update Console (§11), not a casual upgrade.

```
/Volumes/CrownJewel/models/
├── base/
│   ├── gemma-4-31b-q4-k-m.gguf        (Phase 1 production)
│   ├── gemma-4-31b-q8.gguf            (Phase 2 future)
│   └── gemma-4-31b-bf16.gguf          (Reference, optional)
├── lora-adapters/
│   ├── rolde-global-v1.safetensors    (global fine-tune)
│   ├── rolde-global-v2-shadow.safetensors  (under evaluation)
│   ├── tenants/
│   │   ├── docforskin/                (tenant-specific RAG context, not weights)
│   │   ├── docfordrivers/
│   │   └── ...
│   └── users/
│       ├── roland-jayasekhar/         (per-user language LoRA, §9)
│       └── ...
└── checksums.txt                      (SHA-256 for every file; verified on load)
```

### 2.5 The Multimodal Capability

Gemma 4 31B has native multimodal capability (text + image). This unlocks Phase 1.5 features:

- **OCR via Gemma 4 vision** (replacing Tesseract — Bible 4.6 §6)
- **Voice ambient AI** (audio input — Bible 4.6 §9)
- **Photo analysis** (e.g. dermatological lesion description — Bible 6 future)
- **Form extraction** (structured field detection from PDF forms — Bible 4.6 §6.7)

Phase 1 ships text-only. Phase 1.5 enables multimodal once the engineering work is complete (model wrapper updates, audio streaming pipeline, image encoder integration).

---

## 3. The Inference Stack

### 3.1 The Framework: MLX (Production), Ollama (Development)

**MLX** is Apple's purpose-built machine learning framework for Apple Silicon. It:
- Ships native Metal GPU acceleration (no CUDA dependency)
- Runs Gemma 4 31B at Q4_K_M at 25-40 tokens/second on M4 Max (verified benchmark)
- Has direct Hugging Face integration for model loading
- Supports streaming token generation (essential for the AI panel UX)
- Has straightforward Python API (`from mlx_lm import load, generate`)

**Ollama** is the development-environment alternative:
- Single binary, one-command install (`curl -fsSL https://ollama.com/install.sh | sh`)
- HTTP API out of the box (matches our AI server contract — §21)
- Useful for local development, testing, and onboarding new contributors
- Slightly slower than MLX (~20-30 tokens/sec at Q4 on M4 Max)
- Production switches to MLX for the speed gain

### 3.2 The Phase 1 Production Setup

```
┌─────────────────────────────────────────────────────┐
│  Roland's M4 Max MacBook Pro 48GB                   │
│                                                     │
│  ┌─────────────────────────────────────────┐       │
│  │  RolDe AI Server (Python FastAPI)       │       │
│  │  - Receives HTTPS requests              │       │
│  │  - Manages session state                │       │
│  │  - Calls MLX for inference              │       │
│  │  - Streams responses                    │       │
│  └─────────────────────────────────────────┘       │
│                    ↓                                │
│  ┌─────────────────────────────────────────┐       │
│  │  MLX Inference Layer                    │       │
│  │  - Loads Gemma 4 31B Q4_K_M             │       │
│  │  - Loads global LoRA adapter            │       │
│  │  - Loads tenant-specific RAG context    │       │
│  │  - Runs inference                       │       │
│  └─────────────────────────────────────────┘       │
│                    ↓                                │
│  ┌─────────────────────────────────────────┐       │
│  │  Apple Silicon GPU (Metal)              │       │
│  │  - 18GB model in VRAM                   │       │
│  │  - 2-4GB context buffer                 │       │
│  │  - 1GB embedding cache                  │       │
│  └─────────────────────────────────────────┘       │
│                                                     │
└─────────────────────────────────────────────────────┘
                    ↓ Cloudflare Tunnel
                    ↓ ai.rolde.app
                    ↓
              [Web app on Vercel]
```

### 3.3 The Performance Benchmarks (Target)

On M4 Max 48GB at Q4_K_M:

| Metric | Target | Acceptable | Unacceptable |
|---|---|---|---|
| Time to first token | < 400ms | < 800ms | > 1.5s |
| Tokens per second | 25-40 | 20-25 | < 20 |
| RAG retrieval latency | < 200ms | < 500ms | > 1s |
| Total ambient suggestion (input → first token) | < 600ms | < 1.2s | > 2s |
| Total direct query (input → final token) | < 3s for 800-token response | < 5s | > 8s |
| Concurrent active sessions supported | 5 | 3 | < 3 |

The 5-concurrent-session ceiling is M4 Max-bound. Phase 2 M5 Ultra Studio raises this to 20-30 concurrent sessions. Phase 3 UK regulated GPU hosting raises it to hundreds.

### 3.4 The Phase 2 Production Setup

When tenant count or concurrent-session demand exceeds the M4 Max:

```
┌─────────────────────────────────────────────────────┐
│  M5 Ultra Mac Studio (dedicated)                    │
│  - 192GB unified memory (typical configuration)     │
│  - Runs Gemma 4 31B at Q8 (33GB) with full precision│
│  - 80-150 tokens/sec inference speed                │
│  - 20-30 concurrent sessions                        │
│  - 24/7 dedicated server (not Roland's working      │
│    laptop)                                           │
└─────────────────────────────────────────────────────┘
```

Phase 2 cost: ~£3,500-6,000 one-off hardware. Triggers when:
- More than 5 active concurrent clinics, OR
- Roland's M4 Max becoming a development bottleneck (he can't work while AI is busy), OR
- Quality regression noticeable on Q4 (rare; mostly aesthetic)

### 3.5 The Phase 3 Production Setup

UK regulated GPU hosting (CWCS, HOSTKEY UK, Pulsant). Triggers at multi-clinic scaling (~50+ tenants or formal NHS-adjacent contracts requiring data residency commitments). Cost: £300-1,500/month per server. Multi-server load balancing for redundancy.

### 3.6 The Phase 4 NHS-Grade Hosting (Deferred Indefinitely)

NHS DSPT (Data Security and Protection Toolkit) compliance + ISO 27001 certification + clinical governance review. Massive infrastructure investment. Deferred until NHS contracts justify it (and even then, evaluated against Bible 4.0 §4.5's principled deferral of NHS pursuit).

---

## 4. The AI Server Architecture

### 4.1 The Service Boundary

The AI server is a separate service from the web application (Bible 4.1 §6.1). It runs on Roland's M4 Max in Phase 1, exposed via Cloudflare Tunnel at `ai.rolde.app`.

The web app and AI server communicate via:
- **HTTPS REST endpoints** for stateless calls (direct queries, document analysis, lab synthesis)
- **WebSockets** for streaming (ambient session, drafting, voice)
- **Server-Sent Events** for one-way streaming alternatives (where WS overhead isn't justified)

### 4.2 The AI Server Stack

| Layer | Technology |
|---|---|
| Runtime | Python 3.12+ |
| Web framework | FastAPI |
| ASGI server | Uvicorn (production) / Uvicorn with auto-reload (development) |
| Inference | MLX (production) / Ollama (development) |
| Vector retrieval | Supabase pgvector (queried via REST API from AI server) |
| Embeddings | PubMedBERT (loaded as separate small model in MLX) |
| Session state | Redis (Phase 1.5) / in-memory dict (Phase 1) |
| Tunnel | Cloudflared |
| Process management | systemd (Linux future) / launchd plist (macOS Phase 1) |

### 4.3 The Server Process Model

```
ai-server-process (long-running)
├── Main thread: FastAPI/Uvicorn HTTP handler
├── Inference worker thread: MLX model
├── Embedding worker thread: PubMedBERT for query encoding
├── Background tasks:
│   ├── Continuous monitoring runs (every 5 min)
│   ├── Discharge summary background drafting (event-driven)
│   ├── Cache warming (model weights, common RAG queries)
│   └── Metrics emission (every 60 sec to Custodian dashboard)
└── Cleanup hooks (graceful shutdown, save state)
```

The model is loaded once at process start (~30 seconds for cold load). All subsequent inference reuses the loaded weights. Process restart is rare (only for new model deployments, system updates, or recovery).

### 4.4 The Cloudflare Tunnel

Per Bible 4.1 §6.3:

```
ai.rolde.app  →  Cloudflare Tunnel  →  Roland's M4 Max  →  AI Server (port 8000 local)
```

- Cloudflare Tunnel free tier sufficient (no bandwidth limits within fair-use)
- TLS terminated at Cloudflare edge
- Authentication: bearer token in `Authorization` header (not exposed; verified server-side)
- No port-forwarding on Roland's home/office router
- Tunnel auto-restarts on macOS reboot via launchd

### 4.5 The Graceful Degradation

When the AI server is unreachable (tunnel down, M4 Max offline, server crash):

1. Web app detects via health check failures
2. Web app posts banner: *"RolDe is currently offline. Clinical work continues normally; AI suggestions will resume when the service is restored."*
3. All clinical workflows continue without AI (orders manually composed, notes manually typed, letters manually drafted)
4. Background queue accumulates AI tasks (continuous monitoring, document OCR — Phase 1.5 Gemma OCR)
5. When AI server recovers, queue drains; alerts may surface for time-critical events that occurred during downtime

### 4.6 The Health Check

`GET /v1/health` returns:

```json
{
  "status": "healthy",
  "model_loaded": true,
  "model_version": "gemma4-31b-q4km-rolde-global-v3",
  "current_load": 0.34,
  "uptime_seconds": 47892,
  "embedding_service": "ok",
  "rag_corpus_version": "2026-Q2-v1",
  "ai_server_version": "1.4.7"
}
```

Web app polls `/v1/health` every 30 seconds. If three consecutive fails: graceful-degradation banner appears.

---

## 5. The RAG Architecture

Retrieval-Augmented Generation. The architecture that lets Gemma 4 reason against authoritative sources without those sources being baked into the model weights.

### 5.1 The Architecture Overview

```
┌────────────────────────────────────────────────────────────┐
│  Clinical Question / Context                               │
│  (e.g. "patient has sudden-onset L 1st MTP joint pain")   │
└────────────────────────────────────────────────────────────┘
                            ↓
                    [Query Encoding via PubMedBERT]
                            ↓
                    [Top-K Vector Search in pgvector]
                            ↓
            ┌───────────────┴───────────────┐
            ↓                               ↓
    [Global RAG corpus]            [Tenant-specific corpus]
    (NICE/SIGN/eMC etc.)           (Local protocols)
            ↓                               ↓
            └───────────────┬───────────────┘
                            ↓
                [Top results assembled]
                            ↓
                [Prompt construction with citations]
                            ↓
                [Gemma 4 inference with sources]
                            ↓
              [Output with citation references]
```

### 5.2 The Embeddings: PubMedBERT

**PubMedBERT** is a domain-specific embedding model trained on medical text:

- 110M parameters (small, fast)
- Pre-trained on PubMed abstracts + full-text articles
- 768-dimensional embeddings
- Significantly better than general-purpose embeddings (e.g. all-MiniLM) for medical retrieval
- Apache 2.0 licence
- Runs alongside Gemma 4 on M4 Max with negligible overhead

### 5.3 The Vector Storage: Supabase pgvector

```sql
-- Already enabled in Bible 4.1 §3 schema setup
CREATE EXTENSION IF NOT EXISTS vector;

-- Global corpus (RolDe-wide, all tenants share)
CREATE TABLE rag_global_corpus (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  source          TEXT NOT NULL,              -- 'nice_ng109', 'sign_171', 'emc_smpc_metformin', etc.
  source_section  TEXT,                       -- 'recommendation_1.2', 'contraindications', etc.
  source_url      TEXT,                       -- Citation link
  source_published_at  DATE,
  source_version  TEXT,                       -- 'NICE NG109 v3.0 (April 2026)'
  
  document_text   TEXT NOT NULL,              -- The retrievable chunk
  document_title  TEXT NOT NULL,              -- Human-readable title
  
  -- Embeddings
  embedding       vector(768) NOT NULL,       -- PubMedBERT 768-dim
  
  -- Categorisation
  domain          TEXT[],                     -- ['cardiology', 'general_practice'] etc.
  evidence_level  TEXT,                       -- 'guideline', 'systematic_review', 'cohort_study', etc.
  
  -- Lifecycle
  ingested_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  superseded_at   TIMESTAMPTZ,                -- When a newer version supersedes this chunk
  superseded_by_id UUID REFERENCES rag_global_corpus(id)
);

CREATE INDEX idx_rag_global_embedding ON rag_global_corpus USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_rag_global_active ON rag_global_corpus(domain) WHERE superseded_at IS NULL;
CREATE INDEX idx_rag_global_source ON rag_global_corpus(source) WHERE superseded_at IS NULL;

-- Tenant-specific corpus (local protocols uploaded by Steward)
CREATE TABLE rag_tenant_corpus (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  source          TEXT NOT NULL,              -- 'edinburgh_local_antibiotics_2026'
  source_uploaded_by  UUID REFERENCES auth.users(id),
  source_uploaded_at  TIMESTAMPTZ,
  
  document_text   TEXT NOT NULL,
  document_title  TEXT NOT NULL,
  
  embedding       vector(768) NOT NULL,
  
  status          TEXT NOT NULL DEFAULT 'active',
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rag_tenant_embedding ON rag_tenant_corpus USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_rag_tenant_active ON rag_tenant_corpus(tenant_id) WHERE status = 'active';
```

### 5.4 The Query Pattern

```python
# AI server-side retrieval logic (simplified)

async def retrieve_for_query(query_text: str, tenant_id: str, top_k: int = 8) -> list[Citation]:
    # 1. Encode the query
    query_embedding = pubmedbert.encode(query_text)  # ~768-dim vector
    
    # 2. Retrieve from global corpus (top 5)
    global_results = await supabase.rpc('match_global_rag', {
        'query_embedding': query_embedding.tolist(),
        'match_count': 5,
        'similarity_threshold': 0.75,
    })
    
    # 3. Retrieve from tenant-specific corpus (top 3)
    tenant_results = await supabase.rpc('match_tenant_rag', {
        'query_embedding': query_embedding.tolist(),
        'match_count': 3,
        'similarity_threshold': 0.70,
        'tenant_id': tenant_id,
    })
    
    # 4. Merge and rank
    citations = merge_and_rank(global_results, tenant_results)
    
    # 5. Return top_k unified results
    return citations[:top_k]
```

### 5.5 The Citation Provenance

Every chunk in `rag_global_corpus` and `rag_tenant_corpus` carries full provenance: source, section, URL, version, published date. When the AI surfaces a suggestion, it includes citation references that map back to specific chunks in the corpus, traceable to specific sentences in specific guidelines.

The clinician can click any citation in the AI panel card to see:
- The exact source document
- The exact section quoted
- The publication date
- A link to the original (where available)

This transparency is constitutional. The clinician verifies the AI's reasoning by verifying the AI's sources.

### 5.6 The Hybrid Search

Pure semantic similarity (vector search) sometimes misses exact-term queries (e.g. drug names). RolDe uses **hybrid search**: combines vector similarity with full-text PostgreSQL search.

```python
async def hybrid_retrieve(query_text: str, tenant_id: str, top_k: int = 8):
    # Vector search results
    vector_results = await retrieve_for_query(query_text, tenant_id, top_k=top_k)
    
    # Full-text search results
    fulltext_results = await supabase.rpc('fulltext_search_rag', {
        'query_text': query_text,
        'tenant_id': tenant_id,
        'match_count': top_k,
    })
    
    # Reciprocal rank fusion
    return reciprocal_rank_fusion(vector_results, fulltext_results, k=60)
```

This catches both "patient with elevated liver enzymes" (semantic) and "metformin contraindications" (lexical) effectively.

---

## 6. The Training Data: The Crown Jewel

Bible 4.0 Principle 9. The most consequential commitment in this Bible.

### 6.1 The Constitutional Status

Training data is **the** RoDee competitive moat. Models are interchangeable substrates — Gemma 4 today, possibly Gemma 5 in 2027, possibly something better in 2028. The data outlives all of them.

This means:
- Training data is **versioned** (every accepted training example tagged with version, source, validator)
- Training data is **encrypted at rest** (per-corpus encryption keys held in Supabase Vault)
- Training data is **multi-backup** (live at Supabase + nightly backup to encrypted cloud + monthly offline backup to encrypted external SSD)
- Training data is **audit-logged** (every access by Custodian recorded)
- Training data is **never deleted** (even rejected examples retained for analysis; corrections layered over rather than replacing)

### 6.2 The Training Corpus Structure

```sql
CREATE TYPE training_example_source AS ENUM (
  'guideline_extraction',     -- From NICE/SIGN/eMC
  'literature_extraction',    -- From peer-reviewed papers
  'clinician_correction',     -- From Validated Correction Pipeline (§10)
  'expert_curation',          -- Hand-written by Roland or future clinical team
  'consultation_redaction',   -- Anonymised real consultations (rare; high scrutiny)
  'synthetic_generation'      -- AI-generated then expert-validated
);

CREATE TYPE training_example_status AS ENUM (
  'proposed',          -- New example awaiting Custodian review
  'approved',          -- Custodian-approved; in active corpus
  'rejected',          -- Custodian-rejected; reason recorded
  'superseded'         -- Newer example replaces this one
);

CREATE TABLE training_examples (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Provenance
  source_type           training_example_source NOT NULL,
  source_origin         TEXT,                        -- 'NICE NG109', 'consultation correction id-xyz'
  source_provenance     JSONB NOT NULL,              -- Full traceability: who, when, what
  
  -- Content
  prompt                TEXT NOT NULL,                -- The clinical scenario / question
  expected_response     TEXT NOT NULL,                -- The ideal response
  rationale             TEXT,                         -- Why this is the correct response
  citations             JSONB NOT NULL DEFAULT '[]',  -- Sources backing the response
  
  -- Categorisation
  domain                TEXT[] NOT NULL,              -- ['rheumatology', 'gout']
  difficulty            TEXT,                         -- 'common', 'edge_case', 'rare'
  
  -- Lifecycle
  status                training_example_status NOT NULL DEFAULT 'proposed',
  proposed_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  proposed_by           UUID REFERENCES auth.users(id),
  
  reviewed_at           TIMESTAMPTZ,
  reviewed_by           UUID REFERENCES auth.users(id),  -- Custodian
  review_notes          TEXT,
  
  superseded_by_id      UUID REFERENCES training_examples(id),
  superseded_at         TIMESTAMPTZ,
  
  -- Versioning (for reproducibility of fine-tuning runs)
  added_to_corpus_version TEXT,                       -- 'corpus_v3.2' if approved
  
  -- Encryption
  encrypted             BOOLEAN NOT NULL DEFAULT true,
  encryption_key_id     TEXT NOT NULL,                -- Reference to Supabase Vault
  
  -- Audit
  access_count          INTEGER NOT NULL DEFAULT 0,
  last_accessed_at      TIMESTAMPTZ,
  
  CONSTRAINT no_self_supersede CHECK (id != superseded_by_id)
);

CREATE INDEX idx_training_status ON training_examples(status, proposed_at);
CREATE INDEX idx_training_domain ON training_examples USING gin(domain) WHERE status = 'approved';
CREATE INDEX idx_training_corpus_version ON training_examples(added_to_corpus_version) WHERE status = 'approved';

-- RLS: only Custodian can access
ALTER TABLE training_examples ENABLE ROW LEVEL SECURITY;

CREATE POLICY custodian_only ON training_examples
  FOR ALL
  USING (EXISTS (SELECT 1 FROM custodian_users WHERE user_id = auth.uid() AND can_access_training_data = true));
```

### 6.3 The Corpus Versions

Each fine-tuning run uses a specific corpus version. The corpus version is a snapshot:

```sql
CREATE TABLE corpus_versions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_label     TEXT NOT NULL UNIQUE,           -- 'corpus_v3.2'
  
  -- What's in this version
  example_count     INTEGER NOT NULL,
  domain_coverage   JSONB NOT NULL,                  -- Counts per domain
  
  -- Snapshot
  example_ids       UUID[] NOT NULL,                 -- Frozen list of example IDs
  
  -- Metadata
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by        UUID NOT NULL REFERENCES auth.users(id),
  notes             TEXT
);
```

When a fine-tuning run starts, it freezes the current state of approved examples into a new corpus version. Reproducible: any past fine-tune can be exactly recreated by training against the corresponding corpus version.

### 6.4 The Sourcing Strategy

| Source | Method | Volume | Phase |
|---|---|---|---|
| **NICE guidelines** | Web scraping (free, scrapeable) | ~1,500 guidelines | Phase 1 |
| **SIGN guidelines** | Web scraping (free, scrapeable) | ~150 guidelines | Phase 1 |
| **eMC SmPCs** | Web scraping (free, scrapeable) | ~15,000 drugs | Phase 1 |
| **BMJ Open** | Open access journal | ~10k articles/year | Phase 1.5 |
| **PLOS Medicine** | Open access journal | ~500 articles/year | Phase 1.5 |
| **PubMed abstracts** | Free, scrapeable; full text often paywalled | Millions of abstracts | Phase 1.5 |
| **Cochrane Library abstracts** | Free; full text limited | ~10k systematic reviews | Phase 2 |
| **Validated corrections** | Internal Validated Correction Pipeline (§10) | Grows weekly | Phase 1 onward |
| **Expert curation** | Roland-written examples filling gaps | Bespoke | Phase 1 |

### 6.5 The Backup Strategy

Per Bible 4.1 §14.1:

| Backup Tier | What | Frequency | Retention |
|---|---|---|---|
| **Live primary** | Supabase production database | Continuous | Forever |
| **Live secondary** | Supabase point-in-time recovery | 7-day window | 30 days |
| **Cloud encrypted** | Encrypted to S3-compatible UK-based service | Nightly | 1 year |
| **Offline encrypted** | Encrypted external SSD held at Roland's primary location | Monthly | Forever (rotated stock) |
| **Geographic redundancy** | Encrypted external SSD held at separate physical location | Quarterly | Forever (rotated stock) |

Three-of-five backup tiers must be available before training-data write operations are allowed. If backup integrity check fails, training data writes pause; Custodian alerted.

### 6.6 The Data Quality Standards

Before any example enters `status='approved'`:

1. **Citation requirement**: every example must reference at least one authoritative source
2. **Rationale requirement**: every example must include the reasoning, not just the answer
3. **Domain tag**: at least one domain tag, max five
4. **Custodian review**: only the Custodian (Roland) can approve via Custodian Update Console (§11)
5. **Conflict detection**: if a new example conflicts with an existing approved example, both are flagged for resolution before either is accepted

---

## 7. The Fine-Tuning Pipeline

The pipeline that takes the base Gemma 4 31B + the approved training corpus and produces a RolDe-specific fine-tuned model.

### 7.1 The Method: LoRA

**LoRA (Low-Rank Adaptation)** is the chosen fine-tuning method:

- Trains a small adapter (~50-200MB) that augments the base model
- Doesn't modify the base 31B weights — adapter is layered at inference time
- Trains in hours, not days
- Multiple adapters can be loaded for different purposes (global RolDe + per-user, §9)
- Reversible: drop the adapter to revert to base model behaviour

```python
# Pipeline pseudocode (real implementation in /infrastructure/finetuning/)

from mlx_lm import load, generate
from mlx_lm.tuner import LoRA

def fine_tune_global_lora(corpus_version: str) -> str:
    # Load base model
    base_model = load("/Volumes/CrownJewel/models/base/gemma-4-31b-q4-k-m.gguf")
    
    # Load training examples for this corpus version
    examples = load_training_examples(corpus_version=corpus_version)
    
    # Format examples for fine-tuning
    formatted = [format_example(ex) for ex in examples]
    
    # Configure LoRA
    lora_config = LoRA(
        rank=16,
        alpha=32,
        target_modules=["q_proj", "v_proj", "k_proj", "o_proj"],
    )
    
    # Train
    trained_adapter = train(
        model=base_model,
        lora_config=lora_config,
        training_data=formatted,
        epochs=3,
        learning_rate=2e-4,
        batch_size=8,
    )
    
    # Save adapter
    output_path = f"/Volumes/CrownJewel/models/lora-adapters/rolde-global-{corpus_version}.safetensors"
    save_adapter(trained_adapter, output_path)
    
    return output_path
```

### 7.2 The Pipeline Inputs

A fine-tuning run accepts these parameters:

```typescript
interface FineTuningRunInput {
  base_model: 'gemma-4-31b-q4km';      // Replaceable; pipeline is model-agnostic
  corpus_version: string;                // 'corpus_v3.2'
  training_examples_id_list: string[];   // Frozen at run start
  
  hyperparameters: {
    rank: number;                        // Default 16
    alpha: number;                       // Default 32
    learning_rate: number;               // Default 2e-4
    epochs: number;                      // Default 3
    batch_size: number;                  // Default 8
  };
  
  evaluation_set_id: string;             // Held-out set for scoring
  
  triggered_by: string;                  // User ID of Custodian
  trigger_reason: string;                // 'Quarterly retraining', 'Bug fix for diabetes management', etc.
}
```

### 7.3 The Pipeline Outputs

A successful fine-tuning run produces:

```typescript
interface FineTuningRunOutput {
  run_id: string;                          // UUID
  output_adapter_path: string;             // Saved file path
  output_adapter_size_bytes: number;
  output_adapter_checksum: string;         // SHA-256
  
  metrics: {
    final_training_loss: number;
    final_validation_loss: number;
    eval_set_score: number;                // % correct on held-out set
    eval_set_safety_score: number;         // Specific safety-test score
  };
  
  training_duration_seconds: number;
  
  status: 'success' | 'failed';
  failure_reason?: string;
}
```

### 7.4 The Pipeline Schema

```sql
CREATE TABLE fine_tuning_runs (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Configuration
  base_model                  TEXT NOT NULL,
  corpus_version              TEXT NOT NULL REFERENCES corpus_versions(version_label),
  hyperparameters             JSONB NOT NULL,
  evaluation_set_id           TEXT NOT NULL,
  
  -- Trigger
  triggered_by                UUID NOT NULL REFERENCES auth.users(id),
  trigger_reason              TEXT,
  
  -- Execution
  status                      TEXT NOT NULL DEFAULT 'queued',  -- 'queued' | 'running' | 'success' | 'failed'
  started_at                  TIMESTAMPTZ,
  completed_at                TIMESTAMPTZ,
  
  -- Output
  output_adapter_path         TEXT,
  output_adapter_size_bytes   BIGINT,
  output_adapter_checksum     TEXT,
  
  -- Metrics
  final_training_loss         DECIMAL,
  final_validation_loss       DECIMAL,
  eval_set_score              DECIMAL,
  eval_set_safety_score       DECIMAL,
  
  -- Failure
  failure_reason              TEXT,
  
  -- Lifecycle
  promoted_to_production_at   TIMESTAMPTZ,
  rolled_back_at              TIMESTAMPTZ,
  
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_finetuning_status ON fine_tuning_runs(status);
CREATE INDEX idx_finetuning_corpus ON fine_tuning_runs(corpus_version);
```

### 7.5 The Evaluation Set (Held Independently)

Per Bible 0 §9.7 operational principle 3: the evaluation set is held independently and **never used in training**.

The evaluation set is a curated set of clinical scenarios designed to:
- Cover the full domain breadth (cardiology, GP, aesthetics, etc.)
- Include known difficult cases (edge cases, rare presentations)
- Test the safety boundaries (when should the AI say "I don't know"?)
- Test the citation accuracy (does the AI cite the right sources?)

```sql
CREATE TABLE evaluation_examples (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  scenario          TEXT NOT NULL,
  expected_behaviour JSONB NOT NULL,        -- Structured expectation: response should X, not Y
  scoring_criteria  JSONB NOT NULL,         -- How to grade
  
  domain            TEXT[] NOT NULL,
  difficulty        TEXT NOT NULL,
  category          TEXT NOT NULL,           -- 'differential', 'prescribing', 'safety', 'i_dont_know'
  
  -- Provenance
  curated_by        UUID NOT NULL REFERENCES auth.users(id),
  curated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Quality control
  reviewed_by       UUID,                    -- Independent reviewer
  reviewed_at       TIMESTAMPTZ,
  
  -- Critically: this set NEVER feeds training
  status            TEXT NOT NULL DEFAULT 'active'
);
```

A fine-tuning run scores against this set after training. If `eval_set_score` falls below threshold (e.g. < 90% correct), the run is flagged for Custodian review before any consideration of promotion.

### 7.6 The Pipeline Reproducibility

Every fine-tuning run records:
- Exact corpus version used (frozen list of training_example IDs)
- Exact hyperparameters
- Exact evaluation set used
- Exact base model checksum
- Exact MLX/library versions

Any past fine-tune can be reproduced exactly. This matters for clinical governance — if a model behaves unexpectedly in production, we can rebuild the same model and analyse its behaviour systematically.

---

## 8. The Two-Layer AI Architecture (Global + Tenant)

Per Bible 0 §12.9 / Bible 4.0 §10.1: clinics have local protocols that inform their AI but never propagate to the global model.

### 8.1 The Architectural Separation

```
                        ┌─────────────────────────┐
                        │   Gemma 4 31B (base)    │
                        │   Apache 2.0 weights    │
                        │   Same for all tenants  │
                        └─────────────────────────┘
                                    +
                        ┌─────────────────────────┐
                        │   Global LoRA           │
                        │   Trained on RolDe      │
                        │   approved corpus       │
                        │   Same for all tenants  │
                        └─────────────────────────┘
                                    +
              ┌─────────────────────┴─────────────────────┐
              ↓                                            ↓
    ┌──────────────────┐                       ┌──────────────────┐
    │ Tenant A RAG     │                       │ Tenant B RAG     │
    │ (their local     │                       │ (their local     │
    │  protocols only) │                       │  protocols only) │
    └──────────────────┘                       └──────────────────┘
              ↓                                            ↓
    [Inference for Tenant A]                  [Inference for Tenant B]
```

The base model + global LoRA are **shared across all tenants**. The differentiation between tenants is in the RAG layer — tenant-specific context gets retrieved and injected into the prompt at inference time.

### 8.2 Why Not Per-Tenant LoRA Adapters

Considered alternative: each tenant gets their own LoRA adapter trained on their local protocols. Rejected because:

1. **Training cost** — fine-tuning a LoRA adapter takes hours on M4 Max; doing this per-tenant doesn't scale
2. **Quality risk** — small tenant corpora produce poor LoRA training (<100 examples is insufficient)
3. **Maintenance burden** — every base model update requires retraining every tenant adapter
4. **Constitutional risk** — tenant data going through the training pipeline blurs the global/local separation

The RAG-only-tenant-customisation approach gives us:
- Tenant local protocols influence behaviour (via RAG retrieval injection)
- No tenant data ever influences global model weights
- Easy to add/remove tenant protocols (just edit the `rag_tenant_corpus` table)
- Constitutional clarity (Bible 4.0 §10.1 — never propagate)

### 8.3 The Inference-Time Composition

```python
# AI server inference logic (simplified)

async def generate_clinical_response(
    query: str,
    tenant_id: str,
    user_id: str,
    consultation_context: dict,
) -> Response:
    # 1. Retrieve relevant context from BOTH global and tenant corpora
    citations = await hybrid_retrieve(query, tenant_id, top_k=8)
    
    # 2. Construct prompt with citations and consultation context
    prompt = build_prompt(
        query=query,
        consultation_context=consultation_context,
        citations=citations,
        user_personalisation=await get_user_personalisation(user_id),
    )
    
    # 3. Run inference with model + global LoRA
    response = await run_inference(
        model=base_model_with_global_lora,
        prompt=prompt,
        max_tokens=2000,
        temperature=0.3,  # Conservative for clinical
    )
    
    # 4. Post-process: enforce citation requirements
    response = enforce_citation_compliance(response, citations)
    
    # 5. Return with metadata
    return Response(
        content=response.text,
        citations=response.citations,
        confidence=response.confidence,
        sources_consulted=citations,
    )
```

### 8.4 The Tenant Protocol Upload Flow

When a Steward uploads a local protocol (Bible 4.3 §5.10):

1. Document uploaded to `tenant-private` bucket
2. OCR + text extraction (per Bible 4.6 §6)
3. Document chunked into ~500-token segments
4. Each chunk embedded via PubMedBERT
5. Chunks inserted into `rag_tenant_corpus` with tenant_id scoping
6. RLS ensures only this tenant's queries retrieve these chunks
7. Steward sees confirmation: *"Protocol available to your clinic's AI within 5 minutes"*

The protocol begins influencing this tenant's AI suggestions immediately. It does NOT trigger any training, model update, or change to other tenants.

### 8.5 The Tenant Protocol Conflicts With Global

When a tenant's local protocol contradicts the global corpus (e.g. tenant uses different first-line antibiotic), the AI surfaces both:

```
+-----------------------------------------+
|  [Rx] Suggestion                         |
+-----------------------------------------+
|                                         |
|  For acute bacterial UTI, your clinic   |
|  protocol recommends Trimethoprim 200mg |
|  BD for 3 days.                         |
|                                         |
|  National NICE guidance (NG109)         |
|  suggests Nitrofurantoin 100mg BD for   |
|  3 days as first-line.                  |
|                                         |
|  Your clinic's protocol takes priority  |
|  here per Steward configuration.        |
|                                         |
|  Sources:                                |
|  • Edinburgh local antibiotic protocol  |
|    2026 (your clinic)                   |
|  • NICE NG109 (national)                |
|                                         |
+-----------------------------------------+
|  [Add to plan]  [Expand]  [👍 👎]        |
+-----------------------------------------+
```

The clinician chooses. Both sources cited transparently. No silent override.

---

## 9. The Per-User Personalisation

Per Cluster D3 / Bible 4.0 §9.8: RolDe learns each individual clinician's language patterns over time.

### 9.1 The Pattern: Per-User Lightweight LoRA

A per-user LoRA adapter, separate from the global LoRA, captures personal language preferences:

- Phrasing patterns ("On examination..." vs "O/E...")
- Letter conclusions ("Many thanks for your continued involvement..." vs "Yours sincerely...")
- Preferred terminology ("hypertension" vs "high blood pressure")
- Specialty-specific jargon

This is a **language LoRA**, not a clinical LoRA. It does NOT change clinical reasoning — only how the AI phrases content for that specific clinician.

### 9.2 The Training Trigger

A per-user LoRA is trained when the clinician has accumulated a corpus of their own writing:

- Threshold: 100+ approved-and-edited AI drafts (so we have paired AI-original-vs-clinician-edited examples)
- OR threshold: 50+ wholly clinician-written letters/notes captured for personalisation

Below threshold: clinician uses the global LoRA only. The AI's drafted letters use a neutral RolDe house style.

### 9.3 The Per-User LoRA Schema

```sql
CREATE TABLE user_language_loras (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL UNIQUE REFERENCES auth.users(id),
  tenant_id             UUID NOT NULL REFERENCES tenants(id),
  
  -- Adapter
  adapter_path          TEXT NOT NULL,           -- File path to adapter file
  adapter_size_bytes    BIGINT NOT NULL,
  adapter_checksum      TEXT NOT NULL,
  
  -- Training
  training_corpus_size  INTEGER NOT NULL,         -- How many examples trained on
  trained_at            TIMESTAMPTZ NOT NULL,
  trained_from_examples_count INTEGER NOT NULL,
  
  -- Lifecycle
  status                TEXT NOT NULL DEFAULT 'active',
  
  -- Re-training trigger
  last_retrained_at     TIMESTAMPTZ,
  retraining_threshold  INTEGER NOT NULL DEFAULT 50,  -- Retrain after 50 new examples accumulate
  
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- The user's personal training examples (paired AI-draft vs user-edit pairs)
CREATE TABLE user_language_examples (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  
  -- The pair
  ai_original     TEXT NOT NULL,              -- What the AI drafted
  user_edited     TEXT NOT NULL,              -- What the user committed
  
  -- Context
  document_type   TEXT NOT NULL,              -- 'referral_letter', 'discharge_summary', 'note'
  source_letter_id UUID,                       -- Link to the original
  
  -- Lifecycle
  used_in_training BOOLEAN NOT NULL DEFAULT false,
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 9.4 The Per-User Inference

When inferring for a user with an active personal LoRA:

```python
async def generate_with_personalisation(query: str, user_id: str, ...):
    # Load both LoRAs into the same model
    model = base_model_with_global_lora
    user_lora = await load_user_lora(user_id)
    
    if user_lora:
        # Composition: global LoRA + user LoRA both active
        model = model.with_additional_lora(user_lora, scale=0.5)
    
    response = await run_inference(model, prompt, ...)
    return response
```

The user LoRA scale of 0.5 prevents the personal LoRA from dominating clinical reasoning. The global LoRA still drives the *what*; the user LoRA shapes the *how*.

### 9.5 The Privacy Commitment

The per-user LoRA contains the clinician's writing style. This is sensitive:

- **Adapter encrypted at rest** (per-user encryption key)
- **Adapter never shared between users**
- **Adapter never used by other AI inferences** (e.g. when continuous monitoring runs, it uses global LoRA only)
- **Adapter deleted on user account deletion** (full cleanup)

Per-user training examples (`user_language_examples`) are similarly encrypted and user-scoped. Deletion is honoured — once a user requests their data deletion, both the LoRA and the training examples are removed.

---

## 10. The Validated Correction Pipeline

Per Bible 4.0 §4.4 / Principle 3. The most architecturally consequential safety mechanism in RolDe.

### 10.1 The Constitutional Frame

> *"When a clinician corrects a RolDe AI suggestion, the correction does NOT become training data immediately. It enters a validation queue requiring source-backing AND Custodian review before it can ever influence the model."*

Three principles operationalised:
1. Authority comes from sources, not individual clinicians
2. Custodian review is the ONLY path to training data promotion
3. Disagreements become learning opportunities, not contamination

### 10.2 The Pipeline

```
[Clinician thumbs-down on AI suggestion card]
                    ↓
[Correction submission modal opens]
                    ↓
[Clinician explains: what was wrong, what should it have said, why]
                    ↓
[AI extracts: anonymised case context, original suggestion, clinician's correction]
                    ↓
[Submission lands in correction_queue table]
                    ↓
[Clinician sees: "Submitted for Custodian review. Thank you."]
                    ↓
─────────────────────────────────────────────────
                    ↓
[Custodian opens Correction Queue in Custodian admin]
                    ↓
[For each submission:]
  ├─ Reviews the case context (anonymised)
  ├─ Reviews the original AI suggestion
  ├─ Reviews the clinician's correction
  ├─ Searches authoritative sources to verify the correction
  ├─ Decides:
  │   ├─ Accept → creates training_example with status='approved'
  │   ├─ Reject (clinician was wrong) → notifies clinician with explanation
  │   ├─ Partial accept → creates training_example with refined version
  │   └─ Defer (need more research) → keeps in queue with notes
  └─ Decision audit-logged
                    ↓
[If accepted:]
  ├─ training_example added to current corpus
  ├─ At next quarterly fine-tuning, included in training data
  └─ AI behaviour improves (or future evaluation set tests confirm)
```

### 10.3 The Schema

```sql
CREATE TYPE correction_status AS ENUM (
  'submitted',         -- Clinician submitted; awaiting Custodian
  'in_review',         -- Custodian opened
  'accepted',          -- Custodian accepted; training_example created
  'partial_accepted',  -- Custodian accepted with refinement
  'rejected',          -- Custodian rejected
  'deferred'           -- Awaiting more information
);

CREATE TABLE correction_queue (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Origin
  tenant_id             UUID NOT NULL REFERENCES tenants(id),  -- Source tenant for context
  submitted_by          UUID NOT NULL REFERENCES auth.users(id),
  submitted_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- The case (anonymised)
  case_context          TEXT NOT NULL,           -- The clinical scenario, no patient identifiers
  original_ai_suggestion TEXT NOT NULL,
  clinician_correction  TEXT NOT NULL,
  clinician_reasoning   TEXT,                    -- Why the AI was wrong
  
  -- Anonymisation guarantee
  contains_phi          BOOLEAN NOT NULL DEFAULT false,  -- AI checks; if true, blocked
  anonymisation_method  TEXT,                    -- 'ai_redaction_v1' for traceability
  
  -- Custodian review
  status                correction_status NOT NULL DEFAULT 'submitted',
  reviewed_by           UUID REFERENCES auth.users(id),
  reviewed_at           TIMESTAMPTZ,
  review_decision       TEXT,
  review_reasoning      TEXT,
  
  -- If accepted
  resulting_training_example_id UUID REFERENCES training_examples(id),
  
  -- Notification
  clinician_notified_at TIMESTAMPTZ
);

CREATE INDEX idx_correction_queue_status ON correction_queue(status, submitted_at);
```

### 10.4 The Anonymisation Step

When a clinician submits a correction, the AI strips identifying information automatically:

- Names → `[Patient Name]`
- DOB → `[Date of Birth]`
- NHS number → `[NHS Number]`
- Specific dates → `[Date]`
- Locations → `[Location]`

The anonymised version is what enters the queue. The original case remains in the patient's record (not modified) but never enters the correction queue or training data.

If the AI's anonymiser cannot confidently identify all PHI (Protected Health Information), the submission is blocked with: *"Unable to fully anonymise this case. Submission requires manual anonymisation."*

### 10.5 The Custodian Review Interface

In the Custodian admin (Bible 4.3 §6.3) at `rolde.app/custodian/correction-queue`:

```
+------------------------------------------------------------------+
|  CORRECTION QUEUE                                          (12)  |
+------------------------------------------------------------------+
|                                                                  |
|  PENDING REVIEW (12)                                              |
|                                                                  |
|  ┌──────────────────────────────────────────────────────────┐    |
|  │ Submitted: 9 May 2026 by Dr Sarah Davies (Doc For Skin)  │    |
|  │                                                           │    |
|  │ Case context:                                             │    |
|  │ Patient with eGFR 47 prescribed Cephalexin 500mg TDS      │    |
|  │                                                           │    |
|  │ AI suggestion:                                            │    |
|  │ "Standard dose appropriate"                               │    |
|  │                                                           │    |
|  │ Clinician correction:                                     │    |
|  │ "Should recommend dose reduction to 500mg BD per          │    |
|  │  cephalexin SmPC for eGFR 30-49"                          │    |
|  │                                                           │    |
|  │ Clinician reasoning:                                      │    |
|  │ "Renal dose adjustment was missed"                        │    |
|  │                                                           │    |
|  │ [Verify source] [Accept] [Reject] [Defer] [Notes]         │    |
|  └──────────────────────────────────────────────────────────┘    |
|                                                                  |
|  [11 more pending...]                                             |
+------------------------------------------------------------------+
```

The "Verify source" button does an inline RAG query against the authoritative sources. Custodian sees the relevant SmPC section. Decision becomes evidence-backed.

### 10.6 The Notification Loop

When the Custodian decides:

| Decision | Clinician Sees |
|---|---|
| Accept | "Your correction was incorporated. Thank you for improving RolDe." |
| Partial accept | "Your correction was partially accepted with refinement. See [details]." |
| Reject | "Your correction was reviewed but not accepted. Reasoning: [Custodian's notes]." |
| Defer | (No notification yet; pending) |

This closes the loop. The clinician knows their input mattered (or knows why it didn't). The system improves transparently.

### 10.7 The Anti-Pattern: Direct Training Data Mutation

The pipeline explicitly prevents this anti-pattern:

> *"Clinician thumbs-down → automatic training data update."*

This would corrupt the training corpus with clinician disagreements that may themselves be wrong. The Validated Correction Pipeline ensures every training data update is source-verified by the Custodian before any model retraining incorporates it.

### 10.8 The Constitutional Reminder

This pipeline is constitutional. It is not a feature. It is the implementation of Bible 4.0 Principle 3.

If a future contributor proposes "automatic incorporation of clinician corrections into training data for faster improvement" — the answer is **no**, with reference to this section. The pipeline is the safety architecture; bypassing it bypasses the safety.

---

## 11. The Custodian Update Console

Roland's surface for managing the AI. Lives at `rolde.app/custodian/ai`.

### 11.1 The Pages

```
rolde.app/custodian/ai/                      (overview)
rolde.app/custodian/ai/models                (base models, LoRAs, version history)
rolde.app/custodian/ai/corpus                (training corpus management)
rolde.app/custodian/ai/correction-queue      (Validated Correction Pipeline review — §10.5)
rolde.app/custodian/ai/guideline-gaps        (gaps log — when AI says "I don't know")
rolde.app/custodian/ai/evaluation            (evaluation set, fine-tune scoring)
rolde.app/custodian/ai/fine-tuning           (run a new fine-tune)
rolde.app/custodian/ai/promotions            (model promotions, shadow comparisons, rollbacks)
rolde.app/custodian/ai/rag-corpus            (global RAG corpus management; ingestion logs)
rolde.app/custodian/ai/update-notes          (publish RolDe Update Notes)
```

### 11.2 The Overview Page

```
RolDe AI MANAGEMENT                                  10 May 2026

CURRENT PRODUCTION MODEL
  Base:           Gemma 4 31B Q4_K_M
  Global LoRA:    rolde-global-v3.2 (deployed 12 Apr 2026)
  Eval score:     94.2% (held-out set)
  Safety score:   98.1%
  Active since:   28 days
  Status:         Stable
  
RECENT ACTIVITY
  ├── 23 corrections received this week (12 pending review)
  ├── 0 critical alerts triggered
  ├── 142,000 ambient suggestions surfaced this week
  ├── 87% of suggestions promoted to notes
  └── 0.3% suggestions thumbs-down'd
  
PIPELINE
  Training corpus:    14,732 approved examples
  Recent additions:   31 examples added this month
  Next planned run:   1 June 2026 (quarterly)
  
GUIDELINE GAPS
  This month: 7 cases where AI said "I don't know"
  Top gaps:
    • Aesthetic medicine — combining filler types (3 cases)
    • Pregnancy + uncommon medications (2 cases)
    • Paediatric driver assessment edge cases (2 cases)
  
PROMOTION QUEUE
  No models pending promotion.
  
[Run new fine-tune] [Review correction queue] [View RAG corpus]
```

### 11.3 The Promotion Workflow

When a fine-tune produces a candidate model:

```
[Fine-tuning run completes successfully]
                    ↓
[Custodian reviews metrics in Custodian admin]
                    ↓
[Custodian initiates Shadow Comparison]
                    ↓
[For 48 hours:]
  ├─ Production: current global LoRA (e.g. v3.2)
  ├─ Shadow: candidate global LoRA (e.g. v3.3)
  ├─ Both run in parallel for every inference
  ├─ Production response is what users see
  ├─ Shadow response is logged for comparison
  └─ Comparison metrics computed
                    ↓
[After 48 hours, Custodian reviews comparison]
                    ↓
[Decision]
  ├─ Promote: shadow becomes production
  ├─ Reject: candidate discarded; investigate
  └─ Extend: continue shadow for further data
```

Schema:

```sql
CREATE TABLE model_promotions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- The candidate
  fine_tuning_run_id    UUID NOT NULL REFERENCES fine_tuning_runs(id),
  
  -- Shadow comparison
  shadow_started_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  shadow_ended_at       TIMESTAMPTZ,
  
  shadow_metrics        JSONB,                    -- Comparison stats
  
  -- Promotion
  promoted_at           TIMESTAMPTZ,
  promoted_by           UUID REFERENCES auth.users(id),  -- Custodian
  
  -- Rollback window (30 days from promotion)
  rollback_available_until  TIMESTAMPTZ,
  rolled_back_at        TIMESTAMPTZ,
  rolled_back_by        UUID REFERENCES auth.users(id),
  rollback_reason       TEXT,
  
  -- Lifecycle
  status                TEXT NOT NULL DEFAULT 'shadow_running',
    -- 'shadow_running' | 'shadow_complete' | 'promoted' | 'rejected' | 'rolled_back'
  
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 11.4 The Shadow Comparison Metrics

During shadow comparison, every inference produces both a production response and a shadow response. Metrics tracked:

- **Disagreement rate**: how often production and shadow differ meaningfully
- **Citation drift**: are shadow responses citing different (or fewer) sources?
- **Confidence drift**: is shadow more or less confident?
- **Safety regression**: does shadow flag fewer safety issues than production?
- **Latency comparison**: is shadow significantly slower?
- **Critical-case behaviour**: on flagged-critical cases, do they agree?

If shadow shows safety regression on any critical-case category: promotion blocked. Custodian investigates.

### 11.5 The 30-Day Rollback Window

After promotion, the rolled-back model is preserved as `rolde-global-v3.2-rolled-back` for 30 days. If issues surface in production:

1. Custodian opens promotions page
2. Selects the recent promotion
3. Clicks "Rollback to previous"
4. Re-authentication + reason required
5. Production reverts to previous global LoRA within minutes (just swaps adapter file pointer)
6. Audit log records rollback with reason

After 30 days, rollback option expires (the adapter file is archived but not actively swappable). New fine-tunes from the corpus version that produced the now-rolled-back model are evaluated separately.

---

## 12. The Continuous Patient Monitoring (Implementation)

Bible 4.4 §8 specified the service interface and 12 Phase 1 rules. This Bible specifies the AI-driven implementation.

### 12.1 The Architecture

```
[pg_cron schedule fires every 5 min for hourly rules; daily at 02:00 for daily rules]
                    ↓
[Edge Function continuous_monitoring_run]
                    ↓
[For each tenant in active status:]
  ├─ For each enabled rule (per tenant config):
  │   ├─ Query relevant patient data
  │   ├─ Run rule logic (some pure SQL, some AI-augmented)
  │   ├─ Generate alerts where conditions met
  │   ├─ Check suppressions (don't re-alert if recently dismissed)
  │   └─ Insert into monitoring_alerts table
  └─ Continue to next tenant
                    ↓
[Alerts surface via Realtime to clients]
```

### 12.2 The Pure-SQL Rules

Some monitoring rules are pure database queries (no AI inference needed):

```sql
-- Example: warfarin_inr_overdue
CREATE OR REPLACE FUNCTION check_warfarin_inr_overdue(p_tenant_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO monitoring_alerts (
    tenant_id, patient_id, category, rule_slug, title, description, severity, recommended_action
  )
  SELECT
    p_tenant_id,
    p.id,
    'care_continuity',
    'warfarin_inr_overdue',
    'INR overdue for warfarin patient',
    'Patient on warfarin; last INR was ' || (NOW() - lab_results.last_inr_date)::INTERVAL || ' ago.',
    CASE
      WHEN (NOW() - lab_results.last_inr_date) > INTERVAL '180 days' THEN 'urgent'
      ELSE 'warning'
    END,
    'Arrange INR check; review anticoagulation status'
  FROM patients p
  CROSS JOIN LATERAL get_active_warfarin(p.id) warfarin_status
  CROSS JOIN LATERAL get_last_inr_date(p.id) lab_results
  WHERE p.tenant_id = p_tenant_id
    AND warfarin_status.is_active = true
    AND (NOW() - lab_results.last_inr_date) > INTERVAL '90 days'
    AND NOT EXISTS (
      SELECT 1 FROM monitoring_alerts a
      WHERE a.patient_id = p.id
        AND a.rule_slug = 'warfarin_inr_overdue'
        AND a.status IN ('open', 'acknowledged')
    );
END;
$$ LANGUAGE plpgsql;
```

### 12.3 The AI-Augmented Rules

Some rules require AI judgement (e.g. "is this combination clinically concerning?"):

```typescript
// supabase/functions/continuous_monitoring/rules/polypharmacy_review_overdue.ts

async function polypharmacyReviewOverdueCheck(tenantId: string) {
  // Find patients with 5+ active medications
  const patients = await getPatientsWithMultipleActiveMedications(tenantId, threshold: 5);
  
  for (const patient of patients) {
    // Check time since last medication review
    const lastReview = await getLastMedicationReview(patient.id);
    const daysSinceReview = daysAgo(lastReview);
    
    if (daysSinceReview < 365) continue;  // Within annual review window
    
    // Get current med list with full context
    const medications = await getActiveMedications(patient.id);
    
    // Ask the AI: any specific concerns?
    const aiAssessment = await callAIServer('/v1/polypharmacy-assessment', {
      patient_summary: summarisePatient(patient),
      medications: medications,
      task: 'Identify the most concerning interaction or appropriateness issue, if any',
    });
    
    if (aiAssessment.has_concern) {
      await createMonitoringAlert({
        tenant_id: tenantId,
        patient_id: patient.id,
        category: 'drug_safety',
        rule_slug: 'polypharmacy_review_overdue',
        title: `Polypharmacy review overdue (${daysSinceReview} days)`,
        description: aiAssessment.concern_description,
        severity: aiAssessment.severity,
        recommended_action: aiAssessment.recommended_action,
      });
    }
  }
}
```

### 12.4 The 12 Phase 1 Rules — Implementation Catalogue

| Rule Slug | Implementation | Severity Range |
|---|---|---|
| `warfarin_inr_overdue` | Pure SQL | Warning–Urgent |
| `drug_drug_interaction_new_prescription` | AI-augmented (Bible 4.5 §6.3 interaction check + AI grading) | Warning–Critical |
| `egfr_below_threshold_for_drug` | Pure SQL with drug-specific eGFR thresholds | Warning–Urgent |
| `pregnancy_pre_procedure` | AI-augmented (checks pregnancy status, procedure risk) | Critical |
| `anticoagulation_pre_procedure` | Pure SQL | Warning–Urgent |
| `allergy_unverified_pre_prescription` | Pure SQL | Urgent |
| `consent_unsigned_pre_procedure` | Pure SQL | Warning–Urgent |
| `repeated_cancellations` | Pure SQL with threshold | Info–Warning |
| `overdue_hba1c_diabetes` | Pure SQL | Warning |
| `overdue_bp_check_hypertension` | Pure SQL | Warning |
| `unactioned_abnormal_result` | Pure SQL with severity-based timing | Warning–Urgent |
| `polypharmacy_review_overdue` | AI-augmented | Warning |

### 12.5 The Critical Alert Pipeline

When a `critical` severity alert is raised:

1. Standard `monitoring_alerts` row created
2. Notification fires immediately to assigned clinician (email + SMS if enabled)
3. If clinician is currently in-app, an inline alert surfaces (red-tinged card)
4. If clinician opens the affected patient, alert appears in bottom alert strip
5. **Bypasses paused-suggestions setting** (Bible 4.6 §5.8) — critical alerts always surface
6. Alert remains open until clinician acknowledges or actions

Critical-alert thresholds tuned conservatively. False positives in critical-tier are worse than false negatives in warning-tier; the threshold is high.

---

## 13. The Ambient AI Trigger Heuristics

When does the AI surface a suggestion card? When does it draft a discharge summary? This section specifies.

### 13.1 The Ambient Observation Pattern

When a clinician opens a patient (consultation begins), the AI server opens a session:

```typescript
interface AmbientSession {
  consultation_id: string;
  patient_id: string;
  tenant_id: string;
  practitioner_id: string;
  
  context_snapshot: {
    // Initial context loaded at session start
    patient_demographics: PatientDemographics;
    active_problems: Problem[];
    current_medications: Medication[];
    allergies: Allergy[];
    recent_feed_entries: FeedEntry[];  // Last 30 days
  };
  
  active_state: {
    // Updated as consultation unfolds
    current_note_text: string;          // The clinician's typing
    new_feed_entries: FeedEntry[];      // Entries created in this consultation
    active_orders: ClinicalOrder[];     // Drafts in this consultation
  };
  
  ai_state: {
    surfaced_suggestions: AISuggestion[];
    drafts_prepared: PreparedDraft[];
    last_inference_at: timestamp;
  };
}
```

The session persists for the duration of the consultation. Updates flow via WebSocket as the clinician types.

### 13.2 The Trigger Conditions

The AI surfaces suggestions when one of these conditions fires:

| Trigger | Condition | What Surfaces |
|---|---|---|
| **History detected** | New note contains symptom/sign keywords | Differential diagnosis card |
| **Examination findings detected** | Vital signs entered, exam findings noted | Working assessment refinement |
| **Lab values mentioned** | Note mentions specific lab value | Synthesis or relevance comment |
| **Drug interaction concern** | Order modal opens with drug X while patient on drug Y | Interaction warning card |
| **Renal/hepatic concern** | Drug ordered with patient eGFR/LFT outside normal | Dose adjustment suggestion |
| **Plan section detected** | Note contains "Plan", "Treatment plan", etc. | Investigations or referrals suggestion |
| **Consultation winding down** | Plan articulated + investigations ordered | Discharge summary draft prepared (§17) |
| **Critical safety pattern** | Continuous monitoring rule triggers | Critical alert card (red-tinged) |
| **Direct query received** | Clinician types in panel input | Direct response |

### 13.3 The Debouncing And Rate-Limiting

The AI doesn't surface a card on every keystroke. Debouncing rules:

- **Note input changes**: debounce 500ms; trigger AI processing after pause
- **Maximum cards in panel**: 5 visible at once; oldest auto-dismissed when new arrives
- **Same-suggestion rate limit**: don't re-surface the same suggestion within 60 seconds
- **Clinician dismissed pattern**: if clinician dismissed similar suggestion in last 10 minutes, skip

### 13.4 The Pause Suggestions Behaviour

Bible 4.2 §5.7: clinician can pause ambient suggestions. While paused:

- New suggestion cards: suppressed
- Direct queries: still answered
- **Critical safety alerts**: still fire (cannot be paused — Bible 4.2 §5.8)

Resume: clinician clicks "Resume suggestions" or consultation ends.

### 13.5 The "I Don't Know" Trigger

When the AI's confidence on a question falls below threshold:

```python
async def generate_with_confidence_check(query: str, ...):
    # Run inference
    response = await run_inference(query, ...)
    
    # Compute confidence (response-internal logits + RAG citation strength)
    confidence = compute_confidence(response)
    
    # Confidence threshold: 0.65 default; per-domain configurable
    threshold = await get_confidence_threshold(domain=response.domain)
    
    if confidence < threshold:
        # Surface "I don't know" card instead of speculative answer
        return IDontKnowResponse(
            domain=response.domain,
            relevant_sources=response.cited_sources,  # Even if AI didn't synthesise from them
            recommendation="Recommend consulting [sources] for this case",
        )
    
    return response
```

Threshold tunable per domain. Critical clinical domains (e.g. paediatric prescribing) have higher thresholds than less safety-critical (e.g. lifestyle advice). Default 0.65 is calibrated for general clinical contexts.

---

## 14. The Direct Query Architecture

Bible 4.2 §5.5: the AI panel is dual-mode (ambient + reactive). Direct queries are the reactive mode.

### 14.1 The Query Flow

```
[Clinician types in panel input field]
        ↓
[Cmd+Enter or Submit]
        ↓
[Query sent to AI server via WebSocket]
        ↓
[AI server: hybrid retrieval (global + tenant RAG)]
        ↓
[AI server: inference with citation requirement]
        ↓
[Response streams back to client]
        ↓
[Card appears at top of panel: "Direct query response"]
        ↓
[Clinician can: Add to notes, Expand, Thumbs up/down]
```

### 14.2 The Query Categories

The AI handles direct queries across categories:

| Category | Example Query |
|---|---|
| Drug information | "What are the contraindications for IV ceftriaxone?" |
| Clinical guideline | "What's NICE recommendation for first-line UTI?" |
| Mechanism of action | "What's the mechanism of action of metformin?" |
| Dose calculation | "What's the paracetamol dose for a 4-year-old, 18kg?" |
| Differential | "Differential for sudden onset chest pain?" |
| Investigation | "What investigations for query gout?" |
| Procedure technique | "Technique for glabella botulinum injection?" |
| Aftercare | "Post-Botox aftercare advice?" |

Queries outside clinical scope (e.g. "what's the weather?") return a polite redirect: *"I can help with clinical questions. For other topics, please use a general search."*

### 14.3 The Query Memory

Each direct query is logged for:
- **Pattern analysis** — what are clinicians most often asking? Gaps in ambient suggestions
- **Per-user familiarity** — questions a clinician has asked before get faster responses (cache hit)
- **Custodian visibility** — Custodian sees aggregate patterns to identify training corpus gaps

```sql
CREATE TABLE direct_query_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  user_id         UUID NOT NULL REFERENCES auth.users(id),
  consultation_id UUID,
  
  query_text      TEXT NOT NULL,
  response_text   TEXT NOT NULL,
  citations_used  JSONB,
  
  confidence_score DECIMAL,
  
  feedback        TEXT,                       -- 'thumbs_up' | 'thumbs_down' | NULL
  
  -- Privacy: queries don't contain PHI per design (clinician asks generic-form)
  -- but if accidentally PHI included, anonymised before logging
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_query_log_tenant ON direct_query_log(tenant_id, created_at);
CREATE INDEX idx_query_log_feedback ON direct_query_log(feedback) WHERE feedback IS NOT NULL;
```

---

## 15. The Confidence-Aware Output

Bible 4.0 §9.7. RolDe is honest about uncertainty.

### 15.1 The Confidence Dimensions

A response's confidence is a composite of:

- **Token-level certainty**: model's own uncertainty about what to generate (perplexity, probability distribution)
- **Citation strength**: how relevant and on-point are the retrieved sources?
- **Citation count**: enough sources to triangulate, or just one?
- **Domain familiarity**: is this a domain well-represented in training corpus?
- **Conflict detection**: do retrieved sources agree, or do they conflict?

### 15.2 The Confidence Output

Every AI response includes a confidence indicator (visible to the clinician):

```
+-----------------------------------------+
|  [Rx] Suggestion                         |
+-----------------------------------------+
|                                         |
|  For acute bacterial UTI, recommend     |
|  Nitrofurantoin 100mg BD for 3 days     |
|  per NICE NG109.                        |
|                                         |
|  Confidence: ████████░░ (high)          |
|                                         |
|  Sources:                                |
|  • NICE NG109 (3 citations)             |
|  • eMC SmPC Nitrofurantoin              |
|                                         |
+-----------------------------------------+
```

| Confidence Bar | Meaning |
|---|---|
| ██████████ | Very high — multiple authoritative citations agree |
| ████████░░ | High — solid citations, no conflicts |
| ██████░░░░ | Moderate — some uncertainty; clinician judgment recommended |
| ████░░░░░░ | Low — recommend reviewing sources before action |
| ██░░░░░░░░ | Very low — surface as "I don't know" instead |

### 15.3 The Clinician Action Per Confidence Level

- **Very high / High**: clinician acts with confidence; AI's draft generally accurate
- **Moderate**: clinician applies extra scrutiny; AI may have missed nuance
- **Low**: clinician should manually review sources; AI flagged for known limitation
- **Very low**: AI surfaces "I don't know" + sources; AI explicitly does not provide an answer

### 15.4 The "I Don't Know" Card UX

When confidence < threshold (§13.5):

```
+-----------------------------------------+
|  [?] Uncertain                           |
+-----------------------------------------+
|                                         |
|  I don't have a confident answer for    |
|  this case. Recommend consulting:       |
|                                         |
|   • NICE NG109                          |
|   • eMC SmPC for [drug]                 |
|   • A senior colleague                  |
|                                         |
+-----------------------------------------+
|  [Log as guideline gap]                 |
+-----------------------------------------+
```

### 15.5 The Guideline Gap Log

Every "I don't know" can be logged by the clinician. Logged gaps go to the Custodian Update Console (Bible 4.3 §6.3 / this Bible §11.1):

```sql
CREATE TABLE guideline_gaps (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id),
  reported_by       UUID NOT NULL REFERENCES auth.users(id),
  reported_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- The gap
  case_summary      TEXT NOT NULL,             -- Anonymised
  domain            TEXT NOT NULL,
  what_was_missing  TEXT,                      -- Optional clinician note
  
  -- Custodian response
  status            TEXT NOT NULL DEFAULT 'reported',
  custodian_response TEXT,
  resolved_by_corpus_addition BOOLEAN DEFAULT false,
  related_training_example_id UUID REFERENCES training_examples(id),
  
  resolved_at       TIMESTAMPTZ
);
```

The Custodian Update Console aggregates gaps by domain. Domains with high gap-counts are prioritised for training corpus expansion.

---

## 16. The Voice Ambient AI (Phase 1.5)

Bible 4.6 §9. Audio input via Gemma 4 multimodal capability.

### 16.1 The Pipeline

```
[Patient consents to recording during consultation]
                    ↓
[Clinician toggles "voice on" in consultation screen]
                    ↓
[Browser microphone API captures audio]
                    ↓
[Audio chunks streamed to AI server via WebSocket]
                    ↓
[AI server: Gemma 4 multimodal processes audio chunks]
                    ↓
[Real-time transcription with speaker diarisation]
                    ↓
[Note draft populated in bottom-left input as consultation unfolds]
                    ↓
[Clinician reviews; corrects; saves as draft or final]
                    ↓
[Audio retained per tenant config (default 30 days); transcript indefinite]
```

### 16.2 The Speaker Diarisation

Gemma 4 multimodal natively distinguishes speakers in conversational audio:

- **Speaker A** (typically): clinician
- **Speaker B** (typically): patient
- **Speaker C, D...**: additional parties (interpreter, family, second clinician)

The transcription tags each utterance with the speaker. This becomes structured data the AI can reason about: *"the patient reports..."* vs *"the clinician explains..."*.

### 16.3 The Real-Time Transcription Quality

Phase 1.5 target: 90%+ word accuracy on UK English clinical conversation. Below that, manual correction is too burdensome.

If accuracy is consistently below 85%, voice ambient AI is gated for that tenant pending tuning.

### 16.4 The Three Consent Layers

Per Bible 4.6 §9.2:
1. **Tenant-level**: Steward enables voice module
2. **Patient-level**: patient signs consent during onboarding
3. **Consultation-level**: clinician confirms patient awareness before recording

All three required. Audit-logged.

### 16.5 The Audio Privacy Architecture

- Audio captured in browser → streamed to AI server (Roland's M4 Max)
- Audio processed locally (never leaves the M4 Max)
- Transcription extracted; audio file optionally retained per tenant config
- Audio file encryption at rest (per-tenant key)
- Audio file deletion: scheduled by retention policy; immediate on patient request

### 16.6 The Audio Storage Cost Considerations

Audio files are large:
- 30-minute consultation: ~30 MB at 16kHz 16-bit
- 100 patients × 30 min average × 30 days retention = ~90 GB

Storage cost considerations:
- Phase 1.5: Supabase Storage at this volume is manageable (~£5-15/month per tenant at typical use)
- Phase 2: encrypted cloud archive for retained audio (cheaper for long-term retention)
- Phase 3+: dedicated audio storage if scale demands

### 16.7 The Failure Modes

| Failure | Behaviour |
|---|---|
| Microphone access denied | Voice off; clinician sees notice |
| Network interruption | Local audio cache; resumes on reconnection |
| AI server overload | Voice processing pauses; clinician notified |
| Transcription poor quality | Inline marker indicates uncertainty; clinician corrects |
| Patient withdraws consent mid-consultation | Recording stops immediately; existing audio deleted on demand |

---

## 17. The Discharge Summary Drafting Logic

Per Bible 4.6 §8.7. The AI drafts in the background; clinician opens pre-drafted modal on click.

### 17.1 The Trigger Heuristics (Implementing Bible 4.6 §8.7.9)

The AI server detects when discharge summary drafting should begin:

```python
class DischargeSummaryTriggerDetector:
    """
    Decides when to begin background drafting of a discharge summary.
    Aims to draft early enough that the modal opens instantly when clinician clicks.
    """
    
    PLAN_KEYWORDS = ["plan", "plan:", "plan ", "treatment plan", "going forward", "follow-up", "next steps"]
    
    def evaluate_consultation(self, session: AmbientSession) -> TriggerDecision:
        signals = self.extract_signals(session)
        
        # Trigger 1: Plan section detected in any clinical_note in this consultation
        if signals.has_plan_articulated:
            return TriggerDecision(should_draft=True, reason='plan_detected')
        
        # Trigger 2: Multiple orders approved (suggests consultation has substance)
        if signals.orders_approved_count >= 1 and signals.has_clinical_notes:
            return TriggerDecision(should_draft=True, reason='orders_approved')
        
        # Trigger 3: Consultation explicitly closed
        if signals.consultation_status == 'closed':
            return TriggerDecision(should_draft=True, reason='consultation_closed')
        
        # Trigger 4: AI judges natural conclusion
        if (signals.notes_word_count > 200 and 
            signals.has_plan_articulated and 
            signals.has_follow_up_arranged):
            return TriggerDecision(should_draft=True, reason='natural_conclusion')
        
        return TriggerDecision(should_draft=False)
```

### 17.2 The Drafting Process

```python
async def draft_discharge_summary(consultation_id: str, tenant_id: str) -> str:
    # Gather all consultation feed entries
    entries = await get_consultation_feed_entries(consultation_id)
    
    # Get patient context
    patient = await get_patient_context(consultation_id)
    
    # Load tenant's letter template / preferences
    template_config = await get_tenant_letter_config(tenant_id, letter_type='discharge_summary')
    
    # RAG: retrieve any relevant guidelines for the conditions in this consultation
    citations = await hybrid_retrieve(
        query=summarise_consultation(entries),
        tenant_id=tenant_id,
        top_k=5,
    )
    
    # Construct prompt
    prompt = build_discharge_summary_prompt(
        consultation_entries=entries,
        patient_context=patient,
        template_config=template_config,
        citations=citations,
    )
    
    # Run inference
    response = await run_inference(model_with_global_lora, prompt, max_tokens=2000)
    
    # Apply per-user language LoRA if available (§9)
    user_lora = await load_user_lora(consultation.practitioner_id)
    if user_lora:
        response = await apply_user_style(response, user_lora)
    
    # Create letter row with status='ai_drafted'
    letter = await create_ai_drafted_letter(
        tenant_id=tenant_id,
        patient_id=patient.id,
        letter_type='discharge_summary',
        consultation_id=consultation_id,
        body_markdown=response.text,
        ai_model_version=current_model_version,
        citations=citations,
        recipient_default=template_config.default_recipient,
    )
    
    return letter.id
```

### 17.3 The Re-Drafting

If consultation content changes after a draft is prepared (clinician adds more notes, orders more investigations):

1. Trigger fires again (debounced ~30 seconds)
2. AI re-drafts using updated context
3. Existing `ai_drafted` letter row updated in place
4. `ai_drafted_at` and `ai_model_version` re-recorded
5. Card in AI panel may show subtle "Updated" indicator

If the modal is currently open with the draft, the re-draft does NOT overwrite in-progress edits. A small notice appears: *"AI has new draft available — refresh to see latest"* with [Refresh] action.

### 17.4 The Discharge Summary Quality Standards

A drafted discharge summary must include:

- Patient identifier (name, DOB)
- Consultation date
- Recipient (defaulting to patient's GP)
- Presenting complaint
- History (key elements)
- Examination findings (if recorded)
- Investigations (ordered + results received)
- Diagnosis or working assessment
- Treatment given
- Plan (medications started, follow-up arranged, when to seek help)
- Prescriber signature block
- Citation list (visible to clinician; optionally redacted in final letter)

If the consultation lacks information for any section, the AI marks it explicitly: *"[No examination findings recorded]"* rather than fabricating.

---

## 18. The Shadow Comparison and Rollback

Per §11.3-11.5 plus the constitutional commitment in Bible 0 §9.7 operational principle 5.

### 18.1 The 48-Hour Shadow Window

Every promoted model goes through 48-hour shadow. This is non-negotiable:

```sql
-- Constraint enforced in code
-- model_promotions.shadow_started_at + 48 hours <= model_promotions.promoted_at
-- (Custodian cannot bypass this even with admin privileges)
```

Why 48 hours: provides enough volume of inferences to detect regressions (typically thousands of inferences across active tenants) without unduly delaying improvements.

### 18.2 The Shadow Comparison Logic

For every inference during shadow:

```python
async def shadow_comparison_inference(query, tenant_id, ...):
    # Run production model
    production_response = await run_inference(production_model, query, ...)
    
    # Run shadow model in parallel
    shadow_response = await run_inference(shadow_model, query, ...)
    
    # Compare
    comparison = compare_responses(production_response, shadow_response)
    
    # Log comparison for Custodian review
    await log_shadow_comparison(
        production_response=production_response,
        shadow_response=shadow_response,
        comparison=comparison,
        domain=query.domain,
    )
    
    # Return production response (clinician sees this)
    return production_response
```

### 18.3 The Comparison Metrics

| Metric | Target |
|---|---|
| Disagreement rate (any) | Track; not blocking |
| Disagreement rate (clinical conclusion) | < 15% |
| Disagreement rate (safety-flagging) | < 5% |
| Citation drift | < 20% (responses citing materially different sources) |
| Confidence regression | < 10% drop in average confidence |
| **Safety regression** | **0% — blocking if any** |
| Latency regression | < 30% slower |

A safety regression on critical-tier rules is blocking. Custodian reviews. Promotion not allowed until investigation complete.

### 18.4 The Promotion Decision

After 48 hours, Custodian reviews comparison metrics in admin and decides:

- **Promote**: shadow becomes production. Old production becomes "rollback target" for 30 days.
- **Reject**: shadow discarded. Investigate why. Production unchanged.
- **Extend shadow**: continue shadow comparison for further data (e.g. another 48h).
- **Reject and rollback another model**: rare; if shadow surfaced regressions in production model itself, rollback to even older version.

### 18.5 The 30-Day Rollback Window

After promotion:

- Old model preserved as `rolde-global-vN-rolled-back-target`
- Adapter file remains on disk for 30 days
- Custodian admin shows "Rollback available until [date]"
- One-click rollback from Custodian admin
- Re-authentication + reason required for rollback execution
- Audit log records rollback

After 30 days:

- Adapter file moved to long-term archive (compressed, encrypted)
- Rollback no longer one-click; would require manual restore from archive
- Most issues surface within 30 days; this gate is a safety net not an operational expectation

---

## 19. The Claude API Fallback (Phase 2)

Bible 0 §9.7. Claude API as fallback for premium tier; not at launch.

### 19.1 The Fallback Pattern

For Premium-tier tenants (Bible 4.3 §16.2), when the local model is uncertain:

```python
async def generate_with_premium_fallback(query, tenant_id, ...):
    # Try local model first
    local_response = await run_inference(production_model, query, ...)
    
    # If confidence is high enough, use local
    if local_response.confidence >= 0.65:
        return local_response
    
    # Local was uncertain. Check tenant tier.
    tenant = await get_tenant(tenant_id)
    if tenant.subscription_tier != 'premium':
        # Standard tier: surface "I don't know"
        return idontknow_response(local_response.cited_sources)
    
    # Premium tier: fall back to Claude API
    if tenant.config.claude_api_fallback_enabled:
        claude_response = await call_claude_api(
            query=query,
            citations=local_response.cited_sources,
            patient_context=summarise_for_external_api(...),
        )
        
        # Mark response as Claude-fallback for audit
        return claude_response.with_marker('claude_fallback')
    
    # Premium but feature disabled: surface "I don't know"
    return idontknow_response(local_response.cited_sources)
```

### 19.2 The Privacy For External API Calls

Critical: when Claude API is called, no PHI leaves Roland's infrastructure unredacted.

The summarise_for_external_api function:
- Strips all patient identifiers
- Generalises specific dates ("3 weeks ago" not "10 May 2026")
- Removes location-specific details
- Removes provider names

The Claude API receives a clinical scenario, not a patient record. Audit-logged with anonymisation method version.

### 19.3 The Cost Allocation

Premium tier price (Bible 4.3 §16.2 placeholder £349/month) absorbs Claude API costs. Per-call costs in Anthropic's pricing as of writing:

- Claude opus tier (highest quality): ~£0.50-£1.50 per complex clinical query
- Average premium tenant: maybe 50-100 queries/month requiring fallback (estimated)
- Monthly Claude cost per premium tenant: £25-£150
- Margin protected by premium pricing

### 19.4 The Phase 2 Engineering

Phase 2 work to ship Claude API fallback:
- Anthropic API integration with credential vault
- Per-tenant feature flag and usage tracking
- Rate limiting and cost guardrails
- Fallback latency budget (~3-5s acceptable for premium tier; clinician told "consulting deeper sources...")
- Audit logging for every Claude API call with cost attribution
- Monthly cost reconciliation in Custodian admin

Phase 1 ships without this. Phase 1 premium tenants (if any) get the same model as standard for now; fallback is the future addition.

---

## 20. The Drug Safety Reasoning

Bible 4.5 §6 specified the safety check rules. This section specifies how AI augments them.

### 20.1 The Hybrid Safety Architecture

Drug safety checks are partly rule-based and partly AI-augmented:

| Check | Rule Component | AI Component |
|---|---|---|
| Allergy match (direct) | Match drug name / ATC code against allergy list | None — pure rule |
| Allergy match (cross-reactive) | Lookup ATC class relationships | AI may add literature-based context |
| Drug-drug interaction (known severe) | Lookup interaction database | None — pure rule |
| Drug-drug interaction (uncertain combinations) | Rule says "no entry" | AI assesses based on mechanism |
| Renal dose adjustment | Lookup eGFR thresholds in drug data | None — pure rule |
| Renal dose adjustment (no data) | Rule has no entry | AI suggests based on similar drugs |
| Pregnancy contraindication | Lookup pregnancy category | AI contextualises based on stage of pregnancy |
| Off-label justification | Rule asks for justification | AI may suggest plausible justification |

### 20.2 The AI Drug-Drug Interaction Assessment

When two drugs are prescribed together but the interaction database has no entry:

```python
async def assess_unknown_interaction(drug_a: Drug, drug_b: Drug) -> InteractionAssessment:
    # Retrieve mechanism information from RAG
    drug_a_mechanism = await retrieve_smpc_section(drug_a.id, section='pharmacology')
    drug_b_mechanism = await retrieve_smpc_section(drug_b.id, section='pharmacology')
    
    # AI assesses: do mechanisms suggest interaction concern?
    prompt = f"""
    Assess whether these two medications have potential pharmacological interaction.
    
    Drug A: {drug_a.name}
    Mechanism: {drug_a_mechanism}
    
    Drug B: {drug_b.name}
    Mechanism: {drug_b_mechanism}
    
    Provide: severity (none/mild/moderate/severe), mechanism description, citations.
    If no concern based on mechanisms, say so explicitly.
    """
    
    response = await run_inference(model, prompt)
    
    # Parse structured output
    assessment = parse_interaction_assessment(response)
    
    # Always tag as "AI-assessed, no interaction database entry — verify before relying"
    return assessment.with_disclaimer()
```

The clinician sees: *"AI assessment of potential interaction (no database entry). Severity: moderate. Verify before relying."*

This is honest about the AI's role. It's helpful but not authoritative. Authoritative interaction entries come from curated database; AI fills gaps with appropriate uncertainty.

### 20.3 The Safety Override Audit

When a clinician overrides a safety check (Bible 4.5 §6.8), the override is audit-logged with:
- The check that fired
- The severity
- The clinician's stated reason
- The clinician's GMC number
- Timestamp

These overrides are reviewed periodically by Custodian for patterns:
- Clinicians overriding the same check repeatedly: maybe the threshold is wrong
- Clinicians overriding without documented reason: training opportunity
- Override followed by adverse event: post-incident review

---

## 21. The AI Server API Contract

The interface between web app and AI server.

### 21.1 The Endpoints

```
GET    /v1/health                                          → Health check
POST   /v1/consultation/open                               → Open ambient session
WS     /v1/consultation/<session_id>                       → Streaming session
POST   /v1/consultation/<session_id>/close                 → Close ambient session
POST   /v1/query                                           → Direct query
POST   /v1/draft/discharge-summary                         → Draft discharge summary (background)
POST   /v1/draft/referral-letter                           → Draft referral letter
POST   /v1/draft/prescription-suggestion                   → Draft prescription
POST   /v1/synthesize-lab-result                           → Synthesise lab result
POST   /v1/document-analysis                               → Analyse document text (Phase 1 OCR'd input)
POST   /v1/document-vision-analysis                        → Phase 1.5 multimodal OCR + analysis
POST   /v1/polypharmacy-assessment                         → Polypharmacy review (continuous monitoring)
POST   /v1/correction/submit                               → Submit Validated Correction Pipeline entry
POST   /v1/personalisation/get                             → Get user language profile
POST   /v1/personalisation/update                          → Update user language profile (when enough samples accumulate)
GET    /v1/audit/inference-logs                            → Custodian-only: audit logs
```

### 21.2 The Authentication

Every request requires:
- `Authorization: Bearer <api_key>` header (validated against environment variable)
- `X-Tenant-Id` header (for tenant context)
- `X-User-Id` header (for personalisation and audit)

Failed auth: HTTP 401 with structured error response.

### 21.3 The Response Format

All endpoints return JSON with consistent structure:

```typescript
interface AIServerResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    retry_advised: boolean;
  };
  metadata: {
    model_version: string;
    inference_duration_ms: number;
    citations_used: Citation[];
    confidence: number;
    request_id: string;          // For audit
  };
}
```

### 21.4 The Streaming Format

Streaming endpoints (consultation session, draft generation) use Server-Sent Events:

```
event: token
data: { "token": "Renal", "position": 0 }

event: token
data: { "token": " adjustment", "position": 1 }

...

event: complete
data: { "full_response": "...", "metadata": { ... } }
```

Web app receives tokens as they arrive; UI renders incrementally.

### 21.5 The Rate Limiting

Per-tenant rate limits (configurable):

- Standard: 100 inferences/minute per tenant
- Professional: 300/minute
- Premium: 1000/minute

Rate-limit hits return HTTP 429 with `Retry-After` header. Web app shows: *"AI is busy — your suggestion will appear shortly"*.

---

## 22. The Cost and Performance Budget

Operational economics.

### 22.1 The Phase 1 Cost Profile

| Cost Item | Monthly | Annual |
|---|---|---|
| M4 Max amortised (£3,500 over 4 years) | £73 | £875 |
| Cloudflare Tunnel | £0 | £0 |
| Electricity (~50W avg, UK) | £4 | £48 |
| Supabase pgvector storage | £0 (free tier) | £0 |
| Backup costs (encrypted cloud) | £8 | £96 |
| **Total Phase 1 AI costs** | **~£85** | **~£1,019** |

Per-tenant marginal cost at Phase 1: effectively £0. The economics work because we're not renting per-token; the M4 Max already exists and runs 24/7.

### 22.2 The Phase 2 Cost Profile

| Cost Item | Monthly | Annual |
|---|---|---|
| M5 Mac Studio amortised (£5,000 over 4 years) | £104 | £1,250 |
| Cloudflare Tunnel | £0 | £0 |
| Electricity | £8 | £96 |
| Supabase pgvector (paid tier likely) | £25 | £300 |
| Backup costs | £20 | £240 |
| Claude API (premium tier reserves) | £200-£500 | £2,400-£6,000 |
| **Total Phase 2 AI costs** | **~£357-657** | **~£4,286-7,886** |

At Phase 2, premium tier revenue should comfortably cover Claude API costs with margin.

### 22.3 The Performance Budget

| Operation | Phase 1 Target | Phase 1 Acceptable |
|---|---|---|
| Ambient suggestion (input → first token) | < 600ms | < 1.2s |
| Ambient suggestion (full response) | < 3s | < 5s |
| Direct query (full response) | < 3s | < 5s |
| Discharge summary draft (background) | < 8s | < 15s |
| RAG retrieval | < 200ms | < 500ms |
| Health check response | < 100ms | < 300ms |

Background drafting can take longer than ambient suggestion since user isn't waiting. The budget exists to ensure the modal opens instantly (Bible 4.6 §8.7.4) — i.e. drafting must complete before user clicks the suggestion card.

---

## 23. The Privacy and Data Governance

Operationalising Bible 4.0 Principle 1 (patient safety) and Bible 4.1 §15 (security).

### 23.1 The PHI Handling

Patient Health Information flows:

| PHI Element | Handled Where | Encryption | Audit |
|---|---|---|---|
| Patient name | Web app + AI server (full record context) | At rest (per-tenant key) | Yes |
| DOB | Web app + AI server | At rest | Yes |
| NHS number | Web app + AI server | At rest | Yes |
| Clinical content | Web app (full) + AI server (during inference) | At rest | Yes |
| Voice audio | AI server only | At rest, per-tenant key | Yes (access logged) |
| Per-user LoRA | AI server only | At rest, per-user key | Yes |

### 23.2 The Cross-Boundary Restrictions

| Boundary | Allowed |
|---|---|
| AI server → tenant data | Yes (with tenant_id scoping) |
| Tenant A AI inference → tenant B data | NEVER (RLS enforces) |
| Local AI inference → external Claude API (Phase 2) | Only with PHI redaction |
| Training data → external | NEVER (constitutional) |
| Training data → other tenants | NEVER (training data is global, but tenant data isn't trained on without explicit anonymisation pipeline) |

### 23.3 The Inference Audit Log

Every AI inference is audit-logged:

```sql
CREATE TABLE ai_inference_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  user_id         UUID REFERENCES auth.users(id),
  consultation_id UUID,
  
  -- The inference
  endpoint        TEXT NOT NULL,
  model_version   TEXT NOT NULL,
  
  -- Inputs (anonymised summary, not full content)
  input_summary   TEXT NOT NULL,
  input_size_tokens INTEGER NOT NULL,
  
  -- Outputs (summary, not full content)
  output_summary  TEXT NOT NULL,
  output_size_tokens INTEGER NOT NULL,
  
  -- Metadata
  inference_duration_ms INTEGER NOT NULL,
  confidence      DECIMAL,
  citations_count INTEGER,
  
  -- Outcome
  outcome         TEXT,                       -- 'streamed_to_user' | 'background_draft' | 'failed'
  error_message   TEXT,
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_inference_log_tenant ON ai_inference_log(tenant_id, created_at);
CREATE INDEX idx_inference_log_user ON ai_inference_log(user_id, created_at);
```

This log enables:
- Custodian review of AI behaviour patterns
- Per-clinician usage analytics
- Performance monitoring
- Incident investigation (what happened in this consultation?)

### 23.4 The Patient Data Subject Access

When a patient requests access to their data (Bible 4.6 §11.3 JSON archive):

The archive includes:
- Their patient record content
- All feed entries (notes, photos, letters, etc.)
- Audit log of who accessed their record
- AI inference log entries for their consultations (which AI suggestions were surfaced and what happened with them)

The archive does NOT include:
- The training corpus (not theirs; not them)
- Other patients' data (not theirs)
- The model weights (not theirs)

### 23.5 The Patient Data Deletion (GDPR Right To Erasure)

When honoured:
- Patient record soft-deleted, then hard-deleted after 7-year clinical retention period
- Audio recordings: immediate deletion
- Per-user training examples derived from this patient's consultations: removed
- Training corpus examples: not affected (those were anonymised before approval, no patient identifiable)
- AI inference logs: anonymised summaries retained for clinical governance; specific patient ID removed

---

## 24. Acceptance Criteria for "Ambient AI Is Built"

The AI is "built" for Phase 1 when:

### 24.1 The Base Infrastructure

- [ ] Gemma 4 31B Q4_K_M loaded on M4 Max, achieving 25+ tokens/sec
- [ ] AI server FastAPI process running, exposing /v1/health
- [ ] Cloudflare Tunnel operational at ai.rolde.app
- [ ] Web app health check polling working with graceful degradation banner
- [ ] PubMedBERT loaded and functional for embedding generation
- [ ] Supabase pgvector extension active with all required schemas

### 24.2 The RAG Architecture

- [ ] Global RAG corpus seeded with ≥100 NICE guidelines + ≥50 SIGN guidelines + ≥1,000 eMC SmPCs
- [ ] Hybrid retrieval (vector + full-text) operational
- [ ] Per-tenant RAG corpus upload flow tested
- [ ] Citation provenance correct end-to-end (clinician can trace any citation to source)

### 24.3 The Training Data Foundation

- [ ] Training corpus schema created with encryption configuration
- [ ] First fine-tuning run completed using Roland-curated initial corpus (≥500 examples)
- [ ] Evaluation set held-out (≥200 examples)
- [ ] Backup tiers operational (5-tier strategy from §6.5)

### 24.4 The Validated Correction Pipeline

- [ ] Thumbs-down on AI card opens correction modal
- [ ] Submission creates anonymised correction_queue row
- [ ] Custodian admin shows pending corrections
- [ ] Accept/reject flow works end-to-end
- [ ] Notification to clinician on decision

### 24.5 The Custodian Update Console

- [ ] Custodian admin AI section operational
- [ ] Models page shows current production version
- [ ] Corpus page shows training examples count and additions
- [ ] Correction queue functional
- [ ] Guideline gaps log functional
- [ ] Fine-tuning run trigger works
- [ ] Promotion → 48h shadow → comparison metrics → promote/reject decision

### 24.6 The Continuous Monitoring

- [ ] All 12 Phase 1 rules implemented (Bible 4.4 §8.8)
- [ ] pg_cron scheduling functional
- [ ] Pure-SQL rules generating correct alerts
- [ ] AI-augmented rules calling AI server correctly
- [ ] Critical alerts bypass paused-suggestions (per §12.5)

### 24.7 The Ambient AI Behaviours

- [ ] Ambient session opens on consultation start
- [ ] Suggestion cards surface on detected triggers
- [ ] Direct queries answered with citations
- [ ] "I don't know" responses for low-confidence
- [ ] Discharge summary draft prepared in background, modal opens instantly on click

### 24.8 The Confidence Indicators

- [ ] Confidence bar visible on every AI response
- [ ] Citation count and source list rendered
- [ ] Sub-threshold responses surface "I don't know" card
- [ ] Guideline gap log entries created when "I don't know" is logged

### 24.9 The Drug Safety Reasoning

- [ ] All Bible 4.5 §6 safety rules functional
- [ ] AI-augmented assessments for unknown interactions surface with disclaimer
- [ ] Safety overrides audit-logged with reason

### 24.10 The Per-User Personalisation

- [ ] Per-user LoRA training infrastructure built (deferred to "operational acceptance" — actual training waits for sufficient data)
- [ ] User language examples captured during AI-edit cycles
- [ ] Inference falls back gracefully when no user LoRA exists

### 24.11 The Privacy and Audit

- [ ] AI inference log captures every inference
- [ ] PHI handling per §23.1 verified
- [ ] Cross-tenant inference isolation tested
- [ ] Audit log immutable enforcement tested

### 24.12 The Operational Acceptance

- [ ] Roland personally uses AI suggestions in real consultations at Doc For Drivers
- [ ] At least one closed-loop referral flows with AI-drafted letter
- [ ] At least one prescription with AI-suggested renal dose adjustment
- [ ] At least one continuous monitoring critical alert raised and actioned
- [ ] At least one Validated Correction submitted, reviewed, and accepted into corpus
- [ ] At least one fine-tuning run completed with successful 48h shadow comparison and promotion
- [ ] Performance targets (25+ tok/s, <600ms first token) met in production

When all 24.1-24.12 criteria pass, RolDe Phase 1 ambient clinical AI is built.

---

## End of Bible 4.7

This is the architectural depth that distinguishes RolDe. The constitutional commitments from Bible 4.0 — drafts autonomously sends nothing autonomously, authority from sources, honest about uncertainty, training data crown jewel — all operationalised into specific schemas, pipelines, services, and guardrails.

When in doubt about an AI decision: does it preserve the agentic boundary? Does it cite sources? Does it pass through the Validated Correction Pipeline before training? Does it use the Custodian-only promotion path? Does the privacy architecture protect the patient?

The next sub-Bible to draft is **4.8 — RolDe Roadmap and Phasing**, which sequences everything across Phase 1 (launch), Phase 1.5 (multimodal), Phase 2 (M5 Studio + premium tier), Phase 3 (UK regulated hosting + multi-clinic scale), and Phase 4 (NHS-grade — deferred).

After 4.8, the queued sequence is **Bible 5 (Doc For Drivers)** then **Bible 5.M (Doc For Drivers website)** then **Bible 6 (Doc For Skin)** then **Bible 6.M (Doc For Skin website)** — your specifically requested clinic-website Bibles.

— Roland Manoj Jayasekhar, with Devipangaj
RoDee, May 2026
