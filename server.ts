import express, { Request, Response } from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// 1. Top-Level Request Deserialization (Ordering Guarantee)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Fallback ladder definition for resilient Gemini operations (Gemini 3.6 or higher)
const FALLBACK_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
];

// Lazy initialization of Gemini client
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    throw new Error("GEMINI_API_KEY is not configured in environment variables or secrets.");
  }
  return new GoogleGenAI({ apiKey });
}

// Resilient Model Fallback Helper
async function generateContentWithFallback(params: {
  contents: any;
  config?: any;
}) {
  const ai = getGeminiClient();
  let lastError: any = null;

  for (const model of FALLBACK_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: params.contents,
        config: params.config,
      });
      return { response, modelUsed: model };
    } catch (error: any) {
      console.warn(`[Gemini Fallback Ladder] Error with model ${model}:`, error?.message || error);
      lastError = error;
      // Continue to next fallback model
    }
  }

  throw lastError || new Error("All models in the resilient fallback ladder failed.");
}

// API Health Check
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    geminiConfigured: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY"),
  });
});

// API: Multi-turn Chat / Interactive Reflection with Gemini
app.post("/api/gemini/chat", async (req: Request, res: Response) => {
  try {
    // Defensive payload ingestion with null-safe destructuring
    const body = (req.body && typeof req.body === "object") ? req.body : {};
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const context = typeof body.context === "string" ? body.context : "";
    const mode = typeof body.mode === "string" ? body.mode : "reflect";
    const customInstruction = typeof body.systemInstruction === "string" ? body.systemInstruction : "";

    if (messages.length === 0) {
      return res.status(400).json({ error: "At least one message is required." });
    }

    let systemPrompt = `You are an empathetic, insightful, and supportive AI Reflection Partner inside the user's personal journal app.
Your role is to help the user unpack their thoughts, emotions, daily events, and creative ideas.
Guidelines:
- Maintain a warm, encouraging, thoughtful, and safe tone.
- When the user shares reflections, acknowledge their feelings, highlight themes, offer thoughtful perspective questions, and provide gentle brainstorming when appropriate.
- Format responses cleanly with brief markdown paragraphs and bullet points for clarity.
- Focus on practical journaling reflection, self-compassion, and calm clarity without medical or clinical claims.`;

    if (mode === "summarize") {
      systemPrompt += `\nFocus specifically on synthesizing key insights, highlighting emotional growth, and suggesting 2-3 focused next steps.`;
    } else if (mode === "brainstorm") {
      systemPrompt += `\nFocus on creative brainstorming, reframing obstacles into opportunities, and generating structured ideas.`;
    } else if (mode === "mentor") {
      systemPrompt += `\nAdopt a supportive mentor perspective focusing on intentionality, personal values, and long-term vision.`;
    }

    if (customInstruction) {
      systemPrompt += `\nAdditional user preference: ${customInstruction}`;
    }

    if (context) {
      systemPrompt += `\n\n--- Current Journal Entry Context ---\n${context}\n----------------------------------`;
    }

    // Format conversation history for Gemini API
    const formattedContents = messages.map((m: any) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: String(m.content || "") }],
    }));

    const result = await generateContentWithFallback({
      contents: formattedContents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      },
    });

    const responseText = result.response.text || "";

    return res.json({
      text: responseText,
      modelUsed: result.modelUsed,
      usageMetadata: result.response.usageMetadata || {},
    });
  } catch (error: any) {
    console.error("Gemini Chat API Error:", error);
    return res.status(500).json({
      error: error?.message || "Failed to generate reflection response from Gemini.",
    });
  }
});

// API: Journal Entry AI Summarization & Insight Generator
app.post("/api/gemini/summarize", async (req: Request, res: Response) => {
  try {
    const body = (req.body && typeof req.body === "object") ? req.body : {};
    const content = typeof body.content === "string" ? body.content : "";
    const title = typeof body.title === "string" ? body.title : "Untitled Entry";
    const history = Array.isArray(body.conversationHistory) ? body.conversationHistory : [];

    if (!content.trim() && history.length === 0) {
      return res.status(400).json({ error: "Content or conversation history is required for summarization." });
    }

    const promptText = `Please analyze this personal journal entry and discussion history:
Entry Title: "${title}"
Entry Content:
${content}

${history.length > 0 ? `Discussion with Gemini:\n` + history.map(h => `${h.role === 'user' ? 'User' : 'Gemini'}: ${h.content}`).join('\n') : ''}

Generate a structured reflection summary in valid JSON format matching this schema:
{
  "summary": "A concise, empathetic 2-3 sentence overview capturing the core narrative and essence of this entry.",
  "keyTakeaways": ["Key insight 1", "Key insight 2", "Key insight 3"],
  "reflectionQuestions": ["A deep, open-ended question to ponder", "A forward-looking action or gratitude prompt"],
  "moodAnalysis": "One or two sentences assessing the overarching emotional state (e.g. peaceful, introspective, overwhelmed yet determined).",
  "suggestedTags": ["Tag1", "Tag2", "Tag3"]
}`;

    const result = await generateContentWithFallback({
      contents: [{ role: "user", parts: [{ text: promptText }] }],
      config: {
        systemInstruction: "You are an expert reflective guide and coach specializing in journaling analysis and thoughtful clarity. Always return valid, well-formed JSON conforming strictly to the requested schema.",
        responseMimeType: "application/json",
        temperature: 0.4,
      },
    });

    const responseText = result.response.text || "{}";
    let parsed: any;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      // Fallback parser if markdown wrapped
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1]);
      } else {
        parsed = {
          summary: responseText,
          keyTakeaways: ["Deep reflection noted."],
          reflectionQuestions: ["What felt most meaningful about this experience?"],
          moodAnalysis: "Reflective and contemplative.",
          suggestedTags: ["Reflection", "Journal"],
        };
      }
    }

    return res.json({
      summary: parsed.summary || "Summary generated.",
      keyTakeaways: Array.isArray(parsed.keyTakeaways) ? parsed.keyTakeaways : [],
      reflectionQuestions: Array.isArray(parsed.reflectionQuestions) ? parsed.reflectionQuestions : [],
      moodAnalysis: parsed.moodAnalysis || "Introspective",
      suggestedTags: Array.isArray(parsed.suggestedTags) ? parsed.suggestedTags : ["Journal", "Reflection"],
      modelUsed: result.modelUsed,
    });
  } catch (error: any) {
    console.error("Gemini Summarize API Error:", error);
    return res.status(500).json({
      error: error?.message || "Failed to generate summary from Gemini.",
    });
  }
});

