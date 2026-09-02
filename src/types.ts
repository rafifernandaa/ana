/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export type MessageRole = 'user' | 'model' | 'system';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  modelUsed?: string;
}

export type JournalMood = 
  | 'reflective' 
  | 'grateful' 
  | 'peaceful' 
  | 'energized' 
  | 'focused' 
  | 'creative' 
  | 'challenged' 
  | 'thoughtful';

export interface AISummary {
  summary: string;
  keyTakeaways: string[];
  reflectionQuestions: string[];
  moodAnalysis: string;
  generatedAt: number;
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
  aiSummary?: AISummary | null;
  isFavorite?: boolean;
}

export interface GeminiChatRequest {
  messages: Array<{
    role: 'user' | 'model';
    content: string;
  }>;
  context?: string;
  mode?: 'reflect' | 'summarize' | 'brainstorm' | 'mentor' | 'general';
  systemInstruction?: string;
}

export interface GeminiChatResponse {
  text: string;
  modelUsed: string;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
}

export interface GeminiSummarizeRequest {
  title?: string;
  content: string;
  conversationHistory?: Array<{
    role: 'user' | 'model';
    content: string;
  }>;
}

export interface GeminiSummarizeResponse {
  summary: string;
  keyTakeaways: string[];
  reflectionQuestions: string[];
  moodAnalysis: string;
  suggestedTags: string[];
  modelUsed: string;
}
