import React from "react";
import { User } from "firebase/auth";
import { 
  Sparkles, 
  LogOut, 
  LogIn, 
  PlusCircle, 
  BookOpen, 
  ShieldCheck, 
  CheckCircle2, 
  Clock,
  Scissors,
  Sun,
  Activity
} from "lucide-react";

interface NavbarProps {
  user: User | null;
  onSignIn: () => void;
  onSignOut: () => void;
  onNewEntry: () => void;
  onOpenResetRoom: () => void;
  onOpenSynapticPruner: () => void;
  onOpenGlimmerVault: () => void;
  onToggleSecurityInfo: () => void;
  isSaving?: boolean;
  lastSavedAt?: number | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onSignIn,
  onSignOut,
  onNewEntry,
  onOpenResetRoom,
  onOpenSynapticPruner,
  onOpenGlimmerVault,
  onToggleSecurityInfo,
  isSaving = false,
  lastSavedAt = null,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#181818] border-b border-[#3D4028] text-[#e2e8f0] font-mono select-none">
      <div className="w-full px-3 sm:px-5 h-12 sm:h-14 flex items-center justify-between">
        {/* Brand & Terminal Breadcrumb */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-8 h-8 rounded bg-[#262626] border border-[#3D4028] flex items-center justify-center text-[#A3A649] shadow-inner">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm sm:text-base text-white tracking-tight">
                Ana<span className="text-[#AD3D30]">.wm</span>
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#3D4028] text-[#A3A649] border border-[#A3A649]/30">
                rice-v2
              </span>
              <span className="hidden md:inline-flex text-[11px] text-[#8C8C8C]">
                ~/.config/mindful-workspace
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls & User Identity */}
        <div className="flex items-center gap-2">
          {/* Quick Trigger: Reset Room */}
          <button
            id="navbar-reset-room-btn"
            onClick={onOpenResetRoom}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#3D4028] hover:bg-[#3D4028]/80 text-[#A3A649] border border-[#A3A649]/40 font-semibold text-xs transition-all active:scale-95 cursor-pointer"
            title="Launch Guided Stress Reset"
          >
            <Activity className="w-3.5 h-3.5 text-[#A3A649]" />
            <span className="hidden sm:inline">Reset Room</span>
          </button>

          {/* Quick Trigger: Thought Untangler */}
          <button
            id="navbar-synaptic-pruner-btn"
            onClick={onOpenSynapticPruner}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#262626] hover:bg-[#3D4028] text-slate-200 hover:text-[#A3A649] border border-[#3D4028] font-semibold text-xs transition-all active:scale-95 cursor-pointer"
            title="Untangle Recurring Thought Patterns"
          >
            <Scissors className="w-3.5 h-3.5 text-[#8C8C8C]" />
            <span className="hidden sm:inline">Untangle</span>
          </button>

          {/* Quick Trigger: Glimmer Vault */}
          <button
            id="navbar-glimmer-vault-btn"
            onClick={onOpenGlimmerVault}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#262626] hover:bg-[#3D4028] text-slate-200 hover:text-[#A3A649] border border-[#3D4028] font-semibold text-xs transition-all active:scale-95 cursor-pointer"
            title="Open Glimmer Vault"
          >
            <Sun className="w-3.5 h-3.5 text-[#A3A649]" />
            <span className="hidden sm:inline">Glimmers</span>
          </button>

          {/* Sync Status Badge */}
          {user && (
            <div className="hidden xl:flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#262626] border border-[#3D4028] text-[11px] text-[#8C8C8C]">
              {isSaving ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-[#AD3D30] animate-ping" />
                  <span className="text-[#AD3D30]">syncing...</span>
                </>
              ) : lastSavedAt ? (
                <>
                  <CheckCircle2 className="w-3 h-3 text-[#A3A649]" />
                  <span className="text-slate-300">synced {new Date(lastSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </>
              ) : (
                <>
                  <Clock className="w-3 h-3 text-[#8C8C8C]" />
                  <span>cloud ready</span>
                </>
              )}
            </div>
          )}

          {/* Security & Architecture Info Toggle */}
          <button
            id="security-info-btn"
            onClick={onToggleSecurityInfo}
            className="flex items-center gap-1 px-2 py-1 rounded border border-[#3D4028] bg-[#262626] text-[#8C8C8C] hover:text-[#A3A649] hover:bg-[#3D4028] transition-colors text-xs font-medium cursor-pointer"
            title="View Security & Firestore Isolation Architecture"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#A3A649]" />
            <span className="hidden lg:inline text-[11px]">sec-rules</span>
          </button>

          {user ? (
            <>
              {/* New Entry Button */}
              <button
                id="navbar-new-entry-btn"
                onClick={onNewEntry}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#AD3D30] hover:bg-[#AD3D30]/90 text-white font-bold text-xs transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Buffer</span>
              </button>

              {/* User Avatar & Logout */}
              <div className="flex items-center gap-2 pl-2 border-l border-[#3D4028]">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || "User"}
                    className="w-7 h-7 rounded border border-[#3D4028] object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-7 h-7 rounded bg-[#3D4028] text-[#A3A649] border border-[#A3A649]/30 flex items-center justify-center text-xs font-bold font-mono">
                    {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase() || "U"}
                  </div>
                )}
                <div className="hidden xl:block text-left">
                  <p className="text-[11px] font-bold text-white leading-tight truncate max-w-[80px]">
                    {user.displayName || "User"}
                  </p>
                  <p className="text-[9px] text-[#8C8C8C] truncate max-w-[80px]">
                    {user.email}
                  </p>
                </div>
                <button
                  id="navbar-logout-btn"
                  onClick={onSignOut}
                  className="p-1 text-[#8C8C8C] hover:text-[#AD3D30] hover:bg-[#AD3D30]/10 rounded transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          ) : (
            <button
              id="navbar-login-btn"
              onClick={onSignIn}
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#AD3D30] hover:bg-[#AD3D30]/90 text-white font-bold text-xs transition-all active:scale-95 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
