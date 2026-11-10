import crypto from 'crypto';
import mongoose from 'mongoose';
import ExcelJS from 'exceljs';
import { z } from 'zod';
import { Lead } from '../models/Lead.js';
import { Client } from '../models/Client.js';
import { User } from '../models/User.js';
import { nextCode } from '../models/Counter.js';
import { LEAD_STATUSES, SERVICE_TYPES } from '../config/permissions.js';
import { hasPermission } from '../middleware/auth.js';
import { audit } from '../middleware/common.js';
import { notifyAudience, notifyUser, sendEmail } from '../services/notify.js';
import { env } from '../config/env.js';
import { ApiError, asyncHandler, ok, created, getPaging, pageMeta, escapeRegex } from '../utils/http.js';

const str = (max) => z.string().trim().max(max);
const optStr = (max) => str(max).optional().or(z.literal('').transform(() => undefined));

export const schemas = {
  publicCreate: z.object({
    fullName: str(120).min(2, 'Please enter your full name'),
    email: z.string().trim().toLowerCase().email('Please enter a valid email').max(160),
    phone: str(30).min(7, 'Please enter a valid phone / WhatsApp number').regex(/^[+0-9 ()-]+$/, 'Phone can only contain digits, spaces and + - ( )'),
    whatsapp: optStr(30),
    country: optStr(80),
    service: z.enum(SERVICE_TYPES).default('general'),
    destination: optStr(80),
    message: optStr(4000),
    formType: optStr(60),
    reference: z.object({ kind: z.enum(['tour', 'university', 'scholarship', 'service', 'country']), title: str(200), slug: str(200) }).optional(),
    sourcePage: optStr(300),
    utm: z.object({ source: optStr(100), medium: optStr(100), campaign: optStr(150), term: optStr(100), content: optStr(100) }).partial().optional(),
    // anti-spam
    website: z.string().max(200).optional(), // honeypot: must stay empty
    startedAt: z.number().optional(), // ms timestamp when the form was rendered
  }),
  staffCreate: z.object({
    fullName: str(120).min(2),
    email: z.string().trim().toLowerCase().email().max(160).optional().or(z.literal('').transform(() => undefined)),
    phone: str(30).min(7),
    whatsapp: optStr(30),
    country: optStr(80),
    service: z.enum(SERVICE_TYPES).default('general'),
    destination: optStr(80),
    message: optStr(4000),
    source: str(60).default('walk-in'),
    priority: z.enum(['low', 'medium', 'high']).default('medium'),
    assignedTo: z.string().regex(/^[a-f0-9]{24}$/).optional().or(z.literal('').transform(() => undefined)),
  }),
  update: z.object({
    fullName: str(120).min(2).optional(),
    email: z.string().trim().toLowerCase().email().max(160).optional(),
    phone: str(30).min(7).optional(),
    whatsapp: str(30).optional(),
    country: str(80).optional(),
    service: z.enum(SERVICE_TYPES).optional(),
    destination: str(80).optional(),
    status: z.enum(LEAD_STATUSES).optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
    followUpDate: z.union([z.coerce.date(), z.null()]).optional(),
    assignedTo: z.union([z.string().regex(/^[a-f0-9]{24}$/), z.null()]).optional(),
    source: str(60).optional(),
  }),
  note: z.object({ text: str(4000).min(1, 'Note cannot be empty') }),
  convert: z.object({ createPortalAccess: z.boolean().default(true), assignedConsultant: z.string().regex(/^[a-f0-9]{24}$/).optional() }),
};

const label = (s) => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

// Staff without leads:read_all only ever see leads assigned to them.
function scope(req) {
  return hasPermission(req.user.permissions, 'leads:read_all') ? {} : { assignedTo: req.user._id };
}

async function findScoped(req) {
  if (!mongoose.isValidObjectId(req.params.id)) throw ApiError.notFound('Lead not found');
  const lead = await Lead.findOne({ _id: req.params.id, ...scope(req) });
  if (!lead) throw ApiError.notFound('Lead not found');
  return lead;
}

