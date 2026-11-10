import crypto from 'crypto';
import mongoose from 'mongoose';
import { z } from 'zod';
import { Client } from '../models/Client.js';
import { Lead } from '../models/Lead.js';
import { User } from '../models/User.js';
import { nextCode } from '../models/Counter.js';
import { hasPermission } from '../middleware/auth.js';
import { SERVICE_TYPES } from '../config/permissions.js';
import { audit } from '../middleware/common.js';
import { sendEmail, notifyUser } from '../services/notify.js';
import { env } from '../config/env.js';
import { ApiError, asyncHandler, ok, created, getPaging, pageMeta, escapeRegex } from '../utils/http.js';

const oid = z.string().regex(/^[a-f0-9]{24}$/);
const blank = z.literal('').transform(() => undefined);
const base = {
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(160).optional().or(blank),
  phone: z.string().trim().max(30).optional(),
  whatsapp: z.string().trim().max(30).optional(),
  address: z.string().trim().max(300).optional(),
  nationality: z.string().trim().max(80).optional(),
  dateOfBirth: z.coerce.date().optional().or(blank),
  passport: z.object({ number: z.string().trim().max(30).optional(), expiry: z.coerce.date().optional().or(blank) }).optional(),
  interestedService: z.string().max(60).optional(),
  assignedConsultant: oid.optional().or(blank),
  status: z.enum(['active', 'inactive', 'completed']).optional(),
};

export const schemas = {
  create: z.object(base),
  update: z.object(base).partial(),
  note: z.object({ text: z.string().trim().min(1).max(4000) }),
  portalProfile: z.object({
    fullName: z.string().trim().min(2).max(120).optional(),
    phone: z.string().trim().max(30).optional(),
    whatsapp: z.string().trim().max(30).optional(),
    address: z.string().trim().max(300).optional(),
  }),
  portalInquiry: z.object({
    service: z.enum(SERVICE_TYPES),
    destination: z.string().trim().max(80).optional(),
    message: z.string().trim().min(5, 'Please describe what you need').max(4000),
  }),
};

const scope = (req) => (hasPermission(req.user.permissions, 'clients:read_all') ? {} : { assignedConsultant: req.user._id });

async function findScoped(req) {
  if (!mongoose.isValidObjectId(req.params.id)) throw ApiError.notFound('Client not found');
  const c = await Client.findOne({ _id: req.params.id, ...scope(req) });
  if (!c) throw ApiError.notFound('Client not found');
  return c;
}

export const list = asyncHandler(async (req, res) => {
  const paging = getPaging(req.query);
  const f = { ...scope(req) };
  if (req.query.status) f.status = String(req.query.status);
  if (req.query.consultant && mongoose.isValidObjectId(req.query.consultant)) f.assignedConsultant = req.query.consultant;
  if (req.query.q) {
    const r = new RegExp(escapeRegex(req.query.q), 'i');
    f.$or = [{ fullName: r }, { email: r }, { phone: r }, { code: r }];
  }
  const [items, total] = await Promise.all([
    Client.find(f).sort({ createdAt: -1 }).skip(paging.skip).limit(paging.limit).select('-passport -staffNotes')
      .populate('assignedConsultant', 'name').populate('user', 'isActive lastLoginAt').lean(),
    Client.countDocuments(f),
  ]);
  ok(res, items, pageMeta(total, paging));
});

export const getOne = asyncHandler(async (req, res) => {
  const c = await findScoped(req);
  await c.populate([{ path: 'assignedConsultant', select: 'name email' }, { path: 'user', select: 'email isActive lastLoginAt' }, { path: 'staffNotes.author', select: 'name' }]);
  const leads = await Lead.find({ client: c._id }).select('code service destination status createdAt').sort({ createdAt: -1 }).lean();
  const data = c.toObject();
  // Passport details only for staff who can edit clients.
  if (!hasPermission(req.user.permissions, 'clients:write')) delete data.passport;
  ok(res, { ...data, leads });
});

export const create = asyncHandler(async (req, res) => {
  const client = await Client.create({ ...req.body, code: await nextCode('CL'), assignedConsultant: req.body.assignedConsultant || req.user._id });
  await audit(req, 'client.create', 'Client', client._id);
  created(res, client);
});

