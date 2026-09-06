import React, { useState } from "react";
import { Brain, Heart, Sparkles, ShieldCheck, Feather, Activity, ArrowRight } from "lucide-react";

export const WhyJournalingSection: React.FC<{ onExploreTools: () => void }> = ({
  onExploreTools,
}) => {
  const [activeTab, setActiveTab] = useState<"affect" | "pennebaker" | "polyvagal">("affect");

  return (
    <section
      id="why-journaling"
      className="relative min-h-screen py-24 px-6 sm:px-12 lg:px-16 bg-[#FAF9F6] text-[#262626] border-t border-[#3D4028]/10"
    >
      {/* Background Soft Natural Lighting */}
      <div className="absolute top-1/3 left-10 w-[500px] h-[500px] bg-[#A3A649]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto">
        {/* Section Number & Heading matching the mockup */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-16">
          <div className="lg:col-span-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-mono font-bold tracking-[0.25em] text-[#3D4028] uppercase">
                01
              </span>
              <span className="text-xs font-mono tracking-[0.2em] text-[#8C8C8C] uppercase font-semibold">
                WHY JOURNALING
              </span>
            </div>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#262626] leading-tight">
              A Healthier Mind Starts with You
            </h2>
          </div>

          <div className="lg:col-span-7 lg:pl-12 lg:pt-8 flex flex-col justify-between">
            <p className="font-serif text-lg sm:text-xl text-[#262626]/80 leading-relaxed max-w-2xl mb-6">
              Journaling is not simply cataloging events — it is active neural hygiene. 
              By translating unspoken cognitive turbulence into structured language, you physically modulate your brain's fear circuitry and rewire automatic stress responses.
            </p>
            
            <div className="flex items-center gap-4 text-xs font-mono text-[#8C8C8C]">
              <span className="inline-block w-8 h-[1px] bg-[#3D4028]" />
              <span className="uppercase tracking-widest text-[#3D4028] font-semibold">
                Backed by Cognitive Neuroscience & Polyvagal Theory
              </span>
            </div>
          </div>
        </div>

        {/* 3 Interactive Neuroscience Tabs */}
        <div className="flex flex-wrap gap-3 mb-10 border-b border-[#3D4028]/15 pb-4">
          <button
            onClick={() => setActiveTab("affect")}
            className={`px-5 py-2.5 rounded-full font-mono text-xs uppercase tracking-wider font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "affect"
                ? "bg-[#3D4028] text-white shadow-sm"
                : "bg-white text-[#262626] border border-stone-200 hover:border-[#3D4028]/40"
            }`}
          >
            <Brain className="w-3.5 h-3.5 text-[#A3A649]" />
            <span>1. Affect Labelling</span>
          </button>

          <button
            onClick={() => setActiveTab("pennebaker")}
            className={`px-5 py-2.5 rounded-full font-mono text-xs uppercase tracking-wider font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "pennebaker"
                ? "bg-[#3D4028] text-white shadow-sm"
                : "bg-white text-[#262626] border border-stone-200 hover:border-[#3D4028]/40"
            }`}
          >
            <Feather className="w-3.5 h-3.5 text-[#A3A649]" />
            <span>2. Expressive Unburdening</span>
          </button>

          <button
            onClick={() => setActiveTab("polyvagal")}
            className={`px-5 py-2.5 rounded-full font-mono text-xs uppercase tracking-wider font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "polyvagal"
                ? "bg-[#3D4028] text-white shadow-sm"
                : "bg-white text-[#262626] border border-stone-200 hover:border-[#3D4028]/40"
            }`}
          >
            <Heart className="w-3.5 h-3.5 text-[#A3A649]" />
            <span>3. Polyvagal Grounding</span>
          </button>
        </div>

        {/* Tab Content Display */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Main Focus Card */}
          <div className="lg:col-span-8 bg-white rounded-2xl p-8 sm:p-12 border border-[#3D4028]/15 shadow-sm relative overflow-hidden flex flex-col justify-between">
            {/* Soft decorative grain watermark */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#A3A649]/5 rounded-bl-full pointer-events-none" />

            {activeTab === "affect" && (
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#A3A649]/15 text-[#3D4028] font-mono text-xs font-semibold uppercase tracking-wider mb-6">
                  UCLA fMRI Evidence (Matthew Lieberman)
                </div>
                <h3 className="font-display text-2xl sm:text-3xl font-bold text-[#262626] mb-4">
                  "Name It to Tame It": The Neurobiology of Affect Labelling
                </h3>
                <p className="font-serif text-base sm:text-lg text-[#262626]/80 leading-relaxed mb-6">
                  When you experience overwhelming emotion without naming it, the amygdala fires unchecked. 
                  fMRI imaging proves that the exact second you write down an explicit emotional label—such as 
                  <em className="text-[#3D4028] font-semibold"> "I feel profound constriction in my chest over this deadline"</em>—the right ventrolateral prefrontal cortex (rvlPFC) activates, sending rapid inhibitory GABA signals down into the amygdala.
                </p>
                
                {/* Contrast Comparison */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-stone-100">
                  <div className="p-4 rounded-xl bg-red-50/60 border border-red-200/60">
                    <div className="text-xs font-mono font-bold text-[#AD3D30] uppercase mb-1">
                      Without Labelling
                    </div>
                    <div className="text-sm text-stone-700">
                      Diffuse emotional reactivity, hyper-aroused amygdala, rumination loop.
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/60">
                    <div className="text-xs font-mono font-bold text-[#3D4028] uppercase mb-1">
                      With Ana Affect Labelling
                    </div>
                    <div className="text-sm text-stone-700">
                      rvlPFC engagement, amygdala attenuation, subjective relief within minutes.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "pennebaker" && (
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#A3A649]/15 text-[#3D4028] font-mono text-xs font-semibold uppercase tracking-wider mb-6">
                  James Pennebaker Paradigm (UT Austin)
                </div>
                <h3 className="font-display text-2xl sm:text-3xl font-bold text-[#262626] mb-4">
                  Freeing Working Memory Through Synaptic Unburdening
                </h3>
                <p className="font-serif text-base sm:text-lg text-[#262626]/80 leading-relaxed mb-6">
                  Unexpressed emotional conflicts persist as "Zeigarnik loops"—unclosed cognitive tasks that continuously drain 
                  working memory and increase daytime cortisol. Through expressive writing, the brain converts fragmented emotional sensory memories 
                  into an organized coherent narrative.
                </p>
                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 text-sm text-stone-700 leading-relaxed">
                  <span className="font-mono font-bold text-[#3D4028]">Empirical Biomarkers: </span>
                  Four consecutive sessions of expressive writing have been clinically shown to reduce physician visits, lower resting blood pressure, and boost antibody responses to pathogens.
                </div>
              </div>
            )}

            {activeTab === "polyvagal" && (
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#A3A649]/15 text-[#3D4028] font-mono text-xs font-semibold uppercase tracking-wider mb-6">
                  Dr. Stephen Porges Polyvagal Framework
                </div>
                <h3 className="font-display text-2xl sm:text-3xl font-bold text-[#262626] mb-4">
                  Glimmers & The Ventral Vagal Brake
                </h3>
                <p className="font-serif text-base sm:text-lg text-[#262626]/80 leading-relaxed mb-6">
                  Your nervous system is constantly assessing environmental cues for danger (neuroception). 
                  While trauma creates triggers, micro-moments of peaceful safety are known as <em className="text-[#3D4028] font-semibold">"Glimmers"</em>. 
                  Ana's AI actively surfaces and vaults these glimmers from your journals, systematically conditioning your autonomic nervous system toward rest and social connection.
                </p>
                <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#3D4028]/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-[#A3A649]" />
                    <span className="font-serif text-sm font-medium text-[#262626]">
                      "A gentle cup of morning tea before anyone was awake."
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[#3D4028] uppercase font-bold tracking-widest">
                    Ventral Vagus Cue
                  </span>
                </div>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-stone-100 flex items-center justify-between">
              <span className="text-xs font-mono text-[#8C8C8C]">
                Step 01 / 03 in the Ana Framework
              </span>
              <button
                onClick={onExploreTools}
                className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider font-bold text-[#3D4028] hover:text-[#262626] transition-colors cursor-pointer group"
              >
                <span>Discover the Tools</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Side Botanical & Science Stat Panel */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#3D4028]/15 shadow-sm">
              <div className="text-3xl font-display font-bold text-[#3D4028] mb-1">
                -42%
              </div>
              <div className="font-mono text-xs uppercase tracking-wider text-[#262626] font-semibold mb-2">
                Amygdala Hyperactivity
              </div>
              <p className="font-serif text-sm text-[#262626]/70 leading-relaxed">
                Observed in functional brain scans within 8 minutes of structured affect labelling and emotional transcription.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#3D4028]/15 shadow-sm">
              <div className="text-3xl font-display font-bold text-[#A3A649] mb-1">
                3.2x
              </div>
              <div className="font-mono text-xs uppercase tracking-wider text-[#262626] font-semibold mb-2">
                Synaptic Working Memory Recovery
              </div>
              <p className="font-serif text-sm text-[#262626]/70 leading-relaxed">
                Reclaimed cognitive bandwidth when looping ruminative thoughts are externalized into permanent written records.
              </p>
            </div>

            <div className="bg-[#3D4028] text-white rounded-2xl p-6 sm:p-8 shadow-md flex flex-col justify-between">
              <div>
                <div className="font-mono text-[10px] tracking-widest uppercase text-[#A3A649] mb-2 font-bold">
                  ANA PALINDROME PRINCIPLE
                </div>
                <div className="font-serif text-sm sm:text-base leading-relaxed text-white/90">
                  "Looking back allows you to proceed forward with unconditional clarity."
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/10 text-[11px] font-mono text-white/60">
                A N A • Forward & Backward
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