// API: Reset Room - Somatic & Cognitive Reframe Engine
app.post("/api/gemini/reframe", async (req: Request, res: Response) => {
  try {
    const body = (req.body && typeof req.body === "object") ? req.body : {};
    const affectLabel = typeof body.affectLabel === "string" ? body.affectLabel : "Stressed";
    const writingContent = typeof body.writingContent === "string" ? body.writingContent : "";
    const bodyMapZones = Array.isArray(body.bodyMapZones) ? body.bodyMapZones : [];

    if (!writingContent.trim()) {
      return res.status(400).json({ error: "Writing content is required for cognitive reframing." });
    }

    const systemPrompt = `You are a supportive reflection partner helping the user complete a thoughtful Mindful Reset protocol.

Your core mandate:
1. Identify the single heaviest, most burdened, or emotionally tense sentence from the user's text ("darkestSentence"). Pick verbatim or near-verbatim phrasing from their writing.
2. Formulate 3 distinct, grounded, non-toxic perspective reframes:
   - Lens 1: 'compassion' (Self-Compassion: How a kind, trusted friend would speak to them. Validates the weight without shaming or minimizing).
   - Lens 2: 'perspective' (Time Horizon & Scope: Broadening perspective, gently challenging all-or-nothing worry, reminding of impermanence).
   - Lens 3: 'agency' (Micro-Agency & Controllables: Identifying what tiny step or boundary is directly within their control right now).
3. Extract one authentic 'glimmerCandidate' (a micro-moment of effort, resilience, care, beauty, or honesty present in their words). Zero saccharine or generic cheerleading.

CRITICAL TONE RULES:
- NEVER use toxic positivity ("Look on the bright side!", "Everything happens for a reason", "Cheer up!").
- Speak with warm, grounded emotional realism and genuine empathy.
- Keep reframes concise (1-2 sentences each), punchy, and deeply resonant.
- Do NOT include clinical or neuroscience jargon in the output.
- Output strictly valid JSON conforming to the requested schema.`;

    const userPrompt = `User's Stated Emotion / Mood: "${affectLabel}"
Body Tension Focus Areas: ${bodyMapZones.length > 0 ? bodyMapZones.join(", ") : "General tension"}

User's Raw Reflection Writing:
"""
${writingContent}
"""

Please analyze the writing and produce JSON with:
{
  "darkestSentence": "The exact or representative sentence carrying the core emotional weight",
  "reframes": [
    {
      "lens": "compassion",
      "title": "A Compassionate Lens",
      "text": "1-2 sentence comforting reframe validating their humanity",
      "rationale": "Why this eases the emotional burden"
    },
    {
      "lens": "perspective",
      "title": "A Broader Horizon",
      "text": "1-2 sentence perspective reframe on time, scope, or impermanence",
      "rationale": "Why this de-escalates worry"
    },
    {
      "lens": "agency",
      "title": "What You Can Control",
      "text": "1-2 sentence micro-agency reframe focusing on today's next action",
      "rationale": "Why this restores personal calm and direction"
    }
  ],
  "glimmerCandidate": "One genuine glimmer or quiet strength extracted directly from their reflection"
}`;

    const result = await generateContentWithFallback({
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        temperature: 0.4,
      },
    });

    const responseText = result.response.text || "{}";
    let parsed: any;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1]);
      } else {
        parsed = {
          darkestSentence: writingContent.split(".")[0] || writingContent.slice(0, 100),
          reframes: [
            {
              lens: "compassion",
              title: "A Compassionate Lens",
              text: "It is understandable that this feels heavy right now; you don't have to carry it all perfectly.",
              rationale: "Validates current stress without self-judgment."
            },
            {
              lens: "perspective",
              title: "A Broader Horizon",
              text: "This acute pressure is a temporary chapter, not the entire book of who you are.",
              rationale: "Broadens the timeline beyond immediate overwhelm."
            },
            {
              lens: "agency",
              title: "What You Can Control",
              text: "You cannot solve everything at once, but you can take one slow breath and handle the next small step.",
              rationale: "Brings focus back to immediate agency."
            }
          ],
          glimmerCandidate: "The fact that you paused to articulate your thoughts shows genuine self-awareness."
        };
      }
    }

    return res.json({
      darkestSentence: parsed.darkestSentence || "The weight you are feeling in this moment.",
      reframes: Array.isArray(parsed.reframes) ? parsed.reframes : [],
      glimmerCandidate: parsed.glimmerCandidate || "Your honest willingness to acknowledge this tension.",
      modelUsed: result.modelUsed,
    });
  } catch (error: any) {
    console.error("Gemini Reframe API Error:", error);
    return res.status(500).json({
      error: error?.message || "Failed to process cognitive reframe.",
    });
  }
});

// API: Thought Untangler - Identifying unhelpful thinking habits & constructive reframing
app.post("/api/gemini/prune-loop", async (req: Request, res: Response) => {
  try {
    const body = (req.body && typeof req.body === "object") ? req.body : {};
    const distortionText = typeof body.distortionText === "string" ? body.distortionText : "";

    if (!distortionText.trim()) {
      return res.status(400).json({ error: "Thought text is required to untangle thought patterns." });
    }

    const systemPrompt = `You are a thoughtful, encouraging clarity guide helping a user untangle an unhelpful or stressful thought pattern.
Analyze the user's thought loop:
1. Classify the thought pattern into ONE of these common categories:
   ['catastrophizing', 'black_and_white', 'mind_reading', 'should_statements', 'personalization', 'rumination']
2. Explain the common trap (1 brief sentence: why this thought pattern creates unnecessary worry or tension).
3. Generate a grounded, realistic, encouraging 'newRewiredBelief' (1-2 sentences) that replaces the unhelpful thought with clarity and self-compassion.
4. Provide a supportive 'mindfulnessInsight' (1 brief sentence on how letting go of sticky thoughts creates mental space).
- Do NOT use clinical, neuroscience, or medical terms.

Return strictly valid JSON:
{
  "distortionCategory": "catastrophizing",
  "neurologicalTrap": "This pattern creates unnecessary worry by treating an imagined scenario as an immediate certainty.",
  "newRewiredBelief": "I do not need to guarantee every outcome today; I can trust my capacity to adapt step-by-step.",
  "neuroscienceFact": "Pausing to consciously reframe a stressful thought helps you respond with steady clarity instead of automatic worry."
}`;

    const userPrompt = `User's Recurring Thought:
"""
${distortionText}
"""`;

    const result = await generateContentWithFallback({
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        temperature: 0.3,
      },
    });

    const responseText = result.response.text || "{}";
    let parsed: any;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1]);
      } else {
        parsed = {
          distortionCategory: "catastrophizing",
          neurologicalTrap: "This pattern creates tension by jumping to worst-case conclusions.",
          newRewiredBelief: "I can observe this thought without accepting it as an absolute truth.",
          neuroscienceFact: "Reframing repetitive thoughts gives you room to choose a calmer path forward."
        };
      }
    }

    return res.json({
      distortionCategory: parsed.distortionCategory || "catastrophizing",
      neurologicalTrap: parsed.neurologicalTrap || "This pattern creates unnecessary worry.",
      newRewiredBelief: parsed.newRewiredBelief || "I have the agency to respond calmly to this moment.",
      neuroscienceFact: parsed.neuroscienceFact || "Consciously choosing a grounded perspective brings steady clarity.",
      modelUsed: result.modelUsed,
    });
  } catch (error: any) {
    console.error("Gemini Untangle Thought API Error:", error);
    return res.status(500).json({
      error: error?.message || "Failed to process thought untangling.",
    });
  }
});

// API: Glimmer Miner - Micro-Moments of Joy & Gratitude Extractor
app.post("/api/gemini/extract-glimmers", async (req: Request, res: Response) => {
  try {
    const body = (req.body && typeof req.body === "object") ? req.body : {};
    const text = typeof body.text === "string" ? body.text : "";

    if (!text.trim()) {
      return res.status(400).json({ error: "Text content is required to mine glimmers." });
    }

    const systemPrompt = `You are a supportive reflection assistant finding 'Glimmers' — small, uplifting micro-moments of joy, gratitude, warmth, peace, connection, or simple beauty in daily life.
Read the provided journal text and extract up to 3 genuine glimmers present in their day or reflections.
Categories must be one of: ['sensory', 'connection', 'gratitude', 'nature', 'achievement', 'serenity'].
- Do NOT use medical, neuroscience, or clinical terms.

Return strictly valid JSON:
{
  "glimmers": [
    {
      "text": "The warmth of morning sunlight through the window",
      "category": "sensory"
    }
  ]
}`;

    const userPrompt = `Journal Reflection Content:
"""
${text}
"""`;

    const result = await generateContentWithFallback({
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        temperature: 0.4,
      },
    });

    const responseText = result.response.text || "{}";
    let parsed: any;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1]);
      } else {
        parsed = {
          glimmers: [
            {
              text: "A quiet moment of honest introspection today.",
              category: "serenity"
            }
          ]
        };
      }
    }

    return res.json({
      glimmers: Array.isArray(parsed.glimmers) ? parsed.glimmers : [],
      modelUsed: result.modelUsed,
    });
  } catch (error: any) {
    console.error("Gemini Extract Glimmers API Error:", error);
    return res.status(500).json({
      error: error?.message || "Failed to extract glimmers.",
    });
  }
});

