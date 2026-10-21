import { LOGO_URL } from "@/lib/constants";
import type { EmailMessage } from "./send";

// Email-client-safe markup: tables and inline styles only (no <style>, no
// flex/grid) — that's what Gmail, Outlook and Apple Mail reliably render.
const NAVY = "#0b2b3c";
const ACCENT = "#f2994a";
const MUTED = "#64748b";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function layout(bodyHtml: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f7f9fb;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f9fb;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:20px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;">
            <tr>
              <td style="background:${NAVY};padding:20px 28px;">
                <img src="${LOGO_URL}" width="32" height="32" alt="" style="vertical-align:middle;border:0;" />
                <span style="color:#ffffff;font-size:18px;font-weight:bold;vertical-align:middle;margin-left:8px;">Konek+</span>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;color:${NAVY};font-size:15px;line-height:1.6;">
                ${bodyHtml}
              </td>
            </tr>
          </table>
          <p style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${MUTED};margin:16px 0 0;">
            Konek+ · One profile behind every card you own
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function loginCodeEmail(pin: string): Omit<EmailMessage, "to"> {
  return {
    subject: `${pin} is your Konek+ sign-in code`,
    text:
      `Your Konek+ sign-in code is ${pin}. It expires in 10 minutes.\n\n` +
      "If you didn't try to sign in, you can safely ignore this email — your password still kept them out.",
    html: layout(`
      <p style="margin:0 0 8px;font-size:18px;font-weight:bold;">Your sign-in code</p>
      <p style="margin:0 0 20px;color:${MUTED};">Enter this code to finish signing in on your new device.</p>
      <p style="margin:0 0 20px;padding:18px;background:#f1f5f9;border-radius:14px;text-align:center;font-family:'Courier New',monospace;font-size:34px;font-weight:bold;letter-spacing:10px;color:${NAVY};">${escapeHtml(pin)}</p>
      <p style="margin:0 0 6px;color:${MUTED};font-size:13px;">It expires in 10 minutes.</p>
      <p style="margin:0;color:${MUTED};font-size:13px;">Didn't try to sign in? You can safely ignore this email.</p>
    `),
  };
}

export type OrderAlertDetails = {
  reference: string;
  finishName: string;
  quantity: number;
  total: string;
  discountPct: number;
  fullName: string;
  phone: string;
  email: string | null;
  address: string;
  payment: string;
  notes: string | null;
  adminUrl: string;
};

export function orderAlertEmail(order: OrderAlertDetails): Omit<EmailMessage, "to"> {
  const row = (label: string, value: string) =>
    `<tr><td style="padding:6px 0;color:${MUTED};font-size:13px;width:110px;vertical-align:top;">${label}</td><td style="padding:6px 0;font-size:14px;">${value}</td></tr>`;
  const discount = order.discountPct > 0 ? ` (−${order.discountPct}% bulk)` : "";

  return {
    subject: `New order ${order.reference}: ${order.quantity} × ${order.finishName} · ${order.total}`,
    text: [
      `New Konek+ order ${order.reference}`,
      `${order.quantity} × ${order.finishName} — ${order.total}${discount}`,
      `Name: ${order.fullName}`,
      `Phone: ${order.phone}`,
      order.email ? `Email: ${order.email}` : null,
      `Address: ${order.address}`,
      `Payment: ${order.payment}`,
      order.notes ? `Notes: ${order.notes}` : null,
      "",
      `Manage it: ${order.adminUrl}`,
    ]
      .filter((line) => line !== null)
      .join("\n"),
    html: layout(`
      <p style="margin:0 0 4px;font-size:18px;font-weight:bold;">New order ${escapeHtml(order.reference)}</p>
      <p style="margin:0 0 20px;font-size:22px;font-weight:bold;color:${NAVY};">
        ${order.quantity} × ${escapeHtml(order.finishName)} · ${escapeHtml(order.total)}<span style="font-size:13px;color:${MUTED};font-weight:normal;">${escapeHtml(discount)}</span>
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${row("Name", escapeHtml(order.fullName))}
        ${row("Phone", `<a href="tel:${escapeHtml(order.phone)}" style="color:${NAVY};">${escapeHtml(order.phone)}</a>`)}
        ${order.email ? row("Email", `<a href="mailto:${escapeHtml(order.email)}" style="color:${NAVY};">${escapeHtml(order.email)}</a>`) : ""}
        ${row("Address", escapeHtml(order.address).replace(/\n/g, "<br />"))}
        ${row("Payment", escapeHtml(order.payment))}
        ${order.notes ? row("Notes", escapeHtml(order.notes).replace(/\n/g, "<br />")) : ""}
      </table>
      <p style="margin:24px 0 0;">
        <a href="${escapeHtml(order.adminUrl)}" style="display:inline-block;background:${ACCENT};color:${NAVY};font-weight:bold;text-decoration:none;padding:12px 22px;border-radius:999px;">Open in admin</a>
      </p>
    `),
  };
}

function button(href: string, label: string): string {
  return `<p style="margin:24px 0 0;"><a href="${escapeHtml(href)}" style="display:inline-block;background:${ACCENT};color:${NAVY};font-weight:bold;text-decoration:none;padding:12px 22px;border-radius:999px;">${escapeHtml(label)}</a></p>`;
}

export type OrderConfirmationDetails = {
  fullName: string;
  reference: string;
  finishName: string;
  quantity: number;
  total: string;
  payment: string;
  trackUrl: string;
};

export function orderConfirmationEmail(o: OrderConfirmationDetails): Omit<EmailMessage, "to"> {
  const summary = `${o.quantity} × ${o.finishName} · ${o.total} · ${o.payment}`;
  return {
    subject: `We got your Konek+ order ${o.reference}`,
    text: [
      `Hi ${o.fullName},`,
      "",
      `Thanks for ordering! Your reference is ${o.reference}.`,
      summary,
      "",
      "We'll message you to confirm your order and payment. Nothing is charged until then.",
      `Track your order anytime: ${o.trackUrl}`,
      "(You'll need your reference and the mobile number you ordered with.)",
    ].join("\n"),
    html: layout(`
      <p style="margin:0 0 8px;font-size:18px;font-weight:bold;">Thanks, ${escapeHtml(o.fullName)}!</p>
      <p style="margin:0 0 16px;color:${MUTED};">We received your order.</p>
      <p style="margin:0 0 4px;font-size:13px;color:${MUTED};">Reference</p>
      <p style="margin:0 0 16px;font-size:22px;font-weight:bold;font-family:'Courier New',monospace;">${escapeHtml(o.reference)}</p>
      <p style="margin:0 0 16px;">${escapeHtml(summary)}</p>
      <p style="margin:0;color:${MUTED};font-size:13px;">We'll message you to confirm your order and payment. Nothing is charged until then.</p>
      ${button(o.trackUrl, "Track my order")}
      <p style="margin:12px 0 0;color:${MUTED};font-size:12px;">You'll need your reference and the mobile number you ordered with.</p>
    `),
  };
}

export type ShippedDetails = {
  fullName: string;
  reference: string;
  quantity: number;
  courier: string;
  trackingNumber: string;
  courierUrl: string | null;
  trackUrl: string;
};

export function shippedEmail(o: ShippedDetails): Omit<EmailMessage, "to"> {
  const yourCards = o.quantity === 1 ? "Your card is" : `Your ${o.quantity} cards are`;
  return {
    subject: `Your Konek+ order ${o.reference} is on its way`,
    text: [
      `Hi ${o.fullName},`,
      "",
      `Good news: ${yourCards.toLowerCase()} on its way via ${o.courier}.`,
      `Tracking number: ${o.trackingNumber}`,
      o.courierUrl ? `Track the parcel: ${o.courierUrl}` : null,
      `Order status: ${o.trackUrl}`,
      "",
      "When it arrives:",
      "1. Find the 6-digit PIN on the sleeve your card came in.",
      "2. Tap the back of your phone on the card (or scan its QR code).",
      "3. Enter the PIN and set up your profile. It takes about a minute.",
    ]
      .filter((line) => line !== null)
      .join("\n"),
    html: layout(`
      <p style="margin:0 0 8px;font-size:18px;font-weight:bold;">It's on its way, ${escapeHtml(o.fullName)}!</p>
      <p style="margin:0 0 16px;color:${MUTED};">${escapeHtml(yourCards)} shipping with ${escapeHtml(o.courier)}.</p>
      <p style="margin:0 0 4px;font-size:13px;color:${MUTED};">Tracking number</p>
      <p style="margin:0 0 16px;font-size:20px;font-weight:bold;font-family:'Courier New',monospace;">${escapeHtml(o.trackingNumber)}</p>
      ${o.courierUrl ? button(o.courierUrl, "Track the parcel") : ""}
      <p style="margin:24px 0 8px;font-weight:bold;">When it arrives</p>
      <ol style="margin:0;padding-left:20px;color:${NAVY};">
        <li>Find the <b>6-digit PIN</b> on the sleeve your card came in.</li>
        <li>Tap the back of your phone on the card (or scan its QR code).</li>
        <li>Enter the PIN and set up your profile. It takes about a minute.</li>
      </ol>
      <p style="margin:20px 0 0;color:${MUTED};font-size:13px;">Order ${escapeHtml(o.reference)} · <a href="${escapeHtml(o.trackUrl)}" style="color:${NAVY};">see status</a></p>
    `),
  };
}
