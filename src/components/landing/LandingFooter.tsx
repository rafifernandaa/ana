import React from "react";
import { AnaLogo } from "../common/AnaLogo";
import { ArrowRight, LogIn, Github, ExternalLink, Heart, Sparkles } from "lucide-react";

interface LandingFooterProps {
  onStartJournal: () => void;
  onSignIn: () => void;
}

export const LandingFooter: React.FC<LandingFooterProps> = ({
  onStartJournal,
  onSignIn,
}) => {
  return (
    <footer className="relative bg-[#262626] text-white pt-24 pb-12 px-6 sm:px-12 lg:px-16 border-t border-[#3D4028]/40 overflow-hidden select-none">
      {/* Background Soft Glow */}
      <div className="absolute top-0 right-1/3 w-[600px] h-[600px] bg-[#3D4028]/30 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Grand CTA Banner */}
        <div className="bg-[#181818] rounded-3xl p-10 sm:p-16 border border-[#3D4028] text-center max-w-4xl mx-auto mb-20 shadow-2xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#3D4028]/60 text-[#A3A649] font-mono text-xs uppercase tracking-widest font-bold mb-6 border border-[#A3A649]/30">
            <Sparkles className="w-3.5 h-3.5 text-[#A3A649]" />
            <span>PALINDROME ARCHITECTURE • LOOK BACK TO MOVE FORWARD</span>
          </div>

          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-6">
            Ready to Meet Your Mind?
          </h2>

          <p className="font-serif text-lg sm:text-xl text-stone-300 max-w-2xl mx-auto leading-relaxed mb-10">
            A sanctuary to unburden intrusive thoughts, map somatic tension, and anchor the micro-moments of peace that keep you resilient.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={onStartJournal}
              className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-[#3D4028] hover:bg-[#4d5133] text-white font-sans text-sm font-semibold tracking-wide transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 cursor-pointer group"
            >
              <span>Start Your Journal</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={onSignIn}
              className="inline-flex items-center gap-2 px-7 py-4 rounded-full border border-stone-600 hover:border-stone-400 text-stone-200 text-sm font-mono tracking-wider font-medium hover:bg-white/5 transition-all cursor-pointer"
            >
              <LogIn className="w-4 h-4 text-[#A3A649]" />
              <span>Sign In with Google</span>
            </button>
          </div>
        </div>

        {/* Palindrome Philosophical Reflection Quote */}
        <div className="text-center max-w-2xl mx-auto mb-16 px-4">
          <div className="w-12 h-[1px] bg-[#3D4028] mx-auto mb-6" />
          <p className="font-serif italic text-base sm:text-lg text-stone-300 leading-relaxed">
            "Ana is a palindrome — looking back is the same as looking forward. 
            In journaling, examining where you have been is how you discover the clarity for where you are going."
          </p>
        </div>

        {/* 5-Color Swatch Bar from Brand Identity */}
        <div className="flex items-center justify-center gap-3 mb-16">
          <span className="text-[10px] font-mono uppercase tracking-widest text-stone-500 mr-2">
            Palette:
          </span>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-[#AD3D30] border border-black/40 shadow-xs" title="#AD3D30 (Rust Red)" />
            <div className="w-5 h-5 rounded-full bg-[#3D4028] border border-black/40 shadow-xs" title="#3D4028 (Deep Olive)" />
            <div className="w-5 h-5 rounded-full bg-[#A3A649] border border-black/40 shadow-xs" title="#A3A649 (Moss Green)" />
            <div className="w-5 h-5 rounded-full bg-[#8C8C8C] border border-black/40 shadow-xs" title="#8C8C8C (Slate Gray)" />
            <div className="w-5 h-5 rounded-full bg-[#262626] border border-stone-700 shadow-xs" title="#262626 (Charcoal Base)" />
          </div>
        </div>

        {/* Bottom Footer Links & Metadata */}
        <div className="pt-8 border-t border-stone-800 flex flex-col md:flex-row items-center justify-between gap-6 text-xs font-mono text-stone-400">
          <div className="flex items-center gap-3">
            <AnaLogo size={28} color="#A3A649" />
            <div>
              <span className="text-white font-display font-bold text-sm tracking-wide">
                Ana
              </span>
              <span className="text-stone-500 ml-2">
                © 2026 • APAC GenAI Academy Ideathon
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <a
              href="#why-journaling"
              className="hover:text-white transition-colors"
            >
              Why Journaling
            </a>
            <a
              href="#architecture"
              className="hover:text-white transition-colors"
            >
              Architecture
            </a>
            <a
              href="#whats-in-it"
              className="hover:text-white transition-colors"
            >
              What's In It
            </a>
            <a
              href="https://github.com/rafifernandaa/ana.git"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition-colors inline-flex items-center gap-1"
            >
              <Github className="w-3.5 h-3.5" />
              <span>GitHub</span>
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
};