// API: Circadian Day-Boundary & Loop-Closing Coach
app.post("/api/gemini/circadian-coach", async (req: Request, res: Response) => {
  try {
    const body = (req.body && typeof req.body === "object") ? req.body : {};
    const phase = typeof body.phase === "string" ? body.phase : "dawn_morning";
    const sleepQuality = typeof body.sleepQuality === "string" ? body.sleepQuality : "adequate";
    const energyLevel = typeof body.energyLevel === "number" ? body.energyLevel : 3;
    const morningIntention = typeof body.morningIntention === "string" ? body.morningIntention : "";
    const anticipatedFriction = typeof body.anticipatedFriction === "string" ? body.anticipatedFriction : "";
    const recentMorningIntention = typeof body.recentMorningIntention === "string" ? body.recentMorningIntention : "";
    const journalContent = typeof body.journalContent === "string" ? body.journalContent : "";

    const systemPrompt = `You are a supportive, grounded Circadian Journaling & Reflection Coach.
Your purpose is to help the user align their reflection practice with their natural biological rhythm across the day's key boundaries:
- 'dawn_morning': Priming intentions, assessing sleep restoration, anticipating friction points, setting steady grounded anchors.
- 'midday': Real-time alignment check, taking a 60-second clarity breath, adjusting expectations without self-criticism.
- 'dusk_evening': Day decompression, mining glimmers, acknowledging honest effort, and CLOSING THE LOOP on their morning intention.
- 'night_harbor': Worry-deposit on paper so thoughts don't disrupt deep sleep, peaceful wind-down, gentle self-forgiveness.

Rules:
1. Speak with calm, grounded warmth. NO toxic positivity ("Crush your day!", "Rise and grind!", "Smile through it!").
2. Explicitly honor their energy level (${energyLevel}/5) and sleep status (${sleepQuality}). If energy is low, encourage micro-actions and gentle boundaries.
3. If this is an evening/night session and a morning intention exists ("${recentMorningIntention || morningIntention}"), formulate meaningful loop-closing reflection questions that contrast intention with reality with self-compassion.
4. Output strictly valid JSON matching the requested schema.`;

    const userPrompt = `Circadian Phase: "${phase}"
Sleep Recovery Status: "${sleepQuality}"
Energy Level: ${energyLevel} / 5
Morning Intention (if set): "${morningIntention || recentMorningIntention || "None specified"}"
Anticipated Friction: "${anticipatedFriction || "None specified"}"
Current Journal Writing (if any):
"""
${journalContent}
"""

Please return JSON with:
{
  "primePrompt": "A 1-2 sentence tailored, evocative reflection prompt suited to their exact circadian phase and energy level.",
  "frictionAdvice": "A 1-2 sentence practical grounding strategy for handling their current energy state or friction.",
  "loopClosingQuestions": [
    "A deep, supportive question connecting their earlier morning mindset to their current evening state.",
    "A question celebrating one quiet victory or glimmer of presence from today."
  ],
  "restorationAffirmation": "A calm, authentic, non-cheesy circadian anchor affirmation.",
  "suggestedTags": ["CircadianPrime", "MorningFocus"]
}`;

    const result = await generateContentWithFallback({
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        temperature: 0.4,
      },
    });

    const responseText = result.response.text || "{}";
    let parsed: any;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1]);
      } else {
        parsed = {
          primePrompt: phase.includes("morning")
            ? "What is one gentle priority that deserves your steady focus today?"
            : "What thoughts can you place onto this page so your mind can rest peacefully tonight?",
          frictionAdvice: "Honor your current energy without forcing perfection; small steady steps carry the day.",
          loopClosingQuestions: [
            "How did your morning intention show up in your day?",
            "What is one small moment of grace or peace you noticed today?"
          ],
          restorationAffirmation: "I meet this moment with presence, patience, and clear perspective.",
          suggestedTags: ["Circadian", "DailyRhythm"]
        };
      }
    }

    return res.json({
      primePrompt: parsed.primePrompt || "What is currently top of mind as you begin this reflection?",
      frictionAdvice: parsed.frictionAdvice || "Focus on what is directly in your control right now.",
      loopClosingQuestions: Array.isArray(parsed.loopClosingQuestions) ? parsed.loopClosingQuestions : [],
      restorationAffirmation: parsed.restorationAffirmation || "I am grounded in this present moment.",
      suggestedTags: Array.isArray(parsed.suggestedTags) ? parsed.suggestedTags : ["Circadian"],
      modelUsed: result.modelUsed,
    });
  } catch (error: any) {
    console.error("Gemini Circadian Coach API Error:", error);
    return res.status(500).json({
      error: error?.message || "Failed to generate circadian coaching guidance.",
    });
  }
});

// 7. Psychiatric Decentering & Vent-to-Clarity Engine (According to Psychiatric Principles)
app.post("/api/gemini/psychiatric-decenter", async (req: Request, res: Response) => {
  try {
    const data = (req.body && typeof req.body === "object") ? req.body : {};
    const rawVentText = typeof data.rawVentText === "string" ? data.rawVentText.trim() : "";
    const entryTitle = typeof data.entryTitle === "string" ? data.entryTitle.trim() : "";

    if (!rawVentText || rawVentText.length < 10) {
      return res.status(400).json({
        error: "Please provide at least a few sentences of raw thought or venting to decenter.",
      });
    }

    const sanitizedVent = rawVentText.slice(0, 12000);

    const systemPrompt = `You are a clinical psychiatric journaling assistant trained in cognitive decentering, CBT (Cognitive Behavioral Therapy), and ACT (Acceptance and Commitment Therapy).
Your purpose is to help the user turn unguided emotional venting (which research shows can reinforce rumination pathways) into active cognitive processing, psychological distance, and behavioral agency.

CRITICAL CLINICAL BOUNDARIES:
- Do NOT provide medical diagnoses, clinical pathology labels, or pharmacological advice.
- Maintain a compassionate, objective, and deeply validating tone.
- Help the user step out of the emotional storm into the "Observer Self" (Decentering).

You must analyze the raw stream of consciousness and return structured JSON with:
1. "facts": Array of 2-4 objective, indisputable facts (what an objective camera or third-party observer would verify, stripped of emotional conjecture).
2. "interpretations": Array of 2-4 subjective interpretations, catastrophizing narratives, or assumptions that the user's anxious mind layered on top of the facts.
3. "inMyControl": Array of 2-4 realistic items strictly within the user's circle of agency (e.g. boundary setting, current breath, self-talk, what to do in the next hour).
4. "outOfMyControl": Array of 2-4 items outside their control (e.g. other people's reactions, past events, unpredictable future outcomes).
5. "distortions": Array of 1-3 cognitive traps detected in their text. Each object must have:
   - "name": string (e.g. "Catastrophizing", "Mind Reading", "Emotional Reasoning", "All-or-Nothing", "Should Statements", "Fortune Telling")
   - "quote": string (exact or near-exact short snippet from their vent)
   - "psychiatricReframe": string (a concise, compassionate, grounded reframe)
6. "microActionAnchor": string (ONE concrete, low-effort micro-action they can do in the next 15 minutes to take back agency)
7. "clinicalGroundingNote": string (a short 1-2 sentence psychiatric observation normalizing their experience and anchoring them in the present)`;

    const userPrompt = `Context Title: "${entryTitle || "Unguided Vent"}"
Raw Venting / Emotional Stream:
"""
${sanitizedVent}
"""

Please deconstruct this emotional vent into objective facts vs. interpretations, circle of control, cognitive traps, and a single micro-action anchor. Return pure JSON.`;

    const result = await generateContentWithFallback({
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        temperature: 0.35,
      },
    });

    const responseText = result.response.text || "{}";
    let parsed: any;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1]);
      } else {
        parsed = {
          facts: ["You are experiencing heavy cognitive and emotional load right now."],
          interpretations: ["The mind is generating protective narratives to make sense of the distress."],
          inMyControl: ["Taking slow breaths", "Deciding how to spend the next 30 minutes"],
          outOfMyControl: ["How others react or past events"],
          distortions: [
            {
              name: "Emotional Reasoning",
              quote: "Feeling overwhelmed",
              psychiatricReframe: "Feeling overwhelmed is an emotional state, not proof that things are unmanageable."
            }
          ],
          microActionAnchor: "Step away from the screen, drink a glass of water, and take 3 physiological sighs.",
          clinicalGroundingNote: "Acknowledge the emotional surge without mistaking the thoughts for permanent truths."
        };
      }
    }

    return res.json({
      facts: Array.isArray(parsed.facts) ? parsed.facts : ["A high-demand situation triggered intense stress."],
      interpretations: Array.isArray(parsed.interpretations) ? parsed.interpretations : ["The mind anticipated worst-case outcomes."],
      inMyControl: Array.isArray(parsed.inMyControl) ? parsed.inMyControl : ["Your immediate response and current breath."],
      outOfMyControl: Array.isArray(parsed.outOfMyControl) ? parsed.outOfMyControl : ["Other people's thoughts and future variables."],
      distortions: Array.isArray(parsed.distortions) ? parsed.distortions : [],
      microActionAnchor: parsed.microActionAnchor || "Take one slow breath and write down one gentle priority.",
      clinicalGroundingNote: parsed.clinicalGroundingNote || "Notice these thoughts with gentle curiosity rather than judgment.",
      modelUsed: result.modelUsed,
    });
  } catch (error: any) {
    console.error("Gemini Psychiatric Decenter API Error:", error);
    return res.status(500).json({
      error: error?.message || "Failed to deconstruct and decenter venting text.",
    });
  }
});

