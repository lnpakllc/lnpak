// In-app notifications now; email is sent too when SMTP is configured.
// WhatsApp / SMS can be added here later behind their own env variables.
import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { Notification } from '../models/system.js';

let transporter;
function mailer() {
  if (!env.smtp.host) return null;
  transporter ||= nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.port === 465,
    auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
  });
  return transporter;
}

export async function sendEmail({ to, subject, text, html }) {
  const t = mailer();
  if (!t) {
    if (!env.isProd) console.log(`[email not configured] to=${to} subject="${subject}"\n${text}`);
    return false;
  }
  try {
    await t.sendMail({ from: env.smtp.from, to, subject, text, html });
    return true;
  } catch (e) {
    console.error('Email failed:', e.message);
    return false;
  }
}

export async function notifyUser(userId, { type, title, body, link }) {
  if (!userId) return;
  await Notification.create({ user: userId, type, title, body, link });
}

// Notify every staff member who holds the given permission (resolved at read time).
export async function notifyAudience(audience, { type, title, body, link }) {
  await Notification.create({ audience, type, title, body, link });
}
