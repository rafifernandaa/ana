/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { User } from "firebase/auth";
import { 
  Sparkles, 
  X, 
  ArrowRight, 
  ArrowLeft, 
  Clock, 
  Activity, 
  ShieldCheck, 
  HeartHandshake, 
  Compass, 
  Flame, 
  Check, 
  RefreshCw, 
  AlertCircle, 
  Wind, 
  Sun, 
  Save, 
  Play, 
  Pause, 
  CheckCircle2, 
  Layers,
  LogIn,
  Zap,
  ShieldAlert,
  BatteryLow,
  HeartCrack,
  Anchor,
  UserMinus
} from "lucide-react";
import { 
  ResetSession, 
  ResetMode, 
  SomaticBodyMap, 
  CognitiveReframeOption, 
  GeminiReframeResponse 
} from "../types";
import { BodyMapSelector } from "./BodyMapSelector";
import { extractReframeAndGlimmerWithGemini } from "../lib/geminiService";

interface ResetRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSessionSaved: (session: ResetSession) => Promise<void>;
  onExportAsJournalEntry?: (title: string, content: string, mood: string) => void;
  onOpenLogin?: () => void;
}


type ResetStep = "intake" | "name_it" | "write_it" | "reframe_it" | "glimmer" | "release";

const AFFECT_LABELS = [
  { id: "Overwhelmed", label: "Overwhelmed", icon: Wind, desc: "Too much incoming at once" },
  { id: "Anxious", label: "Anxious", icon: Zap, desc: "Anticipating future catastrophes" },
  { id: "Self-Critical", label: "Self-Critical", icon: ShieldAlert, desc: "Harsh internal judgment" },
  { id: "Exhausted", label: "Exhausted", icon: BatteryLow, desc: "Depleted physical & emotional reserve" },
  { id: "Hurt", label: "Hurt / Disappointed", icon: HeartCrack, desc: "Pain from an interaction or unmet need" },
  { id: "Stuck", label: "Paralyzed / Stuck", icon: Anchor, desc: "Unable to find momentum" },
  { id: "Frustrated", label: "Frustrated", icon: Flame, desc: "Blocked progress or unfair obstacle" },
  { id: "Lonely", label: "Isolated / Lonely", icon: UserMinus, desc: "Craving connection or feeling unseen" },
];

const INITIAL_BODY_WORDS = ["Knotted", "Constricted", "Racing", "Heavy", "Numb", "Fidgety", "Tight", "Exhausted"];
const POST_BODY_WORDS = ["Softened", "Lighter", "Centered", "Grounded", "Breathing", "Calmer", "Present", "Released"];