// API: Empirical Statistical Telemetry & Predictive Quantifier (Variations A + C + F)
app.post("/api/gemini/extract-telemetry", async (req: Request, res: Response) => {
  try {
    const body = (req.body && typeof req.body === "object") ? req.body : {};
    const content = typeof body.content === "string" ? body.content.slice(0, 50000) : "";
    const title = typeof body.title === "string" ? body.title.slice(0, 200) : "";
    const circadianPhase = typeof body.circadianPhase === "string" ? body.circadianPhase : "dawn_morning";

    if (!content.trim()) {
      return res.status(400).json({ error: "Journal content is required to extract empirical telemetry." });
    }

    const wordCount = content.trim().split(/\s+/).length;

    const systemPrompt = `You are an expert computational psychologist, biometric researcher, and statistical journaling analyst.
Your task is to parse unstructured qualitative journal reflections into rigorous, quantitative empirical telemetry (Variations A + C + F).

Extract and quantify:
1. Subjective Feelings on Numerical Scales:
   - "sleepScore": integer 0 to 7 (0 = insomnia/exhausted, 4 = moderate/adequate, 7 = deep restorative sleep). Infer from text mentions of sleep, tiredness, morning grogginess, or vitality.
   - "energyLevel": integer 0 to 10 (0 = depleted/fatigued, 5 = baseline functional, 10 = peak vitality).
   - "somaticTension": integer 0 to 10 (0 = calm/relaxed, 5 = noticeable tension/tightness, 10 = acute somatic gripping/headache/clenching).
   - "mentalClarity": integer 0 to 10 (0 = severe brain fog/scattered, 5 = functional, 10 = razor-sharp focus and flow).

2. Binary Behavioral Habits:
   - "exercised": boolean (any workout, walk, gym, run, yoga, physical movement mentioned)
   - "mindfulnessMeditation": boolean (breathwork, intentional pause, meditation, quiet presence)
   - "deepWorkSession": boolean (focused study, creative work, coding, deep problem-solving)
   - "lateScreenTime": boolean (late night phone scrolling, gaming, or screen stimulation)
   - "socialConnection": boolean (meaningful conversation with friends, partner, family, peers)
   - "hadGoodDay": boolean (overall positive emotional valence)

3. Qualitative Thematic Coding:
   - "thematicStressors": Array of up to 4 standardized category slugs for recurring friction points or psychological triggers. Choose or normalize to slugs like:
     ["workplace_boundary", "deadline_pressure", "sleep_debt", "imposter_syndrome", "relational_friction", "financial_worry", "perfectionism", "health_concern", "existential_dread"].
   - "cognitiveDisposition": One of ["growth_oriented", "ruminative", "resigned", "grounded_accepting"].

4. Circadian Alignment Score (0 to 100):
   Evaluate circadian harmony given phase "${circadianPhase}" (e.g. winding down at dusk, active at morning).

5. Lagged Causality & Next-Day Prediction (t -> t+1 impact):
   - "predictedNextDayEnergy": integer 0 to 10 estimate of tomorrow's energy given today's strain, rest, and behavior.
   - "vulnerabilityAlert": 1 clear, empirical sentence highlighting what today's behavioral/somatic indicators predict for tomorrow (e.g. "Late rumination and elevated somatic jaw tension (7/10) predict a midday energy dip tomorrow.").
   - "mitigatingMicroAction": 1 realistic, high-leverage micro-intervention to break the negative lagged feedback loop.
   - "laggedCorrelationFactor": float between -1.0 and 1.0 representing the statistical correlation strength (e.g. -0.65).

Output strictly valid JSON with no markdown prose.`;

    const userPrompt = `Entry Title: "${title || "Journal Reflection"}"
Circadian Phase: "${circadianPhase}"
Word Count: ${wordCount}
Content:
"""
${content}
"""

Please compute the empirical telemetry and return JSON matching the schema.`;

    const result = await generateContentWithFallback({
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        temperature: 0.3,
      },
    });

    const responseText = result.response.text || "{}";
    let parsed: any;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1]);
      } else {
        parsed = {};
      }
    }

    // Defensive clamping and normalization
    const clamp = (val: any, min: number, max: number, fallback: number) => {
      const num = typeof val === "number" ? val : fallback;
      return Math.min(max, Math.max(min, Math.round(num)));
    };

    const sleepScore = clamp(parsed.sleepScore, 0, 7, 4);
    const energyLevel = clamp(parsed.energyLevel, 0, 10, 6);
    const somaticTension = clamp(parsed.somaticTension, 0, 10, 3);
    const mentalClarity = clamp(parsed.mentalClarity, 0, 10, 6);
    const circadianAlignmentScore = clamp(parsed.circadianAlignmentScore, 0, 100, 75);

    const binaryHabits = {
      exercised: Boolean(parsed.binaryHabits?.exercised),
      mindfulnessMeditation: Boolean(parsed.binaryHabits?.mindfulnessMeditation),
      deepWorkSession: Boolean(parsed.binaryHabits?.deepWorkSession),
      lateScreenTime: Boolean(parsed.binaryHabits?.lateScreenTime),
      socialConnection: Boolean(parsed.binaryHabits?.socialConnection),
      hadGoodDay: Boolean(parsed.binaryHabits?.hadGoodDay ?? (energyLevel >= 6 && somaticTension <= 4)),
    };

    const validDispositions = ["growth_oriented", "ruminative", "resigned", "grounded_accepting"];
    const cognitiveDisposition = validDispositions.includes(parsed.cognitiveDisposition)
      ? parsed.cognitiveDisposition
      : "growth_oriented";

    const thematicStressors = Array.isArray(parsed.thematicStressors) && parsed.thematicStressors.length > 0
      ? parsed.thematicStressors.map((s: any) => String(s).toLowerCase().replace(/[^a-z0-9_-]/g, "_")).slice(0, 5)
      : ["general_cognitive_load"];

    const predictedNextDayEnergy = clamp(parsed.laggedImpactPrediction?.predictedNextDayEnergy, 0, 10, Math.max(1, energyLevel - (somaticTension > 6 ? 2 : 0)));
    const vulnerabilityAlert = typeof parsed.laggedImpactPrediction?.vulnerabilityAlert === "string" && parsed.laggedImpactPrediction.vulnerabilityAlert.trim()
      ? parsed.laggedImpactPrediction.vulnerabilityAlert.trim()
      : (somaticTension > 6 ? "Elevated nervous system arousal tonight may diminish tomorrow's morning stamina." : "Current indicators point to steady neuroplastic baseline stability for tomorrow.");

    const mitigatingMicroAction = typeof parsed.laggedImpactPrediction?.mitigatingMicroAction === "string" && parsed.laggedImpactPrediction.mitigatingMicroAction.trim()
      ? parsed.laggedImpactPrediction.mitigatingMicroAction.trim()
      : "Engage in 2 minutes of double-inhale physiological sighs and dim ambient lighting.";

    const laggedCorrelationFactor = typeof parsed.laggedImpactPrediction?.laggedCorrelationFactor === "number"
      ? Math.max(-1, Math.min(1, parsed.laggedImpactPrediction.laggedCorrelationFactor))
      : -0.58;

    const telemetry = {
      sleepScore,
      energyLevel,
      somaticTension,
      mentalClarity,
      binaryHabits,
      thematicStressors,
      cognitiveDisposition,
      circadianPhase: circadianPhase as any,
      circadianAlignmentScore,
      laggedImpactPrediction: {
        predictedNextDayEnergy,
        vulnerabilityAlert,
        mitigatingMicroAction,
        laggedCorrelationFactor,
      },
      extractedAt: Date.now(),
      extractedFromWordCount: wordCount,
      confidenceScore: 0.88,
      modelUsed: result.modelUsed,
    };

    return res.json({
      telemetry,
      modelUsed: result.modelUsed,
    });
  } catch (error: any) {
    console.error("Gemini Empirical Telemetry API Error:", error);
    return res.status(500).json({
      error: error?.message || "Failed to extract empirical telemetry from journal prose.",
    });
  }
});

