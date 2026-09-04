import React, { useState } from "react";
import { 
  Search, 
  BookOpen, 
  Trash2, 
  Sparkles, 
  MessageSquare, 
  Tag, 
  Plus, 
  Clock,
  Activity,
  Compass,
  Flame,
  Sun,
  Layers,
  Scissors,
  BrainCircuit,
  Wind,
  CheckCircle2,
  Heart,
  Target,
  Shield,
  Zap,
  ArrowRight,
  Sunrise,
  Sunset,
  Moon,
  BarChart3
} from "lucide-react";
import { JournalEntry, ResetSession, PrunedThoughtLoop, GlimmerAnchor, CircadianEntry, PsychiatricDistillation } from "../types";
import { ArchiveStatisticsView } from "./ArchiveStatisticsView";

interface EntryHistorySidebarProps {
  entries: JournalEntry[];
  sessions?: ResetSession[];
  prunedLoops?: PrunedThoughtLoop[];
  glimmers?: GlimmerAnchor[];
  circadianEntries?: CircadianEntry[];
  psychiatricDistillations?: PsychiatricDistillation[];
  activeEntryId: string | null;
  onSelectEntry: (entry: JournalEntry) => void;
  onSelectSession?: (session: ResetSession) => void;
  onNewEntry: () => void;
  onOpenResetRoom?: () => void;
  onOpenSynapticPruner?: () => void;
  onOpenGlimmerVault?: () => void;
  onDeleteEntry: (entryId: string) => Promise<void>;
  onDeleteSession?: (sessionId: string) => Promise<void>;
  onDeletePrunedLoop?: (loopId: string) => Promise<void>;
  onDeleteGlimmer?: (glimmerId: string) => Promise<void>;
  onDeleteCircadianEntry?: (circadianId: string) => Promise<void>;
  onDeletePsychiatricDistillation?: (id: string) => Promise<void>;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

const MOOD_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  reflective: Compass,
  grateful: Heart,
  peaceful: Wind,
  energized: Zap,
  focused: Target,
  creative: Sparkles,
  challenged: Shield,
  thoughtful: BrainCircuit,
};

