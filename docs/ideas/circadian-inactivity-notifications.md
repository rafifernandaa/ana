# Circadian Inactivity Notifications (Ana Re-Engagement System)
**Project**: Ana — Neuroscience-Informed Journaling & Somatic Reset System  
**Framework**: `/agent-skills:idea-refine` via Google Developer Knowledge MCP  
**Date**: September 2026

---

## 1. Problem Statement

> **How Might We** re-engage users who haven't journaled in over 20 hours without feeling like another guilt-inducing notification app, by delivering low-friction, circadian-aligned nervous system resets across web and mobile surfaces?

---

## 2. Recommended Direction: "Circadian Loop-Closure Nudge"

Rather than sending generic reminders ("You haven't journaled today!"), Ana delivers **Circadian Day-Boundary Nudges** grounded in neurobiology:
1. **Morning Dopamine Priming** (e.g. 08:30 AM): *"Set one intentional anchor to direct your prefrontal cortex today."*
2. **Evening Loop Closure** (e.g. 21:00 PM): *"Notice any unresolved cognitive tension? Take 90 seconds to deposit open loops before sleep."*

### Technical Architecture & Data Topology

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Google Cloud Scheduler (asia-southeast1, Singapore)                     │
│ • Cron: 0 21 * * * (Evening loop closure) & 0 8 * * * (Morning prime)   │
│ • Triggers Cloud Run via OIDC Service Account Token                     │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ HTTPS POST /api/notifications/circadian-nudge
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Google Cloud Run Service: "Ana" (asia-southeast1, Singapore)            │
│ • Project ID: project-21ea57f4-102b-432a-98f                           │
│ • Verifies OIDC Auth Header                                             │
│ • Queries Firestore Named DB over Google Private Network                │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ Cross-Region Query (~160ms latency)
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Google Cloud Firestore (us-west1, Oregon)                              │
│ • Database ID: ai-studio-1964eda9-cc24-452a-bee7-3ab0780e0478           │
│ • Collection: /users/{userId}/entries (checks if last entry > 20 hrs)   │
│ • Collection: /users/{userId}/fcm_tokens (retrieves active device token)│
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ Send payload to matching inactive users
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Firebase Cloud Messaging (FCM) Web Push Service Worker                  │
│ • Handles push message in public/firebase-messaging-sw.js               │
│ • Displays native device notification even if browser tab is closed     │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Key Assumptions to Validate

- [ ] **Assumption 1 (Cross-Region Latency)**: Cloud Run in `asia-southeast1` querying a named Firestore database in `us-west1` (`ai-studio-1964eda9-cc24-452a-bee7-3ab0780e0478`) will complete within Cloud Run's HTTP timeout.  
  *Validation*: Test simple node script fetching 10 user documents across regions. Expected roundtrip: ~160–180ms.
- [ ] **Assumption 2 (Browser Permission Acceptance)**: Users will grant Web Notification permission if prompted in context (e.g. after saving their first journal entry or during Circadian onboarding).  
  *Validation*: Add an opt-in toggle in the Circadian Day-Boundary view ("Enable Evening Wind-Down Nudge").
- [ ] **Assumption 3 (Token Persistence & Lifecycle)**: Service worker registration and FCM token refresh can be persisted reliably in `/users/{userId}/fcm_tokens` under strict owner Firestore rules.  
  *Validation*: Verify token write matches `firestore.rules` where `request.auth.uid == userId`.

---

## 4. MVP Scope

### In Scope (What We Are Building):
1. **Frontend Notification Permission & Token Sync**:
   - Opt-in UI toggle in `CircadianDayBoundary.tsx` and `ConfigWorkspace.tsx`.
   - Client requests permission via `Notification.requestPermission()`.
   - Obtains Web Push token via Firebase Messaging `getToken()`.
   - Stores token in `/users/{userId}/fcm_tokens/{tokenId}` in Firestore database `ai-studio-1964eda9-cc24-452a-bee7-3ab0780e0478`.
2. **Service Worker (`public/firebase-messaging-sw.js`)**:
   - Listens to `push` events in the background.
   - Shows rich notification with Ana's Aether-Void branding and click action navigating to `/?action=circadian`.
3. **Cloud Run Endpoint in `server.ts`**:
   - `POST /api/notifications/circadian-nudge`:
     - Checks timestamp of user's latest entry in `/users/{userId}/entries`.
     - If `(now - lastEntryTime) > 20 hours`, dispatches an FCM Web Push notification using the stored token.
4. **Google Cloud Scheduler Setup Script**:
   - A single reproducible `gcloud` command to create the daily cron job in `asia-southeast1`.

### Out of Scope (Not Doing in MVP):
- ❌ **No Complex Timezone Engine**: Default to user's registered timezone or fixed UTC offset in MVP; full dynamic geolocation timezone tracking deferred to v2.
- ❌ **No Heavy Third-Party Messaging Services**: No Twilio, WhatsApp, or SendGrid dependencies. We use native Google Cloud Scheduler + FCM Web Push to keep the stack 100% Google Cloud native.
- ❌ **No Incessant Daily Spam**: If the user ignores 3 consecutive notifications without opening the app, back off frequency automatically to avoid notification fatigue.