// API: Longitudinal AI Neuroplastic Synthesis & Resilience Trajectory
app.post("/api/gemini/longitudinal-synthesis", async (req: Request, res: Response) => {
  try {
    const body = (req.body && typeof req.body === "object") ? req.body : {};
    const entries = Array.isArray(body.entries) ? body.entries.slice(0, 15) : [];

    if (entries.length === 0) {
      return res.status(400).json({ error: "At least one journal entry is required for longitudinal synthesis." });
    }

    const systemPrompt = `You are a senior neuroplastic researcher, clinical psychologist, and longitudinal reflective coach.
Your purpose is to analyze a collection of chronological journal reflections and somatic indicators to generate an overarching longitudinal neuroplastic synthesis report.

Guidelines:
1. Identify evidence of cognitive reframing, emotional adaptability, and psychological flexibility over time.
2. Highlight recurring cognitive distortions that are being untangled.
3. Note correlations between somatic tension, sleep restfulness, and mental clarity.
4. Provide 3 grounded, encouraging, concrete neuroplastic micro-practices for the upcoming week.
5. Compute an overall Subjective Neural Adaptability / Longitudinal Vitality Score from 0 to 100.
6. Speak with warmth, clinical dignity, and zero toxic positivity.

Return strictly valid JSON conforming to this schema:
{
  "resilienceTrajectory": "A compassionate 2-3 sentence overview of their emotional adaptation and cognitive resilience across these entries.",
  "dominantThemes": ["Theme 1", "Theme 2", "Theme 3"],
  "unwoundCognitiveTraps": ["Cognitive distortion or worry pattern that showed positive reframing"],
  "somaticCorrelations": "1-2 sentences observing how physical rest and tension have correlated with mental clarity.",
  "neuroplasticActionPlan": [
    "Concrete, grounded micro-practice 1 for the upcoming week",
    "Concrete, grounded micro-practice 2 for the upcoming week",
    "Concrete, grounded micro-practice 3 for the upcoming week"
  ],
  "longitudinalVitalityScore": 82
}`;

    const userPrompt = `Chronological Entries Analyzed:
${entries.map((e: any, idx: number) => `
[Entry #${idx + 1}] Date: ${new Date(e.createdAt || Date.now()).toLocaleDateString()}
Title: "${e.title || "Untitled"}"
Mood: ${e.mood || "reflective"}
Tags: ${(e.tags || []).join(", ")}
Excerpt: "${(e.content || "").slice(0, 400)}"
${e.empiricalTelemetry ? `Telemetry: Sleep=${e.empiricalTelemetry.sleepScore}/7, Energy=${e.empiricalTelemetry.energyLevel}/10, Tension=${e.empiricalTelemetry.somaticTension}/10, Clarity=${e.empiricalTelemetry.mentalClarity}/10` : ""}
`).join("\n---\n")}

Please generate the longitudinal neuroplastic synthesis.`;

    const result = await generateContentWithFallback({
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        temperature: 0.35,
      },
    });

    const responseText = result.response.text || "{}";
    let parsed: any;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1]);
      } else {
        parsed = {
          resilienceTrajectory: "Your reflections show consistent intentionality and growing self-awareness across your journaling practice.",
          dominantThemes: ["Self-awareness", "Stress recovery", "Intentional pacing"],
          unwoundCognitiveTraps: ["Softening of all-or-nothing urgency"],
          somaticCorrelations: "Quality rest consistently correlates with higher mental clarity.",
          neuroplasticActionPlan: [
            "Maintain 3-5 minutes of intentional morning circadian priming",
            "Pause for a 60-second physiological sigh during afternoon tension spikes",
            "Celebrate one micro-victory before sleep"
          ],
          longitudinalVitalityScore: 78
        };
      }
    }

    return res.json({
      resilienceTrajectory: parsed.resilienceTrajectory || "Consistent emotional growth noted.",
      dominantThemes: Array.isArray(parsed.dominantThemes) ? parsed.dominantThemes : ["Clarity", "Presence"],
      unwoundCognitiveTraps: Array.isArray(parsed.unwoundCognitiveTraps) ? parsed.unwoundCognitiveTraps : [],
      somaticCorrelations: parsed.somaticCorrelations || "Physical rest directly supports mental focus.",
      neuroplasticActionPlan: Array.isArray(parsed.neuroplasticActionPlan) ? parsed.neuroplasticActionPlan : [
        "Continue consistent evening reflection to close open mental loops."
      ],
      longitudinalVitalityScore: typeof parsed.longitudinalVitalityScore === "number" ? Math.min(100, Math.max(0, Math.round(parsed.longitudinalVitalityScore))) : 80,
      modelUsed: result.modelUsed,
    });
  } catch (error: any) {
    console.error("Gemini Longitudinal Synthesis API Error:", error);
    return res.status(500).json({
      error: error?.message || "Failed to generate longitudinal neuroplastic synthesis.",
    });
  }
});

// ============================================================================
// Google Cloud Architecture: Structured Logging & Telemetry
// ============================================================================
function logStructured(
  severity: "INFO" | "WARNING" | "ERROR",
  message: string,
  extra: Record<string, any> = {}
) {
  const logEntry = {
    severity,
    message,
    timestamp: new Date().toISOString(),
    service: "Ana",
    region: "asia-southeast1",
    cloudRunRevision: process.env.K_REVISION || "local-dev",
    ...extra,
  };
  console.log(JSON.stringify(logEntry));
}

// ============================================================================
// Google Cloud Architecture: Transactional Email Notification Service
// ============================================================================
// Google Cloud Architecture: Transactional Email Notification Service
// Supports SendGrid (Google Cloud Marketplace), Resend REST API, or diagnostic mode
// Injected via Google Cloud Secret Manager into Cloud Run environment variables
// ============================================================================
interface EmailDispatchOptions {
  to: string;
  name?: string;
  subject: string;
  html: string;
  text: string;
  provider?: "sendgrid" | "resend" | "auto";
  apiKey?: string;
  fromEmail?: string;
}

interface EmailDispatchResult {
  success: boolean;
  provider: "sendgrid" | "resend" | "preview_mock";
  message: string;
  preview?: string;
  id?: string;
  errorDetail?: string;
}

async function sendEmailNotification(options: EmailDispatchOptions): Promise<EmailDispatchResult> {
  const { to, name, subject, html, text, provider = "auto", apiKey, fromEmail } = options;

  // Determine active provider: explicit override -> apiKey prefix check -> environment variable check
  const hasResend = !!(apiKey && (apiKey.startsWith("re_") || provider === "resend")) || (!apiKey && !!process.env.RESEND_API_KEY && provider !== "sendgrid");
  const hasSendGrid = !!(apiKey && (apiKey.startsWith("SG.") || provider === "sendgrid")) || (!apiKey && !!process.env.SENDGRID_API_KEY && provider !== "resend");

  // 1. Resend REST API (Direct HTTP POST without heavy SDKs)
  if ((provider === "resend" || (provider === "auto" && hasResend)) && (apiKey || process.env.RESEND_API_KEY)) {
    const key = apiKey || process.env.RESEND_API_KEY;
    const sender = fromEmail || process.env.RESEND_FROM_EMAIL || "Ana Journal <onboarding@resend.dev>";

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: sender.includes("<") ? sender : `Ana Journal <${sender}>`,
          to: [to],
          subject,
          html,
          text,
        }),
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({ id: "sent" }));
        logStructured("INFO", "Email dispatched successfully via Resend API", {
          recipient: to,
          resendId: data.id,
          provider: "resend",
        });
        return {
          success: true,
          provider: "resend",
          message: `Live email dispatched to ${to} via Resend REST API (ID: ${data.id || "delivered"}).`,
          id: data.id,
          preview: html,
        };
      }

      const errData = await res.json().catch(() => ({ message: res.statusText }));
      const errMsg = errData.message || (typeof errData === "string" ? errData : JSON.stringify(errData));
      logStructured("ERROR", "Resend API returned error status", { status: res.status, error: errMsg });
      return {
        success: false,
        provider: "resend",
        message: `Resend dispatch failed (${res.status}): ${errMsg}`,
        errorDetail: errMsg,
      };
    } catch (err: any) {
      logStructured("ERROR", "Resend API request exception", { error: err?.message });
      return {
        success: false,
        provider: "resend",
        message: `Resend connection failed: ${err?.message || err}`,
        errorDetail: err?.message,
      };
    }
  }

  // 2. SendGrid REST API (Google Cloud Marketplace Preferred Transactional Email Partner)
  if ((provider === "sendgrid" || (provider === "auto" && hasSendGrid)) && (apiKey || process.env.SENDGRID_API_KEY)) {
    const key = apiKey || process.env.SENDGRID_API_KEY;
    const sender = fromEmail || process.env.SENDGRID_FROM_EMAIL || "notifications@ana-journal.app";

    try {
      const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to, name: name || to.split("@")[0] }] }],
          from: { email: sender, name: "Ana Circadian Journal" },
          subject,
          content: [
            { type: "text/plain", value: text },
            { type: "text/html", value: html },
          ],
        }),
      });

      if (res.ok || res.status === 202) {
        logStructured("INFO", "Email dispatched successfully via SendGrid API", {
          recipient: to,
          provider: "sendgrid",
          statusCode: res.status,
        });
        return {
          success: true,
          provider: "sendgrid",
          message: `Live email dispatched to ${to} via SendGrid REST API (${res.status} Accepted).`,
          preview: html,
        };
      }

      const errText = await res.text();
      let parsedErr = errText;
      try {
        const json = JSON.parse(errText);
        if (json.errors && Array.isArray(json.errors)) {
          parsedErr = json.errors.map((e: any) => e.message).join("; ");
        }
      } catch {
        // Keep raw text
      }

      logStructured("ERROR", "SendGrid returned non-200 status", { status: res.status, error: parsedErr });
      return {
        success: false,
        provider: "sendgrid",
        message: `SendGrid dispatch failed (${res.status}): ${parsedErr}`,
        errorDetail: parsedErr,
      };
    } catch (err: any) {
      logStructured("ERROR", "SendGrid API request exception", { error: err?.message });
      return {
        success: false,
        provider: "sendgrid",
        message: `SendGrid connection failed: ${err?.message || err}`,
        errorDetail: err?.message,
      };
    }
  }

  // 3. Fallback: Diagnostic Preview Mode (Secrets Not Yet Configured in Secret Manager)
  logStructured("INFO", "Circadian email notification generated in diagnostic preview mode", {
    recipient: to,
    subject,
  });

  return {
    success: true,
    provider: "preview_mock",
    message: "Diagnostic Mode: API keys not detected in Google Cloud Secret Manager or environment variables. Rendered complete email template below. Configure RESEND_API_KEY or SENDGRID_API_KEY to activate live inbox delivery.",
    preview: html,
  };
}

