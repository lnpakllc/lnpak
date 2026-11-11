import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import morgan from 'morgan';
import compression from 'compression';
import path from 'path';
import fs from 'fs';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import routes from './routes/index.js';
import { sitemap } from './controllers/seoController.js';
import { apiLimiter, csrfGuard, notFound, errorHandler } from './middleware/common.js';
import { PUBLIC_UPLOAD_DIR } from './services/storage.js';
import { ensureRoles } from './scripts/roles.js';
import { runMigrations } from './scripts/migrations.js';

// Make sure MongoDB is connected (and built-in roles exist) before a request is handled.
// Locally this resolves instantly after start-up; on Vercel it connects on the first request
// of a new function instance and is then reused.
let rolesReady = null;
async function ready(_req, _res, next) {
  try {
    await connectDB();
    rolesReady ||= ensureRoles().then(runMigrations).catch((e) => { rolesReady = null; throw e; });
    await rolesReady;
    next();
  } catch (err) {
    // Full reason goes to the server logs (Vercel → Logs); visitors get a short, safe message.
    console.error('DATABASE NOT REACHABLE:', err.name, err.message);
    const hint = /auth|bad auth|authentication/i.test(err.message) ? ' (database login failed)'
      : /whitelist|ip|timed out|ENOTFOUND|querySrv|Server selection/i.test(err.message) ? ' (database not reachable)' : '';
    next(Object.assign(new Error(`Service temporarily unavailable${hint}. Please try again in a moment.`), { status: 503 }));
  }
}

export function createApp() {
  const app = express();
  app.set('trust proxy', env.trustProxy); // correct visitor IP behind Vercel / Render / Nginx
  app.disable('x-powered-by');

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({
    origin: (origin, cb) => cb(null, !origin || env.clientUrls.includes(origin)),
    credentials: true,
  }));
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false, limit: '1mb' }));
  app.use(cookieParser());
  app.use(mongoSanitize());
  app.use(hpp());
  if (env.nodeEnv !== 'test') app.use(morgan(env.isProd ? 'combined' : 'dev'));

  // Locally stored website images (when Vercel Blob is not used).
  if (!env.cloudinaryUrl && !env.blobToken && !env.isVercel) {
    app.use('/uploads/public', express.static(PUBLIC_UPLOAD_DIR, { maxAge: '30d', index: false, dotfiles: 'deny', fallthrough: false }));
  }

  app.get('/', (_req, res) => res.json({ success: true, data: { service: 'LN PAK LLC API', health: '/api/health' } }));
  app.get('/sitemap.xml', ready, sitemap);
  app.get('/api/health', (_req, res) => res.json({ success: true, data: { status: 'ok', time: new Date().toISOString() } }));
  app.use('/api', ready, apiLimiter, csrfGuard, (_req, res, next) => { res.set('X-Robots-Tag', 'noindex'); next(); }, routes);

  // Optional: serve the built React app from the same server (single-server hosting such as Render / VPS).
  const clientDist = path.resolve('..', 'client', 'dist');
  if (env.isProd && !env.isVercel && fs.existsSync(clientDist)) {
    app.use(express.static(clientDist, { index: false, maxAge: '7d' }));
    app.get(/^\/(?!api|uploads).*/, (req, res) => {
      if (req.path.startsWith('/admin') || req.path.startsWith('/client')) res.set('X-Robots-Tag', 'noindex, nofollow');
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

// Vercel detects src/app.js and runs this default export as one Vercel Function.
const app = createApp();
export default app;