function buildFilter(req) {
  const q = req.query;
  const f = { ...scope(req) };
  if (q.status && LEAD_STATUSES.includes(q.status)) f.status = q.status;
  if (q.service && SERVICE_TYPES.includes(q.service)) f.service = q.service;
  if (q.priority && ['low', 'medium', 'high'].includes(q.priority)) f.priority = q.priority;
  if (q.destination) f.destination = new RegExp(`^${escapeRegex(q.destination)}$`, 'i');
  if (q.source) f.source = String(q.source).slice(0, 60);
  if (q.assignedTo && hasPermission(req.user.permissions, 'leads:read_all')) {
    f.assignedTo = q.assignedTo === 'unassigned' ? null : mongoose.isValidObjectId(q.assignedTo) ? q.assignedTo : undefined;
  }
  if (q.from || q.to) {
    f.createdAt = {};
    if (q.from && !Number.isNaN(Date.parse(q.from))) f.createdAt.$gte = new Date(q.from);
    if (q.to && !Number.isNaN(Date.parse(q.to))) f.createdAt.$lte = new Date(new Date(q.to).setHours(23, 59, 59, 999));
  }
  if (q.followUp === 'today' || q.followUp === 'overdue') {
    const end = new Date(); end.setHours(23, 59, 59, 999);
    const start = new Date(); start.setHours(0, 0, 0, 0);
    f.followUpDate = q.followUp === 'today' ? { $gte: start, $lte: end } : { $lt: start };
    f.status = { $nin: ['converted', 'not_interested', 'lost'] };
  }
  if (q.q) {
    const rx = new RegExp(escapeRegex(q.q), 'i');
    f.$or = [{ fullName: rx }, { email: rx }, { phone: rx }, { code: rx }, { destination: rx }];
  }
  return f;
}

// ---------------- public ----------------
export const publicCreate = asyncHandler(async (req, res) => {
  const { website, startedAt, ...data } = req.body;
  // Bots fill the hidden field or submit instantly. Pretend success so they learn nothing.
  if (website || (startedAt && Date.now() - startedAt < 2500)) {
    return created(res, { code: 'RECEIVED', duplicate: false });
  }
  const ipHash = crypto.createHash('sha256').update(`${req.ip}|${env.jwtSecret}`).digest('hex');

  // Duplicate protection: same email or phone for the same service within 24h → update existing lead.
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const existing = await Lead.findOne({ service: data.service, createdAt: { $gte: since }, $or: [{ email: data.email }, { phone: data.phone }] });
  if (existing) {
    existing.activity.push({ action: 'resubmitted', message: `Submitted again from ${data.sourcePage || 'website'}${data.message ? `: ${data.message.slice(0, 300)}` : ''}` });
    await existing.save();
    return created(res, { code: existing.code, duplicate: true });
  }

  const lead = await Lead.create({
    ...data,
    whatsapp: data.whatsapp || data.phone,
    source: data.utm?.source ? `campaign:${data.utm.source}`.slice(0, 60) : 'website',
    user: req.user?.role === 'client' ? req.user._id : undefined,
    code: await nextCode('LD'),
    ipHash,
    activity: [{ action: 'created', message: `Submitted via ${data.formType || 'website form'}` }],
  });

  const title = `New ${label(lead.service)} lead: ${lead.fullName}`;
  await notifyAudience('leads:read_all', { type: 'new_lead', title, body: lead.destination ? `Destination: ${lead.destination}` : lead.email, link: `/admin/leads/${lead._id}` });
  if (env.adminNotifyEmail) {
    sendEmail({ to: env.adminNotifyEmail, subject: title, text: `${lead.code}\n${lead.fullName}\n${lead.email}\n${lead.phone}\nService: ${label(lead.service)}\nDestination: ${lead.destination || '-'}\n\n${lead.message || ''}` });
  }
  created(res, { code: lead.code, duplicate: false });
});

// ---------------- staff ----------------
export const list = asyncHandler(async (req, res) => {
  const paging = getPaging(req.query);
  const filter = buildFilter(req);
  const sortField = ['createdAt', 'followUpDate', 'fullName', 'status', 'updatedAt'].includes(req.query.sort) ? req.query.sort : 'createdAt';
  const dir = req.query.dir === 'asc' ? 1 : -1;
  const [items, total] = await Promise.all([
    Lead.find(filter).sort({ [sortField]: dir }).skip(paging.skip).limit(paging.limit)
      .select('-notes -activity').populate('assignedTo', 'name role').lean(),
    Lead.countDocuments(filter),
  ]);
  ok(res, items, pageMeta(total, paging));
});