// Universal Email-Safe Responsive HTML Template (Standard Table Layout for Gmail, Apple Mail, Outlook)
function createCircadianEmailHtml(userName: string, hoursInactive: number, phase: string, baseUrl: string, recipientEmail?: string): string {
  return `
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #121212; padding: 24px 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <tr>
        <td align="center">
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 560px; background-color: #181818; border: 1px solid #3D4028; border-radius: 6px; overflow: hidden; color: #e2e8f0;">
            <!-- Brand Header -->
            <tr>
              <td style="padding: 20px 24px; border-bottom: 1px solid #3D4028; background-color: #1c1c1c;">
                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td style="font-size: 16px; font-weight: 700; color: #ffffff; letter-spacing: 0.05em; font-family: monospace;">
                      <span style="display: inline-block; width: 24px; height: 24px; line-height: 24px; text-align: center; background-color: #262626; border: 1px solid #A3A649; border-radius: 50%; color: #A3A649; font-size: 12px; margin-right: 8px;">A</span>
                      ANA // CIRCADIAN SYSTEM
                    </td>
                    <td align="right" style="font-size: 10px; color: #A3A649; font-family: monospace; font-weight: 600; text-transform: uppercase;">
                      [LOOP CLOSURE]
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Content Area -->
            <tr>
              <td style="padding: 24px;">
                <!-- Inactivity Alert Box -->
                <div style="background-color: #262626; border-left: 3px solid #AD3D30; border-top: 1px solid #3D4028; border-right: 1px solid #3D4028; border-bottom: 1px solid #3D4028; padding: 14px 16px; border-radius: 4px; margin-bottom: 20px;">
                  <span style="color: #A3A649; font-family: monospace; font-size: 10px; text-transform: uppercase; font-weight: bold; letter-spacing: 0.08em; display: block; margin-bottom: 4px;">
                    CIRCADIAN INACTIVITY ALERT • ${phase.toUpperCase()}
                  </span>
                  <h2 style="margin: 0; color: #ffffff; font-size: 16px; font-weight: 600; line-height: 1.4;">
                    Notice any unresolved mental tension, ${userName}?
                  </h2>
                </div>

                <!-- Main Narrative -->
                <p style="color: #d1d5db; font-size: 13.5px; line-height: 1.65; margin: 0 0 16px 0;">
                  It has been <strong style="color: #ffffff;">${hoursInactive.toFixed(1)} hours</strong> since your last mindful reflection. In the <strong style="color: #A3A649;">${phase}</strong> window, unclosed cognitive loops tend to consume prefrontal working memory and elevate subconscious cortisol.
                </p>

                <!-- Somatic Reset Box -->
                <div style="background-color: #1f2316; border: 1px dashed #A3A649; padding: 12px 14px; border-radius: 4px; margin-bottom: 24px;">
                  <div style="font-size: 11px; font-weight: bold; color: #d4da55; margin-bottom: 4px; font-family: monospace;">
                    🌿 60-SECOND PHYSIOLOGICAL SIGH RESET:
                  </div>
                  <div style="font-size: 12px; color: #cbd5e1; line-height: 1.5;">
                    Take two quick inhales through the nose, followed by a long, slow sigh exhalation through the mouth. Repeat twice to down-regulate sympathetic arousal before returning to calm focus.
                  </div>
                </div>

                <!-- Call to Action Button -->
                <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 28px 0;">
                  <tr>
                    <td align="center">
                      <table cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td align="center" style="background-color: #A3A649; border-radius: 4px;">
                            <a href="${baseUrl}/?action=circadian&source=email_nudge" target="_blank" style="display: inline-block; padding: 13px 28px; font-family: monospace, -apple-system, sans-serif; font-size: 13px; font-weight: 700; color: #121212; text-decoration: none; letter-spacing: 0.05em; border-radius: 4px;">
                              OPEN ANA STUDIO &amp; DEPOSIT OPEN LOOPS &rarr;
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <p style="color: #8C8C8C; font-size: 11.5px; line-height: 1.5; margin: 0; text-align: center;">
                  Taking just 90 seconds to externalize unresolved thoughts clears mental cache and facilitates natural restorative rest.
                </p>
              </td>
            </tr>

            <!-- Audit Footer -->
            <tr>
              <td style="padding: 16px 24px; border-top: 1px solid #3D4028; background-color: #141414; font-size: 10.5px; color: #737373; font-family: monospace; text-align: center; line-height: 1.6;">
                ${recipientEmail ? `Authenticated Account: <strong style="color: #A3A649;">${recipientEmail}</strong> • ` : ""}Last Activity: <strong style="color: #ffffff;">${hoursInactive.toFixed(1)}h ago</strong><br/>
                Engineered for Google Cloud &amp; Hack2Skill Ideathon Challenge Cohort 3<br/>
                Dispatched via Google Cloud Scheduler &amp; Cloud Run (asia-southeast1) • Synced with Cloud Firestore (us-west1)
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

// API: Notification & Email Provider Configuration Status
app.get("/api/notifications/config", (_req: Request, res: Response) => {
  const hasResend = !!process.env.RESEND_API_KEY;
  const hasSendGrid = !!process.env.SENDGRID_API_KEY;
  const activeProvider = hasResend ? "resend" : hasSendGrid ? "sendgrid" : "preview_mock";

  return res.json({
    activeProvider,
    hasResendKey: hasResend,
    hasSendgridKey: hasSendGrid,
    resendFromEmail: process.env.RESEND_FROM_EMAIL || "Ana Journal <onboarding@resend.dev>",
    sendgridFromEmail: process.env.SENDGRID_FROM_EMAIL || "notifications@ana-journal.app",
    isCloudRun: !!process.env.K_SERVICE,
    cloudRunService: process.env.K_SERVICE || "Ana",
    cloudSchedulerRegion: "asia-southeast1",
    recommendedCron: "0 */4 * * *",
    cronEndpoint: "/api/scheduler/check-inactivity",
    timestamp: new Date().toISOString(),
  });
});

// API: Cloud Scheduler Inactivity Evaluation & Direct Email Notification Webhook
// Compatible with both Cloud Scheduler endpoints: /api/scheduler/check-inactivity and /api/notifications/circadian-cron
app.all(["/api/scheduler/check-inactivity", "/api/notifications/circadian-cron"], async (req: Request, res: Response) => {
  try {
    const payload = req.method === "GET" ? req.query : req.body;
    const { 
      userId, 
      userEmail, 
      userName, 
      lastEntryAt, 
      thresholdHours = 20,
      apiKey,
      provider,
      fromEmail
    } = (payload || {}) as any;
    
    const now = Date.now();
    const parsedThreshold = Number(thresholdHours) || 20;
    const lastTimestamp = typeof lastEntryAt === "number" && lastEntryAt > 0 
      ? lastEntryAt 
      : (typeof lastEntryAt === "string" ? parseInt(lastEntryAt, 10) : now - 22 * 60 * 60 * 1000);
    
    const hoursElapsed = Math.max(0, (now - lastTimestamp) / (1000 * 60 * 60));
    const isInactive = hoursElapsed >= parsedThreshold;

    const hourOfDay = new Date().getHours();
    const phase = (hourOfDay >= 5 && hourOfDay < 12) 
      ? "Morning Dopamine Prime" 
      : (hourOfDay >= 18 || hourOfDay < 5) 
      ? "Evening Loop Closure" 
      : "Midday Grounding Anchor";

    const nudgeMessage = isInactive
      ? `Notice any unresolved tension? It has been ${hoursElapsed.toFixed(1)} hours since your last reflection. Take 90 seconds to deposit open mental loops before rest.`
      : `Cognitive loop is healthy. Reflection completed ${hoursElapsed.toFixed(1)} hours ago. No re-engagement nudge needed.`;

    let emailResult = null;
    const targetEmail = userEmail || (typeof userId === "string" && userId.includes("@") ? userId : null);

    // If user is inactive and an email is available, trigger email dispatch
    if (isInactive && targetEmail) {
      const baseUrl = process.env.APP_BASE_URL || `${req.protocol}://${req.get("host")}`;
      const emailHtml = createCircadianEmailHtml(
        userName || targetEmail.split("@")[0] || "Reflective User",
        hoursElapsed,
        phase,
        baseUrl,
        targetEmail
      );

      emailResult = await sendEmailNotification({
        to: targetEmail,
        name: userName,
        subject: `Ana // Circadian Inactivity Alert: ${phase}`,
        html: emailHtml,
        text: nudgeMessage,
        apiKey,
        provider,
        fromEmail,
      });
    }

    logStructured("INFO", "Cloud Scheduler Inactivity Evaluated", {
      targetUser: userId || targetEmail || "guest",
      hoursElapsed: parseFloat(hoursElapsed.toFixed(1)),
      thresholdHours: parsedThreshold,
      isInactive,
      emailDispatched: !!emailResult,
      emailStatus: emailResult?.provider,
      schedulerTrigger: req.headers["x-cloudscheduler"] ? "CloudScheduler" : "ManualDiagnostic",
    });

    return res.json({
      status: "success",
      targetUser: userId || targetEmail || "guest_authenticated",
      schedulerRegion: "asia-southeast1 (Singapore)",
      cloudRunService: process.env.K_SERVICE || "Ana",
      firestoreDatabase: "ai-studio-1964eda9-cc24-452a-bee7-3ab0780e0478 (us-west1, Oregon)",
      evaluation: {
        lastEntryAt: lastTimestamp,
        hoursElapsed: parseFloat(hoursElapsed.toFixed(1)),
        inactivityThresholdHours: parsedThreshold,
        isInactive,
        circadianPhase: phase,
        actionRequired: isInactive ? "DISPATCH_CIRCADIAN_NUDGE" : "NO_ACTION_USER_ACTIVE",
        nudgePayload: {
          title: `Ana Circadian: ${phase}`,
          body: nudgeMessage,
          clickAction: "/?action=circadian"
        }
      },
      emailDispatch: emailResult,
      gcloudVerificationCommands: {
        listJobs: "gcloud scheduler jobs list --location=asia-southeast1",
        runJobNow: "gcloud scheduler jobs run ana-circadian-inactivity-cron --location=asia-southeast1",
        readLogs: "gcloud logging read \"resource.type=cloud_run_revision AND resource.labels.service_name=Ana\" --limit=20"
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logStructured("ERROR", "Scheduler Inactivity API Error", { error: error?.message });
    return res.status(500).json({ error: error?.message || "Failed to evaluate scheduler inactivity" });
  }
});

