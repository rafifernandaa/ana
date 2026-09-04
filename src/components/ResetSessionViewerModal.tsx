/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { 
  X, 
  Sparkles, 
  Trash2, 
  Clock, 
  Compass, 
  Flame, 
  Sun, 
  Activity, 
  ShieldCheck, 
  FileText 
} from "lucide-react";
import { ResetSession } from "../types";

interface ResetSessionViewerModalProps {
  session: ResetSession | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleteSession?: (sessionId: string) => void | Promise<void>;
}

export const ResetSessionViewerModal: React.FC<ResetSessionViewerModalProps> = ({
  session,
  isOpen,
  onClose,
  onDeleteSession,
}) => {
  if (!isOpen || !session) return null;

  const chosenReframe = session.chosenReframeIndex !== null && session.reframes[session.chosenReframeIndex]
    ? session.reframes[session.chosenReframeIndex]
    : session.reframes[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center border border-indigo-400/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-base text-white">
                  Reset Room Session
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-200 border border-indigo-400/30">
                  {session.mode.toUpperCase()} RESET
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                {new Date(session.createdAt).toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit"
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onDeleteSession && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("Are you sure you want to delete this Reset Session?")) {
                    onDeleteSession(session.id);
                    onClose();
                  }
                }}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                title="Delete Session"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Shift Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                Initial State
              </span>
              <p className="font-serif font-bold text-base text-slate-800 mt-0.5">
                "{session.beforeWord}"
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Tension {session.bodyMap.intensity}/5 in {session.bodyMap.zones.join(", ")}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200">
              <span className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider block">
                Shifted State
              </span>
              <p className="font-serif font-bold text-base text-emerald-950 mt-0.5">
                "{session.afterWord}"
              </p>
              <p className="text-[11px] text-emerald-700 mt-1">
                Affect: {session.affectLabel}
              </p>
            </div>
          </div>

          {/* Extracted Dark Sentence */}
          <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs text-amber-300 font-semibold">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Extracted Core Tension:</span>
            </div>
            <p className="font-serif italic text-sm text-slate-100 pl-2 border-l-2 border-amber-400">
              "{session.extractedDarkSentence}"
            </p>
          </div>

          {/* Chosen Reframe */}
          {chosenReframe && (
            <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs text-indigo-900 font-bold">
                <Compass className="w-4 h-4 text-indigo-600" />
                <span>Anchor Reframe ({chosenReframe.title}):</span>
              </div>
              <p className="font-serif italic text-xs sm:text-sm text-slate-800">
                "{chosenReframe.text}"
              </p>
              <p className="text-[11px] text-slate-500 pt-1">
                {chosenReframe.rationale}
              </p>
            </div>
          )}

          {/* Glimmer */}
          {session.glimmer && (
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs text-amber-900 font-semibold">
                <Sun className="w-4 h-4 text-amber-600" />
                <span>Captured Glimmer:</span>
              </div>
              <p className="font-serif italic text-xs sm:text-sm text-slate-800">
                "{session.glimmer}"
              </p>
            </div>
          )}

          {/* Free Writing Transcript */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Expressive Stream Transcript:</span>
            </span>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-serif text-slate-700 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap">
              {session.writingContent}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Encrypted in isolated path</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
