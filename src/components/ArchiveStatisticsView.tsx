import React, { useState, useMemo } from "react";
import { 
  BarChart3, 
  TrendingUp, 
  Zap, 
  Moon, 
  Activity, 
  Brain, 
  Calendar, 
  CheckCircle2, 
  ArrowUpRight, 
  ArrowDownRight, 
  Sparkles, 
  Filter, 
  FileText, 
  ChevronRight,
  Target,
  Clock,
  Layers,
  Crosshair,
  SlidersHorizontal,
  ExternalLink,
  Eye,
  X
} from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend,
  Cell,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  ZAxis,
  ReferenceLine
} from "recharts";
import { JournalEntry } from "../types";
import { 
  parseEntryNumericalData, 
  ParsedEntryMetrics, 
  calculatePearsonCorrelation, 
  computeHabitLift 
} from "../lib/numericalDataParser";
import { useTheme } from "../lib/theme";

interface ArchiveStatisticsViewProps {
  entries: JournalEntry[];
  onSelectEntry: (entry: JournalEntry) => void;
  onOpenInStudio: (entry: JournalEntry) => void;
  activeMetricTab?: "progression" | "correlations" | "habits" | "chronobiology";
  onTabChange?: (tab: "progression" | "correlations" | "habits" | "chronobiology") => void;
  timeframe?: "7d" | "30d" | "90d" | "all";
  onTimeframeChange?: (timeframe: "7d" | "30d" | "90d" | "all") => void;
  isCompact?: boolean; // For rendering inside narrow sidebars
}

