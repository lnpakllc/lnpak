import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { createApp } from './app.js';
import { ensureRoles } from './scripts/roles.js';

async function start() {
  await connectDB();
  await ensureRoles();
  const app = createApp();
  const server = app.listen(env.port, () => console.log(`LN PAK API running on port ${env.port} (${env.nodeEnv})`));
  const shutdown = () => server.close(() => process.exit(0));
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
