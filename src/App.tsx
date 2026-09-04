import React, { useState, useEffect, useCallback, useMemo } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, signInWithGoogle, logOutUser } from "./lib/firebase";
import { 
  subscribeToUserEntries, 
  saveJournalEntry, 
  deleteJournalEntry,
  subscribeToUserSessions, 
  saveResetSession, 
  deleteResetSession,
  subscribeToPrunedLoops, 
  savePrunedLoop, 
  deletePrunedLoop,
  subscribeToGlimmers, 
  saveGlimmerAnchor, 
  deleteGlimmerAnchor,
  subscribeToCircadianEntries, 
  saveCircadianEntry, 
  deleteCircadianEntry,
  subscribeToPsychiatricDistillations, 
  savePsychiatricDistillation, 
  deletePsychiatricDistillation
} from "./lib/journalService";
import { 
  JournalEntry, 
  ResetSession, 
  PrunedThoughtLoop, 
  GlimmerAnchor, 
  CircadianEntry, 
  PsychiatricDistillation 
} from "./types";
import { DEFAULT_JOURNAL_ENTRIES } from "./data/defaultSeedEntries";
import { RiceSidebarDock } from "./components/RiceSidebarDock";
import { AetherHeader, NavTabId } from "./components/AetherHeader";
import { TilingWindowManager } from "./components/TilingWindowManager";
import { ResetRoomModal } from "./components/ResetRoomModal";
import { ResetSessionViewerModal } from "./components/ResetSessionViewerModal";
import { SynapticPruningModal } from "./components/SynapticPruningModal";
import { GlimmerVaultModal } from "./components/GlimmerVaultModal";
import { SecurityArchitectureModal } from "./components/SecurityArchitectureModal";
import { SettingsModal } from "./components/SettingsModal";
import { Sparkles, AlertCircle, Clock } from "lucide-react";
import { useTheme } from "./lib/theme";
import { getSheetsConfig, syncToGoogleSheets } from "./lib/sheets";

