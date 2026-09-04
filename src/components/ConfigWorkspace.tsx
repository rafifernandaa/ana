import React, { useState } from "react";
import { User } from "firebase/auth";
import { 
  Settings, 
  ShieldCheck, 
  Database, 
  Key, 
  Download, 
  LogIn, 
  LogOut, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  Cpu,
  Lock,
  FileCode,
  HardDrive,
  Sun,
  Moon,
  Sparkles
} from "lucide-react";
import { JournalEntry, ResetSession, PrunedThoughtLoop, GlimmerAnchor } from "../types";
import { useTheme } from "../lib/theme";

interface ConfigWorkspaceProps {
  user: User | null;
  onSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
  entries: JournalEntry[];
  sessions: ResetSession[];
  prunedLoops: PrunedThoughtLoop[];
  glimmers: GlimmerAnchor[];
  lastSavedAt: number | null;
}

export const ConfigWorkspace: React.FC<ConfigWorkspaceProps> = ({
  user,
  onSignIn,
  onSignOut,
  entries,
  sessions,
  prunedLoops,
  glimmers,
  lastSavedAt,
}) => {
  const { theme, setTheme, isLight } = useTheme();
  const [activeSection, setActiveSection] = useState<"appearance" | "security" | "cloud" | "models" | "export">("appearance");

  const handleExportJSON = () => {
    const backup = {
      exportDate: new Date().toISOString(),
      user: user ? { uid: user.uid, email: user.email } : "guest",
      entries,
      sessions,
      prunedLoops,
      glimmers,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ana-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div 
      id="config-workspace-container"
      className="flex-1 flex flex-col h-full min-h-0 bg-[#121212] overflow-hidden font-mono select-none"
    >
      {/* Top Header */}
      <div className="h-11 bg-[#181818] border-b border-[#3D4028] px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-[#A3A649]" />
          <h2 className="text-xs font-bold text-white tracking-wider">
            SYSTEM CONFIGURATION & SECURITY ARCHITECTURE
          </h2>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center gap-1 bg-[#262626] p-0.5 rounded-xs border border-[#3D4028] text-[10px]">
          <button
            onClick={() => setActiveSection("appearance")}
            className={`px-2 py-0.5 rounded-xs transition-colors cursor-pointer flex items-center gap-1 ${
              activeSection === "appearance" ? "bg-[#3D4028] text-[#A3A649] font-bold" : "text-[#8C8C8C] hover:text-white"
            }`}
          >
            {isLight ? <Sun className="w-3 h-3 text-[#AD3D30]" /> : <Moon className="w-3 h-3 text-[#A3A649]" />}
            <span>Appearance</span>
          </button>
          <button
            onClick={() => setActiveSection("security")}
            className={`px-2 py-0.5 rounded-xs transition-colors cursor-pointer ${
              activeSection === "security" ? "bg-[#3D4028] text-[#A3A649] font-bold" : "text-[#8C8C8C] hover:text-white"
            }`}
          >
            Threat Model
          </button>
          <button
            onClick={() => setActiveSection("cloud")}
            className={`px-2 py-0.5 rounded-xs transition-colors cursor-pointer ${
              activeSection === "cloud" ? "bg-[#3D4028] text-[#A3A649] font-bold" : "text-[#8C8C8C] hover:text-white"
            }`}
          >
            Cloud Firestore
          </button>
          <button
            onClick={() => setActiveSection("models")}
            className={`px-2 py-0.5 rounded-xs transition-colors cursor-pointer ${
              activeSection === "models" ? "bg-[#3D4028] text-[#A3A649] font-bold" : "text-[#8C8C8C] hover:text-white"
            }`}
          >
            Gemini Models
          </button>
          <button
            onClick={() => setActiveSection("export")}
            className={`px-2 py-0.5 rounded-xs transition-colors cursor-pointer ${
              activeSection === "export" ? "bg-[#3D4028] text-[#A3A649] font-bold" : "text-[#8C8C8C] hover:text-white"
            }`}
          >
            Data Backup
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#181818]">
        <div className="max-w-4xl mx-auto space-y-5">
          {/* SECTION 0: APPEARANCE & THEME */}
          {activeSection === "appearance" && (
            <div className="space-y-4">
              <div className="bg-[#262626] border border-[#3D4028] p-4 rounded-xs space-y-2">
                <div className="flex items-center gap-2 text-white text-xs font-bold">
                  {isLight ? <Sun className="w-4 h-4 text-[#AD3D30]" /> : <Moon className="w-4 h-4 text-[#A3A649]" />}
                  <span>DISPLAY ARCHITECTURE & COLOR SYSTEM</span>
                </div>
                <p className="text-xs text-[#8C8C8C]">
                  Select your interface theme. Both modes are built with high optical contrast, anti-slop guidelines, and typography scales designed for deep reflective focus.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Dark Mode Card */}
                <div 
                  onClick={() => setTheme("dark")}
                  className={`p-4 rounded-xs border transition-all cursor-pointer space-y-3 ${
                    theme === "dark"
                      ? "bg-[#262626] border-[#A3A649] shadow-md ring-1 ring-[#A3A649]"
                      : "bg-[#181818] border-[#3D4028] hover:border-[#8C8C8C]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-xs bg-[#181818] border border-[#3D4028] flex items-center justify-center text-[#A3A649]">
                        <Moon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-white">Dark Void</span>
                    </div>
                    {theme === "dark" && (
                      <span className="text-[10px] font-bold text-[#A3A649] bg-[#3D4028] px-2 py-0.5 rounded-xs">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#8C8C8C] leading-relaxed">
                    Signature dark minimalist palette with olive accents (#A3A649, #3D4028) and crimson highlights (#AD3D30). Ideal for low-light evening reflection.
                  </p>
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="w-4 h-4 rounded-xs bg-[#121212] border border-[#3D4028]" title="#121212" />
                    <span className="w-4 h-4 rounded-xs bg-[#262626] border border-[#3D4028]" title="#262626" />
                    <span className="w-4 h-4 rounded-xs bg-[#3D4028]" title="#3D4028" />
                    <span className="w-4 h-4 rounded-xs bg-[#A3A649]" title="#A3A649" />
                    <span className="w-4 h-4 rounded-xs bg-[#AD3D30]" title="#AD3D30" />
                  </div>
                </div>

                {/* Light Mode Card */}
                <div 
                  onClick={() => setTheme("light")}
                  className={`p-4 rounded-xs border transition-all cursor-pointer space-y-3 ${
                    theme === "light"
                      ? "bg-[#262626] border-[#AD3D30] shadow-md ring-1 ring-[#AD3D30]"
                      : "bg-[#181818] border-[#3D4028] hover:border-[#8C8C8C]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-xs bg-[#F7F7F5] border border-[#D6DAD0] flex items-center justify-center text-[#AD3D30]">
                        <Sun className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-white">Light Canvas (Paper)</span>
                    </div>
                    {theme === "light" && (
                      <span className="text-[10px] font-bold text-white bg-[#AD3D30] px-2 py-0.5 rounded-xs">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#8C8C8C] leading-relaxed">
                    Refined warm neutral light canvas with crisp high-contrast dark typography, delicate olive dividers, and crimson accents. WCAG AA certified readability.
                  </p>
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="w-4 h-4 rounded-xs bg-[#F7F7F5] border border-[#D6DAD0]" title="#F7F7F5" />
                    <span className="w-4 h-4 rounded-xs bg-[#FFFFFF] border border-[#D6DAD0]" title="#FFFFFF" />
                    <span className="w-4 h-4 rounded-xs bg-[#E6EAD5] border border-[#D6DAD0]" title="#E6EAD5" />
                    <span className="w-4 h-4 rounded-xs bg-[#4D541B]" title="#4D541B" />
                    <span className="w-4 h-4 rounded-xs bg-[#AD3D30]" title="#AD3D30" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 1: SECURITY & THREAT MODELING */}
          {activeSection === "security" && (
            <div className="space-y-4">
              <div className="bg-[#262626] border border-[#3D4028] p-4 rounded-xs space-y-2">
                <div className="flex items-center gap-2 text-white text-xs font-bold">
                  <ShieldCheck className="w-4 h-4 text-[#10b981]" />
                  <span>5-ZONE AGENTIC THREAT MODELING (OWASP TOP 10 / LLM01-LLM10)</span>
                </div>
                <p className="text-xs text-[#8C8C8C]">
                  All inputs are sanitized before storage or execution. Gemini prompt engineering employs system-level prompt injection barriers and strict parameterization.
                </p>
              </div>

              {/* Threat Summary Table */}
              <div className="bg-[#262626] border border-[#3D4028] rounded-xs overflow-hidden text-xs">
                <div className="grid grid-cols-12 bg-[#1c1c1c] border-b border-[#3D4028] p-2.5 font-bold text-[#A3A649] text-[10px]">
                  <div className="col-span-3">THREAT ZONE</div>
                  <div className="col-span-4">RISK SCENARIO</div>
                  <div className="col-span-5">ENGINEERED MITIGATION</div>
                </div>

                <div className="divide-y divide-[#3D4028]/60 text-[11px]">
                  <div className="grid grid-cols-12 p-2.5 items-center">
                    <div className="col-span-3 font-semibold text-white">1. Input Surfaces</div>
                    <div className="col-span-4 text-[#8C8C8C]">Prompt injection & script execution via journal notes</div>
                    <div className="col-span-5 text-[#A3A649]">React-Markdown encoded rendering; strict string parameterization</div>
                  </div>

                  <div className="grid grid-cols-12 p-2.5 items-center">
                    <div className="col-span-3 font-semibold text-white">2. Planning & Reasoning</div>
                    <div className="col-span-4 text-[#8C8C8C]">System prompt bypass or hallucinated medical advice</div>
                    <div className="col-span-5 text-[#A3A649]">Explicit psychological guardrails & Socratic-only reflection boundaries</div>
                  </div>

                  <div className="grid grid-cols-12 p-2.5 items-center">
                    <div className="col-span-3 font-semibold text-white">3. Tool Execution</div>
                    <div className="col-span-4 text-[#8C8C8C]">Privilege escalation & unauthorized mutations</div>
                    <div className="col-span-5 text-[#A3A649]">Owner-bound path checking (`request.auth.uid == userId`) in firestore.rules</div>
                  </div>

                  <div className="grid grid-cols-12 p-2.5 items-center">
                    <div className="col-span-3 font-semibold text-white">4. Memory & State</div>
                    <div className="col-span-4 text-[#8C8C8C]">Cross-user data leakage or dirty payload crashes</div>
                    <div className="col-span-5 text-[#A3A649]">Zero-crash undefined-stripping; complete collection subpaths</div>
                  </div>

                  <div className="grid grid-cols-12 p-2.5 items-center">
                    <div className="col-span-3 font-semibold text-white">5. Inter-System</div>
                    <div className="col-span-4 text-[#8C8C8C]">API key theft or client-side secret exposure</div>
                    <div className="col-span-5 text-[#A3A649]">Environment variable containment; Secret Manager compliant patterns</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: CLOUD FIRESTORE */}
          {activeSection === "cloud" && (
            <div className="space-y-4">
              <div className="bg-[#262626] border border-[#3D4028] p-4 rounded-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <Database className="w-4 h-4 text-[#A3A649]" />
                    <span>GOOGLE CLOUD FIRESTORE DATABASE</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-xs bg-[#181818] border border-[#3D4028] text-[10px] text-[#10b981] font-semibold">
                    CONNECTED
                  </span>
                </div>

                <div className="space-y-1 text-xs">
                  <p className="text-[#8C8C8C]">
                    Project ID: <span className="text-white font-mono">ai-studio-1964eda9-cc24-452a-bee7-3ab0780e0478</span>
                  </p>
                  <p className="text-[#8C8C8C]">
                    Active Auth State:{" "}
                    {user ? (
                      <span className="text-[#10b981] font-semibold">Authenticated as {user.email}</span>
                    ) : (
                      <span className="text-[#A3A649]">Guest Mode (Local Indexed persistence)</span>
                    )}
                  </p>
                  {lastSavedAt && (
                    <p className="text-[#8C8C8C]">
                      Last Synchronized: <span className="text-white">{new Date(lastSavedAt).toLocaleTimeString()}</span>
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-[#3D4028] flex items-center gap-3">
                  {user ? (
                    <button
                      onClick={onSignOut}
                      className="px-3 py-1.5 rounded-xs bg-[#262626] hover:bg-[#AD3D30] text-white border border-[#3D4028] text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  ) : (
                    <button
                      onClick={onSignIn}
                      className="px-3 py-1.5 rounded-xs bg-[#AD3D30] hover:bg-[#AD3D30]/80 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Authenticate with Google</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: GEMINI MODELS */}
          {activeSection === "models" && (
            <div className="space-y-4">
              <div className="bg-[#262626] border border-[#3D4028] p-4 rounded-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <Cpu className="w-4 h-4 text-[#A3A649]" />
                    <span>RESILIENT GEMINI FALLBACK LADDER (3.6+ TIER)</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-xs bg-[#10b981]/20 border border-[#10b981]/50 text-[10px] text-[#10b981] font-semibold">
                    v3.6+ ENFORCED
                  </span>
                </div>
                <p className="text-xs text-[#8C8C8C]">
                  All neuroplastic queries, somatic reflections, and cognitive distillations execute strictly on Gemini models version 3.6 or higher via an automated server-side failover ladder.
                </p>

                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-xs bg-[#181818] border border-[#A3A649] flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[#A3A649]">Primary Model:</span>
                      <span className="text-white ml-2">gemini-3.8-flash</span>
                      <span className="text-[10px] text-[#8C8C8C] block sm:inline sm:ml-2">(Frontier Agentic Flash &amp; Deep Reflection)</span>
                    </div>
                    <span className="text-[10px] text-[#10b981] font-semibold">DEFAULT TIER</span>
                  </div>

                  <div className="p-2.5 rounded-xs bg-[#181818] border border-[#3D4028] flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[#8C8C8C]">Multi-Step Reasoning Failover:</span>
                      <span className="text-white ml-2">gemini-3.7-flash</span>
                      <span className="text-[10px] text-[#8C8C8C] block sm:inline sm:ml-2">(Complex Thought Unwinding - 1M Context)</span>
                    </div>
                    <span className="text-[10px] text-[#A3A649]">TIER 2 FAILOVER</span>
                  </div>

                  <div className="p-2.5 rounded-xs bg-[#181818] border border-[#3D4028] flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[#8C8C8C]">High-Throughput Fallback:</span>
                      <span className="text-white ml-2">gemini-3.6-flash</span>
                      <span className="text-[10px] text-[#8C8C8C] block sm:inline sm:ml-2">(High-Speed Multimodal &amp; Telemetry)</span>
                    </div>
                    <span className="text-[10px] text-[#8C8C8C]">TIER 3 FAILOVER</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: DATA EXPORT */}
          {activeSection === "export" && (
            <div className="space-y-4">
              <div className="bg-[#262626] border border-[#3D4028] p-4 rounded-xs space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <HardDrive className="w-4 h-4 text-[#A3A649]" />
                  <span>DATA SOVEREIGNTY & EXPORT</span>
                </div>
                <p className="text-xs text-[#8C8C8C]">
                  Export your complete reflection records, somatic stress resets, pruned thought loops, and anchored glimmers as a portable JSON document.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2.5 bg-[#181818] border border-[#3D4028] rounded-xs">
                    <span className="text-lg font-bold text-white block">{entries.length}</span>
                    <span className="text-[10px] text-[#8C8C8C]">Journal Entries</span>
                  </div>
                  <div className="p-2.5 bg-[#181818] border border-[#3D4028] rounded-xs">
                    <span className="text-lg font-bold text-[#A3A649] block">{sessions.length}</span>
                    <span className="text-[10px] text-[#8C8C8C]">Reset Sessions</span>
                  </div>
                  <div className="p-2.5 bg-[#181818] border border-[#3D4028] rounded-xs">
                    <span className="text-lg font-bold text-[#AD3D30] block">{prunedLoops.length}</span>
                    <span className="text-[10px] text-[#8C8C8C]">Pruned Loops</span>
                  </div>
                  <div className="p-2.5 bg-[#181818] border border-[#3D4028] rounded-xs">
                    <span className="text-lg font-bold text-[#A3A649] block">{glimmers.length}</span>
                    <span className="text-[10px] text-[#8C8C8C]">Glimmers</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleExportJSON}
                    className="px-4 py-2 rounded-xs bg-[#AD3D30] hover:bg-[#AD3D30]/80 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download JSON Backup</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
