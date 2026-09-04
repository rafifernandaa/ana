import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { 
  Archive, 
  Search, 
  FileText, 
  Trash2, 
  Calendar, 
  Tag, 
  Sparkles, 
  Heart, 
  Edit3, 
  Compass, 
  Wind, 
  Zap, 
  Target, 
  Shield, 
  BrainCircuit,
  Smile,
  Plus,
  BarChart3,
  Activity,
  Eye,
  Download,
  Printer,
  RefreshCw,
  CheckCircle2,
  TrendingUp
} from "lucide-react";
import { JournalEntry, ResetSession, PrunedThoughtLoop, GlimmerAnchor, GeminiLongitudinalSynthesisResponse } from "../types";
import { ArchiveStatisticsView } from "./ArchiveStatisticsView";
import { generateLongitudinalSynthesisWithGemini } from "../lib/geminiService";

interface ArchiveWorkspaceProps {
  entries: JournalEntry[];
  sessions: ResetSession[];
  prunedLoops: PrunedThoughtLoop[];
  glimmers: GlimmerAnchor[];
  activeEntryId: string | null;
  onSelectEntry: (entry: JournalEntry) => void;
  onDeleteEntry: (id: string) => Promise<void>;
  onOpenInStudio: (entry: JournalEntry) => void;
  onNewEntry: () => void;
}

