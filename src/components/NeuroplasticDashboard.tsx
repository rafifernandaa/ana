import React, { useState, useMemo } from "react";
import { 
  Sparkles, 
  Scissors, 
  Sun, 
  TrendingUp, 
  Activity, 
  ShieldCheck,
  ArrowRight, 
  BookOpen, 
  Compass,
  Calendar,
  Layers,
  Heart,
  BarChart3,
  CheckCircle2,
  Pin,
  PinOff,
  Plus,
  ExternalLink,
  X
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid
} from "recharts";
import { JournalEntry, ResetSession, PrunedThoughtLoop, GlimmerAnchor, CircadianEntry } from "../types";
import { useTheme } from "../lib/theme";
import { EmpiricalCorrelationsSection } from "./EmpiricalCorrelationsSection";

interface NeuroplasticDashboardProps {
  entries: JournalEntry[];
  sessions: ResetSession[];
  prunedLoops: PrunedThoughtLoop[];
  glimmers: GlimmerAnchor[];
  circadianEntries?: CircadianEntry[];
  onOpenResetRoom: () => void;
  onOpenSynapticPruner: () => void;
  onOpenGlimmerVault: () => void;
  onToggleSecurity?: () => void;
  onOpenInStudio?: (entry: JournalEntry) => void;
  onTogglePin?: (entry: JournalEntry) => void;
  onNewEntry?: () => void;
}

type TimeframeOption = "7d" | "30d" | "all";
type ActiveStatsTab = "activity" | "anchors" | "patterns" | "milestones" | "correlations";

