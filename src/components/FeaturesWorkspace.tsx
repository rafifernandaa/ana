import React, { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { User } from "firebase/auth";
import { 
  Activity, 
  Scissors, 
  Sun, 
  BrainCircuit, 
  SunMedium, 
  Wind, 
  Zap, 
  Sparkles, 
  CheckCircle2, 
  RefreshCw, 
  Flame, 
  Play, 
  Pause, 
  ArrowRight, 
  ShieldCheck, 
  Plus, 
  Trash2,
  Smile,
  TreePine,
  Award,
  Heart,
  AlertCircle,
  Copy,
  ChevronRight,
  BookOpen
} from "lucide-react";
import { 
  ResetSession, 
  PrunedThoughtLoop, 
  GlimmerAnchor, 
  CircadianEntry, 
  PsychiatricDistillation,
  JournalEntry,
  SomaticBodyMap,
  CognitiveReframeOption
} from "../types";
import { 
  extractReframeAndGlimmerWithGemini, 
  pruneThoughtLoopWithGemini, 
  extractGlimmersWithGemini 
} from "../lib/geminiService";
import { BodyMapSelector } from "./BodyMapSelector";
import { PsychiatricDecenteringStation } from "./PsychiatricDecenteringStation";
import { CircadianDayBoundary } from "./CircadianDayBoundary";

export type FeatureSubTab = "reset_room" | "pruner" | "glimmer_vault" | "decentering" | "circadian";

interface FeaturesWorkspaceProps {
  user: User | null;
  activeEntry: JournalEntry | null;
  sessions: ResetSession[];
  prunedLoops: PrunedThoughtLoop[];
  glimmers: GlimmerAnchor[];
  circadianEntries: CircadianEntry[];
  psychiatricDistillations: PsychiatricDistillation[];
  onSaveResetSession: (session: ResetSession) => Promise<void>;
  onSavePrunedLoop: (loop: PrunedThoughtLoop) => Promise<void>;
  onSaveGlimmer: (glimmer: GlimmerAnchor) => Promise<void>;
  onSaveCircadianEntry: (entry: CircadianEntry) => Promise<void>;
  onSavePsychiatricDistillation: (dist: PsychiatricDistillation) => Promise<void>;
  onInsertToJournal?: (text: string) => void;
  initialSubTab?: FeatureSubTab;
}

const DISTORTION_PRESETS = [
  { text: "I have to do everything perfectly or I'm a complete failure.", label: "All-or-Nothing" },
  { text: "They haven't replied yet, which means they are secretly mad at me.", label: "Mind Reading" },
  { text: "Something terrible is definitely going to happen next week.", label: "Catastrophizing" },
  { text: "I should be much further ahead in life than I am right now.", label: "Should Statement" },
  { text: "Everyone else has it figured out except me.", label: "Comparison / Personalization" },
];

const GLIMMER_CATEGORIES = {
  sensory: { label: "Sensory Calm", icon: Sparkles, color: "text-[#A3A649] border-[#A3A649]" },
  connection: { label: "Warm Connection", icon: Heart, color: "text-[#AD3D30] border-[#AD3D30]" },
  gratitude: { label: "Quiet Gratitude", icon: Smile, color: "text-[#A3A649] border-[#A3A649]" },
  nature: { label: "Nature & Awe", icon: TreePine, color: "text-[#3D4028] border-[#3D4028]" },
  achievement: { label: "Micro Victory", icon: Award, color: "text-[#A3A649] border-[#A3A649]" },
  serenity: { label: "Peace & Grounding", icon: Wind, color: "text-[#8C8C8C] border-[#8C8C8C]" },
};

export const FeaturesWorkspace: React.FC<FeaturesWorkspaceProps> = ({
  user,
  activeEntry,
  sessions,
  prunedLoops,
  glimmers,
  circadianEntries,
  psychiatricDistillations,
  onSaveResetSession,
  onSavePrunedLoop,
  onSaveGlimmer,
  onSaveCircadianEntry,
  onSavePsychiatricDistillation,
  onInsertToJournal,
  initialSubTab = "reset_room",
}) => {
  const [activeSubTab, setActiveSubTab] = useState<FeatureSubTab>(initialSubTab);

  // ==========================================
  // 1. Somatic Reset Room Inline State
  // ==========================================
  const [resetStep, setResetStep] = useState<number>(0);
  const [breathingPhase, setBreathingPhase] = useState<"inhale" | "hold1" | "exhale" | "hold2">("inhale");
  const [breathTimer, setBreathTimer] = useState<number>(4);
  const [isBreathingRunning, setIsBreathingRunning] = useState<boolean>(true);
  const [bodyMap, setBodyMap] = useState<SomaticBodyMap>({
    zones: ["shoulders"],
    intensity: 3,
  });
  const [affectLabel, setAffectLabel] = useState<string>("Overwhelmed");
  const [ventText, setVentText] = useState<string>("");
  const [extractedSentence, setExtractedSentence] = useState<string>("");
  const [reframes, setReframes] = useState<CognitiveReframeOption[]>([]);
  const [chosenReframeIndex, setChosenReframeIndex] = useState<number>(0);
  const [resetGlimmer, setResetGlimmer] = useState<string>("");
  const [isGeneratingReframe, setIsGeneratingReframe] = useState<boolean>(false);
  const [resetError, setResetError] = useState<string | null>(null);

  // Breathing pacer loop
  useEffect(() => {
    if (activeSubTab !== "reset_room" || resetStep !== 0 || !isBreathingRunning) return;
    const interval = setInterval(() => {
      setBreathTimer((prev) => {
        if (prev <= 1) {
          setBreathingPhase((curr) => {
            if (curr === "inhale") return "hold1";
            if (curr === "hold1") return "exhale";
            if (curr === "exhale") return "hold2";
            return "inhale";
          });
          return 4;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeSubTab, resetStep, isBreathingRunning]);

  // Reset Room AI Reframe trigger
  const handleAnalyzeReset = async () => {
    if (!ventText.trim()) return;
    setIsGeneratingReframe(true);
    setResetError(null);
    try {
      const res = await extractReframeAndGlimmerWithGemini({
        affectLabel,
        writingContent: ventText,
        bodyMapZones: bodyMap.zones,
      });
      setExtractedSentence(res.darkestSentence || ventText.slice(0, 80));
      setReframes(res.reframes || []);
      setResetGlimmer(res.glimmerCandidate || "A breath of calm in this moment.");
      setResetStep(3);
    } catch (err: any) {
      console.error(err);
      setResetError(err.message || "Failed to generate neuroplastic reframes.");
    } finally {
      setIsGeneratingReframe(false);
    }
  };

  const handleFinishResetSession = async () => {
    const newSession: ResetSession = {
      id: "session-" + Date.now(),
      userId: user?.uid || "guest",
      mode: "full",
      bodyMap,
      affectLabel,
      writingContent: ventText,
      extractedDarkSentence: extractedSentence,
      reframes,
      chosenReframeIndex,
      glimmer: resetGlimmer,
      beforeWord: affectLabel,
      afterWord: "Grounded",
      durationMs: 180000,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      sourceEntryId: activeEntry?.id || null,
    };
    await onSaveResetSession(newSession);
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#AD3D30", "#A3A649", "#3D4028"],
    });
    setResetStep(5);
  };

  // ==========================================
  // 2. Synaptic Pruner Inline State
  // ==========================================
  const [pruneThoughtInput, setPruneThoughtInput] = useState<string>("");
  const [isPruning, setIsPruning] = useState<boolean>(false);
  const [prunerResult, setPrunerResult] = useState<{
    distortionCategory: string;
    neurologicalTrap: string;
    newRewiredBelief: string;
    neuroscienceFact: string;
  } | null>(null);
  const [rewiredInput, setRewiredInput] = useState<string>("");
  const [pruneSuccess, setPruneSuccess] = useState<boolean>(false);
  const [pruneError, setPruneError] = useState<string | null>(null);

  const handleAnalyzePrune = async () => {
    if (!pruneThoughtInput.trim()) return;
    setIsPruning(true);
    setPruneError(null);
    setPruneSuccess(false);
    try {
      const res = await pruneThoughtLoopWithGemini({ 
        thoughtText: pruneThoughtInput,
        context: activeEntry?.content 
      });
      setPrunerResult({
        distortionCategory: res.distortionCategory || "rumination",
        neurologicalTrap: res.identifiedDistortion || "Cognitive distortion",
        newRewiredBelief: res.rewiredBelief || "",
        neuroscienceFact: res.neuroscienceRationale || "",
      });
      setRewiredInput(res.rewiredBelief || "");
    } catch (err: any) {
      console.error(err);
      setPruneError(err.message || "Failed to analyze distortion.");
    } finally {
      setIsPruning(false);
    }
  };

  const handleCommitRewiredBelief = async () => {
    if (!rewiredInput.trim()) return;
    const newLoop: PrunedThoughtLoop = {
      id: "loop-" + Date.now(),
      userId: user?.uid || "guest",
      oldDistortion: pruneThoughtInput,
      distortionCategory: (prunerResult?.distortionCategory as any) || "catastrophizing",
      newRewiredBelief: rewiredInput,
      dissolvedAt: Date.now(),
    };
    await onSavePrunedLoop(newLoop);
    setPruneSuccess(true);
    confetti({
      particleCount: 45,
      spread: 60,
      origin: { y: 0.6 },
      colors: ["#A3A649", "#3D4028", "#AD3D30"],
    });
  };

  // ==========================================
  // 3. Glimmer Vault Inline State
  // ==========================================
  const [glimmerCategoryFilter, setGlimmerCategoryFilter] = useState<string>("all");
  const [newGlimmerText, setNewGlimmerText] = useState<string>("");
  const [newGlimmerCategory, setNewGlimmerCategory] = useState<keyof typeof GLIMMER_CATEGORIES>("sensory");
  const [isMiningGlimmers, setIsMiningGlimmers] = useState<boolean>(false);
  const [glimmerSuccessMsg, setGlimmerSuccessMsg] = useState<string | null>(null);

  const handleCreateGlimmer = async () => {
    if (!newGlimmerText.trim()) return;
    const item: GlimmerAnchor = {
      id: "glimmer-" + Date.now(),
      userId: user?.uid || "guest",
      text: newGlimmerText.trim(),
      category: newGlimmerCategory,
      createdAt: Date.now(),
      sourceType: "manual",
    };
    await onSaveGlimmer(item);
    setNewGlimmerText("");
    setGlimmerSuccessMsg("Glimmer safely anchored in your vault.");
    setTimeout(() => setGlimmerSuccessMsg(null), 3000);
    confetti({
      particleCount: 30,
      spread: 45,
      origin: { y: 0.7 },
      colors: ["#A3A649", "#AD3D30", "#3D4028"],
    });
  };

  const handleMineFromEntry = async () => {
    if (!activeEntry?.content?.trim()) {
      setGlimmerSuccessMsg("Write thoughts in your journal entry first to mine glimmers!");
      return;
    }
    setIsMiningGlimmers(true);
    try {
      const res = await extractGlimmersWithGemini({ text: activeEntry.content });
      const found = res.glimmers || [];
      if (found.length === 0) {
        setGlimmerSuccessMsg("No direct glimmers detected in current text. Keep observing subtle calm.");
      } else {
        for (const g of found) {
          const item: GlimmerAnchor = {
            id: "glimmer-" + Date.now() + "-" + Math.random().toString(36).substring(2, 5),
            userId: user?.uid || "guest",
            text: g.text,
            category: "gratitude",
            createdAt: Date.now(),
            sourceType: "mined_from_journal",
          };
          await onSaveGlimmer(item);
        }
        setGlimmerSuccessMsg(`Successfully mined and anchored ${found.length} glimmer${found.length > 1 ? "s" : ""}!`);
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.6 },
          colors: ["#A3A649", "#AD3D30"],
        });
      }
    } catch (err: any) {
      console.error(err);
      setGlimmerSuccessMsg("Failed to mine glimmers: " + err.message);
    } finally {
      setIsMiningGlimmers(false);
    }
  };

  const filteredGlimmers = glimmers.filter((g) => {
    if (glimmerCategoryFilter === "all") return true;
    return g.category === glimmerCategoryFilter;
  });

  return (
    <div 
      id="features-workspace-container"
      className="flex-1 flex flex-col h-full min-h-0 bg-[#121212] overflow-hidden font-mono select-none"
    >
      {/* Sub-Tabs Navigation along the top */}
      <div className="h-11 bg-[#181818] border-b border-[#3D4028] px-3 sm:px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-none py-1">
          {/* 1. Somatic Reset Room */}
          <button
            id="subtab-reset-room"
            onClick={() => setActiveSubTab("reset_room")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xs text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === "reset_room"
                ? "bg-[#262626] text-[#AD3D30] border-b-2 border-[#AD3D30]"
                : "text-[#8C8C8C] hover:text-white hover:bg-[#262626]"
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-[#AD3D30]" />
            <span>01 // SOMATIC RESET ROOM</span>
          </button>

          {/* 2. Synaptic Pruner */}
          <button
            id="subtab-pruner"
            onClick={() => setActiveSubTab("pruner")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xs text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === "pruner"
                ? "bg-[#262626] text-[#A3A649] border-b-2 border-[#A3A649]"
                : "text-[#8C8C8C] hover:text-white hover:bg-[#262626]"
            }`}
          >
            <Scissors className="w-3.5 h-3.5 text-[#A3A649]" />
            <span>02 // SYNAPTIC PRUNER</span>
          </button>

          {/* 3. Glimmer Vault */}
          <button
            id="subtab-glimmer-vault"
            onClick={() => setActiveSubTab("glimmer_vault")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xs text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === "glimmer_vault"
                ? "bg-[#262626] text-[#A3A649] border-b-2 border-[#A3A649]"
                : "text-[#8C8C8C] hover:text-white hover:bg-[#262626]"
            }`}
          >
            <Sun className="w-3.5 h-3.5 text-[#A3A649]" />
            <span>03 // GLIMMER VAULT</span>
          </button>

          {/* 4. Vent-to-Clarity Station */}
          <button
            id="subtab-decentering"
            onClick={() => setActiveSubTab("decentering")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xs text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === "decentering"
                ? "bg-[#262626] text-[#A3A649] border-b-2 border-[#A3A649]"
                : "text-[#8C8C8C] hover:text-white hover:bg-[#262626]"
            }`}
          >
            <BrainCircuit className="w-3.5 h-3.5 text-[#A3A649]" />
            <span>04 // VENT-TO-CLARITY</span>
          </button>

          {/* 5. Circadian Boundary */}
          <button
            id="subtab-circadian"
            onClick={() => setActiveSubTab("circadian")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xs text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === "circadian"
                ? "bg-[#262626] text-[#A3A649] border-b-2 border-[#A3A649]"
                : "text-[#8C8C8C] hover:text-white hover:bg-[#262626]"
            }`}
          >
            <SunMedium className="w-3.5 h-3.5 text-[#A3A649]" />
            <span>05 // CIRCADIAN BOUNDARY</span>
          </button>
        </div>

        <div className="hidden lg:flex items-center gap-2 text-[10px] text-[#8C8C8C]">
          <span className="text-[#A3A649]">●</span>
          <span>NON-MODAL EMBEDDED SYSTEM</span>
        </div>
      </div>

      {/* Main View Area for the Selected Feature */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-5 bg-[#181818]">
        {/* ========================================================= */}
        {/* 1. SOMATIC RESET ROOM                                      */}
        {/* ========================================================= */}
        {activeSubTab === "reset_room" && (
          <div className="max-w-4xl mx-auto space-y-4">
            {/* Header banner */}
            <div className="bg-[#262626] border border-[#3D4028] p-4 rounded-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#AD3D30]" />
                  <h2 className="text-sm font-bold text-white tracking-wider">
                    3-MINUTE SOMATIC STRESS RESET
                  </h2>
                </div>
                <p className="text-xs text-[#8C8C8C] mt-1">
                  Step-by-step neural decompression: Box breathing, somatic body map, unedited venting, and prefrontal cognitive reframing.
                </p>
              </div>

              <div className="flex items-center gap-1 text-[11px] bg-[#181818] border border-[#3D4028] px-2.5 py-1 rounded-xs">
                <span className="text-[#8C8C8C]">Phase:</span>
                <span className="text-[#AD3D30] font-bold">{resetStep + 1} of 6</span>
              </div>
            </div>

            {/* Step Navigation Bar */}
            <div className="grid grid-cols-6 gap-1 bg-[#262626] p-1.5 rounded-xs border border-[#3D4028] text-center text-[10px]">
              {["Grounding", "Body Scan", "Venting", "Reframing", "Glimmer", "Integration"].map((name, idx) => (
                <button
                  key={idx}
                  onClick={() => setResetStep(idx)}
                  className={`py-1 rounded-xs transition-colors cursor-pointer ${
                    resetStep === idx
                      ? "bg-[#3D4028] text-[#A3A649] font-bold border border-[#A3A649]/40"
                      : idx < resetStep
                      ? "text-[#10b981]"
                      : "text-[#8C8C8C] hover:text-white"
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>

            {/* PHASE 0: BOX BREATHING GROUNDING */}
            {resetStep === 0 && (
              <div className="bg-[#262626] border border-[#3D4028] p-6 rounded-xs space-y-6 text-center">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white tracking-wider">
                    PHASE 1 // PARASYMPATHETIC BOX BREATHING
                  </h3>
                  <p className="text-xs text-[#8C8C8C]">
                    Equalize inhalation, holding, and exhalation to signal safety to the autonomic nervous system.
                  </p>
                </div>

                {/* Visual Breathing Pacer Circle */}
                <div className="relative w-44 h-44 mx-auto flex items-center justify-center">
                  <div
                    className={`absolute inset-0 rounded-full border-2 transition-all duration-1000 ${
                      breathingPhase === "inhale"
                        ? "scale-110 border-[#A3A649] bg-[#A3A649]/10"
                        : breathingPhase === "exhale"
                        ? "scale-75 border-[#AD3D30] bg-[#AD3D30]/10"
                        : "scale-100 border-[#3D4028] bg-[#262626]"
                    }`}
                  />
                  <div className="relative z-10 text-center space-y-1">
                    <span className="text-2xl font-bold text-white font-mono">{breathTimer}s</span>
                    <p className="text-xs text-[#A3A649] uppercase font-bold tracking-widest">
                      {breathingPhase === "hold1" || breathingPhase === "hold2" ? "HOLD" : breathingPhase}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => setIsBreathingRunning(!isBreathingRunning)}
                    className="px-3 py-1.5 rounded-xs bg-[#181818] border border-[#3D4028] hover:border-[#A3A649] text-xs text-white cursor-pointer"
                  >
                    {isBreathingRunning ? "Pause Pacer" : "Resume Pacer"}
                  </button>
                  <button
                    onClick={() => setResetStep(1)}
                    className="px-4 py-1.5 rounded-xs bg-[#AD3D30] hover:bg-[#AD3D30]/80 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                  >
                    <span>Proceed to Body Scan</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* PHASE 1: SOMATIC BODY SCAN */}
            {resetStep === 1 && (
              <div className="bg-[#262626] border border-[#3D4028] p-5 rounded-xs space-y-5">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white tracking-wider">
                    PHASE 2 // SOMATIC TENSION SCAN
                  </h3>
                  <p className="text-xs text-[#8C8C8C]">
                    Where is your nervous system holding constriction right now?
                  </p>
                </div>

                {/* Body Map Selector */}
                <div className="bg-[#181818] p-4 rounded-xs border border-[#3D4028]">
                  <BodyMapSelector
                    value={bodyMap}
                    onChange={setBodyMap}
                  />
                </div>

                {/* Affect Labeling Chips */}
                <div className="space-y-2">
                  <span className="text-xs text-[#8C8C8C] font-semibold">Primary Affect Label:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {["Overwhelmed", "Anxious", "Self-Critical", "Exhausted", "Frustrated", "Stuck", "Hurt", "Lonely"].map((lbl) => (
                      <button
                        key={lbl}
                        onClick={() => setAffectLabel(lbl)}
                        className={`px-2.5 py-1 rounded-xs text-xs transition-colors cursor-pointer border ${
                          affectLabel === lbl
                            ? "bg-[#3D4028] text-[#A3A649] border-[#A3A649] font-bold"
                            : "bg-[#181818] text-[#8C8C8C] border-[#3D4028] hover:text-white"
                        }`}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-[#3D4028]">
                  <button
                    onClick={() => setResetStep(0)}
                    className="text-xs text-[#8C8C8C] hover:text-white cursor-pointer"
                  >
                    ← Back to Breathing
                  </button>
                  <button
                    onClick={() => setResetStep(2)}
                    className="px-4 py-1.5 rounded-xs bg-[#AD3D30] hover:bg-[#AD3D30]/80 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                  >
                    <span>Proceed to Venting</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* PHASE 2: UNFILTERED VENTING STREAM */}
            {resetStep === 2 && (
              <div className="bg-[#262626] border border-[#3D4028] p-5 rounded-xs space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white tracking-wider">
                    PHASE 3 // EXPRESSIVE VENTING STREAM
                  </h3>
                  <p className="text-xs text-[#8C8C8C]">
                    Dump the raw, unfiltered narrative without filtering or judgment. What is the catastrophic fear?
                  </p>
                </div>

                <textarea
                  id="reset-vent-input"
                  value={ventText}
                  onChange={(e) => setVentText(e.target.value)}
                  placeholder="I feel completely overloaded because... The worst part is..."
                  className="w-full h-44 bg-[#181818] border border-[#3D4028] rounded-xs p-3 text-xs sm:text-sm text-white placeholder-[#8C8C8C]/40 focus:outline-hidden focus:border-[#A3A649]"
                />

                {resetError && (
                  <div className="p-2 rounded-xs bg-[#AD3D30]/20 border border-[#AD3D30] text-xs text-[#AD3D30]">
                    {resetError}
                  </div>
                )}

                <div className="flex justify-between items-center pt-2">
                  <button
                    onClick={() => setResetStep(1)}
                    className="text-xs text-[#8C8C8C] hover:text-white cursor-pointer"
                  >
                    ← Back to Body Scan
                  </button>
                  <button
                    id="reset-analyze-btn"
                    onClick={handleAnalyzeReset}
                    disabled={isGeneratingReframe || !ventText.trim()}
                    className="px-4 py-1.5 rounded-xs bg-[#AD3D30] hover:bg-[#AD3D30]/80 text-white text-xs font-bold transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
                  >
                    {isGeneratingReframe ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Synthesizing Reframes...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Extract Reframes</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* PHASE 3: COGNITIVE REFRAMING */}
            {resetStep === 3 && (
              <div className="bg-[#262626] border border-[#3D4028] p-5 rounded-xs space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white tracking-wider">
                    PHASE 4 // PREFRONTAL REFRAMING
                  </h3>
                  <p className="text-xs text-[#8C8C8C]">
                    We isolated your core catastrophic sentence. Select the most grounding prefrontal lens.
                  </p>
                </div>

                {/* Dark sentence isolate */}
                <div className="bg-[#181818] border-l-4 border-[#AD3D30] p-3 rounded-xs text-xs text-white">
                  <span className="text-[10px] text-[#AD3D30] block font-bold uppercase tracking-wider">
                    Extracted Constriction Loop:
                  </span>
                  <p className="italic mt-1">"{extractedSentence}"</p>
                </div>

                {/* Reframing Cards */}
                <div className="space-y-2.5">
                  {reframes.map((ref, idx) => (
                    <div
                      key={idx}
                      onClick={() => setChosenReframeIndex(idx)}
                      className={`p-3 rounded-xs border transition-all cursor-pointer ${
                        chosenReframeIndex === idx
                          ? "bg-[#3D4028]/40 border-[#A3A649] ring-1 ring-[#A3A649]"
                          : "bg-[#181818] border-[#3D4028] hover:border-[#8C8C8C]"
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-[#A3A649]">{ref.title}</span>
                        <span className="text-[10px] text-[#8C8C8C] uppercase">{ref.lens}</span>
                      </div>
                      <p className="text-xs text-[#e2e8f0] mt-1.5 leading-relaxed">{ref.text}</p>
                      <p className="text-[10px] text-[#8C8C8C] mt-1">Rationale: {ref.rationale}</p>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    onClick={() => setResetStep(2)}
                    className="text-xs text-[#8C8C8C] hover:text-white cursor-pointer"
                  >
                    ← Edit Venting Stream
                  </button>
                  <button
                    onClick={() => setResetStep(4)}
                    className="px-4 py-1.5 rounded-xs bg-[#AD3D30] hover:bg-[#AD3D30]/80 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                  >
                    <span>Anchor Glimmer</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* PHASE 4: GLIMMER ANCHOR */}
            {resetStep === 4 && (
              <div className="bg-[#262626] border border-[#3D4028] p-5 rounded-xs space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white tracking-wider">
                    PHASE 5 // MICRO-GLIMMER INTEGRATION
                  </h3>
                  <p className="text-xs text-[#8C8C8C]">
                    Name one microscopic sensory cue in your immediate physical environment that feels neutral or pleasant.
                  </p>
                </div>

                <div className="bg-[#181818] p-3 rounded-xs border border-[#3D4028] space-y-2">
                  <div className="flex items-center gap-2 text-xs text-[#A3A649]">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="font-bold">Detected Everyday Micro-Glimmer:</span>
                  </div>
                  <input
                    type="text"
                    value={resetGlimmer}
                    onChange={(e) => setResetGlimmer(e.target.value)}
                    className="w-full bg-[#262626] border border-[#3D4028] rounded-xs p-2 text-xs text-white focus:outline-hidden focus:border-[#A3A649]"
                  />
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    onClick={() => setResetStep(3)}
                    className="text-xs text-[#8C8C8C] hover:text-white cursor-pointer"
                  >
                    ← Back to Reframing
                  </button>
                  <button
                    id="finish-reset-btn"
                    onClick={handleFinishResetSession}
                    className="px-4 py-1.5 rounded-xs bg-[#AD3D30] hover:bg-[#AD3D30]/80 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Complete Session & Persist</span>
                  </button>
                </div>
              </div>
            )}

            {/* PHASE 5: SUMMARY & INTEGRATION */}
            {resetStep === 5 && (
              <div className="bg-[#262626] border border-[#3D4028] p-6 rounded-xs space-y-5 text-center">
                <div className="w-12 h-12 rounded-xs bg-[#3D4028] border border-[#A3A649] text-[#A3A649] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white tracking-wider">
                    SOMATIC RESET COMPLETED & SYNCHRONIZED
                  </h3>
                  <p className="text-xs text-[#8C8C8C]">
                    Session archived in Cloud Firestore. Affect transition: <span className="text-[#AD3D30] font-bold">{affectLabel}</span> → <span className="text-[#10b981] font-bold">Grounded</span>.
                  </p>
                </div>

                {/* Option to inject into active journal */}
                {onInsertToJournal && (
                  <button
                    onClick={() => {
                      const md = `### Somatic Stress Reset Summary\n- **Affect Transition**: ${affectLabel} → Grounded\n- **Tension Zones**: ${bodyMap.zones.join(", ")}\n- **Selected Reframe**: ${reframes[chosenReframeIndex]?.text || ""}\n- **Anchored Glimmer**: ${resetGlimmer}`;
                      onInsertToJournal(md);
                      confetti({ particleCount: 30, spread: 40 });
                    }}
                    className="px-4 py-2 rounded-xs bg-[#181818] border border-[#A3A649] hover:bg-[#3D4028] text-xs text-[#A3A649] hover:text-white transition-colors cursor-pointer"
                  >
                    + Insert Reset Notes to Journal Entry
                  </button>
                )}

                <div className="pt-2">
                  <button
                    onClick={() => {
                      setResetStep(0);
                      setVentText("");
                    }}
                    className="text-xs text-[#8C8C8C] hover:text-white underline cursor-pointer"
                  >
                    Start a New Reset Session
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* 2. SYNAPTIC PRUNER                                         */}
        {/* ========================================================= */}
        {activeSubTab === "pruner" && (
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="bg-[#262626] border border-[#3D4028] p-4 rounded-xs">
              <div className="flex items-center gap-2">
                <Scissors className="w-4 h-4 text-[#A3A649]" />
                <h2 className="text-sm font-bold text-white tracking-wider">
                  SYNAPTIC PRUNING RITUAL (COGNITIVE UNTANGLER)
                </h2>
              </div>
              <p className="text-xs text-[#8C8C8C] mt-1">
                Deconstruct automated cognitive distortions and intentionally re-wire prefrontal synaptic beliefs.
              </p>
            </div>

            {/* Input & Presets */}
            <div className="bg-[#262626] border border-[#3D4028] p-4 rounded-xs space-y-3">
              <span className="text-xs text-[#8C8C8C] font-semibold">Distorted Thought or Rumination:</span>
              <textarea
                id="pruner-distortion-input"
                value={pruneThoughtInput}
                onChange={(e) => setPruneThoughtInput(e.target.value)}
                placeholder="e.g., If I make a single mistake, my entire career is over..."
                className="w-full h-24 bg-[#181818] border border-[#3D4028] rounded-xs p-2.5 text-xs text-white focus:outline-hidden focus:border-[#A3A649]"
              />

              {/* Preset Distortion Chips */}
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="text-[10px] text-[#8C8C8C]">Presets:</span>
                {DISTORTION_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => setPruneThoughtInput(p.text)}
                    className="text-[10px] bg-[#181818] hover:bg-[#3D4028] text-[#8C8C8C] hover:text-white px-2 py-0.5 rounded-xs border border-[#3D4028] cursor-pointer"
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {pruneError && (
                <div className="p-2 rounded-xs bg-[#AD3D30]/20 border border-[#AD3D30] text-xs text-[#AD3D30]">
                  {pruneError}
                </div>
              )}

              <button
                id="pruner-analyze-btn"
                onClick={handleAnalyzePrune}
                disabled={isPruning || !pruneThoughtInput.trim()}
                className="px-4 py-2 rounded-xs bg-[#AD3D30] hover:bg-[#AD3D30]/80 text-white text-xs font-bold transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
              >
                {isPruning ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing Synaptic Distortion...</span>
                  </>
                ) : (
                  <>
                    <Scissors className="w-3.5 h-3.5" />
                    <span>Untangle & Prune Distortion</span>
                  </>
                )}
              </button>
            </div>

            {/* Analysis & Rewiring Output */}
            {prunerResult && (
              <div className="bg-[#262626] border border-[#A3A649] p-5 rounded-xs space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#A3A649]" />
                    <span className="font-bold text-white uppercase tracking-wider">
                      Distortion: {prunerResult.distortionCategory}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#8C8C8C]">Prefrontal Rewiring</span>
                </div>

                <div className="bg-[#181818] border border-[#3D4028] p-3 rounded-xs text-xs space-y-1">
                  <span className="text-[10px] text-[#AD3D30] font-bold uppercase">Neurological Trap:</span>
                  <p className="text-[#e2e8f0]">{prunerResult.neurologicalTrap}</p>
                </div>

                <div className="bg-[#181818] border border-[#3D4028] p-3 rounded-xs text-xs space-y-1">
                  <span className="text-[10px] text-[#A3A649] font-bold uppercase">Neuroscience Grounding:</span>
                  <p className="text-[#8C8C8C]">{prunerResult.neuroscienceFact}</p>
                </div>

                {/* Rewired belief editor */}
                <div className="space-y-1.5">
                  <span className="text-xs text-white font-semibold">New Rewired Synaptic Anchor:</span>
                  <textarea
                    value={rewiredInput}
                    onChange={(e) => setRewiredInput(e.target.value)}
                    className="w-full h-20 bg-[#181818] border border-[#A3A649] rounded-xs p-2.5 text-xs text-[#A3A649] font-bold focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={handleCommitRewiredBelief}
                    className="px-4 py-2 rounded-xs bg-[#A3A649] hover:bg-[#A3A649]/80 text-black text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Commit Rewired Belief</span>
                  </button>

                  {pruneSuccess && (
                    <span className="text-xs text-[#10b981] font-bold">
                      ✓ Belief Rewired & Saved to Vault!
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* List of Previous Pruned Loops */}
            {prunedLoops.length > 0 && (
              <div className="bg-[#262626] border border-[#3D4028] p-4 rounded-xs space-y-3">
                <h3 className="text-xs font-bold text-white tracking-wider uppercase">
                  Dissolved Thought Loops ({prunedLoops.length})
                </h3>
                <div className="space-y-2">
                  {prunedLoops.slice(0, 5).map((loop) => (
                    <div key={loop.id} className="p-2.5 rounded-xs bg-[#181818] border border-[#3D4028] text-xs space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-[#AD3D30] line-through">{loop.oldDistortion}</span>
                        <span className="text-[#8C8C8C]">{new Date(loop.dissolvedAt).toLocaleDateString()}</span>
                      </div>
                      <div className="text-[#A3A649] font-bold">
                        → {loop.newRewiredBelief}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* 3. GLIMMER VAULT                                           */}
        {/* ========================================================= */}
        {activeSubTab === "glimmer_vault" && (
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="bg-[#262626] border border-[#3D4028] p-4 rounded-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4 text-[#A3A649]" />
                  <h2 className="text-sm font-bold text-white tracking-wider">
                    POLYVAGAL GLIMMER VAULT
                  </h2>
                </div>
                <p className="text-xs text-[#8C8C8C] mt-1">
                  Micro-moments of peace, gratitude, and safety that cue the autonomic nervous system to down-regulate vigilance.
                </p>
              </div>

              <button
                id="mine-glimmers-btn"
                onClick={handleMineFromEntry}
                disabled={isMiningGlimmers}
                className="px-3 py-1.5 rounded-xs bg-[#3D4028] hover:bg-[#A3A649] text-[#A3A649] hover:text-black border border-[#A3A649]/40 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                {isMiningGlimmers ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Mining...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Mine from Active Journal</span>
                  </>
                )}
              </button>
            </div>

            {glimmerSuccessMsg && (
              <div className="p-2.5 rounded-xs bg-[#3D4028] border border-[#A3A649] text-xs text-[#A3A649] flex items-center justify-between">
                <span>{glimmerSuccessMsg}</span>
                <button onClick={() => setGlimmerSuccessMsg(null)} className="text-[#8C8C8C] hover:text-white cursor-pointer">✕</button>
              </div>
            )}

            {/* Quick Add Form */}
            <div className="bg-[#262626] border border-[#3D4028] p-4 rounded-xs space-y-3">
              <span className="text-xs text-white font-semibold">Anchor a New Micro-Glimmer:</span>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={newGlimmerText}
                  onChange={(e) => setNewGlimmerText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateGlimmer();
                  }}
                  placeholder="e.g. Smell of fresh rain on warm asphalt, gentle morning light..."
                  className="flex-1 bg-[#181818] border border-[#3D4028] rounded-xs p-2 text-xs text-white placeholder-[#8C8C8C]/50 focus:outline-hidden focus:border-[#A3A649]"
                />
                <select
                  value={newGlimmerCategory}
                  onChange={(e) => setNewGlimmerCategory(e.target.value as any)}
                  className="bg-[#181818] border border-[#3D4028] rounded-xs px-2.5 py-1.5 text-xs text-[#A3A649] focus:outline-hidden"
                >
                  {Object.entries(GLIMMER_CATEGORIES).map(([key, meta]) => (
                    <option key={key} value={key}>{meta.label}</option>
                  ))}
                </select>
                <button
                  id="add-glimmer-btn"
                  onClick={handleCreateGlimmer}
                  className="px-4 py-2 bg-[#AD3D30] hover:bg-[#AD3D30]/80 text-white rounded-xs text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Save Glimmer</span>
                </button>
              </div>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <button
                onClick={() => setGlimmerCategoryFilter("all")}
                className={`px-2.5 py-1 rounded-xs cursor-pointer border ${
                  glimmerCategoryFilter === "all"
                    ? "bg-[#3D4028] text-[#A3A649] border-[#A3A649] font-bold"
                    : "bg-[#262626] text-[#8C8C8C] border-[#3D4028] hover:text-white"
                }`}
              >
                All Glimmers ({glimmers.length})
              </button>
              {Object.entries(GLIMMER_CATEGORIES).map(([key, meta]) => (
                <button
                  key={key}
                  onClick={() => setGlimmerCategoryFilter(key)}
                  className={`px-2 py-1 rounded-xs cursor-pointer border ${
                    glimmerCategoryFilter === key
                      ? "bg-[#3D4028] text-[#A3A649] border-[#A3A649] font-bold"
                      : "bg-[#262626] text-[#8C8C8C] border-[#3D4028] hover:text-white"
                  }`}
                >
                  {meta.label}
                </button>
              ))}
            </div>

            {/* Glimmer Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredGlimmers.length === 0 ? (
                <div className="col-span-2 text-center p-8 bg-[#262626] border border-[#3D4028] rounded-xs text-[#8C8C8C] text-xs space-y-1">
                  <Sun className="w-6 h-6 mx-auto text-[#A3A649]" />
                  <p className="font-bold text-white">Vault is Ready for Anchoring</p>
                  <p>Anchor your first micro-glimmer above or mine them from your journal entries.</p>
                </div>
              ) : (
                filteredGlimmers.map((g) => {
                  const meta = GLIMMER_CATEGORIES[g.category as keyof typeof GLIMMER_CATEGORIES] || GLIMMER_CATEGORIES.sensory;
                  const Icon = meta.icon;
                  return (
                    <div
                      key={g.id}
                      className="p-3 bg-[#262626] border border-[#3D4028] hover:border-[#A3A649] rounded-xs space-y-2 transition-all"
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <div className="flex items-center gap-1 text-[#A3A649]">
                          <Icon className="w-3 h-3" />
                          <span className="uppercase font-semibold">{meta.label}</span>
                        </div>
                        <span className="text-[#8C8C8C]">{new Date(g.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-white leading-relaxed">"{g.text}"</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 4. VENT-TO-CLARITY (PSYCHIATRIC DECENTERING)                */}
        {/* ========================================================= */}
        {activeSubTab === "decentering" && (
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="bg-[#262626] border border-[#3D4028] p-4 rounded-xs">
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-[#A3A649]" />
                <h2 className="text-sm font-bold text-white tracking-wider">
                  VENT-TO-CLARITY (PSYCHIATRIC DECENTERING STATION)
                </h2>
              </div>
              <p className="text-xs text-[#8C8C8C] mt-1">
                Cognitive externalization: Transform raw emotional rumination into camera-verifiable facts, identified projections, and agency micro-actions.
              </p>
            </div>

            <PsychiatricDecenteringStation
              userId={user?.uid || "guest"}
              currentJournalContent={activeEntry?.content || ""}
              onInsertToJournal={(markdown) => {
                if (onInsertToJournal) onInsertToJournal(markdown);
                confetti({ particleCount: 30, spread: 45 });
              }}
              onSaveDistillation={onSavePsychiatricDistillation}
            />
          </div>
        )}

        {/* ========================================================= */}
        {/* 5. CIRCADIAN DAY BOUNDARY                                  */}
        {/* ========================================================= */}
        {activeSubTab === "circadian" && (
          <div id="circadian-day-div" className="max-w-4xl mx-auto space-y-4">
            <div className="bg-[#262626] border border-[#3D4028] p-4 rounded-xs shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SunMedium className="w-4 h-4 text-[#A3A649]" />
                  <h2 className="text-sm font-bold text-white tracking-wider">
                    CIRCADIAN DAY BOUNDARY & LOOP-CLOSING
                  </h2>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono text-[#8C8C8C]">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#A6535A]" />Dawn</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#D9414E]" />Midday</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#735053]" />Dusk</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#332425] border border-[#735053]" />Night</span>
                </div>
              </div>
              <p className="text-xs text-[#8C8C8C] mt-1">
                Close mental loops before sleep, perform evening cognitive offloading, and set intentional morning dopamine primes.
              </p>
            </div>

            <CircadianDayBoundary
              userId={user?.uid || "guest"}
              activeJournalEntry={activeEntry}
              circadianEntries={circadianEntries}
              onSaveCircadianEntry={onSaveCircadianEntry}
              onInsertPromptToJournal={(text) => {
                if (onInsertToJournal) onInsertToJournal(text);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
