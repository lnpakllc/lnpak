// Staff, roles, notifications, settings, newsletter, uploads, audit logs.
import mongoose from 'mongoose';
import { z } from 'zod';
import { User } from '../models/User.js';
import { Role } from '../models/Role.js';
import { Notification, Setting, NewsletterSubscriber, AuditLog } from '../models/system.js';
import { PERMISSIONS } from '../config/permissions.js';
import { invalidateRoleCache } from '../middleware/auth.js';
import { audit } from '../middleware/common.js';
import { savePublicImage, storageStatus } from '../services/storage.js';
import { ApiError, asyncHandler, ok, created, getPaging, pageMeta, escapeRegex } from '../utils/http.js';

const pw = z.string().min(8, 'Password must be at least 8 characters').max(100).regex(/[A-Za-z]/, 'Password needs a letter').regex(/[0-9]/, 'Password needs a number');

export const schemas = {
  staffCreate: z.object({
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().toLowerCase().email(),
    phone: z.string().trim().max(30).optional(),
    role: z.string().trim().min(2).max(40),
    password: pw,
  }),
  staffUpdate: z.object({
    name: z.string().trim().min(2).max(120).optional(),
    phone: z.string().trim().max(30).optional(),
    role: z.string().trim().min(2).max(40).optional(),
    isActive: z.boolean().optional(),
    password: pw.optional(),
  }),
  role: z.object({
    key: z.string().trim().toLowerCase().regex(/^[a-z_]{3,40}$/, 'Use lowercase letters and underscores').optional(),
    name: z.string().trim().min(2).max(60),
    permissions: z.array(z.string()).refine((arr) => arr.every((p) => p === '*' || p in PERMISSIONS), 'Unknown permission'),
  }),
  newsletter: z.object({ email: z.string().trim().toLowerCase().email('Please enter a valid email'), sourcePage: z.string().max(300).optional() }),
};

// ---------- staff ----------
async function assertRoleAllowed(req, roleKey) {
  if (roleKey === 'client') throw ApiError.badRequest('Use the clients section for client accounts');
  const role = await Role.findOne({ key: roleKey });
  if (!role) throw ApiError.badRequest('Role not found');
  // Only someone with full access may create / promote a super admin.
  if (role.permissions.includes('*') && !req.user.permissions.includes('*')) throw ApiError.forbidden('Only a Super Admin can grant full access');
}

export const listStaff = asyncHandler(async (req, res) => {
  const paging = getPaging(req.query);
  const f = { role: { $ne: 'client' } };
  if (req.query.q) { const r = new RegExp(escapeRegex(req.query.q), 'i'); f.$or = [{ name: r }, { email: r }]; }
  if (req.query.role) f.role = String(req.query.role);
  const [items, total] = await Promise.all([User.find(f).sort({ createdAt: -1 }).skip(paging.skip).limit(paging.limit), User.countDocuments(f)]);
  ok(res, items, pageMeta(total, paging));
});

// Lightweight list for "assign to" dropdowns.
export const assignableStaff = asyncHandler(async (_req, res) => {
  ok(res, await User.find({ role: { $ne: 'client' }, isActive: true }).select('name role').sort({ name: 1 }).lean());
});

export const createStaff = asyncHandler(async (req, res) => {
  await assertRoleAllowed(req, req.body.role);
  if (await User.exists({ email: req.body.email })) throw ApiError.conflict('A user with this email already exists');
  const user = await User.create(req.body);
  await audit(req, 'staff.create', 'User', user._id, { role: user.role });
  created(res, user);
});

export const updateStaff = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw ApiError.notFound();
  const user = await User.findOne({ _id: req.params.id, role: { $ne: 'client' } });
  if (!user) throw ApiError.notFound('Staff member not found');
  const targetIsSuper = (await Role.findOne({ key: user.role }))?.permissions.includes('*');
  if (targetIsSuper && !req.user.permissions.includes('*')) throw ApiError.forbidden('Only a Super Admin can edit a Super Admin');
  if (user._id.equals(req.user._id) && (req.body.isActive === false || (req.body.role && req.body.role !== user.role))) {
    throw ApiError.badRequest('You cannot disable yourself or change your own role');
  }
  if (req.body.role) await assertRoleAllowed(req, req.body.role);
  user.set(req.body);
  await user.save();
  await audit(req, 'staff.update', 'User', user._id, { ...req.body, password: req.body.password ? '(changed)' : undefined });
  ok(res, user);
});

// ---------- roles ----------
export const listRoles = asyncHandler(async (_req, res) => {
  const roles = await Role.find().sort({ isSystem: -1, name: 1 }).lean();
  const counts = await User.aggregate([{ $group: { _id: '$role', n: { $sum: 1 } } }]);
  ok(res, { roles: roles.map((r) => ({ ...r, users: counts.find((c) => c._id === r.key)?.n || 0 })), catalogue: PERMISSIONS });
});

export const createRole = asyncHandler(async (req, res) => {
  if (!req.body.key) throw ApiError.badRequest('Role key is required');
  if (req.body.permissions.includes('*')) throw ApiError.badRequest('Full access is reserved for the Super Admin role');
  const role = await Role.create({ ...req.body, isSystem: false });
  invalidateRoleCache();
  await audit(req, 'role.create', 'Role', role._id);
  created(res, role);
});

export const updateRole = asyncHandler(async (req, res) => {
  const role = await Role.findById(req.params.id);
  if (!role) throw ApiError.notFound('Role not found');
  if (role.key === 'super_admin') throw ApiError.badRequest('The Super Admin role always has full access');
  if (req.body.permissions.includes('*')) throw ApiError.badRequest('Full access is reserved for the Super Admin role');
  role.name = req.body.name;
  role.permissions = req.body.permissions;
  await role.save();
  invalidateRoleCache();
  await audit(req, 'role.update', 'Role', role._id, { permissions: role.permissions });
  ok(res, role);
});

