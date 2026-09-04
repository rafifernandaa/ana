# Google Cloud Ecosystem Integration: Direct Circadian Inactivity Emails & Dual-Mode Google Sheets Sync

## Problem Statement
How Might We leverage Google Cloud platform primitives (Cloud Scheduler, Cloud Run, Transactional Email APIs, and Google Sheets) to transform Ana from an isolated local journaling tool into an autonomous, proactive circadian health companion that keeps users accountable and seamlessly archives their neural reflections into their personal Google Workspace?

---

## Refined Architecture & Selected Directions

### 1. Direct Circadian Inactivity Email Notifications
- **Trigger**: Automated via Cloud Scheduler (`GET/POST /api/scheduler/check-inactivity`) or on-demand via the "Test Email Dispatch" button in Settings.
- **Rules Engine**:
  - Inactivity Threshold: >= 20 hours without a new reflection.
  - Circadian Phase Recognition: Calculates whether the user is in *Morning Dopamine Priming*, *Midday Grounding*, or *Evening Loop Closure*.
  - Personalized Copy: Highlights open cognitive loops and includes a direct magic link back into the Ana Studio.
- **Delivery Providers Supported**:
  - **SendGrid API** via `SENDGRID_API_KEY` (standard Google Cloud marketplace provider).
  - **Resend API** via `RESEND_API_KEY` (modern developer-first email API).
  - **Safe Preview Fallback**: If keys are not set, generates the full HTML template and returns a live preview in the UI and Cloud Run logs.

### 2. Dual-Mode Google Sheets Integration
- **Workflow**:
  - **Automatic Mode**: Background synchronization when an entry is saved in the Studio.
  - **Manual Mode**: One-click "Sync All to Google Sheets" button in Settings / Archive.
- **Connection Methods**:
  - **Google Apps Script / Webhook Bridge**: User creates a private Google Sheet and pastes their deployment webhook URL in Settings. Zero complex GCP service account IAM hurdles for end users!
  - **Server-side API v4**: `POST /api/sheets/sync` formatting entries, glimmers, and somatic reset sessions into structured columns.
  - **Instant CSV Export**: Direct Google Sheets-compatible export format for instant offline data portability.

### 3. Google Cloud Logging & Telemetry
- Structured JSON output on Cloud Run conforming to Google Cloud Logging specs (`severity`, `component`, `timestamp`, `labels`).

---

## Key Assumptions & Validation
- [x] Inactivity threshold of 20h aligns with natural human circadian sleep-wake cycles.
- [x] Webhook / Apps Script bridge provides the highest accessibility for users without requiring GCP IAM admin roles.
- [x] Fallback preview ensures the app continues running cleanly even if email credentials have not been provisioned in the current environment.

---

## MVP Scope
1. **Server Endpoints (`server.ts`)**:
   - Enhanced `/api/scheduler/check-inactivity` with direct email dispatch logic.
   - New `/api/notifications/send-email` for on-demand verification and testing.
   - New `/api/sheets/sync` for processing Google Sheets batch syncs and webhook relaying.
2. **Client Services (`src/lib/sheets.ts` & `src/lib/email.ts`)**:
   - Typed utilities for Google Sheets sync and email testing.
3. **Settings UI (`src/components/ConfigWorkspace.tsx`)**:
   - Google Workspace & Cloud Ecosystem card with:
     - Email notification test console with live status.
     - Google Sheets connection card (Webhook URL / Sheet ID, Auto-Sync toggle, Sync Now button, setup instructions).

---

## Not Doing (and Why)
- **Direct SMTP over Port 25**: Google Cloud blocks egress on port 25 to prevent spam; using HTTPS REST transactional email APIs (SendGrid / Resend) is Google Cloud's official best practice.
- **Complex OAuth2 Consent Screen for Every User**: Asking users to complete a full OAuth consent screen for their personal sheets creates high friction. Providing the Apps Script webhook + CSV + Server API provides instant utility in 30 seconds.
