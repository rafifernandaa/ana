/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  Unsubscribe 
} from "firebase/firestore";
import { db, auth, stripUndefined } from "./firebase";
import { JournalEntry, ChatMessage, ResetSession, PrunedThoughtLoop, GlimmerAnchor, CircadianEntry, PsychiatricDistillation } from "../types";

/**
 * Validates user authorization boundary prior to Firestore operations
 */
function assertAuthorizedUser(userId: string) {
  if (!auth.currentUser) {
    throw new Error("Authentication required. Please sign in to save or access your reflections.");
  }
  if (auth.currentUser.uid !== userId) {
    throw new Error("Unauthorized: Access restricted strictly to your own personal user data.");
  }
}

/**
 * Saves or updates a journal entry in the user's isolated collection
 * Path: /users/{userId}/entries/{entryId}
 * Also stores interaction mirror at: /users/{userId}/interactions/{entryId}
 */
export async function saveJournalEntry(userId: string, entry: JournalEntry): Promise<void> {
  assertAuthorizedUser(userId);

  const entryRef = doc(db, "users", userId, "entries", entry.id);
  const interactionRef = doc(db, "users", userId, "interactions", entry.id);

  // Clean data using strict undefined-stripping
  const sanitizedEntry = stripUndefined({
    ...entry,
    userId,
    updatedAt: Date.now(),
    serverSyncedAt: serverTimestamp(),
  });

  // Extract latest interaction text for mirroring in /users/{userId}/interactions
  const lastUserMsg = [...entry.messages].reverse().find(m => m.role === "user");
  const lastModelMsg = [...entry.messages].reverse().find(m => m.role === "model");

  const interactionPayload = stripUndefined({
    interactionId: entry.id,
    userId,
    title: entry.title,
    prompt: lastUserMsg?.content || entry.content,
    geminiResponse: lastModelMsg?.content || entry.aiSummary?.summary || "Reflection recorded",
    mood: entry.mood,
    tags: entry.tags,
    summary: entry.aiSummary?.summary || null,
    totalMessages: entry.messages.length,
    timestamp: Date.now(),
    updatedAt: serverTimestamp(),
  });

  // Atomic persistence
  await Promise.all([
    setDoc(entryRef, sanitizedEntry, { merge: true }),
    setDoc(interactionRef, interactionPayload, { merge: true }),
  ]);
}

/**
 * Subscribes to real-time updates for a user's isolated journal entries
 * Path: /users/{userId}/entries
 */
export function subscribeToUserEntries(
  userId: string, 
  onSuccess: (entries: JournalEntry[]) => void, 
  onError: (err: Error) => void
): Unsubscribe {
  assertAuthorizedUser(userId);

  const entriesRef = collection(db, "users", userId, "entries");
  const q = query(entriesRef, orderBy("updatedAt", "desc"));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: JournalEntry[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          userId: data.userId || userId,
          title: data.title || "Untitled Entry",
          content: data.content || "",
          mood: data.mood || "reflective",
          tags: Array.isArray(data.tags) ? data.tags : [],
          createdAt: data.createdAt || Date.now(),
          updatedAt: data.updatedAt || Date.now(),
          messages: Array.isArray(data.messages) ? data.messages : [],
          aiSummary: data.aiSummary || null,
          isFavorite: !!data.isFavorite,
          isPinned: !!data.isPinned,
          linkedResetSessionId: data.linkedResetSessionId,
          linkedPrunedLoopIds: Array.isArray(data.linkedPrunedLoopIds) ? data.linkedPrunedLoopIds : undefined,
          glimmersDiscovered: Array.isArray(data.glimmersDiscovered) ? data.glimmersDiscovered : undefined,
          circadianPhase: data.circadianPhase,
          circadianCheckInId: data.circadianCheckInId,
          empiricalTelemetry: data.empiricalTelemetry || undefined,
        });
      });
      onSuccess(items);
    },
    (err) => {
      console.error("Error listening to user entries:", err);
      onError(err);
    }
  );
}

/**
 * Toggles pinned status of an entry and persists to Firestore
 */
export async function togglePinJournalEntry(userId: string, entry: JournalEntry): Promise<JournalEntry> {
  const updatedEntry: JournalEntry = {
    ...entry,
    isPinned: !entry.isPinned,
    updatedAt: Date.now(),
  };
  await saveJournalEntry(userId, updatedEntry);
  return updatedEntry;
}

/**
 * Deletes a journal entry and its corresponding interaction record
 */
export async function deleteJournalEntry(userId: string, entryId: string): Promise<void> {
  assertAuthorizedUser(userId);

  const entryRef = doc(db, "users", userId, "entries", entryId);
  const interactionRef = doc(db, "users", userId, "interactions", entryId);

  await Promise.all([
    deleteDoc(entryRef),
    deleteDoc(interactionRef),
  ]);
}

