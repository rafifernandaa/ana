# Project Map: Ana (Architecture & Subsystems Index)

> **Purpose**: Level 2 Context document for developers and AI agents. Load this document to quickly locate files, APIs, schemas, and architectural patterns without context flooding.

---

## 1. System Architecture Overview

Ana is built as a **Neuroscience-Informed Journaling & Somatic Reset System** designed for the Google Cloud & Hack2Skill APAC GenAI Academy Ideathon Challenge.

```
┌───────────────────────────────────────────────────────────┐
│                     React 19 Frontend                     │
│  - Rice Terminal (Dark / Moss / Slate / Olive)            │
│  - Studio, Archive, Telemetry, Config Workspaces          │
│  - 3D Somatic Reset Room (Three.js / Web Audio API)       │
└─────────────────────────────┬─────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌───────────────────────────┐   ┌───────────────────────────┐
│   Firebase Auth & Store   │   │     Express 4 Backend     │
│ - Google OAuth2           │   │ - Node.js 24 / Vite Proxy │
│ - User-Isolated Firestore │   │ - Zero Client-Side Keys   │
│   (/users/{uid}/*)        │   │ - Google Cloud Run Ready  │
└───────────────────────────┘   └─────────────┬─────────────┘
                                              │
                                ┌─────────────┴─────────────┐
                                ▼                           ▼
                  ┌───────────────────────────┐   ┌───────────────────────────┐
                  │   Google GenAI SDK        │   │ Cloud Ecosystem & Privacy │
                  │ - gemini-3.8-flash        │   │ - Secret Manager          │
                  │ - gemini-3.7-flash        │   │ - Inactivity Email API    │
                  │ - gemini-3.6-flash        │   │ - Google Sheets Sync      │
                  │ - Strict JSON Schema      │   │ - DLP Redaction Engine    │
                  └───────────────────────────┘   └───────────────────────────┘
```

---

## 2. Directory Structure & Key Files

### Root Configuration
- `server.ts` — Main Express backend server, Gemini proxy routes, DLP redaction, and Vite dev middleware.
- `CLAUDE.md` / `AGENTS.md` — Level 1 persistent agent rules and commands.
- `firestore.rules` — Strict security rules enforcing `request.auth.uid == userId`.
- `package.json` — Dependencies and scripts (`dev`, `build`, `lint`, `start`).
- `vite.config.ts` — Vite 6 configuration with React and Tailwind plugins.

### Frontend (`src/`)
- `App.tsx` — Top-level root application, workspace router, auth state provider, and modal container.
- `types.ts` — Canonical TypeScript contracts for JournalEntry, EmpiricalTelemetry, SomaticResetSession, etc.
- `index.css` — Tailwind CSS 4 theme variables, custom scrollbars, and Aether-Void styling.

### Components (`src/components/`)
- **Core Workspaces**:
  - `StudioWorkspace.tsx` — Active writing environment, telemetry inspector, prompt bar, and chat panel.
  - `ArchiveWorkspace.tsx` — Saved entry gallery, date filters, mood tags, and glimmers.
  - `ArchiveStatisticsView.tsx` — Empirical telemetry analytics, longitudinal trends, correlation charts.
  - `ConfigWorkspace.tsx` — Google Sheets dual-mode sync, email notification tester, and profile settings.
  - `FeaturesWorkspace.tsx` — Product overview detailing neuroscience mechanisms.
- **Somatic & Reset Tools**:
  - `ResetRoomModal.tsx` — Full-screen 3D somatic reset chamber with pacing ball and interactive breathing.
  - `3d/` — Three.js canvas components, procedural starfield/ambient shaders.
  - `BodyMapSelector.tsx` — Interactive SVG body map for localizing somatic gripping and tension.
  - `SynapticPruningModal.tsx` — Interactive thought unburdening and cognitive loop severance.
  - `PsychiatricDecenteringStation.tsx` — ACT & IFS unblending module for cognitive defusion.
  - `GlimmerVaultModal.tsx` — Polyvagal safety cue collector.
  - `HandwrittenCaptureModal.tsx` — Multimodal camera/file upload for handwriting OCR.