export const ArchiveStatisticsView: React.FC<ArchiveStatisticsViewProps> = ({
  entries,
  onSelectEntry,
  onOpenInStudio,
  activeMetricTab: externalTab,
  onTabChange: externalTabChange,
  timeframe: externalTimeframe,
  onTimeframeChange: externalTimeframeChange,
  isCompact = false,
}) => {
  const { isLight } = useTheme();

  // Internal states if not controlled externally
  const [internalTab, setInternalTab] = useState<"progression" | "correlations" | "habits" | "chronobiology">("progression");
  const [internalTimeframe, setInternalTimeframe] = useState<"7d" | "30d" | "90d" | "all">("all");
  const [selectedCorrelationPair, setSelectedCorrelationPair] = useState<"sleep_energy" | "tension_clarity" | "mood_energy">("sleep_energy");
  const [selectedEntryPreview, setSelectedEntryPreview] = useState<ParsedEntryMetrics | null>(null);
  const [correlationViewMode, setCorrelationViewMode] = useState<"scatter" | "bars">("scatter");
  const [showTrendline, setShowTrendline] = useState<boolean>(true);
  const [showQuadrantDividers, setShowQuadrantDividers] = useState<boolean>(true);
  const [selectedScatterPoint, setSelectedScatterPoint] = useState<any | null>(null);
  const [hoveredScatterPoint, setHoveredScatterPoint] = useState<any | null>(null);
  const [filterQuadrant, setFilterQuadrant] = useState<"all" | "q1" | "q2" | "q3" | "q4">("all");

  const activeTab = externalTab || internalTab;
  const setActiveTab = externalTabChange || setInternalTab;

  const timeframe = externalTimeframe || internalTimeframe;
  const setTimeframe = externalTimeframeChange || setInternalTimeframe;

  // 1. Parse all entries into numerical metrics
  const allParsedMetrics = useMemo(() => {
    return entries
      .map(parseEntryNumericalData)
      .sort((a, b) => a.createdAt - b.createdAt);
  }, [entries]);

  // 2. Filter by timeframe
  const filteredMetrics = useMemo(() => {
    if (allParsedMetrics.length === 0) return [];
    if (timeframe === "all") return allParsedMetrics;

    const now = Date.now();
    const days = timeframe === "7d" ? 7 : timeframe === "30d" ? 30 : 90;
    const cutoff = now - days * 86400000;

    const filtered = allParsedMetrics.filter((m) => m.createdAt >= cutoff);
    return filtered.length > 0 ? filtered : allParsedMetrics.slice(-days);
  }, [allParsedMetrics, timeframe]);

  // 3. Mathematical Averages & Summary KPIs
  const summaryKPIs = useMemo(() => {
    if (filteredMetrics.length === 0) {
      return {
        avgMood: 0,
        avgEnergy: 0,
        avgSleep: 0,
        avgTension: 0,
        avgClarity: 0,
        totalEntries: 0,
        habitConsistencyRate: 0,
      };
    }

    const count = filteredMetrics.length;
    let sumMood = 0;
    let sumEnergy = 0;
    let sumSleep = 0;
    let sumTension = 0;
    let sumClarity = 0;
    let habitCompliantEntries = 0;

    filteredMetrics.forEach((m) => {
      sumMood += m.moodRating;
      sumEnergy += m.energyLevel;
      sumSleep += m.sleepScore;
      sumTension += m.somaticTension;
      sumClarity += m.mentalClarity;

      const activeHabitsCount = Object.values(m.binaryHabits).filter(Boolean).length;
      if (activeHabitsCount >= 2) habitCompliantEntries++;
    });

    return {
      avgMood: +(sumMood / count).toFixed(1),
      avgEnergy: +(sumEnergy / count).toFixed(1),
      avgSleep: +(sumSleep / count).toFixed(1),
      avgTension: +(sumTension / count).toFixed(1),
      avgClarity: +(sumClarity / count).toFixed(1),
      totalEntries: count,
      habitConsistencyRate: Math.round((habitCompliantEntries / count) * 100),
    };
  }, [filteredMetrics]);

  // 4. Pearson Correlation for current selected pair
  const correlationData = useMemo(() => {
    if (filteredMetrics.length < 2) {
      return { r: 0, label: "Insufficient data", strength: "weak" as const };
    }

    if (selectedCorrelationPair === "sleep_energy") {
      const xs = filteredMetrics.map((m) => m.sleepScore);
      const ys = filteredMetrics.map((m) => m.energyLevel);
      return calculatePearsonCorrelation(xs, ys);
    } else if (selectedCorrelationPair === "tension_clarity") {
      const xs = filteredMetrics.map((m) => m.somaticTension);
      const ys = filteredMetrics.map((m) => m.mentalClarity);
      return calculatePearsonCorrelation(xs, ys);
    } else {
      const xs = filteredMetrics.map((m) => m.moodRating);
      const ys = filteredMetrics.map((m) => m.energyLevel);
      return calculatePearsonCorrelation(xs, ys);
    }
  }, [filteredMetrics, selectedCorrelationPair]);

  // 4b. Scatter Plot Data, Regression Trendline, & Quadrant Math
  const scatterStats = useMemo(() => {
    const rawPoints = filteredMetrics.map((m) => {
      let x = m.sleepScore;
      let y = m.energyLevel;
      let xName = "Sleep Quality";
      let yName = "Energy Level";
      let xUnit = "/7";
      let yUnit = "/10";
      let xDomain: [number, number] = [0, 7];
      let yDomain: [number, number] = [0, 10];

      if (selectedCorrelationPair === "tension_clarity") {
        x = m.somaticTension;
        y = m.mentalClarity;
        xName = "Somatic Tension";
        yName = "Mental Clarity";
        xUnit = "/10";
        xDomain = [0, 10];
        yDomain = [0, 10];
      } else if (selectedCorrelationPair === "mood_energy") {
        x = m.moodRating;
        y = m.energyLevel;
        xName = "Mood Rating";
        yName = "Energy Level";
        xUnit = "/10";
        xDomain = [0, 10];
        yDomain = [0, 10];
      }

      const d = new Date(m.createdAt);
      const exactDateStr = d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      return {
        id: m.id,
        x,
        y,
        z: 12,
        xName,
        yName,
        xUnit,
        yUnit,
        title: m.title,
        dateStr: m.dateStr,
        exactDateStr,
        dayOfWeek: m.dayOfWeek,
        sleepScore: m.sleepScore,
        energyLevel: m.energyLevel,
        somaticTension: m.somaticTension,
        mentalClarity: m.mentalClarity,
        moodRating: m.moodRating,
        moodLabel: m.moodLabel,
        sourceEntry: m.sourceEntry,
        parsed: m,
        excerpt: m.sourceEntry.content.slice(0, 160) || "No journal notes logged.",
      };
    });

    const n = rawPoints.length;
    if (n === 0) {
      return {
        points: [],
        filteredPoints: [],
        meanX: 0,
        meanY: 0,
        slope: 0,
        intercept: 0,
        r2: 0,
        equationStr: "N/A",
        trendlineData: [],
        xDomain: [0, 7] as [number, number],
        yDomain: [0, 10] as [number, number],
        xName: "Sleep Quality",
        yName: "Energy Level",
        xUnit: "/7",
        yUnit: "/10",
        quadrants: { q1: [], q2: [], q3: [], q4: [] },
      };
    }

    const xDomain: [number, number] = selectedCorrelationPair === "sleep_energy" ? [0, 7] : [0, 10];
    const yDomain: [number, number] = [0, 10];
    const xName = selectedCorrelationPair === "sleep_energy" ? "Sleep Quality" : selectedCorrelationPair === "tension_clarity" ? "Somatic Tension" : "Mood Rating";
    const yName = selectedCorrelationPair === "tension_clarity" ? "Mental Clarity" : "Energy Level";
    const xUnit = selectedCorrelationPair === "sleep_energy" ? "/7" : "/10";
    const yUnit = "/10";

    const meanX = +(rawPoints.reduce((s, p) => s + p.x, 0) / n).toFixed(2);
    const meanY = +(rawPoints.reduce((s, p) => s + p.y, 0) / n).toFixed(2);

    let num = 0;
    let denX = 0;
    for (const p of rawPoints) {
      const dx = p.x - meanX;
      const dy = p.y - meanY;
      num += dx * dy;
      denX += dx * dx;
    }

    const slope = denX > 0 ? +(num / denX).toFixed(2) : 0;
    const intercept = +(meanY - slope * meanX).toFixed(2);
    const r = correlationData.r;
    const r2 = +Math.min(Math.max(r * r, 0), 1).toFixed(2);

    const minXVal = 0;
    const maxXVal = xDomain[1];
    const yAtMin = Math.min(Math.max(+(slope * minXVal + intercept).toFixed(2), 0), 10);
    const yAtMax = Math.min(Math.max(+(slope * maxXVal + intercept).toFixed(2), 0), 10);

    const trendlineData = [
      { x: minXVal, y: yAtMin },
      { x: maxXVal, y: yAtMax },
    ];

    // Assign quadrants based on mean split
    const q1 = rawPoints.filter((p) => p.x >= meanX && p.y >= meanY).map((p) => ({ ...p, quadrantLabel: "Q1: Optimal" }));
    const q2 = rawPoints.filter((p) => p.x < meanX && p.y >= meanY).map((p) => ({ ...p, quadrantLabel: "Q2: Compensatory" }));
    const q3 = rawPoints.filter((p) => p.x < meanX && p.y < meanY).map((p) => ({ ...p, quadrantLabel: "Q3: Depleted" }));
    const q4 = rawPoints.filter((p) => p.x >= meanX && p.y < meanY).map((p) => ({ ...p, quadrantLabel: "Q4: Recovery" }));

    const allWithQuadrants = [...q1, ...q2, ...q3, ...q4].sort((a, b) => a.parsed.createdAt - b.parsed.createdAt);

    const filteredPoints = filterQuadrant === "all"
      ? allWithQuadrants
      : filterQuadrant === "q1"
      ? q1
      : filterQuadrant === "q2"
      ? q2
      : filterQuadrant === "q3"
      ? q3
      : q4;

    const equationStr = `${yName} = ${slope >= 0 ? "+" : ""}${slope} × (${xName}) ${intercept >= 0 ? "+" : "-"} ${Math.abs(intercept)}`;

    return {
      points: rawPoints,
      filteredPoints,
      meanX,
      meanY,
      slope,
      intercept,
      r2,
      equationStr,
      trendlineData,
      xDomain,
      yDomain,
      xName,
      yName,
      xUnit,
      yUnit,
      quadrants: { q1, q2, q3, q4 },
    };
  }, [filteredMetrics, selectedCorrelationPair, correlationData, filterQuadrant]);

  // 5. Habit Lifts & Rates
  const habitLifts = useMemo(() => {
    return [
      { key: "exercised" as const, label: "Physical Exercise", color: "#AD3D30", ...computeHabitLift(filteredMetrics, "exercised") },
      { key: "mindfulness" as const, label: "Mindfulness / Breath", color: "#10b981", ...computeHabitLift(filteredMetrics, "mindfulness") },
      { key: "deepWork" as const, label: "Deep Work Session", color: "#38bdf8", ...computeHabitLift(filteredMetrics, "deepWork") },
      { key: "social" as const, label: "Social Connection", color: "#eab308", ...computeHabitLift(filteredMetrics, "social") },
      { key: "hadGoodDay" as const, label: "Good Day Overall", color: "#A3A649", ...computeHabitLift(filteredMetrics, "hadGoodDay") },
    ];
  }, [filteredMetrics]);

  // 6. Chronobiology by Day of Week
  const chronobiologyData = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const grouped = days.map((day) => {
      const dayEntries = filteredMetrics.filter((m) => m.dayOfWeek.startsWith(day));
      if (dayEntries.length === 0) {
        return { day, count: 0, avgEnergy: 0, avgTension: 0, avgMood: 0 };
      }
      const count = dayEntries.length;
      return {
        day,
        count,
        avgEnergy: +(dayEntries.reduce((s, e) => s + e.energyLevel, 0) / count).toFixed(1),
        avgTension: +(dayEntries.reduce((s, e) => s + e.somaticTension, 0) / count).toFixed(1),
        avgMood: +(dayEntries.reduce((s, e) => s + e.moodRating, 0) / count).toFixed(1),
      };
    });
    return grouped;
  }, [filteredMetrics]);

  // Formatted Chart Data for Time Progression
  const progressionChartData = useMemo(() => {
    return filteredMetrics.map((m, idx) => ({
      name: m.dateStr,
      fullDate: new Date(m.createdAt).toLocaleDateString(),
      moodRating: m.moodRating,
      energyLevel: m.energyLevel,
      sleepScore: m.sleepScore,
      somaticTension: m.somaticTension,
      mentalClarity: m.mentalClarity,
      title: m.title || `Entry #${idx + 1}`,
      moodLabel: m.moodLabel,
      source: m,
    }));
  }, [filteredMetrics]);

  if (entries.length === 0) {
    return (
      <div className="p-8 text-center space-y-3 bg-[#181818] rounded-xl border border-[#3D4028]">
        <BarChart3 className="w-8 h-8 text-[#3D4028] mx-auto" />
        <h4 className="text-sm font-bold text-white">No Journal Data for Statistics</h4>
        <p className="text-xs text-[#8C8C8C] max-w-sm mx-auto">
          Start writing reflections in the Studio. Numerical metrics like mood ratings, energy levels, and binary tags will be parsed automatically.
        </p>
      </div>
    );
  }

  // =========================================================================
  // COMPACT SIDEBAR PRESENTATION
  // =========================================================================
  if (isCompact) {
    return (
      <div id="archive-sidebar-statistics-compact" className="space-y-3.5 p-3 text-xs font-mono select-none">
        {/* Header with Timeframe Pill */}
        <div className="flex items-center justify-between border-b border-[#3D4028] pb-2">
          <div className="flex items-center gap-1.5 font-bold text-white text-[11px]">
            <BarChart3 className="w-3.5 h-3.5 text-[#A3A649]" />
            <span>ARCHIVE STATS</span>
          </div>
          <div className="flex items-center gap-1 text-[10px]">
            {(["7d", "30d", "all"] as const).map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframe(tf)}
                className={`px-1.5 py-0.5 rounded-xs uppercase cursor-pointer ${
                  timeframe === tf
                    ? "bg-[#3D4028] text-[#A3A649] font-bold border border-[#A3A649]"
                    : "text-[#8C8C8C] hover:text-white"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* 2x2 Compact Metric Tiles */}
        <div className="grid grid-cols-2 gap-1.5">
          <div 
            id="archive-stat-tile-mood"
            className={`p-2 rounded-xs border space-y-0.5 transition-colors ${
              isLight 
                ? "bg-white border-stone-200 text-stone-900 shadow-2xs" 
                : "bg-[#222222] border-[#3D4028] text-white"
            }`}
            style={isLight ? { backgroundColor: "#ffffff" } : undefined}
          >
            <span className={`text-[10px] flex items-center gap-1 ${isLight ? "text-stone-600" : "text-[#8C8C8C]"}`}>
              <Sparkles className="w-3 h-3 text-[#A3A649]" /> Mood
            </span>
            <div className="flex items-baseline gap-1">
              <span className={`text-base font-bold ${isLight ? "text-stone-900" : "text-white"}`}>{summaryKPIs.avgMood}</span>
              <span className={`text-[9px] ${isLight ? "text-stone-500" : "text-[#8C8C8C]"}`}>/10</span>
            </div>
          </div>

          <div 
            id="archive-stat-tile-energy"
            className={`p-2 rounded-xs border space-y-0.5 transition-colors ${
              isLight 
                ? "bg-white border-stone-200 text-stone-900 shadow-2xs" 
                : "bg-[#222222] border-[#3D4028] text-white"
            }`}
            style={isLight ? { backgroundColor: "#ffffff" } : undefined}
          >
            <span className={`text-[10px] flex items-center gap-1 ${isLight ? "text-stone-600" : "text-[#8C8C8C]"}`}>
              <Zap className={`w-3 h-3 ${isLight ? "text-[#0284c7]" : "text-[#38bdf8]"}`} /> Energy
            </span>
            <div className="flex items-baseline gap-1">
              <span className={`text-base font-bold ${isLight ? "text-stone-900" : "text-white"}`}>{summaryKPIs.avgEnergy}</span>
              <span className={`text-[9px] ${isLight ? "text-stone-500" : "text-[#8C8C8C]"}`}>/10</span>
            </div>
          </div>

          <div 
            id="archive-stat-tile-sleep"
            className={`p-2 rounded-xs border space-y-0.5 transition-colors ${
              isLight 
                ? "bg-white border-stone-200 text-stone-900 shadow-2xs" 
                : "bg-[#222222] border-[#3D4028] text-white"
            }`}
            style={isLight ? { backgroundColor: "#ffffff" } : undefined}
          >
            <span className={`text-[10px] flex items-center gap-1 ${isLight ? "text-stone-600" : "text-[#8C8C8C]"}`}>
              <Moon className={`w-3 h-3 ${isLight ? "text-indigo-600" : "text-indigo-400"}`} /> Sleep
            </span>
            <div className="flex items-baseline gap-1">
              <span className={`text-base font-bold ${isLight ? "text-stone-900" : "text-white"}`}>{summaryKPIs.avgSleep}</span>
              <span className={`text-[9px] ${isLight ? "text-stone-500" : "text-[#8C8C8C]"}`}>/7</span>
            </div>
          </div>

          <div 
            id="archive-stat-tile-habits"
            className={`p-2 rounded-xs border space-y-0.5 transition-colors ${
              isLight 
                ? "bg-white border-stone-200 text-stone-900 shadow-2xs" 
                : "bg-[#222222] border-[#3D4028] text-white"
            }`}
            style={isLight ? { backgroundColor: "#ffffff" } : undefined}
          >
            <span className={`text-[10px] flex items-center gap-1 ${isLight ? "text-stone-600" : "text-[#8C8C8C]"}`}>
              <Target className={`w-3 h-3 ${isLight ? "text-emerald-600" : "text-[#10b981]"}`} /> Habits
            </span>
            <div className="flex items-baseline gap-1">
              <span className={`text-base font-bold ${isLight ? "text-stone-900" : "text-white"}`}>{summaryKPIs.habitConsistencyRate}%</span>
              <span className={`text-[9px] ${isLight ? "text-stone-500" : "text-[#8C8C8C]"}`}>Rate</span>
            </div>
          </div>
        </div>

        {/* Mini Sparkline Chart */}
        <div className="p-2.5 rounded-xs bg-[#1c1c1c] border border-[#3D4028] space-y-1.5">
          <div className="flex items-center justify-between text-[10px] text-[#8C8C8C]">
            <span className="flex items-center gap-1 text-[#e2e8f0]">
              <TrendingUp className="w-3 h-3 text-[#A3A649]" /> Mood & Vitality Wave
            </span>
            <span className="text-[9px] font-mono">{filteredMetrics.length} pts</span>
          </div>
          <div className="w-full h-24">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={progressionChartData} margin={{ top: 4, right: 2, left: -28, bottom: 0 }}>
                <defs>
                  <linearGradient id="compactMoodGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#A3A649" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#A3A649" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="compactEnergyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 2" stroke="#2b2d1d" opacity={0.5} />
                <XAxis dataKey="name" hide />
                <YAxis domain={[0, 10]} hide />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-[#262626] border border-[#3D4028] text-white p-1.5 rounded shadow-md text-[10px] space-y-0.5">
                          <p className="font-bold text-[#A3A649] truncate max-w-[140px]">{d.title}</p>
                          <p className="text-[9px] text-[#8C8C8C]">{d.name}</p>
                          <p className="text-[#A3A649]">Mood: {d.moodRating}/10</p>
                          <p className="text-[#38bdf8]">Energy: {d.energyLevel}/10</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="moodRating" stroke="#A3A649" strokeWidth={1.5} fill="url(#compactMoodGrad)" />
                <Area type="monotone" dataKey="energyLevel" stroke="#38bdf8" strokeWidth={1.5} fill="url(#compactEnergyGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Habit Compliance Breakdown List */}
        <div className="space-y-1.5">
          <span className="text-[10px] text-[#8C8C8C] uppercase font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-[#10b981]" /> Habit Adherence
          </span>
          <div className="space-y-1">
            {habitLifts.slice(0, 4).map((h) => (
              <div key={h.key} className="space-y-0.5">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-[#e2e8f0] truncate max-w-[120px]">{h.label}</span>
                  <span className="text-[#8C8C8C] font-mono">
                    {h.ratePercent}%
                    {h.energyDelta > 0 && (
                      <span className="text-[#10b981] ml-1 font-bold">+{h.energyDelta}⚡</span>
                    )}
                  </span>
                </div>
                <div className="w-full h-1 bg-[#262626] rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all" 
                    style={{ width: `${h.ratePercent}%`, backgroundColor: h.color }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* View Full Analytics Prompt */}
        <button
          type="button"
          onClick={() => setActiveTab("progression")}
          className="w-full py-1.5 px-2 bg-[#262626] hover:bg-[#3D4028] text-white rounded-xs border border-[#3D4028] text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 text-center"
        >
          <span>Explore Interactive Charts</span>
          <ChevronRight className="w-3 h-3 text-[#A3A649]" />
        </button>
      </div>
    );
  }

  // =========================================================================
  // FULL INTERACTIVE WORKSPACE VIEW (FOR RIGHT PANE OR DEDICATED VIEW)
  // =========================================================================
  return (
    <div id="archive-statistics-full-workspace" className="flex-1 flex flex-col h-full overflow-y-auto p-4 sm:p-6 space-y-6 font-mono text-xs select-none">
      {/* Top Header & Interactive Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#3D4028] pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-[#262626] border border-[#A3A649] flex items-center justify-center text-[#A3A649]">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
                Longitudinal Telemetry & Statistical Correlations
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40">
                  Parsed from {filteredMetrics.length} Entries
                </span>
              </h2>
              <p className="text-[11px] text-[#8C8C8C]">
                Tracking numerical progression, Pearson correlation coefficients, and behavioral habit lifts over time.
              </p>
            </div>
          </div>
        </div>

        {/* Timeframe selector */}
        <div className="flex items-center gap-1.5 bg-[#181818] border border-[#3D4028] p-1 rounded-md">
          <span className="text-[10px] text-[#8C8C8C] px-2 font-bold flex items-center gap-1">
            <Calendar className="w-3 h-3 text-[#A3A649]" /> Range:
          </span>
          {(["7d", "30d", "90d", "all"] as const).map((tf) => (
            <button
              key={tf}
              type="button"
              onClick={() => setTimeframe(tf)}
              className={`px-2.5 py-1 rounded text-xs uppercase cursor-pointer transition-all ${
                timeframe === tf
                  ? "bg-[#A3A649] text-black font-bold shadow-xs"
                  : "text-[#8C8C8C] hover:text-white"
              }`}
            >
              {tf === "all" ? "All Time" : tf}
            </button>
          ))}
        </div>
      </div>

      {/* Top 4 Summary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1: Mood Rating */}
        <div 
          className={`p-3.5 rounded-xl border space-y-1.5 transition-colors ${
            isLight 
              ? "bg-white border-stone-200 text-stone-900 shadow-xs" 
              : "bg-[#181818] border-[#3D4028]"
          }`}
          style={isLight ? { backgroundColor: "#ffffff" } : undefined}
        >
          <div className={`flex items-center justify-between text-[11px] ${isLight ? "text-stone-500" : "text-[#8C8C8C]"}`}>
            <span className="flex items-center gap-1.5 text-[#A3A649] font-bold">
              <Sparkles className="w-4 h-4" /> Subjective Mood
            </span>
            <span className="text-[10px] font-mono">Parsed 1-10</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-2xl font-bold font-mono ${isLight ? "text-stone-900" : "text-white"}`}>{summaryKPIs.avgMood}</span>
            <span className={`text-xs ${isLight ? "text-stone-500" : "text-[#8C8C8C]"}`}>/ 10.0</span>
          </div>
          <div className={`w-full h-1.5 rounded-full overflow-hidden ${isLight ? "bg-stone-100" : "bg-[#262626]"}`}>
            <div 
              className="h-full bg-[#A3A649] transition-all" 
              style={{ width: `${Math.min(100, (summaryKPIs.avgMood / 10) * 100)}%` }} 
            />
          </div>
        </div>

        {/* Metric 2: Energy Level */}
        <div 
          className={`p-3.5 rounded-xl border space-y-1.5 transition-colors ${
            isLight 
              ? "bg-white border-stone-200 text-stone-900 shadow-xs" 
              : "bg-[#181818] border-[#3D4028]"
          }`}
          style={isLight ? { backgroundColor: "#ffffff" } : undefined}
        >
          <div className={`flex items-center justify-between text-[11px] ${isLight ? "text-stone-500" : "text-[#8C8C8C]"}`}>
            <span className={`flex items-center gap-1.5 font-bold ${isLight ? "text-[#0284c7]" : "text-[#38bdf8]"}`}>
              <Zap className="w-4 h-4" /> Energy & Vitality
            </span>
            <span className="text-[10px] font-mono">Parsed 1-10</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-2xl font-bold font-mono ${isLight ? "text-stone-900" : "text-white"}`}>{summaryKPIs.avgEnergy}</span>
            <span className={`text-xs ${isLight ? "text-stone-500" : "text-[#8C8C8C]"}`}>/ 10.0</span>
          </div>
          <div className={`w-full h-1.5 rounded-full overflow-hidden ${isLight ? "bg-stone-100" : "bg-[#262626]"}`}>
            <div 
              className={`h-full transition-all ${isLight ? "bg-[#0284c7]" : "bg-[#38bdf8]"}`} 
              style={{ width: `${Math.min(100, (summaryKPIs.avgEnergy / 10) * 100)}%` }} 
            />
          </div>
        </div>

        {/* Metric 3: Sleep Quality */}
        <div 
          className={`p-3.5 rounded-xl border space-y-1.5 transition-colors ${
            isLight 
              ? "bg-white border-stone-200 text-stone-900 shadow-xs" 
              : "bg-[#181818] border-[#3D4028]"
          }`}
          style={isLight ? { backgroundColor: "#ffffff" } : undefined}
        >
          <div className={`flex items-center justify-between text-[11px] ${isLight ? "text-stone-500" : "text-[#8C8C8C]"}`}>
            <span className={`flex items-center gap-1.5 font-bold ${isLight ? "text-indigo-600" : "text-indigo-400"}`}>
              <Moon className="w-4 h-4" /> Restorative Sleep
            </span>
            <span className="text-[10px] font-mono">Scale 0-7</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-2xl font-bold font-mono ${isLight ? "text-stone-900" : "text-white"}`}>{summaryKPIs.avgSleep}</span>
            <span className={`text-xs ${isLight ? "text-stone-500" : "text-[#8C8C8C]"}`}>/ 7.0</span>
          </div>
          <div className={`w-full h-1.5 rounded-full overflow-hidden ${isLight ? "bg-stone-100" : "bg-[#262626]"}`}>
            <div 
              className={`h-full transition-all ${isLight ? "bg-indigo-600" : "bg-indigo-400"}`} 
              style={{ width: `${Math.min(100, (summaryKPIs.avgSleep / 7) * 100)}%` }} 
            />
          </div>
        </div>

        {/* Metric 4: Somatic Tension vs Clarity */}
        <div 
          className={`p-3.5 rounded-xl border space-y-1.5 transition-colors ${
            isLight 
              ? "bg-white border-stone-200 text-stone-900 shadow-xs" 
              : "bg-[#181818] border-[#3D4028]"
          }`}
          style={isLight ? { backgroundColor: "#ffffff" } : undefined}
        >
          <div className={`flex items-center justify-between text-[11px] ${isLight ? "text-stone-500" : "text-[#8C8C8C]"}`}>
            <span className={`flex items-center gap-1.5 font-bold ${isLight ? "text-emerald-600" : "text-[#10b981]"}`}>
              <Target className="w-4 h-4" /> Habit Consistency
            </span>
            <span className="text-[10px] font-mono">Multi-Tag Days</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-2xl font-bold font-mono ${isLight ? "text-stone-900" : "text-white"}`}>{summaryKPIs.habitConsistencyRate}%</span>
            <span className={`text-xs ${isLight ? "text-stone-500" : "text-[#8C8C8C]"}`}>of logs</span>
          </div>
          <div className={`w-full h-1.5 rounded-full overflow-hidden ${isLight ? "bg-stone-100" : "bg-[#262626]"}`}>
            <div 
              className={`h-full transition-all ${isLight ? "bg-emerald-600" : "bg-[#10b981]"}`} 
              style={{ width: `${summaryKPIs.habitConsistencyRate}%` }} 
            />
          </div>
        </div>
      </div>

      {/* Chart View Switcher - Prominent Unclipped Segmented Navigation Bar */}
      <div className="pt-2 pb-1">
        <div 
          id="archive-interactive-charts-tab-bar"
          className={`p-1.5 rounded-xl border flex items-center gap-1.5 overflow-x-auto scroll-smooth touch-pan-x transition-all shadow-xs ${
            isLight 
              ? "bg-[#EAEBE5] border-stone-300 text-stone-700" 
              : "bg-[#1f1f1f] border-[#3D4028] text-[#8C8C8C]"
          }`}
        >
          <button
            id="tab-chart-progression"
            type="button"
            onClick={() => setActiveTab("progression")}
            className={`shrink-0 min-w-max flex-1 py-2 px-3 sm:px-4 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap ${
              activeTab === "progression"
                ? isLight 
                  ? "bg-white text-stone-900 border border-stone-200 shadow-sm ring-1 ring-[#A3A649]/60" 
                  : "bg-[#2c2c2c] text-[#A3A649] border border-[#A3A649]/60 shadow-sm"
                : isLight 
                  ? "text-stone-600 hover:text-stone-900 hover:bg-white/60" 
                  : "text-[#8C8C8C] hover:text-white hover:bg-[#262626]"
            }`}
            style={activeTab === "progression" && isLight ? { backgroundColor: "#ffffff" } : undefined}
          >
            <TrendingUp className={`w-4 h-4 shrink-0 ${activeTab === "progression" ? (isLight ? "text-[#737628]" : "text-[#A3A649]") : ""}`} />
            <span>Mood & Energy Progression</span>
          </button>

          <button
            id="tab-chart-correlations"
            type="button"
            onClick={() => setActiveTab("correlations")}
            className={`shrink-0 min-w-max flex-1 py-2 px-3 sm:px-4 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap ${
              activeTab === "correlations"
                ? isLight 
                  ? "bg-white text-stone-900 border border-stone-200 shadow-sm ring-1 ring-[#10b981]/60" 
                  : "bg-[#2c2c2c] text-[#10b981] border border-[#10b981]/60 shadow-sm"
                : isLight 
                  ? "text-stone-600 hover:text-stone-900 hover:bg-white/60" 
                  : "text-[#8C8C8C] hover:text-white hover:bg-[#262626]"
            }`}
            style={activeTab === "correlations" && isLight ? { backgroundColor: "#ffffff" } : undefined}
          >
            <Activity className={`w-4 h-4 shrink-0 ${activeTab === "correlations" ? "text-[#10b981]" : ""}`} />
            <span className="hidden xl:inline">Energy vs Sleep Scatter & Correlations</span>
            <span className="xl:hidden">Energy vs Sleep Scatter</span>
          </button>

          <button
            id="tab-chart-habits"
            type="button"
            onClick={() => setActiveTab("habits")}
            className={`shrink-0 min-w-max flex-1 py-2 px-3 sm:px-4 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap ${
              activeTab === "habits"
                ? isLight 
                  ? "bg-white text-stone-900 border border-stone-200 shadow-sm ring-1 ring-[#0284c7]/60" 
                  : "bg-[#2c2c2c] text-[#38bdf8] border border-[#38bdf8]/60 shadow-sm"
                : isLight 
                  ? "text-stone-600 hover:text-stone-900 hover:bg-white/60" 
                  : "text-[#8C8C8C] hover:text-white hover:bg-[#262626]"
            }`}
            style={activeTab === "habits" && isLight ? { backgroundColor: "#ffffff" } : undefined}
          >
            <CheckCircle2 className={`w-4 h-4 shrink-0 ${activeTab === "habits" ? (isLight ? "text-[#0284c7]" : "text-[#38bdf8]") : ""}`} />
            <span>Habit Compliance & Lift</span>
          </button>

          <button
            id="tab-chart-chronobiology"
            type="button"
            onClick={() => setActiveTab("chronobiology")}
            className={`shrink-0 min-w-max flex-1 py-2 px-3 sm:px-4 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap ${
              activeTab === "chronobiology"
                ? isLight 
                  ? "bg-white text-stone-900 border border-stone-200 shadow-sm ring-1 ring-[#eab308]/60" 
                  : "bg-[#2c2c2c] text-[#eab308] border border-[#eab308]/60 shadow-sm"
                : isLight 
                  ? "text-stone-600 hover:text-stone-900 hover:bg-white/60" 
                  : "text-[#8C8C8C] hover:text-white hover:bg-[#262626]"
            }`}
            style={activeTab === "chronobiology" && isLight ? { backgroundColor: "#ffffff" } : undefined}
          >
            <Clock className={`w-4 h-4 shrink-0 ${activeTab === "chronobiology" ? "text-[#eab308]" : ""}`} />
            <span className="hidden md:inline">Chronobiology (Day-of-Week)</span>
            <span className="md:hidden">Chronobiology</span>
          </button>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 1. TAB: MOOD & ENERGY PROGRESSION                                  */}
      {/* =================================================================== */}
      {activeTab === "progression" && (
        <div 
          className={`p-4 sm:p-5 rounded-xl border space-y-4 transition-colors ${
            isLight ? "bg-white border-stone-200 text-stone-900 shadow-xs" : "bg-[#181818] border-[#3D4028]"
          }`}
          style={isLight ? { backgroundColor: "#ffffff" } : undefined}
        >
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 ${
            isLight ? "border-stone-200" : "border-[#3D4028]"
          }`}>
            <div>
              <h3 className={`text-xs sm:text-sm font-bold flex items-center gap-2 ${
                isLight ? "text-stone-900" : "text-white"
              }`}>
                <TrendingUp className="w-4 h-4 text-[#A3A649]" />
                Interactive Mood & Vitality Trajectory
              </h3>
              <p className={`text-[11px] ${isLight ? "text-stone-500" : "text-[#8C8C8C]"}`}>
                Click on any data point to inspect that journal entry's parsed telemetry.
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span className="flex items-center gap-1.5 text-[#A3A649]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#A3A649]" /> Mood (1-10)
              </span>
              <span className="flex items-center gap-1.5 text-[#38bdf8]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#38bdf8]" /> Energy (1-10)
              </span>
              <span className="flex items-center gap-1.5 text-indigo-400">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" /> Sleep (0-7)
              </span>
            </div>
          </div>

          <div className="w-full h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={progressionChartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload.length) {
                    const parsed = e.activePayload[0].payload.source as ParsedEntryMetrics;
                    setSelectedEntryPreview(parsed);
                  }
                }}
              >
                <defs>
                  <linearGradient id="areaMoodGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#A3A649" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#A3A649" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="areaEnergyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isLight ? "#D6DAD0" : "#3D4028"} opacity={0.6} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: isLight ? "#555A48" : "#8C8C8C", fontSize: 11 }}
                  axisLine={{ stroke: isLight ? "#D6DAD0" : "#3D4028" }}
                  tickLine={false}
                />
                <YAxis 
                  domain={[0, 10]} 
                  tick={{ fill: isLight ? "#555A48" : "#8C8C8C", fontSize: 11 }}
                  axisLine={{ stroke: isLight ? "#D6DAD0" : "#3D4028" }}
                  tickLine={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      const source = d.source as ParsedEntryMetrics;
                      return (
                        <div className="bg-[#262626] border border-[#3D4028] text-white p-3 rounded-lg shadow-xl text-xs space-y-1.5 font-mono max-w-xs">
                          <p className="font-bold text-[#A3A649] truncate">{d.title}</p>
                          <p className="text-[10px] text-[#8C8C8C]">{d.fullDate} ({source.dayOfWeek})</p>
                          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 pt-1 border-t border-[#3D4028] text-[11px]">
                            <p className="text-[#A3A649]">Mood: <span className="font-bold">{d.moodRating}/10</span></p>
                            <p className="text-[#38bdf8]">Energy: <span className="font-bold">{d.energyLevel}/10</span></p>
                            <p className="text-indigo-400">Sleep: <span className="font-bold">{d.sleepScore}/7</span></p>
                            <p className="text-[#AD3D30]">Tension: <span className="font-bold">{d.somaticTension}/10</span></p>
                          </div>
                          <p className="text-[9px] text-[#A3A649] italic pt-1">
                            Click point to inspect or open in studio
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="moodRating" 
                  name="Mood (1-10)" 
                  stroke="#A3A649" 
                  strokeWidth={2} 
                  fill="url(#areaMoodGrad)" 
                  activeDot={{ r: 6, fill: "#A3A649" }}
                />
                <Area 
                  type="monotone" 
                  dataKey="energyLevel" 
                  name="Energy (1-10)" 
                  stroke="#38bdf8" 
                  strokeWidth={2} 
                  fill="url(#areaEnergyGrad)" 
                  activeDot={{ r: 6, fill: "#38bdf8" }}
                />
                <Line 
                  type="monotone" 
                  dataKey="sleepScore" 
                  name="Sleep (0-7)" 
                  stroke="#818cf8" 
                  strokeWidth={1.5} 
                  strokeDasharray="4 4"
                  dot={{ r: 3, fill: "#818cf8" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 2. TAB: LONGITUDINAL CORRELATIONS & INTERACTIVE SCATTER PLOT        */}
      {/* =================================================================== */}
      {activeTab === "correlations" && (
        <div 
          className={`p-4 sm:p-5 rounded-xl border space-y-4 transition-colors ${
            isLight ? "bg-white border-stone-200 text-stone-900 shadow-xs" : "bg-[#181818] border-[#3D4028]"
          }`}
          style={isLight ? { backgroundColor: "#ffffff" } : undefined}
        >
          {/* Header & Controls */}
          <div className={`flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b pb-4 ${
            isLight ? "border-stone-200" : "border-[#3D4028]"
          }`}>
            <div>
              <h3 className={`text-xs sm:text-sm font-bold flex items-center gap-2 ${
                isLight ? "text-stone-900" : "text-white"
              }`}>
                <Activity className="w-4 h-4 text-[#10b981]" />
                Interactive Scatter Plot: Energy Levels vs. Sleep Quality
              </h3>
              <p className={`text-[11px] ${isLight ? "text-stone-500" : "text-[#8C8C8C]"}`}>
                Empirical correlation analysis mapping physiological sleep restorative scores against cognitive vitality.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* View Mode Toggle: Scatter vs Paired Bars */}
              <div className={`flex items-center p-1 rounded-lg border ${
                isLight ? "bg-stone-100 border-stone-200" : "bg-[#262626] border-[#3D4028]"
              }`}>
                <button
                  type="button"
                  onClick={() => setCorrelationViewMode("scatter")}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
                    correlationViewMode === "scatter"
                      ? isLight 
                        ? "bg-white text-stone-900 shadow-xs border border-stone-200" 
                        : "bg-[#10b981] text-black font-extrabold"
                      : isLight ? "text-stone-600 hover:text-stone-900" : "text-[#8C8C8C] hover:text-white"
                  }`}
                >
                  <Crosshair className="w-3 h-3" />
                  <span>Scatter Plot</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCorrelationViewMode("bars")}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
                    correlationViewMode === "bars"
                      ? isLight 
                        ? "bg-white text-stone-900 shadow-xs border border-stone-200" 
                        : "bg-[#10b981] text-black font-extrabold"
                      : isLight ? "text-stone-600 hover:text-stone-900" : "text-[#8C8C8C] hover:text-white"
                  }`}
                >
                  <BarChart3 className="w-3 h-3" />
                  <span>Paired Bars</span>
                </button>
              </div>

              {/* Variable Pair Selector */}
              <div className={`flex items-center gap-1 p-1 rounded-lg border ${
                isLight ? "bg-stone-100 border-stone-200" : "bg-[#262626] border-[#3D4028]"
              }`}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCorrelationPair("sleep_energy");
                    setSelectedScatterPoint(null);
                  }}
                  className={`px-2 py-1 rounded text-[11px] font-bold cursor-pointer transition-all ${
                    selectedCorrelationPair === "sleep_energy"
                      ? "bg-[#38bdf8] text-black shadow-xs font-extrabold"
                      : isLight ? "text-stone-600 hover:text-stone-900" : "text-[#8C8C8C] hover:text-white"
                  }`}
                >
                  Sleep vs. Energy
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCorrelationPair("tension_clarity");
                    setSelectedScatterPoint(null);
                  }}
                  className={`px-2 py-1 rounded text-[11px] font-bold cursor-pointer transition-all ${
                    selectedCorrelationPair === "tension_clarity"
                      ? "bg-[#AD3D30] text-white shadow-xs font-extrabold"
                      : isLight ? "text-stone-600 hover:text-stone-900" : "text-[#8C8C8C] hover:text-white"
                  }`}
                >
                  Tension vs. Clarity
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCorrelationPair("mood_energy");
                    setSelectedScatterPoint(null);
                  }}
                  className={`px-2 py-1 rounded text-[11px] font-bold cursor-pointer transition-all ${
                    selectedCorrelationPair === "mood_energy"
                      ? "bg-[#A3A649] text-black shadow-xs font-extrabold"
                      : isLight ? "text-stone-600 hover:text-stone-900" : "text-[#8C8C8C] hover:text-white"
                  }`}
                >
                  Mood vs. Energy
                </button>
              </div>
            </div>
          </div>

          {/* Statistical KPI & Regression Summary Ribbon */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Pearson r Card */}
            <div className={`p-3 rounded-xl border flex flex-col justify-between ${
              isLight ? "bg-stone-50 border-stone-200" : "bg-[#222222] border-[#3D4028]"
            }`}>
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? "text-stone-500" : "text-[#8C8C8C]"}`}>
                  Pearson Correlation (r)
                </span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                  correlationData.strength === "strong_pos" ? "bg-[#10b981]/20 text-[#10b981] border-[#10b981]/40" :
                  correlationData.strength === "strong_neg" ? "bg-[#AD3D30]/20 text-[#AD3D30] border-[#AD3D30]/40" :
                  correlationData.strength === "mod_pos" ? "bg-[#38bdf8]/20 text-[#38bdf8] border-[#38bdf8]/40" :
                  "bg-[#A3A649]/20 text-[#A3A649] border-[#A3A649]/40"
                }`}>
                  {correlationData.strength === "strong_pos" ? "Strong Positive" : correlationData.strength === "mod_pos" ? "Moderate" : correlationData.label}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-black font-mono ${isLight ? "text-stone-900" : "text-white"}`}>
                  r = {correlationData.r > 0 ? `+${correlationData.r}` : correlationData.r}
                </span>
              </div>
              <p className={`text-[10px] mt-1 ${isLight ? "text-stone-500" : "text-[#8C8C8C]"}`}>
                {selectedCorrelationPair === "sleep_energy"
                  ? "Direct causal correlation between sleep quality and daytime vitality."
                  : selectedCorrelationPair === "tension_clarity"
                  ? "Inverse somatic tension drag on mental clarity."
                  : "Emotional valence tracking physiological energy."}
              </p>
            </div>

            {/* Variance Explained (R²) */}
            <div className={`p-3 rounded-xl border flex flex-col justify-between ${
              isLight ? "bg-stone-50 border-stone-200" : "bg-[#222222] border-[#3D4028]"
            }`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isLight ? "text-stone-500" : "text-[#8C8C8C]"}`}>
                Variance Explained (R²)
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className={`text-2xl font-black font-mono ${isLight ? "text-stone-900" : "text-white"}`}>
                  {(scatterStats.r2 * 100).toFixed(0)}%
                </span>
                <span className={`text-[11px] font-mono ${isLight ? "text-stone-400" : "text-[#8C8C8C]"}`}>
                  (R² = {scatterStats.r2})
                </span>
              </div>
              <p className={`text-[10px] mt-1 ${isLight ? "text-stone-500" : "text-[#8C8C8C]"}`}>
                Proportion of energy variation directly attributable to sleep depth.
              </p>
            </div>

            {/* Regression Model */}
            <div className={`p-3 rounded-xl border flex flex-col justify-between ${
              isLight ? "bg-stone-50 border-stone-200" : "bg-[#222222] border-[#3D4028]"
            }`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isLight ? "text-stone-500" : "text-[#8C8C8C]"}`}>
                Linear Regression Model
              </span>
              <div className="truncate font-mono text-xs font-bold text-sky-600 dark:text-sky-400">
                {scatterStats.equationStr}
              </div>
              <p className={`text-[10px] mt-1 ${isLight ? "text-stone-500" : "text-[#8C8C8C]"}`}>
                Slope indicates +{scatterStats.slope} energy gain per 1.0 sleep score point.
              </p>
            </div>

            {/* Sample Size & Means */}
            <div className={`p-3 rounded-xl border flex flex-col justify-between ${
              isLight ? "bg-stone-50 border-stone-200" : "bg-[#222222] border-[#3D4028]"
            }`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isLight ? "text-stone-500" : "text-[#8C8C8C]"}`}>
                Sample Means (X̄, Ȳ)
              </span>
              <div className="flex items-center gap-2 font-mono text-xs font-bold">
                <span className="px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400">
                  X̄: {scatterStats.meanX} {scatterStats.xUnit}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  Ȳ: {scatterStats.meanY} {scatterStats.yUnit}
                </span>
              </div>
              <p className={`text-[10px] mt-1 ${isLight ? "text-stone-500" : "text-[#8C8C8C]"}`}>
                Calculated across {scatterStats.points.length} database reflections.
              </p>
            </div>
          </div>

          {/* Interactive Chart Options & Quadrant Filters */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 pb-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`text-[11px] font-bold ${isLight ? "text-stone-500" : "text-[#8C8C8C]"}`}>
                Filter:
              </span>
              <button
                type="button"
                onClick={() => setFilterQuadrant("all")}
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-all ${
                  filterQuadrant === "all"
                    ? isLight ? "bg-stone-800 text-white" : "bg-white text-black"
                    : isLight ? "bg-stone-100 text-stone-600 hover:bg-stone-200" : "bg-[#262626] text-[#8C8C8C] hover:text-white"
                }`}
              >
                All Data ({scatterStats.points.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterQuadrant(filterQuadrant === "q1" ? "all" : "q1")}
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-all border ${
                  filterQuadrant === "q1"
                    ? "bg-emerald-500 text-white border-emerald-600"
                    : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                }`}
              >
                Q1: Optimal ({scatterStats.quadrants.q1.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterQuadrant(filterQuadrant === "q2" ? "all" : "q2")}
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-all border ${
                  filterQuadrant === "q2"
                    ? "bg-amber-500 text-white border-amber-600"
                    : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                }`}
              >
                Q2: Compensatory ({scatterStats.quadrants.q2.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterQuadrant(filterQuadrant === "q3" ? "all" : "q3")}
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-all border ${
                  filterQuadrant === "q3"
                    ? "bg-rose-500 text-white border-rose-600"
                    : "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30"
                }`}
              >
                Q3: Depleted ({scatterStats.quadrants.q3.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterQuadrant(filterQuadrant === "q4" ? "all" : "q4")}
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-all border ${
                  filterQuadrant === "q4"
                    ? "bg-sky-500 text-white border-sky-600"
                    : "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30"
                }`}
              >
                Q4: Recovery ({scatterStats.quadrants.q4.length})
              </button>
            </div>

            {/* Chart Overlay Toggles */}
            {correlationViewMode === "scatter" && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowTrendline(!showTrendline)}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer transition-all border flex items-center gap-1 ${
                    showTrendline
                      ? isLight ? "bg-emerald-50 text-emerald-700 border-emerald-300" : "bg-emerald-950/60 text-emerald-400 border-emerald-700"
                      : isLight ? "bg-stone-100 text-stone-500 border-stone-200" : "bg-[#262626] text-[#666] border-[#333]"
                  }`}
                >
                  <TrendingUp className="w-3 h-3" />
                  <span>Trendline {showTrendline ? "On" : "Off"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowQuadrantDividers(!showQuadrantDividers)}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer transition-all border flex items-center gap-1 ${
                    showQuadrantDividers
                      ? isLight ? "bg-sky-50 text-sky-700 border-sky-300" : "bg-sky-950/60 text-sky-400 border-sky-700"
                      : isLight ? "bg-stone-100 text-stone-500 border-stone-200" : "bg-[#262626] text-[#666] border-[#333]"
                  }`}
                >
                  <Crosshair className="w-3 h-3" />
                  <span>Crosshairs {showQuadrantDividers ? "On" : "Off"}</span>
                </button>
              </div>
            )}
          </div>

          {/* Live Hover Telemetry Bar */}
          {hoveredScatterPoint && (
            <div 
              id="scatter-hover-telemetry-pill"
              className={`mb-2 px-3 py-1.5 rounded-lg border text-xs font-mono flex items-center justify-between gap-3 shadow-xs animate-in fade-in transition-all ${
                isLight 
                  ? "bg-white border-stone-300 text-stone-900" 
                  : "bg-[#1c1c1c] border-[#3D4028] text-stone-100"
              }`}
            >
              <div className="flex items-center gap-2 truncate min-w-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                <span className="font-bold truncate">{hoveredScatterPoint.title}</span>
                <span className="text-stone-500 text-[11px] shrink-0">({hoveredScatterPoint.exactDateStr || hoveredScatterPoint.dateStr})</span>
              </div>
              <div className="flex items-center gap-3 shrink-0 text-[11px] font-semibold">
                <span className="text-sky-600 dark:text-sky-400 flex items-center gap-1">
                  <Moon className="w-3 h-3" />
                  Sleep: {Number(hoveredScatterPoint.sleepScore).toFixed(1)}/7.0
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  Energy: {Number(hoveredScatterPoint.energyLevel).toFixed(1)}/10.0
                </span>
              </div>
            </div>
          )}

          {/* MAIN CHART CANVAS */}
          {correlationViewMode === "scatter" ? (
            <div className={`w-full h-80 sm:h-96 rounded-xl border p-2 relative transition-colors ${
              isLight ? "bg-stone-50/50 border-stone-200" : "bg-[#141414] border-[#2c2c2c]"
            }`}>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart 
                  margin={{ top: 20, right: 30, left: 10, bottom: 25 }}
                  onMouseLeave={() => setHoveredScatterPoint(null)}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={isLight ? "#e2e8f0" : "#2a2a2a"} />
                  <XAxis 
                    type="number" 
                    dataKey="x" 
                    name={scatterStats.xName}
                    unit={scatterStats.xUnit}
                    domain={scatterStats.xDomain}
                    tick={{ fill: isLight ? "#64748b" : "#888888", fontSize: 11 }}
                    axisLine={{ stroke: isLight ? "#cbd5e1" : "#3d3d3d" }}
                    label={{
                      value: `${scatterStats.xName} (Score ${scatterStats.xUnit})`,
                      position: "insideBottom",
                      offset: -12,
                      fill: isLight ? "#334155" : "#a1a1aa",
                      fontSize: 11,
                      fontWeight: 600
                    }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="y" 
                    name={scatterStats.yName}
                    unit={scatterStats.yUnit}
                    domain={scatterStats.yDomain}
                    tick={{ fill: isLight ? "#64748b" : "#888888", fontSize: 11 }}
                    axisLine={{ stroke: isLight ? "#cbd5e1" : "#3d3d3d" }}
                    label={{
                      value: `${scatterStats.yName} (Level ${scatterStats.yUnit})`,
                      angle: -90,
                      position: "insideLeft",
                      offset: 0,
                      fill: isLight ? "#334155" : "#a1a1aa",
                      fontSize: 11,
                      fontWeight: 600
                    }}
                  />
                  <ZAxis type="number" dataKey="z" range={[80, 160]} />
                  
                  {/* Mean Quadrant Crosshairs */}
                  {showQuadrantDividers && (
                    <>
                      <ReferenceLine
                        x={scatterStats.meanX}
                        stroke={isLight ? "#94a3b8" : "#52525b"}
                        strokeDasharray="4 4"
                        strokeWidth={1.5}
                        label={{
                          value: `Mean X̄: ${scatterStats.meanX}`,
                          fill: isLight ? "#64748b" : "#71717a",
                          fontSize: 10,
                          position: "insideTopRight"
                        }}
                      />
                      <ReferenceLine
                        y={scatterStats.meanY}
                        stroke={isLight ? "#94a3b8" : "#52525b"}
                        strokeDasharray="4 4"
                        strokeWidth={1.5}
                        label={{
                          value: `Mean Ȳ: ${scatterStats.meanY}`,
                          fill: isLight ? "#64748b" : "#71717a",
                          fontSize: 10,
                          position: "insideBottomRight"
                        }}
                      />
                    </>
                  )}

                  {/* Linear Regression Trendline */}
                  {showTrendline && scatterStats.trendlineData.length === 2 && (
                    <ReferenceLine
                      segment={[
                        { x: scatterStats.trendlineData[0].x, y: scatterStats.trendlineData[0].y },
                        { x: scatterStats.trendlineData[1].x, y: scatterStats.trendlineData[1].y }
                      ]}
                      stroke={isLight ? "#059669" : "#10b981"}
                      strokeWidth={2.5}
                      strokeDasharray="5 5"
                    />
                  )}

                  {/* Enhanced Interactive Tooltip */}
                  <Tooltip
                    isAnimationActive={false}
                    wrapperStyle={{ zIndex: 9999, pointerEvents: "none" }}
                    cursor={{ strokeDasharray: "3 3", stroke: isLight ? "#94a3b8" : "#666" }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        if (!data) return null;
                        return (
                          <div 
                            id="scatter-active-tooltip"
                            className={`p-3.5 rounded-xl border font-mono text-xs shadow-2xl max-w-xs space-y-2 pointer-events-none transition-all ${
                              isLight 
                                ? "bg-white/95 backdrop-blur-md border-stone-300 text-stone-900 shadow-stone-400/30" 
                                : "bg-[#1e1e1e]/95 backdrop-blur-md border-[#3D4028] text-white shadow-black/80"
                            }`}
                          >
                            {/* Header */}
                            <div className="border-b pb-2 border-stone-200 dark:border-stone-800">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-bold text-xs truncate max-w-[170px]">{data.title}</span>
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                                  {data.quadrantLabel || "Point"}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                                <Calendar className="w-3.5 h-3.5 shrink-0 text-stone-400" />
                                <span className="font-semibold">{data.exactDateStr || data.dateStr}</span>
                              </div>
                            </div>
                            
                            {/* Primary Interactive Metrics: Exact Date, Sleep Score, Energy Level */}
                            <div className="space-y-1.5 text-[11px]">
                              <div className={`flex items-center justify-between p-1.5 rounded-lg ${
                                isLight ? "bg-sky-50 text-sky-950" : "bg-sky-950/40 text-sky-200"
                              }`}>
                                <div className="flex items-center gap-1.5">
                                  <Moon className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                                  <span className="font-medium">Sleep Score:</span>
                                </div>
                                <span className="font-bold text-xs text-sky-600 dark:text-sky-400">
                                  {Number(data.sleepScore).toFixed(1)} / 7.0
                                </span>
                              </div>

                              <div className={`flex items-center justify-between p-1.5 rounded-lg ${
                                isLight ? "bg-emerald-50 text-emerald-950" : "bg-emerald-950/40 text-emerald-200"
                              }`}>
                                <div className="flex items-center gap-1.5">
                                  <Zap className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                  <span className="font-medium">Energy Level:</span>
                                </div>
                                <span className="font-bold text-xs text-emerald-600 dark:text-[#A3A649]">
                                  {Number(data.energyLevel).toFixed(1)} / 10.0
                                </span>
                              </div>

                              <div className="flex items-center justify-between gap-2 pt-1 text-[10px] text-stone-500 dark:text-stone-400">
                                <span>Mood: <strong className="capitalize text-stone-700 dark:text-stone-200">{data.moodRating}/10 ({data.moodLabel})</strong></span>
                                <span>Tension: <strong className="text-stone-700 dark:text-stone-200">{data.somaticTension}/10</strong></span>
                              </div>
                            </div>

                            <div className="pt-1.5 border-t border-stone-200 dark:border-stone-800 text-[10px] text-stone-400 flex items-center justify-between">
                              <span className="italic">Click dot to inspect reflection</span>
                              <span className="text-[9px] opacity-75">{data.dayOfWeek}</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />

                  {/* Interactive Scatter Dots */}
                  <Scatter
                    name="Journal Reflections"
                    data={scatterStats.filteredPoints}
                    isAnimationActive={false}
                    onMouseEnter={(node: any) => {
                      if (node && node.payload) {
                        setHoveredScatterPoint(node.payload);
                      } else if (node && node.id) {
                        setHoveredScatterPoint(node);
                      }
                    }}
                    onMouseLeave={() => {
                      setHoveredScatterPoint(null);
                    }}
                    onClick={(node: any) => {
                      if (node && node.payload) {
                        setSelectedScatterPoint(node.payload);
                      } else if (node && node.id) {
                        setSelectedScatterPoint(node);
                      }
                    }}
                    cursor="pointer"
                  >
                    {scatterStats.filteredPoints.map((entry: any, index: number) => {
                      const isSelected = selectedScatterPoint?.id === entry.id;
                      const isHovered = hoveredScatterPoint?.id === entry.id;
                      let dotColor = "#10b981";
                      if (entry.x >= scatterStats.meanX && entry.y >= scatterStats.meanY) {
                        dotColor = isLight ? "#059669" : "#10b981"; // Q1 Optimal
                      } else if (entry.x < scatterStats.meanX && entry.y >= scatterStats.meanY) {
                        dotColor = isLight ? "#d97706" : "#f59e0b"; // Q2 Compensatory
                      } else if (entry.x < scatterStats.meanX && entry.y < scatterStats.meanY) {
                        dotColor = isLight ? "#dc2626" : "#ef4444"; // Q3 Depleted
                      } else {
                        dotColor = isLight ? "#2563eb" : "#38bdf8"; // Q4 Latent recovery
                      }

                      return (
                        <Cell
                          key={`scatter-cell-${entry.id || index}`}
                          fill={dotColor}
                          stroke={
                            isSelected 
                              ? (isLight ? "#09090b" : "#ffffff") 
                              : isHovered
                              ? (isLight ? "#0284c7" : "#38bdf8")
                              : (isLight ? "#ffffff" : "#181818")
                          }
                          strokeWidth={isSelected ? 3.5 : isHovered ? 3 : 1.5}
                          r={isSelected ? 8.5 : isHovered ? 8 : 6}
                          style={{ 
                            cursor: "pointer", 
                            transition: "r 0.15s ease, stroke 0.15s ease, stroke-width 0.15s ease" 
                          }}
                          onMouseEnter={() => setHoveredScatterPoint(entry)}
                          onMouseLeave={() => setHoveredScatterPoint(null)}
                        />
                      );
                    })}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          ) : (
            /* Paired Bar Chart fallback */
            <div className="w-full h-72 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={progressionChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isLight ? "#D6DAD0" : "#3D4028"} opacity={0.6} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: isLight ? "#555A48" : "#8C8C8C", fontSize: 11 }}
                    axisLine={{ stroke: isLight ? "#D6DAD0" : "#3D4028" }}
                    tickLine={false}
                  />
                  <YAxis 
                    domain={[0, 10]} 
                    tick={{ fill: isLight ? "#555A48" : "#8C8C8C", fontSize: 11 }}
                    axisLine={{ stroke: isLight ? "#D6DAD0" : "#3D4028" }}
                    tickLine={false}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-[#262626] border border-[#3D4028] text-white p-2.5 rounded shadow-xl text-xs space-y-1 font-mono">
                            <p className="font-bold text-[#A3A649]">{d.title}</p>
                            <p className="text-[10px] text-[#8C8C8C]">{d.name}</p>
                            {selectedCorrelationPair === "sleep_energy" && (
                              <>
                                <p className="text-[#38bdf8]">Restorative Sleep: {d.sleepScore}/7</p>
                                <p className="text-[#A3A649]">Daily Energy: {d.energyLevel}/10</p>
                              </>
                            )}
                            {selectedCorrelationPair === "tension_clarity" && (
                              <>
                                <p className="text-[#AD3D30]">Somatic Tension: {d.somaticTension}/10</p>
                                <p className="text-[#10b981]">Mental Clarity: {d.mentalClarity}/10</p>
                              </>
                            )}
                            {selectedCorrelationPair === "mood_energy" && (
                              <>
                                <p className="text-[#A3A649]">Mood Rating: {d.moodRating}/10</p>
                                <p className="text-[#38bdf8]">Daily Energy: {d.energyLevel}/10</p>
                              </>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  {selectedCorrelationPair === "sleep_energy" && (
                    <>
                      <Bar dataKey="sleepScore" name="Sleep (0-7)" fill="#818cf8" radius={[3, 3, 0, 0]} maxBarSize={30} />
                      <Bar dataKey="energyLevel" name="Energy (1-10)" fill="#38bdf8" radius={[3, 3, 0, 0]} maxBarSize={30} />
                    </>
                  )}
                  {selectedCorrelationPair === "tension_clarity" && (
                    <>
                      <Bar dataKey="somaticTension" name="Tension (0-10)" fill="#AD3D30" radius={[3, 3, 0, 0]} maxBarSize={30} />
                      <Bar dataKey="mentalClarity" name="Clarity (0-10)" fill="#10b981" radius={[3, 3, 0, 0]} maxBarSize={30} />
                    </>
                  )}
                  {selectedCorrelationPair === "mood_energy" && (
                    <>
                      <Bar dataKey="moodRating" name="Mood (1-10)" fill="#A3A649" radius={[3, 3, 0, 0]} maxBarSize={30} />
                      <Bar dataKey="energyLevel" name="Energy (1-10)" fill="#38bdf8" radius={[3, 3, 0, 0]} maxBarSize={30} />
                    </>
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Interactive Point Inspector (Shown when a scatter dot is clicked) */}
          {selectedScatterPoint && (
            <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all shadow-md ${
              isLight ? "bg-stone-50 border-stone-300 text-stone-900" : "bg-[#222222] border-[#3D4028] text-white"
            }`}>
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm truncate">{selectedScatterPoint.title}</span>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-mono border ${
                    isLight ? "bg-white border-stone-300 text-stone-600" : "bg-[#2c2c2c] border-[#444] text-[#aaa]"
                  }`}>
                    {selectedScatterPoint.dateStr} ({selectedScatterPoint.dayOfWeek})
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full font-mono bg-[#A3A649]/20 text-[#A3A649] border border-[#A3A649]/40 capitalize">
                    {selectedScatterPoint.moodLabel}
                  </span>
                </div>

                <p className={`text-xs line-clamp-2 italic ${isLight ? "text-stone-600" : "text-stone-300"}`}>
                  "{selectedScatterPoint.excerpt}"
                </p>

                <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
                  <span className="px-2 py-0.5 rounded bg-sky-500/15 text-sky-600 dark:text-sky-400 font-bold font-mono">
                    Sleep: {selectedScatterPoint.sleepScore}/7
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-[#A3A649] font-bold font-mono">
                    Energy: {selectedScatterPoint.energyLevel}/10
                  </span>
                  <span className="px-2 py-0.5 rounded bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold font-mono">
                    Tension: {selectedScatterPoint.somaticTension}/10
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold font-mono">
                    Clarity: {selectedScatterPoint.mentalClarity}/10
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => onSelectEntry(selectedScatterPoint.sourceEntry)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 bg-[#10b981] hover:bg-[#059669] text-white shadow-xs"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Read in Archive</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenInStudio(selectedScatterPoint.sourceEntry)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 border ${
                    isLight ? "bg-white border-stone-300 text-stone-800 hover:bg-stone-100" : "bg-[#2c2c2c] border-[#444] text-white hover:bg-[#333]"
                  }`}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Studio</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedScatterPoint(null)}
                  className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                    isLight ? "text-stone-400 hover:text-stone-700 hover:bg-stone-200" : "text-stone-500 hover:text-white hover:bg-[#333]"
                  }`}
                  title="Dismiss inspection"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Quadrant Matrix Breakdown Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            {/* Q1: Optimal */}
            <button
              type="button"
              onClick={() => setFilterQuadrant(filterQuadrant === "q1" ? "all" : "q1")}
              className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                filterQuadrant === "q1"
                  ? isLight ? "bg-emerald-50 border-emerald-500 ring-2 ring-emerald-400/40" : "bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/40"
                  : isLight ? "bg-stone-50 hover:bg-stone-100 border-stone-200" : "bg-[#222222] hover:bg-[#282828] border-[#3D4028]"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Q1 • Optimal Zone
                </span>
                <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  {scatterStats.quadrants.q1.length} ({scatterStats.points.length > 0 ? Math.round((scatterStats.quadrants.q1.length / scatterStats.points.length) * 100) : 0}%)
                </span>
              </div>
              <div className="text-xs font-bold mb-0.5 text-stone-900 dark:text-white">High Sleep & High Energy</div>
              <p className="text-[10px] text-stone-500 dark:text-stone-400 line-clamp-2">
                Restorative sleep directly converts into peak executive clarity and physical vitality.
              </p>
            </button>

            {/* Q2: Compensatory */}
            <button
              type="button"
              onClick={() => setFilterQuadrant(filterQuadrant === "q2" ? "all" : "q2")}
              className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                filterQuadrant === "q2"
                  ? isLight ? "bg-amber-50 border-amber-500 ring-2 ring-amber-400/40" : "bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/40"
                  : isLight ? "bg-stone-50 hover:bg-stone-100 border-stone-200" : "bg-[#222222] hover:bg-[#282828] border-[#3D4028]"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Q2 • Compensatory
                </span>
                <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400">
                  {scatterStats.quadrants.q2.length} ({scatterStats.points.length > 0 ? Math.round((scatterStats.quadrants.q2.length / scatterStats.points.length) * 100) : 0}%)
                </span>
              </div>
              <div className="text-xs font-bold mb-0.5 text-stone-900 dark:text-white">Low Sleep & High Energy</div>
              <p className="text-[10px] text-stone-500 dark:text-stone-400 line-clamp-2">
                Sympathetic adrenaline or caffeine compensation masking latent somatic sleep debt.
              </p>
            </button>

            {/* Q3: Depleted */}
            <button
              type="button"
              onClick={() => setFilterQuadrant(filterQuadrant === "q3" ? "all" : "q3")}
              className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                filterQuadrant === "q3"
                  ? isLight ? "bg-rose-50 border-rose-500 ring-2 ring-rose-400/40" : "bg-rose-950/40 border-rose-500 ring-2 ring-rose-500/40"
                  : isLight ? "bg-stone-50 hover:bg-stone-100 border-stone-200" : "bg-[#222222] hover:bg-[#282828] border-[#3D4028]"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                  Q3 • Depleted State
                </span>
                <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-600 dark:text-rose-400">
                  {scatterStats.quadrants.q3.length} ({scatterStats.points.length > 0 ? Math.round((scatterStats.quadrants.q3.length / scatterStats.points.length) * 100) : 0}%)
                </span>
              </div>
              <div className="text-xs font-bold mb-0.5 text-stone-900 dark:text-white">Low Sleep & Low Energy</div>
              <p className="text-[10px] text-stone-500 dark:text-stone-400 line-clamp-2">
                Acute sleep loss creates immediate friction, high somatic tension, and cognitive drag.
              </p>
            </button>

            {/* Q4: Recovery */}
            <button
              type="button"
              onClick={() => setFilterQuadrant(filterQuadrant === "q4" ? "all" : "q4")}
              className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                filterQuadrant === "q4"
                  ? isLight ? "bg-sky-50 border-sky-500 ring-2 ring-sky-400/40" : "bg-sky-950/40 border-sky-500 ring-2 ring-sky-500/40"
                  : isLight ? "bg-stone-50 hover:bg-stone-100 border-stone-200" : "bg-[#222222] hover:bg-[#282828] border-[#3D4028]"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                  Q4 • Latent Recovery
                </span>
                <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-600 dark:text-sky-400">
                  {scatterStats.quadrants.q4.length} ({scatterStats.points.length > 0 ? Math.round((scatterStats.quadrants.q4.length / scatterStats.points.length) * 100) : 0}%)
                </span>
              </div>
              <div className="text-xs font-bold mb-0.5 text-stone-900 dark:text-white">High Sleep & Low Energy</div>
              <p className="text-[10px] text-stone-500 dark:text-stone-400 line-clamp-2">
                Restorative sleep during illness or burnout recovery where vitality rebound lags by 24-48h.
              </p>
            </button>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 3. TAB: HABIT COMPLIANCE & CAUSAL LIFT                             */}
      {/* =================================================================== */}
      {activeTab === "habits" && (
        <div 
          className={`p-4 sm:p-5 rounded-xl border space-y-4 transition-colors ${
            isLight ? "bg-white border-stone-200 text-stone-900 shadow-xs" : "bg-[#181818] border-[#3D4028]"
          }`}
          style={isLight ? { backgroundColor: "#ffffff" } : undefined}
        >
          <div className={`border-b pb-3 ${isLight ? "border-stone-200" : "border-[#3D4028]"}`}>
            <h3 className={`text-xs sm:text-sm font-bold flex items-center gap-2 ${
              isLight ? "text-stone-900" : "text-white"
            }`}>
              <CheckCircle2 className="w-4 h-4 text-[#38bdf8]" />
              Binary Habit Compliance Rates & Causal Statistical Lift
            </h3>
            <p className={`text-[11px] ${isLight ? "text-stone-500" : "text-[#8C8C8C]"}`}>
              Measures the empirical difference in Mood and Energy on days when habits were completed vs. skipped.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {habitLifts.map((habit) => (
              <div 
                key={habit.key}
                className={`p-3.5 rounded-lg border space-y-2.5 ${
                  isLight ? "bg-stone-50 border-stone-200 text-stone-900" : "bg-[#262626] border-[#3D4028]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: habit.color }} />
                    <span className={`font-bold text-xs ${isLight ? "text-stone-900" : "text-white"}`}>{habit.label}</span>
                  </div>
                  <span className={`text-xs font-mono font-bold ${isLight ? "text-stone-900" : "text-white"}`}>
                    {habit.ratePercent}% <span className={`font-normal text-[10px] ${isLight ? "text-stone-500" : "text-[#8C8C8C]"}`}>({habit.activeCount}/{habit.totalCount})</span>
                  </span>
                </div>

                <div className={`w-full h-2 rounded-full overflow-hidden ${isLight ? "bg-stone-200" : "bg-[#181818]"}`}>
                  <div 
                    className="h-full rounded-full transition-all" 
                    style={{ width: `${habit.ratePercent}%`, backgroundColor: habit.color }} 
                  />
                </div>

                {/* Causal Lift Deltas */}
                <div className={`grid grid-cols-2 gap-2 pt-1 border-t text-[11px] ${
                  isLight ? "border-stone-200" : "border-[#3D4028]/60"
                }`}>
                  <div className={`p-1.5 rounded flex items-center justify-between ${
                    isLight ? "bg-white border border-stone-200" : "bg-[#181818]"
                  }`}>
                    <span className={isLight ? "text-stone-500" : "text-[#8C8C8C]"}>Mood Lift:</span>
                    <span className={`font-bold font-mono ${habit.moodDelta > 0 ? "text-[#10b981]" : habit.moodDelta < 0 ? "text-[#AD3D30]" : isLight ? "text-stone-900" : "text-white"}`}>
                      {habit.moodDelta > 0 ? `+${habit.moodDelta}` : habit.moodDelta} pts
                    </span>
                  </div>
                  <div className={`p-1.5 rounded flex items-center justify-between ${
                    isLight ? "bg-white border border-stone-200" : "bg-[#181818]"
                  }`}>
                    <span className={isLight ? "text-stone-500" : "text-[#8C8C8C]"}>Energy Lift:</span>
                    <span className={`font-bold font-mono ${habit.energyDelta > 0 ? "text-[#0284c7]" : habit.energyDelta < 0 ? "text-[#AD3D30]" : isLight ? "text-stone-900" : "text-white"}`}>
                      {habit.energyDelta > 0 ? `+${habit.energyDelta}` : habit.energyDelta} pts
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 4. TAB: CHRONOBIOLOGY (DAY OF WEEK)                                */}
      {/* =================================================================== */}
      {activeTab === "chronobiology" && (
        <div 
          className={`p-4 sm:p-5 rounded-xl border space-y-4 transition-colors ${
            isLight ? "bg-white border-stone-200 text-stone-900 shadow-xs" : "bg-[#181818] border-[#3D4028]"
          }`}
          style={isLight ? { backgroundColor: "#ffffff" } : undefined}
        >
          <div className={`border-b pb-3 ${isLight ? "border-stone-200" : "border-[#3D4028]"}`}>
            <h3 className={`text-xs sm:text-sm font-bold flex items-center gap-2 ${
              isLight ? "text-stone-900" : "text-white"
            }`}>
              <Clock className="w-4 h-4 text-[#eab308]" />
              Day-of-Week Chronobiology & Energy Fluctuations
            </h3>
            <p className={`text-[11px] ${isLight ? "text-stone-500" : "text-[#8C8C8C]"}`}>
              Discover which days of the week consistently experience peak vitality or elevated somatic tension.
            </p>
          </div>

          <div className="w-full h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chronobiologyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isLight ? "#D6DAD0" : "#3D4028"} opacity={0.6} />
                <XAxis 
                  dataKey="day" 
                  tick={{ fill: isLight ? "#555A48" : "#8C8C8C", fontSize: 11 }}
                  axisLine={{ stroke: isLight ? "#D6DAD0" : "#3D4028" }}
                  tickLine={false}
                />
                <YAxis 
                  domain={[0, 10]} 
                  tick={{ fill: isLight ? "#555A48" : "#8C8C8C", fontSize: 11 }}
                  axisLine={{ stroke: isLight ? "#D6DAD0" : "#3D4028" }}
                  tickLine={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-[#262626] border border-[#3D4028] text-white p-2.5 rounded shadow-xl text-xs space-y-1 font-mono">
                          <p className="font-bold text-[#eab308]">{d.day} ({d.count} entries)</p>
                          <p className="text-[#38bdf8]">Avg Energy: {d.avgEnergy}/10</p>
                          <p className="text-[#A3A649]">Avg Mood: {d.avgMood}/10</p>
                          <p className="text-[#AD3D30]">Avg Tension: {d.avgTension}/10</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="avgEnergy" name="Avg Energy (1-10)" fill="#38bdf8" radius={[3, 3, 0, 0]} maxBarSize={32} />
                <Bar dataKey="avgMood" name="Avg Mood (1-10)" fill="#A3A649" radius={[3, 3, 0, 0]} maxBarSize={32} />
                <Bar dataKey="avgTension" name="Avg Tension (0-10)" fill="#AD3D30" radius={[3, 3, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Selected Entry Quick Preview / Drilldown Modal if clicked */}
      {selectedEntryPreview && (
        <div 
          className={`p-4 rounded-xl border space-y-3 transition-colors ${
            isLight ? "bg-white border-stone-200 text-stone-900 shadow-md" : "bg-[#262626] border-[#A3A649]"
          }`}
          style={isLight ? { backgroundColor: "#ffffff" } : undefined}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#A3A649]" />
              <span className={`font-bold text-xs ${isLight ? "text-stone-900" : "text-white"}`}>
                Parsed Entry: "{selectedEntryPreview.title}"
              </span>
              <span className={`text-[10px] ${isLight ? "text-stone-500" : "text-[#8C8C8C]"}`}>
                [{selectedEntryPreview.dateStr} - {selectedEntryPreview.dayOfWeek}]
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenInStudio(selectedEntryPreview.sourceEntry)}
                className="px-2.5 py-1 rounded bg-[#AD3D30] hover:bg-[#AD3D30]/80 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
              >
                <span>Open in Studio</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => setSelectedEntryPreview(null)}
                className={`px-2 py-0.5 cursor-pointer ${isLight ? "text-stone-400 hover:text-stone-700" : "text-[#8C8C8C] hover:text-white"}`}
              >
                ✕
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className={`p-2 rounded border ${isLight ? "bg-stone-50 border-stone-200" : "bg-[#181818] border-[#3D4028]"}`}>
              <span className={`text-[10px] ${isLight ? "text-stone-500" : "text-[#8C8C8C]"}`}>Mood Rating:</span>
              <p className={`font-bold ${isLight ? "text-[#737628]" : "text-[#A3A649]"}`}>{selectedEntryPreview.moodRating} / 10 ({selectedEntryPreview.moodLabel})</p>
            </div>
            <div className={`p-2 rounded border ${isLight ? "bg-stone-50 border-stone-200" : "bg-[#181818] border-[#3D4028]"}`}>
              <span className={`text-[10px] ${isLight ? "text-stone-500" : "text-[#8C8C8C]"}`}>Energy Level:</span>
              <p className={`font-bold ${isLight ? "text-[#0284c7]" : "text-[#38bdf8]"}`}>{selectedEntryPreview.energyLevel} / 10</p>
            </div>
            <div className={`p-2 rounded border ${isLight ? "bg-stone-50 border-stone-200" : "bg-[#181818] border-[#3D4028]"}`}>
              <span className={`text-[10px] ${isLight ? "text-stone-500" : "text-[#8C8C8C]"}`}>Restorative Sleep:</span>
              <p className="font-bold text-indigo-500">{selectedEntryPreview.sleepScore} / 7.0</p>
            </div>
            <div className={`p-2 rounded border ${isLight ? "bg-stone-50 border-stone-200" : "bg-[#181818] border-[#3D4028]"}`}>
              <span className={`text-[10px] ${isLight ? "text-stone-500" : "text-[#8C8C8C]"}`}>Somatic Tension:</span>
              <p className="font-bold text-[#AD3D30]">{selectedEntryPreview.somaticTension} / 10</p>
            </div>
          </div>

          {selectedEntryPreview.sourceEntry.content && (
            <div className={`p-3 rounded border text-[11px] line-clamp-3 leading-relaxed ${
              isLight ? "bg-stone-50 border-stone-200 text-stone-700" : "bg-[#181818] border-[#3D4028] text-[#e2e8f0]"
            }`}>
              "{selectedEntryPreview.sourceEntry.content}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};