/**
 * Saves a Reset Room stress intervention session
 * Path: /users/{userId}/sessions/{sessionId}
 * Mirrors summary to /users/{userId}/interactions/{sessionId}
 */
export async function saveResetSession(userId: string, session: ResetSession): Promise<void> {
  assertAuthorizedUser(userId);

  const sessionRef = doc(db, "users", userId, "sessions", session.id);
  const interactionRef = doc(db, "users", userId, "interactions", session.id);

  const sanitizedSession = stripUndefined({
    ...session,
    userId,
    updatedAt: Date.now(),
    serverSyncedAt: serverTimestamp(),
  });

  const chosenReframeText = session.chosenReframeIndex !== null && session.reframes[session.chosenReframeIndex]
    ? session.reframes[session.chosenReframeIndex].text
    : session.reframes[0]?.text || "Reframe logged";

  const interactionPayload = stripUndefined({
    interactionId: session.id,
    userId,
    title: `Reset Room (${session.mode.toUpperCase()}) - ${session.affectLabel}`,
    prompt: session.writingContent,
    geminiResponse: `Extracted Tension: "${session.extractedDarkSentence}"\nChosen Reframe: "${chosenReframeText}"\nGlimmer: "${session.glimmer}"`,
    affectLabel: session.affectLabel,
    beforeWord: session.beforeWord,
    afterWord: session.afterWord,
    durationMs: session.durationMs,
    type: "reset_session",
    timestamp: Date.now(),
    updatedAt: serverTimestamp(),
  });

  await Promise.all([
    setDoc(sessionRef, sanitizedSession, { merge: true }),
    setDoc(interactionRef, interactionPayload, { merge: true }),
  ]);
}

/**
 * Subscribes to real-time updates for user-isolated Reset Sessions
 * Path: /users/{userId}/sessions
 */
export function subscribeToUserSessions(
  userId: string,
  onSuccess: (sessions: ResetSession[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  assertAuthorizedUser(userId);

  const sessionsRef = collection(db, "users", userId, "sessions");
  const q = query(sessionsRef, orderBy("createdAt", "desc"));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: ResetSession[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          userId: data.userId || userId,
          mode: data.mode || "mini",
          bodyMap: data.bodyMap || { zones: [], intensity: 3 },
          affectLabel: data.affectLabel || "Overwhelmed",
          writingContent: data.writingContent || "",
          extractedDarkSentence: data.extractedDarkSentence || "",
          reframes: Array.isArray(data.reframes) ? data.reframes : [],
          chosenReframeIndex: typeof data.chosenReframeIndex === "number" ? data.chosenReframeIndex : 0,
          glimmer: data.glimmer || "",
          beforeWord: data.beforeWord || "",
          afterWord: data.afterWord || "",
          durationMs: data.durationMs || 0,
          createdAt: data.createdAt || Date.now(),
          updatedAt: data.updatedAt || Date.now(),
          sourceEntryId: data.sourceEntryId || null,
        });
      });
      onSuccess(items);
    },
    (err) => {
      console.error("Error listening to user sessions:", err);
      onError(err);
    }
  );
}

/**
 * Deletes a Reset Room session and its interaction mirror
 */
export async function deleteResetSession(userId: string, sessionId: string): Promise<void> {
  assertAuthorizedUser(userId);

  const sessionRef = doc(db, "users", userId, "sessions", sessionId);
  const interactionRef = doc(db, "users", userId, "interactions", sessionId);

  await Promise.all([
    deleteDoc(sessionRef),
    deleteDoc(interactionRef),
  ]);
}

/**
 * Directly records an ad-hoc interaction / prompt-response turn
 * Path: /users/{userId}/interactions/{interactionId}
 */
export async function recordInteraction(
  userId: string,
  interactionId: string,
  prompt: string,
  geminiResponse: string,
  metadata?: Record<string, any>
): Promise<void> {
  assertAuthorizedUser(userId);

  const ref = doc(db, "users", userId, "interactions", interactionId);
  const payload = stripUndefined({
    interactionId,
    userId,
    prompt,
    geminiResponse,
    metadata: metadata || {},
    timestamp: Date.now(),
    createdAt: serverTimestamp(),
  });

  await setDoc(ref, payload, { merge: true });
}

/**
 * Saves a Synaptically Pruned thought loop to /users/{userId}/pruned_loops/{loopId}
 */