export const deleteRole = asyncHandler(async (req, res) => {
  const role = await Role.findById(req.params.id);
  if (!role) throw ApiError.notFound('Role not found');
  if (role.isSystem) throw ApiError.badRequest('Built-in roles cannot be deleted');
  if (await User.exists({ role: role.key })) throw ApiError.badRequest('Move staff to another role before deleting this one');
  await role.deleteOne();
  invalidateRoleCache();
  await audit(req, 'role.delete', 'Role', role._id);
  ok(res, { deleted: true });
});

// ---------- notifications ----------
function notificationFilter(user) {
  const audiences = user.permissions.includes('*') ? { audience: { $exists: true, $ne: null } } : { audience: { $in: user.permissions } };
  return { $or: [{ user: user._id }, ...(user.role === 'client' ? [] : [audiences])] };
}

export const listNotifications = asyncHandler(async (req, res) => {
  const paging = getPaging(req.query, 15);
  const f = notificationFilter(req.user);
  if (req.query.unread === 'true') f.readBy = { $ne: req.user._id };
  const since = { createdAt: { $gte: req.user.createdAt } }; // new staff don't inherit old broadcast items
  const [items, total, unread] = await Promise.all([
    Notification.find({ ...f, ...since }).sort({ createdAt: -1 }).skip(paging.skip).limit(paging.limit).lean(),
    Notification.countDocuments({ ...f, ...since }),
    Notification.countDocuments({ ...notificationFilter(req.user), ...since, readBy: { $ne: req.user._id } }),
  ]);
  ok(res, items.map(({ readBy, ...n }) => ({ ...n, read: (readBy || []).some((r) => r.equals(req.user._id)) })), { ...pageMeta(total, paging), unread });
});

export const markRead = asyncHandler(async (req, res) => {
  const f = notificationFilter(req.user);
  if (req.params.id !== 'all') {
    if (!mongoose.isValidObjectId(req.params.id)) throw ApiError.notFound();
    f._id = req.params.id;
  }
  await Notification.updateMany(f, { $addToSet: { readBy: req.user._id } });
  ok(res, { read: true });
});

// ---------- settings ----------
export async function getSettingsDoc() {
  return (await Setting.findOne({ key: 'site' })) || Setting.create({ key: 'site' });
}

export const publicSettings = asyncHandler(async (_req, res) => {
  res.set('Cache-Control', 'public, max-age=60');
  ok(res, await getSettingsDoc());
});

export const updateSettings = asyncHandler(async (req, res) => {
  const doc = await getSettingsDoc();
  const allowed = ['contact', 'social', 'hero', 'about', 'footerAbout', 'pages', 'seo'];
  for (const k of allowed) if (k in req.body) doc.set(k, req.body[k]);
  await doc.save();
  await audit(req, 'settings.update', 'Setting', doc._id, { sections: Object.keys(req.body).filter((k) => allowed.includes(k)) });
  ok(res, doc);
});

// ---------- newsletter ----------
export const subscribe = asyncHandler(async (req, res) => {
  await NewsletterSubscriber.updateOne(
    { email: req.body.email },
    { $set: { isActive: true }, $setOnInsert: { sourcePage: req.body.sourcePage } },
    { upsert: true },
  );
  created(res, { subscribed: true });
});

export const listSubscribers = asyncHandler(async (req, res) => {
  const paging = getPaging(req.query);
  const f = {};
  if (req.query.q) f.email = new RegExp(escapeRegex(req.query.q), 'i');
  if (req.query.format === 'csv') {
    const all = await NewsletterSubscriber.find({ ...f, isActive: true }).sort({ createdAt: -1 }).lean();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="lnpak-subscribers.csv"');
    return res.send(['email,subscribed_at', ...all.map((s) => `"${s.email}",${s.createdAt.toISOString()}`)].join('\r\n'));
  }
  const [items, total] = await Promise.all([NewsletterSubscriber.find(f).sort({ createdAt: -1 }).skip(paging.skip).limit(paging.limit), NewsletterSubscriber.countDocuments(f)]);
  ok(res, items, pageMeta(total, paging));
});

export const deleteSubscriber = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw ApiError.notFound();
  await NewsletterSubscriber.findByIdAndDelete(req.params.id);
  await audit(req, 'newsletter.delete', 'NewsletterSubscriber', req.params.id);
  ok(res, { deleted: true });
});

// ---------- uploads ----------
export const uploadImages = asyncHandler(async (req, res) => {
  const files = req.files || (req.file ? [req.file] : []);
  if (!files.length) throw ApiError.badRequest('No image received');
  const saved = [];
  for (const f of files) saved.push(await savePublicImage(f));
  await audit(req, 'upload.image', 'Upload', null, { files: saved.map((x) => x.url) });
  created(res, saved);
});

export const uploadStatus = asyncHandler(async (_req, res) => ok(res, await storageStatus()));

// ---------- audit ----------
export const listAudit = asyncHandler(async (req, res) => {
  const paging = getPaging(req.query, 30);
  const f = {};
  if (req.query.action) f.action = new RegExp(`^${escapeRegex(req.query.action)}`);
  const [items, total] = await Promise.all([
    AuditLog.find(f).sort({ createdAt: -1 }).skip(paging.skip).limit(paging.limit).populate('user', 'name email').lean(),
    AuditLog.countDocuments(f),
  ]);
  ok(res, items, pageMeta(total, paging));
});

