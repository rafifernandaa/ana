/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, signInWithGoogle, logOutUser } from "./lib/firebase";
import { 
  subscribeToUserEntries, 
  saveJournalEntry, 
  deleteJournalEntry 
} from "./lib/journalService";
import { JournalEntry } from "./types";
import { Navbar } from "./components/Navbar";
import { LandingHero } from "./components/LandingHero";
import { JournalEditor } from "./components/JournalEditor";
import { EntryHistorySidebar } from "./components/EntryHistorySidebar";
import { SecurityArchitectureModal } from "./components/SecurityArchitectureModal";
import { Sparkles, Menu, ShieldCheck, AlertCircle, RefreshCw } from "lucide-react";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Journal entries state
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [activeEntry, setActiveEntry] = useState<JournalEntry | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

  // UI state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);

  // Helper to generate a fresh entry
  const createNewBlankEntry = useCallback((userId: string): JournalEntry => {
    return {
      id: "entry-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
      userId,
      title: "",
      content: "",
      mood: "reflective",
      tags: ["reflection"],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      aiSummary: null,
      isFavorite: false,
    };
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
      if (currentUser) {
        setAuthError(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to user-isolated Firestore entries when authenticated
  useEffect(() => {
    if (!user) {
      setEntries([]);
      setActiveEntry(null);
      return;
    }

    const unsubscribe = subscribeToUserEntries(
      user.uid,
      (fetchedEntries) => {
        setEntries(fetchedEntries);
        // If no active entry is selected, default to the most recent or create a new one
        setActiveEntry(prev => {
          if (prev) {
            // keep the existing one or refresh with updated copy from Firestore
            const matching = fetchedEntries.find(e => e.id === prev.id);
            return matching || prev;
          }
          if (fetchedEntries.length > 0) {
            return fetchedEntries[0];
          }
          return createNewBlankEntry(user.uid);
        });
      },
      (err) => {
        console.error("Firestore subscription error:", err);
        setSaveError("Failed to synchronize with Firestore: " + err.message);
      }
    );

    return () => unsubscribe();
  }, [user, createNewBlankEntry]);

  // Handle Google Sign-In
  const handleSignIn = async () => {
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error("Sign-in failed:", err);
      setAuthError(err.message || "Failed to sign in with Google.");
    }
  };

  // Handle Logout
  const handleSignOut = async () => {
    try {
      await logOutUser();
      setActiveEntry(null);
    } catch (err: any) {
      console.error("Sign-out failed:", err);
    }
  };

  // Handle New Entry creation
  const handleNewEntry = () => {
    if (!user) return;
    const blank = createNewBlankEntry(user.uid);
    setActiveEntry(blank);
    setIsMobileSidebarOpen(false);
  };

  // Save entry to Firestore
  const handleSaveEntry = async (entryToSave: JournalEntry) => {
    if (!user) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      await saveJournalEntry(user.uid, entryToSave);
      setLastSavedAt(Date.now());
      setActiveEntry(entryToSave);
    } catch (err: any) {
      console.error("Error saving entry to Firestore:", err);
      setSaveError(err.message || "Failed to save reflection to Firestore.");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete entry
  const handleDeleteEntry = async (entryId: string) => {
    if (!user) return;
    try {
      await deleteJournalEntry(user.uid, entryId);
      if (activeEntry?.id === entryId) {
        const remaining = entries.filter(e => e.id !== entryId);
        if (remaining.length > 0) {
          setActiveEntry(remaining[0]);
        } else {
          setActiveEntry(createNewBlankEntry(user.uid));
        }
      }
    } catch (err: any) {
      console.error("Error deleting entry:", err);
      setSaveError("Failed to delete entry: " + err.message);
    }
  };

  // Loading Screen
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-md animate-pulse">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-slate-800">Initializing Reflection Space</h2>
            <p className="text-xs text-slate-500">Checking Firebase security & authentication state...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col antialiased">
      {/* Global Navigation Bar */}
      <Navbar
        user={user}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        onNewEntry={handleNewEntry}
        onToggleSecurityInfo={() => setIsSecurityModalOpen(true)}
        isSaving={isSaving}
        lastSavedAt={lastSavedAt}
      />

      {/* Auth Error Banner if any */}
      {authError && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-xs text-amber-800 flex items-center justify-between">
          <div className="flex items-center gap-2 max-w-4xl mx-auto">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{authError}</span>
          </div>
          <button
            onClick={() => setAuthError(null)}
            className="text-amber-700 hover:text-amber-900 font-bold px-2"
          >
            ×
          </button>
        </div>
      )}

      {/* Main Content Area */}
      {!user ? (
        /* Unauthenticated Landing View */
        <main className="flex-1">
          <LandingHero onSignIn={handleSignIn} />
        </main>
      ) : (
        /* Authenticated Dashboard View */
        <div className="flex-1 flex max-w-7xl w-full mx-auto">
          {/* Mobile Entry Drawer Toggle Button */}
          <div className="lg:hidden fixed bottom-6 left-6 z-30">
            <button
              id="mobile-menu-toggle-btn"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-3 rounded-full bg-slate-900 text-white shadow-lg flex items-center gap-2 text-xs font-medium active:scale-95"
            >
              <Menu className="w-5 h-5" />
              <span>Past Reflections ({entries.length})</span>
            </button>
          </div>

          {/* Past Entries History Sidebar */}
          <EntryHistorySidebar
            entries={entries}
            activeEntryId={activeEntry?.id || null}
            onSelectEntry={(entry) => setActiveEntry(entry)}
            onNewEntry={handleNewEntry}
            onDeleteEntry={handleDeleteEntry}
            isOpenMobile={isMobileSidebarOpen}
            onCloseMobile={() => setIsMobileSidebarOpen(false)}
          />

          {/* Active Journal Editor & AI Dialogue Area */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 max-w-4xl">
            {activeEntry ? (
              <JournalEditor
                key={activeEntry.id}
                entry={activeEntry}
                onSave={handleSaveEntry}
                onDelete={handleDeleteEntry}
                isSaving={isSaving}
                saveError={saveError}
                onClearSaveError={() => setSaveError(null)}
              />
            ) : (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 space-y-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-serif font-bold text-slate-800">Ready to reflect?</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Start a new journal entry to write your thoughts and have Gemini provide reflections and takeaways.
                </p>
                <button
                  onClick={handleNewEntry}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium shadow-sm transition-all"
                >
                  Start New Reflection
                </button>
              </div>
            )}
          </main>
        </div>
      )}

      {/* Security & Threat Defense Modal */}
      <SecurityArchitectureModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
      />
    </div>
  );
}
