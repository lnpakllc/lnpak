import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { Role } from '../models/Role.js';
import { ApiError, asyncHandler } from '../utils/http.js';

export const AUTH_COOKIE = 'lnpak_token';

export function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

export function setAuthCookie(res, token) {
  res.cookie(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.cookieSameSite,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

export function clearAuthCookie(res) {
  res.clearCookie(AUTH_COOKIE, { httpOnly: true, secure: env.cookieSecure, sameSite: env.cookieSameSite, path: '/' });
}

// --- role permission cache (roles are edited rarely) ---
const roleCache = new Map();
const ROLE_TTL = 60_000;
export function invalidateRoleCache() { roleCache.clear(); }

export async function permissionsFor(roleKey) {
  if (roleKey === 'client') return [];
  const hit = roleCache.get(roleKey);
  if (hit && hit.expires > Date.now()) return hit.permissions;
  const role = await Role.findOne({ key: roleKey }).lean();
  const permissions = role?.permissions || [];
  roleCache.set(roleKey, { permissions, expires: Date.now() + ROLE_TTL });
  return permissions;
}

export const hasPermission = (perms, needed) => perms.includes('*') || perms.includes(needed);

function readToken(req) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);
  return req.cookies?.[AUTH_COOKIE];
}

async function loadUser(req) {
  const token = readToken(req);
  if (!token) return null;
  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    return null;
  }
  const user = await User.findById(payload.sub);
  if (!user || !user.isActive) return null;
  // Reject tokens issued before a password change.
  if (user.passwordChangedAt && payload.iat * 1000 < user.passwordChangedAt.getTime()) return null;
  user.permissions = await permissionsFor(user.role);
  return user;
}

export const authenticate = asyncHandler(async (req, _res, next) => {
  const user = await loadUser(req);
  if (!user) throw ApiError.unauthorized();
  req.user = user;
  next();
});

export const optionalAuth = asyncHandler(async (req, _res, next) => {
  req.user = (await loadUser(req)) || undefined;
  next();
});

export const requireStaff = (req, _res, next) => {
  if (!req.user || req.user.role === 'client') return next(ApiError.forbidden('Staff access only'));
  next();
};

export const requireClient = (req, _res, next) => {
  if (!req.user || req.user.role !== 'client') return next(ApiError.forbidden('Client access only'));
  next();
};

// Passes when the user has ANY of the listed permissions.
export const requirePermission = (...needed) => (req, _res, next) => {
  if (!req.user) return next(ApiError.unauthorized());
  if (needed.some((p) => hasPermission(req.user.permissions, p))) return next();
  next(ApiError.forbidden());
};
