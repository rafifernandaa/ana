/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import confetti from "canvas-confetti";
import { 
  Sparkles, 
  Send, 
  Save, 
  Bot, 
  User as UserIcon, 
  RefreshCw, 
  Smile, 
  Tag, 
  BookOpen, 
  Check, 
  Lightbulb, 
  ListChecks, 
  HeartHandshake, 
  Compass, 
  AlertCircle,
  Scissors,
  Sun,
  Activity,
  Wind,
  Plus,
  CheckCircle2,
  BrainCircuit,
  Heart,
  Target,
  Shield,
  Zap,
  Copy,
  Pin,
  PinOff,
  BarChart3,
  Mic,
  MicOff,
  Download,
  Printer
} from "lucide-react";
import { 
  JournalEntry, 
  ChatMessage, 
  JournalMood, 
  AISummary, 
  PrunedThoughtLoop, 
  GlimmerAnchor, 
  ResetSession,
  CognitiveReframeOption,
  CircadianEntry,
  PsychiatricDistillation,
  EmpiricalTelemetry
} from "../types";
import { CircadianDayBoundary } from "./CircadianDayBoundary";
import { PsychiatricDecenteringStation } from "./PsychiatricDecenteringStation";
import { EmpiricalTelemetryCard } from "./EmpiricalTelemetryCard";
import { 
  sendChatMessageToGemini, 
  generateEntrySummaryWithGemini,
  pruneThoughtLoopWithGemini,
  extractGlimmersWithGemini,
  extractReframeAndGlimmerWithGemini,
  extractEmpiricalTelemetryFromGemini
} from "../lib/geminiService";

export interface JournalEditorProps {
  entry: JournalEntry;
  onSave: (entry: JournalEntry) => Promise<void>;
  onDelete?: (entryId: string) => Promise<void>;
  onNewEntry?: () => void;
  isSaving: boolean;
  saveError: string | null;
  onClearSaveError: () => void;
  // Matrix Actions & Context
  onOpenResetRoom?: (entryContext?: { title: string; content: string; entryId: string; mood: JournalMood }) => void;
  onOpenSynapticPruner?: (thoughtText?: string, entryId?: string) => void;
  onOpenGlimmerVault?: (contextText?: string) => void;
  onSavePrunedLoop?: (loop: PrunedThoughtLoop) => Promise<void>;
  onSaveGlimmer?: (glimmer: GlimmerAnchor) => Promise<void>;
  onSaveCircadianEntry?: (entry: CircadianEntry) => Promise<void>;
  onSavePsychiatricDistillation?: (distillation: PsychiatricDistillation) => Promise<void>;
  sessions?: ResetSession[];
  prunedLoops?: PrunedThoughtLoop[];
  glimmers?: GlimmerAnchor[];
  circadianEntries?: CircadianEntry[];
  psychiatricDistillations?: PsychiatricDistillation[];
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

const PROMPT_SUGGESTIONS = [
  "What is taking up most of your mental energy right now?",
  "What is one small victory or moment of beauty you experienced today?",
  "What is an uncomfortable thought or challenge you'd like to unpack?",
  "What would your most compassionate self say about this situation?",
];

const CHAT_PROMPTS = [
  "Untangle any cognitive assumptions or catastrophic thoughts in my entry.",
  "Mine this entry for hidden glimmers, gratitude, and strengths.",
  "Give me 3 compassionate reframes (Compassion, Horizon, Agency) on this situation.",
  "Help me brainstorm 2 small, realistic actions I can take next.",
];

export const JournalEditor: React.FC<JournalEditorProps> = ({
  entry,
  onSave,
  onNewEntry,
  isSaving,
  saveError,
  onClearSaveError,
  onOpenResetRoom,
  onOpenSynapticPruner,
  onOpenGlimmerVault,
  onSavePrunedLoop,
  onSaveGlimmer,
  onSaveCircadianEntry,
  onSavePsychiatricDistillation,
  sessions = [],
  prunedLoops = [],
  glimmers = [],
  circadianEntries = [],
  psychiatricDistillations = [],
}) => {
  const [currentEntry, setCurrentEntry] = useState<JournalEntry>(entry);
  const [chatInput, setChatInput] = useState("");
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isExtractingTelemetry, setIsExtractingTelemetry] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [chatMode, setChatMode] = useState<"reflect" | "brainstorm" | "mentor">("reflect");
  const [aiError, setAiError] = useState<string | null>(null);
  const [copiedNotification, setCopiedNotification] = useState(false);

  // In-line Tool Trays
  const [isInlinePrunerOpen, setIsInlinePrunerOpen] = useState(false);
  const [inlineThoughtInput, setInlineThoughtInput] = useState("");
  const [isUntanglingInline, setIsUntanglingInline] = useState(false);
  const [inlineUntangleResult, setInlineUntangleResult] = useState<{
    distortionCategory: string;
    identifiedDistortion: string;
    neurologicalTrap: string;
    newRewiredBelief: string;
  } | null>(null);
  const [isInlineSavedToArchive, setIsInlineSavedToArchive] = useState(false);

  // Inline Glimmer Mining state
  const [isInlineMining, setIsInlineMining] = useState(false);
  const [minedGlimmers, setMinedGlimmers] = useState<{ text: string; saved: boolean }[]>([]);
  const [glimmerMineMsg, setGlimmerMineMsg] = useState<string | null>(null);

  // Inline 3-Lens Perspective Shift
  const [isShiftingPerspective, setIsShiftingPerspective] = useState(false);
  const [perspectiveReframes, setPerspectiveReframes] = useState<CognitiveReframeOption[] | null>(null);
  const [perspectiveDarkSentence, setPerspectiveDarkSentence] = useState<string | null>(null);

  // Calming Breath Guide
  const [isBreathGuideOpen, setIsBreathGuideOpen] = useState(false);
  const [breathPhase, setBreathPhase] = useState<"Inhale" | "Hold" | "Exhale" | "Pause">("Inhale");
  const [breathSeconds, setBreathSeconds] = useState(4);

  // Psychiatric Decentering Station (Vent-to-Clarity)
  const [isPsychiatricStationOpen, setIsPsychiatricStationOpen] = useState(false);