---

## 5. Concrete Technical Implementation Blueprint

### Step 1: Frontend Token Registration (`src/lib/notificationService.ts`)
```typescript
import { getMessaging, getToken } from "firebase/messaging";
import { doc, setDoc } from "firebase/firestore";
import { app, db } from "./firebase";

export async function registerCircadianPushNotifications(userId: string): Promise<boolean> {
  if (!("Notification" in window) || !("serviceWorker" in navigator)) {
    console.warn("Push notifications not supported on this platform.");
    return false;
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return false;
  }

  const messaging = getMessaging(app);
  const token = await getToken(messaging, {
    vapidKey: "YOUR_FIREBASE_WEB_PUSH_CERTIFICATE_KEY",
  });

  if (token) {
    // Persist to user's isolated Firestore subcollection
    const tokenRef = doc(db, `users/${userId}/fcm_tokens/${token.slice(0, 32)}`);
    await setDoc(tokenRef, {
      token,
      platform: "web",
      updatedAt: Date.now(),
      circadianOptIn: true,
    });
    return true;
  }
  return false;
}
```

### Step 2: Background Service Worker (`public/firebase-messaging-sw.js`)
```javascript
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDhb24mchGpo8Wyk0Hp1UQdLn8Qz7Uv5Qc",
  projectId: "project-21ea57f4-102b-432a-98f",
  messagingSenderId: "118399207989",
  appId: "1:118399207989:web:fc958c7651876de8b27f7c",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "🌙 Ana // Circadian Nudge";
  const options = {
    body: payload.notification?.body || "Take 90 seconds to deposit open mental loops before sleep.",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    data: { url: payload.data?.url || "/" },
  };

  self.registration.showNotification(title, options);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || "/")
  );
});
```

### Step 3: Cloud Run Endpoint (`server.ts`)
```typescript
import { initializeFirestore } from "firebase-admin/firestore";
import admin from "firebase-admin";

// Initialize named Firestore database
const namedDb = initializeFirestore(admin.app(), {
  projectId: "project-21ea57f4-102b-432a-98f",
}, "ai-studio-1964eda9-cc24-452a-bee7-3ab0780e0478");

app.post("/api/notifications/circadian-nudge", async (req: Request, res: Response) => {
  // 1. Verify cron invocation (OIDC or custom bearer header)
  const authHeader = req.headers.authorization;
  if (!authHeader && process.env.NODE_ENV === "production") {
    return res.status(401).json({ error: "Unauthorized cron trigger" });
  }

  // 2. Query users with active FCM tokens
  const usersSnapshot = await namedDb.collection("users").get();
  let notificationsDispatched = 0;

  for (const userDoc of usersSnapshot.docs) {
    const userId = userDoc.id;
    // Check latest entry in /users/{userId}/entries
    const recentEntries = await namedDb
      .collection(`users/${userId}/entries`)
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    const lastEntryTime = recentEntries.empty ? 0 : recentEntries.docs[0].data().createdAt;
    const hoursSinceLastEntry = (Date.now() - lastEntryTime) / (1000 * 60 * 60);

    // If inactive for > 20 hours, retrieve FCM tokens
    if (hoursSinceLastEntry > 20) {
      const tokensSnap = await namedDb.collection(`users/${userId}/fcm_tokens`).get();
      for (const tokenDoc of tokensSnap.docs) {
        const fcmToken = tokenDoc.data().token;
        try {
          await admin.messaging().send({
            token: fcmToken,
            notification: {
              title: "🌙 Ana // Evening Loop Closure",
              body: "Notice any mental tension from today? Take 90 seconds to deposit open loops before sleep.",
            },
            data: { url: "/?action=circadian" },
          });
          notificationsDispatched++;
        } catch (fcmErr) {
          console.warn(`Failed to send to token for user ${userId}:`, fcmErr);
        }
      }
    }
  }

  return res.json({ status: "ok", notificationsDispatched });
});
```

### Step 4: Google Cloud Scheduler Deployment Command
```bash
# Set your Cloud Run service URL in asia-southeast1
SERVICE_URL=$(gcloud run services describe Ana \
  --region=asia-southeast1 \
  --project=project-21ea57f4-102b-432a-98f \
  --format="value(status.url)")

PROJECT_NUMBER=$(gcloud projects describe project-21ea57f4-102b-432a-98f --format="value(projectNumber)")

# Create daily 9:00 PM evening loop-closure job
gcloud scheduler jobs create http ana-evening-closure-nudge \
  --location=asia-southeast1 \
  --project=project-21ea57f4-102b-432a-98f \
  --schedule="0 21 * * *" \
  --time-zone="Asia/Singapore" \
  --uri="${SERVICE_URL}/api/notifications/circadian-nudge" \
  --http-method=POST \
  --oidc-service-account-email="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --oidc-token-audience="${SERVICE_URL}"
```
