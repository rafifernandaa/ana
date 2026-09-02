/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { 
  Sparkles, 
  Shield, 
  Lock, 
  BrainCircuit, 
  Database, 
  ArrowRight, 
  CheckCircle2, 
  Feather, 
  MessageSquareQuote 
} from "lucide-react";

interface LandingHeroProps {
  onSignIn: () => void;
  isLoading?: boolean;
}

export const LandingHero: React.FC<LandingHeroProps> = ({ onSignIn, isLoading = false }) => {
  return (
    <div className="relative overflow-hidden pt-8 pb-16 px-4 sm:px-6 lg:px-8">
      {/* Decorative backdrop elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-indigo-50/60 via-violet-50/30 to-transparent pointer-events-none -z-10" />

      <div className="max-w-4xl mx-auto text-center space-y-8">
        {/* Badges */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-indigo-100 text-indigo-700 text-xs font-semibold shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>Gemini 3.6 Flash & Cloud Firestore Integration</span>
        </div>

        {/* Hero Headline */}
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-slate-900 tracking-tight leading-tight">
            Reflect deeper with an empathetic AI partner.
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Write daily journal reflections, brainstorm thoughts with Gemini in multi-turn dialogues, 
            and keep your personal insights strictly isolated in private Firestore storage.
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            id="landing-signin-button"
            onClick={onSignIn}
            disabled={isLoading}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-base shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3 disabled:opacity-75 active:scale-98 cursor-pointer"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{isLoading ? "Connecting with Google..." : "Sign In with Google"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10 text-left">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Feather className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900 text-base">Multi-turn Reflections</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Pour your unedited thoughts onto the page. Engage Gemini to ask clarifying questions, explore emotional nuances, or brainstorm solutions.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900 text-base">Instant AI Summarization</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Generate structured executive takeaways, emotional mood assessments, and introspective action prompts with a single click.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900 text-base">Owner-Bound Firestore Isolation</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Zero insecure defaults. Entries and interactions are stored strictly under <code className="text-xs font-mono bg-slate-100 px-1 py-0.5 rounded text-emerald-700">/users/{'{userId}'}/...</code> with rules enforcement.
            </p>
          </div>
        </div>

        {/* Security & Authentication assurance guarantee */}
        <div className="p-4 rounded-xl bg-slate-100/80 border border-slate-200 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Google Federated Auth (No stored passwords)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Resilient 4-Model Fallback Ladder</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Zero-Hardcoded Secrets</span>
          </div>
        </div>
      </div>
    </div>
  );
};
