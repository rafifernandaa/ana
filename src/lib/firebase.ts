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
import {
  getStorage,
  ref,
  uploadString,
  getDownloadURL,
  FirebaseStorage
} from "firebase/storage";
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

// Initialize Google Cloud Storage / Firebase Storage instance
export const storage: FirebaseStorage = getStorage(
  app,
  firebaseConfig.storageBucket ? `gs://${firebaseConfig.storageBucket}` : undefined
);

export interface UploadedHandwrittenImage {
  storageUri: string;      // Canonical gs:// URI
  downloadUrl: string;     // HTTPS CDN download URL
  path: string;            // Cloud Storage path: handwritten/{userId}/{filename}
  name: string;            // Filename
}

/**
 * Uploads a base64 / data_url handwritten journal page to Google Cloud Storage
 * using the official Firebase Web Modular SDK uploadString API.
 */
export async function uploadHandwrittenImageToStorage(
  userId: string,
  dataUrl: string,
  pageIndex: number = 0
): Promise<UploadedHandwrittenImage> {
  const timestamp = Date.now();
  const safeUserId = (userId && userId.trim()) ? userId.trim() : "anonymous";
  
  // Infer file format
  let mimeType = "image/jpeg";
  let extension = "jpg";
  const mimeMatch = dataUrl.match(/^data:([^;]+);base64,/);
  if (mimeMatch) {
    mimeType = mimeMatch[1];
    if (mimeType.includes("png")) extension = "png";
    else if (mimeType.includes("webp")) extension = "webp";
  }

  const filename = `hw_${timestamp}_p${pageIndex + 1}.${extension}`;
  const storagePath = `handwritten/${safeUserId}/${filename}`;
  const storageRef = ref(storage, storagePath);

  // Upload string using official Firebase Web SDK data_url format
  await uploadString(storageRef, dataUrl, "data_url", {
    contentType: mimeType,
    customMetadata: {
      uploadedBy: safeUserId,
      uploadedAt: new Date().toISOString(),
      pageIndex: String(pageIndex + 1),
      source: "ana-handwritten-ocr-capture"
    }
  });

  const downloadUrl = await getDownloadURL(storageRef);
  const bucketName = firebaseConfig.storageBucket || "project-21ea57f4-102b-432a-98f.firebasestorage.app";
  const storageUri = `gs://${bucketName}/${storagePath}`;

  return {
    storageUri,
    downloadUrl,
    path: storagePath,
    name: filename
  };
}

export const createGoogleProvider = () => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: "select_account"
  });
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
export async function signInWithGoogle(): Promise<User | null> {
  try {
    // 1. Ensure Firebase Auth initialization is fully settled
    if (typeof (auth as any).authStateReady === "function") {
      await auth.authStateReady();
    }
    const provider = createGoogleProvider();
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (popupError: any) {
    // 1. User intentionally closed popup or cancelled: non-fatal, return null cleanly
    if (
      popupError?.code === "auth/popup-closed-by-user" || 
      popupError?.code === "auth/cancelled-popup-request" ||
      popupError?.message?.includes("closed before completion")
    ) {
      console.info("Firebase Auth: Sign-in popup closed by user or cancelled.");
      return null;
    }

    // 2. Popup blocked by browser
    if (popupError?.code === "auth/popup-blocked") {
      throw new Error("Sign-in popup was blocked by your browser. Please allow popups or open the app in a new tab.");
    }

    // 3. Domain not authorized in Firebase Console
    if (popupError?.code === "auth/unauthorized-domain") {
      throw new Error("This domain is not in the Firebase Authorized Domains list. Please add this domain in Firebase Console -> Authentication -> Settings.");
    }

    // 4. Invalid credentials or userinfo fetch error
    if (popupError?.code === "auth/invalid-credential" || popupError?.message?.includes("userinfo")) {
      throw new Error("Google authentication failed. If running inside an embedded preview, please open the application in a new browser tab.");
    }

    console.warn("Google sign-in encountered an issue:", popupError);
    throw popupError;
  }
}

/**
 * Sign out current authenticated user
 */
export async function logOutUser(): Promise<void> {
  await firebaseSignOut(auth);
}
