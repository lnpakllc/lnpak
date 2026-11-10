// First-run setup: creates the first Super Admin from the browser (no terminal needed).
// Only works while NO Super Admin exists, and only with the SETUP_KEY set in the server's
// environment variables — so a stranger who finds /admin/setup cannot claim the site.
import crypto from 'crypto';
import { z } from 'zod';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { signToken, setAuthCookie, permissionsFor } from '../middleware/auth.js';
import { audit } from '../middleware/common.js';
import { ApiError, asyncHandler, ok, created } from '../utils/http.js';
import { seedContent, seedSettings } from '../scripts/seedData.js';

export const schema = z.object({
  setupKey: z.string().min(1, 'Enter the setup key').max(200),
  name: z.string().trim().min(2, 'Enter your full name').max(120),
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100)
    .regex(/[A-Za-z]/, 'Password must contain a letter').regex(/[0-9]/, 'Password must contain a number'),
  starterContent: z.boolean().default(true),
});

const sameKey = (a, b) => {
  const x = Buffer.from(String(a)); const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

export const status = asyncHandler(async (_req, res) => {
  const hasAdmin = !!(await User.exists({ role: 'super_admin' }));
  ok(res, { needsSetup: !hasAdmin, keyConfigured: !!env.setupKey });
});

export const run = asyncHandler(async (req, res) => {
  if (await User.exists({ role: 'super_admin' })) throw ApiError.forbidden('Setup is already complete. Please sign in.');
  if (!env.setupKey) throw ApiError.badRequest('SETUP_KEY is not set on the server. Add it in Vercel → Settings → Environment Variables and redeploy.');
  if (!sameKey(req.body.setupKey, env.setupKey)) throw ApiError.forbidden('Setup key is incorrect');
  if (await User.exists({ email: req.body.email })) throw ApiError.conflict('An account with this email already exists');

  const user = await User.create({ name: req.body.name, email: req.body.email, password: req.body.password, role: 'super_admin' });
  await seedSettings(); // real contact details, hero text and pages (only if not created yet)
  const added = req.body.starterContent ? await seedContent() : {};

  req.user = user;
  await audit(req, 'setup.complete', 'User', user._id, { starterContent: added });
  setAuthCookie(res, signToken(user));
  created(res, { user: user.toJSON(), permissions: await permissionsFor(user.role), starterContent: added });
});
