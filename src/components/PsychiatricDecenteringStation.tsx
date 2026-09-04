import React, { useState, useEffect, useRef } from "react";
import { 
  BrainCircuit, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Clock, 
  ShieldAlert, 
  RefreshCw, 
  Heart, 
  Volume2, 
  VolumeX, 
  Compass, 
  Flame, 
  Layers, 
  Lightbulb, 
  Check, 
  Copy, 
  BookOpen, 
  Wind,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { 
  PsychiatricDistillation, 
  GeminiPsychiatricDecenterResponse 
} from "../types";
import { decenterPsychiatricVentWithGemini } from "../lib/geminiService";

interface PsychiatricDecenteringStationProps {
  currentJournalContent: string;
  onInsertToJournal: (formattedMarkdown: string) => void;
  onSaveDistillation: (distillation: PsychiatricDistillation) => Promise<void>;
  userId: string;
}

export const PsychiatricDecenteringStation: React.FC<PsychiatricDecenteringStationProps> = ({
  currentJournalContent,
  onInsertToJournal,
  onSaveDistillation,
  userId,
}) => {
  // Phase states: 'vent' | 'decentered'
  const [activeStep, setActiveStep] = useState<"vent" | "clarity">("vent");
  const [ventText, setVentText] = useState("");
  const [timerMinutes, setTimerMinutes] = useState<number | null>(3); // 3m, 5m, or null (untimed)
  const [secondsRemaining, setSecondsRemaining] = useState<number>(180);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Gemini loading & result states
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [clarityResult, setClarityResult] = useState<GeminiPsychiatricDecenterResponse | null>(null);

  // Physiological sigh state
  const [isSighing, setIsSighing] = useState(false);
  const [sighStep, setSighStep] = useState<"inhale1" | "inhale2" | "exhale" | "rest">("rest");
  const [sighCount, setSighCount] = useState(0);
  const [sighCompleted, setSighCompleted] = useState(false);

  // Audio tone state
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Persistence status
  const [isSaving, setIsSaving] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Auto-fill from current journal content if vent is empty
  useEffect(() => {
    if (!ventText && currentJournalContent && currentJournalContent.trim().length > 20) {
      // Prompt user or provide option to use active draft
    }
  }, [currentJournalContent, ventText]);

  // Timer countdown
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => prev - 1);
      }, 1000);
    } else if (secondsRemaining === 0 && isTimerRunning) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, secondsRemaining]);

  // Timer controls
  const handleSelectTimer = (mins: number | null) => {
    setTimerMinutes(mins);
    if (mins === null) {
      setIsTimerRunning(false);
      setSecondsRemaining(0);
    } else {
      setSecondsRemaining(mins * 60);
      setIsTimerRunning(false);
    }
  };

  const toggleTimer = () => {
    if (timerMinutes === null) return;
    if (secondsRemaining <= 0) {
      setSecondsRemaining(timerMinutes * 60);
    }
    setIsTimerRunning(!isTimerRunning);
  };

  // Safe Web Audio tone for grounding
  const playCalmingTone = () => {
    if (isAudioMuted) return;
    try {
      if (!audioCtxRef.current) {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtxClass) {
          audioCtxRef.current = new AudioCtxClass();
        }
      }
      if (!audioCtxRef.current) return;
      if (audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume();
      }

      const osc = audioCtxRef.current.createOscillator();
      const gain = audioCtxRef.current.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(174, audioCtxRef.current.currentTime); // 174 Hz natural frequency for deep safety

      gain.gain.setValueAtTime(0.001, audioCtxRef.current.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.08, audioCtxRef.current.currentTime + 1.2);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtxRef.current.currentTime + 4.5);

      osc.connect(gain);
      gain.connect(audioCtxRef.current.destination);

      osc.start();
      osc.stop(audioCtxRef.current.currentTime + 4.6);
    } catch {
      // Graceful fallback
    }
  };

  // Guided Physiological Sigh breath cycle
  const runPhysiologicalSigh = () => {
    if (isSighing) return;
    setIsSighing(true);
    setSighCount(0);
    playCalmingTone();

    // Loop through 2-3 breath cycles
    const stepDuration = 1200; // ms
    let currentCycle = 0;

    const executeCycle = () => {
      setSighStep("inhale1");
      setTimeout(() => {
        setSighStep("inhale2");
        setTimeout(() => {
          setSighStep("exhale");
          setTimeout(() => {
            currentCycle++;
            setSighCount(currentCycle);
            if (currentCycle < 3) {
              setSighStep("rest");
              setTimeout(executeCycle, 800);
            } else {
              setSighStep("rest");
              setIsSighing(false);
              setSighCompleted(true);
            }
          }, 3500); // long extended exhale
        }, 1200); // second top-off inhale
      }, 2000); // deep first inhale
    };

    executeCycle();
  };

  // Trigger Gemini Psychiatric Decentering Engine
  const handleDecenter = async () => {
    const textToProcess = ventText.trim() || currentJournalContent.trim();
    if (!textToProcess || textToProcess.length < 15) {
      setApiError("Please write at least a sentence or two of your raw feelings before decentering.");
      return;
    }

    setIsLoading(true);
    setApiError(null);
    try {
      const response = await decenterPsychiatricVentWithGemini({
        rawVentText: textToProcess,
      });
      setClarityResult(response);
      setActiveStep("clarity");
    } catch (err: any) {
      setApiError(err.message || "Failed to decenter venting text. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Save distillation record to Firestore
  const handleSaveToClarityVault = async () => {
    if (!clarityResult) return;
    setIsSaving(true);
    try {
      const distillationRecord: PsychiatricDistillation = {
        id: "distill_" + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
        userId,
        rawVentText: ventText.trim() || currentJournalContent.trim(),
        facts: clarityResult.facts,
        interpretations: clarityResult.interpretations,
        inMyControl: clarityResult.inMyControl,
        outOfMyControl: clarityResult.outOfMyControl,
        distortions: clarityResult.distortions,
        microActionAnchor: clarityResult.microActionAnchor,
        groundingSighCompleted: sighCompleted,
        createdAt: Date.now(),
      };

      await onSaveDistillation(distillationRecord);
      setHasSaved(true);
    } catch (err) {
      console.error("Error saving psychiatric distillation:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Format into Markdown for Journal Insertion
  const handleTransferToJournal = () => {
    if (!clarityResult) return;

    let md = `\n\n---\n### Psychiatric Decentering (Vent-to-Clarity Breakdown)\n`;
    md += `*Clinical Insight: Turning unstructured venting into cognitive processing & locus of control.*\n\n`;

    md += `#### 1. Objective Facts vs. Emotional Interpretations\n`;
    md += `**Objective Reality (The Camera View):**\n`;
    clarityResult.facts.forEach(f => { md += `- ${f}\n`; });
    md += `\n**Subjective Story (What Anxiety Inferred):**\n`;
    clarityResult.interpretations.forEach(i => { md += `- ${i}\n`; });

    md += `\n#### 2. Circle of Agency & Control\n`;
    md += `**Within My Agency (Direct Action / Attitude):**\n`;
    clarityResult.inMyControl.forEach(c => { md += `- [x] ${c}\n`; });
    md += `\n**Outside My Control (Releasing / Accepting):**\n`;
    clarityResult.outOfMyControl.forEach(o => { md += `- [ ] ${o}\n`; });

    if (clarityResult.distortions && clarityResult.distortions.length > 0) {
      md += `\n#### 3. Cognitive Traps & Reframes\n`;
      clarityResult.distortions.forEach(d => {
        md += `- **Trap (${d.name})**: "${d.quote}"\n  *Clinical Reframe*: ${d.psychiatricReframe}\n`;
      });
    }

    md += `\n#### 4. Actionable Micro-Anchor\n`;
    md += `> **Next Step**: ${clarityResult.microActionAnchor}\n\n`;
    md += `*Grounding Note: ${clarityResult.clinicalGroundingNote}*\n---\n`;

    onInsertToJournal(md);
  };

  const copyToClipboard = (text: string, sectionKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionKey);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  return (
    <div className="bg-[#262626] border border-[#3D4028] rounded-xl p-4 sm:p-5 shadow-md transition-all space-y-4 font-mono text-[#e2e8f0]">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#3D4028] pb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-[#3D4028] text-[#A3A649] rounded border border-[#A3A649]/30">
              <BrainCircuit className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold text-white tracking-wide">
              Psychiatric Decentering Station
            </h3>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-[#AD3D30] text-white rounded">
              VENT → CLARITY
            </span>
          </div>
          <p className="text-xs text-[#8C8C8C]">
            Transform emotional rumination into objective facts, circle of control, and calm agency.
          </p>
        </div>

        {/* Phase Toggle */}
        <div className="flex items-center gap-1 bg-[#181818] p-1 rounded border border-[#3D4028] text-xs self-start sm:self-auto">
          <button
            onClick={() => setActiveStep("vent")}
            className={`px-3 py-1 rounded font-medium transition-all cursor-pointer ${
              activeStep === "vent"
                ? "bg-[#3D4028] text-[#A3A649] font-bold border border-[#A3A649]/30"
                : "text-[#8C8C8C] hover:text-white"
            }`}
          >
            1. Raw Venting
          </button>
          <button
            onClick={() => {
              if (clarityResult) setActiveStep("clarity");
            }}
            disabled={!clarityResult}
            className={`px-3 py-1 rounded font-medium transition-all flex items-center gap-1 cursor-pointer ${
              activeStep === "clarity"
                ? "bg-[#3D4028] text-[#A3A649] font-bold border border-[#A3A649]/30"
                : clarityResult
                ? "text-[#8C8C8C] hover:text-white"
                : "text-[#8C8C8C]/40 cursor-not-allowed"
            }`}
          >
            2. Decentered Clarity
            {clarityResult && <span className="w-1.5 h-1.5 rounded-full bg-[#A3A649]" />}
          </button>
        </div>
      </div>

      {/* PHASE 1: RAW VENTING */}
      {activeStep === "vent" && (
        <div className="space-y-4">
          <div className="bg-[#181818] border border-[#3D4028] rounded-lg p-3 flex items-start gap-3">
            <Flame className="w-4 h-4 text-[#AD3D30] shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300 space-y-1">
              <span className="font-bold text-[#A3A649] block">Psychiatric Rule: Put a Boundary on Rumination</span>
              <p className="leading-relaxed text-[#8C8C8C]">
                Unstructured venting without an end point rehearses anxiety. Give yourself 3–5 minutes to dump everything raw, then let our clinical AI deconstruct the facts from fear.
              </p>
            </div>
          </div>

          {/* Timer & Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[#8C8C8C] font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#A3A649]" /> Anti-Rumination Timer:
              </span>
              <div className="flex items-center gap-1 bg-[#181818] border border-[#3D4028] rounded p-0.5">
                <button
                  onClick={() => handleSelectTimer(3)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer ${
                    timerMinutes === 3 ? "bg-[#3D4028] text-[#A3A649] font-bold" : "text-[#8C8C8C] hover:text-white"
                  }`}
                >
                  3 min
                </button>
                <button
                  onClick={() => handleSelectTimer(5)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer ${
                    timerMinutes === 5 ? "bg-[#3D4028] text-[#A3A649] font-bold" : "text-[#8C8C8C] hover:text-white"
                  }`}
                >
                  5 min
                </button>
                <button
                  onClick={() => handleSelectTimer(null)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer ${
                    timerMinutes === null ? "bg-[#3D4028] text-[#A3A649] font-bold" : "text-[#8C8C8C] hover:text-white"
                  }`}
                >
                  Untimed
                </button>
              </div>

              {timerMinutes !== null && (
                <button
                  onClick={toggleTimer}
                  className={`px-2.5 py-0.5 rounded border font-mono text-[11px] font-semibold transition-all cursor-pointer ${
                    isTimerRunning
                      ? "bg-[#AD3D30] text-white border-[#AD3D30] animate-pulse"
                      : "bg-[#181818] text-[#8C8C8C] border-[#3D4028] hover:text-white"
                  }`}
                >
                  {Math.floor(secondsRemaining / 60)}:{(secondsRemaining % 60).toString().padStart(2, "0")}
                  {" - "}
                  {isTimerRunning ? "Pause" : "Start"}
                </button>
              )}
            </div>

            {/* Use Draft shortcut */}
            {currentJournalContent && currentJournalContent.trim().length > 15 && !ventText && (
              <button
                onClick={() => setVentText(currentJournalContent.trim())}
                className="text-[11px] text-[#A3A649] hover:text-white font-medium flex items-center gap-1 underline underline-offset-2 cursor-pointer"
              >
                <Copy className="w-3 h-3" /> Pull from Active Journal Draft
              </button>
            )}
          </div>

          {/* Venting Textarea */}
          <div className="relative">
            <textarea
              value={ventText}
              onChange={(e) => setVentText(e.target.value)}
              placeholder="Dump whatever is making you angry, anxious, or overwhelmed. Don't filter grammar, polite tone, or reason. Just discharge..."
              rows={5}
              className="w-full text-xs font-mono bg-[#181818] border border-[#3D4028] rounded p-3.5 text-white focus:outline-none focus:border-[#A3A649] transition-all placeholder:text-[#8C8C8C]/50 leading-relaxed"
            />
            <div className="absolute bottom-2.5 right-3 text-[10px] text-[#8C8C8C] font-mono">
              {ventText.trim().split(/\s+/).filter(Boolean).length} words
            </div>
          </div>

          {apiError && (
            <div className="p-3 rounded bg-[#AD3D30]/20 border border-[#AD3D30] text-[#e2e8f0] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#AD3D30] shrink-0" />
              <span>{apiError}</span>
            </div>
          )}

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <span className="text-[11px] text-[#8C8C8C] italic">
              Step 2 will extract objective facts from emotional fear narratives.
            </span>

            <button
              onClick={handleDecenter}
              disabled={isLoading || (!ventText.trim() && !currentJournalContent.trim())}
              className="px-4 py-2 bg-[#AD3D30] hover:bg-[#AD3D30]/90 disabled:opacity-50 text-white rounded text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Deconstructing Vent with Clinical AI...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                  Decenter & Synthesize Clarity
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* PHASE 2: DECENTERED COGNITIVE CLARITY */}
      {activeStep === "clarity" && clarityResult && (
        <div className="space-y-5">
          {/* Clinical Grounding Note Banner */}
          <div className="p-3.5 bg-indigo-50/70 border border-indigo-200/80 rounded-xl flex items-start gap-3">
            <Compass className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div className="text-xs text-indigo-950 space-y-0.5">
              <span className="font-semibold block">Psychiatric Observation (Decentered Stance):</span>
              <p className="italic text-slate-700 leading-relaxed">
                "{clarityResult.clinicalGroundingNote}"
              </p>
            </div>
          </div>

          {/* 1. Fact vs. Interpretation Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-500" />
                1. Objective Reality vs. Cognitive Projections
              </h4>
              <span className="text-[10px] text-slate-400">Separating what happened from what you feared</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {/* Objective Facts */}
              <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl space-y-2">
                <div className="flex items-center gap-1.5 text-emerald-800 font-semibold text-[11px] pb-1 border-b border-slate-100">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Objective Facts (Camera View)
                </div>
                <ul className="space-y-1.5 text-slate-700 leading-relaxed">
                  {clarityResult.facts.map((fact, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 text-[11px]">
                      <span className="text-emerald-500 font-bold">•</span>
                      <span>{fact}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Subjective Interpretations */}
              <div className="p-3.5 bg-white border border-amber-200/60 rounded-xl space-y-2">
                <div className="flex items-center gap-1.5 text-amber-800 font-semibold text-[11px] pb-1 border-b border-amber-100">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                  Subjective Story (The Anxiety Script)
                </div>
                <ul className="space-y-1.5 text-slate-700 leading-relaxed">
                  {clarityResult.interpretations.map((interp, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 text-[11px]">
                      <span className="text-amber-500 font-bold">•</span>
                      <span>{interp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* 2. Circle of Control Sorting */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-indigo-500" />
                2. Circle of Control (Reclaiming Agency)
              </h4>
              <span className="text-[10px] text-slate-400">Stoic & CBT agency boundary</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {/* In My Control */}
              <div className="p-3.5 bg-teal-50/40 border border-teal-200/80 rounded-xl space-y-2">
                <div className="flex items-center gap-1.5 text-teal-800 font-semibold text-[11px] pb-1 border-b border-teal-100">
                  <Check className="w-3.5 h-3.5 text-teal-600" />
                  Directly Within My Agency
                </div>
                <ul className="space-y-1.5 text-slate-700 leading-relaxed">
                  {clarityResult.inMyControl.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 text-[11px]">
                      <span className="text-teal-600 font-bold">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Out of My Control */}
              <div className="p-3.5 bg-slate-100/70 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center gap-1.5 text-slate-700 font-semibold text-[11px] pb-1 border-b border-slate-200/80">
                  <Wind className="w-3.5 h-3.5 text-slate-500" />
                  Outside My Control (Releasing / Surrendering)
                </div>
                <ul className="space-y-1.5 text-slate-600 leading-relaxed">
                  {clarityResult.outOfMyControl.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 text-[11px]">
                      <span className="text-slate-400 font-bold">~</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* 3. Cognitive Distortion Caught & Reframed */}
          {clarityResult.distortions && clarityResult.distortions.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                3. Cognitive Traps Detected in Your Venting
              </h4>

              <div className="space-y-2">
                {clarityResult.distortions.map((trap, idx) => (
                  <div key={idx} className="p-3 bg-white border border-slate-200/90 rounded-xl text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-rose-700 text-[11px] uppercase tracking-wider bg-rose-50 px-2 py-0.5 rounded-md">
                        {trap.name}
                      </span>
                      <span className="text-[10px] text-slate-400 italic">Quoted from your vent</span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-serif italic border-l-2 border-slate-300 pl-2">
                      "{trap.quote}"
                    </p>
                    <div className="pt-1 text-[11px] text-slate-800 leading-relaxed">
                      <span className="font-semibold text-indigo-700">Psychiatric Reframe: </span>
                      {trap.psychiatricReframe}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Actionable Micro-Anchor */}
          <div className="p-4 bg-emerald-50/50 border border-emerald-200/80 rounded-xl space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
              4. Immediate Behavioral Next Step
            </span>
            <p className="text-xs font-semibold text-slate-900 leading-relaxed flex items-center gap-1.5">
              <ArrowRight className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{clarityResult.microActionAnchor}</span>
            </p>
          </div>

          {/* PHASE 3: SOMATIC GROUNDING EXIT (Physiological Sigh) */}
          <div className="p-4 bg-white border border-indigo-100 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-800 flex items-center gap-1.5">
                  <Wind className="w-3.5 h-3.5 text-indigo-600" />
                  Somatic Exit: The Physiological Sigh
                </span>
                <p className="text-[11px] text-slate-500">
                  Psychiatrists warn never to end an entry in high adrenaline. 2 short inhales + 1 long exhale down-regulates carbon dioxide in the alveoli.
                </p>
              </div>

              <button
                onClick={() => setIsAudioMuted(!isAudioMuted)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                title={isAudioMuted ? "Unmute tone" : "Mute tone"}
              >
                {isAudioMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-indigo-500" />}
              </button>
            </div>

            {/* Interactive Sigh Box */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200/70">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  isSighing
                    ? "bg-indigo-600 text-white scale-110 ring-4 ring-indigo-200"
                    : sighCompleted
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-200 text-slate-600"
                }`}>
                  {isSighing ? (
                    <Wind className="w-5 h-5 animate-pulse" />
                  ) : sighCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Heart className="w-4 h-4" />
                  )}
                </div>

                <div className="text-xs">
                  {isSighing ? (
                    <div className="space-y-0.5">
                      <span className="font-bold text-indigo-700 uppercase tracking-wide text-[11px]">
                        {sighStep === "inhale1" && "Deep Inhale (Nose)..."}
                        {sighStep === "inhale2" && "Quick Top-Off Inhale..."}
                        {sighStep === "exhale" && "Long Extended Sigh Out (Mouth)..."}
                        {sighStep === "rest" && "Rest and feel the drop..."}
                      </span>
                      <p className="text-[10px] text-slate-400 font-mono">
                        Cycle {sighCount + 1} of 3
                      </p>
                    </div>
                  ) : sighCompleted ? (
                    <span className="font-medium text-emerald-800">
                      Nervous system anchored. Heart rate gently calibrated.
                    </span>
                  ) : (
                    <span className="text-slate-600">
                      Take 3 guided physiological sighs before concluding.
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={runPhysiologicalSigh}
                disabled={isSighing}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-all shadow-2xs"
              >
                {isSighing ? "Sighing..." : sighCompleted ? "Do Again" : "Start 30s Sigh Pacer"}
              </button>
            </div>
          </div>

          {/* Action Footer: Insert to Journal & Save */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200/80">
            <button
              onClick={() => setActiveStep("vent")}
              className="text-xs text-slate-500 hover:text-slate-800 font-medium"
            >
              ← Edit / Add More Vent
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handleTransferToJournal}
                className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                Insert Breakdown into Journal
              </button>

              <button
                onClick={handleSaveToClarityVault}
                disabled={isSaving || hasSaved}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Saving...
                  </>
                ) : hasSaved ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Saved to Clarity Vault
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                    Save Clarity Record
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