- **Chrome & Layout**:
  - `AetherHeader.tsx` — System header with active user, status badges, and audio engine control.
  - `Navbar.tsx` — Workspace navigation tabs.
  - `RiceSidebarDock.tsx` — Floating terminal side dock for rapid tool access.
  - `TilingWindowManager.tsx` — Responsive tiling split-screen layout manager.
  - `SecurityArchitectureModal.tsx` — Live diagram of Google Cloud Run & Secret Manager architecture.

### Client Libraries (`src/lib/`)
- `firebase.ts` — Firebase client initialization, auth helpers, Firestore export.
- `geminiService.ts` — Client HTTP calls to `/api/gemini/*` proxies with typed payloads.
- `journalService.ts` — User-isolated Firestore CRUD operations with `stripUndefined()`.
- `circadianAudio.ts` — Synthetic binaural audio generator using Web Audio API (alpha/theta/delta).
- `numericalDataParser.ts` — Pearson correlation calculations, lagged regression, telemetry stats.
- `sheets.ts` — Integration layer for Google Sheets webhook / Apps Script syncing and CSV exports.
- `email.ts` — Helper for invoking transactional circadian reminder emails.
- `theme.tsx` — Design token definitions and styling helpers.

---

## 3. Backend API Registry (`server.ts`)

| Endpoint | Method | Purpose | Key Fallback Ladder |
|---|---|---|---|
| `/api/health` | `GET` | Health check & Gemini API key verification | N/A |
| `/api/gemini/chat` | `POST` | Multi-turn conversational journaling partner | 3.8 → 3.7 → 3.6 |
| `/api/gemini/summarize` | `POST` | Generates summary, key takeaways, and reflection questions | 3.8 → 3.7 → 3.6 |
| `/api/gemini/reframe` | `POST` | Cognitive reframing (CBT/Stoic perspective shifting) | 3.8 → 3.7 → 3.6 |
| `/api/gemini/prune-loop` | `POST` | Synaptic loop extraction & somatic release ritual | 3.8 → 3.7 → 3.6 |
| `/api/gemini/extract-glimmers` | `POST` | Scans entry for Polyvagal micro-moments of ventral vagal safety | 3.8 → 3.7 → 3.6 |
| `/api/gemini/circadian-coach` | `POST` | Generates circadian alignment & chronobiological advice | 3.8 → 3.7 → 3.6 |
| `/api/gemini/psychiatric-decenter` | `POST` | Defuses cognitive fused identities into the observer-self | 3.8 → 3.7 → 3.6 |
| `/api/gemini/extract-telemetry` | `POST` | Extracts structured telemetry (sleep, tension, energy, clarity) | 3.8 → 3.7 → 3.6 |
| `/api/gemini/longitudinal-synthesis` | `POST` | Multi-entry synthesis & lagged correlation analysis | 3.8 → 3.7 → 3.6 |
| `/api/privacy/redact-dlp` | `POST` | Sanitizes sensitive entities, credentials, and PII | Local Regex / DLP |
| `/api/journal/handwritten-ocr` | `POST` | Multimodal OCR transcription of handwritten journals | 3.8 → 3.7 → 3.6 |
| `/api/notifications/send-email` | `POST` | Dispatches circadian inactivity reminders (SendGrid/Resend) | N/A |
| `/api/sheets/sync` | `POST` | Syncs entries and telemetry to Google Sheets via Webhook/API | N/A |

---

## 4. Key Data Contracts (`src/types.ts`)

- `JournalEntry`: Master record containing `id`, `userId`, `title`, `content`, `mood`, `tags`, `messages`, `aiSummary`, `empiricalTelemetry`, `createdAt`, `updatedAt`.
- `EmpiricalTelemetry`: Structured quantitative ratings (`sleepScore`, `energyLevel`, `somaticTension`, `mentalClarity`), binary habits, stressors, and `laggedImpactPrediction`.
- `SomaticResetSession`: Records duration, breathing pattern, target tension regions, and pre/post tension delta.
- `PsychiatricDistillation`: ACT-style defusion analysis separating raw observation from fused narratives.
- `CircadianPhase`: Enumeration (`morning_priming`, `midday_grounding`, `evening_closure`).
