/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GeminiChatRequest, GeminiChatResponse, GeminiSummarizeRequest, GeminiSummarizeResponse } from "../types";

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
