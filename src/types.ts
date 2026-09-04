/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type JournalMood = 
  | 'reflective'
  | 'grateful'
  | 'peaceful'
  | 'energized'
  | 'focused'
  | 'creative'
  | 'challenged'
  | 'thoughtful';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: number;
  modelUsed?: string;
}

export interface AISummary {
  summary: string;
  keyTakeaways: string[];
  reflectionQuestions: string[];
  moodAnalysis?: string;
  generatedAt: number;
  modelUsed?: string;
}

export interface EmpiricalHabits {
  exercised: boolean;
  mindfulnessMeditation: boolean;
  deepWorkSession: boolean;
  lateScreenTime: boolean;
  socialConnection: boolean;
  hadGoodDay: boolean;
}

export interface LaggedImpactPrediction {
  predictedNextDayEnergy: number; // 0 to 10 scale
  vulnerabilityAlert: string; // e.g. "Elevated evening tension (8/10) threatens sleep architecture"
  mitigatingMicroAction: string; // e.g. "Do 3 physiological sighs and step away from screens 45 min before sleep"
  laggedCorrelationFactor: number; // estimated Pearson r, e.g. -0.65
}

export interface EmpiricalTelemetry {
  // Numerical scales
  sleepScore: number; // 0 to 7 (0 = severe insomnia/exhausted, 7 = deep restorative sleep)
  energyLevel: number; // 0 to 10 (0 = depleted, 10 = vibrant)
  somaticTension: number; // 0 to 10 (0 = serene, 10 = acute somatic gripping)
  mentalClarity: number; // 0 to 10 (0 = brain fog, 10 = crisp focus)

  // Binary data flags
  binaryHabits: EmpiricalHabits;

  // Thematic coding
  thematicStressors: string[]; // e.g. ["workplace_boundary", "deadline_pressure", "sleep_debt"]
  cognitiveDisposition: 'growth_oriented' | 'ruminative' | 'resigned' | 'grounded_accepting';

  // Circadian Alignment (Variation C)
  circadianPhase: CircadianPhase;
  circadianAlignmentScore: number; // 0 to 100

  // Lagged Causality & Next-Day Prediction (Variation F)
  laggedImpactPrediction: LaggedImpactPrediction;

  extractedAt: number;
  extractedFromWordCount: number;
  confidenceScore: number; // 0 to 1
  modelUsed?: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  content: string;
  mood: JournalMood;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  aiSummary: AISummary | null;
  empiricalTelemetry?: EmpiricalTelemetry;
  isFavorite?: boolean;
  isPinned?: boolean;
  linkedResetSessionId?: string;
  linkedPrunedLoopIds?: string[];
  glimmersDiscovered?: string[];
  circadianPhase?: CircadianPhase;
  circadianCheckInId?: string;
  attachedHandwrittenImages?: string[];
}

export interface GeminiTelemetryRequest {
  title?: string;
  content: string;
  circadianPhase?: CircadianPhase;
  previousDayContext?: {
    sleepScore?: number;
    energyLevel?: number;
  };
}

export interface GeminiTelemetryResponse {
  telemetry: EmpiricalTelemetry;
  modelUsed: string;
}

export interface GeminiChatRequest {
  messages: {
    role: 'user' | 'model';
    content: string;
  }[];
  context?: string;
  mode?: 'reflect' | 'brainstorm' | 'mentor' | 'summarize';
}

export interface GeminiChatResponse {
  text: string;
  modelUsed: string;
}

export interface GeminiSummarizeRequest {
  title: string;
  content: string;
  conversationHistory?: {
    role: 'user' | 'model';
    content: string;
  }[];
}

export interface GeminiSummarizeResponse {
  summary: string;
  keyTakeaways: string[];
  reflectionQuestions: string[];
  moodAnalysis: string;
  suggestedTags: string[];
  modelUsed: string;
}

export type SomaticZone = 
  | 'head'
  | 'jaw'
  | 'shoulders'
  | 'chest'
  | 'gut'
  | 'hands';

export interface SomaticBodyMap {
  zones: SomaticZone[];
  intensity: number; // 1 to 5
  note?: string;
}

export interface CognitiveReframeOption {
  lens: 'compassion' | 'perspective' | 'agency';
  title: string;
  text: string;
  rationale: string;
}

export type ResetMode = 'mini' | 'full';

export interface ResetSession {
  id: string;
  userId: string;
  mode: ResetMode;
  bodyMap: SomaticBodyMap;
  affectLabel: string;
  writingContent: string;
  extractedDarkSentence: string;
  reframes: CognitiveReframeOption[];
  chosenReframeIndex: number | null;
  glimmer: string;
  beforeWord: string;
  afterWord: string;
  durationMs: number;
  createdAt: number;
  updatedAt: number;
  sourceEntryId?: string | null;
}

export interface GeminiReframeRequest {
  affectLabel: string;
  writingContent: string;
  bodyMapZones?: string[];
}

export interface GeminiReframeResponse {
  darkestSentence: string;
  reframes: CognitiveReframeOption[];
  glimmerCandidate: string;
  modelUsed: string;
}

