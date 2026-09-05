import React, { useState, useMemo, useEffect } from "react";
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
  Sparkles,
  Clock,
  Activity,
  Terminal,
  RefreshCw,
  Bell,
  Check,
  Mail,
  Send,
  FileSpreadsheet,
  Copy,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { JournalEntry, ResetSession, PrunedThoughtLoop, GlimmerAnchor } from "../types";
import { useTheme } from "../lib/theme";
import { 
  getSheetsConfig, 
  saveSheetsConfig, 
  syncToGoogleSheets, 
  exportToGoogleSheetsCsv, 
  getGoogleAppsScriptTemplate,
  SheetsSyncConfig,
  SheetsSyncResult
} from "../lib/sheets";
import { 
  dispatchTestEmail, 
  fetchEmailConfig,
  runCircadianSchedulerCheck,
  EmailDispatchResult,
  EmailConfigResponse
} from "../lib/email";

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
  const [schedulerDiagnostics, setSchedulerDiagnostics] = useState<any | null>(null);
  const [isCheckingScheduler, setIsCheckingScheduler] = useState(false);
  const [browserNotificationPerm, setBrowserNotificationPerm] = useState<NotificationPermission>(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "default"
  );
  const [testNotificationSent, setTestNotificationSent] = useState(false);

  // Email Notification States
  const [testEmailAddress, setTestEmailAddress] = useState(user?.email || "");
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
  const [emailTestResult, setEmailTestResult] = useState<EmailDispatchResult | null>(null);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [emailConfig, setEmailConfig] = useState<EmailConfigResponse | null>(null);
  const [emailProvider, setEmailProvider] = useState<"auto" | "resend" | "sendgrid">("auto");
  const [customApiKey, setCustomApiKey] = useState("");
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [simulatedInactivityHours, setSimulatedInactivityHours] = useState<number>(22);
  const [inactivityThreshold, setInactivityThreshold] = useState<number>(20);
  const [emailSubTab, setEmailSubTab] = useState<"dispatch" | "scheduler" | "runbook">("dispatch");
  const [copiedRunbook, setCopiedRunbook] = useState<string | null>(null);

  // Google Sheets Integration States
  const [sheetsConfig, setSheetsConfig] = useState<SheetsSyncConfig>(getSheetsConfig());
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const [sheetsSyncResult, setSheetsSyncResult] = useState<SheetsSyncResult | null>(null);
  const [copiedAppsScript, setCopiedAppsScript] = useState(false);
  const [showAppsScriptGuide, setShowAppsScriptGuide] = useState(false);

  // Keep test email address in sync with authenticated user
  useEffect(() => {
    if (user?.email && !testEmailAddress) {
      setTestEmailAddress(user.email);
    }
  }, [user]);

  // Load server-side email provider status from Cloud Run
  useEffect(() => {
    fetchEmailConfig()
      .then((cfg) => setEmailConfig(cfg))
      .catch((err) => console.warn("Failed to load email config from Cloud Run:", err));
  }, []);

  const handleEnableNotifications = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        const perm = await Notification.requestPermission();
        setBrowserNotificationPerm(perm);
        if (perm === "granted") {
          new Notification("Ana Circadian: Notifications Enabled", {
            body: "You are connected! Ana will gently nudge you if you have not journaled in over 20 hours.",
          });
        }
      } catch (e) {
        console.warn("Notification permission request error:", e);
      }
    }
  };

  const handleSendTestNotification = () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification("Ana Circadian: Evening Loop Closure", {
          body: `Notice any unresolved tension? It has been ${hoursSinceLastEntry.toFixed(1)} hours since your last reflection. Take 90 seconds to deposit open mental loops.`,
        });
        setTestNotificationSent(true);
        setTimeout(() => setTestNotificationSent(false), 3000);
      } else {
        handleEnableNotifications();
      }
    }
  };

  const latestEntry = useMemo(() => {
    if (!entries || entries.length === 0) return null;
    return [...entries].sort((a, b) => b.createdAt - a.createdAt)[0];
  }, [entries]);

  const hoursSinceLastEntry = useMemo(() => {
    if (!latestEntry) return 24;
    return Math.max(0, (Date.now() - latestEntry.createdAt) / (1000 * 60 * 60));
  }, [latestEntry]);

  const handleRunSchedulerCheck = async () => {
    setIsCheckingScheduler(true);
    try {
      const data = await runCircadianSchedulerCheck({
        userId: user ? user.uid : "guest_authenticated",
        userEmail: testEmailAddress || user?.email || undefined,
        userName: user?.displayName || (testEmailAddress ? testEmailAddress.split("@")[0] : "Reflective User"),
        lastEntryAt: latestEntry ? latestEntry.createdAt : (Date.now() - simulatedInactivityHours * 60 * 60 * 1000),
        thresholdHours: inactivityThreshold,
        provider: emailProvider,
        apiKey: customApiKey.trim() || undefined,
      });
      setSchedulerDiagnostics(data);
    } catch (err: any) {
      setSchedulerDiagnostics({ error: err?.message || "Failed to contact Cloud Run service Ana" });
    } finally {
      setIsCheckingScheduler(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmailAddress || !testEmailAddress.includes("@")) return;
    setIsSendingTestEmail(true);
    setEmailTestResult(null);
    try {
      const res = await dispatchTestEmail({
        recipientEmail: testEmailAddress,
        recipientName: user?.displayName || testEmailAddress.split("@")[0],
        hoursInactive: simulatedInactivityHours,
        circadianPhase: simulatedInactivityHours >= 20 ? "Evening Loop Closure" : "Morning Dopamine Prime",
        provider: emailProvider,
        apiKey: customApiKey.trim() || undefined,
      });
      setEmailTestResult(res);
    } catch (err: any) {
      setEmailTestResult({
        status: "error",
        provider: "preview_mock",
        message: err?.message || "Failed to dispatch test email",
        recipient: testEmailAddress,
        subject: "Ana // Circadian Inactivity Alert",
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsSendingTestEmail(false);
    }
  };

  const handleCopyRunbook = (snippet: string, key: string) => {
    navigator.clipboard.writeText(snippet);
    setCopiedRunbook(key);
    setTimeout(() => setCopiedRunbook(null), 2500);
  };

  const handleUpdateSheetsConfig = (updates: Partial<SheetsSyncConfig>) => {
    const updated = { ...sheetsConfig, ...updates };
    setSheetsConfig(updated);
    saveSheetsConfig(updated);
  };

  const handleSyncToSheets = async () => {
    setIsSyncingSheets(true);
    setSheetsSyncResult(null);
    try {
      const res = await syncToGoogleSheets({
        entries,
        sessions,
        glimmers,
        userEmail: user?.email || undefined,
        webhookUrl: sheetsConfig.webhookUrl,
        spreadsheetId: sheetsConfig.spreadsheetId,
      });
      setSheetsSyncResult(res);
      setSheetsConfig(prev => ({ ...prev, lastSyncedAt: Date.now() }));
    } catch (err: any) {
      setSheetsSyncResult({
        success: false,
        message: err?.message || "Failed to synchronize with Google Sheets",
        rowsAppended: 0,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsSyncingSheets(false);
    }
  };

  const handleExportSheetsCsv = () => {
    const csvContent = exportToGoogleSheetsCsv(entries);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ana-google-sheets-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyAppsScript = () => {
    const script = getGoogleAppsScriptTemplate();
    navigator.clipboard.writeText(script);
    setCopiedAppsScript(true);
    setTimeout(() => setCopiedAppsScript(false), 2500);
  };

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

              {/* Card 2: Circadian Cloud Scheduler & Inactivity Monitor */}
              <div className="bg-[#262626] border border-[#3D4028] p-4 rounded-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <Clock className="w-4 h-4 text-[#A3A649]" />
                    <span>CIRCADIAN CLOUD SCHEDULER &amp; INACTIVITY MONITOR</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-xs border text-[10px] font-semibold ${
                    hoursSinceLastEntry >= 20 
                      ? "bg-[#AD3D30]/20 border-[#AD3D30]/50 text-[#AD3D30]" 
                      : "bg-[#10b981]/20 border-[#10b981]/50 text-[#10b981]"
                  }`}>
                    {hoursSinceLastEntry >= 20 ? "INACTIVE (> 20h) • NUDGE ELIGIBLE" : "ACTIVE • LOOP CLOSED"}
                  </span>
                </div>

                <p className="text-xs text-[#8C8C8C] leading-relaxed">
                  Evaluates the signed-in user's entry timeline in Firestore. If no reflective entry has been created in &gt;20 hours, Cloud Scheduler dispatches a low-friction circadian nudge to complete loop closure.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="p-2 bg-[#181818] border border-[#3D4028] rounded-xs space-y-1">
                    <span className="text-[10px] text-[#8C8C8C] block">Target Signed-In User</span>
                    <span className="text-white font-mono text-[11px] truncate block" title={user?.uid || "Guest"}>
                      {user ? user.uid : "Guest (Local Session)"}
                    </span>
                  </div>
                  <div className="p-2 bg-[#181818] border border-[#3D4028] rounded-xs space-y-1">
                    <span className="text-[10px] text-[#8C8C8C] block">Last Journal Entry</span>
                    <span className="text-[#A3A649] font-mono text-[11px] block">
                      {latestEntry ? `${hoursSinceLastEntry.toFixed(1)} hrs ago` : "No entries yet"}
                    </span>
                  </div>
                  <div className="p-2 bg-[#181818] border border-[#3D4028] rounded-xs space-y-1">
                    <span className="text-[10px] text-[#8C8C8C] block">Cloud Scheduler Target</span>
                    <span className="text-white font-mono text-[11px] block">
                      asia-southeast1 → Ana
                    </span>
                  </div>
                </div>

                {/* Device Notification Delivery Sub-Card */}
                <div className="p-3 bg-[#181818] border border-[#3D4028] rounded-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-white font-bold text-xs">
                      <Bell className="w-3.5 h-3.5 text-[#A3A649]" />
                      <span>Device Push Notification Delivery (Web Notification API)</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      browserNotificationPerm === "granted"
                        ? "bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40"
                        : browserNotificationPerm === "denied"
                        ? "bg-[#AD3D30]/20 text-[#AD3D30] border border-[#AD3D30]/40"
                        : "bg-[#262626] text-[#8C8C8C] border border-[#3D4028]"
                    }`}>
                      {browserNotificationPerm === "granted" ? "ACTIVE • PERMISSION GRANTED" : browserNotificationPerm === "denied" ? "BLOCKED IN BROWSER" : "NOT CONFIGURED YET"}
                    </span>
                  </div>

                  <p className="text-[11px] text-[#8C8C8C] leading-relaxed">
                    When Cloud Scheduler triggers during the morning prime or evening wind-down window, Ana sends this circadian loop-closure nudge directly to your desktop or mobile screen.
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {browserNotificationPerm !== "granted" ? (
                      <button
                        onClick={handleEnableNotifications}
                        className="px-3 py-1.5 rounded-xs bg-[#A3A649] hover:bg-[#A3A649]/80 text-black text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Bell className="w-3.5 h-3.5" />
                        <span>Enable Device Notifications</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleSendTestNotification}
                        className="px-3 py-1.5 rounded-xs bg-[#10b981] hover:bg-[#10b981]/80 text-black text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        {testNotificationSent ? <Check className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
                        <span>{testNotificationSent ? "Notification Sent!" : "Send Test Notification to This Screen"}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Diagnostics Trigger */}
                <div className="pt-2 border-t border-[#3D4028] flex flex-wrap items-center justify-between gap-2">
                  <button
                    onClick={handleRunSchedulerCheck}
                    disabled={isCheckingScheduler}
                    className="px-3 py-1.5 rounded-xs bg-[#3D4028] hover:bg-[#A3A649] text-[#A3A649] hover:text-black border border-[#A3A649]/50 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isCheckingScheduler ? "animate-spin" : ""}`} />
                    <span>{isCheckingScheduler ? "Evaluating..." : "Run Scheduler Diagnostic for Signed-In User"}</span>
                  </button>
                  <span className="text-[10px] text-[#8C8C8C] font-mono">
                    POST /api/scheduler/check-inactivity
                  </span>
                </div>

                {/* Live Output */}
                {schedulerDiagnostics && (
                  <div className="mt-3 p-3 bg-[#121212] border border-[#3D4028] rounded-xs space-y-2 text-xs">
                    <div className="flex items-center justify-between text-[11px] text-[#A3A649] font-bold border-b border-[#3D4028] pb-1">
                      <div className="flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5" />
                        <span>Cloud Scheduler Evaluation Response</span>
                      </div>
                      <span className="text-[#8C8C8C] text-[10px]">Cloud Run: Ana (asia-southeast1)</span>
                    </div>

                    <div className="p-2 bg-[#181818] rounded border border-[#262626] space-y-1 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="text-[#8C8C8C]">Action Required:</span>
                        <span className={`font-bold ${
                          schedulerDiagnostics.evaluation?.actionRequired === "DISPATCH_CIRCADIAN_NUDGE" 
                            ? "text-[#AD3D30]" 
                            : "text-[#10b981]"
                        }`}>
                          {schedulerDiagnostics.evaluation?.actionRequired || "NONE"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#8C8C8C]">Circadian Phase:</span>
                        <span className="text-white font-semibold">
                          {schedulerDiagnostics.evaluation?.circadianPhase || "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#8C8C8C]">Elapsed Time:</span>
                        <span className="text-white font-mono">
                          {schedulerDiagnostics.evaluation?.hoursElapsed} hours
                        </span>
                      </div>
                      {schedulerDiagnostics.evaluation?.nudgePayload && (
                        <div className="pt-1.5 border-t border-[#3D4028] text-[#e2e8f0]">
                          <span className="text-[10px] text-[#A3A649] block font-bold">Preview Nudge:</span>
                          <p className="text-[11px] text-[#8C8C8C] italic">
                            "{schedulerDiagnostics.evaluation.nudgePayload.body}"
                          </p>
                        </div>
                      )}
                    </div>

                    {/* gcloud commands */}
                    {schedulerDiagnostics.gcloudVerificationCommands && (
                      <div className="pt-2 border-t border-[#3D4028] space-y-1">
                        <div className="flex items-center gap-1.5 text-[10px] text-[#A3A649] font-bold">
                          <Terminal className="w-3 h-3" />
                          <span>gcloud Verification Commands</span>
                        </div>
                        <pre className="text-[10px] font-mono text-[#8C8C8C] bg-[#181818] p-2 rounded overflow-x-auto whitespace-pre">
{`# Run job immediately from terminal
${schedulerDiagnostics.gcloudVerificationCommands.runJobNow}

# View Cloud Run logs
${schedulerDiagnostics.gcloudVerificationCommands.readLogs}`}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Card 3: Direct Circadian Inactivity Email Notifications */}
              <div className="bg-[#262626] border border-[#3D4028] p-4 rounded-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#3D4028] pb-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <Mail className="w-4 h-4 text-[#A3A649]" />
                    <span>DIRECT CIRCADIAN INACTIVITY EMAIL NOTIFICATIONS</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-xs border text-[10px] font-bold ${
                      emailConfig?.hasResendKey
                        ? "bg-[#10b981]/20 border-[#10b981]/50 text-[#10b981]"
                        : emailConfig?.hasSendgridKey
                        ? "bg-[#10b981]/20 border-[#10b981]/50 text-[#10b981]"
                        : "bg-[#A3A649]/20 border-[#A3A649]/50 text-[#A3A649]"
                    }`}>
                      {emailConfig?.hasResendKey
                        ? "RESEND REST API (SECRET MANAGER)"
                        : emailConfig?.hasSendgridKey
                        ? "SENDGRID API (SECRET MANAGER)"
                        : "DIAGNOSTIC PREVIEW MODE"}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-[#8C8C8C] leading-relaxed">
                  Real-world transactional notification engine powered by Google Cloud Scheduler, Cloud Run, and SendGrid/Resend REST APIs. When inactivity exceeds circadian threshold (&gt;20h), Ana automatically delivers a compassionate loop-closure prompt to your inbox.
                </p>

                {/* Sub-Tabs: Dispatch vs Scheduler Cron vs Runbook */}
                <div className="flex items-center gap-1 border-b border-[#3D4028] pb-2 text-[11px]">
                  <button
                    onClick={() => setEmailSubTab("dispatch")}
                    className={`px-3 py-1 rounded-xs font-bold transition-all cursor-pointer ${
                      emailSubTab === "dispatch"
                        ? "bg-[#A3A649] text-black"
                        : "bg-[#181818] text-[#8C8C8C] hover:text-white border border-[#3D4028]"
                    }`}
                  >
                    1. Direct Live Dispatch
                  </button>
                  <button
                    onClick={() => setEmailSubTab("scheduler")}
                    className={`px-3 py-1 rounded-xs font-bold transition-all cursor-pointer ${
                      emailSubTab === "scheduler"
                        ? "bg-[#A3A649] text-black"
                        : "bg-[#181818] text-[#8C8C8C] hover:text-white border border-[#3D4028]"
                    }`}
                  >
                    2. Cloud Scheduler Simulator
                  </button>
                  <button
                    onClick={() => setEmailSubTab("runbook")}
                    className={`px-3 py-1 rounded-xs font-bold transition-all cursor-pointer ${
                      emailSubTab === "runbook"
                        ? "bg-[#A3A649] text-black"
                        : "bg-[#181818] text-[#8C8C8C] hover:text-white border border-[#3D4028]"
                    }`}
                  >
                    3. GCP Secret Manager Runbook
                  </button>
                </div>

                {/* TAB 1: Direct Live Dispatch */}
                {emailSubTab === "dispatch" && (
                  <div className="p-3 bg-[#181818] border border-[#3D4028] rounded-xs space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Recipient Email */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-[#8C8C8C] font-semibold uppercase block">
                          Recipient Email Address
                        </label>
                        <input
                          type="email"
                          value={testEmailAddress}
                          onChange={(e) => setTestEmailAddress(e.target.value)}
                          placeholder="user@example.com"
                          className="w-full bg-[#121212] border border-[#3D4028] rounded-xs px-2.5 py-1.5 text-xs text-white placeholder-[#8C8C8C]/50 focus:border-[#A3A649] outline-none font-mono"
                        />
                      </div>

                      {/* Active Provider Selector */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-[#8C8C8C] font-semibold uppercase block">
                          Dispatch Provider
                        </label>
                        <select
                          value={emailProvider}
                          onChange={(e) => setEmailProvider(e.target.value as any)}
                          className="w-full bg-[#121212] border border-[#3D4028] rounded-xs px-2.5 py-1.5 text-xs text-white focus:border-[#A3A649] outline-none font-mono"
                        >
                          <option value="auto">Auto-Detect (Cloud Run Secrets / Key Prefix)</option>
                          <option value="resend">Resend REST API (api.resend.com)</option>
                          <option value="sendgrid">SendGrid REST API (api.sendgrid.com)</option>
                        </select>
                      </div>
                    </div>

                    {/* Inactivity Simulation Preset Chips */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-[#8C8C8C] font-semibold uppercase">
                          Simulated Inactivity Timeframe:
                        </span>
                        <span className={`font-mono font-bold ${
                          simulatedInactivityHours >= 20 ? "text-[#AD3D30]" : "text-[#10b981]"
                        }`}>
                          {simulatedInactivityHours}h elapsed • {simulatedInactivityHours >= 20 ? "LOOP CLOSURE NUDGE" : "ACTIVE (LOOP CLOSED)"}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {[
                          { hours: 14, label: "14h (Active • No Nudge)" },
                          { hours: 20, label: "20h (Circadian Threshold)" },
                          { hours: 26, label: "26h (Overdue Nudge)" },
                          { hours: 48, label: "48h (Somatic Reset Prompt)" },
                        ].map((preset) => (
                          <button
                            key={preset.hours}
                            type="button"
                            onClick={() => setSimulatedInactivityHours(preset.hours)}
                            className={`px-2 py-1 rounded-xs text-[10px] font-mono transition-all cursor-pointer ${
                              simulatedInactivityHours === preset.hours
                                ? "bg-[#3D4028] text-[#d4da55] border border-[#A3A649] font-bold"
                                : "bg-[#121212] text-[#8C8C8C] border border-[#262626] hover:border-[#3D4028]"
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Optional Custom API Key Override for live testing */}
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                        className="text-[10px] text-[#A3A649] hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        <Key className="w-3 h-3" />
                        <span>{showApiKeyInput ? "Hide Direct API Key Override" : "Supply Test API Key (Zero-Deploy Verification)"}</span>
                      </button>

                      {showApiKeyInput && (
                        <div className="mt-2 p-2 bg-[#121212] border border-[#3D4028] rounded-xs space-y-1">
                          <label className="text-[10px] text-[#8C8C8C] block">
                            Direct Secret Key (e.g., <span className="text-white font-mono">re_...</span> or <span className="text-white font-mono">SG....</span>)
                          </label>
                          <input
                            type="password"
                            value={customApiKey}
                            onChange={(e) => setCustomApiKey(e.target.value)}
                            placeholder="re_123456789... or SG.xxxxxxxx"
                            className="w-full bg-[#181818] border border-[#3D4028] rounded-xs px-2 py-1 text-xs text-white placeholder-[#8C8C8C]/50 focus:border-[#A3A649] outline-none font-mono"
                          />
                          <span className="text-[9.5px] text-[#8C8C8C] block">
                            Passed securely in request payload for instant verification. In production, store this in Google Cloud Secret Manager.
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Dispatch Action Button */}
                    <div className="pt-2 flex items-center justify-between">
                      <button
                        onClick={handleSendTestEmail}
                        disabled={isSendingTestEmail || !testEmailAddress}
                        className="px-4 py-2 bg-[#AD3D30] hover:bg-[#AD3D30]/80 text-white rounded-xs text-xs font-bold transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 shadow-md"
                      >
                        <Send className={`w-3.5 h-3.5 ${isSendingTestEmail ? "animate-pulse" : ""}`} />
                        <span>{isSendingTestEmail ? "Dispatching Live Email..." : "Send Circadian Inactivity Email"}</span>
                      </button>
                      <span className="text-[10px] text-[#8C8C8C] font-mono">
                        POST /api/notifications/send-email
                      </span>
                    </div>

                    {/* Dispatch Result Display */}
                    {emailTestResult && (
                      <div className={`p-3 rounded-xs border text-xs space-y-2 animate-in fade-in duration-200 ${
                        emailTestResult.status === "error"
                          ? "bg-[#AD3D30]/15 border-[#AD3D30] text-[#e2e8f0]"
                          : emailTestResult.status === "sent"
                          ? "bg-[#10b981]/15 border-[#10b981] text-[#e2e8f0]"
                          : "bg-[#A3A649]/15 border-[#A3A649] text-[#e2e8f0]"
                      }`}>
                        <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                          <span className={`font-bold flex items-center gap-1.5 text-xs ${
                            emailTestResult.status === "error"
                              ? "text-[#AD3D30]"
                              : emailTestResult.status === "sent"
                              ? "text-[#10b981]"
                              : "text-[#d4da55]"
                          }`}>
                            {emailTestResult.status === "error" ? (
                              <AlertCircle className="w-4 h-4 text-[#AD3D30]" />
                            ) : emailTestResult.status === "sent" ? (
                              <CheckCircle2 className="w-4 h-4 text-[#10b981]" />
                            ) : (
                              <Sparkles className="w-4 h-4 text-[#d4da55]" />
                            )}
                            {emailTestResult.status === "error"
                              ? "DISPATCH ERROR"
                              : emailTestResult.status === "sent"
                              ? "EMAIL DELIVERED TO INBOX"
                              : "DIAGNOSTIC PREVIEW GENERATED"}
                          </span>
                          <span className="text-[10px] font-mono uppercase bg-black/40 px-2 py-0.5 rounded border border-white/10 text-[#d4da55]">
                            PROVIDER: {emailTestResult.provider}
                          </span>
                        </div>

                        <p className="text-[11.5px] leading-relaxed">
                          {emailTestResult.message}
                        </p>

                        {emailTestResult.id && (
                          <div className="text-[10px] font-mono text-[#8C8C8C]">
                            Provider Reference ID: <span className="text-white">{emailTestResult.id}</span>
                          </div>
                        )}

                        {emailTestResult.htmlPreview && (
                          <div className="pt-2 border-t border-white/10">
                            <button
                              onClick={() => setShowEmailPreview(!showEmailPreview)}
                              className="text-[11px] text-[#d4da55] underline cursor-pointer hover:text-white font-mono"
                            >
                              {showEmailPreview ? "Hide Formatted Email Preview" : "Inspect Rendered Email Template HTML"}
                            </button>
                            {showEmailPreview && (
                              <div className="mt-2.5 p-3 bg-[#121212] border border-[#3D4028] rounded-xs max-h-72 overflow-y-auto shadow-inner">
                                <div dangerouslySetInnerHTML={{ __html: emailTestResult.htmlPreview }} />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: Cloud Scheduler Cron Simulator */}
                {emailSubTab === "scheduler" && (
                  <div className="p-3 bg-[#181818] border border-[#3D4028] rounded-xs space-y-3 text-xs">
                    <p className="text-[#8C8C8C] leading-relaxed text-[11px]">
                      Simulates the exact HTTP call that Google Cloud Scheduler executes automatically every 4 hours. When user inactivity exceeds the threshold, the service triggers loop-closure re-engagement.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="p-2 bg-[#121212] border border-[#3D4028] rounded-xs">
                        <span className="text-[10px] text-[#8C8C8C] block">Target Cron Route</span>
                        <span className="text-white font-mono text-[11px]">/api/scheduler/check-inactivity</span>
                      </div>
                      <div className="p-2 bg-[#121212] border border-[#3D4028] rounded-xs">
                        <span className="text-[10px] text-[#8C8C8C] block">Trigger Region</span>
                        <span className="text-[#d4da55] font-mono text-[11px]">asia-southeast1</span>
                      </div>
                      <div className="p-2 bg-[#121212] border border-[#3D4028] rounded-xs">
                        <span className="text-[10px] text-[#8C8C8C] block">Inactivity Gate</span>
                        <span className="text-white font-mono text-[11px]">&gt;= {inactivityThreshold}h</span>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      <button
                        onClick={handleRunSchedulerCheck}
                        disabled={isCheckingScheduler}
                        className="px-4 py-2 bg-[#3D4028] hover:bg-[#A3A649] text-[#d4da55] hover:text-black border border-[#A3A649]/60 rounded-xs text-xs font-bold transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isCheckingScheduler ? "animate-spin" : ""}`} />
                        <span>{isCheckingScheduler ? "Evaluating Cron..." : "Trigger Cloud Scheduler Webhook Simulation"}</span>
                      </button>
                    </div>

                    {schedulerDiagnostics && (
                      <div className="mt-2 p-3 bg-[#121212] border border-[#3D4028] rounded-xs space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-bold text-[#A3A649] border-b border-[#3D4028] pb-1">
                          <span>Scheduler Response Payload</span>
                          <span className="text-[#8C8C8C] text-[10px] font-mono">Service: Ana</span>
                        </div>
                        <pre className="text-[10px] font-mono text-[#cbd5e1] overflow-x-auto whitespace-pre p-2 bg-[#181818] rounded border border-[#262626]">
                          {JSON.stringify(schedulerDiagnostics, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: Google Cloud Secret Manager & Scheduler Runbook */}
                {emailSubTab === "runbook" && (
                  <div className="p-3 bg-[#181818] border border-[#3D4028] rounded-xs space-y-3 text-xs">
                    <p className="text-[#8C8C8C] text-[11px]">
                      Official Google Cloud CLI runbook for zero-trust Secret Manager and Cloud Scheduler deployment:
                    </p>

                    {/* Runbook Step 1 */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-white">
                        <span>1. Create Secret in Google Cloud Secret Manager</span>
                        <button
                          onClick={() => handleCopyRunbook("gcloud secrets create RESEND_API_KEY --replication-policy=\"automatic\"\necho -n \"YOUR_API_KEY\" | gcloud secrets versions add RESEND_API_KEY --data-file=-", "step1")}
                          className="text-[10px] text-[#A3A649] hover:text-white flex items-center gap-1 cursor-pointer font-mono"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{copiedRunbook === "step1" ? "COPIED" : "COPY"}</span>
                        </button>
                      </div>
                      <pre className="p-2 bg-[#121212] border border-[#3D4028] rounded-xs font-mono text-[10px] text-[#8C8C8C] overflow-x-auto whitespace-pre">
{`# Create Secret in Secret Manager
gcloud secrets create RESEND_API_KEY --replication-policy="automatic"

# Inject API key securely without bash history leaks
echo -n "re_YOUR_API_KEY" | gcloud secrets versions add RESEND_API_KEY --data-file=-`}
                      </pre>
                    </div>

                    {/* Runbook Step 2 */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-white">
                        <span>2. Mount Secret to Cloud Run Service</span>
                        <button
                          onClick={() => handleCopyRunbook("gcloud run services update Ana --update-secrets=RESEND_API_KEY=RESEND_API_KEY:latest --region=asia-southeast1", "step2")}
                          className="text-[10px] text-[#A3A649] hover:text-white flex items-center gap-1 cursor-pointer font-mono"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{copiedRunbook === "step2" ? "COPIED" : "COPY"}</span>
                        </button>
                      </div>
                      <pre className="p-2 bg-[#121212] border border-[#3D4028] rounded-xs font-mono text-[10px] text-[#8C8C8C] overflow-x-auto whitespace-pre">
{`# Bind Secret Manager secret to Cloud Run environment variable
gcloud run services update Ana \\
  --update-secrets=RESEND_API_KEY=RESEND_API_KEY:latest \\
  --region=asia-southeast1`}
                      </pre>
                    </div>

                    {/* Runbook Step 3 */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-white">
                        <span>3. Configure Google Cloud Scheduler Inactivity Cron</span>
                        <button
                          onClick={() => handleCopyRunbook("gcloud scheduler jobs create http ana-circadian-inactivity-cron --schedule=\"0 */4 * * *\" --uri=\"https://ana-service-url/api/scheduler/check-inactivity\" --location=asia-southeast1 --oidc-service-account-email=ana-invoker@ai-studio-1964eda9-cc24-452a-bee7-3ab0780e0478.iam.gserviceaccount.com", "step3")}
                          className="text-[10px] text-[#A3A649] hover:text-white flex items-center gap-1 cursor-pointer font-mono"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{copiedRunbook === "step3" ? "COPIED" : "COPY"}</span>
                        </button>
                      </div>
                      <pre className="p-2 bg-[#121212] border border-[#3D4028] rounded-xs font-mono text-[10px] text-[#8C8C8C] overflow-x-auto whitespace-pre">
{`# Create authenticated HTTP cron job triggering every 4 hours
gcloud scheduler jobs create http ana-circadian-inactivity-cron \\
  --schedule="0 */4 * * *" \\
  --uri="https://YOUR_CLOUD_RUN_URL/api/scheduler/check-inactivity" \\
  --location=asia-southeast1 \\
  --oidc-service-account-email=ana-invoker@ai-studio-1964eda9-cc24-452a-bee7-3ab0780e0478.iam.gserviceaccount.com`}
                      </pre>
                    </div>
                  </div>
                )}
              </div>

              {/* Card 4: Google Workspace: Dual-Mode Google Sheets Integration */}
              <div className="bg-[#262626] border border-[#3D4028] p-4 rounded-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <FileSpreadsheet className="w-4 h-4 text-[#A3A649]" />
                    <span>GOOGLE WORKSPACE: DUAL-MODE GOOGLE SHEETS INTEGRATION</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-xs bg-[#10b981]/20 border border-[#10b981]/50 text-[10px] text-[#10b981] font-semibold">
                    SHEETS API v4 + APPS SCRIPT
                  </span>
                </div>

                <p className="text-xs text-[#8C8C8C] leading-relaxed">
                  Export and synchronize your reflective prose, mood trajectories, sleep and tension telemetry directly into Google Sheets. Supports instant auto-sync on save or manual 1-click batch synchronization.
                </p>

                <div className="p-3 bg-[#181818] border border-[#3D4028] rounded-xs space-y-3">
                  {/* Auto Sync Toggle */}
                  <div className="flex items-center justify-between p-2 bg-[#121212] border border-[#3D4028] rounded-xs">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-white block">Auto-Sync on Save</span>
                      <span className="text-[10px] text-[#8C8C8C] block">
                        Automatically dispatch new journal reflections to Google Sheets when saved
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sheetsConfig.autoSync}
                        onChange={(e) => handleUpdateSheetsConfig({ autoSync: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-[#262626] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#A3A649]"></div>
                    </label>
                  </div>

                  {/* Webhook URL Input */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-[#8C8C8C] font-semibold uppercase block">
                      Google Apps Script Webhook URL (Optional for Direct Live Sync)
                    </label>
                    <input
                      type="url"
                      value={sheetsConfig.webhookUrl}
                      onChange={(e) => handleUpdateSheetsConfig({ webhookUrl: e.target.value })}
                      placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                      className="w-full bg-[#121212] border border-[#3D4028] rounded-xs px-2.5 py-1.5 text-xs text-white placeholder-[#8C8C8C]/50 focus:border-[#A3A649] outline-none font-mono"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      onClick={handleSyncToSheets}
                      disabled={isSyncingSheets}
                      className="px-3 py-1.5 rounded-xs bg-[#A3A649] hover:bg-[#A3A649]/80 text-black text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <FileSpreadsheet className={`w-3.5 h-3.5 ${isSyncingSheets ? "animate-spin" : ""}`} />
                      <span>{isSyncingSheets ? "Syncing..." : "Sync All Data to Google Sheets Now"}</span>
                    </button>

                    <button
                      onClick={handleExportSheetsCsv}
                      className="px-3 py-1.5 rounded-xs bg-[#262626] hover:bg-[#3D4028] text-white border border-[#3D4028] text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download .CSV for Google Sheets</span>
                    </button>
                  </div>

                  {/* Sync Feedback Result */}
                  {sheetsSyncResult && (
                    <div className={`p-2 rounded-xs border text-xs flex items-center justify-between ${
                      sheetsSyncResult.success
                        ? "bg-[#10b981]/10 border-[#10b981]/40 text-[#10b981]"
                        : "bg-[#AD3D30]/10 border-[#AD3D30] text-[#AD3D30]"
                    }`}>
                      <span>{sheetsSyncResult.message}</span>
                      <span className="font-mono text-[10px] text-[#8C8C8C]">
                        {sheetsSyncResult.rowsAppended} rows
                      </span>
                    </div>
                  )}

                  {/* Collapsible Apps Script Setup Guide */}
                  <div className="border-t border-[#3D4028] pt-2">
                    <button
                      onClick={() => setShowAppsScriptGuide(!showAppsScriptGuide)}
                      className="text-xs text-[#A3A649] hover:text-white flex items-center gap-1 cursor-pointer font-bold"
                    >
                      {showAppsScriptGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      <span>How to link your private Google Sheet in 30 seconds</span>
                    </button>

                    {showAppsScriptGuide && (
                      <div className="mt-2 p-3 bg-[#121212] border border-[#3D4028] rounded-xs space-y-2 text-xs">
                        <ol className="list-decimal list-inside space-y-1 text-[#8C8C8C] text-[11px] leading-relaxed">
                          <li>Open your private Google Sheet in your Google Workspace or Personal account.</li>
                          <li>Click <strong className="text-white">Extensions &gt; Apps Script</strong>.</li>
                          <li>Copy and paste the script below, then click <strong className="text-white">Save</strong>.</li>
                          <li>Click <strong className="text-white">Deploy &gt; New deployment</strong>, select <strong className="text-white">Web app</strong>, set access to <strong className="text-white">Anyone</strong>, and deploy.</li>
                          <li>Paste your generated Web App URL into the field above!</li>
                        </ol>

                        <div className="pt-1 flex items-center justify-between">
                          <span className="text-[10px] text-[#8C8C8C] font-mono">10-Line Lightweight Relay Script</span>
                          <button
                            onClick={handleCopyAppsScript}
                            className="px-2 py-1 bg-[#262626] hover:bg-[#3D4028] text-[#A3A649] border border-[#3D4028] rounded-xs text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            {copiedAppsScript ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedAppsScript ? "Copied to Clipboard!" : "Copy Apps Script"}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
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

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleExportJSON}
                    className="px-4 py-2 rounded-xs bg-[#AD3D30] hover:bg-[#AD3D30]/80 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download JSON Backup</span>
                  </button>

                  <button
                    onClick={handleExportSheetsCsv}
                    className="px-4 py-2 rounded-xs bg-[#262626] hover:bg-[#3D4028] text-[#A3A649] border border-[#3D4028] text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Export to Google Sheets (.CSV)</span>
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