export const board = asyncHandler(async (req, res) => {
  const base = buildFilter(req);
  delete base.status;
  const columns = await Promise.all(
    LEAD_STATUSES.map(async (status) => {
      const f = { ...base, status };
      const [items, total] = await Promise.all([
        Lead.find(f).sort({ updatedAt: -1 }).limit(50).select('code fullName phone service destination priority followUpDate assignedTo createdAt status')
          .populate('assignedTo', 'name').lean(),
        Lead.countDocuments(f),
      ]);
      return { status, total, items };
    }),
  );
  ok(res, columns);
});

export const getOne = asyncHandler(async (req, res) => {
  const lead = await findScoped(req);
  await lead.populate([
    { path: 'assignedTo', select: 'name email role' },
    { path: 'notes.author', select: 'name' },
    { path: 'activity.by', select: 'name' },
    { path: 'client', select: 'code fullName' },
  ]);
  ok(res, lead);
});

export const staffCreate = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  if (data.assignedTo && !hasPermission(req.user.permissions, 'leads:assign')) delete data.assignedTo;
  if (!data.assignedTo && !hasPermission(req.user.permissions, 'leads:read_all')) data.assignedTo = req.user._id; // keep it visible to its creator
  const lead = await Lead.create({
    ...data,
    code: await nextCode('LD'),
    activity: [{ action: 'created', message: `Added manually (${data.source})`, by: req.user._id }],
  });
  if (lead.assignedTo && !lead.assignedTo.equals(req.user._id)) {
    await notifyUser(lead.assignedTo, { type: 'lead_assigned', title: `Lead assigned to you: ${lead.fullName}`, link: `/admin/leads/${lead._id}` });
  }
  await audit(req, 'lead.create', 'Lead', lead._id);
  created(res, lead);
});

export const update = asyncHandler(async (req, res) => {
  const lead = await findScoped(req);
  const changes = req.body;
  const log = [];

  if ('assignedTo' in changes) {
    if (!hasPermission(req.user.permissions, 'leads:assign')) throw ApiError.forbidden('You cannot reassign leads');
    if (changes.assignedTo) {
      const staff = await User.findOne({ _id: changes.assignedTo, role: { $ne: 'client' }, isActive: true });
      if (!staff) throw ApiError.badRequest('Selected staff member not found');
      if (!lead.assignedTo?.equals(staff._id)) {
        log.push({ action: 'assigned', message: `Assigned to ${staff.name}` });
        await notifyUser(staff._id, { type: 'lead_assigned', title: `Lead assigned to you: ${lead.fullName}`, body: label(lead.service), link: `/admin/leads/${lead._id}` });
      }
    } else if (lead.assignedTo) {
      log.push({ action: 'unassigned', message: 'Unassigned' });
    }
  }
  if (changes.status && changes.status !== lead.status) {
    if (changes.status === 'converted' && !lead.client) throw ApiError.badRequest('Use "Convert to client" to mark a lead as converted');
    log.push({ action: 'status_changed', message: `${label(lead.status)} → ${label(changes.status)}` });
  }
  if ('followUpDate' in changes) {
    log.push({ action: 'follow_up', message: changes.followUpDate ? `Follow-up set for ${new Date(changes.followUpDate).toDateString()}` : 'Follow-up cleared' });
  }
  if (changes.priority && changes.priority !== lead.priority) log.push({ action: 'priority', message: `Priority: ${changes.priority}` });

  lead.set(changes);
  log.forEach((l) => lead.activity.push({ ...l, by: req.user._id }));
  await lead.save();
  await audit(req, 'lead.update', 'Lead', lead._id, changes);
  await lead.populate('assignedTo', 'name email role');
  ok(res, lead);
});

export const addNote = asyncHandler(async (req, res) => {
  const lead = await findScoped(req);
  lead.notes.push({ text: req.body.text, author: req.user._id });
  lead.activity.push({ action: 'note_added', message: 'Internal note added', by: req.user._id });
  await lead.save();
  await lead.populate('notes.author', 'name');
  created(res, lead.notes[lead.notes.length - 1]);
});

export const remove = asyncHandler(async (req, res) => {
  const lead = await findScoped(req);
  if (lead.client) throw ApiError.badRequest('This lead has been converted to a client and cannot be deleted');
  await lead.deleteOne();
  await audit(req, 'lead.delete', 'Lead', lead._id, { code: lead.code, name: lead.fullName });
  ok(res, { deleted: true });
});

