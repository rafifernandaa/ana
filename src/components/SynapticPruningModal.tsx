import React, { useState } from "react";
import { 
  Scissors, 
  Flame, 
  Sparkles, 
  Brain, 
  CheckCircle2, 
  X, 
  AlertCircle, 
  Layers, 
  RotateCcw,
  ArrowRight,
  ShieldCheck,
  Lightbulb
} from "lucide-react";
import confetti from "canvas-confetti";
import { PrunedThoughtLoop } from "../types";

interface SynapticPruningModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onSavePrunedLoop: (loop: PrunedThoughtLoop) => Promise<void>;
  initialDistortion?: string;
}

const DISTORTION_PRESETS = [
  { text: "I have to do everything perfectly or I'm a complete failure.", label: "All-or-Nothing" },
  { text: "They haven't replied yet, which means they are secretly mad at me.", label: "Mind Reading" },
  { text: "Something terrible is definitely going to happen next week.", label: "Catastrophizing" },
  { text: "I should be much further ahead in life than I am right now.", label: "Should Statement" },
  { text: "Everyone else has it figured out except me.", label: "Comparison / Personalization" },
];

export const SynapticPruningModal: React.FC<SynapticPruningModalProps> = ({
  isOpen,
  onClose,
  userId,
  onSavePrunedLoop,
  initialDistortion = "",
}) => {
  const [distortionInput, setDistortionInput] = useState(initialDistortion);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    distortionCategory: string;
    neurologicalTrap: string;
    newRewiredBelief: string;
    neuroscienceFact: string;
  } | null>(null);

  const [rewiredBelief, setRewiredBelief] = useState("");
  const [isDissolving, setIsDissolving] = useState(false);
  const [isPrunedSuccess, setIsPrunedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAnalyze = async () => {
    if (!distortionInput.trim()) return;
    setIsAnalyzing(true);
    setError(null);

    try {
      const res = await fetch("/api/gemini/prune-loop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ distortionText: distortionInput.trim() }),
      });

      if (!res.ok) {
        throw new Error("Failed to analyze thought loop. Please try again.");
      }

      const data = await res.json();
      setAnalysisResult(data);
      setRewiredBelief(data.newRewiredBelief || "");
    } catch (err: any) {
      console.error("Synaptic pruning analysis error:", err);
      setError(err?.message || "Failed to analyze thought loop.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExecutePrune = async () => {
    if (!analysisResult) return;
    setIsDissolving(true);

    // Trigger celebratory particle burn
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#f59e0b", "#ef4444", "#10b981", "#6366f1"],
    });

    const newPrunedLoop: PrunedThoughtLoop = {
      id: "pruned-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
      userId,
      oldDistortion: distortionInput.trim(),
      distortionCategory: (analysisResult.distortionCategory as any) || "catastrophizing",
      newRewiredBelief: rewiredBelief.trim() || analysisResult.newRewiredBelief,
      dissolvedAt: Date.now(),
    };

    try {
      await onSavePrunedLoop(newPrunedLoop);
      setTimeout(() => {
        setIsDissolving(false);
        setIsPrunedSuccess(true);
      }, 900);
    } catch (err: any) {
      console.error("Error persisting pruned loop:", err);
      setError("Failed to record pruned loop to database.");
      setIsDissolving(false);
    }
  };

  const handleReset = () => {
    setDistortionInput("");
    setAnalysisResult(null);
    setRewiredBelief("");
    setIsPrunedSuccess(false);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        id="synaptic-pruning-modal"
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-50 via-rose-50 to-indigo-50 border-b border-slate-200/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center text-white shadow-xs">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif font-bold text-lg text-slate-900">Thought Untangler</h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  Mindset Shift
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Identify unhelpful thinking habits & rewrite them into clear, grounded perspectives
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-white/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!isPrunedSuccess ? (
            <>
              {/* Step 1: Input the Rumination Loop */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                    <Flame className="w-4 h-4 text-amber-600" />
                    <span>1. Name the Sticky or Stressful Thought to Untangle</span>
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">Be completely honest</span>
                </div>

                <textarea
                  id="prune-distortion-textarea"
                  value={distortionInput}
                  onChange={(e) => setDistortionInput(e.target.value)}
                  placeholder="e.g. 'I am falling behind everyone else and I will never catch up...'"
                  rows={3}
                  className="w-full p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder:text-slate-400 resize-none font-sans"
                />

                {/* Preset Chips */}
                {!analysisResult && (
                  <div className="space-y-1.5">
                    <p className="text-[11px] text-slate-500 font-medium">Or choose a common thinking pattern:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {DISTORTION_PRESETS.map((preset, idx) => (
                        <button
                          key={idx}
                          onClick={() => setDistortionInput(preset.text)}
                          className="px-2.5 py-1 rounded-lg text-xs bg-slate-100 hover:bg-amber-50 hover:text-amber-900 hover:border-amber-200 text-slate-600 border border-slate-200/80 transition-all text-left cursor-pointer"
                        >
                          <span className="font-semibold">{preset.label}:</span> "{preset.text.slice(0, 38)}..."
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button: Analyze Distortion */}
              {!analysisResult && (
                <div className="pt-2 flex justify-end">
                  <button
                    id="analyze-prune-btn"
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || !distortionInput.trim()}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-700 hover:to-rose-700 text-white font-semibold text-xs shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-95"
                  >
                    {isAnalyzing ? (
                      <>
                        <Sparkles className="w-4 h-4 animate-spin text-amber-200" />
                        <span>Untangling Thought Pattern...</span>
                      </>
                    ) : (
                      <>
                        <Brain className="w-4 h-4" />
                        <span>Analyze Pattern & Create New Perspective</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Step 2: Diagnosis & Rewired Constructive Pathway */}
              {analysisResult && (
                <div className="space-y-4 pt-2 border-t border-slate-100 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {/* Category & Trap Card */}
                  <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/70 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-900 uppercase tracking-wide flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-amber-600" />
                        Pattern: {analysisResult.distortionCategory.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-xs text-amber-900/90 leading-relaxed">
                      <span className="font-semibold">Why this feels heavy:</span> {analysisResult.neurologicalTrap}
                    </p>
                    <div className="pt-1 text-[11px] text-slate-600 italic bg-white/70 p-2.5 rounded-lg border border-amber-200/50 flex items-start gap-1.5">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span><strong>Mindful Insight:</strong> {analysisResult.neuroscienceFact}</span>
                    </div>
                  </div>

                  {/* The Old vs New Crucible */}
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200/80">
                      <p className="text-[11px] font-bold text-rose-800 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Flame className="w-3 h-3 text-rose-600" />
                        Original Thought (Releasing)
                      </p>
                      <p className={`text-xs text-rose-950 font-medium italic transition-all duration-700 ${isDissolving ? 'line-through opacity-30 blur-xs' : ''}`}>
                        "{distortionInput}"
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 space-y-2">
                      <label className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        <span>New Grounded Perspective</span>
                      </label>
                      <textarea
                        value={rewiredBelief}
                        onChange={(e) => setRewiredBelief(e.target.value)}
                        rows={2}
                        className="w-full p-2.5 rounded-lg border border-emerald-300 bg-white text-emerald-950 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all resize-none"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={handleReset}
                      className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Start Over</span>
                    </button>

                    <button
                      id="confirm-prune-loop-btn"
                      onClick={handleExecutePrune}
                      disabled={isDissolving || !rewiredBelief.trim()}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                    >
                      {isDissolving ? (
                        <>
                          <Flame className="w-4 h-4 text-amber-300 animate-bounce" />
                          <span>Releasing Old Thought...</span>
                        </>
                      ) : (
                        <>
                          <Scissors className="w-4 h-4" />
                          <span>Release Thought & Save Perspective</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Success State */
            <div className="py-8 text-center space-y-5 animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1.5 max-w-md mx-auto">
                <h3 className="font-serif font-bold text-xl text-slate-900">Thought Successfully Untangled!</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  You have stepped back from the old unhelpful habit and anchored a clear, compassionate perspective.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-left max-w-lg mx-auto space-y-2">
                <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Your Grounded Truth</span>
                </div>
                <p className="text-xs text-slate-800 font-medium italic">
                  "{rewiredBelief}"
                </p>
              </div>

              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Untangle Another Thought
                </button>
                <button
                  onClick={onClose}
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Security Note */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200/70 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Persisted isolated under <code className="font-mono text-[10px]">/users/{userId}/pruned_loops</code></span>
          </div>
          <span>Reflect & Shift</span>
        </div>
      </div>
    </div>
  );
};
