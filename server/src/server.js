// Local / single-server start (npm run dev, npm start). Vercel does not use this file —
// it runs the default export of src/app.js instead.
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { ensureRoles } from './scripts/roles.js';
import app from './app.js';

async function start() {
  await connectDB();
  await ensureRoles();
  const server = app.listen(env.port, () => console.log(`LN PAK API running on port ${env.port} (${env.nodeEnv})`));
  const shutdown = () => server.close(() => process.exit(0));
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