  // Voice Dictation (Web Speech API)
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const toggleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setAiError("Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            transcript += event.results[i][0].transcript + " ";
          }
        }
        if (transcript.trim()) {
          setCurrentEntry(prev => ({
            ...prev,
            content: prev.content ? `${prev.content.trim()} ${transcript.trim()}` : transcript.trim(),
            updatedAt: Date.now(),
          }));
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error("Failed to start voice dictation:", err);
      setIsListening(false);
    }
  };

  // Formatted Markdown Dossier Export
  const handleExportMarkdown = () => {
    const mdContent = `# ${currentEntry.title || "Untitled Entry"}
*Date: ${new Date(currentEntry.createdAt).toLocaleDateString()}*
*Mood: ${currentEntry.mood}*
*Tags: ${currentEntry.tags.map(t => `#${t}`).join(" ")}*

---

## Reflection Notes
${currentEntry.content || "(No written thoughts)"}

${currentEntry.aiSummary ? `---

## AI Reflection Synthesis
${currentEntry.aiSummary.summary}

### Key Takeaways
${currentEntry.aiSummary.keyTakeaways.map(k => `- ${k}`).join("\n")}

### Deep Inquiries
${currentEntry.aiSummary.reflectionQuestions.map(q => `- ${q}`).join("\n")}
` : ""}`;

    const blob = new Blob([mdContent], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(currentEntry.title || "journal-entry").toLowerCase().replace(/[^a-z0-9]/g, "-")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Synchronize when active entry prop changes
  useEffect(() => {
    setCurrentEntry(entry);
    setAiError(null);
    setPerspectiveReframes(null);
    setMinedGlimmers([]);
    setInlineUntangleResult(null);
    setIsInlinePrunerOpen(false);
    setIsBreathGuideOpen(false);
  }, [entry.id]);

  // Scroll chat to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentEntry.messages]);

  // Breathing Box Timer
  useEffect(() => {
    if (!isBreathGuideOpen) return;
    const interval = setInterval(() => {
      setBreathSeconds(prev => {
        if (prev <= 1) {
          setBreathPhase(current => {
            if (current === "Inhale") return "Hold";
            if (current === "Hold") return "Exhale";
            if (current === "Exhale") return "Pause";
            return "Inhale";
          });
          return 4;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isBreathGuideOpen]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentEntry(prev => ({ ...prev, title: e.target.value, updatedAt: Date.now() }));
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentEntry(prev => ({ ...prev, content: e.target.value, updatedAt: Date.now() }));
  };

  const handleMoodSelect = (mood: JournalMood) => {
    setCurrentEntry(prev => ({ ...prev, mood, updatedAt: Date.now() }));
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      const cleanTag = tagInput.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
      if (cleanTag && !currentEntry.tags.includes(cleanTag)) {
        setCurrentEntry(prev => ({
          ...prev,
          tags: [...prev.tags, cleanTag],
          updatedAt: Date.now(),
        }));
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setCurrentEntry(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tagToRemove),
      updatedAt: Date.now(),
    }));
  };

  const handleInsertPrompt = (promptText: string) => {
    setCurrentEntry(prev => ({
      ...prev,
      content: prev.content 
        ? `${prev.content}\n\n**${promptText}**\n`
        : `**${promptText}**\n`,
      updatedAt: Date.now(),
    }));
  };

  const handleAppendToEntry = (textToAppend: string) => {
    setCurrentEntry(prev => ({
      ...prev,
      content: prev.content ? `${prev.content}\n\n${textToAppend}` : textToAppend,
      updatedAt: Date.now(),
    }));
  };

  const handleSaveEntry = async () => {
    onClearSaveError();
    await onSave(currentEntry);
    confetti({
      particleCount: 35,
      spread: 60,
      origin: { y: 0.85 },
      colors: ["#AD3D30", "#A3A649", "#3D4028"],
    });
  };

  const handleCopyMarkdown = () => {
    const fullDoc = `# ${currentEntry.title || "Untitled Entry"}\n\n> Mood: ${currentEntry.mood} | Tags: ${currentEntry.tags.join(", ")}\n\n${currentEntry.content}`;
    navigator.clipboard.writeText(fullDoc);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  // 1. Untangle Stuck Thought from Entry
  const handleRunInlineUntangle = async () => {
    const thought = inlineThoughtInput.trim() || currentEntry.content.trim();
    if (!thought) {
      setAiError("Please type or select a thought to untangle.");
      return;
    }

    setIsUntanglingInline(true);
    setAiError(null);
    setIsInlineSavedToArchive(false);

    try {
      const res = await pruneThoughtLoopWithGemini({
        thoughtText: thought.slice(0, 300),
        context: currentEntry.content,
      });

      setInlineUntangleResult({
        distortionCategory: res.distortionCategory || "Catastrophizing",
        identifiedDistortion: res.identifiedDistortion || thought,
        neurologicalTrap: res.neuroscienceRationale,
        newRewiredBelief: res.rewiredBelief,
      });

      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 },
        colors: ["#AD3D30", "#A3A649", "#3D4028"],
      });
    } catch (err: any) {
      console.error("Inline untangle error:", err);
      setAiError(err.message || "Failed to untangle thought with Gemini.");
    } finally {
      setIsUntanglingInline(false);
    }
  };

  const handleSaveInlineUntangledToArchive = async () => {
    if (!inlineUntangleResult || !onSavePrunedLoop) return;
    const newLoop: PrunedThoughtLoop = {
      id: "pruned-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
      userId: currentEntry.userId,
      oldDistortion: inlineThoughtInput.trim() || inlineUntangleResult.identifiedDistortion || "Stuck thought",
      distortionCategory: (inlineUntangleResult.distortionCategory.toLowerCase().replace(/[^a-z_]/g, "_") as any) || "catastrophizing",
      newRewiredBelief: inlineUntangleResult.newRewiredBelief,
      dissolvedAt: Date.now(),
      sourceEntryId: currentEntry.id,
    };

    try {
      await onSavePrunedLoop(newLoop);
      setIsInlineSavedToArchive(true);
      setCurrentEntry(prev => ({
        ...prev,
        linkedPrunedLoopIds: [...(prev.linkedPrunedLoopIds || []), newLoop.id],
        updatedAt: Date.now(),
      }));
    } catch (err) {
      console.error("Failed to archive pruned loop:", err);
    }
  };

  // 2. Mine Glimmers
  const handleRunInlineGlimmerMining = async () => {
    if (!currentEntry.content.trim()) return;
    setIsInlineMining(true);
    setGlimmerMineMsg(null);
    setAiError(null);

    try {
      const res = await extractGlimmersWithGemini({ text: currentEntry.content });
      const glims = res.glimmers || [];
      if (glims.length === 0) {
        setGlimmerMineMsg("No overt glimmers found yet. Keep writing or shift perspective to notice subtle joys!");
      } else {
        setMinedGlimmers(glims.map(g => ({ text: g.text, saved: false })));
        setGlimmerMineMsg(`Mined ${glims.length} micro-glimmer${glims.length > 1 ? "s" : ""} from your thoughts!`);
        confetti({
          particleCount: 35,
          spread: 50,
          origin: { y: 0.65 },
          colors: ["#A3A649", "#3D4028", "#AD3D30"],
        });
      }
    } catch (err: any) {
      console.error("Inline glimmer mining error:", err);
      setAiError(err.message || "Failed to mine glimmers.");
    } finally {
      setIsInlineMining(false);
    }
  };

  const handleSaveMinedGlimmer = async (index: number) => {
    const item = minedGlimmers[index];
    if (!item || item.saved || !onSaveGlimmer) return;

    const newGlimmer: GlimmerAnchor = {
      id: "glimmer-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
      userId: currentEntry.userId,
      text: item.text,
      category: "gratitude",
      createdAt: Date.now(),
      sourceType: "mined_from_journal",
    };

    try {
      await onSaveGlimmer(newGlimmer);
      setMinedGlimmers(prev => prev.map((g, i) => i === index ? { ...g, saved: true } : g));
      setCurrentEntry(prev => ({
        ...prev,
        glimmersDiscovered: [...(prev.glimmersDiscovered || []), newGlimmer.text],
        updatedAt: Date.now(),
      }));
    } catch (err) {
      console.error("Failed to save glimmer:", err);
    }
  };

  // 3. 3-Lens Perspective Shift
  const handleRun3LensPerspectiveShift = async () => {
    if (!currentEntry.content.trim()) return;
    setIsShiftingPerspective(true);
    setAiError(null);

    try {
      const res = await extractReframeAndGlimmerWithGemini({
        affectLabel: currentEntry.mood,
        writingContent: currentEntry.content,
      });
      setPerspectiveDarkSentence(res.darkestSentence);
      setPerspectiveReframes(res.reframes);
      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.65 },
        colors: ["#A3A649", "#3D4028", "#AD3D30"],
      });
    } catch (err: any) {
      console.error("Perspective shift error:", err);
      setAiError(err.message || "Failed to generate 3-Lens Shift.");
    } finally {
      setIsShiftingPerspective(false);
    }
  };

  // 4. Send Message to Gemini Chat
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

    try {
      const apiMessages = updatedMessages.map(m => ({
        role: m.role as "user" | "model",
        content: m.content,
      }));

      const res = await sendChatMessageToGemini({
        messages: apiMessages,
        context: currentEntry.content,
        mode: chatMode,
      });

      const modelMsgId = "gemini-" + Date.now();
      const newModelMsg: ChatMessage = {
        id: modelMsgId,
        role: "model",
        content: res.text,
        timestamp: Date.now(),
        modelUsed: res.modelUsed,
      };

      const finalMessages = [...updatedMessages, newModelMsg];
      const finalEntry: JournalEntry = {
        ...updatedEntryWithUserMsg,
        messages: finalMessages,
        updatedAt: Date.now(),
      };

      setCurrentEntry(finalEntry);
      await onSave(finalEntry);
    } catch (err: any) {
      console.error("Failed to converse with Gemini:", err);
      setAiError(err.message || "Failed to receive response from Gemini. Please try again.");
    } finally {
      setIsAiResponding(false);
    }
  };

  // 5. Generate structured AI Summary and Takeaways
  const handleGenerateSummary = async () => {
    if (!currentEntry.content.trim() && currentEntry.messages.length === 0) {
      setAiError("Please write some reflections or chat with Gemini before generating a summary.");
      return;
    }

    setAiError(null);
    setIsSummarizing(true);

    try {
      const history = currentEntry.messages.map(m => ({
        role: m.role as "user" | "model",
        content: m.content,
      }));

      const res = await generateEntrySummaryWithGemini({
        title: currentEntry.title,
        content: currentEntry.content,
        conversationHistory: history,
      });

      const summaryObj: AISummary = {
        summary: res.summary,
        keyTakeaways: res.keyTakeaways,
        reflectionQuestions: res.reflectionQuestions,
        moodAnalysis: res.moodAnalysis,
        generatedAt: Date.now(),
        modelUsed: res.modelUsed,
      };

      const mergedTags = Array.from(new Set([...currentEntry.tags, ...res.suggestedTags]));

      const updatedEntry: JournalEntry = {
        ...currentEntry,
        tags: mergedTags,
        aiSummary: summaryObj,
        updatedAt: Date.now(),
      };

      setCurrentEntry(updatedEntry);
      await onSave(updatedEntry);

      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.7 },
        colors: ["#AD3D30", "#A3A649", "#3D4028"],
      });
    } catch (err: any) {
      console.error("Failed to generate summary:", err);
      setAiError(err.message || "Failed to generate AI summary.");
    } finally {
      setIsSummarizing(false);
    }
  };

  // Empirical Telemetry Extraction (Variations A + C + F)
  const handleExtractTelemetry = async () => {
    if (!currentEntry.content.trim()) {
      setAiError("Please write reflection content before extracting empirical telemetry.");
      return;
    }

    setAiError(null);
    setIsExtractingTelemetry(true);

    try {
      const res = await extractEmpiricalTelemetryFromGemini({
        title: currentEntry.title,
        content: currentEntry.content,
        circadianPhase: currentEntry.circadianPhase,
      });

      const updatedEntry: JournalEntry = {
        ...currentEntry,
        empiricalTelemetry: res.telemetry,
        updatedAt: Date.now(),
      };

      setCurrentEntry(updatedEntry);
      await onSave(updatedEntry);

      confetti({
        particleCount: 35,
        spread: 60,
        origin: { y: 0.7 },
        colors: ["#10b981", "#A3A649", "#3D4028"],
      });
    } catch (err: any) {
      console.error("Failed to extract empirical telemetry:", err);
      setAiError(err.message || "Failed to extract empirical telemetry.");
    } finally {
      setIsExtractingTelemetry(false);
    }
  };

  // Manual Tuning & Adjustment of Telemetry Data
  const handleUpdateTelemetry = async (updatedTelemetry: EmpiricalTelemetry) => {
    const updatedEntry: JournalEntry = {
      ...currentEntry,
      empiricalTelemetry: updatedTelemetry,
      updatedAt: Date.now(),
    };
    setCurrentEntry(updatedEntry);
    await onSave(updatedEntry);
  };

  // Linked items
  const linkedSessions = sessions.filter(s => s.sourceEntryId === currentEntry.id || currentEntry.linkedResetSessionId === s.id);
  const linkedLoops = prunedLoops.filter(l => l.sourceEntryId === currentEntry.id || currentEntry.linkedPrunedLoopIds?.includes(l.id));

  const wordCount = currentEntry.content.trim() ? currentEntry.content.trim().split(/\s+/).length : 0;
  const charCount = currentEntry.content.length;

  return (
    <>
      {/* ========================================================= */}
      {/* 1. TOP WINDOW: JOURNAL ENTRY WORKSPACE */}
      {/* ========================================================= */}
      <div 
        className="flex flex-col bg-[#1e1e1e] border border-[#3D4028] rounded-xl overflow-hidden shadow-xl font-mono select-none shrink-0"
        id="journal-workspace-editor"
      >
        {/* Top Window Tab Bar */}
        <div className="h-8 bg-[#181818] border-b border-[#3D4028] px-2.5 flex items-center justify-between shrink-0 text-xs">
          {/* Active Tab */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-[#262626] border-t-2 border-t-[#AD3D30] border-x border-[#3D4028] rounded-t text-slate-200 font-semibold text-[11px] shadow-inner">
              <span className="text-[#A3A649]">ana://entry.md</span>
              {onNewEntry && (
                <button 
                  onClick={onNewEntry}
                  className="text-[#8C8C8C] hover:text-white transition-colors cursor-pointer text-xs leading-none ml-1"
                  title="Reset / New Buffer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Sync indicator */}
            <div className="flex items-center gap-1 text-[10px] font-medium ml-1">
              <span className={`w-1.5 h-1.5 rounded-full ${isSaving ? "bg-[#AD3D30] animate-ping" : "bg-[#A3A649]"}`} />
              <span className={isSaving ? "text-[#AD3D30]" : "text-[#8C8C8C]"}>
                {isSaving ? "Saving..." : "Saved"}
              </span>
            </div>
          </div>

          {/* Tab Actions */}
          <div className="flex items-center gap-1.5">
            <button
              id="editor-pin-toggle-btn"
              onClick={async () => {
                const updated = {
                  ...currentEntry,
                  isPinned: !currentEntry.isPinned,
                  updatedAt: Date.now(),
                };
                setCurrentEntry(updated);
                await onSave(updated);
              }}
              className={`flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] transition-colors cursor-pointer ${
                currentEntry.isPinned
                  ? "bg-[#3D4028] text-[#A3A649] border-[#A3A649]"
                  : "bg-[#262626] hover:bg-[#3D4028] text-[#8C8C8C] hover:text-white border-[#3D4028]"
              }`}
              title={currentEntry.isPinned ? "Unpin reflection from dashboard" : "Pin reflection to dashboard"}
            >
              <Pin className={`w-3 h-3 ${currentEntry.isPinned ? "fill-[#A3A649]" : ""}`} />
              <span className="hidden sm:inline">{currentEntry.isPinned ? "Pinned" : "Pin"}</span>
            </button>

            <button
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#262626] hover:bg-[#3D4028] text-[#8C8C8C] hover:text-white border border-[#3D4028] text-[10px] transition-colors cursor-pointer"
              title="Copy Note Markdown"
            >
              {copiedNotification ? (
                <>
                  <Check className="w-3 h-3 text-[#A3A649]" />
                  <span className="text-[#A3A649]">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span className="hidden sm:inline">Copy</span>
                </>
              )}
            </button>

            <button
              id="save-entry-button"
              onClick={handleSaveEntry}
              disabled={isSaving}
              className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-[#AD3D30] hover:bg-[#AD3D30]/80 text-white text-[10px] font-semibold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Syncing...</span>
                </>
              ) : (
                <>
                  <Save className="w-3 h-3" />
                  <span>Save</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Main Scrollable Body (Child 2: matches CSS selector 3) */}
        <div 
          className="overflow-y-auto bg-[#181818] p-2.5 sm:p-3 space-y-2.5 scrollbar-thin text-[#e2e8f0]"
          style={{ height: "132.333px" }}
        >
        {/* Persistence Error Banner with Retry */}
        {saveError && (
          <div className="p-3 rounded-lg bg-[#262626] border border-[#AD3D30] text-[#e2e8f0] flex items-start justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-[#AD3D30] shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-[#AD3D30]">Persistence Error</p>
                <p className="text-[11px] text-[#8C8C8C] mt-0.5">{saveError}</p>
              </div>
            </div>
            <button
              id="retry-save-button"
              onClick={handleSaveEntry}
              className="px-2.5 py-1 rounded bg-[#AD3D30] hover:bg-[#AD3D30]/80 text-white text-[11px] font-medium transition-colors cursor-pointer"
            >
              Retry Save
            </button>
          </div>
        )}

        {/* Circadian Day-Boundary if provided */}
        {onSaveCircadianEntry && (
          <CircadianDayBoundary
            userId={currentEntry.userId}
            activeJournalEntry={currentEntry}
            circadianEntries={circadianEntries}
            onSaveCircadianEntry={onSaveCircadianEntry}
            onInsertPromptToJournal={handleAppendToEntry}
            onSetJournalMood={handleMoodSelect}
          />
        )}

        {/* Psychiatric Decentering Station (Vent-to-Clarity) */}
        {isPsychiatricStationOpen && onSavePsychiatricDistillation && (
          <div className="animate-in fade-in slide-in-from-top-3 duration-200">
            <PsychiatricDecenteringStation
              userId={currentEntry.userId}
              currentJournalContent={currentEntry.content}
              onInsertToJournal={handleAppendToEntry}
              onSaveDistillation={onSavePsychiatricDistillation}
            />
          </div>
        )}

        {/* Header Block: Title, Subtitle, Moods, Tags */}
        <div className="p-3.5 rounded-lg bg-[#262626] border border-[#3D4028] space-y-3">
          {/* Title */}
          <div className="flex items-center gap-2">
            <span className="text-[#AD3D30] font-bold text-lg select-none">#</span>
            <input
              id="entry-title-input"
              type="text"
              value={currentEntry.title}
              onChange={handleTitleChange}
              placeholder="Untitled Entry..."
              className="font-mono text-base sm:text-lg font-bold text-white placeholder-[#8C8C8C]/50 focus:outline-hidden w-full bg-transparent tracking-tight"
            />
          </div>

          {/* Subtitle Quotes */}
          <div className="text-[#8C8C8C] text-xs flex items-center gap-2">
            <span className="text-[#A3A649] font-bold">&gt;</span>
            <span>Mindful stress reset & neuroplastic reflection note</span>
          </div>

          {/* Mood Selector Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            <span className="text-[#8C8C8C] font-medium shrink-0 flex items-center gap-1 text-[11px]">
              <Smile className="w-3.5 h-3.5 text-[#A3A649]" /> Mood:
            </span>
            {MOODS.map(m => {
              const MoodIcon = m.icon;
              const isSelected = currentEntry.mood === m.id;
              return (
                <button
                  key={m.id}
                  id={`mood-select-${m.id}`}
                  onClick={() => handleMoodSelect(m.id)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] transition-all cursor-pointer ${
                    isSelected
                      ? `${m.color} ring-1 ring-[#A3A649] font-semibold`
                      : "bg-[#181818] text-[#8C8C8C] border-[#3D4028] hover:text-white"
                  }`}
                >
                  <MoodIcon className="w-3 h-3 shrink-0" />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap items-center gap-2 text-xs pt-1 border-t border-[#3D4028]">
            <div className="flex items-center gap-1 text-[#8C8C8C] text-[11px]">
              <Tag className="w-3 h-3 text-[#A3A649]" />
              <span>Tags:</span>
            </div>
            {currentEntry.tags.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#181818] text-[#8C8C8C] text-[11px] border border-[#3D4028]"
              >
                <span className="text-[#AD3D30]">#</span>
                <span>{tag}</span>
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-[#AD3D30] p-0.5 cursor-pointer ml-0.5"
                >
                  ×
                </button>
              </span>
            ))}
            <div className="flex items-center gap-1">
              <input
                id="tag-input-field"
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="+tag [enter]"
                className="px-1.5 py-0.5 text-[11px] bg-[#181818] border border-[#3D4028] rounded text-[#e2e8f0] placeholder-[#8C8C8C]/50 focus:outline-hidden focus:border-[#A3A649] w-24"
              />
            </div>
          </div>
        </div>

        {/* ACTIVE MATRIX TOOLBAR */}
        <div className="p-2.5 rounded-lg bg-[#262626] border border-[#3D4028] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-[#A3A649]" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#A3A649]">
              Rewire Matrix for this Entry:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {/* Tool 0: Psychiatric Decentering Station (Vent-to-Clarity) */}
            <button
              id="entry-action-psychiatric-decenter"
              onClick={() => setIsPsychiatricStationOpen(prev => !prev)}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors cursor-pointer border ${
                isPsychiatricStationOpen
                  ? "bg-[#3D4028] border-[#A3A649] text-[#A3A649] font-bold"
                  : "bg-[#181818] border-[#3D4028] text-[#8C8C8C] hover:text-white"
              }`}
              title="Turn raw venting into facts, circle of control, and calm agency"
            >
              <BrainCircuit className="w-3 h-3 text-[#A3A649]" />
              <span>{isPsychiatricStationOpen ? "Close Decentering" : "Vent-to-Clarity"}</span>
            </button>

            {/* Tool 1: Reset Room with this Entry context */}
            <button
              id="entry-action-reset-room"
              onClick={() => onOpenResetRoom && onOpenResetRoom({
                title: currentEntry.title || "Untitled Entry",
                content: currentEntry.content,
                entryId: currentEntry.id,
                mood: currentEntry.mood,
              })}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors cursor-pointer border bg-[#181818] border-[#3D4028] text-[#8C8C8C] hover:text-white"
              title="Launch Guided Stress Reset using this entry's content"
            >
              <Activity className="w-3 h-3 text-[#A3A649]" />
              <span>Stress Reset</span>
            </button>

            {/* Tool 2: Inline Thought Untangler */}
            <button
              id="entry-action-untangle-thought"
              onClick={() => setIsInlinePrunerOpen(prev => !prev)}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors cursor-pointer border ${
                isInlinePrunerOpen 
                  ? "bg-[#3D4028] border-[#AD3D30] text-[#AD3D30] font-bold" 
                  : "bg-[#181818] border-[#3D4028] text-[#8C8C8C] hover:text-white"
              }`}
              title="Untangle recurring or catastrophic thought patterns from this entry"
            >
              <Scissors className="w-3 h-3 text-[#AD3D30]" />
              <span>Untangle Thought</span>
            </button>

            {/* Tool 3: Mine Glimmers */}
            <button
              id="entry-action-mine-glimmers"
              onClick={handleRunInlineGlimmerMining}
              disabled={isInlineMining || !currentEntry.content.trim()}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors cursor-pointer border bg-[#181818] border-[#3D4028] text-[#8C8C8C] hover:text-white disabled:opacity-40"
              title="Extract micro-moments of joy, peace, and gratitude from what you wrote"
            >
              {isInlineMining ? (
                <RefreshCw className="w-3 h-3 animate-spin text-[#A3A649]" />
              ) : (
                <Sun className="w-3 h-3 text-[#A3A649]" />
              )}
              <span>Mine Glimmers</span>
            </button>

            {/* Tool 4: 3-Lens Perspective Shift */}
            <button
              id="entry-action-3-lens-shift"
              onClick={handleRun3LensPerspectiveShift}
              disabled={isShiftingPerspective || !currentEntry.content.trim()}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors cursor-pointer border bg-[#181818] border-[#3D4028] text-[#8C8C8C] hover:text-white disabled:opacity-40"
              title="Generate 3 perspective lenses (Compassion, Horizon, Agency) on this entry"
            >
              {isShiftingPerspective ? (
                <RefreshCw className="w-3 h-3 animate-spin text-[#A3A649]" />
              ) : (
                <Compass className="w-3 h-3 text-[#A3A649]" />
              )}
              <span>3-Lens Shift</span>
            </button>

            {/* Tool 5: Quick Calming Breath */}
            <button
              id="entry-action-calming-breath"
              onClick={() => setIsBreathGuideOpen(prev => !prev)}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors cursor-pointer border ${
                isBreathGuideOpen ? "bg-[#3D4028] border-[#A3A649] text-[#A3A649] font-bold" : "bg-[#181818] border-[#3D4028] text-[#8C8C8C] hover:text-white"
              }`}
              title="Toggle guided centering breath bar"
            >
              <Wind className="w-3 h-3 text-[#A3A649]" />
              <span>{isBreathGuideOpen ? "Close Breath" : "Calm Breath"}</span>
            </button>
          </div>
        </div>

        {/* INLINE CALMING BREATH GUIDE */}
        {isBreathGuideOpen && (
          <div className="p-3 rounded-lg bg-[#262626] border border-[#3D4028] flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-12 h-12">
                <div className={`absolute inset-0 rounded-full border-2 border-[#A3A649] transition-transform duration-1000 ${
                  breathPhase === "Inhale" ? "scale-110 bg-[#3D4028]/50" : breathPhase === "Exhale" ? "scale-75 bg-[#181818]" : "scale-100"
                }`} />
                <span className="relative text-xs font-bold text-white">{breathSeconds}s</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#A3A649] uppercase tracking-wider">
                  Box Breathing Cycle: {breathPhase}
                </p>
                <p className="text-[11px] text-[#8C8C8C]">
                  {breathPhase === "Inhale" && "Draw air into belly smoothly through your nose..."}
                  {breathPhase === "Hold" && "Retain the breath with open, unclinched jaw..."}
                  {breathPhase === "Exhale" && "Release gently through parted lips..."}
                  {breathPhase === "Pause" && "Rest in neutral somatic stillness..."}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsBreathGuideOpen(false)}
              className="px-2.5 py-1 rounded bg-[#181818] border border-[#3D4028] hover:border-[#A3A649] text-[#8C8C8C] hover:text-white text-[11px] cursor-pointer"
            >
              Done
            </button>
          </div>
        )}

        {/* INLINE THOUGHT UNTANGLER CARD */}
        {isInlinePrunerOpen && (
          <div className="p-3.5 rounded-lg bg-[#262626] border border-[#AD3D30] space-y-3 animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[#AD3D30] font-semibold text-xs">
                <Scissors className="w-3.5 h-3.5 text-[#AD3D30]" />
                <span>Untangle a Stuck Thought from this Reflection</span>
              </div>
              <button
                onClick={() => setIsInlinePrunerOpen(false)}
                className="text-[#8C8C8C] hover:text-white text-xs font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] text-[#8C8C8C] block">
                What heavy, anxious, or self-critical thought is showing up in this entry?
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inlineThoughtInput}
                  onChange={e => setInlineThoughtInput(e.target.value)}
                  placeholder="e.g. If I don't get this done today, everything is ruined..."
                  className="flex-1 px-3 py-1.5 text-xs bg-[#181818] border border-[#3D4028] rounded focus:outline-hidden focus:border-[#AD3D30] text-[#e2e8f0] placeholder-[#8C8C8C]/50"
                />
                <button
                  onClick={handleRunInlineUntangle}
                  disabled={isUntanglingInline}
                  className="px-3 py-1.5 rounded bg-[#AD3D30] hover:bg-[#AD3D30]/80 text-white text-xs font-semibold transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shrink-0"
                >
                  {isUntanglingInline ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Untangling...</span>
                    </>
                  ) : (
                    <>
                      <Scissors className="w-3 h-3" />
                      <span>Untangle</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Result of Inline Untangling */}
            {inlineUntangleResult && (
              <div className="p-3 rounded-lg bg-[#181818] border border-[#3D4028] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#AD3D30] uppercase tracking-wider bg-[#3D4028] px-2 py-0.5 rounded">
                    Identified Pattern: {inlineUntangleResult.distortionCategory}
                  </span>
                  <span className="text-[11px] text-[#A3A649] font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Reframed
                  </span>
                </div>

                <div className="space-y-1">
                  <p className="text-[11px] text-[#8C8C8C]">Grounded, Reframed Truth:</p>
                  <p className="text-xs italic text-[#e2e8f0] bg-[#262626] p-2.5 rounded border border-[#3D4028]">
                    "{inlineUntangleResult.newRewiredBelief}"
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    onClick={() => handleAppendToEntry(`**Untangled Thought (${inlineUntangleResult.distortionCategory}):**\n> "${inlineUntangleResult.newRewiredBelief}"`)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#262626] hover:bg-[#3D4028] text-[#A3A649] text-[11px] font-medium border border-[#3D4028] transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Insert into Entry</span>
                  </button>

                  <button
                    onClick={handleSaveInlineUntangledToArchive}
                    disabled={isInlineSavedToArchive}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium border transition-colors cursor-pointer ${
                      isInlineSavedToArchive 
                        ? "bg-[#3D4028] text-[#A3A649] border-[#A3A649]" 
                        : "bg-[#AD3D30] hover:bg-[#AD3D30]/80 text-white border-transparent"
                    }`}
                  >
                    {isInlineSavedToArchive ? (
                      <>
                        <Check className="w-3 h-3 text-[#A3A649]" />
                        <span>Saved to Untangled Archive</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3 h-3" />
                        <span>Save to Untangled Archive</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* INLINE 3-LENS PERSPECTIVE SHIFT TRAY */}
        {perspectiveReframes && (
          <div className="p-3.5 rounded-lg bg-[#262626] border border-[#3D4028] space-y-3 animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[#A3A649] font-semibold text-xs">
                <Compass className="w-3.5 h-3.5 text-[#A3A649]" />
                <span>3-Lens Perspective Shift on this Entry</span>
              </div>
              <button
                onClick={() => setPerspectiveReframes(null)}
                className="text-[#8C8C8C] hover:text-white text-xs font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {perspectiveDarkSentence && (
              <p className="text-[11px] text-[#8C8C8C] italic">
                Identified weight: "{perspectiveDarkSentence}"
              </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {perspectiveReframes.map((reframe, idx) => (
                <div key={idx} className="p-3 rounded bg-[#181818] border border-[#3D4028] flex flex-col justify-between space-y-2">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#A3A649] bg-[#3D4028] px-1.5 py-0.5 rounded inline-block">
                      {reframe.title || reframe.lens}
                    </span>
                    <p className="text-xs text-[#e2e8f0] leading-relaxed">
                      "{reframe.text}"
                    </p>
                  </div>
                  <button
                    onClick={() => handleAppendToEntry(`**Perspective Shift (${reframe.title || reframe.lens}):**\n> "${reframe.text}"`)}
                    className="flex items-center justify-center gap-1 w-full py-1 text-[10px] font-semibold text-[#A3A649] hover:bg-[#3D4028] rounded border border-[#3D4028] transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Insert Lens</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* INLINE MINED GLIMMERS TRAY */}
        {(minedGlimmers.length > 0 || glimmerMineMsg) && (
          <div className="p-3 rounded-lg bg-[#262626] border border-[#3D4028] space-y-2.5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[#A3A649] font-semibold text-xs">
                <Sun className="w-3.5 h-3.5 text-[#A3A649]" />
                <span>Glimmers Mined from this Reflection</span>
              </div>
              <button
                onClick={() => { setMinedGlimmers([]); setGlimmerMineMsg(null); }}
                className="text-[#8C8C8C] hover:text-white text-xs font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {glimmerMineMsg && (
              <p className="text-[11px] text-[#A3A649] font-medium">{glimmerMineMsg}</p>
            )}

            {minedGlimmers.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {minedGlimmers.map((glimmer, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center gap-2 p-2 rounded bg-[#181818] border border-[#3D4028] text-xs text-[#e2e8f0]"
                  >
                    <span className="flex items-center gap-1.5">
                      <Sun className="w-3 h-3 text-[#A3A649] shrink-0" />
                      <span>{glimmer.text}</span>
                    </span>
                    <div className="flex items-center gap-1 pl-2 border-l border-[#3D4028]">
                      <button
                        onClick={() => handleSaveMinedGlimmer(idx)}
                        disabled={glimmer.saved}
                        className={`p-1 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                          glimmer.saved 
                            ? "bg-[#3D4028] text-[#A3A649]" 
                            : "bg-[#262626] hover:bg-[#3D4028] text-white"
                        }`}
                        title={glimmer.saved ? "Saved to vault" : "Save to Glimmer Vault"}
                      >
                        {glimmer.saved ? <Check className="w-3 h-3" /> : <Save className="w-3 h-3" />}
                      </button>
                      <button
                        onClick={() => handleAppendToEntry(`**Mined Glimmer:** "${glimmer.text}"`)}
                        className="p-1 rounded text-[10px] font-semibold bg-[#262626] hover:bg-[#3D4028] text-[#A3A649] transition-colors cursor-pointer"
                        title="Insert into text"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* GUIDED PROMPTS CAROUSEL */}
        <div className="p-2 rounded-lg bg-[#262626] border border-[#3D4028] flex items-center gap-2 overflow-x-auto text-xs scrollbar-none">
          <span className="text-[#A3A649] font-bold shrink-0 flex items-center gap-1 text-[11px]">
            <Lightbulb className="w-3.5 h-3.5 text-[#A3A649]" /> Prompts:
          </span>
          {PROMPT_SUGGESTIONS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleInsertPrompt(p)}
              className="shrink-0 px-2.5 py-1 rounded bg-[#181818] border border-[#3D4028] hover:border-[#A3A649] text-[#8C8C8C] hover:text-white transition-colors text-left text-[11px] cursor-pointer"
            >
              {p}
            </button>
          ))}
        </div>

        {/* WRITING CANVAS (NO LINE NUMBERS) */}
        <div className="p-3.5 rounded-lg bg-[#262626] border border-[#3D4028] space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-bold text-[#A3A649] flex items-center gap-1.5">
              <span className="text-[#AD3D30]">##</span> Thoughts & Reflection
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                id="voice-dictation-btn"
                onClick={toggleVoiceInput}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border transition-all cursor-pointer ${
                  isListening
                    ? "bg-[#AD3D30] text-white border-[#AD3D30] animate-pulse"
                    : "bg-[#181818] hover:bg-[#3D4028] text-[#A3A649] border-[#3D4028]"
                }`}
                title={isListening ? "Listening... click to stop recording" : "Speak hands-free (Voice-to-Text)"}
              >
                {isListening ? <MicOff className="w-3 h-3 text-white" /> : <Mic className="w-3 h-3" />}
                <span>{isListening ? "Listening..." : "Dictate"}</span>
              </button>

              <button
                type="button"
                id="export-markdown-btn"
                onClick={handleExportMarkdown}
                className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#181818] hover:bg-[#3D4028] text-[#8C8C8C] hover:text-white border border-[#3D4028] transition-colors cursor-pointer"
                title="Download formatted Markdown (.md) note"
              >
                <Download className="w-3 h-3" />
                <span>Export .md</span>
              </button>

              <button
                type="button"
                id="print-entry-btn"
                onClick={() => window.print()}
                className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#181818] hover:bg-[#3D4028] text-[#8C8C8C] hover:text-white border border-[#3D4028] transition-colors cursor-pointer"
                title="Print or Save as PDF"
              >
                <Printer className="w-3 h-3" />
                <span>Print</span>
              </button>
            </div>
          </div>
          <textarea
            id="journal-content-textarea"
            value={currentEntry.content}
            onChange={handleContentChange}
            placeholder="Write your thoughts, feelings, challenges, or experiences freely here..."
            rows={10}
            className="w-full bg-transparent text-[#e2e8f0] text-xs sm:text-[13px] font-mono leading-relaxed placeholder-[#8C8C8C]/50 focus:outline-hidden resize-y border-none"
          />

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#8C8C8C] border-t border-[#3D4028] gap-2">
            <div className="flex items-center gap-3">
              <span>{wordCount} {wordCount === 1 ? "word" : "words"}</span>
              <span>·</span>
              <span>{charCount} characters</span>
            </div>
            <div className="flex items-center gap-2">
              <span>Created {new Date(currentEntry.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
            </div>
          </div>
        </div>

        {/* CONNECTED MATRIX ARTIFACTS FOR THIS ENTRY */}
        {(linkedSessions.length > 0 || linkedLoops.length > 0) && (
          <div className="p-3 rounded-lg bg-[#262626] border border-[#3D4028] space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#A3A649] flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-[#A3A649]" />
              <span>Connected Neuroplastic Artifacts for this Entry</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {linkedSessions.map(s => (
                <span
                  key={s.id}
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-[#181818] border border-[#3D4028] text-xs text-[#e2e8f0]"
                >
                  <Activity className="w-3 h-3 text-[#A3A649]" />
                  <span>Stress Reset: {s.affectLabel || s.mode}</span>
                </span>
              ))}
              {linkedLoops.map(l => (
                <span
                  key={l.id}
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-[#181818] border border-[#AD3D30] text-xs text-[#e2e8f0]"
                >
                  <Scissors className="w-3 h-3 text-[#AD3D30]" />
                  <span>Untangled: {l.distortionCategory}</span>
                </span>
              ))}
            </div>
          </div>
        )}
        </div>

        {/* Child 3: Bottom Window Statusbar for Journal */}
        <div className="h-6 bg-[#181818] border-t border-[#3D4028] px-2.5 flex items-center justify-between text-[10px] font-mono text-[#8C8C8C] shrink-0 select-none">
          <div className="flex items-center gap-2">
            <span className="bg-[#262626] border border-[#3D4028] text-[#A3A649] font-bold px-1.5 py-0.5 rounded text-[9px]">
              [ NORMAL ]
            </span>
            <span className="text-white font-medium">ana://entry.md</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Md</span>
            <span className="text-white">{wordCount}w</span>
            <span>utf-8</span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. BOTTOM SEPARATED WINDOW: AI ASSISTANT */}
      {/* ========================================================= */}
      <div 
        className="flex flex-col flex-1 min-h-0 bg-[#1e1e1e] border border-[#3D4028] rounded-xl overflow-hidden shadow-xl font-mono select-none"
        id="ai-assistant-pane"
      >
        {/* Child 1: AI Assistant Tab Bar */}
        <div className="h-8 bg-[#181818] border-b border-[#3D4028] px-2.5 flex items-center justify-between shrink-0 text-xs select-none">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-[#262626] border-t-2 border-t-[#A3A649] border-x border-[#3D4028] rounded-t text-slate-200 font-semibold text-[11px]">
              <Bot className="w-3.5 h-3.5 text-[#A3A649]" />
              <span className="text-[#A3A649]">ana://ai-assistant.agent</span>
            </div>
            <span className="text-[9px] font-mono px-1.5 py-0.5 bg-[#181818] text-[#8C8C8C] rounded border border-[#3D4028] hidden sm:inline">
              gemini-3.8-flash
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Mode selector */}
            <div className="flex items-center bg-[#262626] p-0.5 rounded border border-[#3D4028] text-[10px]">
              <button
                onClick={() => setChatMode("reflect")}
                className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                  chatMode === "reflect" ? "bg-[#3D4028] text-[#A3A649] font-bold" : "text-[#8C8C8C] hover:text-white"
                }`}
              >
                Reflect
              </button>
              <button
                onClick={() => setChatMode("brainstorm")}
                className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                  chatMode === "brainstorm" ? "bg-[#3D4028] text-[#A3A649] font-bold" : "text-[#8C8C8C] hover:text-white"
                }`}
              >
                Brainstorm
              </button>
              <button
                onClick={() => setChatMode("mentor")}
                className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                  chatMode === "mentor" ? "bg-[#3D4028] text-[#A3A649] font-bold" : "text-[#8C8C8C] hover:text-white"
                }`}
              >
                Mentor
              </button>
            </div>

            {/* Empirical Telemetry Button */}
            <button
              id="generate-telemetry-button"
              onClick={handleExtractTelemetry}
              disabled={isExtractingTelemetry || !currentEntry.content.trim()}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#10b981]/20 hover:bg-[#10b981] text-[#10b981] hover:text-black border border-[#10b981]/40 text-[10px] font-medium transition-colors disabled:opacity-50 cursor-pointer"
              title="Quantify subjective feelings, habits & next-day impact"
            >
              {isExtractingTelemetry ? (
                <>
                  <RefreshCw className="w-2.5 h-2.5 animate-spin text-[#10b981]" />
                  <span>Quantifying...</span>
                </>
              ) : (
                <>
                  <BarChart3 className="w-2.5 h-2.5 text-[#10b981]" />
                  <span>Stats</span>
                </>
              )}
            </button>

            {/* AI Insights Button */}
            <button
              id="generate-summary-button"
              onClick={handleGenerateSummary}
              disabled={isSummarizing || (!currentEntry.content && currentEntry.messages.length === 0)}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#262626] hover:bg-[#3D4028] text-[#A3A649] border border-[#3D4028] text-[10px] font-medium transition-colors disabled:opacity-50 cursor-pointer"
              title="Generate AI Summary, Key Takeaways & Emotional Analysis"
            >
              {isSummarizing ? (
                <>
                  <RefreshCw className="w-2.5 h-2.5 animate-spin text-[#A3A649]" />
                  <span>Reflecting...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-2.5 h-2.5 text-[#A3A649]" />
                  <span>AI Insights</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Child 2: Conversation Stream & AI Insights Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-2.5 sm:p-3 space-y-2.5 scrollbar-thin bg-[#181818]/60">
          {/* Gemini Reflection Summary Card (if generated) */}
          {currentEntry.aiSummary && (
            <div className="p-2.5 rounded-lg bg-[#262626] border border-[#3D4028] space-y-2">
              <div className="flex items-center justify-between border-b border-[#3D4028] pb-1.5">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#A3A649]" />
                  <h4 className="font-semibold text-xs text-white">Gemini Reflection Synthesis</h4>
                </div>
                {currentEntry.aiSummary.modelUsed && (
                  <span className="text-[9px] font-mono text-[#8C8C8C] bg-[#181818] px-1.5 py-0.5 rounded border border-[#3D4028]">
                    {currentEntry.aiSummary.modelUsed}
                  </span>
                )}
              </div>

              <div className="space-y-0.5">
                <p className="text-[10px] font-semibold text-[#A3A649]">Summary:</p>
                <p className="text-xs text-[#e2e8f0] leading-relaxed">
                  {currentEntry.aiSummary.summary}
                </p>
              </div>

              {currentEntry.aiSummary.keyTakeaways.length > 0 && (
                <div className="space-y-0.5">
                  <p className="text-[10px] font-semibold text-[#A3A649] flex items-center gap-1">
                    <ListChecks className="w-3 h-3 text-[#A3A649]" /> Key Takeaways:
                  </p>
                  <ul className="space-y-0.5 pl-4 list-disc text-xs text-[#8C8C8C]">
                    {currentEntry.aiSummary.keyTakeaways.map((takeaway, idx) => (
                      <li key={idx}>
                        <span className="text-[#e2e8f0]">{takeaway}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {currentEntry.aiSummary.reflectionQuestions.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold text-[#AD3D30]">Questions to Ponder:</p>
                  <div className="space-y-1">
                    {currentEntry.aiSummary.reflectionQuestions.map((q, idx) => (
                      <div
                        key={idx}
                        className="p-1.5 rounded bg-[#181818] border border-[#3D4028] flex items-center justify-between text-xs text-[#8C8C8C]"
                      >
                        <span className="text-[#e2e8f0] italic text-[11px]">"{q}"</span>
                        <button
                          onClick={() => handleAppendToEntry(`**Reflecting on:** "${q}"\n`)}
                          className="text-[9px] text-[#A3A649] hover:underline font-semibold shrink-0 ml-2"
                        >
                          Insert
                        </button>
                      </div>
                    ))}
                  </div>
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

          {/* Conversation Stream */}
          {currentEntry.messages.length === 0 ? (
            <div className="text-center py-4 px-2 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-[#262626] border border-[#3D4028] text-[#A3A649] flex items-center justify-center mx-auto">
                <Sparkles className="w-4 h-4" />
              </div>
              <p className="text-xs font-semibold text-white">Start an AI reflection turn</p>
              <p className="text-[10px] text-[#8C8C8C] max-w-xs mx-auto leading-snug">
                Ask Gemini to untangle catastrophic thoughts, find positive glimmers, or reframe with self-compassion.
              </p>

              {/* Starter chips */}
              <div className="flex flex-wrap justify-center gap-1.5 pt-1">
                {CHAT_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    id={`chat-prompt-chip-${i}`}
                    onClick={() => handleSendMessage(prompt)}
                    className="px-2 py-0.5 rounded bg-[#262626] border border-[#3D4028] text-[10px] text-[#8C8C8C] hover:text-white hover:border-[#A3A649] transition-all cursor-pointer text-left"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            currentEntry.messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role !== "user" && (
                  <div className="w-5 h-5 rounded bg-[#3D4028] border border-[#A3A649] text-[#A3A649] flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3 h-3" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-lg p-2.5 text-xs ${
                    msg.role === "user"
                      ? "bg-[#3D4028] text-white border border-[#A3A649]/40"
                      : "bg-[#262626] border border-[#3D4028] text-[#e2e8f0]"
                  }`}
                >
                  {msg.role === "user" ? (
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  ) : (
                    <div className="markdown-content">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  )}

                  <div className="mt-1 flex items-center justify-between gap-2 text-[8px] text-[#8C8C8C]">
                    <span>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {msg.modelUsed && (
                      <span className="font-mono text-[#A3A649]">{msg.modelUsed}</span>
                    )}
                  </div>
                </div>

                {msg.role === "user" && (
                  <div className="w-5 h-5 rounded bg-[#262626] border border-[#3D4028] text-[#8C8C8C] flex items-center justify-center shrink-0 mt-0.5">
                    <UserIcon className="w-3 h-3" />
                  </div>
                )}
              </div>
            ))
          )}

          {/* AI Thinking Animation */}
          {isAiResponding && (
            <div className="flex gap-2 items-center">
              <div className="w-5 h-5 rounded bg-[#3D4028] border border-[#A3A649] text-[#A3A649] flex items-center justify-center shrink-0">
                <Bot className="w-3 h-3 animate-pulse" />
              </div>
              <div className="bg-[#262626] border border-[#3D4028] rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 text-[10px] text-[#8C8C8C]">
                <RefreshCw className="w-3 h-3 animate-spin text-[#A3A649]" />
                <span>Gemini is reflecting on your entry...</span>
              </div>
            </div>
          )}

          {/* AI Error Notification */}
          {aiError && (
            <div className="p-2 rounded bg-[#262626] border border-[#AD3D30] text-[#AD3D30] text-[10px] flex items-center gap-1.5">
              <AlertCircle className="w-3 h-3 shrink-0 text-[#AD3D30]" />
              <span>{aiError}</span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Child 3: Fixed Chat Input Bar */}
        <div className="p-2 bg-[#181818] border-t border-[#3D4028] flex items-center gap-1.5 shrink-0">
          <input
            id="chat-message-input"
            type="text"
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={`Ask Gemini for reflections or reframes in ${chatMode} mode...`}
            disabled={isAiResponding}
            className="flex-1 px-2.5 py-1 rounded bg-[#262626] border border-[#3D4028] focus:outline-hidden focus:border-[#A3A649] text-xs text-[#e2e8f0] placeholder-[#8C8C8C]/50"
          />
          <button
            id="chat-send-button"
            onClick={() => handleSendMessage()}
            disabled={!chatInput.trim() || isAiResponding}
            className="px-2.5 py-1 rounded bg-[#AD3D30] hover:bg-[#AD3D30]/80 text-white text-xs font-semibold transition-all flex items-center gap-1 shadow-xs disabled:opacity-40 cursor-pointer"
          >
            <Send className="w-3 h-3" />
            <span className="hidden sm:inline">Reflect</span>
          </button>
        </div>
      </div>
    </>
  );
};
