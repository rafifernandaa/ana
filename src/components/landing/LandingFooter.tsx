import React from "react";
import { AnaLogo } from "../common/AnaLogo";
import { ArrowRight, LogIn, Github, Sparkles } from "lucide-react";
import { User } from "firebase/auth";

interface LandingFooterProps {
  onStartJournal: () => void;
  onSignIn: () => void;
  user?: User | null;
  isLoading?: boolean;
}

export const LandingFooter: React.FC<LandingFooterProps> = ({
  onStartJournal,
  onSignIn,
  user,
  isLoading = false,
}) => {
  return (
    <footer className="relative bg-[#FAF9F6] text-[#262626] pt-20 pb-12 border-t border-[#3D4028]/15 overflow-hidden select-none">
      {/* Background Soft Ambient Glow */}
      <div className="absolute top-0 right-1/3 w-[600px] h-[600px] bg-[#A3A649]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Grand CTA Banner Card */}
      <div className="max-w-4xl mx-auto px-6 sm:px-12 relative z-10 mb-16">
        <div className="bg-white rounded-3xl p-10 sm:p-16 border-2 border-[#3D4028]/20 text-center shadow-xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#3D4028]/10 text-[#3D4028] font-mono text-xs uppercase tracking-widest font-bold mb-6 border border-[#3D4028]/25">
            <Sparkles className="w-3.5 h-3.5 text-[#3D4028]" />
            <span>NEUROSCIENCE-GROUNDED JOURNALING</span>
          </div>

          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#262626] mb-6">
            Ready to Meet Your Mind?
          </h2>

          <p className="font-serif text-lg sm:text-xl text-[#262626]/90 font-medium max-w-2xl mx-auto leading-relaxed mb-10">
            A sanctuary to unburden intrusive thoughts, map somatic tension, and anchor the micro-moments of peace that keep you resilient.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={onStartJournal}
              className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-[#3D4028] hover:bg-[#2d301e] text-white font-sans text-sm font-semibold tracking-wide transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 cursor-pointer group"
            >
              <span>{user ? "Enter Studio" : "Start Your Journal"}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            {!user && (
              <button
                type="button"
                onClick={onSignIn}
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-7 py-4 rounded-full border-2 border-[#3D4028] bg-white hover:bg-[#3D4028] text-[#262626] hover:text-white text-sm font-mono tracking-wider font-bold transition-all shadow-xs cursor-pointer group disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="w-4 h-4 border-2 border-[#3D4028] border-t-transparent rounded-full animate-spin group-hover:border-white" />
                ) : (
                  <LogIn className="w-4 h-4 text-[#3D4028] group-hover:text-white transition-colors" />
                )}
                <span>{isLoading ? "Connecting..." : "Sign In with Google"}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Reflection Quote with Dark Visible Typography */}
      <div className="text-center max-w-2xl mx-auto mb-16 px-6 relative z-10">
        <div className="w-12 h-[1px] bg-[#3D4028]/40 mx-auto mb-6" />
        <p className="font-serif italic text-base sm:text-lg text-[#262626]/85 font-medium leading-relaxed">
          "Looking back allows you to proceed forward with unconditional clarity. 
          In journaling, examining where you have been is how you discover the clarity for where you are going."
        </p>
      </div>

      {/* Bottom Footer Bar (Tabs on Left Edge, Logo on Right Edge, Full Width) */}
      <div className="w-full px-6 sm:px-10 lg:px-12 pt-8 border-t border-[#3D4028]/15 flex flex-col md:flex-row items-center justify-between gap-6 text-xs font-mono text-[#262626]/80 font-medium relative z-10">
        
        {/* Left Edge: Nav Tabs */}
        <div className="flex flex-wrap items-center gap-6">
          <a
            href="#why-journaling"
            className="hover:text-[#3D4028] transition-colors"
          >
            Why Journaling
          </a>
          <a
            href="#architecture"
            className="hover:text-[#3D4028] transition-colors"
          >
            Architecture
          </a>
          <a
            href="#whats-in-it"
            className="hover:text-[#3D4028] transition-colors"
          >
            What's In It
          </a>
          <a
            href="https://github.com/rafifernandaa/ana.git"
            target="_blank"
            rel="noreferrer"
            className="hover:text-[#3D4028] transition-colors inline-flex items-center gap-1"
          >
            <Github className="w-3.5 h-3.5" />
            <span>GitHub</span>
          </a>
        </div>

        {/* Right Edge: Ana Logo & Copyright */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[#262626] font-display font-bold text-sm tracking-wide">
              Ana
            </span>
            <span className="text-stone-500 ml-2">
              © 2026
            </span>
          </div>
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[#3D4028]">
            <AnaLogo size={26} color="#3D4028" />
          </div>
        </div>

      </div>
    </footer>
  );
};
