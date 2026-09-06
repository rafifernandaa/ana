import React, { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { AlertCircle, X } from "lucide-react";
import { LandingNav } from "./LandingNav";
import { LandingHeroSection } from "./LandingHeroSection";
import { WhyJournalingSection } from "./WhyJournalingSection";
import { ArchitectureSection } from "./ArchitectureSection";
import { WhatsInItSection } from "./WhatsInItSection";
import { LandingFooter } from "./LandingFooter";

interface LandingPageProps {
  user: User | null;
  isLoading?: boolean;
  authError?: string | null;
  onDismissAuthError?: () => void;
  onSignIn: () => void;
  onEnterApp: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  user,
  isLoading = false,
  authError = null,
  onDismissAuthError,
  onSignIn,
  onEnterApp,
}) => {
  const [activeSection, setActiveSection] = useState<string>("hero");

  // Track active section as user scrolls through the page
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200;

      const heroEl = document.getElementById("hero");
      const whyEl = document.getElementById("why-journaling");
      const archEl = document.getElementById("architecture");
      const whatsEl = document.getElementById("whats-in-it");

      if (whatsEl && scrollPosition >= whatsEl.offsetTop) {
        setActiveSection("whats-in-it");
      } else if (archEl && scrollPosition >= archEl.offsetTop) {
        setActiveSection("architecture");
      } else if (whyEl && scrollPosition >= whyEl.offsetTop) {
        setActiveSection("why-journaling");
      } else {
        setActiveSection("hero");
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToNext = () => {
    const whyEl = document.getElementById("why-journaling");
    if (whyEl) {
      whyEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  const navigateToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#262626] font-sans selection:bg-[#3D4028] selection:text-white">
      {/* Fixed Navigation Bar */}
      <LandingNav
        user={user}
        isLoading={isLoading}
        onSignIn={onSignIn}
        onEnterApp={onEnterApp}
        activeSection={activeSection}
        onNavigateSection={navigateToSection}
      />

      {/* Floating Auth Notification Notice */}
      {authError && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-lg animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="bg-[#FAF9F6] border border-[#AD3D30] rounded-xl shadow-xl p-3.5 flex items-start justify-between gap-3 font-sans text-xs">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-[#AD3D30] shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-semibold text-[#AD3D30]">Sign-In Notice</p>
                <p className="text-[#262626]/85 leading-relaxed">{authError}</p>
              </div>
            </div>
            {onDismissAuthError && (
              <button
                type="button"
                onClick={onDismissAuthError}
                className="text-[#8C8C8C] hover:text-[#262626] p-1 rounded-md hover:bg-black/5 transition-colors cursor-pointer"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Page 1: Hero with 3-Layer Placement */}
      <div id="hero">
        <LandingHeroSection
          user={user}
          isLoading={isLoading}
          onStartJournal={onEnterApp}
          onSignIn={onSignIn}
          onScrollToNext={scrollToNext}
        />
      </div>

      {/* Page 2 / Tab 1: 01 Why Journaling (A Healthier Mind Starts with You) */}
      <div id="why-journaling">
        <WhyJournalingSection onExploreTools={() => navigateToSection("whats-in-it")} />
      </div>

      {/* Page 3 / Tab 2: 02 Architecture (Neuroscience Grounded, Cloud Hardened) */}
      <div id="architecture">
        <ArchitectureSection />
      </div>

      {/* Page 4 / Tab 3: 03 What's In It (The Somatic & Cognitive Toolkit) */}
      <div id="whats-in-it">
        <WhatsInItSection onLaunchTool={onEnterApp} />
      </div>

      {/* Page 5: Reflection & Footer */}
      <LandingFooter
        user={user}
        isLoading={isLoading}
        onStartJournal={onEnterApp}
        onSignIn={onSignIn}
      />
    </div>
  );
};
