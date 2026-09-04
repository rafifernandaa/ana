import { JournalEntry, JournalMood } from "../types";

export interface ParsedEntryMetrics {
  id: string;
  title: string;
  createdAt: number;
  dateStr: string;
  dayOfWeek: string;
  moodLabel: JournalMood;
  moodRating: number; // 1 - 10
  energyLevel: number; // 1 - 10
  sleepScore: number; // 0 - 7
  somaticTension: number; // 0 - 10
  mentalClarity: number; // 0 - 10
  wordCount: number;
  binaryHabits: {
    exercised: boolean;
    deepWork: boolean;
    mindfulness: boolean;
    social: boolean;
    hadGoodDay: boolean;
  };
  tags: string[];
  hasEmpiricalTelemetry: boolean;
  sourceEntry: JournalEntry;
}

const MOOD_RATING_MAP: Record<JournalMood, number> = {
  energized: 9.0,
  grateful: 8.5,
  peaceful: 8.0,
  creative: 8.0,
  focused: 7.5,
  reflective: 7.0,
  thoughtful: 6.5,
  challenged: 4.5,
};

/**
 * Extracts explicit numerical values from prose via regex or fallback heuristics.
 */
function extractNumberFromText(text: string, patterns: RegExp[]): number | null {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const parsed = parseFloat(match[1]);
      if (!isNaN(parsed)) {
        return parsed;
      }
    }
  }
  return null;
}

/**
 * Parses individual journal entry into standardized numerical telemetry.
 */
export function parseEntryNumericalData(entry: JournalEntry): ParsedEntryMetrics {
  const content = entry.content || "";
  const title = entry.title || "";
  const combinedText = `${title} ${content}`.toLowerCase();
  const tagsLower = entry.tags.map((t) => t.toLowerCase());

  // 1. Mood Rating (1 - 10)
  const explicitMood = extractNumberFromText(combinedText, [
    /mood[:\s]+([0-9]+(?:\.[0-9]+)?)(?:\s*\/\s*10)?/i,
    /feeling[:\s]+([0-9]+(?:\.[0-9]+)?)\/10/i,
  ]);
  const moodRating = explicitMood !== null 
    ? Math.min(10, Math.max(1, explicitMood))
    : (MOOD_RATING_MAP[entry.mood] || 7.0);

  // 2. Energy Level (1 - 10)
  let energyLevel = 6.5;
  if (entry.empiricalTelemetry?.energyLevel !== undefined) {
    energyLevel = entry.empiricalTelemetry.energyLevel;
  } else {
    const explicitEnergy = extractNumberFromText(combinedText, [
      /energy[:\s]+([0-9]+(?:\.[0-9]+)?)(?:\s*\/\s*10)?/i,
      /vitality[:\s]+([0-9]+(?:\.[0-9]+)?)/i,
    ]);
    if (explicitEnergy !== null) {
      energyLevel = Math.min(10, Math.max(1, explicitEnergy));
    } else {
      // Heuristic based on mood & circadian phase
      const base = entry.mood === "energized" ? 8.5 :
                   entry.mood === "focused" ? 7.5 :
                   entry.mood === "grateful" ? 7.0 :
                   entry.mood === "reflective" ? 6.0 :
                   entry.mood === "peaceful" ? 5.5 :
                   entry.mood === "challenged" ? 4.0 : 6.0;
      const phaseBonus = entry.circadianPhase === "midday" ? 0.5 :
                         entry.circadianPhase === "night_harbor" ? -0.5 : 0;
      energyLevel = Math.min(10, Math.max(1, base + phaseBonus));
    }
  }

  // 3. Sleep Score (0 - 7)
  let sleepScore = 5.2;
  if (entry.empiricalTelemetry?.sleepScore !== undefined) {
    sleepScore = entry.empiricalTelemetry.sleepScore;
  } else {
    const explicitSleep = extractNumberFromText(combinedText, [
      /sleep[:\s]+([0-9]+(?:\.[0-9]+)?)(?:\s*\/\s*7)?/i,
      /slept[:\s]+([0-9]+(?:\.[0-9]+)?)\s*hours?/i,
    ]);
    if (explicitSleep !== null) {
      // If entered as hours (e.g. 7.5 hrs), normalize to 0-7 scale
      sleepScore = Math.min(7, Math.max(0, explicitSleep > 7 ? explicitSleep * 0.75 : explicitSleep));
    }
  }

  // 4. Somatic Tension (0 - 10)
  let somaticTension = 3.5;
  if (entry.empiricalTelemetry?.somaticTension !== undefined) {
    somaticTension = entry.empiricalTelemetry.somaticTension;
  } else {
    const explicitTension = extractNumberFromText(combinedText, [
      /tension[:\s]+([0-9]+(?:\.[0-9]+)?)(?:\s*\/\s*10)?/i,
      /stress[:\s]+([0-9]+(?:\.[0-9]+)?)\/10/i,
    ]);
    if (explicitTension !== null) {
      somaticTension = Math.min(10, Math.max(0, explicitTension));
    } else {
      somaticTension = entry.mood === "challenged" ? 7.5 :
                       entry.mood === "peaceful" ? 2.0 :
                       entry.mood === "grateful" ? 2.5 : 4.0;
    }
  }

  // 5. Mental Clarity (0 - 10)
  let mentalClarity = 7.0;
  if (entry.empiricalTelemetry?.mentalClarity !== undefined) {
    mentalClarity = entry.empiricalTelemetry.mentalClarity;
  } else {
    const explicitClarity = extractNumberFromText(combinedText, [
      /clarity[:\s]+([0-9]+(?:\.[0-9]+)?)(?:\s*\/\s*10)?/i,
      /focus[:\s]+([0-9]+(?:\.[0-9]+)?)\/10/i,
    ]);
    if (explicitClarity !== null) {
      mentalClarity = Math.min(10, Math.max(0, explicitClarity));
    } else {
      mentalClarity = entry.mood === "focused" ? 8.5 :
                      entry.mood === "energized" ? 8.0 :
                      entry.mood === "challenged" ? 4.5 : 7.0;
    }
  }

  // 6. Binary Habit Parsing
  const binaryHabits = {
    exercised: entry.empiricalTelemetry?.binaryHabits?.exercised ?? (
      tagsLower.some((t) => /exercise|workout|gym|run|walk|yoga|cardio|fitness/.test(t)) ||
      /exercise|worked out|gym|ran|running|walked|yoga|pushup|workout/.test(combinedText)
    ),
    deepWork: entry.empiricalTelemetry?.binaryHabits?.deepWorkSession ?? (
      tagsLower.some((t) => /deepwork|focus|code|study|writing|deliverable/.test(t)) ||
      /deep work|flow state|uninterrupted|coded|study session|focused block/.test(combinedText)
    ),
    mindfulness: entry.empiricalTelemetry?.binaryHabits?.mindfulnessMeditation ?? (
      tagsLower.some((t) => /meditat|mindful|breath|calm|zen|stillness/.test(t)) ||
      /meditat|breathwork|mindful|diaphragm|box breathing|stillness|reset room/.test(combinedText)
    ),
    social: entry.empiricalTelemetry?.binaryHabits?.socialConnection ?? (
      tagsLower.some((t) => /social|friend|family|community|mentor|team/.test(t)) ||
      /talked with|met with|friend|family|dinner|conversation|connected with/.test(combinedText)
    ),
    hadGoodDay: entry.empiricalTelemetry?.binaryHabits?.hadGoodDay ?? (
      ["grateful", "peaceful", "energized", "focused"].includes(entry.mood) ||
      /good day|great day|solid day|productive day|fulfilling/.test(combinedText)
    ),
  };

  const words = content.trim() ? content.trim().split(/\s+/).filter(Boolean).length : 0;
  const d = new Date(entry.createdAt);
  const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const dayOfWeek = d.toLocaleDateString("en-US", { weekday: "short" });

  return {
    id: entry.id,
    title: entry.title || "Untitled",
    createdAt: entry.createdAt,
    dateStr,
    dayOfWeek,
    moodLabel: entry.mood,
    moodRating: +moodRating.toFixed(1),
    energyLevel: +energyLevel.toFixed(1),
    sleepScore: +sleepScore.toFixed(1),
    somaticTension: +somaticTension.toFixed(1),
    mentalClarity: +mentalClarity.toFixed(1),
    wordCount: words,
    binaryHabits,
    tags: entry.tags,
    hasEmpiricalTelemetry: !!entry.empiricalTelemetry,
    sourceEntry: entry,
  };
}

