// Circadian Email Notification Service for Ana
// Handles direct email testing and dispatch via Cloud Run backend

export interface EmailTestRequest {
  recipientEmail: string;
  recipientName?: string;
  hoursInactive?: number;
  circadianPhase?: string;
}

export interface EmailDispatchResult {
  status: "sent" | "preview" | "error";
  provider: "sendgrid" | "resend" | "smtp" | "preview_mock";
  message: string;
  recipient: string;
  subject: string;
  htmlPreview?: string;
  timestamp: string;
}

/**
 * Sends a test circadian inactivity email or triggers a live check
 */
export const dispatchTestEmail = async (
  request: EmailTestRequest
): Promise<EmailDispatchResult> => {
  const response = await fetch("/api/notifications/send-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Email dispatch failed with status ${response.status}`);
  }

  return response.json();
};

/**
 * Generates an accessible HTML template preview for the user in the UI
 */
export const getEmailTemplateHtml = (
  userName: string,
  hoursInactive: number,
  phase: string,
  appUrl: string = window.location.origin
): string => {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 540px; margin: 0 auto; background-color: #181818; color: #e2e8f0; border: 1px solid #3D4028; border-radius: 6px; overflow: hidden; padding: 28px;">
      <div style="display: flex; align-items: center; margin-bottom: 24px; border-bottom: 1px solid #3D4028; padding-bottom: 16px;">
        <div style="width: 32px; height: 32px; border-radius: 50%; background-color: #262626; border: 1px solid #A3A649; display: inline-flex; align-items: center; justify-content: center; margin-right: 12px; text-align: center; line-height: 32px; color: #A3A649; font-weight: bold; font-family: monospace;">A</div>
        <span style="font-size: 18px; font-weight: 700; color: #ffffff; letter-spacing: 0.05em;">Ana // Mindful System</span>
      </div>

      <div style="background-color: #262626; border: 1px solid #3D4028; padding: 12px 16px; border-radius: 4px; margin-bottom: 20px;">
        <span style="color: #A3A649; font-family: monospace; font-size: 11px; text-transform: uppercase; font-weight: bold;">[CIRCADIAN INACTIVITY ALERT]</span>
        <h3 style="margin: 6px 0 0 0; color: #ffffff; font-size: 16px;">Notice any unresolved mental tension, ${userName}?</h3>
      </div>

      <p style="color: #d1d5db; font-size: 14px; line-height: 1.6; margin-bottom: 16px;">
        It has been <strong>${hoursInactive.toFixed(1)} hours</strong> since your last mindful reflection. In the <strong>${phase}</strong> window, unclosed cognitive loops tend to consume working memory and elevate subconscious cortisol.
      </p>

      <p style="color: #9ca3af; font-size: 13px; line-height: 1.5; margin-bottom: 24px;">
        Take 90 seconds to deposit your open loops, anchor a single micro-glimmer, or run a 60-second physiological sigh reset.
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${appUrl}/?action=circadian" style="display: inline-block; background-color: #A3A649; color: #121212; font-weight: 700; font-size: 13px; text-decoration: none; padding: 12px 24px; border-radius: 4px; letter-spacing: 0.05em; font-family: monospace;">
          OPEN ANA STUDIO & DEPOSIT LOOPS
        </a>
      </div>

      <div style="border-top: 1px solid #3D4028; padding-top: 16px; margin-top: 24px; font-size: 11px; color: #8C8C8C; font-family: monospace; text-align: center;">
        Dispatched automatically via Google Cloud Scheduler & Cloud Run in asia-southeast1.<br/>
        Synced with Cloud Firestore ai-studio-1964eda9-cc24-452a-bee7-3ab0780e0478.
      </div>
    </div>
  `;
};