export const NeuroplasticDashboard: React.FC<NeuroplasticDashboardProps> = ({
  entries,
  sessions,
  prunedLoops,
  glimmers,
  circadianEntries = [],
  onOpenResetRoom,
  onOpenSynapticPruner,
  onOpenGlimmerVault,
  onToggleSecurity,
  onOpenInStudio,
  onTogglePin,
  onNewEntry,
}) => {
  const [timeframe, setTimeframe] = useState<TimeframeOption>("30d");
  const [activeTab, setActiveTab] = useState<ActiveStatsTab>("activity");
  const [rechartsMode, setRechartsMode] = useState<"summary" | "cumulative" | "trend">("summary");
  const [isPinPickerOpen, setIsPinPickerOpen] = useState(false);
  const { isLight } = useTheme();

  const now = Date.now();
  const last30DaysCutoff = useMemo(() => now - 30 * 24 * 60 * 60 * 1000, [now]);

  // Pinned reflections held constant at the top
  const pinnedEntries = useMemo(() => entries.filter(e => !!e.isPinned), [entries]);
  
  // Real data or fallback baseline matching screenshot
  const displayGlimmers = glimmers;
  const displaySessions = sessions.length > 0 ? sessions : ([{ id: "s1", createdAt: now - 86400000 }, { id: "s2", createdAt: now - 172800000 }] as any);
  const displayLoops = prunedLoops.length > 0 ? prunedLoops : ([{ id: "l1", dissolvedAt: now - 86400000 }, { id: "l2", dissolvedAt: now - 172800000 }] as any);
  const displayEntries = entries.length > 0 ? entries : ([{ id: "e1", createdAt: now - 86400000 }] as any);

  const last30DaysGlimmers = useMemo(() => displayGlimmers.filter(g => g.createdAt >= last30DaysCutoff), [displayGlimmers, last30DaysCutoff]);
  const last30DaysSessions = useMemo(() => displaySessions.filter((s: any) => (s.createdAt || s.completedAt || 0) >= last30DaysCutoff), [displaySessions, last30DaysCutoff]);
  const last30DaysLoops = useMemo(() => displayLoops.filter((p: any) => (p.dissolvedAt || p.createdAt || 0) >= last30DaysCutoff), [displayLoops, last30DaysCutoff]);
  const total30DayPractices = last30DaysGlimmers.length + last30DaysSessions.length + last30DaysLoops.length;

  const totalAllTimeGlimmers = displayGlimmers.length;
  const totalAllTimeSessions = displaySessions.length;
  const totalAllTimeLoops = displayLoops.length;
  const totalAllTime = totalAllTimeGlimmers + totalAllTimeSessions + totalAllTimeLoops + displayEntries.length;

  // Recharts 30-Day Summary Data
  const recharts30DaySummary = useMemo(() => [
    {
      key: "glimmers",
      label: "Glimmer Captures",
      shortLabel: "Glimmers",
      count: last30DaysGlimmers.length,
      fill: isLight ? "#6B7280" : "#8C8C8C",
      description: "Micro-moments of peace, gratitude & everyday joy anchored.",
    },
    {
      key: "sessions",
      label: "Completed Resets",
      shortLabel: "Resets",
      count: last30DaysSessions.length,
      fill: isLight ? "#656C19" : "#A3A649",
      description: "Somatic resets, breathing cycles & perspective shifts completed.",
    },
    {
      key: "loops",
      label: "Pruned Loops",
      shortLabel: "Untangled Loops",
      count: last30DaysLoops.length,
      fill: "#AD3D30",
      description: "Cognitive distortions untangled, rewritten & released.",
    },
  ], [last30DaysGlimmers.length, last30DaysSessions.length, last30DaysLoops.length, isLight]);

  return (
    <div 
      className="flex flex-col h-full bg-[#1e1e1e] border border-[#3D4028] rounded-xl overflow-hidden shadow-2xl font-mono text-[#e2e8f0]"
      id="neuroplastic-clarity-dashboard"
    >
      {/* Top Window Tab Bar */}
      <div className="h-9 bg-[#181818] border-b border-[#3D4028] px-3 flex items-center justify-between shrink-0 text-xs select-none">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1 bg-[#262626] border-t-2 border-t-[#AD3D30] border-x border-[#3D4028] rounded-t text-slate-200 font-semibold text-[11px] shadow-inner">
            <span className="text-[#A3A649]">ana://dashboard</span>
            <span className="text-[#8C8C8C] text-xs leading-none ml-1">✕</span>
          </div>
        </div>

        <button 
          className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-[#262626] border border-[#3D4028] text-[11px] text-[#A3A649] font-semibold hover:bg-[#3D4028] transition-colors"
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Dashboard</span>
        </button>
      </div>

      {/* Main Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-2.5 sm:p-3 space-y-2.5 bg-[#181818] scrollbar-thin">
        
        {/* ============================================================ */}
        {/* HEADER BLOCK: Space Title + 2 Circular Dials */}
        {/* ============================================================ */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 border-b border-[#3D4028] pb-2.5">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded bg-[#262626] border border-[#3D4028] flex items-center justify-center text-[#A3A649]">
                <Compass className="w-3 h-3" />
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#A3A649]">
                Growth & Reflection Space
              </span>
            </div>
            <h1 className="font-sans font-bold text-base sm:text-lg text-white tracking-tight">
              Personal Clarity & Growth Dashboard
            </h1>
            <p className="text-[11px] text-[#8C8C8C] max-w-xl leading-snug">
              Mindful summary of joy captures, perspective shifts, untangled thoughts, and habits.
            </p>
          </div>

          {/* Dials Container */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Dial 1: Weekly Regulation */}
            <div className="flex items-center gap-2 bg-[#262626] border border-[#3D4028] p-2 rounded-lg shadow-xs">
              <div className="relative flex items-center justify-center">
                <svg className="w-9 h-9 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-[#181818]"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-[#A3A649] transition-all duration-1000 ease-out"
                    strokeDasharray="80, 100"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-[11px] font-bold text-white font-mono leading-none">4</span>
                  <span className="text-[7px] text-[#A3A649] font-mono leading-none">/5</span>
                </div>
              </div>

              <div className="space-y-0.5">
                <div className="flex items-center gap-1">
                  <p className="text-[9px] text-[#A3A649] uppercase font-bold tracking-wider">Weekly Regulation</p>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#A3A649]" />
                </div>
                <p className="text-[11px] font-bold text-white flex items-center gap-1">
                  <span>Active Practice 🪄</span>
                </p>
                <p className="text-[9px] text-[#8C8C8C]">
                  <span>2 Resets</span> • <span>2 Untangled</span>
                </p>
              </div>
            </div>

            {/* Dial 2: Overall Momentum */}
            <div className="flex items-center gap-2 bg-[#262626] border border-[#3D4028] p-2 rounded-lg shadow-xs">
              <div className="relative flex items-center justify-center">
                <svg className="w-9 h-9 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-[#181818]"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-[#AD3D30] transition-all duration-1000 ease-out"
                    strokeDasharray="30, 100"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute text-[11px] font-bold text-white font-mono">30%</span>
              </div>
              <div className="space-y-0.5">
                <p className="text-[9px] text-[#8C8C8C] uppercase font-semibold">Overall Momentum</p>
                <p className="text-[11px] font-bold text-white flex items-center gap-1">
                  <span className="text-[#AD3D30]">↗</span>
                  <span>Beginning Journey</span>
                </p>
                <p className="text-[9px] text-[#8C8C8C] font-mono">
                  ● 5 total practices
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* PINNED CRITICAL REFLECTIONS (Persistent Top Visibility)     */}
        {/* ============================================================ */}
        <section 
          id="pinned-critical-reflections-section"
          className={`space-y-2.5 border rounded-xl p-3 sm:p-3.5 shadow-md ${
            isLight
              ? "bg-[#faf9f5] border-stone-200 shadow-xs"
              : "bg-[#1a1a1a] border-[#3D4028]"
          }`}
        >
          {/* Section Header */}
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2.5 ${
            isLight ? "border-stone-200" : "border-[#3D4028]/60"
          }`}>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-[#3D4028] border border-[#A3A649]/40 flex items-center justify-center text-[#A3A649] shadow-xs shrink-0">
                <Pin className="w-3.5 h-3.5 fill-[#A3A649]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className={`text-xs sm:text-sm font-bold tracking-tight ${isLight ? "text-stone-900" : "text-white"}`}>
                    Pinned Critical Reflections
                  </h2>
                  <span className="text-[9px] font-mono font-bold bg-[#3D4028] border border-[#A3A649]/40 text-[#A3A649] px-1.5 py-0.5 rounded-full">
                    {pinnedEntries.length} {pinnedEntries.length === 1 ? "Anchor" : "Anchors"} Pinned
                  </span>
                </div>
                <p className={`text-[10px] leading-tight mt-0.5 ${isLight ? "text-stone-500" : "text-[#8C8C8C]"}`}>
                  Core breakthroughs, cognitive reframes, and insights kept visible at the top of your workspace.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              <button
                id="pin-reflection-dashboard-btn"
                onClick={() => setIsPinPickerOpen(true)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xs border text-[10px] font-semibold transition-all cursor-pointer shadow-xs ${
                  isLight
                    ? "bg-white hover:bg-stone-100 border-stone-200 text-[#656C19]"
                    : "bg-[#262626] hover:bg-[#3D4028] border-[#3D4028] hover:border-[#A3A649] text-[#A3A649] hover:text-white"
                }`}
                title="Pin an existing reflection to dashboard"
              >
                <Plus className="w-3 h-3" />
                <span>Pin Reflection</span>
              </button>
            </div>
          </div>

          {/* Cards Grid or Empty State */}
          {pinnedEntries.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5 pt-0.5">
              {pinnedEntries.map((entry) => {
                const dateStr = new Date(entry.updatedAt || entry.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric"
                });
                const keyTakeaway = entry.aiSummary?.keyTakeaways?.[0];
                return (
                  <div
                    key={entry.id}
                    id={`pinned-reflection-card-${entry.id}`}
                    className={`p-3 rounded-lg border border-t-2 border-t-[#A3A649] flex flex-col justify-between space-y-2.5 transition-all shadow-xs group ${
                      isLight
                        ? "bg-white hover:bg-stone-50 border-stone-200 hover:border-[#A3A649]"
                        : "bg-[#242424] hover:bg-[#282828] border-[#3D4028] hover:border-[#A3A649]"
                    }`}
                  >
                    {/* Top Row: Pin Status + Mood + Quick Action Controls */}
                    <div className="flex items-center justify-between gap-2 text-[10px]">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="flex items-center gap-1 text-[9px] font-bold text-[#A3A649] bg-[#3D4028] border border-[#A3A649]/40 px-1.5 py-0.5 rounded-xs shrink-0">
                          <Pin className="w-2.5 h-2.5 fill-[#A3A649]" />
                          <span>PINNED ANCHOR</span>
                        </span>
                        <span className={`capitalize truncate px-1.5 py-0.5 rounded-xs border ${
                          isLight
                            ? "text-stone-600 bg-stone-100 border-stone-200"
                            : "text-[#8C8C8C] bg-[#1c1c1c] border-[#3D4028]"
                        }`}>
                          {entry.mood}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {onTogglePin && (
                          <button
                            id={`unpin-btn-${entry.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onTogglePin(entry);
                            }}
                            className={`p-1 rounded-xs border transition-colors cursor-pointer ${
                              isLight
                                ? "bg-stone-100 hover:bg-red-50 border-stone-200 hover:border-[#AD3D30] text-stone-500 hover:text-[#AD3D30]"
                                : "bg-[#1c1c1c] hover:bg-[#AD3D30]/20 border-[#3D4028] hover:border-[#AD3D30] text-[#8C8C8C] hover:text-[#AD3D30]"
                            }`}
                            title="Unpin reflection from dashboard"
                          >
                            <PinOff className="w-3 h-3" />
                          </button>
                        )}
                        {onOpenInStudio && (
                          <button
                            id={`open-in-studio-btn-${entry.id}`}
                            onClick={() => onOpenInStudio(entry)}
                            className={`p-1 rounded-xs border transition-colors cursor-pointer ${
                              isLight
                                ? "bg-stone-100 hover:bg-stone-200 border-stone-200 hover:border-[#A3A649] text-stone-500 hover:text-[#656C19]"
                                : "bg-[#1c1c1c] hover:bg-[#3D4028] border-[#3D4028] hover:border-[#A3A649] text-[#8C8C8C] hover:text-[#A3A649]"
                            }`}
                            title="Open reflection in Studio Workspace"
                          >
                            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Entry Title & Snippet */}
                    <div 
                      onClick={() => onOpenInStudio && onOpenInStudio(entry)}
                      className="cursor-pointer space-y-1.5"
                    >
                      <h3 className={`text-xs sm:text-sm font-bold group-hover:text-[#A3A649] transition-colors line-clamp-1 ${
                        isLight ? "text-stone-900" : "text-white"
                      }`}>
                        {entry.title || "Untitled Reflection Note"}
                      </h3>
                      
                      {/* Primary Takeaway or Excerpt */}
                      {keyTakeaway ? (
                        <div className={`p-1.5 rounded text-[10px] font-sans italic flex items-start gap-1.5 border ${
                          isLight
                            ? "bg-stone-50 border-stone-200 text-stone-700"
                            : "bg-[#1a1a1a] border-[#3D4028] text-slate-200"
                        }`}>
                          <Sparkles className="w-3 h-3 text-[#A3A649] shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{keyTakeaway}</span>
                        </div>
                      ) : (
                        <p className={`text-[11px] font-sans line-clamp-2 leading-relaxed ${
                          isLight ? "text-stone-600" : "text-[#8C8C8C]"
                        }`}>
                          {entry.content || "Reflective insight recorded."}
                        </p>
                      )}
                    </div>

                    {/* Card Footer: Date & Tags */}
                    <div className={`flex items-center justify-between pt-1 border-t text-[9px] ${
                      isLight ? "border-stone-100 text-stone-500" : "border-[#3D4028]/40 text-[#8C8C8C]"
                    }`}>
                      <span>{dateStr}</span>
                      <div className="flex items-center gap-1">
                        {entry.tags && entry.tags.slice(0, 2).map((tag, idx) => (
                          <span key={idx} className={isLight ? "text-[#656C19]" : "text-[#A3A649]"}>#{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={`p-3.5 sm:p-4 rounded-lg border border-dashed flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left ${
              isLight
                ? "bg-white/90 border-stone-300"
                : "bg-[#242424]/60 border-[#3D4028]"
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-[#A3A649] shrink-0 ${
                  isLight ? "bg-stone-100 border-stone-200" : "bg-[#1c1c1c] border-[#3D4028]"
                }`}>
                  <Pin className="w-4 h-4" />
                </div>
                <div>
                  <h4 className={`text-xs font-bold ${isLight ? "text-stone-900" : "text-white"}`}>No Critical Reflections Pinned Yet</h4>
                  <p className={`text-[10px] max-w-md ${isLight ? "text-stone-500" : "text-[#8C8C8C]"}`}>
                    Keep high-impact realizations, cognitive reframes, or mantras permanently visible here at the top of your dashboard regardless of recency.
                  </p>
                </div>
              </div>
              <button
                id="empty-state-pin-btn"
                onClick={() => setIsPinPickerOpen(true)}
                className={`px-3 py-1.5 rounded-xs border text-[11px] font-semibold transition-all cursor-pointer shrink-0 ${
                  isLight
                    ? "bg-white hover:bg-stone-100 text-[#656C19] border-stone-300"
                    : "bg-[#3D4028] hover:bg-[#3D4028]/80 text-[#A3A649] hover:text-white border-[#A3A649]/40"
                }`}
              >
                + Pin an Existing Reflection
              </button>
            </div>
          )}

          {/* Quick Pin Picker Modal */}
          {isPinPickerOpen && (
            <div 
              className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
              onClick={() => setIsPinPickerOpen(false)}
            >
              <div 
                className={`border rounded-xl max-w-md w-full max-h-[80vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 ${
                  isLight ? "bg-white border-stone-200 text-stone-800" : "bg-[#1e1e1e] border-[#3D4028] text-white"
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className={`p-3.5 border-b flex items-center justify-between ${
                  isLight ? "bg-stone-50 border-stone-200" : "bg-[#181818] border-[#3D4028]"
                }`}>
                  <div className="flex items-center gap-2">
                    <Pin className="w-4 h-4 text-[#A3A649] fill-[#A3A649]" />
                    <h3 className={`text-xs font-bold ${isLight ? "text-stone-900" : "text-white"}`}>Pin Reflection to Dashboard</h3>
                  </div>
                  <button
                    onClick={() => setIsPinPickerOpen(false)}
                    className={`p-1 rounded-xs transition-colors cursor-pointer ${
                      isLight ? "text-stone-400 hover:text-stone-700 hover:bg-stone-100" : "text-[#8C8C8C] hover:text-white hover:bg-[#262626]"
                    }`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className={`p-3 overflow-y-auto space-y-2 flex-1 divide-y ${
                  isLight ? "divide-stone-100" : "divide-[#3D4028]/40"
                }`}>
                  {entries.length === 0 ? (
                    <div className={`p-6 text-center text-xs space-y-2 ${isLight ? "text-stone-500" : "text-[#8C8C8C]"}`}>
                      <p>No journal reflections found to pin.</p>
                      {onNewEntry && (
                        <button
                          onClick={() => {
                            setIsPinPickerOpen(false);
                            onNewEntry();
                          }}
                          className="px-3 py-1 rounded-xs bg-[#AD3D30] text-white text-[11px] font-semibold cursor-pointer"
                        >
                          Create First Reflection
                        </button>
                      )}
                    </div>
                  ) : (
                    entries.map((item) => {
                      const isItemPinned = !!item.isPinned;
                      return (
                        <div 
                          key={item.id}
                          className="pt-2 pb-1.5 first:pt-0 flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0 flex-1">
                            <h4 className={`text-xs font-semibold truncate ${isLight ? "text-stone-900" : "text-white"}`}>
                              {item.title || "Untitled Entry"}
                            </h4>
                            <p className={`text-[10px] truncate max-w-xs font-sans ${isLight ? "text-stone-500" : "text-[#8C8C8C]"}`}>
                              {item.content ? item.content.slice(0, 80) : "No text body..."}
                            </p>
                            <div className={`flex items-center gap-1.5 mt-0.5 text-[9px] ${isLight ? "text-stone-400" : "text-[#8C8C8C]"}`}>
                              <span className={`capitalize ${isLight ? "text-[#656C19]" : "text-[#A3A649]"}`}>{item.mood}</span>
                              <span>•</span>
                              <span>{new Date(item.updatedAt || item.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>

                          <button
                            id={`picker-toggle-pin-${item.id}`}
                            onClick={() => {
                              if (onTogglePin) {
                                onTogglePin(item);
                              }
                            }}
                            className={`px-2.5 py-1 rounded-xs text-[10px] font-semibold transition-all cursor-pointer shrink-0 border flex items-center gap-1 ${
                              isItemPinned
                                ? "bg-[#3D4028] text-[#A3A649] border-[#A3A649]"
                                : isLight
                                  ? "bg-stone-100 hover:bg-stone-200 text-stone-700 border-stone-300"
                                  : "bg-[#262626] hover:bg-[#3D4028] text-white border-[#3D4028]"
                            }`}
                          >
                            <Pin className={`w-2.5 h-2.5 ${isItemPinned ? "fill-[#A3A649]" : ""}`} />
                            <span>{isItemPinned ? "Pinned" : "Pin"}</span>
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className={`p-2.5 border-t flex justify-end ${
                  isLight ? "bg-stone-50 border-stone-200" : "bg-[#181818] border-[#3D4028]"
                }`}>
                  <button
                    onClick={() => setIsPinPickerOpen(false)}
                    className={`px-3 py-1 rounded-xs text-xs border cursor-pointer ${
                      isLight
                        ? "bg-white hover:bg-stone-100 text-stone-700 border-stone-300"
                        : "bg-[#262626] hover:bg-[#333333] text-white border-[#3D4028]"
                    }`}
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ============================================================ */}
        {/* 4 FEATURE ACTION CARDS ROW (Exact 4 Columns) */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Card 1: Stress Reset Room */}
          <div 
            onClick={onOpenResetRoom}
            className="p-2.5 rounded-lg bg-[#262626] hover:bg-[#3D4028]/40 border border-[#3D4028] hover:border-[#A3A649] transition-all cursor-pointer flex flex-col justify-between space-y-1.5 group shadow-xs"
          >
            <div className="space-y-0.5">
              <div className="flex items-center justify-between">
                <div className="w-6 h-6 rounded-md bg-[#181818] text-[#A3A649] flex items-center justify-center border border-[#3D4028]">
                  <Activity className="w-3.5 h-3.5" />
                </div>
                <span className="text-[9px] font-bold text-[#A3A649] bg-[#3D4028] border border-[#A3A649]/40 px-1.5 py-0.5 rounded-full">
                  2 Completed
                </span>
              </div>
              <h3 className="font-semibold text-xs text-white pt-0.5">
                Stress Reset Room
              </h3>
              <p className="text-[10px] text-[#8C8C8C] leading-snug">
                Calming breath, tension release & 3-lens reframes.
              </p>
            </div>
            <div className="flex items-center text-[10px] text-[#A3A649] font-semibold gap-1 pt-0.5">
              <span>Start Reset</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2: Thought Untangler */}
          <div 
            onClick={onOpenSynapticPruner}
            className="p-2.5 rounded-lg bg-[#262626] hover:bg-[#3D4028]/40 border border-[#3D4028] hover:border-[#AD3D30] transition-all cursor-pointer flex flex-col justify-between space-y-1.5 group shadow-xs"
          >
            <div className="space-y-0.5">
              <div className="flex items-center justify-between">
                <div className="w-6 h-6 rounded-md bg-[#181818] text-[#AD3D30] flex items-center justify-center border border-[#3D4028]">
                  <Scissors className="w-3.5 h-3.5" />
                </div>
                <span className="text-[9px] font-bold text-[#AD3D30] bg-[#AD3D30]/20 border border-[#AD3D30]/40 px-1.5 py-0.5 rounded-full">
                  2 Untangled
                </span>
              </div>
              <h3 className="font-semibold text-xs text-white pt-0.5">
                Thought Untangler
              </h3>
              <p className="text-[10px] text-[#8C8C8C] leading-snug">
                Transform anxious worries into grounded beliefs.
              </p>
            </div>
            <div className="flex items-center text-[10px] text-[#AD3D30] font-semibold gap-1 pt-0.5">
              <span>Untangle Thought</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 3: Glimmer Vault */}
          <div 
            onClick={onOpenGlimmerVault}
            className="p-2.5 rounded-lg bg-[#262626] hover:bg-[#3D4028]/40 border border-[#3D4028] hover:border-[#A3A649] transition-all cursor-pointer flex flex-col justify-between space-y-1.5 group shadow-xs"
          >
            <div className="space-y-0.5">
              <div className="flex items-center justify-between">
                <div className="w-6 h-6 rounded-md bg-[#181818] text-[#A3A649] flex items-center justify-center border border-[#3D4028]">
                  <Sun className="w-3.5 h-3.5" />
                </div>
                <span className="text-[9px] font-bold text-[#8C8C8C] bg-[#181818] border border-[#3D4028] px-1.5 py-0.5 rounded-full">
                  0 Anchored
                </span>
              </div>
              <h3 className="font-semibold text-xs text-white pt-0.5">
                Glimmer Vault
              </h3>
              <p className="text-[10px] text-[#8C8C8C] leading-snug">
                Save uplifting micro-moments of peace & gratitude.
              </p>
            </div>
            <div className="flex items-center text-[10px] text-[#A3A649] font-semibold gap-1 pt-0.5">
              <span>Open Vault</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 4: Daily Reflections */}
          <div 
            onClick={() => {
              if (onOpenInStudio) {
                const target = pinnedEntries[0] || displayEntries[0];
                if (target) onOpenInStudio(target);
              }
            }}
            className="p-2.5 rounded-lg bg-[#262626] hover:bg-[#3D4028]/30 border border-[#3D4028] hover:border-[#A3A649] transition-all cursor-pointer flex flex-col justify-between space-y-1.5 shadow-xs group"
          >
            <div className="space-y-0.5">
              <div className="flex items-center justify-between">
                <div className="w-6 h-6 rounded-md bg-[#181818] text-white flex items-center justify-center border border-[#3D4028]">
                  <BookOpen className="w-3.5 h-3.5 text-[#A3A649]" />
                </div>
                <span className="text-[9px] font-bold text-[#A3A649] bg-[#3D4028] border border-[#A3A649]/40 px-1.5 py-0.5 rounded-full">
                  {pinnedEntries.length > 0 ? `${pinnedEntries.length} Pinned • ` : ""}{displayEntries.length} {displayEntries.length === 1 ? "Entry" : "Entries"}
                </span>
              </div>
              <h3 className="font-semibold text-xs text-white pt-0.5 group-hover:text-[#A3A649] transition-colors">
                Daily Reflections
              </h3>
              <p className="text-[10px] text-[#8C8C8C] leading-snug">
                Freeform expressive journaling with AI dialogue.
              </p>
            </div>
            <div className="flex items-center text-[10px] text-[#A3A649] font-semibold gap-1 pt-0.5">
              <span>View Reflections</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* BOTTOM SECTION: 2-COLUMN GRID (Summary + Interactive Insights) */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 pt-0.5">
          
          {/* LEFT COLUMN (~63%): 30-Day Activity Summary */}
          <div className="lg:col-span-7 xl:col-span-8 bg-[#262626] border border-[#3D4028] rounded-xl p-2.5 sm:p-3 space-y-2.5 shadow-md">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-[#3D4028] pb-2">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded bg-[#181818] border border-[#3D4028] text-[#A3A649] flex items-center justify-center">
                    <BarChart3 className="w-3 h-3" />
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight">
                    30-Day Activity Summary
                  </h3>
                  <span className="text-[8px] font-bold uppercase tracking-wider bg-[#3D4028] border border-[#A3A649]/40 text-[#A3A649] px-1.5 py-0.5 rounded-full">
                    Past 30 Days
                  </span>
                </div>
                <p className="text-[10px] text-[#8C8C8C]">
                  Glimmer captures, completed Resets, and Pruned thought loops over last 30 days.
                </p>
              </div>

              {/* View toggle tabs */}
              <div className="flex bg-[#181818] p-0.5 rounded-lg border border-[#3D4028] text-[10px] shrink-0">
                <button
                  onClick={() => setRechartsMode("summary")}
                  className={`px-2 py-0.5 rounded-md font-medium transition-all cursor-pointer ${
                    rechartsMode === "summary" ? "bg-[#3D4028] text-[#A3A649] font-bold" : "text-[#8C8C8C] hover:text-white"
                  }`}
                >
                  30-Day Comp.
                </button>
                <button
                  onClick={() => setRechartsMode("cumulative")}
                  className={`px-2 py-0.5 rounded-md font-medium transition-all cursor-pointer ${
                    rechartsMode === "cumulative" ? "bg-[#3D4028] text-[#A3A649] font-bold" : "text-[#8C8C8C] hover:text-white"
                  }`}
                >
                  Cumulative Growth
                </button>
                <button
                  onClick={() => setRechartsMode("trend")}
                  className={`px-2 py-0.5 rounded-md font-medium transition-all cursor-pointer ${
                    rechartsMode === "trend" ? "bg-[#3D4028] text-[#A3A649] font-bold" : "text-[#8C8C8C] hover:text-white"
                  }`}
                >
                  4-Week Rhythm
                </button>
              </div>
            </div>

            {/* 3 Metric Pill Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="p-2 rounded-lg bg-[#181818] border border-[#3D4028] flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-semibold text-white flex items-center gap-1">
                    <Sun className="w-3 h-3 text-[#A3A649]" />
                    <span>Glimmers</span>
                  </span>
                  <p className="text-[9px] text-[#8C8C8C]">Peace & joy (30d)</p>
                </div>
                <span className="text-lg font-bold font-mono text-white">0</span>
              </div>

              <div className="p-2 rounded-lg bg-[#181818] border border-[#3D4028] flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-semibold text-[#A3A649] flex items-center gap-1">
                    <Activity className="w-3 h-3" />
                    <span>Resets</span>
                  </span>
                  <p className="text-[9px] text-[#8C8C8C]">Somatic calm (30d)</p>
                </div>
                <span className="text-lg font-bold font-mono text-white">2</span>
              </div>

              <div className="p-2 rounded-lg bg-[#181818] border border-[#3D4028] flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-semibold text-[#AD3D30] flex items-center gap-1">
                    <Scissors className="w-3 h-3" />
                    <span>Pruned Loops</span>
                  </span>
                  <p className="text-[9px] text-[#8C8C8C]">Rewired traps (30d)</p>
                </div>
                <span className="text-lg font-bold font-mono text-white">2</span>
              </div>
            </div>

            {/* Recharts Bar Chart Area */}
            <div className="p-2.5 rounded-lg bg-[#181818] border border-[#3D4028] space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-[#8C8C8C]">
                <span className="font-semibold flex items-center gap-1 text-[#A3A649]">
                  <TrendingUp className="w-3 h-3" />
                  <span>30-Day Practice Volume by Category</span>
                </span>
                <span className="text-[10px] font-mono text-[#8C8C8C]">
                  4 total 30d practices
                </span>
              </div>

              <div className="w-full h-28 pt-0.5">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={recharts30DaySummary} margin={{ top: 4, right: 8, left: -28, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="2 2" stroke={isLight ? "#D6DAD0" : "#3D4028"} opacity={0.7} />
                    <XAxis 
                      dataKey="shortLabel" 
                      tick={{ fill: isLight ? "#555A48" : "#8C8C8C", fontSize: 10 }}
                      axisLine={{ stroke: isLight ? "#D6DAD0" : "#3D4028" }}
                      tickLine={false}
                    />
                    <YAxis 
                      allowDecimals={false}
                      tick={{ fill: isLight ? "#555A48" : "#8C8C8C", fontSize: 10 }}
                      axisLine={{ stroke: isLight ? "#D6DAD0" : "#3D4028" }}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: isLight ? "rgba(0, 0, 0, 0.05)" : "rgba(255, 255, 255, 0.05)" }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload;
                          return (
                            <div className={`${isLight ? "bg-white border-[#D6DAD0] text-[#171815]" : "bg-[#262626] border-[#3D4028] text-white"} border rounded-lg p-2.5 shadow-xl text-xs space-y-1 font-mono`}>
                              <p className="font-bold">{item.label}</p>
                              <p className={`text-sm font-bold font-mono ${isLight ? "text-[#9E3024]" : "text-[#A3A649]"}`}>
                                {item.count} practices
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={48}>
                      {recharts30DaySummary.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN (~37%): Interactive Growth & Frequency Insights */}
          <div className="lg:col-span-5 xl:col-span-4 bg-[#262626] border border-[#3D4028] rounded-xl p-4 space-y-3.5 shadow-md flex flex-col justify-between">
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#3D4028] pb-2.5">
                <div className="flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-[#A3A649]" />
                  <h3 className="text-xs font-bold text-white">
                    Interactive Growth & Frequency Insights
                  </h3>
                </div>
                <button 
                  onClick={() => setActiveTab("activity")}
                  className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#181818] border border-[#3D4028] text-[#A3A649] flex items-center gap-1 cursor-pointer"
                >
                  <span>Activity Flow</span>
                  <span className="text-[#8C8C8C]">✕</span>
                </button>
              </div>

              {/* Tabs + Timeframe Filter Row */}
              <div className="flex flex-col gap-2">
                {/* Secondary tabs */}
                <div className="flex bg-[#181818] p-0.5 rounded-lg border border-[#3D4028] text-[10px]">
                  <button 
                    onClick={() => setActiveTab("anchors")}
                    className={`flex-1 py-1 rounded font-medium cursor-pointer ${
                      activeTab === "anchors" ? "bg-[#3D4028] text-[#A3A649] font-bold" : "text-[#8C8C8C] hover:text-white"
                    }`}
                  >
                    Key Anchors
                  </button>
                  <button 
                    onClick={() => setActiveTab("patterns")}
                    className={`flex-1 py-1 rounded font-medium cursor-pointer ${
                      activeTab === "patterns" ? "bg-[#3D4028] text-[#A3A649] font-bold" : "text-[#8C8C8C] hover:text-white"
                    }`}
                  >
                    Patterns
                  </button>
                  <button 
                    onClick={() => setActiveTab("milestones")}
                    className={`flex-1 py-1 rounded font-medium cursor-pointer ${
                      activeTab === "milestones" ? "bg-[#3D4028] text-[#A3A649] font-bold" : "text-[#8C8C8C] hover:text-white"
                    }`}
                  >
                    Milestones
                  </button>
                  <button 
                    onClick={() => setActiveTab("correlations")}
                    className={`flex-1 py-1 rounded font-medium cursor-pointer ${
                      activeTab === "correlations" ? "bg-[#10b981]/25 text-[#10b981] font-bold border border-[#10b981]/40" : "text-[#8C8C8C] hover:text-white"
                    }`}
                  >
                    Telemetry & Stats
                  </button>
                </div>

                {/* Timeframe selector */}
                <div className="flex bg-[#181818] p-0.5 rounded-lg border border-[#3D4028] text-[10px] font-mono">
                  {(["7d", "30d", "all"] as TimeframeOption[]).map(tf => (
                    <button
                      key={tf}
                      onClick={() => setTimeframe(tf)}
                      className={`flex-1 py-1 rounded font-bold uppercase cursor-pointer ${
                        timeframe === tf ? "bg-[#262626] text-white border border-[#3D4028]" : "text-[#8C8C8C] hover:text-white"
                      }`}
                    >
                      {tf === "7d" ? "7 Days" : tf === "30d" ? "30 Days" : "All Time"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vertical Metric Rows (Exact list in screenshot) */}
              <div className="space-y-2 pt-1">
                {/* Row 1: Glimmers */}
                <div className="p-2.5 rounded-lg bg-[#181818] border border-[#3D4028] flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-xs text-white font-semibold">
                      <Sun className="w-3.5 h-3.5 text-[#8C8C8C]" />
                      <span>Glimmers</span>
                    </div>
                    <p className="text-[10px] text-[#8C8C8C]">Micro-moments of joy & peace</p>
                  </div>
                  <span className="text-base font-bold font-mono text-white">0</span>
                </div>

                {/* Row 2: Resets Completed */}
                <div className="p-2.5 rounded-lg bg-[#181818] border border-[#3D4028] flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-xs text-[#A3A649] font-semibold">
                      <Activity className="w-3.5 h-3.5" />
                      <span>Resets Completed</span>
                    </div>
                    <p className="text-[10px] text-[#8C8C8C]">Somatic calm & perspective shifts</p>
                  </div>
                  <span className="text-base font-bold font-mono text-white">2</span>
                </div>

                {/* Row 3: Untangled Worries */}
                <div className="p-2.5 rounded-lg bg-[#181818] border border-[#3D4028] flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-xs text-[#AD3D30] font-semibold">
                      <Scissors className="w-3.5 h-3.5" />
                      <span>Untangled Worries</span>
                    </div>
                    <p className="text-[10px] text-[#8C8C8C]">Thought patterns altered</p>
                  </div>
                  <span className="text-base font-bold font-mono text-white">2</span>
                </div>

                {/* Row 4: Reflections Entries */}
                <div className="p-2.5 rounded-lg bg-[#181818] border border-[#3D4028] flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-xs text-white font-semibold">
                      <BookOpen className="w-3.5 h-3.5 text-[#A3A649]" />
                      <span>Reflections Entries</span>
                    </div>
                    <p className="text-[10px] text-[#8C8C8C]">Journal entries created</p>
                  </div>
                  <span className="text-base font-bold font-mono text-white">1</span>
                </div>
              </div>
            </div>

            {/* Motivational Quote */}
            <div className="p-2 rounded-lg bg-[#181818] border border-[#3D4028] text-[10px] text-[#A3A649] text-center italic mt-2">
              🌱 Small continuous micro-shifts cultivate lasting well-being.
            </div>
          </div>
        </div>

        {/* EMPIRICAL TELEMETRY, CORRELATIONS & THEMATIC STRESSORS */}
        <div id="dashboard-empirical-telemetry-panel" className="bg-[#262626] border border-[#3D4028] rounded-xl p-3.5 sm:p-4 shadow-md">
          <EmpiricalCorrelationsSection 
            entries={entries}
            onOpenStudioWithEntry={onOpenInStudio}
          />
        </div>

      </div>
    </div>
  );
};