export default function App() {
  const { isLight } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Baseline data matching the user's reference layout
  const initialDefaultEntry: JournalEntry = {
    id: "entry-default",
    userId: "guest",
    title: "Untitled Entry",
    content: "",
    mood: "reflective",
    tags: ["reflection", "clarity", "stress-reset"],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: [],
    aiSummary: null,
    isFavorite: false,
  };

  const defaultSessions: ResetSession[] = [
    {
      id: "session-1",
      userId: "guest",
      mode: "full",
      bodyMap: { zones: ["shoulders"], intensity: 4 },
      affectLabel: "Tension",
      writingContent: "Workload feeling high.",
      extractedDarkSentence: "I need to do it all now.",
      reframes: [{ lens: "compassion", title: "Self Compassion", text: "Recognized I am doing my best.", rationale: "Pacing" }],
      chosenReframeIndex: 0,
      glimmer: "Gentle morning breeze through the window.",
      beforeWord: "Overwhelmed",
      afterWord: "Grounded",
      durationMs: 180000,
      createdAt: Date.now() - 86400000,
      updatedAt: Date.now() - 86400000,
      sourceEntryId: null,
    },
    {
      id: "session-2",
      userId: "guest",
      mode: "full",
      bodyMap: { zones: ["jaw"], intensity: 3 },
      affectLabel: "Urgency",
      writingContent: "Racing through the day.",
      extractedDarkSentence: "If I pause, everything will unravel.",
      reframes: [{ lens: "agency", title: "Present Control", text: "I can choose stillness right here.", rationale: "Presence" }],
      chosenReframeIndex: 0,
      glimmer: "A warm cup of tea.",
      beforeWord: "Scattered",
      afterWord: "Present",
      durationMs: 180000,
      createdAt: Date.now() - 172800000,
      updatedAt: Date.now() - 172800000,
      sourceEntryId: null,
    },
  ];

  const defaultPrunedLoops: PrunedThoughtLoop[] = [
    {
      id: "loop-1",
      userId: "guest",
      oldDistortion: "I need to solve every problem right now or everything falls apart.",
      distortionCategory: "catastrophizing",
      newRewiredBelief: "I can only attend to the present moment. One deliberate step is enough.",
      dissolvedAt: Date.now() - 86400000,
    },
    {
      id: "loop-2",
      userId: "guest",
      oldDistortion: "If I rest, I am falling behind.",
      distortionCategory: "should_statements",
      newRewiredBelief: "Rest is active restoration, not idle neglect.",
      dissolvedAt: Date.now() - 172800000,
    },
  ];

  // Journal entries state (seeded with empirical longitudinal entries)
  const [entries, setEntries] = useState<JournalEntry[]>(DEFAULT_JOURNAL_ENTRIES);
  const [activeEntry, setActiveEntry] = useState<JournalEntry | null>(DEFAULT_JOURNAL_ENTRIES[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

  // Reset Room sessions state
  const [sessions, setSessions] = useState<ResetSession[]>(defaultSessions);
  const [isResetRoomOpen, setIsResetRoomOpen] = useState(false);
  const [selectedSessionForView, setSelectedSessionForView] = useState<ResetSession | null>(null);

  // Synaptic Pruning & Glimmer Vault state
  const [prunedLoops, setPrunedLoops] = useState<PrunedThoughtLoop[]>(defaultPrunedLoops);
  const [isPrunerOpen, setIsPrunerOpen] = useState(false);
  const [glimmers, setGlimmers] = useState<GlimmerAnchor[]>([]);
  const [isGlimmerVaultOpen, setIsGlimmerVaultOpen] = useState(false);

  // Circadian & Decentering state
  const [circadianEntries, setCircadianEntries] = useState<CircadianEntry[]>([]);
  const [psychiatricDistillations, setPsychiatricDistillations] = useState<PsychiatricDistillation[]>([]);

  // Workspace Navigation & Layout Mode
  const [activeNavTab, setActiveNavTab] = useState<NavTabId>("dashboard");
  const [layoutMode, setLayoutMode] = useState<"split" | "journal_focus" | "ai_focus">("split");
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Circadian Inactivity Banner State
  const [showInactivityBanner, setShowInactivityBanner] = useState(true);

  const hoursSinceLastJournal = useMemo(() => {
    if (!entries || entries.length === 0) return 24;
    const sorted = [...entries].sort((a, b) => b.createdAt - a.createdAt);
    return Math.max(0, (Date.now() - sorted[0].createdAt) / (1000 * 60 * 60));
  }, [entries]);

  const isUserInactiveForJournal = hoursSinceLastJournal >= 20;

  // Helper to generate a fresh entry
  const createNewBlankEntry = useCallback((userId: string): JournalEntry => {
    return {
      id: "entry-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
      userId,
      title: "Untitled Entry",
      content: "",
      mood: "reflective",
      tags: ["reflection", "clarity", "stress-reset"],
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

  // Subscribe to user-isolated Firestore data when authenticated
  useEffect(() => {
    if (!user) {
      return;
    }

    // 1. Subscribe to Reflections
    const unsubscribeEntries = subscribeToUserEntries(
      user.uid,
      async (fetchedEntries) => {
        if (fetchedEntries.length > 0) {
          setEntries(fetchedEntries);
          setActiveEntry(prev => {
            if (prev) {
              const matching = fetchedEntries.find(e => e.id === prev.id);
              return matching || fetchedEntries[0];
            }
            return fetchedEntries[0];
          });
        } else {
          // Seed Firestore with initial empirical entries so user has immediate database data
          for (const seed of DEFAULT_JOURNAL_ENTRIES) {
            try {
              await saveJournalEntry(user.uid, {
                ...seed,
                userId: user.uid,
              });
            } catch (seedErr) {
              console.warn("Could not seed initial entry:", seedErr);
            }
          }
        }
      },
      (err) => {
        console.error("Firestore entries subscription error:", err);
      }
    );

    // 2. Subscribe to Reset Room Sessions
    const unsubscribeSessions = subscribeToUserSessions(
      user.uid,
      (fetchedSessions) => {
        if (fetchedSessions.length > 0) {
          setSessions(fetchedSessions);
        }
      },
      (err) => {
        console.error("Firestore sessions error:", err);
      }
    );

    // 3. Subscribe to Synaptically Pruned Loops
    const unsubscribePruned = subscribeToPrunedLoops(
      user.uid,
      (fetchedLoops) => {
        if (fetchedLoops.length > 0) {
          setPrunedLoops(fetchedLoops);
        }
      },
      (err) => {
        console.error("Firestore pruned loops error:", err);
      }
    );

    // 4. Subscribe to Glimmer Anchors
    const unsubscribeGlimmers = subscribeToGlimmers(
      user.uid,
      (fetchedGlimmers) => {
        setGlimmers(fetchedGlimmers);
      },
      (err) => {
        console.error("Firestore glimmers error:", err);
      }
    );

    // 5. Subscribe to Circadian Day Boundary entries
    const unsubscribeCircadian = subscribeToCircadianEntries(
      user.uid,
      (fetchedCircadian) => {
        setCircadianEntries(fetchedCircadian);
      },
      (err) => {
        console.error("Firestore circadian error:", err);
      }
    );

    // 6. Subscribe to Psychiatric Distillations
    const unsubscribeDistillations = subscribeToPsychiatricDistillations(
      user.uid,
      (fetchedDistillations) => {
        setPsychiatricDistillations(fetchedDistillations);
      },
      (err) => {
        console.error("Firestore distillations error:", err);
      }
    );

    return () => {
      unsubscribeEntries();
      unsubscribeSessions();
      unsubscribePruned();
      unsubscribeGlimmers();
      unsubscribeCircadian();
      unsubscribeDistillations();
    };
  }, [user]);

  // Handle Authentication flows
  const handleSignIn = async () => {
    try {
      setIsAuthLoading(true);
      setAuthError(null);
      await signInWithGoogle();
    } catch (err: any) {
      console.error("Authentication error:", err);
      setAuthError(err.message || "Failed to sign in with Google.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logOutUser();
    } catch (err: any) {
      console.error("Sign out error:", err);
      setAuthError("Failed to sign out: " + err.message);
    }
  };

  // Save Journal Entry
  const handleSaveEntry = async (entryToSave: JournalEntry) => {
    setIsSaving(true);
    setSaveError(null);
    try {
      // Local state update immediately
      setEntries(prev => {
        const index = prev.findIndex(e => e.id === entryToSave.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = entryToSave;
          return updated;
        }
        return [entryToSave, ...prev];
      });
      setActiveEntry(entryToSave);

      // Persist to Firestore if authenticated
      if (user) {
        await saveJournalEntry(user.uid, entryToSave);
      }
      setLastSavedAt(Date.now());

      // Auto-sync to Google Sheets if user configured autoSync
      try {
        const sheetsCfg = getSheetsConfig();
        if (sheetsCfg.autoSync) {
          syncToGoogleSheets({
            entries: [entryToSave],
            userEmail: user?.email || undefined,
            webhookUrl: sheetsCfg.webhookUrl,
            spreadsheetId: sheetsCfg.spreadsheetId,
          }).catch((err) => console.warn("Background Sheets sync non-blocking error:", err));
        }
      } catch (sheetsErr) {
        // Non-blocking catch to prevent journal disruption
        console.warn("Sheets auto-sync trigger error:", sheetsErr);
      }
    } catch (err: any) {
      console.error("Error saving journal entry:", err);
      setSaveError("Failed to synchronize entry: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Journal Entry
  const handleDeleteEntry = async (entryId: string) => {
    try {
      setEntries(prev => prev.filter(e => e.id !== entryId));
      if (activeEntry?.id === entryId) {
        setActiveEntry(null);
      }
      if (user) {
        await deleteJournalEntry(user.uid, entryId);
      }
    } catch (err: any) {
      console.error("Error deleting entry:", err);
      setSaveError("Failed to delete entry: " + err.message);
    }
  };

  // Create New Blank Entry
  const handleNewEntry = () => {
    const newEntry = createNewBlankEntry(user?.uid || "guest");
    setEntries(prev => [newEntry, ...prev]);
    setActiveEntry(newEntry);
  };

  // Save Reset Session
  const handleSaveResetSession = async (session: ResetSession) => {
    try {
      setSessions(prev => [session, ...prev]);
      if (user) {
        await saveResetSession(user.uid, session);
      }
      setIsResetRoomOpen(false);
    } catch (err: any) {
      console.error("Error saving reset session:", err);
      setSaveError("Failed to save reset session: " + err.message);
    }
  };

  // Save Pruned Loop
  const handleSavePrunedLoop = async (loop: PrunedThoughtLoop) => {
    try {
      setPrunedLoops(prev => [loop, ...prev]);
      if (user) {
        await savePrunedLoop(user.uid, loop);
      }
      setIsPrunerOpen(false);
    } catch (err: any) {
      console.error("Error saving pruned loop:", err);
      setSaveError("Failed to save pruned loop: " + err.message);
    }
  };

  // Save Glimmer Anchor
  const handleSaveGlimmer = async (glimmer: GlimmerAnchor) => {
    try {
      setGlimmers(prev => [glimmer, ...prev]);
      if (user) {
        await saveGlimmerAnchor(user.uid, glimmer);
      }
    } catch (err: any) {
      console.error("Error saving glimmer anchor:", err);
      setSaveError("Failed to save glimmer: " + err.message);
    }
  };

  // Save Circadian Entry
  const handleSaveCircadianEntry = async (entry: CircadianEntry) => {
    try {
      setCircadianEntries(prev => {
        const filtered = prev.filter(c => c.id !== entry.id);
        return [entry, ...filtered];
      });
      if (user) {
        await saveCircadianEntry(user.uid, entry);
      }
    } catch (err: any) {
      console.error("Error saving circadian entry:", err);
      setSaveError("Failed to save circadian boundary: " + err.message);
    }
  };

  // Save Psychiatric Distillation
  const handleSavePsychiatricDistillation = async (distillation: PsychiatricDistillation) => {
    try {
      setPsychiatricDistillations(prev => [distillation, ...prev]);
      if (user) {
        await savePsychiatricDistillation(user.uid, distillation);
      }
    } catch (err: any) {
      console.error("Error saving psychiatric distillation:", err);
      setSaveError("Failed to save distillation: " + err.message);
    }
  };

  // Handle Dock Navigation
  const handleSelectTab = (tab: NavTabId) => {
    setActiveNavTab(tab);
  };

  // Loading Screen
  if (isAuthLoading) {
    return (
      <div className={`min-h-screen ${isLight ? "light bg-[#F7F7F5] text-[#171815]" : "dark bg-[#181818] text-[#e2e8f0]"} flex items-center justify-center p-4 font-mono transition-colors`}>
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-12 h-12 rounded bg-[#262626] border border-[#3D4028] text-[#A3A649] flex items-center justify-center mx-auto shadow-md animate-pulse">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-bold tracking-wide text-white">ana // boot</h2>
            <p className="text-xs text-[#8C8C8C]">Initializing Cloud Firestore state...</p>
          </div>
          <div className="flex justify-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#AD3D30] animate-ping" />
            <span className="w-2 h-2 rounded-full bg-[#A3A649]" />
            <span className="w-2 h-2 rounded-full bg-[#3D4028]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isLight ? "light bg-[#F7F7F5] text-[#171815]" : "dark bg-[#121212] text-[#e2e8f0]"} flex flex-col antialiased font-mono overflow-hidden selection:bg-[#AD3D30] selection:text-white h-screen transition-colors duration-150`}>
      {/* Aether-Void Top Header */}
      <AetherHeader
        activeTab={activeNavTab}
        onSelectTab={setActiveNavTab}
        layoutMode={layoutMode}
        onToggleLayout={() => {
          setLayoutMode(prev => prev === "split" ? "journal_focus" : prev === "journal_focus" ? "ai_focus" : "split");
        }}
        user={user}
        onOpenAuth={user ? handleSignOut : handleSignIn}
        isSaving={isSaving}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col md:flex-row min-w-0 min-h-0 overflow-hidden relative pb-16 md:pb-0">
        {/* Rice Sidebar Dock on the far left (Desktop) / Bottom Nav Bar (Mobile) */}
        <RiceSidebarDock
          activeTab={activeNavTab}
          onSelectTab={setActiveNavTab}
          onNewEntry={() => {
            handleNewEntry();
            setActiveNavTab("studio");
          }}
          onOpenSettings={() => setActiveNavTab("settings")}
          user={user}
        />

        {/* Workspace Column */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          {/* Auth or Save Error Notification Banner if any */}
          {(authError || saveError) && (
            <div className="bg-[#AD3D30]/20 border-b border-[#AD3D30] px-4 py-2 text-xs text-[#e2e8f0] flex items-center justify-between font-mono shrink-0">
              <div className="flex items-center gap-2 max-w-4xl">
                <AlertCircle className="w-4 h-4 text-[#AD3D30] shrink-0" />
                <span>{authError || saveError}</span>
              </div>
              <button
                onClick={() => {
                  setAuthError(null);
                  setSaveError(null);
                }}
                className="text-[#8C8C8C] hover:text-white font-bold px-2 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Circadian Inactivity Nudge Banner (Re-engagement notification) */}
          {isUserInactiveForJournal && showInactivityBanner && (
            <div className="bg-[#3D4028]/90 border-b border-[#A3A649]/60 px-4 py-2 text-xs text-[#e2e8f0] flex items-center justify-between font-mono shrink-0 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2 max-w-4xl">
                <Clock className="w-4 h-4 text-[#A3A649] shrink-0 animate-pulse" />
                <span>
                  <strong className="text-[#A3A649]">Circadian Loop Closure:</strong> It has been {hoursSinceLastJournal.toFixed(0)}h since your last reflection. Notice any unresolved mental tension? Take 90 seconds to deposit open loops.
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    handleNewEntry();
                    setActiveNavTab("studio");
                    setShowInactivityBanner(false);
                  }}
                  className="px-2.5 py-1 bg-[#A3A649] hover:bg-[#A3A649]/80 text-black font-bold rounded-xs text-[11px] transition-all cursor-pointer"
                >
                  Deposit Open Loops
                </button>
                <button
                  onClick={() => setShowInactivityBanner(false)}
                  className="text-[#8C8C8C] hover:text-white font-bold px-1.5 cursor-pointer"
                  title="Dismiss reminder"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Primary Tiling Window Manager (Routes between Dashboard, Studio, Features, Archive, Settings) */}
          <div className="flex-1 h-full overflow-hidden">
            <TilingWindowManager
              activeTab={activeNavTab}
              onSelectTab={setActiveNavTab}
              activeEntry={activeEntry}
              entries={entries}
              sessions={sessions}
              prunedLoops={prunedLoops}
              glimmers={glimmers}
              circadianEntries={circadianEntries}
              psychiatricDistillations={psychiatricDistillations}
              onSaveEntry={handleSaveEntry}
              onDeleteEntry={handleDeleteEntry}
              onSelectEntry={(entry) => {
                setActiveEntry(entry);
              }}
              onNewEntry={() => {
                handleNewEntry();
                setActiveNavTab("studio");
              }}
              isSaving={isSaving}
              saveError={saveError}
              onClearSaveError={() => setSaveError(null)}
              onSaveResetSession={handleSaveResetSession}
              onSavePrunedLoop={handleSavePrunedLoop}
              onSaveGlimmer={handleSaveGlimmer}
              onSaveCircadianEntry={handleSaveCircadianEntry}
              onSavePsychiatricDistillation={handleSavePsychiatricDistillation}
              layoutMode={layoutMode}
              onSetLayoutMode={setLayoutMode}
              user={user}
              onSignIn={handleSignIn}
              onSignOut={handleSignOut}
              lastSavedAt={lastSavedAt}
            />
          </div>
        </div>
      </div>

      {/* Fallback Modals for legacy triggers if ever needed */}
      <ResetRoomModal
        isOpen={isResetRoomOpen}
        onClose={() => setIsResetRoomOpen(false)}
        user={user}
        onSessionSaved={handleSaveResetSession}
        onOpenLogin={handleSignIn}
      />

      <ResetSessionViewerModal
        session={selectedSessionForView}
        isOpen={!!selectedSessionForView}
        onClose={() => setSelectedSessionForView(null)}
        onDeleteSession={async (id) => {
          setSessions(prev => prev.filter(s => s.id !== id));
          if (user) await deleteResetSession(user.uid, id);
          setSelectedSessionForView(null);
        }}
      />

      <SynapticPruningModal
        isOpen={isPrunerOpen}
        onClose={() => setIsPrunerOpen(false)}
        userId={user?.uid}
        onSavePrunedLoop={handleSavePrunedLoop}
      />

      <GlimmerVaultModal
        isOpen={isGlimmerVaultOpen}
        onClose={() => setIsGlimmerVaultOpen(false)}
        userId={user?.uid}
        journalContext={activeEntry?.content || ""}
        glimmers={glimmers}
        onSaveGlimmer={handleSaveGlimmer}
        onDeleteGlimmer={async (id) => {
          setGlimmers(prev => prev.filter(g => g.id !== id));
          if (user) await deleteGlimmerAnchor(user.uid, id);
        }}
      />

      <SecurityArchitectureModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        user={user}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        onOpenSecurity={() => setIsSecurityModalOpen(true)}
        isSaving={isSaving}
        lastSavedAt={lastSavedAt}
        entryCount={entries.length}
      />
    </div>
  );
}