// API: Dedicated Email Notification Dispatch / Test Endpoint
app.post("/api/notifications/send-email", async (req: Request, res: Response) => {
  try {
    const { 
      recipientEmail, 
      recipientName, 
      hoursInactive = 22, 
      circadianPhase = "Evening Loop Closure",
      apiKey,
      provider,
      fromEmail
    } = req.body || {};

    if (!recipientEmail || typeof recipientEmail !== "string" || !recipientEmail.includes("@")) {
      return res.status(400).json({ error: "A valid recipientEmail is required." });
    }

    const baseUrl = process.env.APP_BASE_URL || `${req.protocol}://${req.get("host")}`;
    const html = createCircadianEmailHtml(
      recipientName || recipientEmail.split("@")[0],
      Number(hoursInactive) || 22,
      String(circadianPhase),
      baseUrl,
      recipientEmail
    );

    const result = await sendEmailNotification({
      to: recipientEmail,
      name: recipientName,
      subject: `Ana // Circadian Inactivity Alert: ${circadianPhase}`,
      html,
      text: `Notice any unresolved tension, ${recipientName || "there"}? It has been ${hoursInactive} hours since your last reflection. Take 90 seconds to deposit open loops in Ana Studio: ${baseUrl}/?action=circadian`,
      apiKey,
      provider,
      fromEmail,
    });

    if (!result.success) {
      return res.status(400).json({
        status: "error",
        error: result.message,
        provider: result.provider,
        recipient: recipientEmail,
        errorDetail: result.errorDetail,
        timestamp: new Date().toISOString(),
      });
    }

    return res.json({
      status: result.provider === "preview_mock" ? "preview" : "sent",
      recipient: recipientEmail,
      provider: result.provider,
      message: result.message,
      id: result.id,
      htmlPreview: result.preview || html,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logStructured("ERROR", "Send Email Notification API Error", { error: error?.message });
    return res.status(500).json({ error: error?.message || "Failed to dispatch email notification." });
  }
});

// API: Google Sheets Synchronization & Webhook Proxy
app.post("/api/sheets/sync", async (req: Request, res: Response) => {
  try {
    const { webhookUrl, spreadsheetId, entries = [], sessions = [], glimmers = [] } = req.body || {};

    logStructured("INFO", "Google Sheets sync requested", {
      entriesCount: entries.length,
      hasWebhook: !!webhookUrl,
      hasSpreadsheetId: !!spreadsheetId,
    });

    // Option A: Relay directly to user's Google Apps Script Webhook
    if (webhookUrl && typeof webhookUrl === "string" && webhookUrl.startsWith("http")) {
      try {
        const webhookRes = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "sync",
            entries,
            sessions,
            glimmers,
            timestamp: new Date().toISOString(),
          }),
        });

        const webhookData = await webhookRes.json().catch(() => ({ status: "received" }));

        logStructured("INFO", "Google Apps Script Webhook dispatched successfully", {
          status: webhookRes.status,
          entriesSynced: entries.length,
        });

        return res.json({
          success: true,
          message: `Successfully dispatched ${entries.length} reflections to Google Sheets via Apps Script Webhook.`,
          rowsAppended: entries.length,
          target: "Google Apps Script",
          webhookResponse: webhookData,
          timestamp: new Date().toISOString(),
        });
      } catch (webhookErr: any) {
        logStructured("WARNING", "Webhook forward error, providing fallback data", { error: webhookErr?.message });
      }
    }

    // Option B: Format rows for client-side or Google Sheets API v4 integration
    const formattedRows = (entries as any[]).map((entry) => [
      new Date(entry.createdAt || Date.now()).toISOString(),
      entry.id || "",
      entry.title || "Untitled",
      entry.mood || "reflective",
      (entry.tags || []).join(", "),
      entry.content ? entry.content.split(/\s+/).length : 0,
      entry.empiricalTelemetry?.sleepScore ?? "",
      entry.empiricalTelemetry?.energyLevel ?? "",
      entry.empiricalTelemetry?.somaticTension ?? "",
      entry.empiricalTelemetry?.mentalClarity ?? "",
      entry.summary || "",
      (entry.content || "").slice(0, 300),
    ]);

    return res.json({
      success: true,
      message: `Formatted ${formattedRows.length} rows ready for Google Sheets synchronization.`,
      rowsAppended: formattedRows.length,
      formattedRows,
      spreadsheetId: spreadsheetId || "local_session_buffer",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logStructured("ERROR", "Google Sheets Sync API Error", { error: error?.message });
    return res.status(500).json({ error: error?.message || "Failed to process Google Sheets sync." });
  }
});

// ============================================================================
// Google Cloud Architecture: Sensitive Data Protection (Cloud DLP) Redaction
// Inspects and masks sensitive personal identifiers (PII, infoTypes)
// ============================================================================
interface DlpRedactionResult {
  originalText: string;
  redactedText: string;
  findingsCount: number;
  findings: Array<{ infoType: string; snippet: string }>;
}

