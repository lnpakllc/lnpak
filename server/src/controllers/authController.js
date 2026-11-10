import crypto from 'crypto';
import { z } from 'zod';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { Client } from '../models/Client.js';
import { nextCode } from '../models/Counter.js';
import { signToken, setAuthCookie, clearAuthCookie, permissionsFor } from '../middleware/auth.js';
import { audit } from '../middleware/common.js';
import { ApiError, asyncHandler, ok, created } from '../utils/http.js';
import { notifyAudience, sendEmail } from '../services/notify.js';

const password = z.string().min(8, 'Password must be at least 8 characters').max(100)
  .regex(/[A-Za-z]/, 'Password must contain a letter').regex(/[0-9]/, 'Password must contain a number');

export const schemas = {
  login: z.object({
    email: z.string().trim().toLowerCase().email('Enter a valid email'),
    password: z.string().min(1, 'Password is required').max(100),
    portal: z.enum(['admin', 'client']),
  }),
  register: z.object({
    name: z.string().trim().min(2, 'Enter your full name').max(120),
    email: z.string().trim().toLowerCase().email('Enter a valid email'),
    phone: z.string().trim().min(7, 'Enter a valid phone number').max(30),
    password,
  }),
  updateMe: z.object({ name: z.string().trim().min(2).max(120).optional(), phone: z.string().trim().max(30).optional() }),
  changePassword: z.object({ currentPassword: z.string().min(1).max(100), newPassword: password }),
  forgot: z.object({ email: z.string().trim().toLowerCase().email('Enter a valid email') }),
  reset: z.object({ token: z.string().length(64), password }),
};

async function sessionPayload(user) {
  return { user: user.toJSON(), permissions: await permissionsFor(user.role) };
}

export const login = asyncHandler(async (req, res) => {
  const { email, password: pw, portal } = req.body;
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(pw))) throw ApiError.unauthorized('Email or password is incorrect');
  if (!user.isActive) throw ApiError.forbidden('This account is disabled. Please contact LN PAK LLC.');
  if (portal === 'admin' && user.role === 'client') throw ApiError.forbidden('Please use the client login page.');
  if (portal === 'client' && user.role !== 'client') throw ApiError.forbidden('Staff accounts sign in at the admin panel.');

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });
  setAuthCookie(res, signToken(user));
  req.user = user;
  if (user.role !== 'client') await audit(req, 'login', 'User', user._id);
  ok(res, await sessionPayload(user));
});

export const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password: pw } = req.body;
  if (await User.exists({ email })) throw ApiError.conflict('An account with this email already exists. Try logging in or reset your password.');

  const user = await User.create({ name, email, phone, password: pw, role: 'client' });
  // Only create a fresh client profile. An existing staff-created profile with the same email is NOT
  // linked automatically (email is not verified yet) — staff link it after checking.
  const existing = await Client.findOne({ email });
  if (!existing) {
    await Client.create({ code: await nextCode('CL'), user: user._id, fullName: name, email, phone });
  }
  await notifyAudience('clients:read_all', {
    type: 'client_registered',
    title: `New client registration: ${name}`,
    body: existing ? `Email matches existing client ${existing.code}. Please verify and link the account.` : email,
    link: existing ? `/admin/clients/${existing._id}` : '/admin/clients',
  });
  setAuthCookie(res, signToken(user));
  created(res, await sessionPayload(user));
});

export const logout = (_req, res) => {
  clearAuthCookie(res);
  ok(res, { loggedOut: true });
};

export const me = asyncHandler(async (req, res) => ok(res, req.user ? await sessionPayload(req.user) : null));

export const updateMe = asyncHandler(async (req, res) => {
  Object.assign(req.user, req.body);
  await req.user.save();
  ok(res, await sessionPayload(req.user));
});

export const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(req.body.currentPassword))) throw ApiError.badRequest('Current password is incorrect');
  user.password = req.body.newPassword;
  await user.save();
  setAuthCookie(res, signToken(user)); // old tokens are now invalid; issue a fresh one
  ok(res, { changed: true });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email, isActive: true });
  if (user) {
    const token = user.createResetToken();
    await user.save({ validateBeforeSave: false });
    const base = env.clientUrls[0];
    const path = user.role === 'client' ? '/client/reset-password' : '/admin/reset-password';
    const link = `${base}${path}?token=${token}`;
    await sendEmail({
      to: user.email,
      subject: 'Reset your LN PAK LLC password',
      text: `Hello ${user.name},\n\nUse this link to set a new password (valid for 30 minutes):\n${link}\n\nIf you did not ask for this, ignore this email.`,
    });
  }
  // Same answer either way, so emails cannot be enumerated.
  ok(res, { message: 'If an account exists for this email, a reset link has been sent.' });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const hash = crypto.createHash('sha256').update(req.body.token).digest('hex');
  const user = await User.findOne({ resetTokenHash: hash, resetTokenExpires: { $gt: new Date() } }).select('+resetTokenHash +resetTokenExpires');
  if (!user) throw ApiError.badRequest('This reset link is invalid or has expired. Please request a new one.');
  user.password = req.body.password;
  user.resetTokenHash = undefined;
  user.resetTokenExpires = undefined;
  await user.save();
  ok(res, { reset: true, portal: user.role === 'client' ? 'client' : 'admin' });
});
