import "server-only";
import { Resend } from "resend";

export type EmailMessage = { to: string; subject: string; html: string; text: string };

export type SendResult =
  | { ok: true }
  // not_configured: RESEND_API_KEY / RESEND_FROM_EMAIL missing.
  // send_failed: Resend rejected it (bad key, unverified sender/recipient…).
  | { ok: false; reason: "not_configured" | "send_failed" };

// The single way this app sends email. Never throws — callers decide what
// the user sees — and never pretends: a missing config is a failure in
// production. (It used to log the message and return as if it had sent,
// which is exactly how "we emailed you a code" appeared with no email.)
export async function sendEmail(message: EmailMessage): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    if (process.env.NODE_ENV !== "production") {
      // Local dev without Resend: print it, so flows stay testable.
      console.log(
        `[email] Resend not configured — would send to ${message.to}:\n` +
          `Subject: ${message.subject}\n${message.text}`,
      );
      return { ok: true };
    }
    console.error(
      "[email] RESEND_API_KEY / RESEND_FROM_EMAIL not set — email NOT sent:",
      message.subject,
    );
    return { ok: false, reason: "not_configured" };
  }

  try {
    const { error } = await new Resend(apiKey).emails.send({ from, ...message });
    if (error) {
      console.error(`[email] Resend rejected "${message.subject}":`, error.message);
      return { ok: false, reason: "send_failed" };
    }
    return { ok: true };
  } catch (err) {
    console.error(`[email] Failed to reach Resend for "${message.subject}":`, err);
    return { ok: false, reason: "send_failed" };
  }
}