export const update = asyncHandler(async (req, res) => {
  const client = await findScoped(req);
  if (req.body.assignedConsultant && !client.assignedConsultant?.equals(req.body.assignedConsultant)) {
    await notifyUser(req.body.assignedConsultant, { type: 'client_assigned', title: `Client assigned to you: ${client.fullName}`, link: `/admin/clients/${client._id}` });
  }
  client.set(req.body);
  await client.save();
  // Keep portal access in line with the client status.
  if (client.user && 'status' in req.body) await User.updateOne({ _id: client.user }, { isActive: client.status !== 'inactive' });
  await audit(req, 'client.update', 'Client', client._id, { fields: Object.keys(req.body) });
  ok(res, client);
});

export const addNote = asyncHandler(async (req, res) => {
  const client = await findScoped(req);
  client.staffNotes.push({ text: req.body.text, author: req.user._id });
  await client.save();
  created(res, client.staffNotes[client.staffNotes.length - 1]);
});

// Creates (or re-sends) the client's portal invitation link.
export const portalAccess = asyncHandler(async (req, res) => {
  const client = await findScoped(req);
  if (!client.email) throw ApiError.badRequest('Add an email address to this client first');
  let user = client.user ? await User.findById(client.user) : await User.findOne({ email: client.email });
  if (user && user.role !== 'client') throw ApiError.conflict('This email belongs to a staff account');
  if (!user) user = new User({ name: client.fullName, email: client.email, phone: client.phone, role: 'client', password: crypto.randomBytes(24).toString('hex') });
  const token = user.createResetToken();
  user.resetTokenExpires = new Date(Date.now() + 7 * 864e5);
  user.isActive = true;
  await user.save();
  if (!client.user) { client.user = user._id; await client.save(); }
  const link = `${env.clientUrls[0]}/client/reset-password?token=${token}`;
  await sendEmail({ to: client.email, subject: 'Your LN PAK LLC client portal access', text: `Dear ${client.fullName},\n\nSet your portal password here (valid 7 days):\n${link}\n\nLN PAK LLC` });
  await audit(req, 'client.portal_invite', 'Client', client._id);
  ok(res, { inviteLink: link });
});

// ---------------- client portal (logged-in client only, always scoped to req.user) ----------------
async function myClient(req) {
  return Client.findOne({ user: req.user._id }).populate('assignedConsultant', 'name email phone');
}

export const portalOverview = asyncHandler(async (req, res) => {
  const client = await myClient(req);
  const leadFilter = { $or: [{ user: req.user._id }, ...(client ? [{ client: client._id }] : [])] };
  const inquiries = await Lead.find(leadFilter).sort({ createdAt: -1 }).limit(50)
    .select('code service destination message status createdAt updatedAt reference').lean();
  const safeClient = client ? { ...client.toObject(), staffNotes: undefined, sourceLead: undefined } : null;
  ok(res, { client: safeClient, inquiries, user: req.user });
});

export const portalUpdateProfile = asyncHandler(async (req, res) => {
  const client = await myClient(req);
  if (!client) throw ApiError.badRequest('Your client profile is being set up by our team');
  client.set(req.body);
  await client.save();
  if (req.body.fullName || req.body.phone) {
    req.user.set({ ...(req.body.fullName && { name: req.body.fullName }), ...(req.body.phone && { phone: req.body.phone }) });
    await req.user.save();
  }
  ok(res, client);
});

export const portalInquiry = asyncHandler(async (req, res) => {
  const client = await myClient(req);
  const lead = await Lead.create({
    code: await nextCode('LD'),
    fullName: client?.fullName || req.user.name,
    email: req.user.email,
    phone: client?.phone || req.user.phone || 'not provided',
    service: req.body.service,
    destination: req.body.destination,
    message: req.body.message,
    formType: 'client_portal',
    source: 'client_portal',
    user: req.user._id,
    client: client?._id,
    assignedTo: client?.assignedConsultant?._id,
    activity: [{ action: 'created', message: 'Submitted from the client portal' }],
  });
  if (client?.assignedConsultant) {
    await notifyUser(client.assignedConsultant._id, { type: 'client_inquiry', title: `New inquiry from client ${client.fullName}`, link: `/admin/leads/${lead._id}` });
  }
  created(res, { code: lead.code });
});
