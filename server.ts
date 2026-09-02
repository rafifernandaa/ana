import express, { Request, Response } from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

// 1. Top-Level Request Deserialization (Ordering Guarantee)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Fallback ladder definition for resilient Gemini operations
const FALLBACK_MODELS = [
  "gemini-3.6-flash",
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
  "gemini-3.7-flash",
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
- Maintain a warm, encouraging, thoughtful, and psychologically safe tone.
- When the user shares reflections, acknowledge their feelings, highlight themes, offer thoughtful perspective questions, and provide gentle brainstorming when appropriate.
- Format responses cleanly with brief markdown paragraphs and bullet points for clarity.
- Do not provide clinical psychiatric diagnoses, but offer mindfulness, journaling prompts, and cognitive grounding techniques.`;

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
        systemInstruction: "You are an expert reflective counselor and executive coach specializing in journaling analysis and positive psychology. Always return valid, well-formed JSON conforming strictly to the requested schema.",
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
