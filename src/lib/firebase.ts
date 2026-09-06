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

export const createGoogleProvider = () => {
  const provider = new GoogleAuthProvider();
  provider.addScope("profile");
  provider.addScope("email");
  return provider;
};

export const googleProvider = createGoogleProvider();

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
    // 1. Ensure Firebase Auth initialization is fully settled
    if (typeof (auth as any).authStateReady === "function") {
      await auth.authStateReady();
    }
    const provider = createGoogleProvider();
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (popupError: any) {
    console.warn("Google sign-in encountered an issue:", popupError);
    if (popupError.code === "auth/popup-blocked" || popupError.code === "auth/cancelled-popup-request") {
      throw new Error("Sign-in popup was blocked or interrupted by the browser. Please allow popups for this site and try again.");
    }
    if (popupError.code === "auth/popup-closed-by-user") {
      throw new Error("Sign-in window was closed before completion. Please try again.");
    }
    if (popupError.code === "auth/unauthorized-domain") {
      throw new Error("Domain not authorized for Google Sign-In in Firebase Console.");
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
