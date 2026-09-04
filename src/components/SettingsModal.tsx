import React from "react";
import { 
  X, 
  User as UserIcon, 
  LogIn, 
  LogOut, 
  ShieldCheck, 
  Cloud, 
  Check, 
  Layers, 
  Sparkles,
  Sun,
  Moon
} from "lucide-react";
import { User } from "firebase/auth";
import { useTheme } from "../lib/theme";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSignIn: () => void;
  onSignOut: () => void;
  onOpenSecurity: () => void;
  isSaving: boolean;
  lastSavedAt: number | null;
  entryCount: number;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  user,
  onSignIn,
  onSignOut,
  onOpenSecurity,
  isSaving,
  lastSavedAt,
  entryCount,
}) => {
  const { theme, setTheme, isLight } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs font-mono text-[#e2e8f0]">
      <div 
        className="w-full max-w-md bg-[#181818] border border-[#3D4028] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="h-11 bg-[#262626] border-b border-[#3D4028] px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#A3A649]" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              System Settings & Account
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-[#8C8C8C] hover:text-white transition-colors cursor-pointer text-sm"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Display Mode Switcher */}
          <div className="p-3.5 rounded-xl bg-[#262626] border border-[#3D4028] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                {isLight ? <Sun className="w-3.5 h-3.5 text-[#AD3D30]" /> : <Moon className="w-3.5 h-3.5 text-[#A3A649]" />}
                <span>Interface Appearance</span>
              </span>
              <span className="text-[10px] text-[#A3A649] font-mono uppercase">
                {theme} Mode
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  theme === "dark"
                    ? "bg-[#3D4028] border-[#A3A649] text-white shadow-xs"
                    : "bg-[#181818] border-[#3D4028] text-[#8C8C8C] hover:text-white"
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-[#A3A649]" />
                <span>Dark Void</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  theme === "light"
                    ? "bg-[#AD3D30] border-[#AD3D30] text-white shadow-xs"
                    : "bg-[#181818] border-[#3D4028] text-[#8C8C8C] hover:text-white"
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-white" />
                <span>Light Canvas</span>
              </button>
            </div>
          </div>

          {/* User Account Card */}
          <div className="p-3.5 rounded-xl bg-[#262626] border border-[#3D4028] space-y-3">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-full bg-[#3D4028] border border-[#A3A649]/60 flex items-center justify-center text-white font-bold text-sm">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="User" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-[#A3A649]">{user ? user.email?.charAt(0).toUpperCase() : "G"}</span>
                )}
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#34d399] border-2 border-[#181818]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">
                  {user ? (user.displayName || user.email) : "Guest Session (Local Isolated)"}
                </p>
                <p className="text-[11px] text-[#8C8C8C] truncate">
                  {user ? user.email : "Sign in to synchronize across devices"}
                </p>
              </div>
            </div>

            {user ? (
              <button
                onClick={() => {
                  onSignOut();
                  onClose();
                }}
                className="w-full py-2 px-3 rounded-lg bg-[#AD3D30]/20 hover:bg-[#AD3D30] text-[#AD3D30] hover:text-white border border-[#AD3D30]/50 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out from Google Cloud</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  onSignIn();
                  onClose();
                }}
                className="w-full py-2 px-3 rounded-lg bg-[#3D4028] hover:bg-[#A3A649] text-[#A3A649] hover:text-[#181818] border border-[#A3A649]/50 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In with Google Cloud</span>
              </button>
            )}
          </div>

          {/* Sync & Persistence Status */}
          <div className="p-3.5 rounded-xl bg-[#262626] border border-[#3D4028] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white font-semibold flex items-center gap-1.5">
                <Cloud className="w-3.5 h-3.5 text-[#A3A649]" />
                <span>Firestore Isolation</span>
              </span>
              <span className="text-[10px] font-bold text-[#A3A649] bg-[#3D4028] px-2 py-0.5 rounded">
                Active
              </span>
            </div>
            <p className="text-[11px] text-[#8C8C8C] leading-relaxed">
              Every thought, reset session, and glimmer is saved with zero-trust owner validation.
            </p>
            <div className="text-[10px] text-[#8C8C8C] pt-1 flex items-center justify-between border-t border-[#3D4028]">
              <span>Active Reflection Buffers:</span>
              <span className="font-mono text-white">{entryCount}</span>
            </div>
            <div className="text-[10px] text-[#8C8C8C] flex items-center justify-between">
              <span>Last Synchronized:</span>
              <span className="font-mono text-white">
                {lastSavedAt ? new Date(lastSavedAt).toLocaleTimeString() : "Just now"}
              </span>
            </div>
          </div>

          {/* Security & Threat Modeling Button */}
          <button
            onClick={() => {
              onClose();
              onOpenSecurity();
            }}
            className="w-full py-2 px-3 rounded-xl bg-[#181818] hover:bg-[#262626] border border-[#3D4028] text-xs text-[#8C8C8C] hover:text-white transition-colors cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#A3A649]" />
              <span>View Zero-Trust Threat Model</span>
            </div>
            <span className="text-[#A3A649] text-xs">→</span>
          </button>
        </div>

        {/* Footer */}
        <div className="h-10 bg-[#262626] border-t border-[#3D4028] px-4 flex items-center justify-between text-[11px] text-[#8C8C8C]">
          <span>Ana Rice WM v2.4</span>
          <span>gtk-dark #262626</span>
        </div>
      </div>
    </div>
  );
};