export const convert = asyncHandler(async (req, res) => {
  const lead = await findScoped(req);
  if (lead.client) throw ApiError.conflict('This lead is already converted');
  if (!lead.email && req.body.createPortalAccess) throw ApiError.badRequest('Add an email to this lead before giving portal access');

  let client = lead.email ? await Client.findOne({ email: lead.email }) : null;
  let portalUser = null;
  let resetLink = null;

  if (req.body.createPortalAccess && lead.email) {
    portalUser = await User.findOne({ email: lead.email });
    if (portalUser && portalUser.role !== 'client') throw ApiError.conflict('This email belongs to a staff account');
    if (!portalUser) {
      // New portal account: random password, and the client sets their own through an invitation link.
      portalUser = new User({ name: lead.fullName, email: lead.email, phone: lead.phone, role: 'client', password: crypto.randomBytes(24).toString('hex') });
      const token = portalUser.createResetToken();
      portalUser.resetTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // invitation valid 7 days
      await portalUser.save();
      resetLink = `${env.clientUrls[0]}/client/reset-password?token=${token}`;
    }
  }

  if (!client) {
    client = await Client.create({
      code: await nextCode('CL'),
      user: portalUser?._id,
      fullName: lead.fullName,
      email: lead.email,
      phone: lead.phone,
      whatsapp: lead.whatsapp,
      nationality: lead.country,
      interestedService: lead.service,
      assignedConsultant: req.body.assignedConsultant || lead.assignedTo || req.user._id,
      sourceLead: lead._id,
    });
  } else if (portalUser && !client.user) {
    client.user = portalUser._id;
    await client.save();
  }

  lead.client = client._id;
  lead.status = 'converted';
  lead.activity.push({ action: 'converted', message: `Converted to client ${client.code}`, by: req.user._id });
  await lead.save();

  if (resetLink) {
    await sendEmail({
      to: lead.email,
      subject: 'Your LN PAK LLC client portal access',
      text: `Dear ${lead.fullName},\n\nYour client portal account is ready. Set your password here (link valid for 7 days):\n${resetLink}\n\nAfter that you can log in to track your application.\n\nLN PAK LLC`,
    });
  }
  await audit(req, 'lead.convert', 'Lead', lead._id, { client: client.code });
  ok(res, { client, portalInviteLink: resetLink });
});

export const exportLeads = asyncHandler(async (req, res) => {
  const filter = buildFilter(req);
  const leads = await Lead.find(filter).sort({ createdAt: -1 }).limit(10000).populate('assignedTo', 'name').lean();
  const cols = [
    ['Lead ID', (l) => l.code], ['Name', (l) => l.fullName], ['Email', (l) => l.email], ['Phone', (l) => l.phone],
    ['WhatsApp', (l) => l.whatsapp], ['Country', (l) => l.country], ['Service', (l) => label(l.service)],
    ['Destination', (l) => l.destination], ['Status', (l) => label(l.status)], ['Priority', (l) => l.priority],
    ['Assigned To', (l) => l.assignedTo?.name], ['Source', (l) => l.source], ['Campaign', (l) => l.utm?.campaign],
    ['Follow-up', (l) => (l.followUpDate ? new Date(l.followUpDate).toISOString().slice(0, 10) : '')],
    ['Message', (l) => l.message], ['Created', (l) => new Date(l.createdAt).toISOString().slice(0, 16).replace('T', ' ')],
  ];
  await audit(req, 'lead.export', 'Lead', null, { count: leads.length, format: req.query.format });
  const stamp = new Date().toISOString().slice(0, 10);

  if (req.query.format === 'xlsx') {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Leads');
    ws.columns = cols.map(([h]) => ({ header: h, width: h === 'Message' ? 50 : 18 }));
    leads.forEach((l) => ws.addRow(cols.map(([, fn]) => fn(l) ?? '')));
    ws.getRow(1).font = { bold: true };
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="lnpak-leads-${stamp}.xlsx"`);
    await wb.xlsx.write(res);
    return res.end();
  }
  // CSV, with formula-injection protection for spreadsheet apps.
  const cell = (v) => {
    let s = v == null ? '' : String(v);
    if (/^[=+\-@]/.test(s)) s = `'${s}`;
    return `"${s.replace(/"/g, '""')}"`;
  };
  const csv = [cols.map(([h]) => cell(h)).join(','), ...leads.map((l) => cols.map(([, fn]) => cell(fn(l))).join(','))].join('\r\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="lnpak-leads-${stamp}.csv"`);
  res.send(`﻿${csv}`);
});
