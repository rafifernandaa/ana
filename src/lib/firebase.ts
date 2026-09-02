/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  User,
  Auth
} from "firebase/auth";
import { 
  getFirestore, 
  Firestore,
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  Timestamp
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase App
export const app: FirebaseApp = getApps().length === 0 
  ? initializeApp(firebaseConfig) 
  : getApp();

export const auth: Auth = getAuth(app);

// Initialize Firestore with custom databaseId if specified in config
export const db: Firestore = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account"
});

/**
 * Strips all undefined properties from an object recursively
 * to prevent Firestore setDoc/updateDoc driver runtime crashes.
 */
export function stripUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj.map(stripUndefined) as unknown as T;
  }
  if (typeof obj === "object" && !(obj instanceof Date) && !(obj instanceof Timestamp)) {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = stripUndefined(value);
      }
    }
    return cleaned as T;
  }
  return obj;
}

/**
 * Sign in using Google Federated Identity
 */
export async function signInWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (popupError: any) {
    console.warn("Popup sign-in encountered an issue, attempting redirect or logging info:", popupError);
    // In strict iframe sandbox, popup might be blocked or require user permission
    if (popupError.code === "auth/popup-blocked" || popupError.code === "auth/cancelled-popup-request") {
      throw new Error("Sign-in popup was blocked by browser. Please allow popups or open the app in a new tab.");
    }
    throw popupError;
  }
}

/**
 * Sign out current authenticated user
 */
export async function logOutUser(): Promise<void> {
  await firebaseSignOut(auth);
}
