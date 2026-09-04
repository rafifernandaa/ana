# Ana — Neuroscience-Informed Journaling & Somatic Reset System

Ana is a neuroscience-grounded journaling and emotional regulation web application built on **Google AI Studio**, **Google Cloud Run**, and **Cloud Firestore**. By integrating principles of neuroplasticity, affect labeling, cognitive reframing, expressive writing, synaptic pruning rituals, and polyvagal glimmer anchoring, Ana empowers users to physically rewire stress responses and track subjective neural adaptability.

---

## 🧠 Neuroscience Pillars Implemented

1. **Neuroplasticity & Synaptic Pruning:**
   - **Synaptic Pruner Ritual**: Deconstructs catastrophic ruminations and cognitive distortions using the Gemini AI API, followed by a particle dissolution ceremony that rewires thought loops into prefrontal rational anchors stored in Firestore (`/users/{userId}/pruned_loops`).
2. **Affect Labeling:**
   - Putting exact somatic and emotional words to unnamed tension, dampening amygdala reactivity in real-time.
3. **Cognitive Reframing:**
   - Rewriting stressful automatic narratives into grounded, actionable perspectives.
4. **Expressive Writing (Pennebaker Paradigm):**
   - Multi-turn conversational journaling and reflection summaries with resilient fallback model ladders.
5. **Polyvagal Glimmer Vault:**
   - Mining and anchoring micro-moments of autonomic safety and sensory calm to engage the ventral vagal brake (`/users/{userId}/glimmers`).
6. **Psychiatric Decentering ("Vent-to-Clarity" Station):**
   - Implements evidence-based psychiatric journaling principles: transforms an unstructured emotional vent into an externalized cognitive workbench. Features an anti-rumination timer, AI-powered separation of "camera-verifiable facts" from "interpretive projections", Circle of Control agency mapping, a 5-minute micro-action anchor, and an interactive dual-inhalation Physiological Sigh grounding pacer (`/users/{userId}/psychiatric_distillations`).
7. **Circadian Day-Boundary & Loop-Closing:**
   - Morning dopamine priming and evening cognitive offloading (`/users/{userId}/circadian_entries`) to close open mental loops before sleep.

---

## 🔒 5-Zone Threat Summary Table

| Threat Zone | Identified Risk | Implemented Countermeasure |
| :--- | :--- | :--- |
| **Input Surfaces** | Prompt injection, malformed request bodies, untrusted user uploads | Schema-constrained body parsers (`express.json()`), strict type validation, and parameter sanitization. |
| **Planning & Reasoning** | Hallucinations, rate exhaustion (429), transient service errors (503) | 4-Tier Resilient Gemini Fallback Ladder (`gemini-3.6-flash` → `gemini-3.1-flash-lite` → `gemini-flash-latest` → `gemini-3.7-flash`). |
| **Tool Execution** | SSRF, privilege escalation, unauthenticated API execution | Strict server-side proxying (`/api/gemini/*`); zero client-side credential exposure. |
| **Memory & State** | Cross-user data leaks, unauthorized reads/writes in Firestore | Strict owner-bound Firestore security rules (`request.auth.uid == userId`) across all subcollections. |
| **Inter-System Comm** | API key leakage in client bundles, network sniffing | Operational credentials dynamically retrieved via environment variables and Google Cloud Secret Manager. |

---

## 🛡️ Cloud Firestore Security Rules

