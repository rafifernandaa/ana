# Project: Ana — Neuroscience-Informed Journaling & Somatic Reset System

## Context & Challenge Overview
- **Challenge**: Google Cloud & Hack2Skill APAC GenAI Academy (Cohort 3) — Ideathon Challenge.
- **Mission**: A neuroscience-grounded, production-grade journaling and somatic reset companion with custom security directives on Google AI Studio and Google Cloud Run.
- **Key Deliverables**:
  1. Google AI Studio Setup with Custom Security Directives (Constitution).
  2. Production Personal Gemini Journal (OAuth, multi-turn chat, Firestore isolation, Secret Manager).
  3. Original Enhancements: Empirical Telemetry, Circadian Loop Closure, Somatic Reset Room (3D), Psychiatric Decentering, DLP Privacy Redaction, Handwritten OCR.

---

## Tech Stack
- **Frontend**: React 19, TypeScript 5.8, Vite 6, Tailwind CSS 4, Motion (`motion/react`), Canvas Confetti, Lucide React, Recharts, Three.js (`@react-three/fiber`, `@react-three/drei`).
- **Backend**: Node.js 24, Express 4, Google GenAI SDK (`@google/genai`), Dotenv, Esbuild.
- **Database & Auth**: Firebase Authentication (Google OAuth), Cloud Firestore (user-isolated subcollections).
- **Deployment & Cloud**: Google Cloud Run, Google Secret Manager, Cloud Logging.

---

## Commands
- **Dev**: `npm run dev` (runs tsx server.ts with Vite in middleware mode on port 3000)
- **Build**: `npm run build` (vite build + esbuild server.ts into dist/server.cjs)
- **Production Start**: `npm start` (runs node dist/server.cjs)
- **Type Check / Lint**: `npm run lint` (`tsc --noEmit`)
- **Clean**: `npm run clean` (`rm -rf dist server.cjs`)

---

## Architecture & Code Conventions
1. **Functional React & Strict Typing**:
   - Strictly typed components and state interfaces (`src/types.ts`).
   - Hooks-driven state management with clean separation of concerns.
2. **Server-Side API Proxying (Zero Client Keys)**:
   - Client calls `/api/gemini/*` endpoints on Express.
   - `server.ts` holds Gemini client and Secret Manager bindings.
   - Client never receives, bundles, or directly accesses API keys.
3. **Resilient Gemini Fallback Ladder**:
   - Model succession (Strictly 3.6+): `gemini-3.8-flash` → `gemini-3.7-flash` → `gemini-3.6-flash`.
   - All AI calls must use structured JSON schema enforcement with defensive fallback parsing.
4. **Isolated Firestore Access Patterns**:
   - Subcollections strictly scoped to authenticated UID: `/users/{userId}/*` (`entries`, `sessions`, `pruned_loops`, `glimmers`, `circadian_entries`, `psychiatric_distillations`).
   - All client writes use `stripUndefined()` before mutation to prevent Firestore driver crashes.
   - `firestore.rules` enforces `request.auth.uid == userId`.
5. **Aesthetic & Design System**:
   - Aether-Void Rice Terminal aesthetic: Dark base (`#121212`, `#181818`, `#262626`), olive borders (`#3D4028`), moss accents (`#A3A649`), rust warnings (`#AD3D30`), slate text (`#e2e8f0`).
   - Monospace accents, high contrast readability, clean tiling layout manager.

---

## Key Backend API Endpoints (`server.ts`)
- `GET /api/health` — Service and Gemini configuration status
- `POST /api/gemini/chat` — Multi-turn conversational journaling with contextual history
- `POST /api/gemini/summarize` — AI executive summary, key takeaways, reflection questions
- `POST /api/gemini/reframe` — Cognitive reframing and perspective shifts
- `POST /api/gemini/prune-loop` — Synaptic loop pruning and somatic discharge
- `POST /api/gemini/extract-glimmers` — Polyvagal micro-moment discovery
- `POST /api/gemini/circadian-coach` — Circadian rhythm-aligned pacing guidance
- `POST /api/gemini/psychiatric-decenter` — Defusion, unblending, and observer-self distillation
- `POST /api/gemini/extract-telemetry` — Longitudinal metric extraction (sleep, tension, clarity)
- `POST /api/gemini/longitudinal-synthesis` — Multi-week trend correlation and insight generation
- `POST /api/privacy/redact-dlp` — Client-side / server-side PII and credential sanitization
- `POST /api/journal/handwritten-ocr` — Multimodal handwriting-to-digital transcription
- `POST /api/notifications/send-email` — Circadian inactivity transactional notification
- `POST /api/sheets/sync` — Dual-mode Google Sheets data synchronization

---

## Boundaries & Security
- Never commit `.env` or raw secrets to version control.
- Never write API keys into frontend code or HTML templates.
- Always validate request bodies on Express (`express.json()`, string trimming, length bounds).
- Preserve user privacy: zero cross-user data leakage in Firestore or server memory.
- Tone directive: Grounded empathy, polyvagal attunement, cognitive reframing; never toxic positivity or unverified clinical diagnostics.
- Git Synchronization: Always maintain sync with `https://github.com/rafifernandaa/ana.git`.
