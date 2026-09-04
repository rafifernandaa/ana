import React, { useState } from "react";
import { 
  JournalEntry, 
  ResetSession, 
  PrunedThoughtLoop, 
  GlimmerAnchor, 
  CircadianEntry, 
  PsychiatricDistillation 
} from "../types";
import { NavTabId } from "./AetherHeader";
import { StudioWorkspace } from "./StudioWorkspace";
import { FeaturesWorkspace, FeatureSubTab } from "./FeaturesWorkspace";
import { NeuroplasticDashboard } from "./NeuroplasticDashboard";
import { ArchiveWorkspace } from "./ArchiveWorkspace";
import { ConfigWorkspace } from "./ConfigWorkspace";
import { User } from "firebase/auth";

interface TilingWindowManagerProps {
  activeTab: NavTabId;
  onSelectTab: (tab: NavTabId) => void;
  activeEntry: JournalEntry | null;
  entries: JournalEntry[];
  sessions: ResetSession[];
  prunedLoops: PrunedThoughtLoop[];
  glimmers: GlimmerAnchor[];
  circadianEntries: CircadianEntry[];
  psychiatricDistillations: PsychiatricDistillation[];
  onSaveEntry: (entry: JournalEntry) => Promise<void>;
  onDeleteEntry: (id: string) => Promise<void>;
  onSelectEntry: (entry: JournalEntry) => void;
  onNewEntry: () => void;
  isSaving: boolean;
  saveError: string | null;
  onClearSaveError: () => void;
  onSaveResetSession: (session: ResetSession) => Promise<void>;
  onSavePrunedLoop: (loop: PrunedThoughtLoop) => Promise<void>;
  onSaveGlimmer: (glimmer: GlimmerAnchor) => Promise<void>;
  onSaveCircadianEntry: (entry: CircadianEntry) => Promise<void>;
  onSavePsychiatricDistillation: (dist: PsychiatricDistillation) => Promise<void>;
  layoutMode: "split" | "journal_focus" | "ai_focus";
  onSetLayoutMode: (mode: "split" | "journal_focus" | "ai_focus") => void;
  user: User | null;
  onSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
  lastSavedAt: number | null;
}

