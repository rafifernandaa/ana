import React, { useState } from "react";
import { 
  Activity, 
  Moon, 
  Zap, 
  Brain, 
  CheckCircle2, 
  XCircle, 
  TrendingUp, 
  AlertTriangle, 
  Compass, 
  Sparkles, 
  BarChart3, 
  RefreshCw,
  Sliders,
  Check
} from "lucide-react";
import { EmpiricalTelemetry, EmpiricalHabits } from "../types";
import { useTheme } from "../lib/theme";

interface EmpiricalTelemetryCardProps {
  telemetry: EmpiricalTelemetry | undefined;
  isExtracting: boolean;
  onExtractTelemetry: () => Promise<void>;
  onUpdateTelemetry?: (updated: EmpiricalTelemetry) => void;
  readOnly?: boolean;
}

export const EmpiricalTelemetryCard: React.FC<EmpiricalTelemetryCardProps> = ({
  telemetry,
  isExtracting,
  onExtractTelemetry,
  onUpdateTelemetry,
  readOnly = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localTelemetry, setLocalTelemetry] = useState<EmpiricalTelemetry | undefined>(telemetry);

  // Sync state when telemetry changes from props
  React.useEffect(() => {
    setLocalTelemetry(telemetry);
  }, [telemetry]);

  const handleSliderChange = (field: "sleepScore" | "energyLevel" | "somaticTension" | "mentalClarity", value: number) => {
    if (readOnly || !localTelemetry) return;
    const updated = {
      ...localTelemetry,
      [field]: value,
    };
    setLocalTelemetry(updated);
    onUpdateTelemetry?.(updated);
  };

  const handleHabitToggle = (habitKey: keyof EmpiricalHabits) => {
    if (readOnly || !localTelemetry) return;
    const updatedHabits = {
      ...localTelemetry.binaryHabits,
      [habitKey]: !localTelemetry.binaryHabits[habitKey],
    };
    const updated = {
      ...localTelemetry,
      binaryHabits: updatedHabits,
    };
    setLocalTelemetry(updated);
    onUpdateTelemetry?.(updated);
  };

  const { isLight } = useTheme();

  if (!telemetry && !localTelemetry) {
    return (
      <div 
        id="empirical-telemetry-empty-card"
        className={`rounded-xl border p-4 transition-colors shadow-xs ${
          isLight
            ? "bg-white border-stone-200 text-stone-900 shadow-xs"
            : "bg-[#262626] dark:bg-stone-900/40 border-[#3D4028] dark:border-stone-800 text-white"
        }`}
        style={isLight ? { backgroundColor: "#ffffff" } : undefined}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isLight 
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400"
            }`}>
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h4 className={`text-xs font-semibold uppercase tracking-wider ${
                isLight ? "text-stone-800" : "text-stone-700 dark:text-stone-300"
              }`}>
                Empirical Telemetry & Statistics
              </h4>
              <p className={`text-xs mt-0.5 ${
                isLight ? "text-stone-600" : "text-stone-500 dark:text-stone-400"
              }`}>
                Quantify feelings (0-7 sleep, 0-10 energy), binary habits, and next-day lagged impact from your writing.
              </p>
            </div>
          </div>
          <button
            id="extract-telemetry-btn-initial"
            type="button"
            onClick={onExtractTelemetry}
            disabled={isExtracting}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition-colors disabled:opacity-50 shrink-0 shadow-sm"
          >
            {isExtracting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Quantifying...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Extract Stats</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  const active = localTelemetry || telemetry!;

  // Format sleep label
  const getSleepLabel = (score: number) => {
    if (score >= 6) return "Deep Restorative";
    if (score >= 4) return "Adequate";
    if (score >= 2) return "Restless / Broken";
    return "Severe Sleep Debt";
  };

  const getTensionColor = (tension: number) => {
    if (tension <= 3) return "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800";
    if (tension <= 6) return "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800";
    return "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800";
  };

  const formatHabitName = (key: keyof EmpiricalHabits) => {
    switch (key) {
      case "exercised": return "Exercised / Movement";
      case "mindfulnessMeditation": return "Mindful Breath / Meditation";
      case "deepWorkSession": return "Deep Work Session";
      case "lateScreenTime": return "Late Screen Stimulus";
      case "socialConnection": return "Social Connection";
      case "hadGoodDay": return "Overall Good Day";
      default: return key;
    }
  };

  return (
    <div 
      id="empirical-telemetry-panel"
      className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm overflow-hidden transition-colors"
    >
      {/* Top Header */}
      <div className="px-4 py-3 bg-stone-50/80 dark:bg-stone-850 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
            <BarChart3 className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-800 dark:text-stone-200">
            Empirical Statistical Telemetry
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-stone-200/80 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
            Variations A + C + F
          </span>
        </div>

        <div className="flex items-center gap-2">
          {!readOnly && (
            <button
              id="telemetry-edit-toggle-btn"
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 flex items-center gap-1 transition-colors px-2 py-1 rounded"
              title="Fine-tune values manually"
            >
              <Sliders className="w-3 h-3" />
              <span>{isEditing ? "Done" : "Tune"}</span>
            </button>
          )}

          <button
            id="re-extract-telemetry-btn"
            type="button"
            onClick={onExtractTelemetry}
            disabled={isExtracting}
            className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 disabled:opacity-50"
            title="Re-extract with Gemini"
          >
            <RefreshCw className={`w-3 h-3 ${isExtracting ? "animate-spin" : ""}`} />
            <span>{isExtracting ? "Computing..." : "Re-extract"}</span>
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Metric Scales: Sleep (0-7), Energy (0-10), Tension (0-10), Clarity (0-10) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              Quantified Subjective Scales
            </span>
            <span className="text-[10px] text-stone-400 dark:text-stone-500">
              Confidence: {Math.round((active.confidenceScore || 0.85) * 100)}%
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Sleep Score (0-7) */}
            <div className="p-2.5 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50">
              <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 mb-1">
                <span className="flex items-center gap-1 font-medium">
                  <Moon className="w-3.5 h-3.5 text-indigo-500" />
                  Sleep (0-7)
                </span>
                <span className="font-mono font-bold text-stone-900 dark:text-stone-100">
                  {active.sleepScore} / 7
                </span>
              </div>
              <div className="text-[10px] text-stone-500 dark:text-stone-400 mb-1.5 truncate">
                {getSleepLabel(active.sleepScore)}
              </div>
              {isEditing ? (
                <input
                  type="range"
                  min="0"
                  max="7"
                  value={active.sleepScore}
                  onChange={(e) => handleSliderChange("sleepScore", Number(e.target.value))}
                  className="w-full h-1 bg-stone-200 dark:bg-stone-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              ) : (
                <div className="w-full bg-stone-200 dark:bg-stone-800 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-indigo-500 h-1.5 rounded-full transition-all" 
                    style={{ width: `${(active.sleepScore / 7) * 100}%` }} 
                  />
                </div>
              )}
            </div>

            {/* Energy Level (0-10) */}
            <div className="p-2.5 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50">
              <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 mb-1">
                <span className="flex items-center gap-1 font-medium">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  Energy (0-10)
                </span>
                <span className="font-mono font-bold text-stone-900 dark:text-stone-100">
                  {active.energyLevel} / 10
                </span>
              </div>
              <div className="text-[10px] text-stone-500 dark:text-stone-400 mb-1.5">
                {active.energyLevel >= 7 ? "High Vitality" : active.energyLevel >= 4 ? "Functional" : "Depleted"}
              </div>
              {isEditing ? (
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={active.energyLevel}
                  onChange={(e) => handleSliderChange("energyLevel", Number(e.target.value))}
                  className="w-full h-1 bg-stone-200 dark:bg-stone-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              ) : (
                <div className="w-full bg-stone-200 dark:bg-stone-800 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-amber-500 h-1.5 rounded-full transition-all" 
                    style={{ width: `${(active.energyLevel / 10) * 100}%` }} 
                  />
                </div>
              )}
            </div>

            {/* Somatic Tension (0-10) */}
            <div className="p-2.5 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50">
              <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 mb-1">
                <span className="flex items-center gap-1 font-medium">
                  <Activity className="w-3.5 h-3.5 text-rose-500" />
                  Tension (0-10)
                </span>
                <span className="font-mono font-bold text-stone-900 dark:text-stone-100">
                  {active.somaticTension} / 10
                </span>
              </div>
              <div className="text-[10px] text-stone-500 dark:text-stone-400 mb-1.5">
                {active.somaticTension <= 3 ? "Regulated" : active.somaticTension <= 6 ? "Elevated" : "Acute Gripping"}
              </div>
              {isEditing ? (
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={active.somaticTension}
                  onChange={(e) => handleSliderChange("somaticTension", Number(e.target.value))}
                  className="w-full h-1 bg-stone-200 dark:bg-stone-700 rounded-lg appearance-none cursor-pointer accent-rose-500"
                />
              ) : (
                <div className="w-full bg-stone-200 dark:bg-stone-800 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-rose-500 h-1.5 rounded-full transition-all" 
                    style={{ width: `${(active.somaticTension / 10) * 100}%` }} 
                  />
                </div>
              )}
            </div>

            {/* Mental Clarity (0-10) */}
            <div className="p-2.5 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50">
              <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 mb-1">
                <span className="flex items-center gap-1 font-medium">
                  <Brain className="w-3.5 h-3.5 text-sky-500" />
                  Clarity (0-10)
                </span>
                <span className="font-mono font-bold text-stone-900 dark:text-stone-100">
                  {active.mentalClarity} / 10
                </span>
              </div>
              <div className="text-[10px] text-stone-500 dark:text-stone-400 mb-1.5">
                {active.mentalClarity >= 7 ? "Sharp Focus" : active.mentalClarity >= 4 ? "Moderate" : "Brain Fog"}
              </div>
              {isEditing ? (
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={active.mentalClarity}
                  onChange={(e) => handleSliderChange("mentalClarity", Number(e.target.value))}
                  className="w-full h-1 bg-stone-200 dark:bg-stone-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
                />
              ) : (
                <div className="w-full bg-stone-200 dark:bg-stone-800 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-sky-500 h-1.5 rounded-full transition-all" 
                    style={{ width: `${(active.mentalClarity / 10) * 100}%` }} 
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Binary Habit Flags */}
        <div>
          <div className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2">
            Binary Behavioral Flags
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {(Object.keys(active.binaryHabits) as (keyof EmpiricalHabits)[]).map((key) => {
              const isChecked = active.binaryHabits[key];
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleHabitToggle(key)}
                  disabled={readOnly && !isEditing}
                  className={`flex items-center justify-between p-2 rounded-lg border text-xs transition-all ${
                    isChecked
                      ? "border-emerald-300 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-medium"
                      : "border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-500 dark:text-stone-400 hover:border-stone-300"
                  }`}
                >
                  <span className="truncate pr-1">{formatHabitName(key)}</span>
                  {isChecked ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-stone-300 dark:text-stone-600 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Thematic Coding & Circadian Phase */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-stone-100 dark:border-stone-800/80">
          <div>
            <div className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1.5">
              Thematic Stressor Codes
            </div>
            <div className="flex flex-wrap gap-1.5">
              {active.thematicStressors.map((code, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded text-[11px] font-mono bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700"
                >
                  #{code}
                </span>
              ))}
              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {active.cognitiveDisposition.replace(/_/g, " ")}
              </span>
            </div>
          </div>

          <div>
            <div className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Circadian Alignment (Variation C)</span>
              <span className="text-stone-700 dark:text-stone-300 font-mono">
                {active.circadianAlignmentScore}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5" />
                <span className="capitalize">{active.circadianPhase.replace(/_/g, " ")}</span>
              </div>
              <div className="flex-1 bg-stone-100 dark:bg-stone-800 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-amber-500 h-1.5 rounded-full" 
                  style={{ width: `${active.circadianAlignmentScore}%` }} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Lagged Causality & Next-Day Predictive Impact (Variation F) */}
        <div className="rounded-lg border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/40 dark:bg-indigo-950/20 p-3">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-950 dark:text-indigo-300">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Lagged Causality & Next-Day Prediction (t → t+1)</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-100/70 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
              Predicted Energy: {active.laggedImpactPrediction.predictedNextDayEnergy}/10 (r = {active.laggedImpactPrediction.laggedCorrelationFactor})
            </span>
          </div>

          <p className="text-xs text-stone-700 dark:text-stone-300 mb-2 leading-relaxed">
            {active.laggedImpactPrediction.vulnerabilityAlert}
          </p>

          <div className="flex items-start gap-2 bg-white dark:bg-stone-900 p-2 rounded border border-indigo-100 dark:border-indigo-950 text-xs">
            <div className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
              <Check className="w-2.5 h-2.5" />
            </div>
            <div>
              <span className="font-medium text-stone-800 dark:text-stone-200 mr-1">Mitigating Micro-Action:</span>
              <span className="text-stone-600 dark:text-stone-400">
                {active.laggedImpactPrediction.mitigatingMicroAction}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
