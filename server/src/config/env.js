import dotenv from 'dotenv';

dotenv.config();

const required = ['MONGODB_URI', 'JWT_SECRET'];
for (const key of required) {
  if (!process.env[key]) {
    // Throw (not process.exit) so the error shows up in Vercel's function logs as well.
    throw new Error(`Missing required environment variable: ${key}. Copy .env.example to .env (or add it in Vercel → Settings → Environment Variables).`);
  }
}

if (process.env.NODE_ENV === 'production' && process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters in production.');
}

const list = (v, fallback = '') => (v || fallback).split(',').map((s) => s.trim()).filter(Boolean);

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrls: list(process.env.CLIENT_URL, 'http://localhost:5173'),
  cookieSameSite: process.env.COOKIE_SAMESITE || 'lax',
  cookieSecure: process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === 'true' : process.env.NODE_ENV === 'production',
  isVercel: !!process.env.VERCEL,
  // Number of proxies in front of the API (Vercel edge = 1). Used for correct visitor IPs in rate limits.
  trustProxy: Number(process.env.TRUST_PROXY || 1),
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  // Vercel functions accept request bodies up to 4.5 MB, so keep single uploads under that.
  maxUploadMb: Math.min(Number(process.env.MAX_UPLOAD_MB || 4), process.env.VERCEL ? 4 : 50),
  // When set, website images go to Vercel Blob instead of the local disk (required on Vercel).
  blobToken: process.env.BLOB_READ_WRITE_TOKEN,
  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.MAIL_FROM || 'LN PAK LLC <no-reply@lnpak.com>',
  },
  adminNotifyEmail: process.env.ADMIN_NOTIFY_EMAIL,
};
