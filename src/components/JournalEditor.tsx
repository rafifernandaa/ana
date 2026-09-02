/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import confetti from "canvas-confetti";
import { 
  Sparkles, 
  Send, 
  Save, 
  Bot, 
  User as UserIcon, 
  RefreshCw, 
  HelpCircle, 
  Smile, 
  Tag, 
  BookOpen, 
  Check, 
  Trash2, 
  ArrowRight, 
  Lightbulb, 
  ListChecks, 
  HeartHandshake, 
  Compass, 
  AlertCircle 
} from "lucide-react";
import { JournalEntry, ChatMessage, JournalMood, AISummary } from "../types";
import { sendChatMessageToGemini, generateEntrySummaryWithGemini } from "../lib/geminiService";

interface JournalEditorProps {
  entry: JournalEntry;
  onSave: (entry: JournalEntry) => Promise<void>;
  onDelete?: (entryId: string) => Promise<void>;
  isSaving: boolean;
  saveError: string | null;
  onClearSaveError: () => void;
}

const MOODS: { id: JournalMood; label: string; emoji: string; color: string }[] = [
  { id: "reflective", label: "Reflective", emoji: "🪞", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  { id: "grateful", label: "Grateful", emoji: "🌱", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { id: "peaceful", label: "Peaceful", emoji: "🌊", color: "bg-sky-50 text-sky-700 border-sky-200" },
  { id: "energized", label: "Energized", emoji: "⚡", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { id: "focused", label: "Focused", emoji: "🎯", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { id: "creative", label: "Creative", emoji: "🎨", color: "bg-purple-50 text-purple-700 border-purple-200" },
  { id: "challenged", label: "Challenged", emoji: "🧗", color: "bg-rose-50 text-rose-700 border-rose-200" },
  { id: "thoughtful", label: "Thoughtful", emoji: "💡", color: "bg-teal-50 text-teal-700 border-teal-200" },
];

const PROMPT_SUGGESTIONS = [
  "What is taking up most of your mental energy right now?",
  "What is one small victory or moment of beauty you experienced today?",
  "What is an uncomfortable thought or challenge you'd like to unpack?",
  "What would your most compassionate self say about this situation?",
];

const CHAT_PROMPTS = [
  "Help me reflect on what I just wrote and ask 2 deep questions.",
  "Brainstorm 3 practical, small next steps based on this.",
  "Help me reframe this situation with self-compassion.",
  "What possible blind spots or cognitive assumptions might be here?",
];

export const JournalEditor: React.FC<JournalEditorProps> = ({
  entry,
  onSave,
  onDelete,
  isSaving,
  saveError,
  onClearSaveError,
}) => {
  // Local active editing state
  const [currentEntry, setCurrentEntry] = useState<JournalEntry>(entry);
  const [tagInput, setTagInput] = useState("");
  
  // Gemini Chat state
  const [chatInput, setChatInput] = useState("");
  const [chatMode, setChatMode] = useState<"reflect" | "brainstorm" | "mentor" | "summarize">("reflect");
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Sync internal state if active entry switches from sidebar
  useEffect(() => {
    setCurrentEntry(entry);
    setAiError(null);
  }, [entry.id]);

  // Scroll chat to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentEntry.messages, isAiResponding]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentEntry(prev => ({ ...prev, title: e.target.value }));
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentEntry(prev => ({ ...prev, content: e.target.value }));
  };

  const handleMoodSelect = (mood: JournalMood) => {
    setCurrentEntry(prev => ({ ...prev, mood }));
  };

  const handleAddTag = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ("key" in e && e.key !== "Enter") return;
    e.preventDefault();
    const trimmed = tagInput.trim().replace(/^#/, "");
    if (trimmed && !currentEntry.tags.includes(trimmed)) {
      setCurrentEntry(prev => ({ ...prev, tags: [...prev.tags, trimmed] }));
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setCurrentEntry(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tagToRemove),
    }));
  };

  const handleInsertPrompt = (promptText: string) => {
    setCurrentEntry(prev => ({
      ...prev,
      content: prev.content ? `${prev.content}\n\n**Prompt:** ${promptText}\n` : `**Prompt:** ${promptText}\n`,
    }));
  };

  // Manual save trigger
  const handleSaveEntry = async () => {
    onClearSaveError();
    await onSave(currentEntry);
    confetti({
      particleCount: 35,
      spread: 60,
      origin: { y: 0.85 },
      colors: ["#6366f1", "#8b5cf6", "#10b981"],
    });
  };

  // Send message to Gemini conversational agent
  const handleSendMessage = async (customPrompt?: string) => {
    const messageToSend = customPrompt || chatInput.trim();
    if (!messageToSend || isAiResponding) return;

    setAiError(null);
    const userMsgId = "user-" + Date.now();
    const newUserMsg: ChatMessage = {
      id: userMsgId,
      role: "user",
      content: messageToSend,
      timestamp: Date.now(),
    };

    const updatedMessages = [...currentEntry.messages, newUserMsg];
    
    // Update local state immediately
    const updatedEntryWithUserMsg: JournalEntry = {
      ...currentEntry,
      messages: updatedMessages,
      updatedAt: Date.now(),
    };
    setCurrentEntry(updatedEntryWithUserMsg);
    setChatInput("");
    setIsAiResponding(true);

    try {
      // Call server-side API proxy with model fallback ladder
      const apiMessages = updatedMessages.map(m => ({
        role: m.role as "user" | "model",
        content: m.content,
      }));

      const res = await sendChatMessageToGemini({
        messages: apiMessages,
        context: currentEntry.content,
        mode: chatMode,
      });

      const modelMsgId = "gemini-" + Date.now();
      const newModelMsg: ChatMessage = {
        id: modelMsgId,
        role: "model",
        content: res.text,
        timestamp: Date.now(),
        modelUsed: res.modelUsed,
      };

      const finalMessages = [...updatedMessages, newModelMsg];
      const finalEntry: JournalEntry = {
        ...updatedEntryWithUserMsg,
        messages: finalMessages,
        updatedAt: Date.now(),
      };

      setCurrentEntry(finalEntry);
      
      // Auto-save to Firestore to guarantee persistence
      await onSave(finalEntry);
    } catch (err: any) {
      console.error("Failed to converse with Gemini:", err);
      setAiError(err.message || "Failed to receive response from Gemini. Please check connection and try again.");
    } finally {
      setIsAiResponding(false);
    }
  };

  // Generate structured AI Summaries and Takeaways
  const handleGenerateSummary = async () => {
    if (!currentEntry.content.trim() && currentEntry.messages.length === 0) {
      setAiError("Please write some reflections or chat with Gemini before generating a summary.");
      return;
    }

    setAiError(null);
    setIsSummarizing(true);

    try {
      const history = currentEntry.messages.map(m => ({
        role: m.role as "user" | "model",
        content: m.content,
      }));

      const res = await generateEntrySummaryWithGemini({
        title: currentEntry.title,
        content: currentEntry.content,
        conversationHistory: history,
      });

      const summaryObj: AISummary = {
        summary: res.summary,
        keyTakeaways: res.keyTakeaways,
        reflectionQuestions: res.reflectionQuestions,
        moodAnalysis: res.moodAnalysis,
        generatedAt: Date.now(),
        modelUsed: res.modelUsed,
      };

      // Merge suggested tags if new
      const mergedTags = Array.from(new Set([...currentEntry.tags, ...res.suggestedTags]));

      const updatedEntry: JournalEntry = {
        ...currentEntry,
        tags: mergedTags,
        aiSummary: summaryObj,
        updatedAt: Date.now(),
      };

      setCurrentEntry(updatedEntry);
      await onSave(updatedEntry);

      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.7 },
        colors: ["#8b5cf6", "#3b82f6", "#ec4899"],
      });
    } catch (err: any) {
      console.error("Failed to generate summary:", err);
      setAiError(err.message || "Failed to generate AI summary.");
    } finally {
      setIsSummarizing(false);
    }
  };

  const wordCount = currentEntry.content.trim() ? currentEntry.content.trim().split(/\s+/).length : 0;
  const charCount = currentEntry.content.length;

  return (
    <div className="space-y-6">
      {/* Save Error Banner with Retry */}
      {saveError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold">Persistence Error</p>
              <p className="text-xs text-rose-700 mt-0.5">{saveError}</p>
            </div>
          </div>
          <button
            id="retry-save-button"
            onClick={handleSaveEntry}
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium transition-colors"
          >
            Retry Save
          </button>
        </div>
      )}

      {/* Main Journal Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Editor Header: Title & Mood */}
        <div className="p-5 sm:p-6 border-b border-slate-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <input
              id="entry-title-input"
              type="text"
              value={currentEntry.title}
              onChange={handleTitleChange}
              placeholder="Title for this reflection..."
              className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none w-full bg-transparent"
            />
            
            {/* Top actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                id="generate-summary-button"
                onClick={handleGenerateSummary}
                disabled={isSummarizing || (!currentEntry.content && currentEntry.messages.length === 0)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer"
                title="Generate AI Summary, Key Takeaways & Emotional Analysis"
              >
                {isSummarizing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing with Gemini...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                    <span>Generate AI Insights</span>
                  </>
                )}
              </button>

              <button
                id="save-entry-button"
                onClick={handleSaveEntry}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition-all shadow-xs active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Syncing...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save to Firestore</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Mood Selector Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            <span className="text-slate-400 font-medium shrink-0 flex items-center gap-1">
              <Smile className="w-3.5 h-3.5" /> Mood:
            </span>
            {MOODS.map(m => (
              <button
                key={m.id}
                id={`mood-select-${m.id}`}
                onClick={() => handleMoodSelect(m.id)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs transition-all cursor-pointer ${
                  currentEntry.mood === m.id
                    ? `${m.color} ring-2 ring-indigo-500/20 font-semibold shadow-xs`
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <span>{m.emoji}</span>
                <span>{m.label}</span>
              </button>
            ))}
          </div>

          {/* Tags & Prompt Inspirations */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1 text-slate-400">
              <Tag className="w-3.5 h-3.5" />
              <span>Tags:</span>
            </div>
            {currentEntry.tags.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs border border-slate-200"
              >
                #{tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-rose-600 p-0.5"
                >
                  ×
                </button>
              </span>
            ))}
            <div className="flex items-center gap-1">
              <input
                id="tag-input-field"
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="Add tag + Enter"
                className="px-2 py-0.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-indigo-500 w-24"
              />
            </div>
          </div>
        </div>

        {/* Guided Prompts Carousel */}
        <div className="px-5 py-2.5 bg-slate-50/70 border-b border-slate-100 flex items-center gap-2 overflow-x-auto text-xs text-slate-500">
          <span className="font-semibold text-slate-700 shrink-0 flex items-center gap-1">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Prompts:
          </span>
          {PROMPT_SUGGESTIONS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleInsertPrompt(p)}
              className="shrink-0 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-colors text-left"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Writing Canvas */}
        <div className="p-5 sm:p-6">
          <textarea
            id="journal-content-textarea"
            value={currentEntry.content}
            onChange={handleContentChange}
            placeholder="Write your personal reflections, experiences, feelings, or ideas here..."
            className="w-full min-h-[220px] font-sans text-base text-slate-800 placeholder:text-slate-300 focus:outline-none resize-y leading-relaxed bg-transparent"
          />

          <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-100">
            <div>
              {wordCount} {wordCount === 1 ? "word" : "words"} · {charCount} characters
            </div>
            <div>
              Created {new Date(currentEntry.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
            </div>
          </div>
        </div>

        {/* AI Summary View Card (if generated) */}
        {currentEntry.aiSummary && (
          <div className="m-5 sm:m-6 p-5 rounded-2xl bg-gradient-to-br from-violet-50/80 via-indigo-50/40 to-slate-50 border border-violet-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-violet-900 font-semibold text-sm">
                <Sparkles className="w-4 h-4 text-violet-600" />
                <span>Gemini Reflection Summary</span>
                {currentEntry.aiSummary.modelUsed && (
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full">
                    {currentEntry.aiSummary.modelUsed}
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-400">
                {new Date(currentEntry.aiSummary.generatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>

            <p className="text-sm text-slate-700 leading-relaxed font-serif italic">
              "{currentEntry.aiSummary.summary}"
            </p>

            {/* Key Takeaways */}
            {currentEntry.aiSummary.keyTakeaways.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                  <ListChecks className="w-3.5 h-3.5 text-indigo-600" /> Key Takeaways
                </p>
                <ul className="space-y-1 text-xs text-slate-600 pl-5 list-disc">
                  {currentEntry.aiSummary.keyTakeaways.map((takeaway, i) => (
                    <li key={i}>{takeaway}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Reflection Questions */}
            {currentEntry.aiSummary.reflectionQuestions.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-violet-600" /> Questions to Ponder
                </p>
                <div className="space-y-1">
                  {currentEntry.aiSummary.reflectionQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(`Let's reflect on this question: "${q}"`)}
                      className="w-full text-left text-xs p-2 rounded-lg bg-white/80 border border-violet-100 hover:bg-white text-violet-800 hover:border-violet-300 transition-colors flex items-center justify-between gap-2"
                    >
                      <span>{q}</span>
                      <ArrowRight className="w-3 h-3 shrink-0 text-violet-400" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Multi-turn Conversation with Gemini */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Chat Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-slate-900 flex items-center gap-2">
                <span>Reflective Dialogue with Gemini</span>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
                  gemini-3.6-flash
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Explore thoughts, reframe challenges, or brainstorm next steps in confidence
              </p>
            </div>
          </div>

          {/* Mode Selector */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setChatMode("reflect")}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                chatMode === "reflect" ? "bg-indigo-600 text-white font-medium shadow-xs" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Reflect
            </button>
            <button
              onClick={() => setChatMode("brainstorm")}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                chatMode === "brainstorm" ? "bg-indigo-600 text-white font-medium shadow-xs" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Brainstorm
            </button>
            <button
              onClick={() => setChatMode("mentor")}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                chatMode === "mentor" ? "bg-indigo-600 text-white font-medium shadow-xs" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Mentor
            </button>
          </div>
        </div>

        {/* Conversation Stream */}
        <div className="p-4 sm:p-6 space-y-4 max-h-[420px] overflow-y-auto bg-slate-50/30">
          {currentEntry.messages.length === 0 ? (
            <div className="text-center py-8 px-4 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-700">Start an AI reflection turn</p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Ask Gemini to reflect on your entry, unpack underlying feelings, or brainstorm solutions.
              </p>

              {/* Starter chips */}
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                {CHAT_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    id={`chat-prompt-chip-${i}`}
                    onClick={() => handleSendMessage(prompt)}
                    className="px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs text-slate-700 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all shadow-2xs"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            currentEntry.messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role !== "user" && (
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-sm ${
                    msg.role === "user"
                      ? "bg-indigo-600 text-white rounded-br-xs"
                      : "bg-white border border-slate-200 text-slate-800 rounded-bl-xs shadow-2xs"
                  }`}
                >
                  {msg.role === "user" ? (
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  ) : (
                    <div className="markdown-content">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  )}

                  <div className="mt-1.5 flex items-center justify-between gap-2 text-[10px] opacity-70">
                    <span>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {msg.modelUsed && (
                      <span className="font-mono">{msg.modelUsed}</span>
                    )}
                  </div>
                </div>

                {msg.role === "user" && (
                  <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-1">
                    <UserIcon className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))
          )}

          {/* AI Thinking Animation */}
          {isAiResponding && (
            <div className="flex gap-3 items-center">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <Bot className="w-3.5 h-3.5 animate-pulse" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-xs px-4 py-3 shadow-2xs flex items-center gap-2 text-xs text-slate-500">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                <span>Gemini is reflecting on your entry...</span>
              </div>
            </div>
          )}

          {/* AI Error Notification */}
          {aiError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{aiError}</span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Chat Input Bar */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-100 flex items-center gap-2">
          <input
            id="chat-message-input"
            type="text"
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={`Ask Gemini for reflections, perspectives, or ideas in ${chatMode} mode...`}
            disabled={isAiResponding}
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-indigo-500 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400"
          />
          <button
            id="chat-send-button"
            onClick={() => handleSendMessage()}
            disabled={!chatInput.trim() || isAiResponding}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 shadow-xs disabled:opacity-40 cursor-pointer active:scale-95"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Reflect</span>
          </button>
        </div>
      </div>
    </div>
  );
};