export async function savePrunedLoop(userId: string, loop: PrunedThoughtLoop): Promise<void> {
  assertAuthorizedUser(userId);

  const loopRef = doc(db, "users", userId, "pruned_loops", loop.id);
  const interactionRef = doc(db, "users", userId, "interactions", loop.id);

  const sanitizedLoop = stripUndefined({
    ...loop,
    userId,
    dissolvedAt: loop.dissolvedAt || Date.now(),
    serverSyncedAt: serverTimestamp(),
  });

  const interactionPayload = stripUndefined({
    interactionId: loop.id,
    userId,
    title: `Synaptic Pruning - ${loop.distortionCategory}`,
    prompt: `Pruned Distortion: "${loop.oldDistortion}"`,
    geminiResponse: `Rewired Belief: "${loop.newRewiredBelief}"`,
    category: loop.distortionCategory,
    type: "synaptic_pruning",
    timestamp: Date.now(),
    updatedAt: serverTimestamp(),
  });

  await Promise.all([
    setDoc(loopRef, sanitizedLoop, { merge: true }),
    setDoc(interactionRef, interactionPayload, { merge: true }),
  ]);
}

/**
 * Subscribes to user-isolated Pruned Thought Loops
 */
export function subscribeToPrunedLoops(
  userId: string,
  onSuccess: (loops: PrunedThoughtLoop[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  assertAuthorizedUser(userId);

  const loopsRef = collection(db, "users", userId, "pruned_loops");
  const q = query(loopsRef, orderBy("dissolvedAt", "desc"));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: PrunedThoughtLoop[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          userId: data.userId || userId,
          oldDistortion: data.oldDistortion || "",
          distortionCategory: data.distortionCategory || "catastrophizing",
          newRewiredBelief: data.newRewiredBelief || "",
          dissolvedAt: data.dissolvedAt || Date.now(),
          sourceEntryId: data.sourceEntryId || null,
        });
      });
      onSuccess(items);
    },
    (err) => {
      console.error("Error listening to pruned loops:", err);
      onError(err);
    }
  );
}

/**
 * Deletes a pruned thought loop
 */
export async function deletePrunedLoop(userId: string, loopId: string): Promise<void> {
  assertAuthorizedUser(userId);

  const loopRef = doc(db, "users", userId, "pruned_loops", loopId);
  const interactionRef = doc(db, "users", userId, "interactions", loopId);

  await Promise.all([
    deleteDoc(loopRef),
    deleteDoc(interactionRef),
  ]);
}

/**
 * Saves a Glimmer Anchor to /users/{userId}/glimmers/{glimmerId}
 */
export async function saveGlimmerAnchor(userId: string, glimmer: GlimmerAnchor): Promise<void> {
  assertAuthorizedUser(userId);

  const glimmerRef = doc(db, "users", userId, "glimmers", glimmer.id);
  const sanitized = stripUndefined({
    ...glimmer,
    userId,
    createdAt: glimmer.createdAt || Date.now(),
    serverSyncedAt: serverTimestamp(),
  });

  await setDoc(glimmerRef, sanitized, { merge: true });
}

/**
 * Subscribes to user-isolated Glimmer Anchors
 */
export function subscribeToGlimmers(
  userId: string,
  onSuccess: (glimmers: GlimmerAnchor[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  assertAuthorizedUser(userId);

  const glimmersRef = collection(db, "users", userId, "glimmers");
  const q = query(glimmersRef, orderBy("createdAt", "desc"));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: GlimmerAnchor[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          userId: data.userId || userId,
          text: data.text || "",
          category: data.category || "serenity",
          createdAt: data.createdAt || Date.now(),
          sourceType: data.sourceType || "manual",
          isPinned: !!data.isPinned,
        });
      });
      onSuccess(items);
    },
    (err) => {
      console.error("Error listening to glimmers:", err);
      onError(err);
    }
  );
}

/**
 * Deletes a Glimmer Anchor
 */
export async function deleteGlimmerAnchor(userId: string, glimmerId: string): Promise<void> {
  assertAuthorizedUser(userId);
  const ref = doc(db, "users", userId, "glimmers", glimmerId);
  await deleteDoc(ref);
}

/**
 * Saves a Circadian Day-Boundary check-in to /users/{userId}/circadian_entries/{id}
 */
export async function saveCircadianEntry(userId: string, entry: CircadianEntry): Promise<void> {
  assertAuthorizedUser(userId);

  const entryRef = doc(db, "users", userId, "circadian_entries", entry.id);
  const interactionRef = doc(db, "users", userId, "interactions", entry.id);

  const sanitized = stripUndefined({
    ...entry,
    userId,
    updatedAt: Date.now(),
    serverSyncedAt: serverTimestamp(),
  });

  const interactionPayload = stripUndefined({
    interactionId: entry.id,
    userId,
    title: `Circadian Prime - ${entry.phase.replace("_", " ").toUpperCase()}`,
    prompt: entry.morningIntention ? `Intention: "${entry.morningIntention}"` : `Circadian Check-in: Energy ${entry.energyLevel}/5`,
    geminiResponse: entry.loopClosedNotes || "Circadian check-in recorded",
    phase: entry.phase,
    energyLevel: entry.energyLevel,
    type: "circadian_prime",
    timestamp: Date.now(),
    updatedAt: serverTimestamp(),
  });

  await Promise.all([
    setDoc(entryRef, sanitized, { merge: true }),
    setDoc(interactionRef, interactionPayload, { merge: true }),
  ]);
}

