import rateLimit from 'express-rate-limit';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { ZodError } from 'zod';
import { env } from '../config/env.js';
import { ApiError } from '../utils/http.js';
import { AuditLog } from '../models/system.js';

// ---------- validation ----------
// validate(schema) parses req.body with zod and replaces it with the clean, typed result.
export const validate = (schema, source = 'body') => (req, _res, next) => {
  const parsed = schema.safeParse(req[source]);
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => {
      const field = i.path.join('.');
      // zod's default for a missing field is technical; say it plainly.
      const missing = i.code === 'invalid_type' && /received undefined/.test(i.message);
      return { field, message: missing ? `${field || 'Value'} is required` : i.message };
    });
    return next(ApiError.badRequest(details[0]?.message || 'Invalid input', details));
  }
  if (source === 'body') req.body = parsed.data;
  else req.validated = parsed.data;
  next();
};

// ---------- CSRF ----------
// State-changing requests must carry X-Requested-With. Browsers cannot add custom headers
// cross-origin without a CORS preflight, and CORS only allows CLIENT_URL, so forged form posts fail.
export const csrfGuard = (req, _res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  if (req.get('X-Requested-With') === 'XMLHttpRequest') return next();
  next(ApiError.forbidden('Missing request header'));
};

// ---------- rate limits ----------
const limiter = (windowMin, max, message) =>
  rateLimit({
    windowMs: windowMin * 60 * 1000,
    max,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { success: false, message },
    skip: () => env.nodeEnv === 'test',
  });

export const apiLimiter = limiter(15, 600, 'Too many requests, please try again shortly.');
export const authLimiter = limiter(15, 20, 'Too many login attempts. Please wait 15 minutes and try again.');
export const formLimiter = limiter(60, 15, 'Too many submissions from this connection. Please try again later or call us.');

// ---------- uploads (public website images only) ----------
const IMAGE_TYPES = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
const publicDir = path.resolve(env.uploadDir, 'public');
fs.mkdirSync(publicDir, { recursive: true });

export const imageUpload = multer({
  storage: multer.diskStorage({
    destination: publicDir,
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${IMAGE_TYPES[file.mimetype]}`),
  }),
  limits: { fileSize: env.maxUploadMb * 1024 * 1024, files: 10 },
  fileFilter: (_req, file, cb) => {
    if (IMAGE_TYPES[file.mimetype]) return cb(null, true);
    cb(ApiError.badRequest('Only JPG, PNG or WEBP images are allowed'));
  },
});
export const PUBLIC_UPLOAD_DIR = publicDir;

// ---------- audit ----------
export async function audit(req, action, entity, entityId, details) {
  try {
    await AuditLog.create({ user: req.user?._id, action, entity, entityId: entityId?.toString(), details, ip: req.ip });
  } catch (e) {
    console.error('Audit log failed:', e.message);
  }
}

// ---------- errors ----------
export const notFound = (req, _res, next) => next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, _next) => {
  let status = err.status || 500;
  let message = err.message || 'Something went wrong';
  let details = err.details;

  if (err instanceof ZodError) { status = 400; message = 'Invalid input'; details = err.issues; }
  if (err.name === 'ValidationError') {
    status = 400;
    details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    message = details[0]?.message || 'Invalid input';
  }
  if (err.name === 'CastError') { status = 400; message = 'Invalid ID'; }
  if (err.code === 11000) {
    status = 409;
    message = `${Object.keys(err.keyValue || {}).join(', ') || 'Value'} already exists`;
  }
  if (err.code === 'LIMIT_FILE_SIZE') { status = 400; message = `File is larger than ${env.maxUploadMb} MB`; }
  if (err.type === 'entity.too.large') { status = 413; message = 'Request is too large'; }

  if (status >= 500) {
    console.error(err);
    if (env.isProd) message = 'Something went wrong on our side. Please try again.';
  }
  res.status(status).json({ success: false, message, ...(details ? { details } : {}) });
};
