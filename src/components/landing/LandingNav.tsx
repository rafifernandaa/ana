import React, { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { AnaLogo } from "../common/AnaLogo";
import { ArrowRight, LogIn, Sparkles } from "lucide-react";

interface LandingNavProps {
  user: User | null;
  onSignIn: () => void;
  onEnterApp: () => void;
  isLoading?: boolean;
  activeSection?: string;
  onNavigateSection?: (sectionId: string) => void;
}

export const LandingNav: React.FC<LandingNavProps> = ({
  user,
  onSignIn,
  onEnterApp,
  isLoading = false,
  activeSection = "hero",
  onNavigateSection,
}) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent, sectionId: string) => {
    e.preventDefault();
    if (onNavigateSection) {
      onNavigateSection(sectionId);
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#FAF9F6]/90 backdrop-blur-md border-b border-[#3D4028]/10 py-3 shadow-xs"
          : "bg-transparent py-5"
      }`}
    >
      <div className="w-full px-6 sm:px-10 lg:px-12 flex items-center justify-between relative">
        {/* Brand: Ana Monogram & Wordmark (Very Left Edge) */}
        <div
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="flex items-center gap-3 cursor-pointer group select-none z-10"
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[#262626] group-hover:text-[#3D4028] transition-colors">
            <AnaLogo size={32} color="#262626" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-2xl font-semibold tracking-tight text-[#262626]">
              Ana
            </span>
          </div>
        </div>

        {/* 3 Nav Tabs: Why Journaling, Architecture, What's In It (Dead Center) */}
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-8 text-sm font-sans tracking-wide text-[#262626]/80 font-medium z-10">
          <a
            href="#why-journaling"
            onClick={(e) => handleNavClick(e, "why-journaling")}
            className={`transition-colors hover:text-[#3D4028] relative py-1 ${
              activeSection === "why-journaling" ? "text-[#3D4028] font-semibold" : ""
            }`}
          >
            Why Journaling
            {activeSection === "why-journaling" && (
              <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#3D4028] rounded-full" />
            )}
          </a>
          <a
            href="#architecture"
            onClick={(e) => handleNavClick(e, "architecture")}
            className={`transition-colors hover:text-[#3D4028] relative py-1 ${
              activeSection === "architecture" ? "text-[#3D4028] font-semibold" : ""
            }`}
          >
            Architecture
            {activeSection === "architecture" && (
              <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#3D4028] rounded-full" />
            )}
          </a>
          <a
            href="#whats-in-it"
            onClick={(e) => handleNavClick(e, "whats-in-it")}
            className={`transition-colors hover:text-[#3D4028] relative py-1 ${
              activeSection === "whats-in-it" ? "text-[#3D4028] font-semibold" : ""
            }`}
          >
            What's In It
            {activeSection === "whats-in-it" && (
              <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#3D4028] rounded-full" />
            )}
          </a>
        </div>

        {/* Action Buttons: Sign In / Start App (Very Right Edge) */}
        <div className="flex items-center gap-3 z-10">
          {user ? (
            <button
              onClick={onEnterApp}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#3D4028] text-white text-xs font-mono uppercase tracking-wider font-semibold hover:bg-[#2e311f] transition-all shadow-sm hover:shadow-md cursor-pointer"
            >
              <span>Enter Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onSignIn}
                disabled={isLoading}
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#3D4028]/20 hover:border-[#3D4028] text-[#262626] text-xs font-mono uppercase tracking-wider font-medium hover:bg-black/5 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="w-3.5 h-3.5 border-2 border-[#3D4028] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <LogIn className="w-3.5 h-3.5 text-[#3D4028]" />
                )}
                <span>{isLoading ? "Signing In..." : "Sign In"}</span>
              </button>

              <button
                onClick={onEnterApp}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#3D4028] text-white text-xs font-mono uppercase tracking-wider font-semibold hover:bg-[#2d301e] transition-all shadow-sm hover:shadow-md cursor-pointer"
              >
                <span>Start Journal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
