import React, { useState, useEffect } from "react";
import { ArrowRight, ChevronDown, Sparkles } from "lucide-react";

interface LandingHeroSectionProps {
  onStartJournal: () => void;
  onSignIn: () => void;
  onScrollToNext: () => void;
}

export const LandingHeroSection: React.FC<LandingHeroSectionProps> = ({
  onStartJournal,
  onSignIn,
  onScrollToNext,
}) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Subtle interactive parallax depth on mouse move
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX / innerWidth - 0.5) * 2; // -1 to 1
      const y = (e.clientY / innerHeight - 0.5) * 2;
      setMousePos({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <section className="relative min-h-[92vh] sm:min-h-screen flex flex-col justify-between pt-24 sm:pt-28 pb-10 px-6 sm:px-12 lg:px-16 overflow-hidden bg-[#FAF9F6] text-[#262626]">
      {/* Background Soft Paper Glow */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-[#A3A649]/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-[#3D4028]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Grid: Left Typography & Right 3-Layer Illustration */}
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center flex-1 my-auto">
        
        {/* Left Column: Hero Narrative */}
        <div className="lg:col-span-6 flex flex-col items-start z-20">
          <div className="inline-flex items-center gap-2 mb-4 sm:mb-6">
            <span className="text-[11px] sm:text-xs font-mono tracking-[0.25em] text-[#3D4028] uppercase font-bold px-2 py-0.5 rounded-xs bg-[#3D4028]/8 border border-[#3D4028]/15">
              JOURNALING APP
            </span>
            <span className="text-[10px] font-mono text-[#8C8C8C] tracking-widest uppercase">
              • PALINDROME
            </span>
          </div>

          <h1 className="font-display text-7xl sm:text-8xl md:text-9xl font-bold tracking-tight text-[#262626] leading-[0.95] mb-6 select-none">
            Ana
          </h1>

          <p className="font-serif text-xl sm:text-2xl text-[#262626]/85 max-w-lg leading-relaxed mb-8">
            A space to be honest with your mind, and kinder to your future self.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-4 mb-8">
            <button
              onClick={onStartJournal}
              className="inline-flex items-center gap-3 px-8 py-3.5 rounded-full bg-[#3D4028] hover:bg-[#2d301e] text-white font-sans text-sm font-semibold tracking-wide transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 cursor-pointer group"
            >
              <span>Start Your Journal</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={onSignIn}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-[#262626]/20 hover:border-[#262626] text-[#262626] text-sm font-mono tracking-wider font-medium hover:bg-black/5 transition-all cursor-pointer"
            >
              <span>Sign In with Google</span>
            </button>
          </div>

          {/* Micro Neuroscience Highlight */}
          <div className="flex items-center gap-3 text-xs font-mono text-[#8C8C8C] pt-2 border-t border-[#3D4028]/15 max-w-md">
            <div className="w-2 h-2 rounded-full bg-[#A3A649] animate-pulse" />
            <span>Affect labelling & neuroplasticity-grounded journaling</span>
          </div>
        </div>

        {/* Right Column: 3-Layer Paper-Cut Illustration with Emanating Brain */}
        <div className="lg:col-span-6 relative flex items-center justify-center lg:justify-end z-10">
          <div className="relative w-full max-w-[580px] aspect-[16/10] sm:aspect-[16/11] flex items-center justify-center">

            {/* LAYER 1: Deepest Layer — Peeping Neuroplastic Brain with Glowing Synapses */}
            <div
              className="absolute inset-0 transition-transform duration-700 ease-out will-change-transform rounded-2xl overflow-hidden shadow-2xl border border-stone-200/80 bg-white"
              style={{
                transform: `translate(${mousePos.x * -6}px, ${mousePos.y * -6}px) scale(1.02)`,
              }}
            >
              <img
                src="/assets/ana_hero_brain.jpg"
                alt="Ana Neuroplastic Brain & Affect Labelling Illustration"
                className="w-full h-full object-cover object-center"
              />

              {/* Glowing Synaptic Light Aura */}
              <div 
                className="absolute inset-0 pointer-events-none mix-blend-screen opacity-70 animate-pulse"
                style={{
                  background: "radial-gradient(circle at 55% 45%, rgba(163, 166, 73, 0.4) 0%, rgba(61, 64, 40, 0.15) 40%, transparent 70%)"
                }}
              />
            </div>

            {/* LAYER 2: Middle Layer — Torn Parchment & Sprouting Botanical Greenery */}
            <div
              className="absolute inset-0 pointer-events-none transition-transform duration-500 ease-out will-change-transform"
              style={{
                transform: `translate(${mousePos.x * 4}px, ${mousePos.y * 4}px)`,
              }}
            >
              {/* Decorative paper curl edge shadow */}
              <div className="absolute top-2 right-4 w-28 h-28 bg-[#3D4028]/5 rounded-full blur-xl" />
              
              {/* Floating Affect Labelling Badge */}
              <div className="absolute top-6 left-6 sm:-left-4 bg-[#FAF9F6]/95 backdrop-blur-md px-3.5 py-2 rounded-lg border border-[#3D4028]/20 shadow-md flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#A3A649]" />
                <span className="text-[11px] font-mono font-semibold text-[#262626]">
                  Lieberman Affect Labelling
                </span>
              </div>

              {/* Floating Neuroplasticity Badge */}
              <div className="absolute bottom-16 right-4 sm:-right-4 bg-[#FAF9F6]/95 backdrop-blur-md px-3.5 py-2 rounded-lg border border-[#3D4028]/20 shadow-md flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#A3A649]" />
                <span className="text-[11px] font-mono font-semibold text-[#262626]">
                  Synaptic Rewiring
                </span>
              </div>
            </div>

            {/* LAYER 3: Foreground Layer — Paper-Cut Charcoal & Forest Ridges (Spanning Bottom) */}
            <div
              className="absolute -bottom-4 -left-4 -right-4 h-24 sm:h-32 pointer-events-none transition-transform duration-300 ease-out will-change-transform"
              style={{
                transform: `translate(${mousePos.x * 8}px, ${mousePos.y * 8}px)`,
              }}
            >
              {/* Organic Paper Cut Edge Wave */}
              <svg
                viewBox="0 0 1200 240"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full object-cover filter drop-shadow-lg"
                preserveAspectRatio="none"
              >
                {/* Back Ridge: Deep Olive #3D4028 */}
                <path
                  d="M0 160 C 150 140, 300 170, 450 145 C 600 120, 750 160, 900 135 C 1050 110, 1150 140, 1200 150 L 1200 240 L 0 240 Z"
                  fill="#3D4028"
                  fillOpacity="0.85"
                />
                {/* Front Ridge: Charcoal #262626 with torn deckle contour */}
                <path
                  d="M0 180 C 180 160, 320 200, 500 170 C 680 140, 820 190, 1000 165 C 1120 150, 1170 170, 1200 180 L 1200 240 L 0 240 Z"
                  fill="#262626"
                />
              </svg>
            </div>

          </div>
        </div>

      </div>

      {/* Hero Bottom Bar: Scroll Indicator on Left & Step Labels on Right */}
      <div className="max-w-7xl mx-auto w-full flex items-end justify-between pt-6 border-t border-[#3D4028]/10 text-xs font-mono select-none z-20">
        {/* Scroll Prompt */}
        <button
          onClick={onScrollToNext}
          className="inline-flex items-center gap-2 text-[#262626]/70 hover:text-[#3D4028] transition-colors cursor-pointer group"
        >
          <span className="font-semibold tracking-wider">SCROLL</span>
          <ChevronDown className="w-3.5 h-3.5 group-hover:translate-y-1 transition-transform animate-bounce" />
        </button>

        {/* Right Step Indicators (Matching Mockup: LABEL - FEEL - GROW) */}
        <div className="flex items-center gap-6 text-[11px] tracking-[0.25em] font-semibold text-[#8C8C8C]">
          <span className="text-[#3D4028] font-bold">LABEL</span>
          <span className="w-3 h-[1px] bg-[#3D4028]/30" />
          <span className="hover:text-[#3D4028] transition-colors">FEEL</span>
          <span className="w-3 h-[1px] bg-[#3D4028]/30" />
          <span className="hover:text-[#3D4028] transition-colors">GROW</span>
        </div>
      </div>
    </section>
  );
};
