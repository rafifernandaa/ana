import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import confetti from "canvas-confetti";
import { 
  Save, 
  Minus, 
  Maximize2, 
  Send, 
  Sparkles, 
  Bot, 
  User as UserIcon, 
  RefreshCw, 
  Tag, 
  Smile, 
  Compass, 
  Heart, 
  Wind, 
  Zap, 
  Target, 
  Shield, 
  BrainCircuit, 
  AlertCircle,
  CheckCircle2,
  Trash2,
  Copy,
  ChevronDown,
  Pin,
  PinOff,
  BarChart3,
  Camera,
  Lightbulb
} from "lucide-react";
import { HandwrittenCaptureModal } from "./HandwrittenCaptureModal";
import { 
  JournalEntry, 
  ChatMessage, 
  JournalMood, 
  AISummary,
  EmpiricalTelemetry,
  GeminiNarrativeDecenterResponse
} from "../types";
import { 
  sendChatMessageToGemini, 
  generateEntrySummaryWithGemini,
  extractEmpiricalTelemetryFromGemini,
  decenterNarrativeStreamWithGemini
} from "../lib/geminiService";
import { analyzeNarrativeFlow, BRAIN_DUMP_STARTERS, NarrativeFlowMetrics } from "../lib/narrativeFlowAnalyzer";
import { EmpiricalTelemetryCard } from "./EmpiricalTelemetryCard";
import { useTheme } from "../lib/theme";

interface StudioWorkspaceProps {
  entry: JournalEntry;
  onSave: (entry: JournalEntry) => Promise<void>;
  onDelete?: (entryId: string) => Promise<void>;
  onNewEntry?: () => void;
  isSaving: boolean;
  saveError: string | null;
  onClearSaveError: () => void;
  layoutMode: "split" | "journal_focus" | "ai_focus";
  onSetLayoutMode: (mode: "split" | "journal_focus" | "ai_focus") => void;
}

const MOODS: { id: JournalMood; label: string; icon: React.ComponentType<{ className?: string }>; color: string }[] = [
  { id: "reflective", label: "Reflective", icon: Compass, color: "bg-[#3D4028] text-[#A3A649] border-[#A3A649]" },
  { id: "grateful", label: "Grateful", icon: Heart, color: "bg-[#3D4028] text-[#A3A649] border-[#A3A649]" },
  { id: "peaceful", label: "Peaceful", icon: Wind, color: "bg-[#3D4028] text-[#A3A649] border-[#A3A649]" },
  { id: "energized", label: "Energized", icon: Zap, color: "bg-[#3D4028] text-[#AD3D30] border-[#AD3D30]" },
  { id: "focused", label: "Focused", icon: Target, color: "bg-[#3D4028] text-[#A3A649] border-[#A3A649]" },
  { id: "creative", label: "Creative", icon: Sparkles, color: "bg-[#3D4028] text-[#A3A649] border-[#A3A649]" },
  { id: "challenged", label: "Challenged", icon: Shield, color: "bg-[#3D4028] text-[#AD3D30] border-[#AD3D30]" },
  { id: "thoughtful", label: "Thoughtful", icon: BrainCircuit, color: "bg-[#3D4028] text-[#A3A649] border-[#A3A649]" },
];

const CHAT_PROMPTS = [
  "Untangle cognitive distortions or catastrophic assumptions in my entry.",
  "Mine this entry for hidden glimmers, gratitude, and subtle strengths.",
  "Provide a 3-lens reframe (Compassion, Horizon, Agency) on this situation.",
  "Brainstorm 2 small, realistic grounding actions I can take right now.",
];

