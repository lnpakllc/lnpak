// Development sample content. Run: npm run seed   (add -- --fresh to wipe and re-create)
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { connectDB } from '../config/db.js';
import { ensureRoles } from './roles.js';
import { seedContent, seedSettings } from './seedData.js';

if (env.isProd && !process.argv.includes('--allow-production')) {
  console.error('Refusing to seed sample data in production (add -- --allow-production to override).');
  process.exit(1);
}

async function main() {
  await connectDB();
  await ensureRoles();
  const fresh = process.argv.includes('--fresh');
  await seedContent({ fresh, log: console.log });
  if (await seedSettings({ fresh })) console.log('Settings: created');
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => mongoose.disconnect());