export const ArchiveWorkspace: React.FC<ArchiveWorkspaceProps> = ({
  entries,
  sessions,
  prunedLoops,
  glimmers,
  activeEntryId,
  onSelectEntry,
  onDeleteEntry,
  onOpenInStudio,
  onNewEntry,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMoodFilter, setSelectedMoodFilter] = useState<string>("all");
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(
    activeEntryId || (entries[0] ? entries[0].id : null)
  );
  const [archiveSidebarTab, setArchiveSidebarTab] = useState<"entries" | "statistics">("entries");
  const [mainPaneView, setMainPaneView] = useState<"reader" | "statistics" | "synthesis">("reader");
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [synthesisResult, setSynthesisResult] = useState<GeminiLongitudinalSynthesisResponse | null>(null);
  const [synthesisError, setSynthesisError] = useState<string | null>(null);

  const handleGenerateSynthesis = async () => {
    if (entries.length === 0) {
      setSynthesisError("No journal entries available to synthesize.");
      return;
    }
    setIsSynthesizing(true);
    setSynthesisError(null);
    try {
      const payload = entries.map(e => ({
        title: e.title,
        content: e.content,
        mood: e.mood,
        tags: e.tags,
        createdAt: e.createdAt,
        empiricalTelemetry: e.empiricalTelemetry,
      }));
      const res = await generateLongitudinalSynthesisWithGemini({ entries: payload });
      setSynthesisResult(res);
    } catch (err: any) {
      console.error("Longitudinal synthesis failed:", err);
      setSynthesisError(err.message || "Failed to generate longitudinal neuroplastic synthesis.");
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleExportSynthesisMarkdown = () => {
    if (!synthesisResult) return;
    const md = `# Longitudinal Neuroplastic Synthesis & Resilience Report
*Generated: ${new Date().toLocaleDateString()}*
*Neural Adaptability Score: ${synthesisResult.longitudinalVitalityScore} / 100*

---

## Resilience Trajectory
${synthesisResult.resilienceTrajectory}

## Dominant Themes
${synthesisResult.dominantThemes.map(t => `- ${t}`).join("\n")}

## Unwound Cognitive Traps
${synthesisResult.unwoundCognitiveTraps.map(u => `- ${u}`).join("\n")}

## Somatic & Chronobiology Correlations
${synthesisResult.somaticCorrelations}

## 7-Day Neuroplastic Micro-Action Plan
${synthesisResult.neuroplasticActionPlan.map((a, i) => `${i + 1}. ${a}`).join("\n")}
`;

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ana-neuroplastic-synthesis-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportReaderMarkdown = (entry: JournalEntry) => {
    const md = `# ${entry.title || "Untitled Entry"}
*Date: ${new Date(entry.createdAt).toLocaleDateString()}*
*Mood: ${entry.mood}*
*Tags: ${entry.tags.map(t => `#${t}`).join(" ")}*

---

## Reflection Notes
${entry.content || "(No content)"}

${entry.aiSummary ? `---

## AI Reflection Synthesis
${entry.aiSummary.summary}

### Key Takeaways
${entry.aiSummary.keyTakeaways.map(k => `- ${k}`).join("\n")}

### Deep Inquiries
${entry.aiSummary.reflectionQuestions.map(q => `- ${q}`).join("\n")}
` : ""}`;

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(entry.title || "entry").toLowerCase().replace(/[^a-z0-9]/g, "-")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Sync selection if activeEntryId changes from outside or entries change
  useEffect(() => {
    if (activeEntryId && entries.some((e) => e.id === activeEntryId)) {
      setSelectedEntryId(activeEntryId);
    } else if (entries.length > 0 && (!selectedEntryId || !entries.some((e) => e.id === selectedEntryId))) {
      setSelectedEntryId(entries[0].id);
    }
  }, [activeEntryId, entries]);

  const filteredEntries = entries.filter((e) => {
    const matchesSearch = 
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesMood = selectedMoodFilter === "all" || e.mood === selectedMoodFilter;
    return matchesSearch && matchesMood;
  });

  const selectedEntry = 
    entries.find((e) => e.id === selectedEntryId) || 
    entries.find((e) => e.id === activeEntryId) || 
    filteredEntries[0] || 
    entries[0] || 
    null;

  return (
    <div 
      id="archive-workspace-container"
      className="flex-1 flex h-full min-h-0 bg-[#121212] overflow-hidden font-mono select-none"
    >
      {/* Left List Pane (320px) */}
      <aside className="w-80 bg-[#181818] border-r border-[#3D4028] flex flex-col h-full shrink-0">
        {/* Header & Search */}
        <div className="p-3 border-b border-[#3D4028] space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white tracking-wider">
              <Archive className="w-3.5 h-3.5 text-[#A3A649]" />
              <span>ENTRY ARCHIVE</span>
            </div>
            <button
              onClick={onNewEntry}
              className="px-2 py-0.5 rounded-xs bg-[#AD3D30] hover:bg-[#AD3D30]/80 text-white text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>New</span>
            </button>
          </div>

          {/* Segmented Sidebar Tab Switcher: Entries vs Statistics */}
          <div className="flex items-center gap-1 bg-[#262626] p-0.5 rounded-xs border border-[#3D4028] text-xs">
            <button
              id="archive-tab-entries"
              type="button"
              onClick={() => {
                setArchiveSidebarTab("entries");
              }}
              className={`flex-1 py-1 px-2 rounded-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                archiveSidebarTab === "entries"
                  ? "bg-[#3D4028] text-[#A3A649] font-bold border border-[#A3A649]"
                  : "text-[#8C8C8C] hover:text-white"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Entries ({entries.length})</span>
            </button>
            <button
              id="archive-tab-statistics"
              type="button"
              onClick={() => {
                setArchiveSidebarTab("statistics");
                setMainPaneView("statistics");
              }}
              className={`flex-1 py-1 px-2 rounded-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                archiveSidebarTab === "statistics"
                  ? "bg-[#3D4028] text-[#A3A649] font-bold border border-[#A3A649]"
                  : "text-[#8C8C8C] hover:text-white"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Statistics</span>
            </button>
          </div>

          {archiveSidebarTab === "entries" && (
            <>
              <div className="flex items-center gap-1.5 bg-[#262626] border border-[#3D4028] rounded-xs px-2 py-1 focus-within:border-[#A3A649]">
                <Search className="w-3 h-3 text-[#8C8C8C]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search entries, tags..."
                  className="w-full bg-transparent text-xs text-white placeholder-[#8C8C8C]/50 focus:outline-hidden"
                />
              </div>

              {/* Mood Filter Pills */}
              <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-[10px] scrollbar-none">
                <button
                  onClick={() => setSelectedMoodFilter("all")}
                  className={`px-2 py-0.5 rounded-xs border cursor-pointer ${
                    selectedMoodFilter === "all"
                      ? "bg-[#3D4028] text-[#A3A649] border-[#A3A649] font-bold"
                      : "bg-[#262626] text-[#8C8C8C] border-[#3D4028] hover:text-white"
                  }`}
                >
                  All
                </button>
                {["reflective", "grateful", "peaceful", "energized", "focused"].map((m) => (
                  <button
                    key={m}
                    onClick={() => setSelectedMoodFilter(m)}
                    className={`px-1.5 py-0.5 rounded-xs border cursor-pointer capitalize ${
                      selectedMoodFilter === m
                        ? "bg-[#3D4028] text-[#A3A649] border-[#A3A649] font-bold"
                        : "bg-[#262626] text-[#8C8C8C] border-[#3D4028] hover:text-white"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Sidebar Body: Entries List or Compact Statistics */}
        {archiveSidebarTab === "statistics" ? (
          <div className="flex-1 overflow-y-auto">
            <ArchiveStatisticsView
              entries={entries}
              onSelectEntry={(entry) => {
                setSelectedEntryId(entry.id);
                onSelectEntry(entry);
                setMainPaneView("reader");
              }}
              onOpenInStudio={onOpenInStudio}
              isCompact={true}
            />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {filteredEntries.length === 0 ? (
              <div className="text-center p-6 text-[#8C8C8C] text-xs space-y-1">
                <FileText className="w-6 h-6 mx-auto text-[#3D4028]" />
                <p>No entries found matching query</p>
              </div>
            ) : (
              filteredEntries.map((e) => {
                const isSelected = e.id === selectedEntry?.id;
                const dateStr = new Date(e.createdAt).toLocaleDateString();
                const words = e.content.trim() ? e.content.trim().split(/\s+/).length : 0;
                return (
                  <div
                    key={e.id}
                    onClick={() => {
                      setSelectedEntryId(e.id);
                      onSelectEntry(e);
                      setMainPaneView("reader");
                    }}
                    className={`p-2.5 rounded-xs border transition-all cursor-pointer space-y-1 group ${
                      isSelected
                        ? "bg-[#262626] border-[#A3A649] ring-1 ring-[#A3A649]"
                        : "bg-[#1c1c1c] border-[#3D4028] hover:border-[#8C8C8C]"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-[#8C8C8C]">{dateStr}</span>
                      <span className="text-[#A3A649] capitalize">{e.mood}</span>
                    </div>

                    <h4 className="text-xs font-bold text-white truncate">
                      {e.title || "Untitled Entry"}
                    </h4>

                    <p className="text-[11px] text-[#8C8C8C] line-clamp-2">
                      {e.content || "Empty content buffer..."}
                    </p>

                    <div className="flex items-center justify-between pt-1 text-[9px] text-[#8C8C8C]">
                      <span>{words} words</span>
                      {e.tags.length > 0 && (
                        <span className="truncate max-w-[120px]">
                          #{e.tags.join(" #")}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </aside>

      {/* Right Reading & Preview Pane */}
      <main className="flex-1 flex flex-col h-full min-w-0 bg-[#141414] overflow-hidden">
        {/* Top action bar */}
        <div className="h-10 bg-[#1c1c1c] border-b border-[#3D4028] px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {/* View Mode Toggle: Reader vs Statistics */}
            <div className="flex items-center bg-[#262626] border border-[#3D4028] rounded-xs p-0.5 text-[11px]">
              <button
                type="button"
                onClick={() => setMainPaneView("reader")}
                className={`px-2.5 py-0.5 rounded-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  mainPaneView === "reader"
                    ? "bg-[#3D4028] text-[#A3A649] font-bold border border-[#A3A649]"
                    : "text-[#8C8C8C] hover:text-white"
                }`}
              >
                <FileText className="w-3 h-3" />
                <span>Reader</span>
              </button>
              <button
                type="button"
                onClick={() => setMainPaneView("statistics")}
                className={`px-2.5 py-0.5 rounded-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  mainPaneView === "statistics"
                    ? "bg-[#3D4028] text-[#A3A649] font-bold border border-[#A3A649]"
                    : "text-[#8C8C8C] hover:text-white"
                }`}
              >
                <BarChart3 className="w-3 h-3" />
                <span>Statistics</span>
              </button>
              <button
                type="button"
                id="archive-tab-synthesis"
                onClick={() => setMainPaneView("synthesis")}
                className={`px-2.5 py-0.5 rounded-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  mainPaneView === "synthesis"
                    ? "bg-[#3D4028] text-[#A3A649] font-bold border border-[#A3A649]"
                    : "text-[#8C8C8C] hover:text-white"
                }`}
              >
                <Sparkles className="w-3 h-3 text-[#A3A649]" />
                <span>AI Synthesis</span>
              </button>
            </div>

            {mainPaneView === "reader" && selectedEntry && (
              <div className="flex items-center gap-2">
                <span className="text-[#AD3D30] font-bold text-xs">ana://</span>
                <span className="text-xs font-bold text-white truncate max-w-sm">
                  {selectedEntry.title || "Untitled Entry"}
                </span>
                <span className="text-[10px] text-[#8C8C8C]">
                  [{new Date(selectedEntry.createdAt).toLocaleString()}]
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {mainPaneView === "reader" && selectedEntry && (
              <>
                <button
                  type="button"
                  id="reader-export-btn"
                  onClick={() => handleExportReaderMarkdown(selectedEntry)}
                  className="px-2.5 py-1 bg-[#262626] hover:bg-[#3D4028] text-[#8C8C8C] hover:text-white rounded-xs text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 border border-[#3D4028]"
                  title="Export this entry as Markdown"
                >
                  <Download className="w-3 h-3" />
                  <span>Export</span>
                </button>

                <button
                  type="button"
                  id="reader-print-btn"
                  onClick={() => window.print()}
                  className="px-2.5 py-1 bg-[#262626] hover:bg-[#3D4028] text-[#8C8C8C] hover:text-white rounded-xs text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 border border-[#3D4028]"
                  title="Print or Save PDF"
                >
                  <Printer className="w-3 h-3" />
                  <span>Print</span>
                </button>
              </>
            )}

            {mainPaneView === "synthesis" && synthesisResult && (
              <>
                <button
                  type="button"
                  id="synthesis-export-btn"
                  onClick={handleExportSynthesisMarkdown}
                  className="px-2.5 py-1 bg-[#262626] hover:bg-[#3D4028] text-[#A3A649] rounded-xs text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 border border-[#3D4028]"
                  title="Export Longitudinal Synthesis as Markdown"
                >
                  <Download className="w-3 h-3" />
                  <span>Export Dossier</span>
                </button>

                <button
                  type="button"
                  id="synthesis-print-btn"
                  onClick={() => window.print()}
                  className="px-2.5 py-1 bg-[#262626] hover:bg-[#3D4028] text-[#8C8C8C] hover:text-white rounded-xs text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 border border-[#3D4028]"
                  title="Print Dossier"
                >
                  <Printer className="w-3 h-3" />
                  <span>Print</span>
                </button>
              </>
            )}

            {selectedEntry && (
              <button
                onClick={() => onOpenInStudio(selectedEntry)}
                className="px-3 py-1 bg-[#AD3D30] hover:bg-[#AD3D30]/80 text-white rounded-xs text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Edit3 className="w-3 h-3" />
                <span>Open in Studio</span>
              </button>
            )}

            {mainPaneView === "reader" && selectedEntry && (
              <button
                onClick={async () => {
                  if (selectedEntry) {
                    const nextEntry = entries.find((e) => e.id !== selectedEntry.id);
                    setSelectedEntryId(nextEntry ? nextEntry.id : null);
                    await onDeleteEntry(selectedEntry.id);
                  }
                }}
                className="p-1 text-[#8C8C8C] hover:text-[#AD3D30] rounded-xs transition-colors cursor-pointer"
                title="Delete Entry"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Content: Full Interactive Statistics OR Synthesis OR Document Reader */}
        {mainPaneView === "synthesis" ? (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-4xl mx-auto w-full space-y-5">
            {/* Hero Card */}
            <div className="bg-[#262626] border border-[#3D4028] p-4 sm:p-5 rounded-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-white text-xs sm:text-sm font-bold">
                    <Sparkles className="w-4 h-4 text-[#A3A649]" />
                    <span>AI LONGITUDINAL NEUROPLASTIC SYNTHESIS</span>
                  </div>
                  <p className="text-xs text-[#8C8C8C] leading-relaxed">
                    Computational trajectory analysis across {entries.length} reflections, tracking emotional flexibility, unwound cognitive distortions, and somatic correlations.
                  </p>
                </div>
                <button
                  id="run-synthesis-btn"
                  onClick={handleGenerateSynthesis}
                  disabled={isSynthesizing || entries.length === 0}
                  className="px-4 py-2 rounded-xs bg-[#AD3D30] hover:bg-[#AD3D30]/80 disabled:opacity-50 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 self-start sm:self-auto"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSynthesizing ? "animate-spin" : ""}`} />
                  <span>{isSynthesizing ? "Synthesizing Arc..." : synthesisResult ? "Re-synthesize Arc" : "Generate Synthesis"}</span>
                </button>
              </div>

              {synthesisError && (
                <div className="p-2.5 rounded-xs bg-[#AD3D30]/20 border border-[#AD3D30] text-xs text-[#AD3D30]">
                  {synthesisError}
                </div>
              )}
            </div>

            {/* Results */}
            {synthesisResult ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-3 duration-200">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-4 bg-[#1c1c1c] border border-[#A3A649] p-4 rounded-xs flex flex-col justify-between items-center text-center space-y-1">
                    <span className="text-[10px] font-bold text-[#A3A649] tracking-wider uppercase">
                      Neural Adaptability Index
                    </span>
                    <div className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                      {synthesisResult.longitudinalVitalityScore}<span className="text-base text-[#8C8C8C]">/100</span>
                    </div>
                    <p className="text-[10px] text-[#8C8C8C]">
                      Cognitive reframing &amp; recovery index
                    </p>
                  </div>

                  <div className="md:col-span-8 bg-[#1c1c1c] border border-[#3D4028] p-4 rounded-xs space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#A3A649]">
                      <TrendingUp className="w-3.5 h-3.5 text-[#A3A649]" />
                      <span>Resilience Trajectory</span>
                    </div>
                    <p className="text-xs text-[#e2e8f0] leading-relaxed">
                      {synthesisResult.resilienceTrajectory}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#1c1c1c] border border-[#3D4028] p-4 rounded-xs space-y-2">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-[#A3A649]" />
                      <span>Dominant Psychological Themes</span>
                    </span>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {synthesisResult.dominantThemes.map((theme, i) => (
                        <span key={i} className="px-2 py-0.5 bg-[#262626] border border-[#3D4028] text-xs text-[#A3A649] rounded-xs font-semibold">
                          #{theme}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-[#1c1c1c] border border-[#3D4028] p-4 rounded-xs space-y-2">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-[#10b981]" />
                      <span>Unwound Distortion Patterns</span>
                    </span>
                    <ul className="space-y-1 pt-1 text-xs text-[#8C8C8C]">
                      {synthesisResult.unwoundCognitiveTraps.map((trap, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#10b981] shrink-0 mt-0.5" />
                          <span className="text-[#e2e8f0]">{trap}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="bg-[#1c1c1c] border border-[#3D4028] p-4 rounded-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#A3A649]">
                    <Activity className="w-3.5 h-3.5 text-[#A3A649]" />
                    <span>Somatic Tension &amp; Chronobiology Insights</span>
                  </div>
                  <p className="text-xs text-[#e2e8f0] leading-relaxed">
                    {synthesisResult.somaticCorrelations}
                  </p>
                </div>

                <div className="bg-[#1c1c1c] border border-[#A3A649] p-4 rounded-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                      <BrainCircuit className="w-4 h-4 text-[#A3A649]" />
                      <span>7-DAY NEUROPLASTIC MICRO-ACTION PLAN</span>
                    </div>
                    <span className="text-[10px] bg-[#3D4028] text-[#A3A649] px-2 py-0.5 rounded-xs font-bold">
                      COACHING BLUEPRINT
                    </span>
                  </div>
                  <div className="space-y-1.5 pt-1">
                    {synthesisResult.neuroplasticActionPlan.map((action, idx) => (
                      <div key={idx} className="p-2.5 bg-[#262626] border border-[#3D4028] rounded-xs flex items-start gap-2.5">
                        <span className="w-4 h-4 rounded-full bg-[#3D4028] text-[#A3A649] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <p className="text-xs text-[#e2e8f0] leading-relaxed">
                          {action}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-[#1c1c1c] border border-[#3D4028] rounded-xs space-y-3">
                <BrainCircuit className="w-8 h-8 text-[#3D4028] mx-auto" />
                <div className="space-y-1 max-w-sm mx-auto">
                  <h3 className="text-xs font-bold text-white">Ready for Longitudinal Synthesis</h3>
                  <p className="text-[11px] text-[#8C8C8C] leading-relaxed">
                    Click "Generate Synthesis" above to analyze your {entries.length} reflections and produce an overarching clinical &amp; coaching dossier.
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : mainPaneView === "statistics" ? (
          <ArchiveStatisticsView
            entries={entries}
            onSelectEntry={(entry) => {
              setSelectedEntryId(entry.id);
              onSelectEntry(entry);
              setMainPaneView("reader");
            }}
            onOpenInStudio={onOpenInStudio}
            isCompact={false}
          />
        ) : selectedEntry ? (
          <div className="flex flex-col h-full min-h-0">
            {/* Document Content View */}
            <div className="flex-1 overflow-y-auto p-6 max-w-3xl mx-auto w-full space-y-6">
              {/* Entry Meta Header */}
              <div className="border-b border-[#3D4028] pb-4 space-y-2">
                <h1 className="text-xl font-bold text-white tracking-tight">
                  {selectedEntry.title || "Untitled Reflection Note"}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-xs text-[#8C8C8C]">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[#A3A649]" />
                    <span>{new Date(selectedEntry.createdAt).toLocaleDateString()}</span>
                  </span>
                  <span>•</span>
                  <span className="text-[#A3A649] capitalize">Mood: {selectedEntry.mood}</span>
                  {selectedEntry.tags.length > 0 && (
                    <>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Tag className="w-3 h-3 text-[#AD3D30]" />
                        <span>{selectedEntry.tags.map(t => `#${t}`).join(" ")}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* AI Summary Card if present */}
              {selectedEntry.aiSummary && (
                <div className="p-4 rounded-xs bg-[#262626] border border-[#A3A649] space-y-2">
                  <div className="flex items-center gap-1.5 text-xs text-[#A3A649] font-bold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>SYNTHESIZED INSIGHTS</span>
                  </div>
                  <p className="text-xs text-[#e2e8f0] leading-relaxed">
                    {selectedEntry.aiSummary.summary}
                  </p>
                </div>
              )}

              {/* Main Markdown Body */}
              <div className="text-xs sm:text-sm text-[#e2e8f0] leading-relaxed markdown-content space-y-3 font-mono">
                {selectedEntry.content ? (
                  <ReactMarkdown>{selectedEntry.content}</ReactMarkdown>
                ) : (
                  <p className="italic text-[#8C8C8C]">This journal buffer is empty.</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-[#8C8C8C] space-y-3">
            <Archive className="w-8 h-8 text-[#3D4028]" />
            <p className="text-xs font-bold text-white">No Entry Selected</p>
            <p className="text-[11px]">Select an entry from the list or explore longitudinal statistics.</p>
            <button
              type="button"
              onClick={() => setMainPaneView("statistics")}
              className="px-3 py-1.5 rounded-xs bg-[#3D4028] hover:bg-[#3D4028]/80 text-[#A3A649] border border-[#A3A649] text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Explore Statistics Dashboard</span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
};