export const StudioWorkspace: React.FC<StudioWorkspaceProps> = ({
  entry,
  onSave,
  onDelete,
  onNewEntry,
  isSaving,
  saveError,
  onClearSaveError,
  layoutMode,
  onSetLayoutMode,
}) => {
  const { isLight } = useTheme();

  // Local Entry State
  const [currentEntry, setCurrentEntry] = useState<JournalEntry>(entry);
  const [tagInput, setTagInput] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isExtractingTelemetry, setIsExtractingTelemetry] = useState(false);
  const [chatMode, setChatMode] = useState<"reflect" | "brainstorm" | "mentor">("reflect");
  const [aiError, setAiError] = useState<string | null>(null);
  const [isHandwrittenModalOpen, setIsHandwrittenModalOpen] = useState<boolean>(false);

  // Collapsible Panels State (Each of them can be minimized as requested)
  const [isJournalCollapsed, setIsJournalCollapsed] = useState<boolean>(layoutMode === "ai_focus");
  const [isAiCollapsed, setIsAiCollapsed] = useState<boolean>(layoutMode === "journal_focus");

  // Narrative Flow State (Implicit Pennebaker / Cognitive Unwinding Engine)
  const [isFlowGuideOpen, setIsFlowGuideOpen] = useState<boolean>(true);
  const [flowMetrics, setFlowMetrics] = useState<NarrativeFlowMetrics>(() => analyzeNarrativeFlow(entry.content));
  const [showAmbientPrompt, setShowAmbientPrompt] = useState<boolean>(false);
  const [isDecentering, setIsDecentering] = useState<boolean>(false);
  const [decenteredResult, setDecenteredResult] = useState<GeminiNarrativeDecenterResponse | null>(null);
  const typingTimerRef = useRef<any>(null);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
    };
  }, []);

  const handleInsertHandwrittenText = (transcribedText: string, attachedImages: string[]) => {
    const existingContent = currentEntry.content.trim();
    const updatedContent = existingContent 
      ? `${existingContent}\n\n${transcribedText}`
      : transcribedText;
    
    const existingImages = currentEntry.attachedHandwrittenImages || [];
    const updated = {
      ...currentEntry,
      content: updatedContent,
      attachedHandwrittenImages: [...existingImages, ...attachedImages],
      updatedAt: Date.now(),
    };
    setCurrentEntry(updated);
    onSave(updated);
  };

  // Synchronize when entry changes from parent
  useEffect(() => {
    setCurrentEntry(entry);
    setFlowMetrics(analyzeNarrativeFlow(entry.content));
    setShowAmbientPrompt(false);
    setDecenteredResult(null);
  }, [entry.id]);

  // Sync with layout mode from parent
  useEffect(() => {
    if (layoutMode === "journal_focus") {
      setIsJournalCollapsed(false);
      setIsAiCollapsed(true);
    } else if (layoutMode === "ai_focus") {
      setIsJournalCollapsed(true);
      setIsAiCollapsed(false);
    } else {
      setIsJournalCollapsed(false);
      setIsAiCollapsed(false);
    }
  }, [layoutMode]);

  // Scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentEntry.messages, isAiResponding]);

  // Word count & stats
  const wordCount = currentEntry.content.trim() ? currentEntry.content.trim().split(/\s+/).length : 0;
  const charCount = currentEntry.content.length;

  // Title change
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const updated = { ...currentEntry, title: e.target.value, updatedAt: Date.now() };
    setCurrentEntry(updated);
  };

  // Content change
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    const updated = { ...currentEntry, content: text, updatedAt: Date.now() };
    setCurrentEntry(updated);

    // Update real-time narrative flow metrics
    const metrics = analyzeNarrativeFlow(text);
    setFlowMetrics(metrics);

    // Ambient Ghost Prompt detection (fires when user pauses for >4s during active writing)
    setShowAmbientPrompt(false);
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }

    if (metrics.totalWords >= 20 && metrics.currentStage !== "horizon") {
      typingTimerRef.current = setTimeout(() => {
        setShowAmbientPrompt(true);
      }, 4000);
    }
  };

  const handleApplyStarter = (starterText: string) => {
    const newContent = currentEntry.content ? `${currentEntry.content}\n\n${starterText}` : starterText;
    const updated = { ...currentEntry, content: newContent, updatedAt: Date.now() };
    setCurrentEntry(updated);
    setFlowMetrics(analyzeNarrativeFlow(newContent));
  };

  const handleInsertAmbientPrompt = () => {
    if (!flowMetrics.suggestedPrompt) return;
    const newContent = currentEntry.content 
      ? `${currentEntry.content.trim()}\n\n*${flowMetrics.suggestedPrompt}*\n`
      : `*${flowMetrics.suggestedPrompt}*\n`;
    const updated = { ...currentEntry, content: newContent, updatedAt: Date.now() };
    setCurrentEntry(updated);
    setFlowMetrics(analyzeNarrativeFlow(newContent));
    setShowAmbientPrompt(false);
  };

  const handleDecenterNarrative = async () => {
    if (!currentEntry.content.trim() || isDecentering) return;
    setIsDecentering(true);
    setAiError(null);
    try {
      const res = await decenterNarrativeStreamWithGemini({
        content: currentEntry.content,
        title: currentEntry.title,
      });
      setDecenteredResult(res);
      if (isAiCollapsed) {
        setIsAiCollapsed(false);
      }
    } catch (err: any) {
      console.error("Failed to generate perspective shift:", err);
      setAiError("Could not generate perspective shift. Please try again.");
    } finally {
      setIsDecentering(false);
    }
  };

  const handleAppendDecenteredToJournal = () => {
    if (!decenteredResult) return;
    const addition = `\n\n### Horizon Perspective (Decentered Clarity)\n${decenteredResult.decenteredPerspective}\n\n**Realization:** ${decenteredResult.causalBridge}\n\n**Grounding Step:** ${decenteredResult.groundedStep}`;
    const updated = {
      ...currentEntry,
      content: `${currentEntry.content.trim()}${addition}`,
      updatedAt: Date.now(),
    };
    setCurrentEntry(updated);
    onSave(updated);
    setDecenteredResult(null);
  };

  // Mood select
  const handleMoodSelect = (mood: JournalMood) => {
    const updated = { ...currentEntry, mood, updatedAt: Date.now() };
    setCurrentEntry(updated);
    onSave(updated);
  };

  // Tag handling
  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      const cleanTag = tagInput.trim().toLowerCase().replace(/^#/, "");
      if (!currentEntry.tags.includes(cleanTag)) {
        const updated = {
          ...currentEntry,
          tags: [...currentEntry.tags, cleanTag],
          updatedAt: Date.now(),
        };
        setCurrentEntry(updated);
        onSave(updated);
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updated = {
      ...currentEntry,
      tags: currentEntry.tags.filter(t => t !== tagToRemove),
      updatedAt: Date.now(),
    };
    setCurrentEntry(updated);
    onSave(updated);
  };

  // Save manual trigger
  const handleSaveEntry = async () => {
    await onSave(currentEntry);
  };

  // Pin toggle to dashboard
  const handleTogglePin = async () => {
    const updated = {
      ...currentEntry,
      isPinned: !currentEntry.isPinned,
      updatedAt: Date.now(),
    };
    setCurrentEntry(updated);
    await onSave(updated);
  };

  // Chat message sending
  const handleSendMessage = async (customPrompt?: string) => {
    const messageToSend = customPrompt || chatInput.trim();
    if (!messageToSend || isAiResponding) return;

    const userMsgId = "user-" + Date.now();
    const newUserMsg: ChatMessage = {
      id: userMsgId,
      role: "user",
      content: messageToSend,
      timestamp: Date.now(),
    };

    const updatedMessages = [...currentEntry.messages, newUserMsg];
    const updatedEntryWithUserMsg: JournalEntry = {
      ...currentEntry,
      messages: updatedMessages,
      updatedAt: Date.now(),
    };
    setCurrentEntry(updatedEntryWithUserMsg);
    setChatInput("");
    setIsAiResponding(true);
    setAiError(null);

    try {
      const apiMessages = updatedMessages.map(m => ({
        role: (m.role === "system" ? "user" : m.role) as "user" | "model",
        content: m.content,
      }));

      const assistantReply = await sendChatMessageToGemini({
        messages: apiMessages,
        context: currentEntry.content,
        mode: chatMode,
      });

      const modelMsgId = "model-" + Date.now();
      const newModelMsg: ChatMessage = {
        id: modelMsgId,
        role: "model",
        content: assistantReply.text,
        timestamp: Date.now(),
        modelUsed: assistantReply.modelUsed,
      };

      const finalMessages = [...updatedMessages, newModelMsg];
      const fullyUpdatedEntry: JournalEntry = {
        ...currentEntry,
        messages: finalMessages,
        updatedAt: Date.now(),
      };

      setCurrentEntry(fullyUpdatedEntry);
      await onSave(fullyUpdatedEntry);
    } catch (err: any) {
      console.error("Gemini Assistant Error:", err);
      setAiError(err.message || "Failed to receive AI response.");
    } finally {
      setIsAiResponding(false);
    }
  };

  // Summarize Entry with Gemini
  const handleGenerateSummary = async () => {
    if (!currentEntry.content.trim()) return;
    setIsSummarizing(true);
    setAiError(null);

    try {
      const summaryResult = await generateEntrySummaryWithGemini({
        title: currentEntry.title,
        content: currentEntry.content,
      });

      const aiSummary: AISummary = {
        summary: summaryResult.summary,
        keyTakeaways: summaryResult.keyTakeaways || [],
        reflectionQuestions: summaryResult.reflectionQuestions || [],
        moodAnalysis: summaryResult.moodAnalysis,
        generatedAt: Date.now(),
        modelUsed: summaryResult.modelUsed,
      };

      const updated = {
        ...currentEntry,
        aiSummary,
        updatedAt: Date.now(),
      };
      setCurrentEntry(updated);
      await onSave(updated);

      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.6 },
        colors: ["#AD3D30", "#A3A649", "#3D4028"],
      });
    } catch (err: any) {
      console.error("AI Summary error:", err);
      setAiError(err.message || "Failed to generate AI summary.");
    } finally {
      setIsSummarizing(false);
    }
  };

  // Extract Empirical Telemetry & Statistics (Variations A + C + F)
  const handleExtractTelemetry = async () => {
    if (!currentEntry.content.trim()) return;
    setIsExtractingTelemetry(true);
    setAiError(null);

    try {
      const result = await extractEmpiricalTelemetryFromGemini({
        title: currentEntry.title,
        content: currentEntry.content,
        circadianPhase: currentEntry.circadianPhase,
      });

      const updated = {
        ...currentEntry,
        empiricalTelemetry: result.telemetry,
        updatedAt: Date.now(),
      };
      setCurrentEntry(updated);
      await onSave(updated);

      confetti({
        particleCount: 35,
        spread: 50,
        origin: { y: 0.6 },
        colors: ["#10b981", "#A3A649", "#3D4028"],
      });
    } catch (err: any) {
      console.error("Extract Telemetry error:", err);
      setAiError(err.message || "Failed to extract empirical telemetry.");
    } finally {
      setIsExtractingTelemetry(false);
    }
  };

  // Update telemetry manual adjustments
  const handleUpdateTelemetry = async (updatedTelemetry: EmpiricalTelemetry) => {
    const updated = {
      ...currentEntry,
      empiricalTelemetry: updatedTelemetry,
      updatedAt: Date.now(),
    };
    setCurrentEntry(updated);
    await onSave(updated);
  };

  // Collapse / Expand handlers
  const handleToggleJournal = () => {
    if (isJournalCollapsed) {
      setIsJournalCollapsed(false);
      onSetLayoutMode(isAiCollapsed ? "journal_focus" : "split");
    } else {
      setIsJournalCollapsed(true);
      if (isAiCollapsed) {
        setIsAiCollapsed(false);
      }
      onSetLayoutMode("ai_focus");
    }
  };

  const handleToggleAi = () => {
    if (isAiCollapsed) {
      setIsAiCollapsed(false);
      onSetLayoutMode(isJournalCollapsed ? "ai_focus" : "split");
    } else {
      setIsAiCollapsed(true);
      if (isJournalCollapsed) {
        setIsJournalCollapsed(false);
      }
      onSetLayoutMode("journal_focus");
    }
  };

  return (
    <div 
      id="studio-side-by-side-container"
      className="flex-1 flex flex-col md:flex-row w-full h-full min-h-0 bg-[#121212] overflow-hidden font-mono select-none"
    >
      {/* ==================================================================== */}
      {/* PANEL 1: JOURNAL ENTRY (Above on mobile, can be minimized/expanded) */}
      {/* ==================================================================== */}
      <section 
        id="panel-journal"
        className={`panel-smooth flex flex-col overflow-hidden bg-[#181818] border-b md:border-b-0 md:border-r border-[#3D4028] ${
          isJournalCollapsed 
            ? "h-11 w-full md:h-full md:w-12 shrink-0 cursor-pointer bg-[#141414] hover:bg-[#1a1a1a]" 
            : isAiCollapsed
            ? "flex-1 w-full h-full min-h-0"
            : "flex-1 w-full h-1/2 md:h-full min-h-0 min-w-0"
        }`}
        onClick={isJournalCollapsed ? handleToggleJournal : undefined}
      >
        {isJournalCollapsed ? (
          <>
            {/* Mobile Collapsed Horizontal Bar */}
            <div className="flex md:hidden flex-row items-center justify-between h-full px-3 py-1 bg-[#1a1a1a]">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <span className="text-[#AD3D30]">ana://</span>
                <span className="text-white">journal-entry.md</span>
                <span className="text-[10px] text-[#A3A649] bg-[#262626] px-1.5 py-0.5 rounded-xs">
                  [{wordCount}w]
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleJournal();
                }}
                className="px-2 py-1 rounded-xs bg-[#262626] border border-[#3D4028] hover:border-[#A3A649] text-[#A3A649] flex items-center gap-1.5 text-[10px] font-bold cursor-pointer"
                title="Expand Journal Panel"
              >
                <Maximize2 className="w-3 h-3" />
                <span>EXPAND JOURNAL</span>
              </button>
            </div>

            {/* Desktop Collapsed Vertical Tab */}
            <div className="hidden md:flex flex-col items-center justify-between h-full py-4 px-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleJournal();
                }}
                className="w-7 h-7 rounded-xs bg-[#262626] border border-[#3D4028] hover:border-[#A3A649] text-[#A3A649] flex items-center justify-center transition-colors cursor-pointer"
                title="Expand Journal Entry Panel"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>

              <div className="writing-vertical text-xs tracking-widest text-[#8C8C8C] hover:text-white font-semibold flex items-center gap-2">
                <span className="text-[#AD3D30]">ana://</span>
                <span>journal-entry.md</span>
                <span className="text-[10px] text-[#A3A649] bg-[#262626] px-1 py-0.5 rounded-xs">
                  [{wordCount}w]
                </span>
              </div>

              <div className="w-2 h-2 rounded-full bg-[#A3A649]" />
            </div>
          </>
        ) : (
          /* EXPANDED JOURNAL PANEL */
          <div className="flex flex-col h-full min-h-0">
            {/* Panel Header */}
            <div className="h-10 bg-[#1c1c1c] border-b border-[#3D4028] px-3 sm:px-4 flex items-center justify-between shrink-0 select-none">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[#AD3D30] font-bold text-xs select-none">ana://</span>
                <span className="text-xs font-bold text-white tracking-wider truncate">
                  journal-entry.md
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded-xs bg-[#262626] border border-[#3D4028] text-[9px] text-[#A3A649]">
                  {wordCount} words
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Flow Guide Toggle Button (Cognitive Unwinding / Narrative Milestones) */}
                <button
                  id="studio-flow-guide-btn"
                  onClick={() => setIsFlowGuideOpen(prev => !prev)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-xs border text-[10px] font-semibold transition-all shadow-xs cursor-pointer ${
                    isFlowGuideOpen
                      ? "bg-[#3D4028] text-[#A3A649] border-[#A3A649]"
                      : "bg-[#262626] hover:bg-[#3D4028] text-[#8C8C8C] hover:text-white border-[#3D4028]"
                  }`}
                  title="Toggle Narrative Flow Guide (Implicit Cognitive Unwinding & Brain Dump Starters)"
                >
                  <Sparkles className="w-2.5 h-2.5" />
                  <span className="hidden sm:inline">Flow Guide</span>
                  <span className="text-[9px] px-1 py-0.2 rounded-xs bg-[#181818] text-[#A3A649] font-mono">
                    {flowMetrics.currentStage === "release" ? "1. Stream" : flowMetrics.currentStage === "causal" ? "2. Causal" : "3. Horizon"}
                  </span>
                </button>

                {/* Scan Handwritten Journal button */}
                <button
                  id="studio-scan-handwritten-btn"
                  onClick={() => setIsHandwrittenModalOpen(true)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-xs bg-[#262626] hover:bg-[#3D4028] text-[#A3A649] hover:text-white border border-[#3D4028] hover:border-[#A3A649] text-[10px] font-semibold transition-all shadow-xs cursor-pointer"
                  title="Capture Handwritten Journal with Google Cloud OCR & Cloud DLP"
                >
                  <Camera className="w-2.5 h-2.5" />
                  <span className="hidden sm:inline">Handwritten OCR</span>
                </button>

                {/* Pin to Dashboard toggle */}
                <button
                  id="studio-journal-pin-btn"
                  onClick={handleTogglePin}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-xs border text-[10px] font-semibold transition-all shadow-xs cursor-pointer ${
                    currentEntry.isPinned
                      ? "bg-[#3D4028] text-[#A3A649] border-[#A3A649]"
                      : "bg-[#262626] hover:bg-[#3D4028] text-[#8C8C8C] hover:text-white border-[#3D4028]"
                  }`}
                  title={currentEntry.isPinned ? "Unpin reflection from dashboard" : "Pin reflection to dashboard"}
                >
                  <Pin className={`w-2.5 h-2.5 ${currentEntry.isPinned ? "fill-[#A3A649]" : ""}`} />
                  <span>{currentEntry.isPinned ? "Pinned" : "Pin"}</span>
                </button>

                {/* Save button */}
                <button
                  id="journal-save-btn"
                  onClick={handleSaveEntry}
                  disabled={isSaving}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-xs bg-[#AD3D30] hover:bg-[#AD3D30]/80 text-white text-[10px] font-semibold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                  title="Save to Cloud Firestore"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                      <span>Syncing...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-2.5 h-2.5" />
                      <span>Save</span>
                    </>
                  )}
                </button>

                {/* Minimize Button */}
                <button
                  id="journal-minimize-btn"
                  onClick={handleToggleJournal}
                  className="w-6 h-6 rounded-xs bg-[#262626] hover:bg-[#3D4028] border border-[#3D4028] text-[#8C8C8C] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                  title="Minimize Journal Panel"
                >
                  <Minus className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Persistence Error Banner if any */}
            {saveError && (
              <div className="px-3 py-1.5 bg-[#AD3D30]/20 border-b border-[#AD3D30] flex items-center justify-between text-xs text-[#e2e8f0]">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-[#AD3D30] shrink-0" />
                  <span className="text-[11px]">{saveError}</span>
                </div>
                <button 
                  onClick={onClearSaveError}
                  className="text-xs text-[#8C8C8C] hover:text-white font-bold cursor-pointer ml-2"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Scrollable Journal Body */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 bg-[#181818]">
              {/* Attached Handwritten Pages Strip if any */}
              {currentEntry.attachedHandwrittenImages && currentEntry.attachedHandwrittenImages.length > 0 && (
                <div className="p-2.5 bg-[#262626] border border-[#3D4028] rounded-xs space-y-1.5 animate-in fade-in">
                  <div className="flex items-center justify-between text-[10px] text-[#8C8C8C] font-bold">
                    <span className="flex items-center gap-1 text-[#A3A649]">
                      <Camera className="w-3 h-3" />
                      ATTACHED HANDWRITTEN PAGES ({currentEntry.attachedHandwrittenImages.length})
                    </span>
                    <span className="font-mono text-[9px] text-[#8C8C8C]">gs://ana-handwritten-archives/</span>
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {currentEntry.attachedHandwrittenImages.map((img, idx) => (
                      <div key={idx} className="relative w-14 h-14 rounded-xs border border-[#3D4028] overflow-hidden shrink-0 group">
                        <img src={img} alt={`Handwritten page ${idx + 1}`} className="w-full h-full object-cover" />
                        <span className="absolute bottom-0.5 left-0.5 text-[8px] bg-black/80 px-1 text-white">
                          P{idx + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cognitive Unwinding & Narrative Flow Guide (Implicit Pennebaker Engine) */}
              {isFlowGuideOpen && (
                <div 
                  id="cognitive-unwinding-flow-panel"
                  className={`p-3 rounded-xs space-y-2.5 animate-in fade-in text-xs border transition-colors ${
                    isLight
                      ? "bg-white border-stone-200 text-stone-900 shadow-2xs"
                      : "bg-[#20241a] border-[#3D4028] text-white"
                  }`}
                  style={isLight ? { backgroundColor: "#ffffff" } : undefined}
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <div className={`flex items-center gap-1.5 font-bold ${
                      isLight ? "text-[#4D541B]" : "text-[#A3A649]"
                    }`}>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>COGNITIVE UNWINDING FLOW</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className={`font-mono ${isLight ? "text-stone-500" : "text-[#8C8C8C]"}`}>
                        {flowMetrics.totalWords} words
                      </span>
                      <span className={isLight ? "text-stone-300" : "text-[#3D4028]"}>|</span>
                      <span className={`font-medium ${isLight ? "text-stone-700" : "text-[#cfd39c]"}`}>
                        {flowMetrics.stageLabel}
                      </span>
                    </div>
                  </div>

                  {/* 3 Milestones Stepper */}
                  <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                    <div className={`p-1.5 rounded-xs border transition-all ${
                      flowMetrics.currentStage === "release"
                        ? isLight 
                          ? "bg-[#F4F6EE] border-[#7D8536] text-stone-900 font-bold" 
                          : "bg-[#2d3319] border-[#A3A649] text-white font-bold"
                        : isLight 
                          ? "bg-stone-50 border-stone-200 text-stone-600" 
                          : "bg-[#181a14] border-[#3D4028]/60 text-[#8C8C8C]"
                    }`}>
                      <div className="flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          isLight ? "bg-[#595F22]" : "bg-[#A3A649]"
                        }`} />
                        <span>1. Stream</span>
                      </div>
                      <p className={`text-[9px] mt-0.5 hidden sm:block ${
                        isLight ? "text-stone-500" : "text-[#8C8C8C]"
                      }`}>
                        Raw emotional venting
                      </p>
                    </div>

                    <div className={`p-1.5 rounded-xs border transition-all ${
                      flowMetrics.currentStage === "causal"
                        ? isLight 
                          ? "bg-[#F4F6EE] border-[#7D8536] text-stone-900 font-bold" 
                          : "bg-[#2d3319] border-[#A3A649] text-white font-bold"
                        : isLight 
                          ? "bg-stone-50 border-stone-200 text-stone-600" 
                          : "bg-[#181a14] border-[#3D4028]/60 text-[#8C8C8C]"
                    }`}>
                      <div className="flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          flowMetrics.causalCount > 0 
                            ? isLight ? "bg-[#595F22]" : "bg-[#A3A649]" 
                            : isLight ? "bg-stone-300" : "bg-[#8C8C8C]/40"
                        }`} />
                        <span>2. Causal</span>
                      </div>
                      <p className={`text-[9px] mt-0.5 hidden sm:block ${
                        isLight ? "text-stone-500" : "text-[#8C8C8C]"
                      }`}>
                        "because", "realize", "why"
                      </p>
                    </div>

                    <div className={`p-1.5 rounded-xs border transition-all ${
                      flowMetrics.currentStage === "horizon"
                        ? isLight 
                          ? "bg-[#F4F6EE] border-[#7D8536] text-stone-900 font-bold" 
                          : "bg-[#2d3319] border-[#A3A649] text-white font-bold"
                        : isLight 
                          ? "bg-stone-50 border-stone-200 text-stone-600" 
                          : "bg-[#181a14] border-[#3D4028]/60 text-[#8C8C8C]"
                    }`}>
                      <div className="flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          flowMetrics.perspectiveCount > 0 
                            ? "bg-[#10b981]" 
                            : isLight ? "bg-stone-300" : "bg-[#8C8C8C]/40"
                        }`} />
                        <span>3. Horizon</span>
                      </div>
                      <p className={`text-[9px] mt-0.5 hidden sm:block ${
                        isLight ? "text-stone-500" : "text-[#8C8C8C]"
                      }`}>
                        Wider altitude & distance
                      </p>
                    </div>
                  </div>

                  {/* Stage Progress Bar */}
                  <div className="space-y-1">
                    <div className={`w-full h-1.5 rounded-full overflow-hidden border ${
                      isLight 
                        ? "bg-stone-100 border-stone-200" 
                        : "bg-[#181a14] border-[#3D4028]/60"
                    }`}>
                      <div 
                        className="bg-gradient-to-r from-[#A3A649] to-[#10b981] h-full transition-all duration-300"
                        style={{ width: `${flowMetrics.stageProgress}%` }}
                      />
                    </div>
                    <div className={`flex items-center justify-between text-[9px] ${
                      isLight ? "text-stone-500" : "text-[#8C8C8C]"
                    }`}>
                      <span>{flowMetrics.stageDescription}</span>
                      {flowMetrics.causalWordsFound.length > 0 && (
                        <span className={`font-mono truncate max-w-[150px] ${
                          isLight ? "text-[#4D541B]" : "text-[#A3A649]"
                        }`}>
                          Links: {flowMetrics.causalWordsFound.slice(0, 3).join(", ")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 3 Low-friction Brain Dump Starters if empty or very short */}
                  {flowMetrics.totalWords < 20 && (
                    <div className={`pt-2 border-t space-y-1.5 ${
                      isLight ? "border-stone-200" : "border-[#3D4028]/80"
                    }`}>
                      <span className={`text-[10px] font-semibold ${
                        isLight ? "text-stone-600" : "text-[#8C8C8C]"
                      }`}>
                        Blank page? Tap an uninhibited starter to begin:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                        {BRAIN_DUMP_STARTERS.map((starter, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleApplyStarter(starter.text)}
                            className={`p-1.5 text-left border rounded-xs transition-all text-[10px] cursor-pointer group ${
                              isLight 
                                ? "bg-stone-50 hover:bg-[#F4F6EE] border-stone-200 hover:border-[#7D8536]" 
                                : "bg-[#181a14] hover:bg-[#282d19] border-[#3D4028] hover:border-[#A3A649]"
                            }`}
                          >
                            <div className={`font-bold group-hover:underline ${
                              isLight ? "text-[#4D541B]" : "text-[#A3A649]"
                            }`}>
                              {starter.label}
                            </div>
                            <div className={`text-[9px] line-clamp-1 mt-0.5 ${
                              isLight ? "text-stone-500" : "text-[#8C8C8C]"
                            }`}>
                              "{starter.text.trim()}..."
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Title Input */}
              <div className="bg-[#262626] border border-[#3D4028] rounded-xs p-2.5 space-y-2">
                {currentEntry.isPinned && (
                  <div className="flex items-center gap-1 text-[9px] font-bold text-[#A3A649] bg-[#3D4028] border border-[#A3A649]/40 px-1.5 py-0.5 rounded-xs w-fit">
                    <Pin className="w-2.5 h-2.5 fill-[#A3A649]" />
                    <span>PINNED CRITICAL ANCHOR (DASHBOARD VISIBLE)</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-[#AD3D30] font-bold text-sm select-none">#</span>
                  <input
                    id="studio-journal-title"
                    type="text"
                    value={currentEntry.title}
                    onChange={handleTitleChange}
                    placeholder="Untitled Reflection Note..."
                    className="font-mono text-sm sm:text-base font-bold text-white placeholder-[#8C8C8C]/50 focus:outline-hidden w-full bg-transparent tracking-tight"
                  />
                </div>

                {/* Mood Selector Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                  <span className="text-[#8C8C8C] text-[10px] shrink-0 font-medium">Mood:</span>
                  {MOODS.map(m => {
                    const MoodIcon = m.icon;
                    const isSelected = currentEntry.mood === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => handleMoodSelect(m.id)}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-xs border text-[10px] transition-all cursor-pointer ${
                          isSelected
                            ? `${m.color} ring-1 ring-[#A3A649] font-bold`
                            : "bg-[#181818] text-[#8C8C8C] border-[#3D4028] hover:text-white hover:border-[#8C8C8C]"
                        }`}
                      >
                        <MoodIcon className="w-2.5 h-2.5 shrink-0" />
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Tags row */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-[#3D4028]/60 text-xs">
                  <span className="text-[#8C8C8C] text-[10px]">Tags:</span>
                  {currentEntry.tags.map(t => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-xs bg-[#181818] text-[#8C8C8C] text-[10px] border border-[#3D4028]"
                    >
                      <span className="text-[#AD3D30]">#</span>
                      <span>{t}</span>
                      <button 
                        onClick={() => handleRemoveTag(t)}
                        className="hover:text-[#AD3D30] cursor-pointer ml-0.5"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    placeholder="+tag [enter]"
                    className="px-1.5 py-0.5 text-[10px] bg-[#181818] border border-[#3D4028] rounded-xs text-[#e2e8f0] placeholder-[#8C8C8C]/50 focus:outline-hidden focus:border-[#A3A649] w-20"
                  />
                </div>
              </div>

              {/* Main Content Textarea */}
              <div className="bg-[#262626] border border-[#3D4028] rounded-xs flex flex-col flex-1 min-h-[200px] md:min-h-[360px] p-2.5">
                <textarea
                  id="studio-journal-content"
                  value={currentEntry.content}
                  onChange={handleContentChange}
                  placeholder="Stream of consciousness, raw thoughts, or emotional venting... (Markdown supported)"
                  className="w-full flex-1 min-h-[140px] md:min-h-[300px] bg-transparent text-[#e2e8f0] text-xs sm:text-sm font-mono leading-relaxed placeholder-[#8C8C8C]/40 focus:outline-hidden resize-none"
                />

                {/* Ambient Ghost Prompt Banner (when user pauses typing for >4 seconds) */}
                {showAmbientPrompt && flowMetrics.suggestedPrompt && (
                  <div className="my-2 p-2 rounded-xs bg-[#202617] border border-[#A3A649]/60 flex items-center justify-between animate-in fade-in slide-in-from-top-1 text-xs">
                    <div className="flex items-center gap-2 text-[#e2e8f0] min-w-0">
                      <Lightbulb className="w-3.5 h-3.5 text-[#A3A649] shrink-0 animate-pulse" />
                      <span className="italic text-[11px] text-[#cfd39c] truncate">
                        "{flowMetrics.suggestedPrompt}"
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <button
                        onClick={handleInsertAmbientPrompt}
                        className="px-2 py-0.5 rounded-xs bg-[#3D4028] hover:bg-[#A3A649] text-[#A3A649] hover:text-black text-[10px] font-bold transition-all cursor-pointer"
                        title="Insert gentle prompt into journal"
                      >
                        + Insert
                      </button>
                      <button
                        onClick={() => setShowAmbientPrompt(false)}
                        className="px-1.5 py-0.5 text-[#8C8C8C] hover:text-white text-[10px] cursor-pointer"
                        title="Dismiss prompt"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}

                {/* Bottom stats footer */}
                <div className="pt-2 border-t border-[#3D4028] flex items-center justify-between text-[10px] text-[#8C8C8C]">
                  <div className="flex items-center gap-3">
                    <span>{wordCount} words</span>
                    <span>•</span>
                    <span>{charCount} chars</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[#A3A649]">●</span>
                    <span>Markdown Buffer</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ==================================================================== */}
      {/* PANEL 2: AI ASSISTANT (Bottom on mobile, can be minimized/expanded) */}
      {/* ==================================================================== */}
      <section 
        id="panel-ai"
        className={`panel-smooth flex flex-col overflow-hidden bg-[#181818] ${
          isAiCollapsed 
            ? "h-11 w-full md:h-full md:w-12 shrink-0 cursor-pointer bg-[#141414] hover:bg-[#1a1a1a]" 
            : isJournalCollapsed
            ? "flex-1 w-full h-full min-h-0"
            : "flex-1 w-full h-1/2 md:h-full min-h-0 min-w-0"
        }`}
        onClick={isAiCollapsed ? handleToggleAi : undefined}
      >
        {isAiCollapsed ? (
          <>
            {/* Mobile Collapsed Horizontal Bar */}
            <div className="flex md:hidden flex-row items-center justify-between h-full px-3 py-1 bg-[#1a1a1a]">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <span className="text-[#A3A649]">ana://</span>
                <span className="text-white">ai-assistant.agent</span>
                <span className="text-[10px] text-[#10b981] bg-[#262626] px-1.5 py-0.5 rounded-xs">
                  [GEMINI]
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleAi();
                }}
                className="px-2 py-1 rounded-xs bg-[#262626] border border-[#3D4028] hover:border-[#A3A649] text-[#A3A649] flex items-center gap-1.5 text-[10px] font-bold cursor-pointer"
                title="Expand AI Assistant Panel"
              >
                <Maximize2 className="w-3 h-3" />
                <span>EXPAND AI</span>
              </button>
            </div>

            {/* Desktop Collapsed Vertical Tab */}
            <div className="hidden md:flex flex-col items-center justify-between h-full py-4 px-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleAi();
                }}
                className="w-7 h-7 rounded-xs bg-[#262626] border border-[#3D4028] hover:border-[#A3A649] text-[#A3A649] flex items-center justify-center transition-colors cursor-pointer"
                title="Expand AI Assistant Panel"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>

              <div className="writing-vertical text-xs tracking-widest text-[#8C8C8C] hover:text-white font-semibold flex items-center gap-2">
                <span className="text-[#A3A649]">ana://</span>
                <span>ai-assistant.agent</span>
                <span className="text-[10px] text-[#10b981] bg-[#262626] px-1 py-0.5 rounded-xs">
                  [ONLINE]
                </span>
              </div>

              <div className="w-2 h-2 rounded-full bg-[#10b981]" />
            </div>
          </>
        ) : (
          /* EXPANDED AI ASSISTANT PANEL */
          <div className="flex flex-col h-full min-h-0">
            {/* Panel Header */}
            <div className="h-10 bg-[#1c1c1c] border-b border-[#3D4028] px-3 sm:px-4 flex items-center justify-between shrink-0 select-none">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[#A3A649] font-bold text-xs select-none">ana://</span>
                <span className="text-xs font-bold text-white tracking-wider truncate">
                  ai-assistant.agent
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded-xs bg-[#262626] border border-[#3D4028] text-[9px] text-[#10b981]">
                  GEMINI-3.8-FLASH
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Horizon Shift (Implicit Third-Person Decentering via Gemini 3.6+) */}
                <button
                  id="studio-decenter-perspective-btn"
                  onClick={handleDecenterNarrative}
                  disabled={isDecentering || !currentEntry.content.trim()}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-xs bg-[#3D4028]/70 hover:bg-[#A3A649] text-[#A3A649] hover:text-black text-[10px] font-semibold transition-all border border-[#A3A649]/50 disabled:opacity-40 cursor-pointer"
                  title="Horizon Shift: View your thoughts through a neutral, third-person perspective with causal clarity (Gemini 3.6+)"
                >
                  {isDecentering ? (
                    <>
                      <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                      <span>Shifting...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-2.5 h-2.5 text-[#A3A649]" />
                      <span className="hidden md:inline">Horizon Shift</span>
                    </>
                  )}
                </button>

                {/* Empirical Telemetry Action */}
                <button
                  id="extract-telemetry-btn"
                  onClick={handleExtractTelemetry}
                  disabled={isExtractingTelemetry || !currentEntry.content.trim()}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-xs bg-[#10b981]/20 hover:bg-[#10b981] text-[#10b981] hover:text-black text-[10px] font-semibold transition-all border border-[#10b981]/40 disabled:opacity-40 cursor-pointer"
                  title="Quantify subjective feelings, habits & next-day impact"
                >
                  {isExtractingTelemetry ? (
                    <>
                      <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                      <span>Quantifying...</span>
                    </>
                  ) : (
                    <>
                      <BarChart3 className="w-2.5 h-2.5" />
                      <span className="hidden md:inline">Stats & Telemetry</span>
                    </>
                  )}
                </button>

                {/* AI Summary / Synthesis Action */}
                <button
                  id="ai-summarize-btn"
                  onClick={handleGenerateSummary}
                  disabled={isSummarizing || !currentEntry.content.trim()}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-xs bg-[#3D4028] hover:bg-[#A3A649] text-[#A3A649] hover:text-black text-[10px] font-semibold transition-all border border-[#A3A649]/40 disabled:opacity-40 cursor-pointer"
                  title="Synthesize Reflection & Extract Insights"
                >
                  {isSummarizing ? (
                    <>
                      <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                      <span>Synthesizing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-2.5 h-2.5" />
                      <span className="hidden md:inline">AI Synthesis</span>
                    </>
                  )}
                </button>

                {/* Persona Mode Tabs */}
                <div className="flex items-center bg-[#262626] rounded-xs border border-[#3D4028] p-0.5 text-[10px]">
                  <button
                    onClick={() => setChatMode("reflect")}
                    className={`px-1.5 py-0.5 rounded-xs transition-colors cursor-pointer ${
                      chatMode === "reflect" ? "bg-[#3D4028] text-[#A3A649] font-bold" : "text-[#8C8C8C] hover:text-white"
                    }`}
                  >
                    Reflect
                  </button>
                  <button
                    onClick={() => setChatMode("brainstorm")}
                    className={`px-1.5 py-0.5 rounded-xs transition-colors cursor-pointer ${
                      chatMode === "brainstorm" ? "bg-[#3D4028] text-[#A3A649] font-bold" : "text-[#8C8C8C] hover:text-white"
                    }`}
                  >
                    Action
                  </button>
                  <button
                    onClick={() => setChatMode("mentor")}
                    className={`px-1.5 py-0.5 rounded-xs transition-colors cursor-pointer ${
                      chatMode === "mentor" ? "bg-[#3D4028] text-[#A3A649] font-bold" : "text-[#8C8C8C] hover:text-white"
                    }`}
                  >
                    Mentor
                  </button>
                </div>

                {/* Minimize Button */}
                <button
                  id="ai-minimize-btn"
                  onClick={handleToggleAi}
                  className="w-6 h-6 rounded-xs bg-[#262626] hover:bg-[#3D4028] border border-[#3D4028] text-[#8C8C8C] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                  title="Minimize AI Panel"
                >
                  <Minus className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Chat Messages Stream */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 bg-[#181818] min-h-0">
              {/* Decentered Horizon Perspective Card (Implicit Pennebaker Decentering) */}
              {decenteredResult && (
                <div className="p-3 rounded-xs bg-[#222718] border border-[#A3A649] space-y-2.5 text-xs animate-in fade-in">
                  <div className="flex items-center justify-between text-[#A3A649] font-bold text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>HORIZON PERSPECTIVE (DECENTERED CLARITY)</span>
                    </div>
                    <button
                      onClick={() => setDecenteredResult(null)}
                      className="text-[#8C8C8C] hover:text-white cursor-pointer text-xs"
                      title="Dismiss card"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-1.5 text-[#e2e8f0]">
                    <p className="italic text-[11px] leading-relaxed text-[#dcdfb4] bg-[#181a12] p-2 rounded-xs border border-[#3D4028]">
                      "{decenteredResult.decenteredPerspective}"
                    </p>
                  </div>

                  {decenteredResult.causalBridge && (
                    <div className="p-2 rounded-xs bg-[#1a1c14] border border-[#3D4028] space-y-0.5">
                      <span className="text-[10px] text-[#A3A649] font-bold uppercase tracking-wider">Causal Realization</span>
                      <p className="text-[11px] text-[#e2e8f0]">{decenteredResult.causalBridge}</p>
                    </div>
                  )}

                  {decenteredResult.groundedStep && (
                    <div className="p-2 rounded-xs bg-[#1a1c14] border border-[#3D4028] space-y-0.5">
                      <span className="text-[10px] text-[#10b981] font-bold uppercase tracking-wider">Grounded Anchor</span>
                      <p className="text-[11px] text-[#e2e8f0]">{decenteredResult.groundedStep}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-[#3D4028]/80">
                    <span className="text-[9px] text-[#8C8C8C] font-mono">
                      Model: {decenteredResult.modelUsed || "gemini-3.8-flash"}
                    </span>
                    <button
                      onClick={handleAppendDecenteredToJournal}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-xs bg-[#A3A649] hover:bg-[#A3A649]/80 text-black text-[10px] font-bold transition-all cursor-pointer shadow-xs"
                      title="Append this perspective to your journal reflection"
                    >
                      <span>+ Append to Journal</span>
                    </button>
                  </div>
                </div>
              )}

              {/* AI Summary Card if present */}
              {currentEntry.aiSummary && (
                <div className="p-3 rounded-xs bg-[#262626] border border-[#A3A649] space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[#A3A649] font-bold text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>NEUROPLASTIC SYNTHESIS</span>
                    </div>
                    <span className="text-[10px] text-[#8C8C8C] uppercase">
                      Analysis: {currentEntry.aiSummary.moodAnalysis || "Reflective"}
                    </span>
                  </div>
                  <p className="text-[#e2e8f0] leading-relaxed">
                    {currentEntry.aiSummary.summary}
                  </p>

                  {currentEntry.aiSummary.keyTakeaways && currentEntry.aiSummary.keyTakeaways.length > 0 && (
                    <div className="pt-2 border-t border-[#3D4028] space-y-1">
                      <span className="text-[10px] text-[#8C8C8C] font-semibold">Key Takeaways:</span>
                      <ul className="list-disc list-inside text-[11px] text-[#A3A649] space-y-0.5">
                        {currentEntry.aiSummary.keyTakeaways.map((ins, i) => (
                          <li key={i}>{ins}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {currentEntry.aiSummary.reflectionQuestions && currentEntry.aiSummary.reflectionQuestions.length > 0 && (
                    <div className="pt-2 border-t border-[#3D4028] space-y-1">
                      <span className="text-[10px] text-[#8C8C8C] font-semibold">Reflection Prompts:</span>
                      <ul className="list-disc list-inside text-[11px] text-white/90 space-y-0.5">
                        {currentEntry.aiSummary.reflectionQuestions.map((q, i) => (
                          <li key={i}>{q}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Empirical Statistical Telemetry Card (Variations A + C + F) */}
              <EmpiricalTelemetryCard
                telemetry={currentEntry.empiricalTelemetry}
                isExtracting={isExtractingTelemetry}
                onExtractTelemetry={handleExtractTelemetry}
                onUpdateTelemetry={handleUpdateTelemetry}
              />

              {/* Message List */}
              {currentEntry.messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 text-[#8C8C8C]">
                  <div className="w-10 h-10 rounded-xs bg-[#262626] border border-[#3D4028] text-[#A3A649] flex items-center justify-center">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div className="space-y-1 max-w-xs">
                    <p className="text-xs font-bold text-white">Neural Socratic Oracle</p>
                    <p className="text-[11px]">
                      Ask questions, untangle cognitive distortions, or explore compassionate reframes based on your entry.
                    </p>
                  </div>
                </div>
              ) : (
                currentEntry.messages.map((m) => {
                  const isUser = m.role === "user";
                  return (
                    <div
                      key={m.id}
                      className={`flex gap-2 text-xs ${isUser ? "justify-end" : "justify-start"}`}
                    >
                      {!isUser && (
                        <div className="w-6 h-6 rounded-xs bg-[#262626] border border-[#3D4028] text-[#A3A649] flex items-center justify-center shrink-0 mt-0.5">
                          <Bot className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <div
                        className={`max-w-[85%] rounded-xs p-2.5 text-xs leading-relaxed ${
                          isUser
                            ? "bg-[#262626] border border-[#3D4028] text-white"
                            : "bg-[#1c1c1c] border border-[#3D4028] text-[#e2e8f0] markdown-content"
                        }`}
                      >
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                      {isUser && (
                        <div className="w-6 h-6 rounded-xs bg-[#AD3D30] text-white flex items-center justify-center shrink-0 mt-0.5">
                          <UserIcon className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {/* Typing / Thinking Indicator */}
              {isAiResponding && (
                <div className="flex items-center gap-2 text-xs text-[#A3A649]">
                  <div className="w-6 h-6 rounded-xs bg-[#262626] border border-[#3D4028] flex items-center justify-center">
                    <Bot className="w-3.5 h-3.5 animate-pulse text-[#A3A649]" />
                  </div>
                  <div className="flex items-center gap-1 bg-[#1c1c1c] border border-[#3D4028] px-2.5 py-1.5 rounded-xs text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#A3A649] animate-ping" />
                    <span>Gemini is synthesizing neural reflection...</span>
                  </div>
                </div>
              )}

              {/* AI Error Notification */}
              {aiError && (
                <div className="p-2 rounded-xs bg-[#AD3D30]/20 border border-[#AD3D30] text-xs text-[#AD3D30] flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{aiError}</span>
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>

            {/* Quick Prompt Suggestions */}
            <div className="px-3 py-1.5 bg-[#141414] border-t border-[#3D4028] overflow-x-auto flex items-center gap-1.5 scrollbar-none">
              <span className="text-[10px] text-[#8C8C8C] shrink-0">Prompts:</span>
              {CHAT_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(prompt)}
                  disabled={isAiResponding}
                  className="px-2 py-0.5 bg-[#262626] hover:bg-[#3D4028] border border-[#3D4028] hover:border-[#A3A649] text-[#8C8C8C] hover:text-white rounded-xs text-[10px] whitespace-nowrap transition-colors cursor-pointer disabled:opacity-40"
                >
                  {prompt.length > 38 ? prompt.substring(0, 38) + "..." : prompt}
                </button>
              ))}
            </div>

            {/* Chat Input Bar */}
            <div className="p-2.5 bg-[#1c1c1c] border-t border-[#3D4028]">
              <div className="flex items-center gap-2 bg-[#121212] border border-[#3D4028] rounded-xs p-1.5 focus-within:border-[#A3A649] transition-colors">
                <input
                  id="studio-chat-input"
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Inquire with the Neural Oracle... (Enter to send)"
                  disabled={isAiResponding}
                  className="w-full bg-transparent text-xs font-mono text-white placeholder-[#8C8C8C]/50 focus:outline-hidden"
                />
                <button
                  id="studio-chat-send-btn"
                  onClick={() => handleSendMessage()}
                  disabled={!chatInput.trim() || isAiResponding}
                  className="px-2.5 py-1 rounded-xs bg-[#AD3D30] hover:bg-[#AD3D30]/80 text-white text-[10px] font-bold transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1"
                >
                  <Send className="w-3 h-3" />
                  <span>Send</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Google Cloud Vision OCR & Cloud DLP Handwritten Capture Modal */}
      <HandwrittenCaptureModal
        isOpen={isHandwrittenModalOpen}
        onClose={() => setIsHandwrittenModalOpen(false)}
        onInsertText={handleInsertHandwrittenText}
        userId={currentEntry.userId}
      />
    </div>
  );
};
