# Ana — Neuroscience-Informed Journaling & Somatic Reset System

> **Google Cloud & Hack2Skill APAC GenAI Academy (Cohort 3) — Ideathon Challenge**  
> **Public Repository:** [https://github.com/rafifernandaa/ana.git](https://github.com/rafifernandaa/ana.git)

Ana is a production-grade, neuroscience-grounded journaling and somatic reset companion built on **Google AI Studio**, **Google Cloud Run**, and **Cloud Firestore**. By integrating empirical principles of neuroplasticity, affect labeling, cognitive reframing, expressive writing, synaptic pruning rituals, and polyvagal glimmer anchoring, Ana empowers users to physically rewire stress responses, externalize cognitive distortions, and track subjective neural adaptability over longitudinal timeframes.

---

## 🏛️ System Architecture

Ana employs a **Zero-Client-Key Architecture**: the browser client never receives, bundles, or directly accesses API credentials. All AI calls, database operations, and external notification dispatches are routed through an Express backend proxy running on Google Cloud Run.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             CLIENT (BROWSER)                                │
│   React 19 + TypeScript 5.8 + Vite 6 + Tailwind CSS 4 + Motion + Three.js   │
└──────────────────────┬───────────────────────────────┬──────────────────────┘
                       │ HTTPS / JSON                  │ Firebase Auth
                       ▼                               ▼
┌──────────────────────────────────────────────┐  ┌───────────────────────────┐
│              GOOGLE CLOUD RUN                │  │    FIREBASE AUTHENTICATION│
│   Node.js 24 + Express 4 Backend Proxy       │  │    Google OAuth Provider  │
│   (/dist/server.cjs - Zero-Trust Gateway)    │  └─────────────┬─────────────┘
└──────┬───────────────┬───────────────┬───────┘                │
       │               │               │                        │ UID Verified
       ▼               ▼               ▼                        ▼
┌──────────────┐ ┌───────────┐ ┌──────────────┐   ┌───────────────────────────┐
│GOOGLE SECRET │ │GOOGLE AI  │ │RESEND /      │   │      CLOUD FIRESTORE      │
│   MANAGER    │ │  STUDIO   │ │SENDGRID REST │   │ Strict User-Isolated Data │
│GEMINI_API_KEY│ │Gemini 3.8 │ │Transactional │   │  /users/{userId}/*        │
│RESEND_API_KEY│ │Flash +    │ │Circadian     │   │(Entries, Sessions, Loops, │
│              │ │Ladder     │ │Notifications │   │ Glimmers, Telemetry)      │
└──────────────┘ └───────────┘ └──────────────┘   └───────────────────────────┘
```

- **Frontend**: React 19, TypeScript 5.8, Vite 6, Tailwind CSS 4, Motion (`motion/react`), Three.js (`@react-three/fiber`, `@react-three/drei`), Lucide React, Recharts, Canvas Confetti.
- **Backend Proxy**: Node.js 24, Express 4, Google GenAI SDK (`@google/genai`), Dotenv, Esbuild.
- **Database & Auth**: Firebase Authentication (Google OAuth), Cloud Firestore (isolated subcollections).
- **Deployment & Cloud**: Google Cloud Run, Google Secret Manager, Google Cloud Scheduler, Cloud Logging.

---

## 🧠 Neuroscience Pillars Implemented

1. **Affect Labeling**: Transforming raw, unnamed somatic tension into precise emotional nomenclature, immediately down-regulating amygdala hyperactivity.
2. **Synaptic Pruning Ritual**: Cognitive distortion deconstruction powered by Gemini, concluding with an interactive particle dissolution ceremony that rewires catastrophizing into prefrontal rational anchors (`/users/{userId}/pruned_loops`).
3. **Cognitive Reframing**: Automated cognitive restructuring separating camera-verifiable facts from emotional projections.
4. **Polyvagal Glimmer Vault**: Mining and anchoring autonomic safety micro-moments to engage the ventral vagal brake (`/users/{userId}/glimmers`).
5. **Psychiatric Decentering ("Vent-to-Clarity" Station)**: Transforms unstructured venting into clinical clarity with anti-rumination pacing, camera-fact filtering, Circle of Control mapping, and physiological sigh breathwork (`/users/{userId}/psychiatric_distillations`).
6. **Circadian Loop Closure**: Morning dopamine priming and evening cognitive offloading (`/users/{userId}/circadian_entries`) paired with transactional email nudges to prevent cortisol-driven sleep disruption.
7. **Empirical Telemetry Extraction**: Structured longitudinal tracking of sleep score, somatic tension, and mental clarity synthesized across multi-week arcs.

---

## 🛡️ Cloud Firestore Security Rules

To guarantee complete cross-user data isolation and zero cross-tenant data leakage, the following security rules are enforced at the Firestore database boundary:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Zero Insecure Defaults: strict user-isolation rule
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      match /interactions/{interactionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      match /entries/{entryId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      match /sessions/{sessionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      match /pruned_loops/{loopId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      match /glimmers/{glimmerId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      match /{document=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

---

## 📜 Google AI Studio Setup & System Directives (Constitution)

Ana uses Google AI Studio system instructions to enforce grounded clinical empathy, tone directives, and strict schema compliance.

### 1. Model Configuration
- **Primary Model**: `gemini-3.8-flash`
- **Fallback Ladder**: `gemini-3.8-flash` → `gemini-3.7-flash` → `gemini-3.6-flash`
- **Response Format**: Structured JSON schema output (`application/json`) with defensive server-side parsing.

### 2. System Directive (Constitution)
```text
You are Ana, an empathetic, neuroscience-grounded journaling and cognitive reflection companion.
Principles:
1. Grounded Empathy: Acknowledge emotional reality without toxic positivity or dismissive cheerfulness.
2. Neuroscience Foundation: Use affect labeling, cognitive reframing, and polyvagal theory to ground the user.
3. No Clinical Diagnostics: Never diagnose psychiatric disorders or prescribe medical interventions. Offer somatic grounding and perspective shifts.
4. Schema Strictness: Always respond using the requested structured JSON schema.
```

---

## 🔐 Google Cloud Secret Manager Configuration

Secrets are never committed to version control or bundled into client code. Configure them in Google Secret Manager:

```bash
# 1. Enable Google Cloud APIs
gcloud services enable run.googleapis.com secretmanager.googleapis.com

# 2. Create Gemini API Key secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 3. Create Resend API Key secret (for Circadian transactional email reminders)
gcloud secrets create RESEND_API_KEY --replication-policy="automatic"
echo -n "YOUR_RESEND_API_KEY" | gcloud secrets versions add RESEND_API_KEY --data-file=-

# 4. Grant Cloud Run Service Account permissions to access secrets
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format="value(projectNumber)")
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding RESEND_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 🚀 Google Cloud Run Deployment Guide

Deploy Ana directly to Cloud Run with automated secret bindings:

```bash
# 1. Deploy service with Secret Manager bindings and Challenge verification labels
gcloud run deploy ana-neuro-journal \
  --source . \
  --platform managed \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest,RESEND_API_KEY=RESEND_API_KEY:latest" \
  --set-env-vars="NODE_ENV=production,RESEND_FROM_EMAIL=Ana Journal <onboarding@resend.dev>" \
  --update-labels=dev-tutorial=cloud-run-ai-challenge

# 2. Configure Google Cloud Scheduler for Circadian Inactivity Checks (every 4 hours)
SERVICE_URL=$(gcloud run services describe ana-neuro-journal --region=asia-southeast1 --format="value(status.url)")

gcloud scheduler jobs create http ana-circadian-cron \
  --schedule="0 */4 * * *" \
  --uri="${SERVICE_URL}/api/scheduler/check-inactivity" \
  --location=asia-southeast1 \
  --http-method=POST \
  --message-body='{"thresholdHours":20}' \
  --headers="Content-Type=application/json"
```

---

## 📧 Resend API Transactional Email Setup

Ana includes a transactional email dispatch service that prompts users to close cognitive loops when inactive for over 20 hours:

1. Create a free API key at [resend.com/api-keys](https://resend.com/api-keys) (3,000 free emails/month).
2. **Resend Free Tier Rule**: In free sandbox mode, Resend sends from `onboarding@resend.dev` and **only delivers to the email address registered on your Resend account**.
3. In Ana's Settings workspace, input your Resend account email as the **Recipient Email Address** to receive live alerts.
4. Check your **Spam / Junk** folder if the email does not appear in your Primary inbox.

---

## 💻 Local Development & Build Commands

### Prerequisites
- Node.js 20+ (Node 24 recommended)
- npm 10+
- Google Cloud SDK (`gcloud`)

### Installation
```bash
# Clone the repository
git clone https://github.com/rafifernandaa/ana.git
cd ana

# Install dependencies
npm install

# Setup local environment variables (.env)
cp .env.example .env
# Fill in GEMINI_API_KEY, FIREBASE credentials, and optional RESEND_API_KEY
```

### Commands
| Command | Description |
| :--- | :--- |
| `npm run dev` | Runs the full-stack app locally using Vite middleware on Express (`localhost:3000`) |
| `npm run lint` | Runs type checks across the entire codebase (`tsc --noEmit`) |
| `npm run build` | Builds Vite frontend into `dist/` and bundles `server.ts` into `dist/server.cjs` via esbuild |
| `npm start` | Runs the compiled production server (`node dist/server.cjs`) |
| `npm run clean` | Removes compiled artifacts (`dist/`) |

---

## 🔒 5-Zone Threat Modeling & Security Matrix

| Threat Zone | Identified Risk | Implemented Countermeasure |
| :--- | :--- | :--- |
| **Input Surfaces** | Prompt injection, PII leakage, malformed payloads | DLP sanitization regex filter, body bounds (`10mb` limit), strict schema validation. |
| **Planning & Reasoning** | Rate limits (429), model unavailability (503), hallucination | 3-tier fallback ladder (`gemini-3.8-flash` → `gemini-3.7-flash` → `gemini-3.6-flash`). |
| **Tool Execution** | SSRF, privilege escalation, unauthenticated endpoints | Server-side API proxying (`/api/gemini/*`); zero client-side credential exposure. |
| **Memory & State** | Cross-tenant data leakage in Firestore | Strict owner-bound security rules (`request.auth.uid == userId`) across all subcollections. |
| **Inter-System Comm** | API key leakage in client bundles, network sniffing | Dynamic secret resolution via Google Cloud Secret Manager at runtime. |

---

## 📄 License & Attribution
Engineered by **Rafif Fernanda** for the **Google Cloud & Hack2Skill APAC GenAI Academy (Cohort 3) Ideathon Challenge**.
Licensed under the Apache-2.0 License.