/**
 * Calculates Pearson Correlation Coefficient (r) between two numeric arrays.
 */
export function calculatePearsonCorrelation(xs: number[], ys: number[]): { r: number; label: string; strength: "strong_pos" | "mod_pos" | "weak" | "mod_neg" | "strong_neg" } {
  const n = Math.min(xs.length, ys.length);
  if (n < 2) {
    return { r: 0, label: "Insufficient data", strength: "weak" };
  }

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
  if (den === 0) {
    return { r: 0, label: "Neutral (0.00)", strength: "weak" };
  }

  const r = +(num / den).toFixed(2);
  if (r >= 0.6) return { r, label: "Strong Positive", strength: "strong_pos" };
  if (r >= 0.25) return { r, label: "Moderate Positive", strength: "mod_pos" };
  if (r <= -0.6) return { r, label: "Strong Inverse", strength: "strong_neg" };
  if (r <= -0.25) return { r, label: "Moderate Inverse", strength: "mod_neg" };
  return { r, label: "Weak / Neutral", strength: "weak" };
}

/**
 * Computes habit lift (average mood/energy difference when habit is active vs inactive).
 */
export function computeHabitLift(metrics: ParsedEntryMetrics[], habitKey: keyof ParsedEntryMetrics["binaryHabits"]) {
  const withHabit = metrics.filter((m) => m.binaryHabits[habitKey]);
  const withoutHabit = metrics.filter((m) => !m.binaryHabits[habitKey]);

  const avgMoodWith = withHabit.length > 0 ? withHabit.reduce((s, m) => s + m.moodRating, 0) / withHabit.length : 0;
  const avgMoodWithout = withoutHabit.length > 0 ? withoutHabit.reduce((s, m) => s + m.moodRating, 0) / withoutHabit.length : 0;
  const avgEnergyWith = withHabit.length > 0 ? withHabit.reduce((s, m) => s + m.energyLevel, 0) / withHabit.length : 0;
  const avgEnergyWithout = withoutHabit.length > 0 ? withoutHabit.reduce((s, m) => s + m.energyLevel, 0) / withoutHabit.length : 0;

  return {
    activeCount: withHabit.length,
    totalCount: metrics.length,
    ratePercent: metrics.length > 0 ? Math.round((withHabit.length / metrics.length) * 100) : 0,
    moodDelta: +(avgMoodWith - avgMoodWithout).toFixed(1),
    energyDelta: +(avgEnergyWith - avgEnergyWithout).toFixed(1),
  };
}
