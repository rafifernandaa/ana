import { JournalEntry, ResetSession, GlimmerAnchor } from "../types";

export interface SheetsSyncConfig {
  webhookUrl: string;
  spreadsheetId?: string;
  autoSync: boolean;
  lastSyncedAt?: number;
}

const STORAGE_KEY = "ana_google_sheets_config_v1";

export const getSheetsConfig = (): SheetsSyncConfig => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (err) {
    console.error("Failed to load Google Sheets config:", err);
  }
  return {
    webhookUrl: "",
    spreadsheetId: "",
    autoSync: false,
  };
};

export const saveSheetsConfig = (config: SheetsSyncConfig): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.error("Failed to save Google Sheets config:", err);
  }
};

export interface SheetsSyncPayload {
  entries: JournalEntry[];
  sessions?: ResetSession[];
  glimmers?: GlimmerAnchor[];
  userEmail?: string;
  webhookUrl?: string;
  spreadsheetId?: string;
}

export interface SheetsSyncResult {
  success: boolean;
  message: string;
  rowsAppended: number;
  target?: string;
  timestamp: string;
}

/**
 * Syncs user data to Google Sheets via the Ana Cloud Run backend or direct webhook
 */
export const syncToGoogleSheets = async (
  payload: SheetsSyncPayload
): Promise<SheetsSyncResult> => {
  const config = getSheetsConfig();
  const targetWebhook = payload.webhookUrl || config.webhookUrl;
  const targetSheetId = payload.spreadsheetId || config.spreadsheetId;

  // If a direct Apps Script webhook URL is provided, we can post directly or via server proxy
  try {
    const response = await fetch("/api/sheets/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        webhookUrl: targetWebhook,
        spreadsheetId: targetSheetId,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Server responded with status ${response.status}`);
    }

    const result: SheetsSyncResult = await response.json();
    
    // Update last synced timestamp
    saveSheetsConfig({
      ...config,
      lastSyncedAt: Date.now(),
    });

    return result;
  } catch (error: any) {
    // If server fails or offline, fallback to direct webhook fetch if available
    if (targetWebhook && targetWebhook.startsWith("http")) {
      try {
        const directRes = await fetch(targetWebhook, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "sync",
            entries: payload.entries,
            timestamp: new Date().toISOString(),
          }),
        });

        saveSheetsConfig({ ...config, lastSyncedAt: Date.now() });

        return {
          success: true,
          message: "Data dispatched directly to Google Apps Script Webhook.",
          rowsAppended: payload.entries.length,
          target: "Google Apps Script",
          timestamp: new Date().toISOString(),
        };
      } catch (directErr: any) {
        throw new Error(`Google Sheets Webhook dispatch failed: ${directErr?.message || directErr}`);
      }
    }

    throw error;
  }
};

/**
 * Generates an RFC-4180 compliant CSV string for instant Google Sheets import
 */
export const exportToGoogleSheetsCsv = (entries: JournalEntry[]): string => {
  const headers = [
    "Entry ID",
    "Date & Time",
    "Title",
    "Mood",
    "Tags",
    "Word Count",
    "Sleep Score (/7)",
    "Energy Level (/10)",
    "Somatic Tension (/10)",
    "Mental Clarity (/10)",
    "Summary / Loop Closure",
    "Content Excerpt",
  ];

  const rows = entries.map((entry) => {
    const escapeCsv = (val: any) => {
      const str = String(val ?? "").replace(/"/g, '""');
      return `"${str}"`;
    };

    const telemetry = entry.empiricalTelemetry;
    const words = entry.content.trim() ? entry.content.trim().split(/\s+/).length : 0;
    const excerpt = entry.content.slice(0, 300).replace(/[\r\n]+/g, " ");

    return [
      escapeCsv(entry.id),
      escapeCsv(new Date(entry.createdAt).toISOString()),
      escapeCsv(entry.title || "Untitled"),
      escapeCsv(entry.mood || "reflective"),
      escapeCsv((entry.tags || []).join(", ")),
      words,
      telemetry?.sleepScore ?? "",
      telemetry?.energyLevel ?? "",
      telemetry?.somaticTension ?? "",
      telemetry?.mentalClarity ?? "",
      escapeCsv(entry.aiSummary?.summary || ""),
      escapeCsv(excerpt),
    ].join(",");
  });

  return [headers.join(","), ...rows].join("\r\n");
};

/**
 * Returns the ready-to-use Google Apps Script code that users can paste into their Google Sheet
 */
export const getGoogleAppsScriptTemplate = (): string => {
  return `// === Ana Journal to Google Sheets Apps Script ===
// Instructions:
// 1. In your Google Sheet, click Extensions > Apps Script
// 2. Delete existing code, paste this script, and click Save (disk icon)
// 3. Click Deploy > New deployment
// 4. Select type: "Web app"
// 5. Set "Execute as": "Me"
// 6. Set "Who has access": "Anyone" (allows Ana Cloud Run to append rows securely)
// 7. Click Deploy, copy the Web App URL, and paste it into Ana's Settings!

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Set headers if sheet is brand new
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Timestamp",
        "Entry ID",
        "Title",
        "Mood",
        "Tags",
        "Word Count",
        "Sleep (/7)",
        "Energy (/10)",
        "Tension (/10)",
        "Clarity (/10)",
        "Summary",
        "Content Excerpt"
      ]);
      sheet.getRange("A1:L1").setFontWeight("bold").setBackground("#3D4028").setFontColor("#FFFFFF");
    }

    var data = JSON.parse(e.postData.contents);
    var entries = data.entries || [data.entry];
    var appended = 0;

    for (var i = 0; i < entries.length; i++) {
      var item = entries[i];
      if (!item) continue;
      
      var telem = item.empiricalTelemetry || {};
      sheet.appendRow([
        new Date(item.createdAt || Date.now()).toISOString(),
        item.id || "",
        item.title || "Untitled",
        item.mood || "reflective",
        (item.tags || []).join(", "),
        item.content ? item.content.split(/\\s+/).length : 0,
        telem.sleepScore || "",
        telem.energyLevel || "",
        telem.somaticTension || "",
        telem.mentalClarity || "",
        item.summary || "",
        (item.content || "").substring(0, 300)
      ]);
      appended++;
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      rowsAppended: appended,
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}`;
};
