# Gemini Reflection Journal

A secure, user-authenticated reflective journal web application built with **React**, **Express**, **Google Gemini 3.6 Flash**, and **Cloud Firestore**.

## Features

- **Google Federated Authentication**: Secure login via Google Sign-In using Firebase Authentication (no passwords stored in application custom code).
- **Private User Dashboard**: Multi-turn journaling and reflective dialogue space.
- **Empathetic AI Reflection Partner**: Powered by the Gemini 3.6 Flash API with an automated 4-model fallback ladder (`gemini-3.6-flash` &rarr; `gemini-3.1-flash-lite` &rarr; `gemini-flash-latest` &rarr; `gemini-3.7-flash`).
- **Structured AI Summaries & Insights**: Instant extraction of core takeaways, mood assessment, introspective questions, and tags.
- **Owner-Bound Firestore Isolation**: All journal entries and interaction records are strictly isolated under `/users/{userId}/...` paths enforced by Firebase Security Rules.
- **Zero-Hardcoded Secrets**: All API keys and environment variables are strictly managed on the server side with Secret Manager.

---

## 1. Architecture & Threat Model

| Threat Zone | Identified Risk | Implemented Countermeasure |
| :--- | :--- | :--- |
| **Input Surfaces** | Malicious payloads & Prompt injection | Strict schema validation, sanitization, and parameterized prompts |
| **Planning & Reasoning** | API rate limits & availability | Resilient 4-model fallback ladder on the Express proxy server |
| **Tool Execution** | SSRF & Token leakage | Server-side API proxying (`/api/gemini/*`); zero client-exposed keys |
| **Memory & State** | Cross-user data leaks in database | Strict Firestore Security Rules (`request.auth.uid == userId`) |
| **Inter-System Comm** | API key leakage in version control | GCP Secret Manager runtime secret injection |

---

## 2. Cloud Firestore Security Rules

Deploy the following security rules to guarantee strict owner-bound data isolation:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User data isolation: strictly owner-accessible
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      match /interactions/{interactionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      match /entries/{entryId} {
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

## 3. Secret Management Setup (Google Cloud Secret Manager)

Create and populate the `GEMINI_API_KEY` secret, then grant access to the Cloud Run default runtime service account:

```bash
# 1. Enable required APIs
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com

# 2. Create and populate the Gemini API key secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 3. Grant the Cloud Run compute service account access to read the secret
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format="value(projectNumber)")

gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 4. Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables in `.env`:
   ```env
   GEMINI_API_KEY="YOUR_API_KEY"
   APP_URL="http://localhost:3000"
   ```

3. Start the unified development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

---

## 5. Cloud Run Deployment Flow

### Step 1: Deploy the Service to Cloud Run

```bash
gcloud run deploy gemini-reflection-journal \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest" \
  --set-env-vars="NODE_ENV=production"
```

### Step 2: Apply Required Campaign Verification Label

Apply the mandatory challenge verification label to register your Cloud Run service:

```bash
gcloud run services update gemini-reflection-journal \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

---

## 6. Functional Verification Walkthrough

Follow these steps to manually test and verify every interaction flow:

1. **Unauthenticated Landing**: Open the app URL and verify the welcoming landing card with Google Sign-In prompt.
2. **Google Authentication**: Click **Sign In with Google**. Confirm authentication state updates and user avatar/name appear in the navbar.
3. **Drafting a Reflection**: Enter a title, choose a mood (e.g. *Reflective*), add tags, and write a reflection in the canvas.
4. **Conversing with Gemini**: Type a question or click a prompt chip in the reflective dialogue section. Verify the response streams/renders using `gemini-3.6-flash`.
5. **AI Summarization**: Click **Generate AI Insights** to generate structured key takeaways, reflection questions, and emotional analysis.
6. **Firestore Persistence**: Click **Save to Firestore** (or see auto-save trigger). Verify the entry appears in the past reflections sidebar under the user's isolated collection.
7. **History Navigation**: Create a second entry, then switch between past entries in the sidebar. Confirm all data and messages reload accurately.
8. **Owner Isolation Verification**: Log out and log in with a different user account to verify the second user cannot view or access the first user's reflections.
