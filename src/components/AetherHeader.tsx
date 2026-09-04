import React from "react";
import { User } from "firebase/auth";
import { Columns, LogIn, Sun, Moon } from "lucide-react";
import { useTheme } from "../lib/theme";

export type NavTabId = "dashboard" | "studio" | "features" | "archive" | "settings";

interface AetherHeaderProps {
  activeTab?: NavTabId;
  onSelectTab?: (tab: NavTabId) => void;
  layoutMode: "split" | "journal_focus" | "ai_focus";
  onToggleLayout: () => void;
  user: User | null;
  onOpenAuth: () => void;
  isSaving?: boolean;
}

export const AetherHeader: React.FC<AetherHeaderProps> = ({
  onSelectTab,
  layoutMode,
  onToggleLayout,
  user,
  onOpenAuth,
  isSaving = false,
}) => {
  const { theme, toggleTheme, isLight } = useTheme();

  const handleThemeToggle = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(isLight ? 432 : 576, ctx.currentTime);
        gain.gain.setValueAtTime(0.03, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.21);
      }
    } catch {
      // audio feedback fallback
    }
    toggleTheme();
  };

  return (
    <header 
      id="aether-top-header"
      className="h-12 bg-[#181818] border-b border-[#3D4028] px-3 sm:px-4 flex items-center justify-between font-mono shrink-0 select-none z-30 shadow-md transition-colors"
    >
      {/* Brand / Logo */}
      <div className="flex items-center gap-3">
        <div 
          onClick={() => onSelectTab?.("dashboard")}
          className="cursor-pointer flex items-center gap-2 group"
          title="Ana // Neuroscience-Informed Journal"
        >
          <div className="w-6 h-6 rounded-full bg-[#262626] border border-[#3D4028] flex items-center justify-center p-0.5 group-hover:border-[#A3A649] transition-all overflow-hidden shrink-0 shadow-xs">
            <img 
              src={isLight ? "/assets/ana-logo-dark.png" : "/assets/ana-logo-light.png"} 
              alt="Ana Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <div className="text-xs tracking-wider">
            <span className="font-bold text-white text-sm tracking-wide">Ana</span>
          </div>
        </div>
      </div>

      {/* Right Actions: Theme Toggle, Layout Toggle & User Auth */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Light / Dark Mode Toggle Button */}
        <button
          id="theme-mode-toggle-btn"
          onClick={handleThemeToggle}
          className="px-2.5 py-1 bg-[#262626] hover:bg-[#3D4028] border border-[#3D4028] rounded-xs text-[10px] tracking-wider text-[#8C8C8C] hover:text-[#A3A649] transition-all flex items-center gap-1.5 cursor-pointer"
          title={`Switch to ${isLight ? "Dark Void" : "Light Canvas"} Mode`}
          aria-label={`Toggle theme (currently ${theme})`}
        >
          {isLight ? (
            <>
              <Sun className="w-3.5 h-3.5 text-[#AD3D30]" />
              <span className="hidden sm:inline">MODE:</span>
              <span className="text-white font-bold uppercase">LIGHT</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-[#A3A649]" />
              <span className="hidden sm:inline">MODE:</span>
              <span className="text-white font-bold uppercase">DARK</span>
            </>
          )}
        </button>

        {/* Layout Toggle Button */}
        <button
          id="layout-toggle-btn"
          onClick={onToggleLayout}
          className="px-2 py-1 bg-[#262626] hover:bg-[#3D4028] border border-[#3D4028] rounded-xs text-[10px] tracking-wider text-[#8C8C8C] hover:text-[#A3A649] transition-all flex items-center gap-1.5 cursor-pointer"
          title="Toggle Panel Layout (Split / Focus)"
        >
          <Columns className="w-3 h-3 text-[#A3A649]" />
          <span className="hidden lg:inline">LAYOUT:</span>
          <span className="text-white font-bold uppercase">
            {layoutMode === "split" ? "SPLIT" : layoutMode === "journal_focus" ? "JOURNAL" : "AI"}
          </span>
        </button>

        {/* User Account / Sign In */}
        <button
          id="user-auth-trigger"
          onClick={onOpenAuth}
          className="flex items-center gap-1.5 px-2 py-1 rounded-xs bg-[#262626] hover:bg-[#3D4028] border border-[#3D4028] text-[10px] text-white transition-colors cursor-pointer"
        >
          {user ? (
            <>
              <div className={`w-2 h-2 rounded-full ${isSaving ? "bg-[#AD3D30] animate-ping" : "bg-[#10b981]"}`} />
              <span className="max-w-[80px] truncate text-[10px] text-[#A3A649]">
                {user.displayName || user.email?.split("@")[0] || "User"}
              </span>
            </>
          ) : (
            <>
              <LogIn className="w-3 h-3 text-[#8C8C8C]" />
              <span className="text-[#8C8C8C] hover:text-white">Guest</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