export const ResetRoomModal: React.FC<ResetRoomModalProps> = ({
  isOpen,
  onClose,
  user,
  onSessionSaved,
  onExportAsJournalEntry,
  onOpenLogin,
}) => {
  // Navigation & Step State
  const [currentStep, setCurrentStep] = useState<ResetStep>("intake");
  const [resetMode, setResetMode] = useState<ResetMode>("mini");


  // Step 1: Somatic Intake
  const [bodyMap, setBodyMap] = useState<SomaticBodyMap>({
    zones: ["chest", "shoulders"],
    intensity: 4,
  });
  const [beforeWord, setBeforeWord] = useState<string>("Constricted");
  const [customBeforeWord, setCustomBeforeWord] = useState("");

  // Step 2: Affect Labeling
  const [affectLabel, setAffectLabel] = useState<string>("Overwhelmed");

  // Step 3: Expressive Writing & Timer
  const [writingContent, setWritingContent] = useState("");
  const [timerSecondsLeft, setTimerSecondsLeft] = useState(90);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Step 4: AI Cognitive Reframe
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [reframeData, setReframeData] = useState<GeminiReframeResponse | null>(null);
  const [chosenReframeIdx, setChosenReframeIdx] = useState<number>(0);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Step 5: Glimmer & Breath
  const [breathPhase, setBreathPhase] = useState<"Inhale" | "Hold" | "Exhale">("Inhale");
  const [breathCount, setBreathCount] = useState(4);

  // Step 6: Post-Reset Out-Take
  const [afterWord, setAfterWord] = useState<string>("Softened");
  const [customAfterWord, setCustomAfterWord] = useState("");
  const [isSavingFinal, setIsSavingFinal] = useState(false);
  const [savedSessionId, setSavedSessionId] = useState<string | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep("intake");
      setResetMode("mini");
      setBodyMap({ zones: ["chest", "shoulders"], intensity: 4 });
      setBeforeWord("Constricted");
      setAffectLabel("Overwhelmed");
      setWritingContent("");
      setTimerSecondsLeft(90);
      setIsTimerRunning(false);
      setReframeData(null);
      setChosenReframeIdx(0);
      setAnalysisError(null);
      setAfterWord("Softened");
      setSavedSessionId(null);
    }
  }, [isOpen]);

  // Timer logic for Step 3
  useEffect(() => {
    if (currentStep === "write_it" && isTimerRunning && timerSecondsLeft > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimerSecondsLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current!);
            setIsTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [currentStep, isTimerRunning, timerSecondsLeft]);

  // Gentle breath guide cycle in Glimmer phase
  useEffect(() => {
    if (currentStep !== "glimmer") return;
    const interval = setInterval(() => {
      setBreathCount(prev => {
        if (prev <= 1) {
          setBreathPhase(curr => {
            if (curr === "Inhale") return "Hold";
            if (curr === "Hold") return "Exhale";
            return "Inhale";
          });
          return 4;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [currentStep]);

  if (!isOpen) return null;

  // Handle transitions
  const startWritingPhase = () => {
    const duration = resetMode === "mini" ? 90 : 300;
    setTimerSecondsLeft(duration);
    setIsTimerRunning(true);
    setCurrentStep("write_it");
  };

  const handleFinishWritingAndAnalyze = async () => {
    if (!writingContent.trim()) {
      setAnalysisError("Please write a few thoughts or sentences before continuing.");
      return;
    }

    setIsTimerRunning(false);
    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const res = await extractReframeAndGlimmerWithGemini({
        affectLabel,
        writingContent,
        bodyMapZones: bodyMap.zones,
      });

      setReframeData(res);
      setChosenReframeIdx(0);
      setCurrentStep("reframe_it");
    } catch (err: any) {
      console.error("Reframe error:", err);
      setAnalysisError(err.message || "Failed to process reframe. Using psychological emergency baseline.");
      // Graceful fallback to avoid leaving user stranded
      setReframeData({
        darkestSentence: writingContent.slice(0, 120),
        reframes: [
          {
            lens: "compassion",
            title: "A Compassionate Lens",
            text: "This acute stress is heavy, but carrying it does not mean you have failed. You are doing your best.",
            rationale: "Validates distress with warmth."
          },
          {
            lens: "perspective",
            title: "A Broader Horizon",
            text: "This uncomfortable wave will crest and recede. It is a moment in time, not your permanent state.",
            rationale: "De-escalates urgency."
          },
          {
            lens: "agency",
            title: "What You Can Control",
            text: "Focus only on your next exhale and the single small task directly in front of you.",
            rationale: "Restores agency."
          }
        ],
        glimmerCandidate: "Your deliberate choice to pause and take care of your mind right now.",
        modelUsed: "fallback-resilience"
      });
      setChosenReframeIdx(0);
      setCurrentStep("reframe_it");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCompleteAndSaveSession = async () => {
    setIsSavingFinal(true);
    const finalBefore = customBeforeWord.trim() || beforeWord;
    const finalAfter = customAfterWord.trim() || afterWord;
    const effectiveUserId = user ? user.uid : "local-user";

    const newSession: ResetSession = {
      id: "session-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
      userId: effectiveUserId,
      mode: resetMode,
      bodyMap,
      affectLabel,
      writingContent,
      extractedDarkSentence: reframeData?.darkestSentence || "The held tension in your reflection.",
      reframes: reframeData?.reframes || [],
      chosenReframeIndex: chosenReframeIdx,
      glimmer: reframeData?.glimmerCandidate || "Your honest self-awareness.",
      beforeWord: finalBefore,
      afterWord: finalAfter,
      durationMs: resetMode === "mini" ? 90000 : 300000,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    try {
      await onSessionSaved(newSession);
      setSavedSessionId(newSession.id);
      confetti({
        particleCount: 60,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#6366f1", "#10b981", "#ec4899", "#f59e0b"],
      });
    } catch (err: any) {
      console.error("Error saving session:", err);
    } finally {
      setIsSavingFinal(false);
    }
  };


  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder < 10 ? "0" : ""}${remainder}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header Bar */}
        <div className="px-5 py-4 bg-gradient-to-r from-indigo-900 via-slate-900 to-violet-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 text-indigo-300 flex items-center justify-center backdrop-blur-xs border border-white/10 shadow-inner">
              <Sparkles className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif font-bold text-base text-white tracking-tight">
                  Ana: The Reset Room
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-200 border border-indigo-400/30">
                  {resetMode === "mini" ? "Mini Reset · 3 Min" : "Full Reset · 15 Min"}
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Mindful tension release & fresh perspective powered by Gemini
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              title="Exit Reset Room"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress Stepper Bar */}
        <div className="px-6 py-2 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1 sm:gap-2">
            {[
              { id: "intake", label: "1. Body Map" },
              { id: "name_it", label: "2. Name It" },
              { id: "write_it", label: "3. Flow Write" },
              { id: "reframe_it", label: "4. Reframe" },
              { id: "glimmer", label: "5. Glimmer" },
              { id: "release", label: "6. Settle" },
            ].map((step, idx) => {
              const isCurrent = currentStep === step.id;
              return (
                <span
                  key={step.id}
                  className={`flex items-center gap-1 ${
                    isCurrent ? "font-bold text-indigo-700" : "text-slate-400"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isCurrent ? "bg-indigo-600 animate-pulse" : "bg-slate-300"}`} />
                  <span className="hidden md:inline">{step.label}</span>
                </span>
              );
            })}
          </div>

          {currentStep === "write_it" && (
            <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatTime(timerSecondsLeft)}</span>
            </div>
          )}
        </div>

        {/* Main Step Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* STEP 1: SOMATIC INTAKE */}
          {currentStep === "intake" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Protocol Duration Toggle */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-indigo-50/50 border border-indigo-100">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-indigo-950">Choose Reset Intensity:</span>
                  <p className="text-[11px] text-indigo-700">
                    Mini Reset is optimized for live breaks and daily grounding.
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-indigo-200 text-xs">
                  <button
                    type="button"
                    onClick={() => setResetMode("mini")}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      resetMode === "mini" ? "bg-indigo-600 text-white font-medium shadow-2xs" : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Mini (~3 min)
                  </button>
                  <button
                    type="button"
                    onClick={() => setResetMode("full")}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      resetMode === "full" ? "bg-indigo-600 text-white font-medium shadow-2xs" : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Full (15 min)
                  </button>
                </div>
              </div>

              {/* Body Map SVG & Zone Selector */}
              <BodyMapSelector
                value={bodyMap}
                onChange={setBodyMap}
              />

              {/* One Word Body Check-In */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                  <span>How does your body feel in one word right now?</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {INITIAL_BODY_WORDS.map(word => (
                    <button
                      key={word}
                      type="button"
                      onClick={() => {
                        setBeforeWord(word);
                        setCustomBeforeWord("");
                      }}
                      className={`px-3 py-1 rounded-full text-xs transition-all cursor-pointer ${
                        beforeWord === word && !customBeforeWord
                          ? "bg-slate-900 text-white font-semibold shadow-xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {word}
                    </button>
                  ))}
                  <input
                    type="text"
                    value={customBeforeWord}
                    onChange={e => {
                      setCustomBeforeWord(e.target.value);
                      setBeforeWord(e.target.value);
                    }}
                    placeholder="or custom word..."
                    className="px-3 py-1 text-xs bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:border-indigo-500 w-36 text-slate-800"
                  />
                </div>
              </div>

              {/* Step Navigation Action */}
              <div className="pt-4 flex justify-end">
                <button
                  id="reset-room-next-to-name-it"
                  type="button"
                  onClick={() => setCurrentStep("name_it")}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs transition-all cursor-pointer active:scale-95"
                >
                  <span>Continue: Name the Feeling</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: NAME IT (AFFECT LABELING) */}
          {currentStep === "name_it" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="space-y-1">
                <h3 className="font-serif font-bold text-lg text-slate-900">
                  Step 2: Name It to Tame It
                </h3>
                <p className="text-xs text-slate-500">
                  Putting words to how you feel brings clarity and calm. Which best describes the heart of this tension?
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {AFFECT_LABELS.map(item => {
                  const isSelected = affectLabel === item.id;
                  return (
                    <button
                      key={item.id}
                      id={`affect-label-btn-${item.id}`}
                      type="button"
                      onClick={() => setAffectLabel(item.id)}
                      className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                        isSelected
                          ? "bg-indigo-50/90 border-indigo-400 ring-2 ring-indigo-500/20 shadow-xs"
                          : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
                        <item.icon className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-xs text-slate-900">{item.label}</p>
                          {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{item.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCurrentStep("intake")}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  id="reset-room-start-writing-btn"
                  type="button"
                  onClick={startWritingPhase}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs transition-all cursor-pointer active:scale-95"
                >
                  <span>Begin {resetMode === "mini" ? "90-Second" : "5-Minute"} Stream</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: WRITE IT (EXPRESSIVE WRITING STREAM) */}
          {currentStep === "write_it" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-mono font-bold text-xs">
                    {formatTime(timerSecondsLeft)}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800">
                      Unfiltered Expressive Flow
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Write continuously without editing, judging, or correcting.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsTimerRunning(!isTimerRunning)}
                    className="p-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs flex items-center gap-1"
                    title={isTimerRunning ? "Pause Timer" : "Resume Timer"}
                  >
                    {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    id="finish-writing-now-btn"
                    type="button"
                    onClick={handleFinishWritingAndAnalyze}
                    disabled={isAnalyzing || !writingContent.trim()}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-all flex items-center gap-1 shadow-2xs disabled:opacity-50"
                  >
                    {isAnalyzing ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>Reframing with Gemini...</span>
                      </>
                    ) : (
                      <>
                        <span>Finish & Reframe</span>
                        <ArrowRight className="w-3 h-3" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Free Writing Textarea */}
              <div className="relative">
                <textarea
                  id="reset-room-writing-canvas"
                  value={writingContent}
                  onChange={e => setWritingContent(e.target.value)}
                  placeholder={`What is happening right now? Why does ${affectLabel.toLowerCase()} feel so heavy? Just write continuously...`}
                  autoFocus
                  className="w-full min-h-[260px] p-5 rounded-2xl bg-slate-50/50 border border-slate-200 focus:outline-none focus:border-indigo-500 font-serif text-slate-800 text-base leading-relaxed resize-none shadow-inner"
                />
                <div className="absolute bottom-3 right-4 text-[11px] text-slate-400">
                  {writingContent.trim() ? writingContent.trim().split(/\s+/).length : 0} words
                </div>
              </div>

              {analysisError && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>{analysisError}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
                <span className="italic text-[11px]">
                  Tip: Don't worry about punctuation or grammar—pour the raw thought onto the page.
                </span>
                <button
                  type="button"
                  onClick={handleFinishWritingAndAnalyze}
                  disabled={isAnalyzing || !writingContent.trim()}
                  className="text-indigo-600 font-semibold hover:underline cursor-pointer disabled:opacity-40"
                >
                  Ready to Reframe →
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: REFRAME IT (COGNITIVE RESTRUCTURING) */}
          {currentStep === "reframe_it" && reframeData && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Isolated Darkest Sentence */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2 shadow-sm">
                <div className="flex items-center justify-between text-xs text-indigo-300">
                  <span className="font-semibold flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    <span>The Extracted Weight:</span>
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-white/10 rounded-full">
                    {reframeData.modelUsed || "Gemini 3.6 Flash"}
                  </span>
                </div>
                <p className="font-serif italic text-sm sm:text-base text-slate-100 leading-relaxed pl-2 border-l-2 border-amber-400">
                  "{reframeData.darkestSentence}"
                </p>
                <p className="text-[10px] text-slate-400 pt-1">
                  Gemini isolated this core tension sentence from your reflection. Choose an evidence-based lens to reframe it:
                </p>
              </div>

              {/* 3 Reframe Cards */}
              <div className="space-y-3">
                <span className="text-xs font-semibold text-slate-700 block">
                  Select the perspective that speaks most deeply to you:
                </span>

                <div className="grid grid-cols-1 gap-3">
                  {reframeData.reframes.map((ref, idx) => {
                    const isSelected = chosenReframeIdx === idx;
                    const lensIcon = 
                      ref.lens === "compassion" ? <HeartHandshake className="w-4 h-4 text-emerald-600" /> :
                      ref.lens === "perspective" ? <Compass className="w-4 h-4 text-indigo-600" /> :
                      <Wind className="w-4 h-4 text-amber-600" />;

                    return (
                      <div
                        key={idx}
                        id={`reframe-card-option-${idx}`}
                        onClick={() => setChosenReframeIdx(idx)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer text-left ${
                          isSelected
                            ? "bg-indigo-50/90 border-indigo-400 ring-2 ring-indigo-500/20 shadow-xs"
                            : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            {lensIcon}
                            <span className="text-xs font-bold text-slate-900">{ref.title}</span>
                            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                              {ref.lens}
                            </span>
                          </div>
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                            isSelected ? "bg-indigo-600 text-white" : "border border-slate-300"
                          }`}>
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </div>

                        <p className="text-xs sm:text-sm text-slate-800 font-serif leading-relaxed italic">
                          "{ref.text}"
                        </p>
                        <p className="text-[11px] text-slate-500 mt-2">
                          <strong className="text-slate-700">Under the hood:</strong> {ref.rationale}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCurrentStep("write_it")}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Writing</span>
                </button>
                <button
                  id="reset-room-to-glimmer-btn"
                  type="button"
                  onClick={() => setCurrentStep("glimmer")}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs transition-all cursor-pointer active:scale-95"
                >
                  <span>Catch a Glimmer</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: CATCH A GLIMMER & SOMATIC BREATH */}
          {currentStep === "glimmer" && reframeData && (
            <div className="space-y-6 text-center animate-in fade-in duration-200 py-4">
              <div className="max-w-lg mx-auto space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
                  <Sun className="w-6 h-6 text-amber-500" />
                </div>
                <h3 className="font-serif font-bold text-xl text-slate-900">
                  Catch a Glimmer
                </h3>
                <p className="text-xs text-slate-500">
                  Even inside deep stress, your authentic words revealed a quiet spark of resilience.
                </p>
              </div>

              {/* Glimmer Card */}
              <div className="max-w-lg mx-auto p-5 rounded-2xl bg-gradient-to-br from-amber-50/70 via-rose-50/40 to-indigo-50/40 border border-amber-200/80 shadow-xs text-left space-y-2">
                <div className="flex items-center gap-2 text-amber-800 font-semibold text-xs">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Mined from your reflection:</span>
                </div>
                <p className="font-serif italic text-sm sm:text-base text-slate-800 leading-relaxed">
                  "{reframeData.glimmerCandidate}"
                </p>
              </div>

              {/* Breathing Guide Ring */}
              <div className="py-4 space-y-2">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Guided Calming Breath
                </p>
                <div className="w-28 h-28 rounded-full border-4 border-indigo-100 bg-indigo-50/40 mx-auto flex flex-col items-center justify-center transition-all duration-1000 shadow-inner">
                  <span className="text-sm font-bold text-indigo-900">{breathPhase}</span>
                  <span className="font-mono text-xs text-indigo-600 font-bold">{breathCount}s</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Take a slow, deep breath into your belly.
                </p>
              </div>

              <div className="pt-4 flex items-center justify-between max-w-lg mx-auto border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCurrentStep("reframe_it")}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Back
                </button>
                <button
                  id="reset-room-to-release-btn"
                  type="button"
                  onClick={() => setCurrentStep("release")}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs transition-all cursor-pointer active:scale-95"
                >
                  <span>Complete Post-Reset Check-In</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 6: SETTLE & RELEASE (POST-RESET OUT-TAKE) */}
          {currentStep === "release" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="space-y-1">
                <h3 className="font-serif font-bold text-lg text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Post-Reset Check-In: Tension Release</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Notice how your mind and body feel after this reflection.
                </p>
              </div>

              {/* Before vs After Comparison Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Before Reset
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-serif font-bold text-slate-800">
                      "{customBeforeWord.trim() || beforeWord}"
                    </span>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-slate-200 text-slate-700 font-semibold">
                      Tension {bodyMap.intensity}/5
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Felt in: {bodyMap.zones.join(", ")}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                  <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">
                    Now (After Reset)
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-serif font-bold text-emerald-950">
                      "{customAfterWord.trim() || afterWord}"
                    </span>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-200 text-emerald-800 font-semibold">
                      State Shifted
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-700">
                    Mind and body centered with new perspective
                  </p>
                </div>
              </div>

              {/* Post One-Word Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-800">
                  Choose one word describing how your body feels right now:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {POST_BODY_WORDS.map(word => (
                    <button
                      key={word}
                      type="button"
                      onClick={() => {
                        setAfterWord(word);
                        setCustomAfterWord("");
                      }}
                      className={`px-3 py-1 rounded-full text-xs transition-all cursor-pointer ${
                        afterWord === word && !customAfterWord
                          ? "bg-emerald-600 text-white font-semibold shadow-xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {word}
                    </button>
                  ))}
                  <input
                    type="text"
                    value={customAfterWord}
                    onChange={e => {
                      setCustomAfterWord(e.target.value);
                      setAfterWord(e.target.value);
                    }}
                    placeholder="or custom word..."
                    className="px-3 py-1 text-xs bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:border-emerald-500 w-36 text-slate-800"
                  />
                </div>
              </div>

              {/* Chosen Reframe Reminder */}
              {reframeData && reframeData.reframes[chosenReframeIdx] && (
                <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-1">
                  <span className="text-[11px] font-bold text-indigo-900 flex items-center gap-1">
                    <Compass className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Your Chosen Anchor Reframe:</span>
                  </span>
                  <p className="text-xs font-serif italic text-slate-800">
                    "{reframeData.reframes[chosenReframeIdx].text}"
                  </p>
                </div>
              )}

              {/* Save & Action Footer */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Isolated & persisted to <code className="font-mono text-[10px]">/users/{user?.uid || "{userId}"}/sessions</code></span>
                </div>


                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {onExportAsJournalEntry && (
                    <button
                      type="button"
                      onClick={() => {
                        const title = `Reset Room (${resetMode.toUpperCase()}) - ${affectLabel}`;
                        const content = `**Body Check-In:** Tension in ${bodyMap.zones.join(", ")} (Intensity ${bodyMap.intensity}/5)\n**Before:** "${customBeforeWord || beforeWord}" | **After:** "${customAfterWord || afterWord}"\n\n**Free Writing:**\n${writingContent}\n\n**Extracted Weight:**\n"${reframeData?.darkestSentence}"\n\n**Chosen Reframe:**\n"${reframeData?.reframes[chosenReframeIdx]?.text}"\n\n**Glimmer:**\n"${reframeData?.glimmerCandidate}"`;
                        onExportAsJournalEntry(title, content, "peaceful");
                        onClose();
                      }}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium transition-colors cursor-pointer"
                    >
                      Export to Journal
                    </button>
                  )}

                  <button
                    id="save-reset-session-final-btn"
                    type="button"
                    onClick={async () => {
                      await handleCompleteAndSaveSession();
                      setTimeout(() => {
                        onClose();
                      }, 1200);
                    }}
                    disabled={isSavingFinal}
                    className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {isSavingFinal ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Saving to Cloud...</span>
                      </>
                    ) : savedSessionId ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Reset Saved!</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save & Complete Reset</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
