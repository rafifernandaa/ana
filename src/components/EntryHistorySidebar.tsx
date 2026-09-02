/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Search, 
  BookOpen, 
  Trash2, 
  Calendar, 
  Sparkles, 
  MessageSquare, 
  Filter, 
  Tag, 
  Plus, 
  Clock 
} from "lucide-react";
import { JournalEntry, JournalMood } from "../types";

interface EntryHistorySidebarProps {
  entries: JournalEntry[];
  activeEntryId: string | null;
  onSelectEntry: (entry: JournalEntry) => void;
  onNewEntry: () => void;
  onDeleteEntry: (entryId: string) => Promise<void>;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

const MOOD_EMOJIS: Record<string, string> = {
  reflective: "🪞",
  grateful: "🌱",
  peaceful: "🌊",
  energized: "⚡",
  focused: "🎯",
  creative: "🎨",
  challenged: "🧗",
  thoughtful: "💡",
};

export const EntryHistorySidebar: React.FC<EntryHistorySidebarProps> = ({
  entries,
  activeEntryId,
  onSelectEntry,
  onNewEntry,
  onDeleteEntry,
  isOpenMobile,
  onCloseMobile,
}) => {
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

  const handleDelete = async (e: React.MouseEvent, entryId: string) => {
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

  const content = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <h2 className="font-serif font-bold text-base text-slate-900">Your Journal</h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
              {entries.length}
            </span>
          </div>

          <button
            id="sidebar-new-entry-btn"
            onClick={() => {
              onNewEntry();
              onCloseMobile();
            }}
            className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
            title="Write New Reflection"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="sidebar-search-input"
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search entries, tags..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-700"
          />
        </div>

        {/* Mood Filter Pill Scroll */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setSelectedMoodFilter("all")}
            className={`px-2 py-0.5 rounded-md text-[11px] transition-colors whitespace-nowrap ${
              selectedMoodFilter === "all"
                ? "bg-slate-900 text-white font-medium"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All
          </button>
          {Object.entries(MOOD_EMOJIS).map(([moodKey, emoji]) => (
            <button
              key={moodKey}
              onClick={() => setSelectedMoodFilter(moodKey)}
              className={`px-2 py-0.5 rounded-md text-[11px] transition-colors whitespace-nowrap flex items-center gap-1 ${
                selectedMoodFilter === moodKey
                  ? "bg-indigo-600 text-white font-medium"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <span>{emoji}</span>
              <span className="capitalize">{moodKey}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Entries List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredEntries.length === 0 ? (
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
            const moodEmoji = MOOD_EMOJIS[entry.mood] || "🪞";
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
                className={`group relative p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  isActive
                    ? "bg-indigo-50/70 border-indigo-300 ring-1 ring-indigo-400/20 shadow-xs"
                    : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60"
                }`}
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{moodEmoji}</span>
                    <h3 className="font-medium text-xs text-slate-900 line-clamp-1">
                      {entry.title || "Untitled Reflection"}
                    </h3>
                  </div>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0">
                    {dateStr}
                  </span>
                </div>

                {/* Excerpt */}
                <p className="text-[11px] text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
                  {entry.content || (entry.messages.length > 0 ? entry.messages[0].content : "No written content.")}
                </p>

                {/* Footer metadata */}
                <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-400">
                  <div className="flex items-center gap-2">
                    {entry.messages.length > 0 && (
                      <span className="flex items-center gap-0.5 text-indigo-600 font-medium">
                        <MessageSquare className="w-3 h-3" />
                        {entry.messages.length}
                      </span>
                    )}
                    {entry.aiSummary && (
                      <span className="flex items-center gap-0.5 text-violet-600 font-medium" title="AI Summary Available">
                        <Sparkles className="w-3 h-3" />
                        Summary
                      </span>
                    )}
                    {entry.tags.length > 0 && (
                      <span className="flex items-center gap-0.5 text-slate-500">
                        <Tag className="w-3 h-3" />
                        {entry.tags.slice(0, 2).map(t => `#${t}`).join(" ")}
                      </span>
                    )}
                  </div>

                  {/* Delete action on hover */}
                  <button
                    id={`delete-entry-btn-${entry.id}`}
                    onClick={(e) => handleDelete(e, entry.id)}
                    disabled={deletingId === entry.id}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all"
                    title="Delete Entry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
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