/**
 * Subscribes to user-isolated Circadian Entries
 */
export function subscribeToCircadianEntries(
  userId: string,
  onSuccess: (entries: CircadianEntry[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  assertAuthorizedUser(userId);

  const collRef = collection(db, "users", userId, "circadian_entries");
  const q = query(collRef, orderBy("timestamp", "desc"));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: CircadianEntry[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          userId: data.userId || userId,
          phase: data.phase || "dawn_morning",
          sleepQuality: data.sleepQuality || "adequate",
          energyLevel: typeof data.energyLevel === "number" ? data.energyLevel : 3,
          morningIntention: data.morningIntention || "",
          anticipatedFriction: data.anticipatedFriction || "",
          groundingAnchor: data.groundingAnchor || "",
          eveningGlimmers: Array.isArray(data.eveningGlimmers) ? data.eveningGlimmers : [],
          untangledLoopsSummary: data.untangledLoopsSummary || "",
          loopClosedNotes: data.loopClosedNotes || "",
          linkedMorningEntryId: data.linkedMorningEntryId || "",
          isLoopClosed: !!data.isLoopClosed,
          timestamp: data.timestamp || Date.now(),
          dateKey: data.dateKey || new Date().toISOString().split("T")[0],
          journalEntryId: data.journalEntryId || "",
        });
      });
      onSuccess(items);
    },
    (err) => {
      console.error("Error listening to circadian entries:", err);
      onError(err);
    }
  );
}

/**
 * Deletes a Circadian Entry
 */
export async function deleteCircadianEntry(userId: string, entryId: string): Promise<void> {
  assertAuthorizedUser(userId);
  const entryRef = doc(db, "users", userId, "circadian_entries", entryId);
  const interactionRef = doc(db, "users", userId, "interactions", entryId);
  await Promise.all([
    deleteDoc(entryRef),
    deleteDoc(interactionRef),
  ]);
}

/**
 * Saves a Psychiatric Distillation (Vent-to-Clarity) record
 * Path: /users/{userId}/psychiatric_distillations/{id}
 */
export async function savePsychiatricDistillation(userId: string, distillation: PsychiatricDistillation): Promise<void> {
  assertAuthorizedUser(userId);

  const cleanPayload = stripUndefined({
    ...distillation,
    userId,
    updatedAt: serverTimestamp(),
  });

  const distRef = doc(db, "users", userId, "psychiatric_distillations", distillation.id);
  const interactionRef = doc(db, "users", userId, "interactions", distillation.id);

  await Promise.all([
    setDoc(distRef, cleanPayload, { merge: true }),
    setDoc(interactionRef, cleanPayload, { merge: true }),
  ]);
}

/**
 * Subscribes in real-time to user's psychiatric distillations
 */
export function subscribeToPsychiatricDistillations(
  userId: string,
  onSuccess: (items: PsychiatricDistillation[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  assertAuthorizedUser(userId);

  const collRef = collection(db, "users", userId, "psychiatric_distillations");
  const q = query(collRef, orderBy("createdAt", "desc"));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: PsychiatricDistillation[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          userId: data.userId || userId,
          rawVentText: data.rawVentText || "",
          facts: Array.isArray(data.facts) ? data.facts : [],
          interpretations: Array.isArray(data.interpretations) ? data.interpretations : [],
          inMyControl: Array.isArray(data.inMyControl) ? data.inMyControl : [],
          outOfMyControl: Array.isArray(data.outOfMyControl) ? data.outOfMyControl : [],
          distortions: Array.isArray(data.distortions) ? data.distortions : [],
          microActionAnchor: data.microActionAnchor || "",
          groundingSighCompleted: !!data.groundingSighCompleted,
          createdAt: data.createdAt || Date.now(),
          journalEntryId: data.journalEntryId || "",
        });
      });
      onSuccess(items);
    },
    (err) => {
      console.error("Error listening to psychiatric distillations:", err);
      onError(err);
    }
  );
}

/**
 * Deletes a Psychiatric Distillation record
 */
export async function deletePsychiatricDistillation(userId: string, distillationId: string): Promise<void> {
  assertAuthorizedUser(userId);
  const distRef = doc(db, "users", userId, "psychiatric_distillations", distillationId);
  const interactionRef = doc(db, "users", userId, "interactions", distillationId);
  await Promise.all([
    deleteDoc(distRef),
    deleteDoc(interactionRef),
  ]);
}



