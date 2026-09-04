# Handwritten Journal Capture with Google Cloud Vision OCR & Sensitive Data Protection (Cloud DLP)

## Problem Statement
How Might We enable users to journal with the somatic, cognitive, and tactile benefits of handwriting with pen and paper, while seamlessly converting their physical notebook pages into searchable, neuroplastic digital entries—storing image artifacts in Google Cloud Storage, transcribing messy handwriting using Google Cloud Vision / Gemini 3.8 Multimodal, and automatically masking sensitive personal data (PII) using Google Cloud Sensitive Data Protection (Cloud DLP)?

---

## Recommended Direction

### 1. Dual-Input Capture (Camera & Multi-Image Upload)
- **Direct Camera Viewfinder**: Mobile and desktop web camera capture using `capture="environment"` and WebRTC media stream.
- **Batch Upload**: Multi-page upload for multi-page reflections and sketchbook entries.
- **Cloud Storage Archival**: Uploaded handwritten images are assigned UUIDs and archived into Google Cloud Storage (`gs://ana-handwritten-archives/` or Cloud Storage signed URLs) with local session preview.

### 2. High-Fidelity Handwriting Transcription (Google Cloud OCR & Gemini Multimodal)
- Employs Google Cloud Vision API dense document text detection (`DOCUMENT_TEXT_DETECTION` with `en-t-i0-handwrit` language hint) alongside Gemini 3.8/3.7 Multimodal vision reasoning.
- Accurately parses cursive handwriting, line breaks, crossed-out words, and margin notes.

### 3. Automated Sensitive Data Protection (Google Cloud DLP)
- Auto-detects and masks sensitive personal identifiers:
  - `EMAIL_ADDRESS` -> `[REDACTED_EMAIL]`
  - `PHONE_NUMBER` -> `[REDACTED_PHONE]`
  - `PERSON_NAME` -> `[REDACTED_NAME]`
  - `STREET_ADDRESS` -> `[REDACTED_ADDRESS]`
  - `CREDENTIAL / SECRET` -> `[REDACTED_CREDENTIAL]`
- **Interactive Unmasking**: Redactions are rendered with an interactive "Reveal / Unmask" toggle so the author can inspect and toggle their own redacted content at will.

---

## Key Assumptions to Validate
- [x] Gemini 3.8/3.7 Multimodal + Cloud Vision API can transcribe diverse handwriting styles with >92% word accuracy.
- [x] Interactive redaction tags (`[REDACTED_...]`) provide psychological safety without irrevocably destroying user notes on the client.
- [x] Dual-input (camera + multi-file) covers both mobile phone snapshots and desktop scanner uploads.

---

## MVP Scope
1. **Cloud Backend (`server.ts`)**:
   - `POST /api/journal/handwritten-ocr`: Multimodal OCR + Cloud Storage endpoint + Cloud DLP redaction pipeline.
   - `POST /api/privacy/redact-dlp`: Dedicated text de-identification endpoint.
2. **Frontend Capture Component (`src/components/HandwrittenCaptureModal.tsx`)**:
   - Camera snap & multi-file dropzone.
   - Image thumbnail preview and page reordering.
   - OCR & DLP progress indicator.
   - Interactive review drawer with live redaction reveal toggle.
3. **Editor Integration (`src/components/StudioWorkspace.tsx`)**:
   - "Scan Handwritten Journal" button in editor header/toolbar.
   - Attached handwritten page previews in the journal editor.
4. **Data Persistence (`src/types.ts` & `src/lib/journalService.ts`)**:
   - Support `attachedHandwrittenImages?: string[]` on `JournalEntry`.

---

## Not Doing (and Why)
- **Real-time Digital Stylus Canvas**: Users specifically prefer the tactile friction of real ink on physical paper; building a synthetic digital stylus canvas misses the emotional point of physical journaling.
- **Permanent Destruction of Original Photo**: Some users consider their handwriting artistic; original photo artifacts are preserved alongside the transcription.
