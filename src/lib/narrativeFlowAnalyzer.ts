/**
 * Narrative Flow Analyzer
 * 
 * An implicit, non-clinical psycholinguistic engine inspired by narrative psychology
 * and expressive writing research (cognitive reorganization, inhibition reduction,
 * and linguistic shift from self-rumination to causal integration and perspective).
 * 
 * Note: This module does NOT perform any psychological or psychiatric diagnosis.
 * It strictly tracks narrative progression and provides gentle, curiosity-driven prompts.
 */

export type NarrativeStage = "release" | "causal" | "horizon";

export interface NarrativeFlowMetrics {
  totalWords: number;
  selfFocusCount: number;
  selfFocusRatio: number; // percentage of words that are self-referential (I, me, my)
  causalCount: number;
  causalWordsFound: string[];
  perspectiveCount: number;
  currentStage: NarrativeStage;
  stageProgress: number; // 0 to 100
  stageLabel: string;
  stageDescription: string;
  suggestedPrompt: string | null;
}

// Self-referential pronouns (markers of immersion / raw emotional release)
const SELF_PRONOUNS_REGEX = /\b(i|me|my|myself|mine)\b/gi;

// Cognitive structuring and causal transition words (markers of sense-making & working memory reorganization)
const CAUSAL_WORDS = [
  "because",
  "realize",
  "realized",
  "realizing",
  "understand",
  "understood",
  "understanding",
  "reason",
  "reasons",
  "meaning",
  "learned",
  "learning",
  "noticed",
  "noticing",
  "caused",
  "causing",
  "causes",
  "reflect",
  "reflecting",
  "reflected",
  "clarity",
  "why",
  "therefore",
  "since",
  "conclude",
  "concluded",
  "insight",
  "pattern",
  "patterns"
];

// Words indicating outward perspective, collective grounding, or decentering
const PERSPECTIVE_WORDS_REGEX = /\b(we|us|our|ours|they|them|their|theirs|people|someone|world|horizon|others|life|context|perspective|observer|future|body)\b/gi;

/**
 * Analyzes journal text in real-time on the client with zero latency.
 */
export function analyzeNarrativeFlow(text: string): NarrativeFlowMetrics {
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      totalWords: 0,
      selfFocusCount: 0,
      selfFocusRatio: 0,
      causalCount: 0,
      causalWordsFound: [],
      perspectiveCount: 0,
      currentStage: "release",
      stageProgress: 0,
      stageLabel: "1. Unfiltered Release",
      stageDescription: "Empty your mental buffer. Write raw thoughts without filtering.",
      suggestedPrompt: null,
    };
  }

  // Tokenize words
  const words = trimmed.match(/\b[\w'-]+\b/g) || [];
  const totalWords = words.length;

  // 1. Count self-focus tokens
  const selfMatches = trimmed.match(SELF_PRONOUNS_REGEX) || [];
  const selfFocusCount = selfMatches.length;
  const selfFocusRatio = totalWords > 0 ? (selfFocusCount / totalWords) * 100 : 0;

  // 2. Count cognitive/causal words
  const lowerText = trimmed.toLowerCase();
  const causalFound: string[] = [];
  let causalCount = 0;

  for (const cw of CAUSAL_WORDS) {
    const regex = new RegExp(`\\b${cw}\\b`, "gi");
    const matches = lowerText.match(regex);
    if (matches && matches.length > 0) {
      causalCount += matches.length;
      if (!causalFound.includes(cw)) {
        causalFound.push(cw);
      }
    }
  }

  // 3. Count perspective markers
  const perspectiveMatches = trimmed.match(PERSPECTIVE_WORDS_REGEX) || [];
  const perspectiveCount = perspectiveMatches.length;

  // Determine Narrative Stage based on word count, causal bridges, and perspective
  let currentStage: NarrativeStage = "release";
  let stageProgress = 0;
  let stageLabel = "1. Unfiltered Release";
  let stageDescription = "Pouring out raw thoughts. Release tension without judging grammar or structure.";
  let suggestedPrompt: string | null = null;

  if (totalWords < 40) {
    currentStage = "release";
    stageProgress = Math.min(30, Math.round((totalWords / 40) * 30));
    stageLabel = "1. Unfiltered Release";
    stageDescription = "Letting the mind dump open loops. No self-editing needed.";
    if (totalWords < 15) {
      suggestedPrompt = "What is the loudest unresolved thought in your mind right now?";
    }
  } else if (causalCount < 2 && totalWords < 120) {
    // Has written a good brain dump, but hasn't yet connected causes
    currentStage = "release";
    stageProgress = Math.min(50, 30 + Math.round((totalWords / 120) * 20));
    stageLabel = "1. Unfiltered Stream";
    stageDescription = "Healthy brain dump active. When you are ready, bridge toward what caused these feelings.";
    suggestedPrompt = "What do you think is the underlying reason behind this feeling?";
  } else if (causalCount >= 2 && perspectiveCount < 2) {
    // Transitioned into causal structuring
    currentStage = "causal";
    stageProgress = Math.min(80, 50 + causalCount * 8);
    stageLabel = "2. Causal Clarity";
    stageDescription = "Cognitive organization in progress. Connecting causes, patterns, and realizations.";
    suggestedPrompt = "Because this happened, what do you now realize or understand about yourself?";
  } else if (causalCount >= 2 && perspectiveCount >= 2 && totalWords >= 80) {
    // Reached wider perspective and psychological distance
    currentStage = "horizon";
    stageProgress = Math.min(100, 80 + Math.min(20, perspectiveCount * 5));
    stageLabel = "3. Perspective Horizon";
    stageDescription = "Perspective widening. Gaining distance, self-compassion, and grounded altitude.";
    suggestedPrompt = "Looking at this from a wider horizon, what is one grounded step you can take?";
  } else {
    // Default fallback based on causal count
    if (causalCount >= 1) {
      currentStage = "causal";
      stageProgress = 60;
      stageLabel = "2. Causal Clarity";
      stageDescription = "Connecting thoughts into meaningful causes and realizations.";
      suggestedPrompt = "What pattern or realization is beginning to take shape here?";
    } else {
      currentStage = "release";
      stageProgress = 40;
      stageLabel = "1. Unfiltered Stream";
      stageDescription = "Deepening the initial brain dump. Express what is unsaid.";
      suggestedPrompt = "If there were no expectations on you, what truth would you admit here?";
    }
  }

  return {
    totalWords,
    selfFocusCount,
    selfFocusRatio: Math.round(selfFocusRatio * 10) / 10,
    causalCount,
    causalWordsFound: causalFound,
    perspectiveCount,
    currentStage,
    stageProgress,
    stageLabel,
    stageDescription,
    suggestedPrompt,
  };
}

/**
 * 3 Fast, Low-Friction Brain Dump Starters for beginners facing a blank page.
 */
export const BRAIN_DUMP_STARTERS = [
  {
    label: "Somatic State",
    text: "Right now, the physical tension in my body is located around my ",
    description: "Anchor in your body first before thinking",
  },
  {
    label: "Mental Open Loop",
    text: "The situation I keep replaying in my head is ",
    description: "Externalize what your working memory is holding",
  },
  {
    label: "Unfiltered Truth",
    text: "If I didn't care about sounding rational, I would admit that ",
    description: "Drop the barrier of inhibition and self-censorship",
  },
];
