import React from "react";
import { 
  LayoutGrid, 
  FileText, 
  Zap, 
  Archive, 
  Settings, 
  Plus, 
  Cloud, 
  ShieldCheck,
  Activity,
  Scissors,
  Sun
} from "lucide-react";
import { User } from "firebase/auth";
import { NavTabId } from "./AetherHeader";
import { useTheme } from "../lib/theme";

interface RiceSidebarDockProps {
  activeTab: NavTabId;
  onSelectTab: (tab: NavTabId) => void;
  onNewEntry: () => void;
  onOpenSettings?: () => void;
  user?: User | null;
  isSaving?: boolean;
}

export const RiceSidebarDock: React.FC<RiceSidebarDockProps> = ({
  activeTab,
  onSelectTab,
  onNewEntry,
  onOpenSettings,
  user,
  isSaving = false,
}) => {
  const playChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(528, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.31);
    } catch {
      // audio context unavailable
    }
  };

  const handleAction = (tab: NavTabId) => {
    playChime();
    onSelectTab(tab);
  };

  // Determine user display initial
  const userInitial = user?.displayName 
    ? user.displayName.charAt(0).toUpperCase() 
    : (user?.email ? user.email.charAt(0).toUpperCase() : "A");

  const { isLight } = useTheme();

  return (
    <aside 
      id="aether-sidebar-dock"
      className="w-16 bg-[#181818] border-r border-[#3D4028] flex flex-col items-center justify-between py-3 select-none shrink-0 z-40 font-mono h-full overflow-hidden"
      aria-label="App Navigation Dock"
    >
      {/* Top Section: Logo Box + New Button */}
      <div className="flex flex-col items-center gap-3 w-full">
        {/* Logo box with subtle border */}
        <div 
          onClick={() => handleAction("dashboard")}
          className="w-8 h-8 rounded-full bg-[#262626] border border-[#3D4028] hover:border-[#A3A649] flex items-center justify-center cursor-pointer transition-all group p-1 overflow-hidden shadow-xs"
          title="Ana // Neuroscience-Informed Journal"
        >
          <img 
            src={isLight ? "/assets/ana-logo-dark.png" : "/assets/ana-logo-light.png"} 
            alt="Ana Logo" 
            className="w-full h-full object-contain group-hover:scale-110 transition-transform" 
          />
        </div>

        {/* Create New Entry (+) */}
        <button
          id="aside-new-entry-btn"
          onClick={() => {
            playChime();
            onNewEntry();
            onSelectTab("studio");
          }}
          className="w-8 h-8 rounded-xs bg-[#3D4028] hover:bg-[#AD3D30] text-[#A3A649] hover:text-white border border-[#A3A649]/40 flex items-center justify-center transition-all cursor-pointer shadow-xs group"
          title="+ New Journal Entry Buffer"
        >
          <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
        </button>

        {/* Separator */}
        <div className="w-6 h-px bg-[#3D4028] my-1" />

        {/* Navigation Tabs List */}
        <nav className="flex flex-col items-center gap-2.5 w-full" aria-label="Aside Tabs">
          {/* TAB 1: DASHBOARD (First aside tab as requested) */}
          <button
            id="aside-tab-dashboard"
            onClick={() => handleAction("dashboard")}
            className={`w-9 h-9 rounded-xs flex items-center justify-center transition-all cursor-pointer relative group ${
              activeTab === "dashboard"
                ? "bg-[#262626] border border-[#A3A649] text-[#A3A649] shadow-xs"
                : "text-[#8C8C8C] hover:text-white hover:bg-[#262626] border border-transparent"
            }`}
            title="1. Neural Clarity Dashboard"
          >
            <LayoutGrid className="w-4 h-4" />
            <div className="absolute left-full ml-3 px-2 py-0.5 bg-[#262626] text-white text-[10px] font-mono rounded-xs border border-[#3D4028] shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
              1. Dashboard (System Metrics)
            </div>
          </button>

          {/* TAB 2: JOURNAL ENTRY & AI ASSISTANT (Second aside tab as requested) */}
          <button
            id="aside-tab-studio"
            onClick={() => handleAction("studio")}
            className={`w-9 h-9 rounded-xs flex items-center justify-center transition-all cursor-pointer relative group ${
              activeTab === "studio"
                ? "bg-[#262626] border border-[#A3A649] text-[#A3A649] shadow-xs"
                : "text-[#8C8C8C] hover:text-white hover:bg-[#262626] border border-transparent"
            }`}
            title="2. Journal Entry & AI Assistant Studio (Side-by-Side)"
          >
            <FileText className="w-4 h-4" />
            <div className="absolute left-full ml-3 px-2 py-0.5 bg-[#262626] text-white text-[10px] font-mono rounded-xs border border-[#3D4028] shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
              2. Journal Entry & AI Assistant Studio
            </div>
          </button>

          {/* TAB 3: NEURAL FEATURES HUB (Non-modal features tab as requested) */}
          <button
            id="aside-tab-features"
            onClick={() => handleAction("features")}
            className={`w-9 h-9 rounded-xs flex items-center justify-center transition-all cursor-pointer relative group ${
              activeTab === "features"
                ? "bg-[#262626] border border-[#AD3D30] text-[#AD3D30] shadow-xs"
                : "text-[#8C8C8C] hover:text-[#AD3D30] hover:bg-[#262626] border border-transparent"
            }`}
            title="3. Mind Tools & Features (Somatic Reset, Pruner, Glimmers)"
          >
            <Zap className="w-4 h-4" />
            <div className="absolute left-full ml-3 px-2 py-0.5 bg-[#262626] text-white text-[10px] font-mono rounded-xs border border-[#3D4028] shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
              3. Mind Tools & Features (Non-Modal)
            </div>
          </button>

          {/* TAB 4: ARCHIVE */}
          <button
            id="aside-tab-archive"
            onClick={() => handleAction("archive")}
            className={`w-9 h-9 rounded-xs flex items-center justify-center transition-all cursor-pointer relative group ${
              activeTab === "archive"
                ? "bg-[#262626] border border-[#A3A649] text-[#A3A649] shadow-xs"
                : "text-[#8C8C8C] hover:text-white hover:bg-[#262626] border border-transparent"
            }`}
            title="4. Archive & Knowledge Cores"
          >
            <Archive className="w-4 h-4" />
            <div className="absolute left-full ml-3 px-2 py-0.5 bg-[#262626] text-white text-[10px] font-mono rounded-xs border border-[#3D4028] shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
              4. Archive & Reflections
            </div>
          </button>

          {/* TAB 5: SETTINGS & CONFIG */}
          <button
            id="aside-tab-settings"
            onClick={() => handleAction("settings")}
            className={`w-9 h-9 rounded-xs flex items-center justify-center transition-all cursor-pointer relative group ${
              activeTab === "settings"
                ? "bg-[#262626] border border-[#A3A649] text-[#A3A649] shadow-xs"
                : "text-[#8C8C8C] hover:text-white hover:bg-[#262626] border border-transparent"
            }`}
            title="5. System Configuration & Security"
          >
            <Settings className="w-4 h-4" />
            <div className="absolute left-full ml-3 px-2 py-0.5 bg-[#262626] text-white text-[10px] font-mono rounded-xs border border-[#3D4028] shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
              5. Configuration & Security
            </div>
          </button>
        </nav>
      </div>

      {/* Bottom Section: Aether-Void Signature Status Track + Avatar */}
      <div className="flex flex-col items-center gap-3 w-full">
        {/* Status vertical track */}
        <div className="flex flex-col items-center">
          <div className="status-track" title="Neural Link Latency Status">
            <div className={`status-fill ${isSaving ? "bg-[#AD3D30]" : ""}`} />
          </div>
          <span className="status-txt">
            {isSaving ? "SYNCING" : "ONLINE"}
          </span>
        </div>

        {/* User profile / auth avatar */}
        <button
          id="aside-avatar-btn"
          onClick={onOpenSettings}
          className="relative w-8 h-8 rounded-full bg-[#262626] border border-[#3D4028] hover:border-[#A3A649] text-white flex items-center justify-center text-[10px] font-bold transition-all cursor-pointer group"
          title={user ? `Signed in as ${user.email}` : "Account & Cloud Preferences"}
        >
          {user?.photoURL ? (
            <img src={user.photoURL} alt="User" className="w-full h-full rounded-full object-cover" />
          ) : (
            <span className="text-[#A3A649] font-mono">{userInitial}</span>
          )}
          {/* Green Online Dot */}
          <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#10b981] border border-[#181818]" />
        </button>
      </div>
    </aside>
  );
};
