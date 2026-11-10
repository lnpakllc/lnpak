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
import routes from './routes/index.js';
import { sitemap } from './controllers/seoController.js';
import { apiLimiter, csrfGuard, notFound, errorHandler, PUBLIC_UPLOAD_DIR } from './middleware/common.js';

export function createApp() {
  const app = express();
  app.set('trust proxy', 1); // correct client IP behind Vercel / Render / Nginx
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

  // Public website images only. Private client documents will use signed URLs from private storage.
  app.use('/uploads/public', express.static(PUBLIC_UPLOAD_DIR, { maxAge: '30d', index: false, dotfiles: 'deny' }));

  app.get('/sitemap.xml', sitemap);
  app.use('/api', apiLimiter, csrfGuard, (_req, res, next) => { res.set('X-Robots-Tag', 'noindex'); next(); }, routes);

  // Optional: serve the built React app from the same server (single deployment).
  const clientDist = path.resolve('..', 'client', 'dist');
  if (env.isProd && fs.existsSync(clientDist)) {
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
