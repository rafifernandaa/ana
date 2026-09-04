import { 
  GeminiChatRequest, 
  GeminiChatResponse, 
  GeminiSummarizeRequest, 
  GeminiSummarizeResponse,
  GeminiReframeRequest,
  GeminiReframeResponse,
  PruneLoopRequest,
  PruneLoopResponse,
  ExtractGlimmersRequest,
  ExtractGlimmersResponse,
  GeminiCircadianRequest,
  GeminiCircadianResponse,
  GeminiPsychiatricDecenterRequest,
  GeminiPsychiatricDecenterResponse,
  GeminiTelemetryRequest,
  GeminiTelemetryResponse,
  GeminiLongitudinalSynthesisRequest,
  GeminiLongitudinalSynthesisResponse,
  GeminiNarrativeDecenterRequest,
  GeminiNarrativeDecenterResponse
} from "../types";

/**
 * Calls backend server endpoint for multi-turn conversational reflection with Gemini
 */
export async function sendChatMessageToGemini(request: GeminiChatRequest): Promise<GeminiChatResponse> {
  const response = await fetch("/api/gemini/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Server responded with status ${response.status}`);
  }

  return await response.json();
}

/**
 * Calls backend server endpoint for structured AI summarization and insights
 */
export async function generateEntrySummaryWithGemini(request: GeminiSummarizeRequest): Promise<GeminiSummarizeResponse> {
  const response = await fetch("/api/gemini/summarize", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Server responded with status ${response.status}`);
  }

  return await response.json();
}

/**
 * Calls backend server endpoint for Reset Room cognitive reframing & glimmer extraction
 */
export async function extractReframeAndGlimmerWithGemini(request: GeminiReframeRequest): Promise<GeminiReframeResponse> {
  const response = await fetch("/api/gemini/reframe", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Server responded with status ${response.status}`);
  }

  return await response.json();
}

/**
 * Calls backend server endpoint for Synaptic Pruning analysis & rewired beliefs
 */
export async function pruneThoughtLoopWithGemini(request: PruneLoopRequest): Promise<PruneLoopResponse> {
  const response = await fetch("/api/gemini/prune-loop", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Server responded with status ${response.status}`);
  }

  return await response.json();
}

/**
 * Calls backend server endpoint for mining polyvagal glimmers from journal content
 */
export async function extractGlimmersWithGemini(request: ExtractGlimmersRequest): Promise<ExtractGlimmersResponse> {
  const response = await fetch("/api/gemini/extract-glimmers", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Server responded with status ${response.status}`);
  }

  return await response.json();
}

/**
 * Calls backend server endpoint for Circadian day-boundary guidance & loop closing
 */
export async function getCircadianCoachWithGemini(request: GeminiCircadianRequest): Promise<GeminiCircadianResponse> {
  const response = await fetch("/api/gemini/circadian-coach", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Server responded with status ${response.status}`);
  }

  return await response.json();
}

/**
 * Calls backend server endpoint to decenter and process emotional venting into structured cognitive clarity
 */
export async function decenterPsychiatricVentWithGemini(
  request: GeminiPsychiatricDecenterRequest
): Promise<GeminiPsychiatricDecenterResponse> {
  const response = await fetch("/api/gemini/psychiatric-decenter", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Server responded with status ${response.status}`);
  }

  return await response.json();
}

/**
 * Calls backend server endpoint for Empirical Telemetry & Statistical Quantifier
 * (Variations A + C + F: Quantified feelings 0-7/0-10, binary habits, thematic stressors, circadian alignment, lagged prediction)
 */
export async function extractEmpiricalTelemetryFromGemini(
  request: GeminiTelemetryRequest
): Promise<GeminiTelemetryResponse> {
  const response = await fetch("/api/gemini/extract-telemetry", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Server responded with status ${response.status}`);
  }

  return await response.json();
}

/**
 * Calls backend server endpoint for Longitudinal AI Neuroplastic Synthesis
 */
export async function generateLongitudinalSynthesisWithGemini(
  request: GeminiLongitudinalSynthesisRequest
): Promise<GeminiLongitudinalSynthesisResponse> {
  const response = await fetch("/api/gemini/longitudinal-synthesis", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Server responded with status ${response.status}`);
  }

  return await response.json();
}

/**
 * Calls backend server endpoint to gently shift raw thoughts into third-person perspective & causal clarity
 * Implicitly inspired by self-distancing research. Does NOT diagnose.
 */
export async function decenterNarrativeStreamWithGemini(
  request: GeminiNarrativeDecenterRequest
): Promise<GeminiNarrativeDecenterResponse> {
  const response = await fetch("/api/gemini/narrative-decenter", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Server responded with status ${response.status}`);
  }

  return await response.json();
}