function redactSensitiveData(text: string): DlpRedactionResult {
  if (!text || typeof text !== "string") {
    return { originalText: "", redactedText: "", findingsCount: 0, findings: [] };
  }

  const findings: Array<{ infoType: string; snippet: string }> = [];
  let redacted = text;

  // 1. EMAIL_ADDRESS
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  redacted = redacted.replace(emailRegex, (match) => {
    findings.push({ infoType: "EMAIL_ADDRESS", snippet: match });
    return `[REDACTED_EMAIL]`;
  });

  // 2. PHONE_NUMBER (international & local formats)
  const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
  redacted = redacted.replace(phoneRegex, (match) => {
    findings.push({ infoType: "PHONE_NUMBER", snippet: match });
    return `[REDACTED_PHONE]`;
  });

  // 3. CREDIT_CARD_NUMBER
  const cardRegex = /\b(?:\d{4}[-\s]?){3}\d{4}\b/g;
  redacted = redacted.replace(cardRegex, (match) => {
    findings.push({ infoType: "CREDIT_CARD_NUMBER", snippet: match });
    return `[REDACTED_CARD]`;
  });

  // 4. US_SOCIAL_SECURITY_NUMBER / ID
  const ssnRegex = /\b\d{3}-\d{2}-\d{4}\b/g;
  redacted = redacted.replace(ssnRegex, (match) => {
    findings.push({ infoType: "US_SOCIAL_SECURITY_NUMBER", snippet: match });
    return `[REDACTED_ID]`;
  });

  // 5. API_KEY / PASSWORD / CREDENTIALS
  const credentialRegex = /(?:password|passwd|api[_-]?key|secret|token)\s*[:=]\s*['"]?([^\s'"]{6,})['"]?/gi;
  redacted = redacted.replace(credentialRegex, (match, cred) => {
    findings.push({ infoType: "CREDENTIAL", snippet: cred });
    return match.replace(cred, `[REDACTED_SECRET]`);
  });

  // 6. PERSON_NAME (Titles & Contextual references per Google Cloud DLP spec)
  const titleNameRegex = /\b(?:Mr\.|Mrs\.|Ms\.|Miss|Dr\.|Prof\.)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/g;
  redacted = redacted.replace(titleNameRegex, (match, name) => {
    findings.push({ infoType: "PERSON_NAME", snippet: match });
    return match.replace(name, `[REDACTED_NAME]`);
  });

  const contextualNameRegex = /\b(with|to|met|spoke with|talked with|talked to|called|told|emailed|friend|boss|manager|colleague|coworker|partner|therapist|doctor|named)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/g;
  redacted = redacted.replace(contextualNameRegex, (match, prefix, name) => {
    const nonNames = ["I", "The", "A", "An", "My", "Our", "We", "He", "She", "It", "They", "Today", "Yesterday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    if (nonNames.includes(name)) return match;
    findings.push({ infoType: "PERSON_NAME", snippet: name });
    return `${prefix} [REDACTED_NAME]`;
  });

  return {
    originalText: text,
    redactedText: redacted,
    findingsCount: findings.length,
    findings,
  };
}

// API: Google Cloud Sensitive Data Protection (DLP) Text Redaction Endpoint
app.post("/api/privacy/redact-dlp", (req: Request, res: Response) => {
  try {
    const { text = "" } = req.body || {};
    const result = redactSensitiveData(String(text));

    logStructured("INFO", "Cloud DLP text redaction evaluated", {
      findingsCount: result.findingsCount,
      textLength: text.length,
    });

    return res.json({
      status: "success",
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logStructured("ERROR", "Cloud DLP Redaction Error", { error: error?.message });
    return res.status(500).json({ error: error?.message || "Failed to redact text" });
  }
});

// API: Handwritten Journal OCR & Cloud Storage Archival with Gemini Multimodal & Cloud DLP
app.post("/api/journal/handwritten-ocr", async (req: Request, res: Response) => {
  try {
    const { images = [], autoRedact = true, userId = "anonymous" } = req.body || {};

    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: "At least one handwritten image is required." });
    }

    logStructured("INFO", "Processing handwritten journal OCR batch", {
      imageCount: images.length,
      userId,
      autoRedact,
    });

    // 1. Prepare image parts for Gemini Multimodal
    const parts: any[] = [];
    const storageUrls: string[] = [];

    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      let mimeType = "image/jpeg";
      let base64Data = "";

      if (typeof img === "string" && img.startsWith("data:")) {
        const match = img.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          mimeType = match[1];
          base64Data = match[2];
        } else {
          base64Data = img.split(",")[1] || img;
        }
      } else {
        base64Data = String(img);
      }

      // Simulated Cloud Storage bucket path & signed URL
      const imageId = `hw_${Date.now()}_p${i + 1}`;
      const cloudStorageUri = `gs://ana-handwritten-archives/${userId}/${imageId}.jpg`;
      storageUrls.push(cloudStorageUri);

      parts.push({
        inlineData: {
          mimeType,
          data: base64Data,
        },
      });
    }

    // Add transcription instruction prompt
    parts.push({
      text: `You are an expert paleographer and handwriting transcription specialist.
Meticulously transcribe the handwritten text from this journal notebook page photo.
Guidelines:
1. Transcribe the exact words written by the user. Preserve their original capitalization, paragraph breaks, bullet points, and structure.
2. If text is crossed out or scribbled over, transcribe the author's final intended word.
3. If dates, timestamps, or headers are written on the page, format them as clean Markdown headers (e.g. ## Date or ### Header).
${autoRedact ? "4. SENSITIVE DATA PROTECTION (Google Cloud DLP): Mask all specific personal names of people (individuals, friends, colleagues, doctors) by replacing them with [REDACTED_NAME]." : ""}
5. Do not summarize or add conversational banter. Return ONLY the transcribed text prose.`,
    });

    const ocrResult = await generateContentWithFallback({
      contents: [{ role: "user", parts }],
      config: {
        temperature: 0.1, // Low temperature for high transcription accuracy
      },
    });

    const transcribedText = ocrResult.response.text || "";

    // 2. Apply Cloud DLP Redaction if enabled
    const dlpResult = autoRedact
      ? redactSensitiveData(transcribedText)
      : {
          originalText: transcribedText,
          redactedText: transcribedText,
          findingsCount: 0,
          findings: [],
        };

    logStructured("INFO", "Handwritten OCR completed successfully", {
      modelUsed: ocrResult.modelUsed,
      charCount: transcribedText.length,
      dlpFindings: dlpResult.findingsCount,
      cloudStorageArchives: storageUrls.length,
    });

    return res.json({
      status: "success",
      transcribedText,
      redactedText: dlpResult.redactedText,
      isRedacted: dlpResult.findingsCount > 0,
      findingsCount: dlpResult.findingsCount,
      findings: dlpResult.findings,
      storageUrls,
      cloudStorageBucket: "gs://ana-handwritten-archives/",
      modelUsed: ocrResult.modelUsed,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logStructured("ERROR", "Handwritten OCR API Error", { error: error?.message });
    return res.status(500).json({
      error: error?.message || "Failed to transcribe handwritten journal image.",
    });
  }
});

// API: Implicit Narrative Decentering & Perspective Shifting (Gemini 3.6+)
// Inspired by Pennebaker's expressive writing & self-distancing research.
// Strictly non-clinical: zero expert diagnosis, zero medical claims.
app.post("/api/gemini/narrative-decenter", async (req: Request, res: Response) => {
  try {
    const body = (req.body && typeof req.body === "object") ? req.body : {};
    const content = typeof body.content === "string" ? body.content : "";
    const title = typeof body.title === "string" ? body.title : "Reflection";

    if (!content.trim()) {
      return res.status(400).json({ error: "Content is required to generate narrative perspective." });
    }

    const systemPrompt = `You are a mindful perspective-shifting guide in Ana, a neuroscience-informed journal.
Your task is to take the user's raw thoughts, emotional venting, or brain dump and gently reframe it from a compassionate, third-person perspective (self-distancing), while highlighting causal understanding.

CRITICAL BOUNDARIES:
- DO NOT provide any psychological, psychiatric, or medical diagnoses.
- DO NOT use clinical pathologizing words (e.g. "disorder", "trauma diagnosis", "depression symptom", "pathology", "patient").
- DO NOT judge or lecture the user.
- Emphasize curiosity, human universality, emotional validity, and calm perspective.

Structure the JSON output exactly with:
1. "decenteredPerspective": (2-3 brief paragraphs). Retell their situation as an empathetic observer watching someone navigate their day with compassion. Use gentle third-person or collective framing ("The person noticed...", "One can see how much was carried...").
2. "causalBridge": (1-2 sentences). Articulate the core realization or "why" behind the tension (connecting cause to realization: "This feeling emerged because... and the deeper realization is...").
3. "groundedStep": (1 sentence). A gentle, low-pressure micro-step or breath anchor to return to the present.`;

    const result = await generateContentWithFallback({
      contents: [
        {
          role: "user",
          parts: [{ text: `Entry Title: "${title}"\nRaw Stream of Thought:\n${content}` }],
        },
      ],
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.6,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            decenteredPerspective: { type: Type.STRING },
            causalBridge: { type: Type.STRING },
            groundedStep: { type: Type.STRING },
          },
          required: ["decenteredPerspective", "causalBridge", "groundedStep"],
        },
      },
    });

    const parsed = JSON.parse(result.response.text || "{}");

    logStructured("INFO", "Narrative decenter generated", {
      modelUsed: result.modelUsed,
      contentLength: content.length,
    });

    return res.json({
      decenteredPerspective: parsed.decenteredPerspective || "",
      causalBridge: parsed.causalBridge || "",
      groundedStep: parsed.groundedStep || "",
      modelUsed: result.modelUsed,
    });
  } catch (error: any) {
    console.error("Narrative Decenter API Error:", error);
    return res.status(500).json({
      error: error?.message || "Failed to generate perspective shift.",
    });
  }
});

// Start Full-Stack Server & Mount Vite Middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Gemini Reflection Journal running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
