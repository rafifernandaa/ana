import React, { useMemo } from "react";
import { 
  BarChart3, 
  Moon, 
  Zap, 
  Activity, 
  Target, 
  Brain, 
  TrendingUp, 
  Hash, 
  CheckCircle2, 
  XCircle,
  Sparkles,
  ArrowRight,
  Info
} from "lucide-react";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Cell 
} from "recharts";
import { JournalEntry } from "../types";
import { useTheme } from "../lib/theme";

interface EmpiricalCorrelationsSectionProps {
  entries: JournalEntry[];
  onOpenStudioWithEntry?: (entry: JournalEntry) => void;
}

export const EmpiricalCorrelationsSection: React.FC<EmpiricalCorrelationsSectionProps> = ({
  entries,
  onOpenStudioWithEntry,
}) => {
  const { isLight } = useTheme();

  // Filter entries with empirical telemetry
  const entriesWithTelemetry = useMemo(() => {
    return entries
      .filter((e) => !!e.empiricalTelemetry)
      .sort((a, b) => a.createdAt - b.createdAt);
  }, [entries]);

  // 1. Quantified Subjective Feeling Averages
  const metrics = useMemo(() => {
    if (entriesWithTelemetry.length === 0) {
      return {
        avgSleep: 0,
        avgEnergy: 0,
        avgTension: 0,
        avgClarity: 0,
        sampleCount: 0,
      };
    }

    let totalSleep = 0;
    let totalEnergy = 0;
    let totalTension = 0;
    let totalClarity = 0;

    entriesWithTelemetry.forEach((e) => {
      const t = e.empiricalTelemetry!;
      totalSleep += t.sleepScore;
      totalEnergy += t.energyLevel;
      totalTension += t.somaticTension;
      totalClarity += t.mentalClarity;
    });

    const count = entriesWithTelemetry.length;
    return {
      avgSleep: +(totalSleep / count).toFixed(1),
      avgEnergy: +(totalEnergy / count).toFixed(1),
      avgTension: +(totalTension / count).toFixed(1),
      avgClarity: +(totalClarity / count).toFixed(1),
      sampleCount: count,
    };
  }, [entriesWithTelemetry]);

  // 2. Binary Habit Compliance Frequencies
  const habitFrequencies = useMemo(() => {
    if (entriesWithTelemetry.length === 0) return [];

    const total = entriesWithTelemetry.length;
    const counts = {
      exercise: 0,
      deepWork: 0,
      mindfulness: 0,
      socialConnection: 0,
      hadGoodDay: 0,
    };

    entriesWithTelemetry.forEach((e) => {
      const h = e.empiricalTelemetry?.binaryHabits;
      if (h) {
        if (h.exercised) counts.exercise++;
        if (h.deepWorkSession) counts.deepWork++;
        if (h.mindfulnessMeditation) counts.mindfulness++;
        if (h.socialConnection) counts.socialConnection++;
        if (h.hadGoodDay) counts.hadGoodDay++;
      }
    });

    return [
      { label: "Good Day Overall", count: counts.hadGoodDay, total, rate: Math.round((counts.hadGoodDay / total) * 100), color: "#A3A649" },
      { label: "Physical Exercise", count: counts.exercise, total, rate: Math.round((counts.exercise / total) * 100), color: "#AD3D30" },
      { label: "Mindfulness / Meditation", count: counts.mindfulness, total, rate: Math.round((counts.mindfulness / total) * 100), color: "#10b981" },
      { label: "Deep Work Session", count: counts.deepWork, total, rate: Math.round((counts.deepWork / total) * 100), color: "#38bdf8" },
      { label: "Social Connection", count: counts.socialConnection, total, rate: Math.round((counts.socialConnection / total) * 100), color: "#eab308" },
    ];
  }, [entriesWithTelemetry]);

  // 3. Thematic Coding Stressors / Triggers Frequency
  const thematicCodes = useMemo(() => {
    const map = new Map<string, number>();

    entriesWithTelemetry.forEach((e) => {
      e.empiricalTelemetry?.thematicStressors?.forEach((code) => {
        const normalized = code.startsWith("#") ? code : `#${code}`;
        map.set(normalized, (map.get(normalized) || 0) + 1);
      });
    });

    const sorted = Array.from(map.entries())
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count);

    return sorted.slice(0, 10);
  }, [entriesWithTelemetry]);

  // 4. Pearson Correlation: Sleep Score vs. Energy Level
  const sleepEnergyCorrelation = useMemo(() => {
    if (entriesWithTelemetry.length < 2) return null;

    const xs = entriesWithTelemetry.map((e) => e.empiricalTelemetry!.sleepScore);
    const ys = entriesWithTelemetry.map((e) => e.empiricalTelemetry!.energyLevel);
    const n = xs.length;

    const meanX = xs.reduce((a, b) => a + b, 0) / n;
    const meanY = ys.reduce((a, b) => a + b, 0) / n;

    let num = 0;
    let denX = 0;
    let denY = 0;

    for (let i = 0; i < n; i++) {
      const dx = xs[i] - meanX;
      const dy = ys[i] - meanY;
      num += dx * dy;
      denX += dx * dx;
      denY += dy * dy;
    }

    const den = Math.sqrt(denX * denY);
    if (den === 0) return 0;
    return +(num / den).toFixed(2);
  }, [entriesWithTelemetry]);

  // Recharts Bar Data: Timeline of Sleep vs Energy
  const chartData = useMemo(() => {
    return entriesWithTelemetry.slice(-7).map((e, idx) => {
      const dateStr = new Date(e.createdAt).toLocaleDateString("en-US", {
        weekday: "short",
        month: "numeric",
        day: "numeric",
      });
      return {
        name: dateStr,
        sleep: e.empiricalTelemetry?.sleepScore || 0,
        energy: e.empiricalTelemetry?.energyLevel || 0,
        clarity: e.empiricalTelemetry?.mentalClarity || 0,
        tension: e.empiricalTelemetry?.somaticTension || 0,
        entryId: e.id,
        entryTitle: e.title || `Entry #${idx + 1}`,
      };
    });
  }, [entriesWithTelemetry]);

  // Latest Lagged Impact
  const latestLaggedImpact = useMemo(() => {
    for (let i = entriesWithTelemetry.length - 1; i >= 0; i--) {
      const p = entriesWithTelemetry[i].empiricalTelemetry?.laggedImpactPrediction;
      if (p) return { prediction: p, entryTitle: entriesWithTelemetry[i].title, entryDate: entriesWithTelemetry[i].createdAt };
    }
    return null;
  }, [entriesWithTelemetry]);

  return (
    <div id="empirical-correlations-container" className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#3D4028] pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-[#181818] border border-[#3D4028] text-[#10b981] flex items-center justify-center">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
              Empirical Telemetry & Longitudinal Statistics
              <span className="text-[9px] uppercase px-1.5 py-0.5 rounded-full bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40 font-mono">
                Variations A+C+F
              </span>
            </h3>
            <p className="text-[11px] text-[#8C8C8C]">
              AI-extracted quantitative scales, binary habits, thematic frequency coding & causal correlations.
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs font-mono text-[#A3A649] bg-[#181818] px-2 py-1 rounded border border-[#3D4028]">
            {entriesWithTelemetry.length} Quantified {entriesWithTelemetry.length === 1 ? "Entry" : "Entries"}
          </span>
        </div>
      </div>

      {entriesWithTelemetry.length === 0 ? (
        /* Empty State */
        <div className="p-6 rounded-xl bg-[#181818] border border-[#3D4028] text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-[#262626] border border-[#3D4028] text-[#A3A649] flex items-center justify-center mx-auto">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h4 className="text-xs font-bold text-white">No Telemetry Recorded Yet</h4>
            <p className="text-[11px] text-[#8C8C8C] leading-relaxed">
              Open any reflection in the Studio or Journal Editor, click <span className="text-[#10b981] font-semibold">"Stats & Telemetry"</span> to have Gemini automatically quantify your sleep, energy, somatic tension, and binary habits.
            </p>
          </div>
        </div>
      ) : (
        /* Data Presentation Grid */
        <div className="space-y-4">
          {/* Top 4 Quantified Subjective Feeling Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Metric 1: Sleep Quality */}
            <div className="p-3 rounded-lg bg-[#181818] border border-[#3D4028] space-y-1">
              <div className="flex items-center justify-between text-[11px] text-[#8C8C8C]">
                <span className="flex items-center gap-1 text-[#38bdf8]">
                  <Moon className="w-3.5 h-3.5" /> Sleep (0-7)
                </span>
                <span className="font-mono text-[10px]">Avg</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold font-mono text-white">{metrics.avgSleep}</span>
                <span className="text-[10px] text-[#8C8C8C]">/ 7.0</span>
              </div>
              <div className="w-full h-1 bg-[#262626] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#38bdf8] transition-all" 
                  style={{ width: `${Math.min(100, (metrics.avgSleep / 7) * 100)}%` }} 
                />
              </div>
            </div>

            {/* Metric 2: Daily Energy */}
            <div className="p-3 rounded-lg bg-[#181818] border border-[#3D4028] space-y-1">
              <div className="flex items-center justify-between text-[11px] text-[#8C8C8C]">
                <span className="flex items-center gap-1 text-[#A3A649]">
                  <Zap className="w-3.5 h-3.5" /> Energy (0-10)
                </span>
                <span className="font-mono text-[10px]">Avg</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold font-mono text-white">{metrics.avgEnergy}</span>
                <span className="text-[10px] text-[#8C8C8C]">/ 10.0</span>
              </div>
              <div className="w-full h-1 bg-[#262626] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#A3A649] transition-all" 
                  style={{ width: `${Math.min(100, (metrics.avgEnergy / 10) * 100)}%` }} 
                />
              </div>
            </div>

            {/* Metric 3: Somatic Tension */}
            <div className="p-3 rounded-lg bg-[#181818] border border-[#3D4028] space-y-1">
              <div className="flex items-center justify-between text-[11px] text-[#8C8C8C]">
                <span className="flex items-center gap-1 text-[#AD3D30]">
                  <Activity className="w-3.5 h-3.5" /> Tension (0-10)
                </span>
                <span className="font-mono text-[10px]">Avg</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold font-mono text-white">{metrics.avgTension}</span>
                <span className="text-[10px] text-[#8C8C8C]">/ 10.0</span>
              </div>
              <div className="w-full h-1 bg-[#262626] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#AD3D30] transition-all" 
                  style={{ width: `${Math.min(100, (metrics.avgTension / 10) * 100)}%` }} 
                />
              </div>
            </div>

            {/* Metric 4: Mental Clarity */}
            <div className="p-3 rounded-lg bg-[#181818] border border-[#3D4028] space-y-1">
              <div className="flex items-center justify-between text-[11px] text-[#8C8C8C]">
                <span className="flex items-center gap-1 text-[#10b981]">
                  <Brain className="w-3.5 h-3.5" /> Clarity (0-10)
                </span>
                <span className="font-mono text-[10px]">Avg</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold font-mono text-white">{metrics.avgClarity}</span>
                <span className="text-[10px] text-[#8C8C8C]">/ 10.0</span>
              </div>
              <div className="w-full h-1 bg-[#262626] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#10b981] transition-all" 
                  style={{ width: `${Math.min(100, (metrics.avgClarity / 10) * 100)}%` }} 
                />
              </div>
            </div>
          </div>

          {/* Longitudinal Chart: Sleep vs Daily Energy */}
          <div className="p-3.5 rounded-xl bg-[#181818] border border-[#3D4028] space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-[#3D4028] pb-2">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#A3A649]" />
                  <h4 className="text-xs font-bold text-white">
                    Sleep Score (0-7) vs. Next-Day / Same-Day Energy (0-10)
                  </h4>
                </div>
                <p className="text-[10px] text-[#8C8C8C]">
                  Tracking how restorative sleep directly modulates subjective vitality across journal logs.
                </p>
              </div>

              {sleepEnergyCorrelation !== null && (
                <div className="flex items-center gap-1.5 bg-[#262626] border border-[#3D4028] px-2 py-1 rounded text-[11px] font-mono">
                  <span className="text-[#8C8C8C]">Pearson r:</span>
                  <span className={`font-bold ${sleepEnergyCorrelation > 0.4 ? "text-[#10b981]" : sleepEnergyCorrelation < -0.2 ? "text-[#AD3D30]" : "text-[#A3A649]"}`}>
                    {sleepEnergyCorrelation > 0 ? `+${sleepEnergyCorrelation}` : sleepEnergyCorrelation}
                  </span>
                  <span className="text-[9px] text-[#8C8C8C]">
                    ({sleepEnergyCorrelation > 0.5 ? "Strong Positive" : sleepEnergyCorrelation > 0.2 ? "Moderate" : "Weak/Neutral"})
                  </span>
                </div>
              )}
            </div>

            <div className="w-full h-40 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 2" stroke={isLight ? "#D6DAD0" : "#3D4028"} opacity={0.6} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: isLight ? "#555A48" : "#8C8C8C", fontSize: 10 }}
                    axisLine={{ stroke: isLight ? "#D6DAD0" : "#3D4028" }}
                    tickLine={false}
                  />
                  <YAxis 
                    domain={[0, 10]}
                    tick={{ fill: isLight ? "#555A48" : "#8C8C8C", fontSize: 10 }}
                    axisLine={{ stroke: isLight ? "#D6DAD0" : "#3D4028" }}
                    tickLine={false}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-[#262626] border border-[#3D4028] text-white p-2.5 rounded shadow-xl text-xs space-y-1 font-mono">
                            <p className="font-bold text-[#A3A649]">{d.entryTitle}</p>
                            <p className="text-[11px] text-[#8C8C8C]">{d.name}</p>
                            <div className="pt-1 space-y-0.5 text-[11px]">
                              <p className="text-[#38bdf8]">Sleep Quality: {d.sleep} / 7</p>
                              <p className="text-[#A3A649]">Daily Energy: {d.energy} / 10</p>
                              <p className="text-[#10b981]">Mental Clarity: {d.clarity} / 10</p>
                              <p className="text-[#AD3D30]">Somatic Tension: {d.tension} / 10</p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="sleep" name="Sleep (0-7)" fill="#38bdf8" radius={[3, 3, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="energy" name="Energy (0-10)" fill="#A3A649" radius={[3, 3, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 2-Column: Binary Habits & Thematic Codes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Column A: Binary Habit Frequency Dataset */}
            <div className="p-3.5 rounded-xl bg-[#181818] border border-[#3D4028] space-y-2.5">
              <div className="flex items-center justify-between border-b border-[#3D4028] pb-1.5">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#10b981]" />
                  <h4 className="text-xs font-bold text-white">Binary Habit Frequency Rates</h4>
                </div>
                <span className="text-[9px] text-[#8C8C8C] font-mono">Yes/No Data</span>
              </div>

              <div className="space-y-2">
                {habitFrequencies.map((habit, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#e2e8f0]">{habit.label}</span>
                      <span className="font-mono text-xs font-bold text-white">
                        {habit.rate}% <span className="text-[10px] text-[#8C8C8C] font-normal">({habit.count}/{habit.total})</span>
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-[#262626] rounded-full overflow-hidden">
                      <div 
                        className="h-full transition-all" 
                        style={{ width: `${habit.rate}%`, backgroundColor: habit.color }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Column B: Thematic Coding Categorical Frequency */}
            <div className="p-3.5 rounded-xl bg-[#181818] border border-[#3D4028] space-y-2.5">
              <div className="flex items-center justify-between border-b border-[#3D4028] pb-1.5">
                <div className="flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-[#AD3D30]" />
                  <h4 className="text-xs font-bold text-white">Thematic Coding (Recurring Stressors)</h4>
                </div>
                <span className="text-[9px] text-[#8C8C8C] font-mono">Frequency Rank</span>
              </div>

              {thematicCodes.length === 0 ? (
                <div className="py-6 text-center text-xs text-[#8C8C8C]">
                  No thematic tags extracted yet.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {thematicCodes.map((item, idx) => (
                    <div 
                      key={idx} 
                      className="p-1.5 rounded bg-[#262626] border border-[#3D4028] flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[10px] font-mono text-[#8C8C8C]">#{idx + 1}</span>
                        <span className="text-[#e2e8f0] font-mono text-[11px] truncate">
                          {item.code}
                        </span>
                      </div>
                      <span className="px-1.5 py-0.5 rounded bg-[#181818] border border-[#3D4028] text-[10px] font-mono font-bold text-[#AD3D30]">
                        {item.count} {item.count === 1 ? "occurrence" : "occurrences"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Latest Lagged Causality Prediction (Variation F) */}
          {latestLaggedImpact && (
            <div className="p-3.5 rounded-xl bg-[#262626] border border-[#A3A649]/40 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-[#A3A649] font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Lagged Causality Model ($t \to t+1$ Prediction)</span>
                </div>
                <span className="text-[10px] font-mono text-[#8C8C8C]">
                  Derived from: "{latestLaggedImpact.entryTitle || 'Recent Entry'}"
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1">
                <div className="p-2 rounded bg-[#181818] border border-[#3D4028] space-y-0.5">
                  <span className="text-[9px] text-[#8C8C8C] uppercase font-bold">Vulnerability Alert:</span>
                  <p className="text-[#38bdf8] font-semibold text-[11px]">
                    {latestLaggedImpact.prediction.vulnerabilityAlert}
                  </p>
                </div>
                <div className="p-2 rounded bg-[#181818] border border-[#3D4028] space-y-0.5">
                  <span className="text-[9px] text-[#8C8C8C] uppercase font-bold">Predicted Next-Day Energy:</span>
                  <p className="text-[#e2e8f0] text-[11px] font-mono font-bold">
                    {latestLaggedImpact.prediction.predictedNextDayEnergy} / 10
                    <span className="text-[10px] text-[#8C8C8C] font-normal ml-1">
                      (Est. r = {latestLaggedImpact.prediction.laggedCorrelationFactor})
                    </span>
                  </p>
                </div>
                <div className="p-2 rounded bg-[#181818] border border-[#3D4028] space-y-0.5">
                  <span className="text-[9px] text-[#8C8C8C] uppercase font-bold">Mitigating Micro-Action:</span>
                  <p className="text-[#10b981] font-semibold text-[11px]">
                    {latestLaggedImpact.prediction.mitigatingMicroAction}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
