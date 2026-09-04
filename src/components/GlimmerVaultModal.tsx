import React, { useState } from "react";
import { 
  Sun, 
  Sparkles, 
  Plus, 
  Trash2, 
  X, 
  Pin, 
  Heart, 
  Wind, 
  TreePine, 
  Award, 
  Smile, 
  ShieldCheck,
  Zap,
  RotateCcw,
  RefreshCw,
  Pickaxe
} from "lucide-react";
import confetti from "canvas-confetti";
import { GlimmerAnchor } from "../types";
import { extractGlimmersWithGemini } from "../lib/geminiService";

interface GlimmerVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  journalContext?: string;
  glimmers: GlimmerAnchor[];
  onSaveGlimmer: (glimmer: GlimmerAnchor) => Promise<void>;
  onDeleteGlimmer: (glimmerId: string) => Promise<void>;
}

const CATEGORY_META = {
  sensory: { label: "Sensory Delight", icon: Sparkles, color: "bg-amber-100 text-amber-800 border-amber-200" },
  connection: { label: "Warm Connection", icon: Heart, color: "bg-rose-100 text-rose-800 border-rose-200" },
  gratitude: { label: "Quiet Gratitude", icon: Smile, color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  nature: { label: "Nature & Awe", icon: TreePine, color: "bg-teal-100 text-teal-800 border-teal-200" },
  achievement: { label: "Tiny Victory", icon: Award, color: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  serenity: { label: "Peace & Grounding", icon: Wind, color: "bg-sky-100 text-sky-800 border-sky-200" },
};

export const GlimmerVaultModal: React.FC<GlimmerVaultModalProps> = ({
  isOpen,
  onClose,
  userId,
  journalContext = "",
  glimmers,
  onSaveGlimmer,
  onDeleteGlimmer,
}) => {
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newGlimmerText, setNewGlimmerText] = useState("");
  const [newGlimmerCategory, setNewGlimmerCategory] = useState<keyof typeof CATEGORY_META>("sensory");
  const [isEmergencyRegulating, setIsEmergencyRegulating] = useState(false);
  const [activeRegulateGlimmer, setActiveRegulateGlimmer] = useState<GlimmerAnchor | null>(null);
  const [isMining, setIsMining] = useState(false);
  const [mineError, setMineError] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredGlimmers = activeFilter === "all" 
    ? glimmers 
    : glimmers.filter(g => g.category === activeFilter);

  const handleCreateGlimmer = async () => {
    if (!newGlimmerText.trim() || !userId) return;

    const newGlimmer: GlimmerAnchor = {
      id: "glimmer-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
      userId,
      text: newGlimmerText.trim(),
      category: newGlimmerCategory,
      createdAt: Date.now(),
      sourceType: "manual",
      isPinned: false,
    };

    try {
      await onSaveGlimmer(newGlimmer);
      confetti({
        particleCount: 30,
        spread: 60,
        origin: { y: 0.7 },
        colors: ["#fbbf24", "#34d399", "#60a5fa"],
      });
      setNewGlimmerText("");
      setIsAddingNew(false);
    } catch (err) {
      console.error("Failed to save glimmer:", err);
    }
  };

  const handleMineGlimmers = async () => {
    if (!journalContext.trim() || !userId) {
      setMineError("Please write some reflection content in your journal first to mine glimmers.");
      return;
    }

    setMineError(null);
    setIsMining(true);

    try {
      const res = await extractGlimmersWithGemini({ text: journalContext });
      if (res.glimmers && res.glimmers.length > 0) {
        for (const item of res.glimmers) {
          const category = (item.category.toLowerCase() in CATEGORY_META) 
            ? (item.category.toLowerCase() as keyof typeof CATEGORY_META) 
            : "sensory";

          const newGlimmer: GlimmerAnchor = {
            id: "glimmer-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
            userId,
            text: item.text,
            category,
            createdAt: Date.now(),
            sourceType: "mined_from_journal",
            isPinned: false,
          };
          await onSaveGlimmer(newGlimmer);
        }

        confetti({
          particleCount: 45,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#14b8a6", "#f59e0b", "#6366f1"],
        });
      } else {
        setMineError("No distinct glimmers detected. Try adding one manually!");
      }
    } catch (err: any) {
      console.error("Failed to mine glimmers:", err);
      setMineError(err.message || "Failed to extract glimmers with Gemini.");
    } finally {
      setIsMining(false);
    }
  };

  const startEmergencyVagalReset = () => {
    if (glimmers.length === 0) return;
    const random = glimmers[Math.floor(Math.random() * glimmers.length)];
    setActiveRegulateGlimmer(random);
    setIsEmergencyRegulating(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        id="glimmer-vault-modal"
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-50 via-teal-50 to-sky-50 border-b border-slate-200/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-teal-600 flex items-center justify-center text-white shadow-xs">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif font-bold text-lg text-slate-900">Glimmer Vault</h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  Quiet Sparks
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Micro-moments of comfort, awe, and joy that brighten your day
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {glimmers.length > 0 && !isEmergencyRegulating && (
              <button
                id="emergency-glimmer-btn"
                onClick={startEmergencyVagalReset}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-600 hover:to-emerald-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
                title="Tap for an instant reminder of calm and joy"
              >
                <Zap className="w-3.5 h-3.5 text-amber-200 animate-pulse" />
                <span>Quick Joy Anchor</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-white/80 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-slate-800">
          {/* Mining Banner / Error */}
          {mineError && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
              <span>{mineError}</span>
              <button onClick={() => setMineError(null)} className="font-bold text-amber-700 ml-2">×</button>
            </div>
          )}

          {/* Emergency Vagus Reset Mode */}
          {isEmergencyRegulating && activeRegulateGlimmer ? (
            <div className="py-8 px-6 text-center space-y-6 bg-gradient-to-b from-amber-50/50 to-teal-50/50 rounded-2xl border border-amber-200/70 animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-sm animate-pulse">
                <Sun className="w-8 h-8" />
              </div>

              <div className="space-y-2 max-w-md mx-auto">
                <span className="text-[10px] uppercase font-bold tracking-widest text-amber-800 bg-amber-100 px-3 py-1 rounded-full">
                  Calming Anchor
                </span>
                <h3 className="font-serif font-bold text-xl text-slate-900 leading-snug">
                  "{activeRegulateGlimmer.text}"
                </h3>
                <p className="text-xs text-slate-600">
                  Slowly exhale for 6 seconds. Take a moment to enjoy the comfort and warmth of this memory.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    const others = glimmers.filter(g => g.id !== activeRegulateGlimmer.id);
                    if (others.length > 0) {
                      setActiveRegulateGlimmer(others[Math.floor(Math.random() * others.length)]);
                    }
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Next Glimmer</span>
                </button>

                <button
                  onClick={() => setIsEmergencyRegulating(false)}
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                >
                  Return to Vault
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Category Filter Pills & Mining/Add Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => setActiveFilter("all")}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      activeFilter === "all"
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    All Glimmers ({glimmers.length})
                  </button>

                  {Object.entries(CATEGORY_META).map(([catKey, meta]) => {
                    const count = glimmers.filter(g => g.category === catKey).length;
                    return (
                      <button
                        key={catKey}
                        onClick={() => setActiveFilter(catKey)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1 ${
                          activeFilter === catKey
                            ? "bg-slate-900 text-white shadow-xs"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        <span>{meta.label}</span>
                        <span className="text-[10px] opacity-70">({count})</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2">
                  {journalContext.trim() && (
                    <button
                      onClick={handleMineGlimmers}
                      disabled={isMining}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800 text-xs font-semibold shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                      title="Mine micro-moments of joy from your current journal text"
                    >
                      {isMining ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-600" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                      )}
                      <span>{isMining ? "Mining..." : "Mine from Journal"}</span>
                    </button>
                  )}

                  {!isAddingNew && (
                    <button
                      id="add-glimmer-btn"
                      onClick={() => setIsAddingNew(true)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Log Glimmer</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Add Glimmer Form */}
              {isAddingNew && (
                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      Capture a 10-Second Micro-Moment of Safety/Joy
                    </span>
                    <button
                      onClick={() => setIsAddingNew(false)}
                      className="text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <input
                    type="text"
                    value={newGlimmerText}
                    onChange={(e) => setNewGlimmerText(e.target.value)}
                    placeholder="e.g. 'The smell of fresh rain on warm asphalt', 'A smile from the barista', 'A slow deep breath at my desk'..."
                    className="w-full p-2.5 rounded-lg border border-amber-300 bg-white text-slate-900 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all font-sans"
                    autoFocus
                  />

                  {/* Category Selector */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {Object.entries(CATEGORY_META).map(([catKey, meta]) => (
                      <button
                        key={catKey}
                        onClick={() => setNewGlimmerCategory(catKey as any)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                          newGlimmerCategory === catKey
                            ? `${meta.color} font-bold shadow-xs`
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {meta.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => setIsAddingNew(false)}
                      className="px-3 py-1.5 rounded-lg text-xs text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateGlimmer}
                      disabled={!newGlimmerText.trim()}
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-all disabled:opacity-50 cursor-pointer active:scale-95"
                    >
                      Anchor in Vault
                    </button>
                  </div>
                </div>
              )}

              {/* Glimmers List Grid */}
              {filteredGlimmers.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredGlimmers.map((glimmer) => {
                    const meta = CATEGORY_META[glimmer.category as keyof typeof CATEGORY_META] || CATEGORY_META.serenity;
                    const IconComp = meta.icon;

                    return (
                      <div
                        key={glimmer.id}
                        className="group relative p-4 rounded-xl bg-white border border-slate-200 hover:border-amber-300 hover:shadow-sm transition-all flex flex-col justify-between space-y-3"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${meta.color}`}>
                              <IconComp className="w-3 h-3" />
                              <span>{meta.label}</span>
                            </span>

                            <button
                              onClick={() => onDeleteGlimmer(glimmer.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all cursor-pointer"
                              title="Delete Glimmer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <p className="text-xs text-slate-800 font-serif leading-relaxed font-medium">
                            "{glimmer.text}"
                          </p>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-100">
                          <span>{new Date(glimmer.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                          <span className="capitalize">{glimmer.sourceType.replace('_', ' ')}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center space-y-3 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
                    <Sun className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-800">Your Glimmer Vault is Empty</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Log your first 10-second sensory joy, or let Gemini mine them automatically as you journal.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsAddingNew(true)}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
                  >
                    Add Your First Glimmer
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200/70 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Persisted isolated under <code className="font-mono text-[10px]">/users/{userId || 'guest'}/glimmers</code></span>
          </div>
          <span>Joy & Calming Anchors</span>
        </div>
      </div>
    </div>
  );
};
