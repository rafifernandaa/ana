/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, 
  Shield, 
  BrainCircuit, 
  ArrowRight, 
  CheckCircle2, 
  Feather, 
  Wind,
  Sun,
  Lock,
  ChevronDown,
  Activity,
  Compass,
  Camera,
  Target,
  Zap,
  BarChart2,
  Sunrise,
  Moon
} from "lucide-react";
import { BookScene } from "./3d/BookScene";

interface LandingHeroProps {
  onSignIn: () => void;
  isLoading?: boolean;
}

export const LandingHero: React.FC<LandingHeroProps> = ({ onSignIn, isLoading = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeAct, setActiveAct] = useState(0);

  // Measure scroll progress through the narrative container
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const totalScrollable = containerRef.current.scrollHeight - window.innerHeight;
      if (totalScrollable <= 0) return;

      const currentScroll = Math.max(0, -rect.top);
      const progress = Math.min(1, Math.max(0, currentScroll / totalScrollable));
      setScrollProgress(progress);

      // Determine active chapter (0 to 4)
      if (progress < 0.2) setActiveAct(0);
      else if (progress < 0.45) setActiveAct(1);
      else if (progress < 0.7) setActiveAct(2);
      else if (progress < 0.88) setActiveAct(3);
      else setActiveAct(4);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Jump to specific act
  const scrollToAct = (actIndex: number) => {
    if (!containerRef.current) return;
    const totalScrollable = containerRef.current.scrollHeight - window.innerHeight;
    const actTargets = [0, 0.32, 0.58, 0.78, 0.96];
    const targetScrollY = containerRef.current.offsetTop + actTargets[actIndex] * totalScrollable;
    window.scrollTo({ top: targetScrollY, behavior: "smooth" });
  };

  const acts = [
    { id: 0, label: "Awakening", icon: Feather },
    { id: 1, label: "Vent-to-Clarity", icon: BrainCircuit },
    { id: 2, label: "Polyvagal Reset", icon: Wind },
    { id: 3, label: "Circadian Closure", icon: Sun },
    { id: 4, label: "Sovereign Vault", icon: Shield },
  ];

  return (
    <div ref={containerRef} className="relative min-h-[480vh] bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Fixed Background 3D Book Stage */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Soft Radial Ambient Lights */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-indigo-900/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-amber-900/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-2/3 left-1/4 w-[500px] h-[500px] bg-emerald-900/10 rounded-full blur-3xl pointer-events-none" />

        {/* 3D React Three Fiber Canvas */}
        <BookScene scrollProgress={scrollProgress} />
      </div>

      {/* Floating Side Chapter Progress Navigator (Desktop) */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-30 hidden lg:flex flex-col gap-2.5 bg-slate-900/70 backdrop-blur-md p-2 rounded-2xl border border-slate-800/80 shadow-2xl">
        {acts.map((act) => {
          const Icon = act.icon;
          const isActive = activeAct === act.id;
          return (
            <button
              key={act.id}
              onClick={() => scrollToAct(act.id)}
              className={`group flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                isActive
                  ? "bg-indigo-600 text-white font-semibold shadow-md"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
              title={`Scroll to ${act.label}`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-indigo-200" : "text-slate-400 group-hover:text-indigo-300"}`} />
              <span className="hidden xl:inline text-[11px] whitespace-nowrap">{act.label}</span>
            </button>
          );
        })}
      </div>

      {/* Narrative Scroll Flow Overlays */}
      <div className="relative z-10">
        {/* ACT I: HERO / AWAKENING (0vh - 100vh) */}
        <section className="min-h-screen flex flex-col justify-between items-center px-4 sm:px-6 lg:px-8 pt-16 pb-12 text-center">
          <div className="w-full max-w-4xl mx-auto space-y-6">
            {/* Top Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/80 border border-indigo-500/30 text-indigo-300 text-xs font-semibold backdrop-blur-md shadow-lg">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Interactive 3D Chronicle · Gemini 3.6 Resilient Ladder</span>
            </div>

            {/* Title */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif font-bold text-white tracking-tight leading-tight">
              The living journal that <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-violet-200 to-amber-200">
                rewires your nervous system.
              </span>
            </h1>

            {/* Description */}
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed font-light">
              As you turn these pages, deconstruct emotional rumination into camera-verifiable facts, 
              anchor ventral vagal glimmers, and store every reflection in owner-bound private Firestore storage.
            </p>

            {/* Main Sign In CTA */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                id="landing-hero-primary-signin"
                onClick={onSignIn}
                disabled={isLoading}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-medium text-base shadow-xl hover:shadow-indigo-500/25 transition-all flex items-center justify-center gap-3 disabled:opacity-75 active:scale-98 cursor-pointer"
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
                <span>{isLoading ? "Connecting Securely..." : "Sign In with Google"}</span>
                <ArrowRight className="w-4 h-4 text-indigo-200" />
              </button>
            </div>
          </div>

          {/* Bottom Scroll Indicator */}
          <div className="flex flex-col items-center gap-2 text-slate-400 text-xs font-mono tracking-widest uppercase animate-bounce pt-8">
            <span>Scroll down to turn the pages</span>
            <ChevronDown className="w-4 h-4 text-indigo-400" />
          </div>
        </section>

        {/* ACT II: VENT-TO-CLARITY (100vh - 200vh) */}
        {/* Book slides to the LEFT; Card sits on the RIGHT */}
        <section className="min-h-screen flex items-center px-4 sm:px-8 lg:px-16 py-20">
          <div className="w-full max-w-7xl mx-auto flex justify-end">
            <div className="w-full md:w-1/2 lg:w-5/12 bg-slate-900/85 backdrop-blur-xl border border-indigo-500/20 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
                <BrainCircuit className="w-4 h-4 text-indigo-400" />
                <span>Feature I · Psychiatric Decentering</span>
              </div>

              <div className="space-y-3">
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white leading-snug">
                  Transform raw venting into facts and cognitive agency.
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed font-light">
                  Unfiltered venting alone often entrenches recursive emotional loops. Our clinical decentering engine separates objective reality from emotional projections.
                </p>
              </div>

              {/* 4 Pillars Breakdown */}
              <div className="space-y-2.5 pt-2">
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-3">
                  <Camera className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-semibold text-white">Courtroom Camera Facts</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">Filters out editorializing; preserves only verifiable events.</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-3">
                  <Target className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-semibold text-white">Circle of Control Mapping</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">Direct agency on one side; surrendered uncontrollable factors on the other.</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-3">
                  <Zap className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-semibold text-white">5-Minute Micro-Action Anchor</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">Concrete, immediate behavioral step to break paralysis.</p>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>Anti-rumination countdown timer</span>
                <span className="text-indigo-400 font-mono text-[11px]">3-Minute Focused Vent</span>
              </div>
            </div>
          </div>
        </section>

        {/* ACT III: POLYVAGAL GLIMMERS (200vh - 300vh) */}
        {/* Book slides to the RIGHT; Card sits on the LEFT */}
        <section className="min-h-screen flex items-center px-4 sm:px-8 lg:px-16 py-20">
          <div className="w-full max-w-7xl mx-auto flex justify-start">
            <div className="w-full md:w-1/2 lg:w-5/12 bg-slate-900/85 backdrop-blur-xl border border-teal-500/20 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-teal-950/80 border border-teal-500/30 text-teal-300 text-xs font-semibold">
                <Wind className="w-4 h-4 text-teal-400" />
                <span>Feature II · Autonomic Regulation</span>
              </div>

              <div className="space-y-3">
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white leading-snug">
                  Engage the ventral vagal brake through glimmers and breath.
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed font-light">
                  The nervous system cannot integrate cognitive insight while trapped in sympathetic fight-or-flight. Polyvagal glimmers anchor physiological safety.
                </p>
              </div>

              {/* Feature Highlights */}
              <div className="space-y-2.5 pt-2">
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-3">
                  <Sparkles className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-semibold text-white">Polyvagal Glimmer Vault</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">Mine sensory micro-moments that signal peace to your brainstem.</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-3">
                  <Activity className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-semibold text-white">Dual Physiological Sigh Pacer</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">Stanford-validated dual-inhalation breathing with live harmonic audio.</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-3">
                  <BarChart2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-semibold text-white">Heart Rate Variability Stabilization</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">Down-regulates cortisol and activates parasympathetic recovery.</p>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>4s Inhale · 1.5s Top-Up · 6s Exhale</span>
                <span className="text-teal-400 font-mono text-[11px]">Stanford Bio-Rhythm</span>
              </div>
            </div>
          </div>
        </section>

        {/* ACT IV: CIRCADIAN DAY-BOUNDARIES (300vh - 400vh) */}
        {/* Book slides to the LEFT; Card sits on the RIGHT */}
        <section className="min-h-screen flex items-center px-4 sm:px-8 lg:px-16 py-20">
          <div className="w-full max-w-7xl mx-auto flex justify-end">
            <div className="w-full md:w-1/2 lg:w-5/12 bg-slate-900/85 backdrop-blur-xl border border-amber-500/20 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-amber-950/80 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                <Sun className="w-4 h-4 text-amber-400" />
                <span>Feature III · Circadian Day-Boundaries</span>
              </div>

              <div className="space-y-3">
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white leading-snug">
                  Close open mental loops before your head hits the pillow.
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed font-light">
                  Unfinished tasks and unresolved conversations generate persistent cognitive load. Closing day-boundaries unburdens working memory for deeper REM cycles.
                </p>
              </div>

              {/* Day Boundaries Highlights */}
              <div className="space-y-2.5 pt-2">
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-3">
                  <Sunrise className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-semibold text-white">Morning Dopamine Priming</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">Establish one non-negotiable intentional focus before reactive inputs arrive.</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-3">
                  <Moon className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-semibold text-white">Evening Cognitive Offloading</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">Dump unresolved open loops with concrete next actions to halt insomnia spirals.</p>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>Loop Closure Protocol</span>
                <span className="text-amber-400 font-mono text-[11px]">Zero Unfinished Loops</span>
              </div>
            </div>
          </div>
        </section>

        {/* ACT V: PRIVATE SOVEREIGN VAULT & FINAL CTA (400vh - 480vh) */}
        <section className="min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-24 text-center">
          <div className="w-full max-w-3xl mx-auto bg-slate-900/90 backdrop-blur-2xl border border-slate-800 rounded-3xl p-8 sm:p-12 space-y-8 shadow-2xl">
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Zero-Insecure Defaults · Strict User Data Isolation</span>
            </div>

            {/* Headline */}
            <div className="space-y-3">
              <h2 className="text-3xl sm:text-5xl font-serif font-bold text-white tracking-tight">
                Your thoughts belong <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-indigo-300">
                  only to you.
                </span>
              </h2>
              <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto leading-relaxed font-light">
                Entries and psychiatric clarity records are strictly isolated under <code className="text-xs font-mono bg-slate-800 px-1.5 py-0.5 rounded text-emerald-400">/users/{'{userId}'}/...</code> with Cloud Firestore owner-bound security rules.
              </p>
            </div>

            {/* Verification Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
              <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/50 space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Google Auth</span>
                </div>
                <p className="text-[11px] text-slate-400">No stored passwords in app code.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/50 space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>4-Model Ladder</span>
                </div>
                <p className="text-[11px] text-slate-400">Continuous AI fallback uptime.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/50 space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Cloud Firestore</span>
                </div>
                <p className="text-[11px] text-slate-400">Persistent real-time synchronization.</p>
              </div>
            </div>

            {/* Primary Action Button */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                id="landing-cta-final-signin"
                onClick={onSignIn}
                disabled={isLoading}
                className="w-full sm:w-auto px-10 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-base shadow-xl hover:shadow-indigo-500/25 transition-all flex items-center justify-center gap-3 disabled:opacity-75 active:scale-98 cursor-pointer"
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
                <span>{isLoading ? "Opening Sanctuary..." : "Open Your Sovereign Journal with Google"}</span>
                <ArrowRight className="w-4 h-4 text-indigo-200" />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