export const TilingWindowManager: React.FC<TilingWindowManagerProps> = ({
  activeTab,
  onSelectTab,
  activeEntry,
  entries,
  sessions,
  prunedLoops,
  glimmers,
  circadianEntries,
  psychiatricDistillations,
  onSaveEntry,
  onDeleteEntry,
  onSelectEntry,
  onNewEntry,
  isSaving,
  saveError,
  onClearSaveError,
  onSaveResetSession,
  onSavePrunedLoop,
  onSaveGlimmer,
  onSaveCircadianEntry,
  onSavePsychiatricDistillation,
  layoutMode,
  onSetLayoutMode,
  user,
  onSignIn,
  onSignOut,
  lastSavedAt,
}) => {
  const [featureInitialTab, setFeatureInitialTab] = useState<FeatureSubTab>("reset_room");

  // Fallback entry if none selected
  const safeEntry: JournalEntry = activeEntry || {
    id: "default-entry",
    userId: user?.uid || "guest",
    title: "Untitled Reflection Note",
    content: "",
    mood: "reflective",
    tags: ["reflection", "clarity", "stress-reset"],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: [],
    aiSummary: null,
    isFavorite: false,
  };

  const handleInsertToJournal = (text: string) => {
    const updatedContent = safeEntry.content ? `${safeEntry.content}\n\n${text}` : text;
    const updated = { ...safeEntry, content: updatedContent, updatedAt: Date.now() };
    onSaveEntry(updated);
  };

  return (
    <main 
      id="tiling-workspace-container"
      className="flex-1 flex flex-col min-w-0 bg-[#121212] text-[#e2e8f0] font-mono h-full overflow-hidden"
    >
      {/* ==================================================================== */}
      {/* 1. FIRST ASIDE TAB: DASHBOARD (System Clarity & Analytics)           */}
      {/* ==================================================================== */}
      {activeTab === "dashboard" && (
        <div className="flex-1 flex flex-col h-full min-h-0 overflow-y-auto p-2.5 sm:p-4 bg-[#181818]">
          <NeuroplasticDashboard
            entries={entries}
            sessions={sessions}
            prunedLoops={prunedLoops}
            glimmers={glimmers}
            circadianEntries={circadianEntries}
            onOpenResetRoom={() => {
              setFeatureInitialTab("reset_room");
              onSelectTab("features");
            }}
            onOpenSynapticPruner={() => {
              setFeatureInitialTab("pruner");
              onSelectTab("features");
            }}
            onOpenGlimmerVault={() => {
              setFeatureInitialTab("glimmer_vault");
              onSelectTab("features");
            }}
            onOpenInStudio={(entry) => {
              onSelectEntry(entry);
              onSelectTab("studio");
            }}
            onTogglePin={async (entry) => {
              const updated = {
                ...entry,
                isPinned: !entry.isPinned,
                updatedAt: Date.now(),
              };
              await onSaveEntry(updated);
            }}
            onNewEntry={() => {
              onNewEntry();
              onSelectTab("studio");
            }}
          />
        </div>
      )}

      {/* ==================================================================== */}
      {/* 2. SECOND ASIDE TAB: STUDIO (Journal Entry & AI Assistant Side-by-Side)*/}
      {/* ==================================================================== */}
      {activeTab === "studio" && (
        <StudioWorkspace
          entry={safeEntry}
          onSave={onSaveEntry}
          onDelete={onDeleteEntry}
          onNewEntry={onNewEntry}
          isSaving={isSaving}
          saveError={saveError}
          onClearSaveError={onClearSaveError}
          layoutMode={layoutMode}
          onSetLayoutMode={onSetLayoutMode}
        />
      )}

      {/* ==================================================================== */}
      {/* 3. THIRD ASIDE TAB: FEATURES HUB (Non-Modal Mind Tools)             */}
      {/* ==================================================================== */}
      {activeTab === "features" && (
        <FeaturesWorkspace
          user={user}
          activeEntry={activeEntry}
          sessions={sessions}
          prunedLoops={prunedLoops}
          glimmers={glimmers}
          circadianEntries={circadianEntries}
          psychiatricDistillations={psychiatricDistillations}
          onSaveResetSession={onSaveResetSession}
          onSavePrunedLoop={onSavePrunedLoop}
          onSaveGlimmer={onSaveGlimmer}
          onSaveCircadianEntry={onSaveCircadianEntry}
          onSavePsychiatricDistillation={onSavePsychiatricDistillation}
          onInsertToJournal={handleInsertToJournal}
          initialSubTab={featureInitialTab}
        />
      )}

      {/* ==================================================================== */}
      {/* 4. FOURTH ASIDE TAB: ARCHIVE & REFLECTION HISTORY                   */}
      {/* ==================================================================== */}
      {activeTab === "archive" && (
        <ArchiveWorkspace
          entries={entries}
          sessions={sessions}
          prunedLoops={prunedLoops}
          glimmers={glimmers}
          activeEntryId={activeEntry?.id || null}
          onSelectEntry={onSelectEntry}
          onDeleteEntry={onDeleteEntry}
          onOpenInStudio={(entry) => {
            onSelectEntry(entry);
            onSelectTab("studio");
          }}
          onNewEntry={onNewEntry}
        />
      )}

      {/* ==================================================================== */}
      {/* 5. FIFTH ASIDE TAB: SYSTEM CONFIGURATION & SECURITY ARCHITECTURE   */}
      {/* ==================================================================== */}
      {activeTab === "settings" && (
        <ConfigWorkspace
          user={user}
          onSignIn={onSignIn}
          onSignOut={onSignOut}
          entries={entries}
          sessions={sessions}
          prunedLoops={prunedLoops}
          glimmers={glimmers}
          lastSavedAt={lastSavedAt}
        />
      )}
    </main>
  );
};
