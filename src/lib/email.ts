// Circadian Email Notification Service for Ana
// Handles direct email testing, live dispatch, and Cloud Scheduler triggers via Cloud Run backend

export interface EmailTestRequest {
  recipientEmail: string;
  recipientName?: string;
  hoursInactive?: number;
  circadianPhase?: string;
  apiKey?: string;
  provider?: "sendgrid" | "resend" | "auto";
  fromEmail?: string;
}

export interface EmailDispatchResult {
  status: "sent" | "preview" | "error";
  provider: "sendgrid" | "resend" | "preview_mock";
  message: string;
  recipient: string;
  subject: string;
  id?: string;
  htmlPreview?: string;
  timestamp: string;
  errorDetail?: string;
}

export interface EmailConfigResponse {
  activeProvider: "resend" | "sendgrid" | "preview_mock" | "none";
  hasResendKey: boolean;
  hasSendgridKey: boolean;
  resendFromEmail: string;
  sendgridFromEmail: string;
  isCloudRun: boolean;
  cloudRunService: string;
  cloudSchedulerRegion: string;
  recommendedCron: string;
  cronEndpoint: string;
}

export interface SchedulerInactivityCheckParams {
  userId?: string;
  userEmail?: string;
  userName?: string;
  lastEntryAt?: number | null;
  thresholdHours?: number;
  apiKey?: string;
  provider?: "sendgrid" | "resend" | "auto";
  fromEmail?: string;
}

/**
 * Dispatches a direct circadian inactivity email notification via Cloud Run
 */
export const dispatchTestEmail = async (
  request: EmailTestRequest
): Promise<EmailDispatchResult> => {
  const response = await fetch("/api/notifications/send-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || data.message || `Email dispatch failed with status ${response.status}`);
  }

  return data;
};

/**
 * Fetches current email provider configuration status from Cloud Run backend
 */
export const fetchEmailConfig = async (): Promise<EmailConfigResponse> => {
  const response = await fetch("/api/notifications/config");
  if (!response.ok) {
    throw new Error(`Failed to fetch email config: ${response.statusText}`);
  }
  return response.json();
};

/**
 * Simulates or triggers a Cloud Scheduler inactivity evaluation
 */
export const runCircadianSchedulerCheck = async (
  params: SchedulerInactivityCheckParams
): Promise<any> => {
  const response = await fetch("/api/scheduler/check-inactivity", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || data.message || `Scheduler check failed with status ${response.status}`);
  }

  return data;
};

/**
 * Generates an accessible, neuroscience-aligned HTML template preview for the user in the UI
 */
export const getEmailTemplateHtml = (
  userName: string,
  hoursInactive: number,
  phase: string,
  appUrl: string = typeof window !== "undefined" ? window.location.origin : "https://ana-journal.app"
): string => {
  return `
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #121212; padding: 24px 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <tr>
        <td align="center">
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 560px; background-color: #181818; border: 1px solid #3D4028; border-radius: 6px; overflow: hidden; color: #e2e8f0;">
            <!-- Brand Header -->
            <tr>
              <td style="padding: 20px 24px; border-bottom: 1px solid #3D4028; background-color: #1c1c1c;">
                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td style="font-size: 16px; font-weight: 700; color: #ffffff; letter-spacing: 0.05em; font-family: monospace;">
                      <span style="display: inline-block; width: 24px; height: 24px; line-height: 24px; text-align: center; background-color: #262626; border: 1px solid #A3A649; border-radius: 50%; color: #A3A649; font-size: 12px; margin-right: 8px;">A</span>
                      ANA // CIRCADIAN SYSTEM
                    </td>
                    <td align="right" style="font-size: 10px; color: #A3A649; font-family: monospace; font-weight: 600; text-transform: uppercase;">
                      [LOOP CLOSURE]
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Content Area -->
            <tr>
              <td style="padding: 24px;">
                <!-- Inactivity Alert Box -->
                <div style="background-color: #262626; border-left: 3px solid #AD3D30; border-top: 1px solid #3D4028; border-right: 1px solid #3D4028; border-bottom: 1px solid #3D4028; padding: 14px 16px; border-radius: 4px; margin-bottom: 20px;">
                  <span style="color: #A3A649; font-family: monospace; font-size: 10px; text-transform: uppercase; font-weight: bold; letter-spacing: 0.08em; display: block; margin-bottom: 4px;">
                    CIRCADIAN INACTIVITY ALERT • ${phase.toUpperCase()}
                  </span>
                  <h2 style="margin: 0; color: #ffffff; font-size: 16px; font-weight: 600; line-height: 1.4;">
                    Notice any unresolved mental tension, ${userName}?
                  </h2>
                </div>

                <!-- Main Narrative -->
                <p style="color: #d1d5db; font-size: 13.5px; line-height: 1.65; margin: 0 0 16px 0;">
                  It has been <strong style="color: #ffffff;">${hoursInactive.toFixed(1)} hours</strong> since your last mindful reflection. In the <strong style="color: #A3A649;">${phase}</strong> window, unclosed cognitive loops tend to consume prefrontal working memory and elevate subconscious cortisol.
                </p>

                <!-- Somatic Reset Box -->
                <div style="background-color: #1f2316; border: 1px dashed #A3A649; padding: 12px 14px; border-radius: 4px; margin-bottom: 24px;">
                  <div style="font-size: 11px; font-weight: bold; color: #d4da55; margin-bottom: 4px; font-family: monospace;">
                    🌿 60-SECOND PHYSIOLOGICAL SIGH RESET:
                  </div>
                  <div style="font-size: 12px; color: #cbd5e1; line-height: 1.5;">
                    Take two quick inhales through the nose, followed by a long, slow sigh exhalation through the mouth. Repeat twice to down-regulate sympathetic arousal before returning to calm focus.
                  </div>
                </div>

                <!-- Call to Action Button -->
                <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 28px 0;">
                  <tr>
                    <td align="center">
                      <table cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td align="center" style="background-color: #A3A649; border-radius: 4px;">
                            <a href="${appUrl}/?action=circadian&source=email_nudge" target="_blank" style="display: inline-block; padding: 13px 28px; font-family: monospace, -apple-system, sans-serif; font-size: 13px; font-weight: 700; color: #121212; text-decoration: none; letter-spacing: 0.05em; border-radius: 4px;">
                              OPEN ANA STUDIO &amp; DEPOSIT OPEN LOOPS &rarr;
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <p style="color: #8C8C8C; font-size: 11.5px; line-height: 1.5; margin: 0; text-align: center;">
                  Taking just 90 seconds to externalize unresolved thoughts clears mental cache and facilitates natural restorative rest.
                </p>
              </td>
            </tr>

            <!-- Audit Footer -->
            <tr>
              <td style="padding: 16px 24px; border-top: 1px solid #3D4028; background-color: #141414; font-size: 10.5px; color: #737373; font-family: monospace; text-align: center; line-height: 1.6;">
                Engineered for Google Cloud &amp; Hack2Skill Ideathon Challenge Cohort 3<br/>
                Dispatched via Google Cloud Scheduler &amp; Cloud Run (asia-southeast1) • Synced with Cloud Firestore (us-west1)
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
};
