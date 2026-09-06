import React, { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { LandingNav } from "./LandingNav";
import { LandingHeroSection } from "./LandingHeroSection";
import { WhyJournalingSection } from "./WhyJournalingSection";
import { ArchitectureSection } from "./ArchitectureSection";
import { WhatsInItSection } from "./WhatsInItSection";
import { LandingFooter } from "./LandingFooter";

interface LandingPageProps {
  user: User | null;
  isLoading?: boolean;
  onSignIn: () => void;
  onEnterApp: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  user,
  isLoading = false,
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
