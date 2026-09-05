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
      className={`rounded-xl border shadow-sm overflow-hidden transition-colors ${
        isLight
          ? "bg-white border-stone-200 text-stone-900"
          : "bg-[#181818] border-[#3D4028] text-stone-200"
      }`}
      style={isLight ? { backgroundColor: "#ffffff" } : undefined}
    >
      {/* Top Header */}
      <div 
        id="empirical-telemetry-panel-header"
        className={`px-4 py-3 border-b flex items-center justify-between gap-3 transition-colors ${
          isLight
            ? "bg-white border-stone-200 text-stone-900"
            : "bg-[#141414] border-[#3D4028] text-stone-200"
        }`}
        style={isLight ? { backgroundColor: "#ffffff" } : undefined}
      >
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-md flex items-center justify-center ${
            isLight
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-emerald-950/60 text-emerald-400 border border-emerald-800/40"
          }`}>
            <BarChart3 className="w-3.5 h-3.5" />
          </div>
          <span className={`text-xs font-semibold uppercase tracking-wider ${
            isLight ? "text-stone-900" : "text-stone-100"
          }`}>
            Empirical Statistical Telemetry
          </span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
            isLight
              ? "bg-stone-100 text-stone-700 border border-stone-200"
              : "bg-[#262626] text-stone-400 border border-stone-700"
          }`}>
            Variations A + C + F
          </span>
        </div>

        <div className="flex items-center gap-2">
          {!readOnly && (
            <button
              id="telemetry-edit-toggle-btn"
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className={`text-xs flex items-center gap-1 transition-colors px-2 py-1 rounded cursor-pointer ${
                isLight
                  ? "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                  : "text-stone-400 hover:text-stone-100 hover:bg-stone-800"
              }`}
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
            className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 disabled:opacity-50 cursor-pointer"
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
            <span className={`text-[11px] font-semibold uppercase tracking-wider ${
              isLight ? "text-stone-600" : "text-stone-400"
            }`}>
              Quantified Subjective Scales
            </span>
            <span className={`text-[10px] ${isLight ? "text-stone-500" : "text-stone-500"}`}>
              Confidence: {Math.round((active.confidenceScore || 0.85) * 100)}%
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Sleep Score (0-7) */}
            <div className={`p-2.5 rounded-lg border transition-colors ${
              isLight
                ? "bg-white border-stone-200 shadow-2xs"
                : "bg-[#141414] border-stone-800"
            }`}>
              <div className={`flex items-center justify-between text-xs mb-1 ${
                isLight ? "text-stone-600" : "text-stone-400"
              }`}>
                <span className="flex items-center gap-1 font-medium">
                  <Moon className="w-3.5 h-3.5 text-indigo-500" />
                  Sleep (0-7)
                </span>
                <span className={`font-mono font-bold ${
                  isLight ? "text-stone-900" : "text-stone-100"
                }`}>
                  {active.sleepScore} / 7
                </span>
              </div>
              <div className={`text-[10px] mb-1.5 truncate ${
                isLight ? "text-stone-500" : "text-stone-400"
              }`}>
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
                <div className={`w-full rounded-full h-1.5 overflow-hidden ${
                  isLight ? "bg-stone-100" : "bg-stone-800"
                }`}>
                  <div 
                    className="bg-indigo-500 h-1.5 rounded-full transition-all" 
                    style={{ width: `${(active.sleepScore / 7) * 100}%` }} 
                  />
                </div>
              )}
            </div>

            {/* Energy Level (0-10) */}
            <div className={`p-2.5 rounded-lg border transition-colors ${
              isLight
                ? "bg-white border-stone-200 shadow-2xs"
                : "bg-[#141414] border-stone-800"
            }`}>
              <div className={`flex items-center justify-between text-xs mb-1 ${
                isLight ? "text-stone-600" : "text-stone-400"
              }`}>
                <span className="flex items-center gap-1 font-medium">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  Energy (0-10)
                </span>
                <span className={`font-mono font-bold ${
                  isLight ? "text-stone-900" : "text-stone-100"
                }`}>
                  {active.energyLevel} / 10
                </span>
              </div>
              <div className={`text-[10px] mb-1.5 ${
                isLight ? "text-stone-500" : "text-stone-400"
              }`}>
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
                <div className={`w-full rounded-full h-1.5 overflow-hidden ${
                  isLight ? "bg-stone-100" : "bg-stone-800"
                }`}>
                  <div 
                    className="bg-amber-500 h-1.5 rounded-full transition-all" 
                    style={{ width: `${(active.energyLevel / 10) * 100}%` }} 
                  />
                </div>
              )}
            </div>

            {/* Somatic Tension (0-10) */}
            <div className={`p-2.5 rounded-lg border transition-colors ${
              isLight
                ? "bg-white border-stone-200 shadow-2xs"
                : "bg-[#141414] border-stone-800"
            }`}>
              <div className={`flex items-center justify-between text-xs mb-1 ${
                isLight ? "text-stone-600" : "text-stone-400"
              }`}>
                <span className="flex items-center gap-1 font-medium">
                  <Activity className="w-3.5 h-3.5 text-rose-500" />
                  Tension (0-10)
                </span>
                <span className={`font-mono font-bold ${
                  isLight ? "text-stone-900" : "text-stone-100"
                }`}>
                  {active.somaticTension} / 10
                </span>
              </div>
              <div className={`text-[10px] mb-1.5 ${
                isLight ? "text-stone-500" : "text-stone-400"
              }`}>
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
                <div className={`w-full rounded-full h-1.5 overflow-hidden ${
                  isLight ? "bg-stone-100" : "bg-stone-800"
                }`}>
                  <div 
                    className="bg-rose-500 h-1.5 rounded-full transition-all" 
                    style={{ width: `${(active.somaticTension / 10) * 100}%` }} 
                  />
                </div>
              )}
            </div>

            {/* Mental Clarity (0-10) */}
            <div className={`p-2.5 rounded-lg border transition-colors ${
              isLight
                ? "bg-white border-stone-200 shadow-2xs"
                : "bg-[#141414] border-stone-800"
            }`}>
              <div className={`flex items-center justify-between text-xs mb-1 ${
                isLight ? "text-stone-600" : "text-stone-400"
              }`}>
                <span className="flex items-center gap-1 font-medium">
                  <Brain className="w-3.5 h-3.5 text-sky-500" />
                  Clarity (0-10)
                </span>
                <span className={`font-mono font-bold ${
                  isLight ? "text-stone-900" : "text-stone-100"
                }`}>
                  {active.mentalClarity} / 10
                </span>
              </div>
              <div className={`text-[10px] mb-1.5 ${
                isLight ? "text-stone-500" : "text-stone-400"
              }`}>
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
                <div className={`w-full rounded-full h-1.5 overflow-hidden ${
                  isLight ? "bg-stone-100" : "bg-stone-800"
                }`}>
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
          <div className={`text-[11px] font-semibold uppercase tracking-wider mb-2 ${
            isLight ? "text-stone-600" : "text-stone-400"
          }`}>
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
                  className={`flex items-center justify-between p-2 rounded-lg border text-xs transition-all cursor-pointer ${
                    isChecked
                      ? isLight
                        ? "border-emerald-300 bg-emerald-50/90 text-emerald-900 font-medium shadow-2xs"
                        : "border-emerald-800 bg-emerald-950/40 text-emerald-200 font-medium"
                      : isLight
                        ? "border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50"
                        : "border-stone-800 bg-[#141414] text-stone-400 hover:border-stone-700"
                  }`}
                >
                  <span className="truncate pr-1">{formatHabitName(key)}</span>
                  {isChecked ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className={`w-3.5 h-3.5 shrink-0 ${isLight ? "text-stone-400" : "text-stone-600"}`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Thematic Coding & Circadian Phase */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t ${
          isLight ? "border-stone-200" : "border-stone-800"
        }`}>
          <div>
            <div className={`text-[11px] font-semibold uppercase tracking-wider mb-1.5 ${
              isLight ? "text-stone-600" : "text-stone-400"
            }`}>
              Thematic Stressor Codes
            </div>
            <div className="flex flex-wrap gap-1.5">
              {active.thematicStressors.map((code, idx) => (
                <span
                  key={idx}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono border ${
                    isLight 
                      ? "bg-stone-100 text-stone-800 border-stone-200" 
                      : "bg-[#141414] text-stone-300 border-stone-700"
                  }`}
                >
                  #{code}
                </span>
              ))}
              <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                isLight 
                  ? "bg-indigo-50 text-indigo-700 border-indigo-200" 
                  : "bg-indigo-950/40 text-indigo-300 border-indigo-800"
              }`}>
                {active.cognitiveDisposition.replace(/_/g, " ")}
              </span>
            </div>
          </div>

          <div>
            <div className={`text-[11px] font-semibold uppercase tracking-wider mb-1.5 flex items-center justify-between ${
              isLight ? "text-stone-600" : "text-stone-400"
            }`}>
              <span>Circadian Alignment (Variation C)</span>
              <span className={`font-mono ${isLight ? "text-stone-800" : "text-stone-300"}`}>
                {active.circadianAlignmentScore}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`px-2.5 py-1 rounded-md text-xs font-medium border flex items-center gap-1.5 ${
                isLight 
                  ? "bg-amber-50 text-amber-900 border-amber-200" 
                  : "bg-amber-950/40 text-amber-300 border-amber-800"
              }`}>
                <Compass className="w-3.5 h-3.5" />
                <span className="capitalize">{active.circadianPhase.replace(/_/g, " ")}</span>
              </div>
              <div className={`flex-1 rounded-full h-1.5 overflow-hidden ${
                isLight ? "bg-stone-200" : "bg-stone-800"
              }`}>
                <div 
                  className="bg-amber-500 h-1.5 rounded-full" 
                  style={{ width: `${active.circadianAlignmentScore}%` }} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Lagged Causality & Next-Day Predictive Impact (Variation F) */}
        <div className={`rounded-lg border p-3 ${
          isLight 
            ? "border-indigo-100 bg-indigo-50/50" 
            : "border-indigo-900/50 bg-indigo-950/20"
        }`}>
          <div className="flex items-center justify-between mb-1.5">
            <div className={`flex items-center gap-1.5 text-xs font-semibold ${
              isLight ? "text-indigo-950" : "text-indigo-300"
            }`}>
              <TrendingUp className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Lagged Causality & Next-Day Prediction (t → t+1)</span>
            </div>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
              isLight 
                ? "bg-indigo-100 text-indigo-800" 
                : "bg-indigo-900/50 text-indigo-300"
            }`}>
              Predicted Energy: {active.laggedImpactPrediction.predictedNextDayEnergy}/10 (r = {active.laggedImpactPrediction.laggedCorrelationFactor})
            </span>
          </div>

          <p className={`text-xs mb-2 leading-relaxed ${
            isLight ? "text-stone-700" : "text-stone-300"
          }`}>
            {active.laggedImpactPrediction.vulnerabilityAlert}
          </p>

          <div className={`flex items-start gap-2 p-2 rounded border text-xs ${
            isLight 
              ? "bg-white border-indigo-100 text-stone-800" 
              : "bg-[#141414] border-indigo-950 text-stone-200"
          }`}>
            <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
              isLight 
                ? "bg-emerald-100 text-emerald-700" 
                : "bg-emerald-950 text-emerald-400"
            }`}>
              <Check className="w-2.5 h-2.5" />
            </div>
            <div>
              <span className={`font-medium mr-1 ${isLight ? "text-stone-900" : "text-stone-200"}`}>
                Mitigating Micro-Action:
              </span>
              <span className={isLight ? "text-stone-600" : "text-stone-400"}>
                {active.laggedImpactPrediction.mitigatingMicroAction}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