Deploy the following `firestore.rules` to enforce strict owner isolation:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User data isolation: only the authenticated owner can access their subcollections
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

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

      match /interactions/{interactionId} {
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

## 🔐 Google Cloud Secret Manager Configuration

Store and bind your Gemini API Key securely without hardcoding strings:

```bash
# 1. Create and populate the secret in Secret Manager
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 2. Grant the Cloud Run compute service account access to read the secret
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format="value(projectNumber)")

gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 🚀 Google Cloud Run Deployment Flow

Deploy Ana with automated challenge verification labeling:

```bash
# 1. Build and deploy container to Cloud Run with Secret Manager binding
gcloud run deploy ana-neuro-journal \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest" \
  --update-labels=dev-tutorial=cloud-run-ai-challenge

# 2. Verify challenge binding
gcloud run services update ana-neuro-journal \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

---

## 🧪 Comprehensive Walkthrough & Test Guide

Every interactive process in Ana has a structured validation workflow:

### Test Case 1: Google Authentication & Isolated Session Initialization
- **Action**: Click "Sign In with Google" on the top navigation bar.
- **Expected Outcome**: Firebase Authentication triggers Google OAuth popup. Upon authentication, user UID is recognized, and past entries/sessions for that UID are synced live from Firestore.

### Test Case 2: Somatic Stress Reset Room Protocol
- **Action**: Click "Reset Room" in the navigation bar.
- **Workflow**:
  1. *Step 1*: Rate somatic tension (1-5) and select physical body tension zones.
  2. *Step 2*: Complete 3-cycle 4-7-8 vagus nerve breathing pacer.
  3. *Step 3*: Write 60-second expressive tension discharge.
  4. *Step 4*: Label affect (e.g. Overwhelmed, Anxious) and receive Gemini Cognitive Reframe.
  5. *Step 5*: Log post-reset state word and save.
- **Expected Outcome**: Session appears immediately in the "Resets" history tab and increases the Neuroplastic Rewire Vitality index.

### Test Case 3: Synaptic Pruning Ritual
- **Action**: Click "Prune Loop" in the navigation bar.
- **Workflow**: Enter a catastrophic thought (e.g., *"If I make a single mistake at work, my career is completely over"*). Click "Analyze Thought Distortion".
- **Expected Outcome**: Gemini identifies the cognitive distortion (Catastrophizing / All-or-Nothing) and generates a rational rewired belief. Clicking "Dissolve & Prune Loop" triggers a dissolution ceremony and saves the record to `/users/{userId}/pruned_loops`.

### Test Case 4: Polyvagal Glimmer Vault & Mining
- **Action**: Click "Glimmers" in the navigation bar.
- **Workflow**:
  1. Click "Mine Glimmers with Gemini" to extract sensory micro-moments from your current journal text.
  2. Add manual glimmers (e.g., *"The warm aroma of fresh espresso in the morning"*).
  3. Click "Start 10s Vagus Reset" on any glimmer.
- **Expected Outcome**: Full-screen 10-second grounding breathing screen guides autonomic nervous system stabilization.

### Test Case 5: Psychiatric Decentering Station ("Vent-to-Clarity")
- **Action**: Inside the Journal Editor, in the "Rewire Matrix" toolbar, click **"Vent-to-Clarity"** (BrainCircuit icon).
- **Workflow**:
  1. *Unfiltered Venting*: Type or paste an active frustration or rumination (e.g., *"My manager completely ignored my message all day. They definitely think I'm doing terrible work and I'm probably going to be let go"*). Notice the anti-rumination timer encouraging concise expression without recursive spiraling.
  2. *Psychiatric Synthesis*: Click **"Distill into Decentered Clarity"**.
  3. *Cognitive Deconstruction*: Review the 4 clinical pillars generated:
     - **Camera Facts**: Separates what an objective courtroom/video camera would record vs. emotional assumptions.
     - **Interpretations / Mind-Reading**: Identifies cognitive projections and assumptions.
     - **Circle of Control**: Contrasts what is directly actionable vs. what must be surrendered.
     - **Micro-Action Anchor**: A concrete, under-5-minute agency step.
  4. *Somatic Grounding Exit*: Click **"Begin 3-Cycle Physiological Sigh"**. Follow the dual-inhalation pacer with binaural harmonic sound to reset heart rate variability.
  5. *Persistence*: Click **"Save Clarity Record & Inject to Journal"**.
- **Expected Outcome**:
  - The clarity distillation is persisted to Cloud Firestore (`/users/{userId}/psychiatric_distillations`).
  - A formatted clinical debrief is injected directly into the active journal draft.
  - The record appears under the **Clarity** tab in the sidebar history drawer with full delete and inspect capabilities.

### Test Case 6: Circadian Day-Boundary & Loop-Closing
- **Action**: In the Journal Editor, click the Circadian tool button (Sun/Moon icon).
- **Workflow**:
  1. Toggle between Morning Intention (Dopamine & Direction) and Evening Loop-Closing (Cognitive Offload).
  2. Set top intentional priorities or dump open loops with concrete next actions.
  3. Save the entry to Cloud Firestore (`/users/{userId}/circadian_entries`).
- **Expected Outcome**: The check-in saves to Firestore and renders in the **Circadian** tab in the sidebar.

### Test Case 7: Interactive 3D Chronicle Landing Page
- **Action**: Load the application in a logged-out state (or sign out).
- **Workflow**:
  1. *Hero View (Act I)*: Observe the 3D leather-bound chronicle centered in space with dynamic shadows. Note the gold embossed spine and quote inscription by Viktor E. Frankl.
  2. *Scroll Down (Act II - Vent-to-Clarity)*: Scroll down 20-40%. Watch the 3D book smoothly translate to the left half of the screen and tilt toward the reader, while the right side displays the Psychiatric Decentering feature card.
  3. *Scroll Down (Act III - Polyvagal Reset)*: Scroll down 45-70%. Watch the 3D book sweep gracefully to the right side of the screen, revealing fresh inking on autonomic glimmers, while the left side displays the Polyvagal Reset card.
  4. *Scroll Down (Act IV - Circadian Closure)*: Scroll down 70-88%. Watch the book pan back to the left, highlighting evening loop closure and morning dopamine priming.
  5. *Scroll Down (Act V - Sovereign Vault)*: Scroll to the bottom. Watch the book return to the center with its golden silk bookmark settled, accompanied by Google Sign-In and security verification assurances.
  6. *Side Chapter Navigation*: Click any of the floating side chapter pills (Awakening, Vent-to-Clarity, Polyvagal Reset, Circadian Closure, Sovereign Vault). Confirm smooth programmatic scroll jumps directly to that chapter.
- **Expected Outcome**: 60fps cinematic 3D kinematics, no layout stutter, and zero-crash WebGL fallback for older devices.

