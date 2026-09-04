import React, { useState, useEffect, useRef } from "react";
import { 
  Copy, 
  FoldHorizontal, 
  MoreHorizontal, 
  Check, 
  Sparkles, 
  Save, 
  Activity, 
  Scissors, 
  Sun, 
  Wind, 
  BrainCircuit, 
  Plus,
  Trash2
} from "lucide-react";
import { JournalEntry, JournalMood } from "../types";

interface MarkdownWorkspaceEditorProps {
  entry: JournalEntry | null;
  onSave: (entry: JournalEntry) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onNewEntry: () => void;
  isSaving: boolean;
  saveError: string | null;
  onOpenResetRoom?: () => void;
  onOpenSynapticPruner?: () => void;
  onOpenDecenteringStation?: () => void;
  onOpenGlimmerVault?: () => void;
}

const ALL_MOODS: { id: JournalMood; label: string }[] = [
  { id: "reflective", label: "Reflective" },
  { id: "grateful", label: "Grateful" },
  { id: "peaceful", label: "Peaceful" },
  { id: "energized", label: "Energetic" },
  { id: "focused", label: "Focused" },
  { id: "creative", label: "Creative" },
  { id: "challenged", label: "Challenging" },
];

export const MarkdownWorkspaceEditor: React.FC<MarkdownWorkspaceEditorProps> = ({
  entry,
  onSave,
  onDelete,
  onNewEntry,
  isSaving,
  saveError,
  onOpenResetRoom,
  onOpenSynapticPruner,
  onOpenDecenteringStation,
  onOpenGlimmerVault,
}) => {
  const [title, setTitle] = useState(entry?.title || "Untitled Entry");
  const [content, setContent] = useState(entry?.content || "");
  const [selectedMood, setSelectedMood] = useState<JournalMood>(entry?.mood || "reflective");
  const [tags, setTags] = useState<string[]>(entry?.tags && entry.tags.length > 0 ? entry.tags : ["reflection", "clarity", "stress-reset"]);
  const [isCopied, setIsCopied] = useState(false);
  const [activeLine, setActiveLine] = useState<number>(12);
  const [isAddingMood, setIsAddingMood] = useState(false);
  const [newMoodInput, setNewMoodInput] = useState("");
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagInput, setNewTagInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync state when entry changes
  useEffect(() => {
    if (entry) {
      setTitle(entry.title || "Untitled Entry");
      setContent(entry.content || "");
      setSelectedMood(entry.mood || "reflective");
      if (entry.tags && entry.tags.length > 0) {
        setTags(entry.tags);
      }
    }
  }, [entry?.id]);

  // Debounced auto-save when editing
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const triggerAutoSave = (updatedFields: Partial<JournalEntry>) => {
    if (!entry) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      const updated: JournalEntry = {
        ...entry,
        ...updatedFields,
        updatedAt: Date.now(),
      };
      onSave(updated);
    }, 800);
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    triggerAutoSave({ title: newTitle });
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    triggerAutoSave({ content: newContent });
  };

  const handleMoodSelect = (mood: JournalMood) => {
    setSelectedMood(mood);
    triggerAutoSave({ mood });
  };

  const handleCopyMarkdown = () => {
    const fullMarkdown = `# ${title}
> Mindful stress reset & reflection journal
> Isolated on Cloud Firestore

---

## Prompt of the Day
**What is taking up most of your mental energy right now?**

## Mood
${selectedMood}

## Tags
${tags.map(t => `#${t}`).join("  ")}

## Thoughts
${content}
`;
    navigator.clipboard.writeText(fullMarkdown);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newTagInput.trim().replace(/^#/, "");
    if (clean && !tags.includes(clean)) {
      const updated = [...tags, clean];
      setTags(updated);
      triggerAutoSave({ tags: updated });
    }
    setNewTagInput("");
    setIsAddingTag(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updated = tags.filter(t => t !== tagToRemove);
    setTags(updated);
    triggerAutoSave({ tags: updated });
  };

  const handleReviewPromptAction = (index: number) => {
    setActiveLine(21 + index);
    if (index === 1 && onOpenDecenteringStation) {
      onOpenDecenteringStation();
    } else if (index === 2 && onOpenResetRoom) {
      onOpenResetRoom();
    } else if (index === 3 && onOpenSynapticPruner) {
      onOpenSynapticPruner();
    } else if (index === 4) {
      handleContentChange(content + (content ? "\n\n" : "") + "### Wise Distinction:\nWhat is within my control vs outside my control here?");
      textareaRef.current?.focus();
    } else if (index === 5) {
      handleContentChange(content + (content ? "\n\n" : "") + "### 3-Lens Shift:\n- Compassion Lens:\n- 1-Year Horizon Lens:\n- Agency Lens:");
      textareaRef.current?.focus();
    } else if (index === 6 && onOpenResetRoom) {
      onOpenResetRoom();
    }
  };

  // Generate gutter numbers 1 to 32 exactly like in the screenshot
  const gutterLines = Array.from({ length: 32 }, (_, i) => i + 1);

  return (
    <div 
      className="flex flex-col h-full bg-[#1e1e1e] border border-[#3D4028] rounded-xl overflow-hidden shadow-2xl font-mono select-none"
      id="markdown-workspace-editor"
    >
      {/* Top Window Tab Bar */}
      <div className="h-9 bg-[#181818] border-b border-[#3D4028] px-3 flex items-center justify-between shrink-0 text-xs">
        {/* Active Tab */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1 bg-[#262626] border-t-2 border-t-[#AD3D30] border-x border-[#3D4028] rounded-t text-slate-200 font-semibold text-[11px] shadow-inner">
            <span className="text-[#A3A649]">ana://new-entry.md</span>
            <button 
              onClick={onNewEntry}
              className="text-[#8C8C8C] hover:text-white transition-colors cursor-pointer text-xs leading-none ml-1"
              title="Reset / New Buffer"
            >
              ✕
            </button>
          </div>
          
          {/* Sync status indicator */}
          <div className="flex items-center gap-1.5 text-[11px] font-medium ml-1">
            <span className={`w-2 h-2 rounded-full ${isSaving ? "bg-[#AD3D30] animate-ping" : "bg-[#A3A649]"}`} />
            <span className={isSaving ? "text-[#AD3D30]" : "text-[#8C8C8C]"}>
              {isSaving ? "Saving..." : "Unsaved"}
            </span>
          </div>
        </div>

        {/* Tab Controls (fold, copy, more) */}
        <div className="flex items-center gap-1.5 text-[#8C8C8C]">
          <button 
            onClick={() => setActiveLine(12)}
            className="p-1 hover:text-white hover:bg-[#262626] rounded transition-colors cursor-pointer"
            title="Fold / Unfold"
          >
            <FoldHorizontal className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={handleCopyMarkdown}
            className="p-1 hover:text-white hover:bg-[#262626] rounded transition-colors cursor-pointer"
            title="Copy Raw Markdown"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-[#A3A649]" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button 
            onClick={onOpenResetRoom}
            className="p-1 hover:text-white hover:bg-[#262626] rounded transition-colors cursor-pointer"
            title="More Actions"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Editor Main Canvas */}
      <div className="flex-1 flex overflow-hidden bg-[#181818] relative">
        {/* Editor Body Text */}
        <div className="flex-1 overflow-y-auto p-3 text-xs sm:text-[13px] font-mono leading-6 space-y-1 relative text-[#e2e8f0]">
          {/* Active Line Highlight overlay on line 12 (or clicked line) */}
          <div 
            className="absolute left-0 right-0 bg-[#3D4028]/20 pointer-events-none border-y border-[#3D4028]/30 transition-all duration-150"
            style={{ 
              top: `${(activeLine - 1) * 24 + 12}px`, 
              height: "24px" 
            }}
          />

          {/* Line 1: Title */}
          <div className="flex items-center gap-2 group cursor-text">
            <span className="text-[#AD3D30] font-bold">#</span>
            <input
              id="markdown-entry-title-input"
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              onFocus={() => setActiveLine(1)}
              className="bg-transparent text-white font-bold text-base focus:outline-hidden flex-1 tracking-tight"
              placeholder="Untitled Entry"
            />
          </div>

          {/* Line 2: Subtitle Quote 1 */}
          <div className="text-[#8C8C8C] cursor-pointer" onClick={() => setActiveLine(2)}>
            <span className="text-[#A3A649] font-bold">&gt;</span> Mindful stress reset & reflection journal
          </div>

          {/* Line 3: Subtitle Quote 2 */}
          <div className="text-[#8C8C8C] cursor-pointer" onClick={() => setActiveLine(3)}>
            <span className="text-[#A3A649] font-bold">&gt;</span> Isolated on Cloud Firestore
          </div>

          {/* Line 4: Divider */}
          <div className="text-[#3D4028] py-0.5 cursor-pointer select-none" onClick={() => setActiveLine(4)}>
            ---
          </div>

          {/* Line 5: Empty space */}
          <div className="h-6" onClick={() => setActiveLine(5)} />

          {/* Line 6: Heading Prompt of the Day */}
          <div className="text-[#A3A649] font-bold flex items-center gap-1 cursor-pointer" onClick={() => setActiveLine(6)}>
            <span className="text-[#AD3D30]">##</span> Prompt of the Day
          </div>

          {/* Line 7-8: Prompt content */}
          <div className="text-white font-semibold pl-2 cursor-pointer leading-snug" onClick={() => setActiveLine(7)}>
            **What is taking up most of your mental energy right now?**
          </div>

          {/* Line 9: Empty space */}
          <div className="h-6" onClick={() => setActiveLine(9)} />

          {/* Line 10: Mood Heading */}
          <div className="text-[#A3A649] font-bold flex items-center gap-1 cursor-pointer" onClick={() => setActiveLine(10)}>
            <span className="text-[#AD3D30]">##</span> Mood
          </div>

          {/* Line 11: Empty space */}
          <div className="h-6" onClick={() => setActiveLine(11)} />

          {/* Line 12 & 13: Mood Chips exactly formatted as in screenshot */}
          <div className="flex flex-wrap items-center gap-1.5 py-1 pl-1" onClick={() => setActiveLine(12)}>
            {ALL_MOODS.map(m => {
              const isSelected = selectedMood === m.id;
              return (
                <button
                  key={m.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveLine(12);
                    handleMoodSelect(m.id);
                  }}
                  className={`px-2.5 py-0.5 rounded-full text-xs font-mono transition-all cursor-pointer flex items-center gap-1 ${
                    isSelected
                      ? "bg-[#3D4028] text-[#A3A649] border border-[#A3A649] font-bold shadow-xs"
                      : "bg-[#262626] text-[#8C8C8C] border border-[#3D4028] hover:text-white hover:border-[#8C8C8C]"
                  }`}
                >
                  <span className="text-[#AD3D30]">✧</span>
                  <span>{m.label}</span>
                </button>
              );
            })}
            
            {/* Add mood chip button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveLine(13);
                setIsAddingMood(true);
              }}
              className="px-2.5 py-0.5 rounded-full text-xs font-mono text-[#8C8C8C] hover:text-white bg-[#262626] border border-[#3D4028] hover:border-[#A3A649] transition-all cursor-pointer flex items-center gap-1"
            >
              <span className="text-[#A3A649]">+</span>
              <span>Add mood</span>
            </button>
          </div>

          {/* Line 14: Empty space */}
          <div className="h-6" onClick={() => setActiveLine(14)} />

          {/* Line 15: Tags Heading */}
          <div className="text-[#A3A649] font-bold flex items-center gap-1 cursor-pointer" onClick={() => setActiveLine(15)}>
            <span className="text-[#AD3D30]">##</span> Tags
          </div>

          {/* Line 16: Tags List */}
          <div className="flex flex-wrap items-center gap-2 pl-2 py-1" onClick={() => setActiveLine(16)}>
            {tags.map(tag => (
              <span 
                key={tag}
                className="text-[#8C8C8C] hover:text-white transition-colors cursor-pointer group flex items-center gap-1 text-xs"
                onClick={() => handleRemoveTag(tag)}
                title="Click to remove tag"
              >
                <span className="text-[#AD3D30]">#</span>{tag}
              </span>
            ))}
            {isAddingTag ? (
              <form onSubmit={handleAddTag} className="inline-flex items-center gap-1">
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  placeholder="tag"
                  className="w-16 bg-[#262626] border border-[#3D4028] text-xs px-1 py-0.5 rounded text-white focus:outline-hidden"
                  autoFocus
                  onBlur={() => setIsAddingTag(false)}
                />
              </form>
            ) : (
              <button
                onClick={() => setIsAddingTag(true)}
                className="text-[#8C8C8C]/60 hover:text-[#A3A649] text-xs cursor-pointer"
              >
                +
              </button>
            )}
          </div>

          {/* Line 17: Empty space */}
          <div className="h-6" onClick={() => setActiveLine(17)} />

          {/* Line 18: Review Prompts Heading */}
          <div className="text-[#A3A649] font-bold flex items-center gap-1 cursor-pointer" onClick={() => setActiveLine(18)}>
            <span className="text-[#AD3D30]">##</span> Review Prompts for this Entry
          </div>

          {/* Line 19-24: 6 Review Prompts List */}
          <div className="pl-2 space-y-0.5 py-1">
            {[
              { id: 1, label: "Vent to Clarity" },
              { id: 2, label: "Stress Reset" },
              { id: 3, label: "Untangle Thought" },
              { id: 4, label: "Wise Distinctions" },
              { id: 5, label: "3-Lens Shift" },
              { id: 6, label: "Calm Breath" },
            ].map(prompt => (
              <div 
                key={prompt.id}
                onClick={() => handleReviewPromptAction(prompt.id)}
                className="flex items-center gap-2 text-[#8C8C8C] hover:text-white hover:translate-x-1 transition-all cursor-pointer group py-0.5"
              >
                <span className="text-[#AD3D30] font-bold">{prompt.id}.</span>
                <span className="group-hover:text-[#A3A649] font-medium">{prompt.label}</span>
              </div>
            ))}
          </div>

          {/* Line 25: Empty space */}
          <div className="h-6" onClick={() => setActiveLine(25)} />

          {/* Line 26: Thoughts Heading */}
          <div className="text-[#A3A649] font-bold flex items-center gap-1 cursor-pointer" onClick={() => setActiveLine(26)}>
            <span className="text-[#AD3D30]">##</span> Thoughts
          </div>

          {/* Line 27+: Freeform Thoughts Textarea */}
          <div className="pl-2 pt-1">
            <textarea
              ref={textareaRef}
              id="markdown-entry-thoughts-textarea"
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              onFocus={() => setActiveLine(28)}
              placeholder="Write your thoughts, feelings, challenges, or experiences freely here... |"
              rows={8}
              className="w-full bg-transparent text-[#e2e8f0] text-xs sm:text-[13px] font-mono leading-relaxed placeholder-[#8C8C8C]/50 focus:outline-hidden resize-none border-none"
            />
          </div>
        </div>
      </div>

      {/* Bottom Powerline / Statusbar matching screenshot */}
      <div className="h-7 bg-[#181818] border-t border-[#3D4028] px-3 flex items-center justify-between text-[11px] font-mono text-[#8C8C8C] shrink-0 select-none">
        {/* Left segment */}
        <div className="flex items-center gap-3">
          <span className="bg-[#262626] border border-[#3D4028] text-[#A3A649] font-bold px-2 py-0.5 rounded text-[10px]">
            [ NORMAL ]
          </span>
          <span className="text-white font-medium">ana://new-entry.md</span>
        </div>

        {/* Right segment */}
        <div className="flex items-center gap-3">
          <span className="text-[#8C8C8C]">Md</span>
          <span className="text-white font-mono">Ln {activeLine}, Col 41</span>
          <span className="text-[#8C8C8C]">Spaces: 2</span>
        </div>
      </div>
    </div>
  );
};
