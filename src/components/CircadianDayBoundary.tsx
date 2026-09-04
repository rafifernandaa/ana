/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import confetti from "canvas-confetti";
import { 
  Sun, 
  Moon, 
  Sunset, 
  Sunrise, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  RefreshCw, 
  Flame, 
  Heart, 
  Shield, 
  HelpCircle,
  Clock,
  Compass,
  Zap,
  Check,
  ChevronRight,
  ChevronDown,
  Layers,
  Wind,
  CloudRain,
  BatteryLow,
  Info
} from "lucide-react";
import { 
  CircadianPhase, 
  SleepQualityRating, 
  CircadianEntry, 
  JournalEntry,
  GeminiCircadianResponse 
} from "../types";
import { getCircadianCoachWithGemini } from "../lib/geminiService";
import { circadianAudio } from "../lib/circadianAudio";

interface CircadianDayBoundaryProps {
  userId?: string;
  activeJournalEntry?: JournalEntry | null;
  circadianEntries: CircadianEntry[];
  onSaveCircadianEntry: (entry: CircadianEntry) => Promise<void>;
  onInsertPromptToJournal?: (text: string) => void;
  onSetJournalMood?: (mood: any) => void;
}

const SLEEP_OPTIONS: { id: SleepQualityRating; label: string; icon: React.ComponentType<{ className?: string }>; desc: string }[] = [
  { id: "deep_rest", label: "Deeply Restored", icon: Sparkles, desc: "Awake, refreshed, high vitality" },
  { id: "adequate", label: "Steady / Normal", icon: Wind, desc: "Good baseline, grounded" },
  { id: "light_broken", label: "Wired / Light", icon: Zap, desc: "Slightly racing, restless mind" },
  { id: "restless", label: "Broken Sleep", icon: CloudRain, desc: "Tired body, interrupted rest" },
  { id: "exhausted", label: "Low Battery", icon: BatteryLow, desc: "Needs gentle pacing & self-care" },
];

