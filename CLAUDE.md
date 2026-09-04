# Project: Ana — Neuroscience-Informed Journaling & Somatic Reset System

## Context & Challenge Overview
- **Event**: Google Cloud & Hack2Skill APAC GenAI Academy (Cohort 3) — Ideathon Challenge.
- **Goal**: Build a secure, production-grade "Personal Gemini Journal" application with custom security instructions on Google AI Studio and Google Cloud Run.
- **Deliverables**:
  1. Google AI Studio Setup with Custom Security Directives (Constitution).
  2. Working Personal Gemini Journal meeting all core requirements (Auth, Multi-turn Chat, Firestore Isolation, Secret Manager).
  3. Original feature enhancement(s) going beyond the base spec.

---

## Tech Stack
- **Frontend**: React 19, TypeScript 5.8, Vite 6, Tailwind CSS 4, Motion, Canvas Confetti, Lucide React, Recharts, Three.js / @react-three/fiber / @react-three/drei.
- **Backend**: Node.js 24, Express 4, Google GenAI SDK (`@google/genai`), Dotenv, Esbuild.
- **Database & Auth**: Firebase Authentication (Google OAuth), Cloud Firestore (user-isolated subcollections).
- **Deployment**: Google Cloud Run (containerized, serverless, automated secret binding).

---

## Commands
- **Dev**: `npm run dev` (runs tsx server.ts with Vite in middleware mode on port 3000)
- **Build**: `npm run build` (vite build + esbuild server.ts into dist/)
- **Start Production**: `npm start` (runs node dist/server.cjs)
- **Type Check / Lint**: `npm run lint` (`tsc --noEmit`)
- **Clean**: `npm run clean` (`rm -rf dist server.cjs`)

---

## Code Conventions & Architecture
1. **Functional React with Strict Types**:
   - Strictly typed components and state interfaces (`src/types.ts`).
   - Hooks-driven state management with clean separation of concerns.
2. **Server-Side API Proxying (Zero Client-Side Keys)**:
   - Client calls `/api/gemini/*` endpoints on Express.
   - `server.ts` holds the Gemini client and Secret Manager bindings.
   - Client never receives or bundles API keys.
3. **Resilient Gemini Fallback Ladder**:
   - Model succession (Strictly 3.6+): `gemini-3.8-flash` → `gemini-3.7-flash` → `gemini-3.6-flash`.
   - All AI calls must use structured JSON schema enforcement with defensive fallback parsing.
4. **Isolated Firestore Access Patterns**:
   - Subcollections scoped to authenticated UID: `/users/{userId}/*` (`entries`, `sessions`, `pruned_loops`, `glimmers`, `circadian_entries`, `psychiatric_distillations`).
   - All client reads/writes use `stripUndefined()` before mutation to prevent Firestore driver errors.
   - `firestore.rules` enforces `request.auth.uid == userId`.
5. **Aesthetic & Design System**:
   - Aether-Void Rice Terminal aesthetic: Dark base (`#121212`, `#181818`, `#262626`), olive borders (`#3D4028`), moss accents (`#A3A649`), rust warnings (`#AD3D30`), slate text (`#e2e8f0`).
   - High contrast, monospace fonts, clean tiling layout manager.

---

## Git & GitHub Synchronization
- **Mandate**: Always push to GitHub repository `https://github.com/rafifernandaa/ana.git` whenever code is updated.
- Maintain clean commit messages reflecting each change.

---

## Security Boundaries & Rules
- Never commit `.env` or raw secrets.
- Never write API keys into frontend code or HTML templates.
- Always validate request bodies on Express (`express.json()`, string trimming, length bounds).
- Preserve user privacy: zero cross-user leakage in Firestore or server memory.
- Tone directive: Grounded empathy and cognitive reframing; never toxic positivity or unverified clinical diagnostics.