export const EntryHistorySidebar: React.FC<EntryHistorySidebarProps> = ({
  entries,
  sessions = [],
  prunedLoops = [],
  glimmers = [],
  circadianEntries = [],
  psychiatricDistillations = [],
  activeEntryId,
  onSelectEntry,
  onSelectSession,
  onNewEntry,
  onOpenResetRoom,
  onOpenSynapticPruner,
  onOpenGlimmerVault,
  onDeleteEntry,
  onDeleteSession,
  onDeletePrunedLoop,
  onDeleteGlimmer,
  onDeleteCircadianEntry,
  onDeletePsychiatricDistillation,
  isOpenMobile,
  onCloseMobile,
}) => {
  const [activeTab, setActiveTab] = useState<"entries" | "sessions" | "pruned" | "glimmers" | "circadian" | "clarity" | "statistics">("entries");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMoodFilter, setSelectedMoodFilter] = useState<string>("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredEntries = entries.filter(entry => {
    const matchesQuery = 
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesMood = selectedMoodFilter === "all" || entry.mood === selectedMoodFilter;
    return matchesQuery && matchesMood;
  });

  const filteredSessions = sessions.filter(session => {
    return (
      session.affectLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.writingContent.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.beforeWord.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.afterWord.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.bodyMap.zones.some(z => z.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const filteredPrunedLoops = prunedLoops.filter(loop => {
    return (
      loop.oldDistortion.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loop.newRewiredBelief.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loop.distortionCategory.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const filteredGlimmers = glimmers.filter(glimmer => {
    return (
      glimmer.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      glimmer.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const filteredCircadian = circadianEntries.filter(circadian => {
    return (
      circadian.phase.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (circadian.morningIntention && circadian.morningIntention.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (circadian.loopClosedNotes && circadian.loopClosedNotes.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (circadian.untangledLoopsSummary && circadian.untangledLoopsSummary.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const filteredPsychiatric = psychiatricDistillations.filter(p => {
    return (
      p.rawVentText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.microActionAnchor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.facts.some(f => f.toLowerCase().includes(searchQuery.toLowerCase())) ||
      p.inMyControl.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const handleDeletePsychiatric = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this psychiatric clarity record?")) {
      setDeletingId(id);
      try {
        if (onDeletePsychiatricDistillation) await onDeletePsychiatricDistillation(id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleDeleteCircadian = async (e: React.MouseEvent, circadianId: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this circadian check-in?")) {
      setDeletingId(circadianId);
      try {
        if (onDeleteCircadianEntry) await onDeleteCircadianEntry(circadianId);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleDeleteEntry = async (e: React.MouseEvent, entryId: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this reflection? This action cannot be undone.")) {
      setDeletingId(entryId);
      try {
        await onDeleteEntry(entryId);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this Reset Session record?")) {
      setDeletingId(sessionId);
      try {
        if (onDeleteSession) await onDeleteSession(sessionId);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleDeletePruned = async (e: React.MouseEvent, loopId: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this pruned thought loop?")) {
      setDeletingId(loopId);
      try {
        if (onDeletePrunedLoop) await onDeletePrunedLoop(loopId);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleDeleteGlimmerAnchor = async (e: React.MouseEvent, glimmerId: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this glimmer anchor?")) {
      setDeletingId(glimmerId);
      try {
        if (onDeleteGlimmer) await onDeleteGlimmer(glimmerId);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const content = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          {/* Segmented View Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl text-xs font-semibold overflow-x-auto max-w-[240px]">
            <button
              id="sidebar-tab-reflections"
              type="button"
              onClick={() => setActiveTab("entries")}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                activeTab === "entries"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span>Entries ({entries.length})</span>
            </button>
            <button
              id="sidebar-tab-sessions"
              type="button"
              onClick={() => setActiveTab("sessions")}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                activeTab === "sessions"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
              <span>Resets ({sessions.length})</span>
            </button>
            <button
              id="sidebar-tab-pruned"
              type="button"
              onClick={() => setActiveTab("pruned")}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                activeTab === "pruned"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Scissors className="w-3.5 h-3.5 text-amber-600" />
              <span>Untangled ({prunedLoops.length})</span>
            </button>
            <button
              id="sidebar-tab-glimmers"
              type="button"
              onClick={() => setActiveTab("glimmers")}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                activeTab === "glimmers"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-teal-600" />
              <span>Glimmers ({glimmers.length})</span>
            </button>
            <button
              id="sidebar-tab-circadian"
              type="button"
              onClick={() => setActiveTab("circadian")}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                activeTab === "circadian"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Circadian ({circadianEntries.length})</span>
            </button>
            <button
              id="sidebar-tab-clarity"
              type="button"
              onClick={() => setActiveTab("clarity")}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                activeTab === "clarity"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <BrainCircuit className="w-3.5 h-3.5 text-indigo-600" />
              <span>Clarity ({psychiatricDistillations.length})</span>
            </button>
            <button
              id="sidebar-tab-statistics"
              type="button"
              onClick={() => setActiveTab("statistics")}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                activeTab === "statistics"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-violet-600" />
              <span>Statistics</span>
            </button>
          </div>

          {activeTab === "entries" && (
            <button
              id="sidebar-new-entry-btn"
              onClick={() => {
                onNewEntry();
                onCloseMobile();
              }}
              className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer"
              title="Write New Reflection"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}

          {activeTab === "sessions" && onOpenResetRoom && (
            <button
              id="sidebar-open-reset-btn"
              onClick={() => {
                onOpenResetRoom();
                onCloseMobile();
              }}
              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
              title="Start New Stress Reset"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}

          {activeTab === "pruned" && onOpenSynapticPruner && (
            <button
              id="sidebar-open-pruner-btn"
              onClick={() => {
                onOpenSynapticPruner();
                onCloseMobile();
              }}
              className="p-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors cursor-pointer"
              title="Prune New Thought Loop"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}

          {activeTab === "glimmers" && onOpenGlimmerVault && (
            <button
              id="sidebar-open-vault-btn"
              onClick={() => {
                onOpenGlimmerVault();
                onCloseMobile();
              }}
              className="p-1.5 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors cursor-pointer"
              title="Anchor New Glimmer"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search Input */}
        {activeTab !== "statistics" && (
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="sidebar-search-input"
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={`Search ${activeTab}...`}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 text-slate-700"
            />
          </div>
        )}

        {/* Mood Filter Pill Scroll for Entries */}
        {activeTab === "entries" && (
          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setSelectedMoodFilter("all")}
              className={`px-2 py-0.5 rounded-md text-[11px] transition-colors whitespace-nowrap cursor-pointer ${
                selectedMoodFilter === "all"
                  ? "bg-slate-900 text-white font-medium"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All
            </button>
            {Object.entries(MOOD_ICONS).map(([moodKey, MoodIcon]) => (
              <button
                key={moodKey}
                onClick={() => setSelectedMoodFilter(moodKey)}
                className={`px-2 py-0.5 rounded-md text-[11px] transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  selectedMoodFilter === moodKey
                    ? "bg-indigo-600 text-white font-medium"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <MoodIcon className="w-3 h-3 shrink-0" />
                <span className="capitalize">{moodKey}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* List Container */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {/* Entries Tab */}
        {activeTab === "entries" && (
          filteredEntries.length === 0 ? (
            <div className="py-12 px-4 text-center space-y-2">
              <Clock className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-medium text-slate-600">No reflections found</p>
              <p className="text-[11px] text-slate-400">
                {entries.length === 0 
                  ? "Write your first entry or talk with Gemini to start saving." 
                  : "Try adjusting your search terms or filter."}
              </p>
            </div>
          ) : (
            filteredEntries.map(entry => {
              const isActive = entry.id === activeEntryId;
              const MoodIcon = MOOD_ICONS[entry.mood] || Compass;
              const dateStr = new Date(entry.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              });

              return (
                <div
                  key={entry.id}
                  id={`history-entry-card-${entry.id}`}
                  onClick={() => {
                    onSelectEntry(entry);
                    onCloseMobile();
                  }}
                  className={`group relative p-3 rounded-xl border transition-all cursor-pointer ${
                    isActive
                      ? "bg-indigo-50/70 border-indigo-200 shadow-2xs"
                      : "bg-white hover:bg-slate-50/80 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <MoodIcon className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <h4 className="text-xs font-semibold text-slate-900 truncate">
                        {entry.title || "Untitled Reflection"}
                      </h4>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0">{dateStr}</span>
                  </div>

                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                    {entry.content || "Empty reflection..."}
                  </p>

                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                    <div className="flex items-center gap-2">
                      {entry.messages.length > 0 && (
                        <span className="flex items-center gap-0.5 text-indigo-600">
                          <MessageSquare className="w-3 h-3" />
                          <span>{entry.messages.length}</span>
                        </span>
                      )}
                      {entry.aiSummary && (
                        <span className="flex items-center gap-0.5 text-violet-600 font-medium">
                          <Sparkles className="w-3 h-3" />
                          <span>Insight</span>
                        </span>
                      )}
                    </div>

                    <button
                      id={`delete-entry-btn-${entry.id}`}
                      onClick={(e) => handleDeleteEntry(e, entry.id)}
                      disabled={deletingId === entry.id}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all cursor-pointer"
                      title="Delete Entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )
        )}

        {/* Sessions Tab */}
        {activeTab === "sessions" && (
          filteredSessions.length === 0 ? (
            <div className="py-12 px-4 text-center space-y-2">
              <Activity className="w-8 h-8 text-emerald-300 mx-auto" />
              <p className="text-xs font-medium text-slate-600">No Reset Sessions found</p>
              <p className="text-[11px] text-slate-400">
                Tap the Reset Room button to complete a guided stress reset.
              </p>
            </div>
          ) : (
            filteredSessions.map(session => {
              const dateStr = new Date(session.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              });

              return (
                <div
                  key={session.id}
                  id={`history-session-card-${session.id}`}
                  onClick={() => {
                    if (onSelectSession) onSelectSession(session);
                    onCloseMobile();
                  }}
                  className="group relative p-3 rounded-xl border bg-white hover:bg-slate-50/80 border-slate-200 hover:border-emerald-300 transition-all cursor-pointer space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      <h4 className="text-xs font-semibold text-slate-900 truncate">
                        {session.affectLabel} ({session.mode.toUpperCase()})
                      </h4>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0">{dateStr}</span>
                  </div>

                  {session.beforeWord && session.afterWord && (
                    <div className="flex items-center gap-1 text-[11px] font-medium text-slate-600">
                      <span className="text-rose-600 line-through text-[10px]">{session.beforeWord}</span>
                      <span className="text-slate-400">→</span>
                      <span className="text-emerald-700 font-bold">{session.afterWord}</span>
                    </div>
                  )}

                  <p className="text-[11px] text-slate-500 line-clamp-2 italic leading-relaxed">
                    "{session.writingContent.slice(0, 80)}..."
                  </p>

                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="text-emerald-700 font-medium flex items-center gap-1">
                      <Compass className="w-3 h-3" />
                      Reframe Logged
                    </span>

                    <button
                      id={`delete-session-btn-${session.id}`}
                      onClick={(e) => handleDeleteSession(e, session.id)}
                      disabled={deletingId === session.id}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all cursor-pointer"
                      title="Delete Reset Session"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )
        )}

        {/* Pruned Loops Tab */}
        {activeTab === "pruned" && (
          filteredPrunedLoops.length === 0 ? (
            <div className="py-12 px-4 text-center space-y-2">
              <Scissors className="w-8 h-8 text-amber-300 mx-auto" />
              <p className="text-xs font-medium text-slate-600">No Untangled Patterns</p>
              <p className="text-[11px] text-slate-400">
                Use the Thought Untangler to reframe recurring negative thought patterns.
              </p>
            </div>
          ) : (
            filteredPrunedLoops.map(loop => {
              const dateStr = new Date(loop.dissolvedAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              });

              return (
                <div
                  key={loop.id}
                  className="group relative p-3 rounded-xl border bg-amber-50/30 border-amber-200/80 hover:bg-amber-50 transition-all space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wide">
                      {loop.distortionCategory.replace("_", " ")}
                    </span>
                    <span className="text-[10px] text-slate-400">{dateStr}</span>
                  </div>

                  <p className="text-[11px] text-rose-800 line-through opacity-70 italic line-clamp-1">
                    "{loop.oldDistortion}"
                  </p>
                  <p className="text-xs text-emerald-950 font-semibold leading-relaxed line-clamp-2">
                    "{loop.newRewiredBelief}"
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                    <span className="text-emerald-600 font-medium flex items-center gap-1">
                      <Flame className="w-3 h-3" />
                      Thought Reframed
                    </span>

                    <button
                      onClick={(e) => handleDeletePruned(e, loop.id)}
                      disabled={deletingId === loop.id}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all cursor-pointer"
                      title="Delete Record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )
        )}

        {/* Glimmers Tab */}
        {activeTab === "glimmers" && (
          filteredGlimmers.length === 0 ? (
            <div className="py-12 px-4 text-center space-y-2">
              <Sun className="w-8 h-8 text-teal-300 mx-auto" />
              <p className="text-xs font-medium text-slate-600">No Glimmers Anchored</p>
              <p className="text-[11px] text-slate-400">
                Log moments of calm, sensory joy, or gratitude.
              </p>
            </div>
          ) : (
            filteredGlimmers.map(glimmer => {
              const dateStr = new Date(glimmer.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              });

              return (
                <div
                  key={glimmer.id}
                  className="group relative p-3 rounded-xl border bg-teal-50/30 border-teal-200/80 hover:bg-teal-50 transition-all space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wide">
                      {glimmer.category}
                    </span>
                    <span className="text-[10px] text-slate-400">{dateStr}</span>
                  </div>

                  <p className="text-xs text-slate-800 font-serif font-medium leading-relaxed">
                    "{glimmer.text}"
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                    <span className="text-teal-700 font-medium flex items-center gap-1">
                      <Sun className="w-3 h-3 text-teal-500" />
                      Joy Anchor
                    </span>

                    <button
                      onClick={(e) => handleDeleteGlimmerAnchor(e, glimmer.id)}
                      disabled={deletingId === glimmer.id}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all cursor-pointer"
                      title="Delete Glimmer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )
        )}

        {/* Circadian Tab */}
        {activeTab === "circadian" && (
          filteredCircadian.length === 0 ? (
            <div className="py-12 px-4 text-center space-y-2">
              <Sparkles className="w-8 h-8 text-amber-400 mx-auto" />
              <p className="text-xs font-medium text-slate-600">No Circadian Check-ins Yet</p>
              <p className="text-[11px] text-slate-400">
                Log a morning launch intention or complete an evening loop closure.
              </p>
            </div>
          ) : (
            filteredCircadian.map(item => {
              const dateStr = new Date(item.timestamp).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={item.id}
                  className={`group relative p-3.5 rounded-xl border transition-all space-y-2 ${
                    item.isLoopClosed 
                      ? "bg-amber-50/40 border-amber-300/80 hover:bg-amber-50" 
                      : "bg-indigo-50/30 border-indigo-200 hover:bg-indigo-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {item.phase === "dawn_morning" ? (
                        <Sunrise className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      ) : item.phase === "midday" ? (
                        <Sun className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                      ) : item.phase === "dusk_evening" ? (
                        <Sunset className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                      ) : (
                        <Moon className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      )}
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
                        {item.phase.replace("_", " ")} Check-in
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">{dateStr}</span>
                  </div>

                  {item.morningIntention && (
                    <div>
                      <span className="text-[9px] font-semibold uppercase text-amber-700 block">Morning Intention</span>
                      <p className="text-xs text-slate-800 font-serif line-clamp-2">
                        "{item.morningIntention}"
                      </p>
                    </div>
                  )}

                  {item.anticipatedFriction && (
                    <div>
                      <span className="text-[9px] font-semibold uppercase text-slate-600 block">Anticipated Friction</span>
                      <p className="text-xs text-slate-600 line-clamp-1">
                        {item.anticipatedFriction}
                      </p>
                    </div>
                  )}

                  {item.loopClosedNotes && (
                    <div className="border-t border-slate-200/60 pt-1.5">
                      <span className="text-[9px] font-semibold uppercase text-indigo-700 block">Loop Closed Notes</span>
                      <p className="text-xs text-slate-700 italic line-clamp-2">
                        "{item.loopClosedNotes}"
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[10px] pt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-mono text-[9px]">
                        Energy: {item.energyLevel}/5
                      </span>
                      {item.isLoopClosed && (
                        <span className="text-emerald-700 font-semibold bg-emerald-100/80 px-1.5 py-0.5 rounded text-[9px] flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>Loop Closed</span>
                        </span>
                      )}
                    </div>

                    <button
                      onClick={(e) => handleDeleteCircadian(e, item.id)}
                      disabled={deletingId === item.id}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all cursor-pointer"
                      title="Delete Check-in"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )
        )}

        {/* TAB 6: PSYCHIATRIC CLARITY (VENT-TO-CLARITY) RECORDS */}
        {activeTab === "clarity" && (
          filteredPsychiatric.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-3">
              <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-slate-700">No Decentered Clarity Records Yet</p>
              <p className="text-[11px] text-slate-500 leading-relaxed max-w-[200px] mx-auto">
                Use the Vent-to-Clarity Station in your journal to deconstruct emotional vents into facts and agency.
              </p>
            </div>
          ) : (
            filteredPsychiatric.map((item) => {
              return (
                <div
                  key={item.id}
                  className="group p-3.5 rounded-xl border border-indigo-100 bg-white hover:border-indigo-200 transition-all space-y-2.5 shadow-2xs"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-indigo-900 flex items-center gap-1">
                      <BrainCircuit className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Clarity Distillation</span>
                    </span>
                    <span className="text-slate-400 font-mono text-[10px]">
                      {new Date(item.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 font-serif italic line-clamp-2 border-l-2 border-slate-200 pl-2">
                    "{item.rawVentText}"
                  </p>

                  <div className="space-y-1 bg-slate-50 p-2 rounded-lg text-[10px] text-slate-700">
                    <div className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>{item.facts.length} Camera Facts vs. {item.interpretations.length} Projections</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <span>Agency: {item.inMyControl.length} In Control · {item.outOfMyControl.length} Out</span>
                    </div>
                  </div>

                  <div className="bg-emerald-50/70 border border-emerald-200/60 p-2 rounded-lg text-[10px]">
                    <span className="font-semibold text-emerald-900 block">Micro-Action Anchor:</span>
                    <p className="text-slate-800 font-medium line-clamp-2 flex items-start gap-1 mt-0.5">
                      <ArrowRight className="w-3 h-3 text-emerald-700 shrink-0 mt-0.5" />
                      <span>{item.microActionAnchor}</span>
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[10px] pt-1">
                    {item.groundingSighCompleted ? (
                      <span className="text-teal-700 font-semibold bg-teal-100/80 px-1.5 py-0.5 rounded text-[9px] flex items-center gap-1">
                        <Wind className="w-3 h-3" />
                        Sigh Anchored
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[9px]">Processed</span>
                    )}

                    <button
                      onClick={(e) => handleDeletePsychiatric(e, item.id)}
                      disabled={deletingId === item.id}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all cursor-pointer"
                      title="Delete Clarity Record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )
        )}

        {/* Statistics Tab Panel */}
        {activeTab === "statistics" && (
          <div className="p-1">
            <ArchiveStatisticsView
              entries={entries}
              onSelectEntry={(entry) => {
                onSelectEntry(entry);
                onCloseMobile();
              }}
              onOpenInStudio={(entry) => {
                onSelectEntry(entry);
                onCloseMobile();
              }}
              isCompact={true}
            />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-80 shrink-0 sticky top-16 h-[calc(100vh-4rem)]">
        {content}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" 
            onClick={onCloseMobile} 
          />
          <div className="relative w-80 max-w-[85vw] h-full z-50 shadow-2xl">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
