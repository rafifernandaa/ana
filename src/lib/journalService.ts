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
import { JournalEntry, ChatMessage } from "../types";

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