export const CircadianDayBoundary: React.FC<CircadianDayBoundaryProps> = ({
  userId,
  activeJournalEntry,
  circadianEntries,
  onSaveCircadianEntry,
  onInsertPromptToJournal,
  onSetJournalMood,
}) => {
  // Determine current local circadian phase automatically
  const detectedPhase = useMemo<CircadianPhase>(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "dawn_morning";
    if (hour >= 12 && hour < 17) return "midday";
    if (hour >= 17 && hour < 22) return "dusk_evening";
    return "night_harbor";
  }, []);

  const [activePhase, setActivePhase] = useState<CircadianPhase>(detectedPhase);
  const [sleepQuality, setSleepQuality] = useState<SleepQualityRating>("adequate");
  const [energyLevel, setEnergyLevel] = useState<number>(3);
  const [morningIntention, setMorningIntention] = useState("");
  const [anticipatedFriction, setAnticipatedFriction] = useState("");
  const [groundingAnchor, setGroundingAnchor] = useState("");
  
  // Evening / Loop Closing state
  const [eveningNotes, setEveningNotes] = useState("");
  const [worryDeposit, setWorryDeposit] = useState("");
  const [isLoopClosed, setIsLoopClosed] = useState(false);

  // Audio resonance state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioVolume, setAudioVolume] = useState(0.35);

  // Gemini AI Circadian Coach state
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiCoachResult, setAiCoachResult] = useState<GeminiCircadianResponse | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isSavedRecently, setIsSavedRecently] = useState(false);

  // Find today's morning entry for Loop Closing
  const todayDateKey = useMemo(() => new Date().toISOString().split("T")[0], []);
  const todayMorningCheckIn = useMemo(() => {
    return circadianEntries.find(
      e => e.dateKey === todayDateKey && (e.phase === "dawn_morning" || !!e.morningIntention)
    );
  }, [circadianEntries, todayDateKey]);

  // Sync state if today's checkin exists
  useEffect(() => {
    if (todayMorningCheckIn && (activePhase === "dawn_morning" || !morningIntention)) {
      if (todayMorningCheckIn.sleepQuality) setSleepQuality(todayMorningCheckIn.sleepQuality);
      if (todayMorningCheckIn.energyLevel) setEnergyLevel(todayMorningCheckIn.energyLevel);
      if (todayMorningCheckIn.morningIntention) setMorningIntention(todayMorningCheckIn.morningIntention);
      if (todayMorningCheckIn.anticipatedFriction) setAnticipatedFriction(todayMorningCheckIn.anticipatedFriction);
      if (todayMorningCheckIn.groundingAnchor) setGroundingAnchor(todayMorningCheckIn.groundingAnchor);
    }
  }, [todayMorningCheckIn, activePhase]);

  // Format time of day display
  const currentTimeString = useMemo(() => {
    return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }, []);

  // Handle Web Audio Resonance toggle
  const toggleCircadianAudio = () => {
    if (isPlayingAudio) {
      circadianAudio.stop();
      setIsPlayingAudio(false);
    } else {
      circadianAudio.setVolume(audioVolume);
      circadianAudio.play(activePhase);
      setIsPlayingAudio(true);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setAudioVolume(val);
    circadianAudio.setVolume(val);
  };

  // Phase metadata using custom accents: Dawn #A6535A, Midday #D9414E, Dusk #735053, Night #332425 on dark grey base (#262626)
  const phaseConfig = useMemo(() => {
    switch (activePhase) {
      case "dawn_morning":
        return {
          title: "Dawn Launch & Intention",
          subtitle: "Prime your focus, anticipate friction & anchor your day",
          icon: Sunrise,
          accentHex: "#A6535A",
          iconColor: "text-[#A6535A]",
          badgeBg: "bg-[#A6535A]/15 text-[#A6535A] border-[#A6535A]/50",
          cardBorder: "border-[#A6535A]/40",
          activeBtnBg: "bg-[#A6535A] hover:bg-[#A6535A]/90 text-white",
          audioName: "Alpha Focus (10Hz Drone + Chime)",
          defaultPrompt: "What is my 1 steady priority today, and how will I protect my peace?",
        };
      case "midday":
        return {
          title: "Midday Realignment",
          subtitle: "60-second clarity check, calibrate pace without judgment",
          icon: Sun,
          accentHex: "#D9414E",
          iconColor: "text-[#D9414E]",
          badgeBg: "bg-[#D9414E]/15 text-[#D9414E] border-[#D9414E]/50",
          cardBorder: "border-[#D9414E]/40",
          activeBtnBg: "bg-[#D9414E] hover:bg-[#D9414E]/90 text-white",
          audioName: "Gamma Clarity (40Hz Clean Wave)",
          defaultPrompt: "Where is my energy currently flowing, and what can I simplify right now?",
        };
      case "dusk_evening":
        return {
          title: "Dusk Release & Loop Closing",
          subtitle: "Debrief reality, celebrate glimmers & close morning intentions",
          icon: Sunset,
          accentHex: "#735053",
          iconColor: "text-[#c2969a]",
          badgeBg: "bg-[#735053]/25 text-[#d8a8ac] border-[#735053]",
          cardBorder: "border-[#735053]",
          activeBtnBg: "bg-[#735053] hover:bg-[#735053]/90 text-white",
          audioName: "Theta Decompression (6Hz Resonance)",
          defaultPrompt: "How did my intention meet reality today, and what can I celebrate?",
        };
      case "night_harbor":
        return {
          title: "Night Harbor & Sleep Deposit",
          subtitle: "Deposit open loops on paper so your mind rests peacefully",
          icon: Moon,
          accentHex: "#332425",
          iconColor: "text-[#d8a8ac]",
          badgeBg: "bg-[#332425] text-[#d8a8ac] border-[#735053]",
          cardBorder: "border-[#735053]",
          activeBtnBg: "bg-[#332425] hover:bg-[#332425]/90 text-white border border-[#735053]",
          audioName: "Delta Sleep Harbor (2Hz Deep Hum)",
          defaultPrompt: "What thoughts can I deposit here so they don't follow me into sleep?",
        };
    }
  }, [activePhase]);

  // Trigger Gemini AI Circadian Coach
  const handleGenerateAiCircadianPrime = async () => {
    setIsAiLoading(true);
    setAiError(null);

    try {
      const res = await getCircadianCoachWithGemini({
        phase: activePhase,
        sleepQuality,
        energyLevel,
        morningIntention: morningIntention.trim() || undefined,
        anticipatedFriction: anticipatedFriction.trim() || undefined,
        recentMorningIntention: todayMorningCheckIn?.morningIntention || undefined,
        journalContent: activeJournalEntry?.content || "",
      });

      setAiCoachResult(res);
      confetti({
        particleCount: 35,
        spread: 55,
        origin: { y: 0.75 },
        colors: ["#f59e0b", "#6366f1", "#10b981"],
      });
    } catch (err: any) {
      console.error("Circadian coach error:", err);
      setAiError(err.message || "Failed to generate circadian coaching guidance.");
    } finally {
      setIsAiLoading(false);
    }
  };

  // Save Circadian Entry to Firestore
  const handleSaveCheckIn = async (markClosed = false) => {
    if (!userId) return;

    const entryToSave: CircadianEntry = {
      id: todayMorningCheckIn?.id || "circadian-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
      userId,
      phase: activePhase,
      sleepQuality,
      energyLevel,
      morningIntention: morningIntention.trim() || undefined,
      anticipatedFriction: anticipatedFriction.trim() || undefined,
      groundingAnchor: groundingAnchor.trim() || undefined,
      loopClosedNotes: eveningNotes.trim() || undefined,
      isLoopClosed: markClosed || isLoopClosed,
      timestamp: Date.now(),
      dateKey: todayDateKey,
      journalEntryId: activeJournalEntry?.id,
    };

    try {
      await onSaveCircadianEntry(entryToSave);
      setIsSavedRecently(true);
      if (markClosed) {
        setIsLoopClosed(true);
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#10b981", "#6366f1", "#fbbf24"],
        });
      }
      setTimeout(() => setIsSavedRecently(false), 3000);
    } catch (err) {
      console.error("Error saving circadian check-in:", err);
    }
  };

  // Insert generated or standard morning blueprint into active journal
  const handleInsertBlueprintToJournal = () => {
    if (!onInsertPromptToJournal) return;

    let blueprint = "";
    if (activePhase === "dawn_morning") {
      blueprint = `### Circadian Morning Launch (${currentTimeString})\n` +
        `- **Sleep Recovery:** ${SLEEP_OPTIONS.find(s => s.id === sleepQuality)?.label || sleepQuality}\n` +
        `- **Energy Gauge:** ${energyLevel}/5\n` +
        (morningIntention ? `- **Primary Intention:** ${morningIntention}\n` : "") +
        (anticipatedFriction ? `- **Anticipated Friction:** ${anticipatedFriction}\n` : "") +
        (groundingAnchor ? `- **Grounding Anchor:** ${groundingAnchor}\n` : "") +
        (aiCoachResult ? `\n> **Circadian Prime:** ${aiCoachResult.primePrompt}\n> *${aiCoachResult.frictionAdvice}*\n` : "") +
        `\n**My Reflection:**\n`;
    } else if (activePhase === "midday") {
      blueprint = `### Midday Realignment (${currentTimeString})\n` +
        `- **Midday Energy:** ${energyLevel}/5\n` +
        (todayMorningCheckIn?.morningIntention ? `- **Morning Intention Check:** "${todayMorningCheckIn.morningIntention}"\n` : "") +
        (aiCoachResult ? `\n> **Midday Calibration:** ${aiCoachResult.primePrompt}\n` : "") +
        `\n**Midday Notes:**\n`;
    } else {
      blueprint = `### Evening Decompression & Loop Closing (${currentTimeString})\n` +
        (todayMorningCheckIn?.morningIntention ? `- **Morning Intention:** "${todayMorningCheckIn.morningIntention}"\n` : "") +
        (eveningNotes ? `- **Loop Closing Debrief:** ${eveningNotes}\n` : "") +
        (worryDeposit ? `- **Deposited Worries (Left Here):** ${worryDeposit}\n` : "") +
        (aiCoachResult ? `\n> **Evening Reflection:** ${aiCoachResult.primePrompt}\n` : "") +
        `\n**Evening Free Write:**\n`;
    }

    onInsertPromptToJournal(blueprint);
    if (onSetJournalMood) {
      if (activePhase === "dawn_morning") onSetJournalMood("focused");
      else if (activePhase === "midday") onSetJournalMood("energized");
      else if (activePhase === "dusk_evening") onSetJournalMood("reflective");
      else onSetJournalMood("peaceful");
    }
  };

  const IconComponent = phaseConfig.icon;

  return (
    <div 
      id="circadian-day-boundary-card"
      className="rounded-2xl border transition-all duration-300 p-4 sm:p-5 mb-6 text-white shadow-xl bg-[#262626] border-[#333333]"
    >
      {/* Top Header: Phase Selector, Time, Sound Generator */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#333333]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#1f1f1f] border border-[#333333] shadow-xs">
            <IconComponent className={`w-5 h-5 ${phaseConfig.iconColor}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${phaseConfig.badgeBg}`}>
                {phaseConfig.title}
              </span>
              <span className="text-[11px] font-mono text-[#8C8C8C] flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {currentTimeString}
              </span>
            </div>
            <p className="text-xs text-[#8C8C8C] font-medium mt-0.5">
              {phaseConfig.subtitle}
            </p>
          </div>
        </div>

        {/* Phase Selector & Sound Generator */}
        <div className="flex items-center gap-2">
          {/* Phase manual switcher with distinct accents per phase */}
          <div className="flex bg-[#1f1f1f] p-0.5 rounded-xl border border-[#333333] text-[11px] shadow-xs">
            <button
              onClick={() => setActivePhase("dawn_morning")}
              title="Morning (05:00 - 11:59) - Accent #A6535A"
              className={`px-2 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1 ${
                activePhase === "dawn_morning" 
                  ? "bg-[#A6535A] text-white font-semibold shadow-xs" 
                  : "text-[#8C8C8C] hover:text-white hover:bg-[#2c2c2c]"
              }`}
            >
              <Sunrise className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Dawn</span>
            </button>
            <button
              onClick={() => setActivePhase("midday")}
              title="Midday (12:00 - 16:59) - Accent #D9414E"
              className={`px-2 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1 ${
                activePhase === "midday" 
                  ? "bg-[#D9414E] text-white font-semibold shadow-xs" 
                  : "text-[#8C8C8C] hover:text-white hover:bg-[#2c2c2c]"
              }`}
            >
              <Sun className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Midday</span>
            </button>
            <button
              onClick={() => setActivePhase("dusk_evening")}
              title="Evening (17:00 - 21:59) - Accent #735053"
              className={`px-2 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1 ${
                activePhase === "dusk_evening" 
                  ? "bg-[#735053] text-white font-semibold shadow-xs" 
                  : "text-[#8C8C8C] hover:text-white hover:bg-[#2c2c2c]"
              }`}
            >
              <Sunset className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Dusk</span>
            </button>
            <button
              onClick={() => setActivePhase("night_harbor")}
              title="Night (22:00 - 04:59) - Accent #332425"
              className={`px-2 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1 ${
                activePhase === "night_harbor" 
                  ? "bg-[#332425] text-white font-semibold border border-[#735053] shadow-xs" 
                  : "text-[#8C8C8C] hover:text-white hover:bg-[#2c2c2c]"
              }`}
            >
              <Moon className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Night</span>
            </button>
          </div>

          {/* Web Audio Circadian Resonance Synth Toggle */}
          <button
            onClick={toggleCircadianAudio}
            title={isPlayingAudio ? "Pause Ambient Resonance" : `Play ${phaseConfig.audioName}`}
            className={`p-2 rounded-xl border text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              isPlayingAudio 
                ? "bg-[#D9414E] text-white border-[#D9414E] shadow-sm animate-pulse" 
                : "bg-[#1f1f1f] text-[#8C8C8C] hover:text-white border-[#333333] shadow-xs"
            }`}
          >
            {isPlayingAudio ? <Volume2 className="w-4 h-4 text-white" /> : <VolumeX className="w-4 h-4 text-[#8C8C8C]" />}
            <span className="hidden md:inline text-[10px]">
              {isPlayingAudio ? "Resonating" : "Soundscape"}
            </span>
          </button>
        </div>
      </div>

      {/* Main Interactive Body */}
      <div className="pt-4 space-y-4">
        {/* MORNING / DAWN MODE (Accent: #A6535A) */}
        {activePhase === "dawn_morning" && (
          <div className="space-y-3.5">
            {/* 1. Sleep Recovery & Energy Level */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Sleep Status */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#8C8C8C] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#A6535A]" />
                  <span>Sleep Recovery Check</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {SLEEP_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSleepQuality(opt.id)}
                      className={`p-2 rounded-xl border text-left transition-all cursor-pointer text-xs ${
                        sleepQuality === opt.id
                          ? "bg-[#A6535A]/20 border-2 border-[#A6535A] text-white font-semibold shadow-xs"
                          : "bg-[#1f1f1f] border-[#333333] text-[#8C8C8C] hover:text-white hover:border-[#A6535A]/40"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <opt.icon className={`w-3.5 h-3.5 shrink-0 ${sleepQuality === opt.id ? "text-[#A6535A]" : "text-[#8C8C8C]"}`} />
                        <span className="truncate">{opt.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Energy Level Slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#8C8C8C] flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-[#A6535A]" />
                    <span>Current Energy Vitality</span>
                  </span>
                  <span className="font-bold font-mono text-[#A6535A]">
                    {energyLevel === 1 ? "1 - Depleted" : energyLevel === 2 ? "2 - Low" : energyLevel === 3 ? "3 - Balanced" : energyLevel === 4 ? "4 - High" : "5 - Peak"}
                  </span>
                </div>
                <div className="bg-[#1f1f1f] p-3 rounded-xl border border-[#333333]">
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={energyLevel}
                    onChange={(e) => setEnergyLevel(parseInt(e.target.value))}
                    className="w-full accent-[#A6535A] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-[#666666] mt-1 font-mono">
                    <span>1 (Gently Rest)</span>
                    <span>3 (Steady)</span>
                    <span>5 (Charge Ahead)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Morning Intention & Friction Anticipation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#8C8C8C] flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5 text-[#A6535A]" />
                  <span>My 1 Steady Intention Today</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Prioritize clarity over rushing; stay patient in team review."
                  value={morningIntention}
                  onChange={(e) => setMorningIntention(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#1f1f1f] border border-[#333333] text-white placeholder:text-[#666666] text-xs focus:ring-2 focus:ring-[#A6535A]/20 focus:border-[#A6535A] outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#8C8C8C] flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-[#A6535A]" />
                  <span>Anticipated Friction & Grounding Anchor</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. If emails feel chaotic, I will take 3 deep belly breaths before responding."
                  value={anticipatedFriction}
                  onChange={(e) => setAnticipatedFriction(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#1f1f1f] border border-[#333333] text-white placeholder:text-[#666666] text-xs focus:ring-2 focus:ring-[#A6535A]/20 focus:border-[#A6535A] outline-hidden"
                />
              </div>
            </div>
          </div>
        )}

        {/* MIDDAY MODE (Accent: #D9414E) */}
        {activePhase === "midday" && (
          <div className="space-y-3">
            {todayMorningCheckIn?.morningIntention && (
              <div className="p-3 rounded-xl bg-[#1f1f1f] border border-[#D9414E]/50 text-xs text-white flex items-start gap-2.5">
                <Sun className="w-4 h-4 text-[#D9414E] shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-[#D9414E] block">Morning Anchor in Play:</span>
                  <p className="italic text-[#e2e8f0]">"{todayMorningCheckIn.morningIntention}"</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#8C8C8C]">Midday Energy Status</span>
                  <span className="font-bold font-mono text-[#D9414E]">{energyLevel} / 5</span>
                </div>
                <div className="bg-[#1f1f1f] p-3 rounded-xl border border-[#333333]">
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={energyLevel}
                    onChange={(e) => setEnergyLevel(parseInt(e.target.value))}
                    className="w-full accent-[#D9414E] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-[#666666] mt-1 font-mono">
                    <span>1 (Low)</span>
                    <span>3 (Balanced)</span>
                    <span>5 (Peak)</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 sm:pt-0">
                <button
                  onClick={handleGenerateAiCircadianPrime}
                  disabled={isAiLoading}
                  className="px-3 py-2 rounded-xl bg-[#D9414E] hover:bg-[#D9414E]/90 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isAiLoading ? "Calibrating..." : "AI Midday Clarity Check"}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DUSK / NIGHT MODE & LOOP CLOSING (Dusk Accent: #735053, Night Accent: #332425) */}
        {(activePhase === "dusk_evening" || activePhase === "night_harbor") && (
          <div className="space-y-3.5">
            {/* Lens 3: Daily Loop Closing Section */}
            {todayMorningCheckIn?.morningIntention ? (
              <div className={`p-3.5 rounded-xl bg-[#1f1f1f] border text-xs space-y-2 ${
                activePhase === "dusk_evening" ? "border-[#735053]" : "border-[#332425]"
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-[#d8a8ac]">
                    <CheckCircle2 className="w-4 h-4 text-[#735053]" />
                    <span>The Daily Loop Closer</span>
                  </div>
                  {isLoopClosed || todayMorningCheckIn.isLoopClosed ? (
                    <span className="px-2 py-0.5 rounded-full bg-[#735053] text-white text-[10px] font-bold border border-[#735053] flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>Loop Closed Today</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-[#c2969a] font-medium">
                      Open Intention from Morning
                    </span>
                  )}
                </div>

                <div className="p-2.5 rounded-lg bg-[#262626] border border-[#333333] text-white text-xs">
                  <span className="text-[#8C8C8C] text-[10px] font-semibold block uppercase">This Morning You Set:</span>
                  <p className="font-medium text-white mt-0.5">"{todayMorningCheckIn.morningIntention}"</p>
                  {todayMorningCheckIn.groundingAnchor && (
                    <p className="text-[11px] text-[#8C8C8C] mt-1">Anchor: {todayMorningCheckIn.groundingAnchor}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#8C8C8C] block">
                    How did this unfold today? (Debrief & integrate)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. I stayed steady until 3 PM, then got overwhelmed but recovered with breathwork."
                    value={eveningNotes}
                    onChange={(e) => setEveningNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#262626] border border-[#333333] text-white placeholder:text-[#666666] text-xs focus:ring-2 focus:ring-[#735053]/20 focus:border-[#735053] outline-hidden"
                  />
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-[#1f1f1f] border border-[#333333] text-xs text-[#8C8C8C]">
                <p className="text-[11px] flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-[#735053] shrink-0" />
                  <span><strong>Tip:</strong> Log your intention tomorrow morning to enable automatic evening loop closing!</span>
                </p>
              </div>
            )}

            {/* Night Harbor Worry Deposit (Night Accent: #332425) */}
            {activePhase === "night_harbor" && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#8C8C8C] flex items-center gap-1">
                  <Moon className="w-3.5 h-3.5 text-[#d8a8ac]" />
                  <span>Worry Deposit (Leave it on this page so you sleep light)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="What thoughts are lingering? Type them here to symbolically leave them behind for the night..."
                  value={worryDeposit}
                  onChange={(e) => setWorryDeposit(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#1f1f1f] border-2 border-[#332425] text-white placeholder:text-[#666666] text-xs focus:ring-2 focus:ring-[#735053]/20 focus:border-[#735053] outline-hidden"
                />
              </div>
            )}
          </div>
        )}

        {/* AI Circadian Coach Result Card (if generated) */}
        {aiCoachResult && (
          <div className="p-3.5 rounded-xl bg-[#1f1f1f] border border-[#333333] shadow-sm text-xs space-y-2.5 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className={`font-bold flex items-center gap-1.5 ${phaseConfig.iconColor}`}>
                <Sparkles className="w-4 h-4" />
                <span>Circadian Prime Insight</span>
              </span>
              <span className="text-[10px] text-[#666666] font-mono">Gemini 3.6 Flash</span>
            </div>

            <p className="text-white font-medium leading-relaxed">
              "{aiCoachResult.primePrompt}"
            </p>

            {aiCoachResult.frictionAdvice && (
              <div className="p-2 rounded-lg bg-[#262626] border border-[#333333] text-[#8C8C8C] text-[11px]">
                <strong className="text-white">Grounded Strategy:</strong> {aiCoachResult.frictionAdvice}
              </div>
            )}

            {aiCoachResult.loopClosingQuestions && aiCoachResult.loopClosingQuestions.length > 0 && (
              <div className="p-2 rounded-lg bg-[#262626] border border-[#333333] text-[#8C8C8C] text-[11px] space-y-1">
                <strong className="block text-[10px] uppercase font-bold text-white">Loop Closing Questions:</strong>
                {aiCoachResult.loopClosingQuestions.map((q, idx) => (
                  <p key={idx} className="italic text-white/90">• {q}</p>
                ))}
              </div>
            )}

            <div className={`text-[11px] font-medium italic flex items-center gap-1.5 ${phaseConfig.iconColor}`}>
              <Heart className="w-3.5 h-3.5 shrink-0" />
              <span>{aiCoachResult.restorationAffirmation}</span>
            </div>
          </div>
        )}

        {/* Bottom Actions Row */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-[#333333]">
          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerateAiCircadianPrime}
              disabled={isAiLoading}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 ${phaseConfig.activeBtnBg}`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {isAiLoading ? "Generating..." : activePhase === "dawn_morning" ? "AI Morning Prime" : activePhase === "midday" ? "AI Midday Clarity" : "AI Loop Closer"}
              </span>
            </button>

            {/* Loop Close Button in Evening */}
            {(activePhase === "dusk_evening" || activePhase === "night_harbor") && todayMorningCheckIn && (
              <button
                onClick={() => handleSaveCheckIn(true)}
                className="px-3 py-1.5 rounded-xl bg-[#735053] hover:bg-[#735053]/90 text-white text-xs font-semibold shadow-xs flex items-center gap-1 transition-all cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Mark Loop Closed</span>
              </button>
            )}

            <button
              onClick={() => handleSaveCheckIn(false)}
              className="px-3 py-1.5 rounded-xl bg-[#1f1f1f] border border-[#333333] text-white hover:bg-[#2c2c2c] text-xs font-medium shadow-xs transition-all cursor-pointer"
            >
              {isSavedRecently ? "Saved Check-in" : "Save State"}
            </button>
          </div>

          {/* Insert Blueprint to Journal */}
          {onInsertPromptToJournal && (
            <button
              onClick={handleInsertBlueprintToJournal}
              className="px-3.5 py-1.5 rounded-xl bg-[#333333] hover:bg-[#3d3d3d] border border-[#444444] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span>Insert into Journal Canvas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