export interface PrunedThoughtLoop {
  id: string;
  userId: string;
  oldDistortion: string;
  distortionCategory: 'catastrophizing' | 'black_and_white' | 'mind_reading' | 'should_statements' | 'personalization' | 'rumination';
  newRewiredBelief: string;
  dissolvedAt: number;
  sourceEntryId?: string | null;
}

export interface GlimmerAnchor {
  id: string;
  userId: string;
  text: string;
  category: 'sensory' | 'connection' | 'gratitude' | 'nature' | 'achievement' | 'serenity';
  createdAt: number;
  sourceType: 'manual' | 'mined_from_journal' | 'reset_room';
  isPinned?: boolean;
}

export interface NeuroplasticRewireStats {
  totalReframesCount: number;
  totalPrunedLoopsCount: number;
  totalGlimmersCount: number;
  totalResetSessionsCount: number;
  averageTensionDelta: number; // e.g., -2.4 points
  neuroplasticScore: number; // calculated index based on consistent reframing & pruning
  activeStreakDays: number;
}

export interface PruneLoopRequest {
  thoughtText: string;
  context?: string;
}

export interface PruneLoopResponse {
  identifiedDistortion: string;
  distortionCategory: string;
  rewiredBelief: string;
  neuroscienceRationale: string;
  modelUsed: string;
}

export interface ExtractGlimmersRequest {
  text: string;
}

export interface ExtractGlimmersResponse {
  glimmers: {
    text: string;
    category: string;
    neuroscienceAnchor: string;
  }[];
  modelUsed: string;
}

export type CircadianPhase = 
  | 'dawn_morning'      // 05:00 - 11:59 (Day Launch & Intentions)
  | 'midday'            // 12:00 - 16:59 (Midday Alignment & Reset)
  | 'dusk_evening'      // 17:00 - 21:59 (Day Release & Loop Closing)
  | 'night_harbor';     // 22:00 - 04:59 (Sleep Integration & Worry Deposit)

export type SleepQualityRating = 
  | 'deep_rest'         // Fully restored & energized
  | 'adequate'          // Solid & steady
  | 'light_broken'      // Light / slightly wired
  | 'restless'          // Broken / restless
  | 'exhausted';        // Low battery / depleted

export interface CircadianEntry {
  id: string;
  userId: string;
  phase: CircadianPhase;
  sleepQuality?: SleepQualityRating;
  energyLevel: number; // 1 to 5
  morningIntention?: string;
  anticipatedFriction?: string;
  groundingAnchor?: string;
  eveningGlimmers?: string[];
  untangledLoopsSummary?: string;
  loopClosedNotes?: string;
  linkedMorningEntryId?: string;
  isLoopClosed?: boolean;
  timestamp: number;
  dateKey: string; // e.g. "2026-09-02"
  journalEntryId?: string;
}

export interface GeminiCircadianRequest {
  phase: CircadianPhase;
  sleepQuality?: SleepQualityRating;
  energyLevel: number;
  morningIntention?: string;
  anticipatedFriction?: string;
  recentMorningIntention?: string;
  journalContent?: string;
}

export interface GeminiCircadianResponse {
  primePrompt: string;
  frictionAdvice: string;
  loopClosingQuestions?: string[];
  restorationAffirmation: string;
  suggestedTags: string[];
  modelUsed: string;
}

export interface PsychiatricCognitiveTrap {
  name: string; // e.g., "Catastrophizing", "Mind Reading", "Emotional Reasoning", "All-or-Nothing"
  quote: string; // Exact phrase or thought from the user's vent
  psychiatricReframe: string; // Grounded clinical reframe
}

export interface PsychiatricDistillation {
  id: string;
  userId: string;
  rawVentText: string;
  facts: string[]; // Objective reality ("What actually occurred")
  interpretations: string[]; // Emotional narrative ("What my fear told me")
  inMyControl: string[]; // Actions, boundaries, responses
  outOfMyControl: string[]; // Others' opinions, past events, outcomes
  distortions: PsychiatricCognitiveTrap[];
  microActionAnchor: string; // Single actionable behavioral step
  groundingSighCompleted: boolean;
  createdAt: number;
  journalEntryId?: string;
}

export interface GeminiPsychiatricDecenterRequest {
  rawVentText: string;
  entryTitle?: string;
}

export interface GeminiPsychiatricDecenterResponse {
  facts: string[];
  interpretations: string[];
  inMyControl: string[];
  outOfMyControl: string[];
  distortions: PsychiatricCognitiveTrap[];
  microActionAnchor: string;
  clinicalGroundingNote: string;
  modelUsed: string;
}

export interface GeminiLongitudinalSynthesisRequest {
  entries: {
    title: string;
    content: string;
    mood: string;
    tags: string[];
    createdAt: number;
    empiricalTelemetry?: any;
  }[];
}

export interface GeminiLongitudinalSynthesisResponse {
  resilienceTrajectory: string;
  dominantThemes: string[];
  unwoundCognitiveTraps: string[];
  somaticCorrelations: string;
  neuroplasticActionPlan: string[];
  longitudinalVitalityScore: number;
  modelUsed: string;
}

