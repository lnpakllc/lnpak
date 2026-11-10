import { Lead } from '../models/Lead.js';
import { Client } from '../models/Client.js';
import { User } from '../models/User.js';
import { NewsletterSubscriber } from '../models/system.js';
import { hasPermission } from '../middleware/auth.js';
import { asyncHandler, ok } from '../utils/http.js';

// Every number here is computed from MongoDB at request time.
export const stats = asyncHandler(async (req, res) => {
  const all = hasPermission(req.user.permissions, 'leads:read_all');
  const scope = all ? {} : { assignedTo: req.user._id };
  const clientScope = hasPermission(req.user.permissions, 'clients:read_all') ? {} : { assignedConsultant: req.user._id };

  const startToday = new Date(); startToday.setHours(0, 0, 0, 0);
  const endToday = new Date(); endToday.setHours(23, 59, 59, 999);
  const start12 = new Date(); start12.setMonth(start12.getMonth() - 11, 1); start12.setHours(0, 0, 0, 0);
  const open = { $nin: ['converted', 'not_interested', 'lost'] };

  const [
    totalLeads, newLeads, leadsToday, convertedLeads, followUpsToday, overdueFollowUps,
    totalClients, activeClients, subscribers, byStatus, byService, byDestination, byMonth, bySource,
  ] = await Promise.all([
    Lead.countDocuments(scope),
    Lead.countDocuments({ ...scope, status: 'new' }),
    Lead.countDocuments({ ...scope, createdAt: { $gte: startToday } }),
    Lead.countDocuments({ ...scope, status: 'converted' }),
    Lead.countDocuments({ ...scope, followUpDate: { $gte: startToday, $lte: endToday }, status: open }),
    Lead.countDocuments({ ...scope, followUpDate: { $lt: startToday }, status: open }),
    Client.countDocuments(clientScope),
    Client.countDocuments({ ...clientScope, status: 'active' }),
    all ? NewsletterSubscriber.countDocuments({ isActive: true }) : null,
    Lead.aggregate([{ $match: scope }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Lead.aggregate([{ $match: scope }, { $group: { _id: '$service', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    Lead.aggregate([
      { $match: { ...scope, destination: { $nin: [null, ''] } } },
      { $group: { _id: { $toLower: '$destination' }, name: { $first: '$destination' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } }, { $limit: 8 },
    ]),
    Lead.aggregate([
      { $match: { ...scope, createdAt: { $gte: start12 } } },
      { $group: { _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } }, leads: { $sum: 1 }, converted: { $sum: { $cond: [{ $eq: ['$status', 'converted'] }, 1, 0] } } } },
    ]),
    Lead.aggregate([{ $match: scope }, { $group: { _id: '$source', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 6 }]),
  ]);

  // Fill all 12 months so the chart has no gaps.
  const months = [];
  for (let i = 0; i < 12; i += 1) {
    const d = new Date(start12); d.setMonth(start12.getMonth() + i);
    const hit = byMonth.find((m) => m._id.y === d.getFullYear() && m._id.m === d.getMonth() + 1);
    months.push({ month: d.toLocaleString('en', { month: 'short', year: '2-digit' }), leads: hit?.leads || 0, converted: hit?.converted || 0 });
  }

  let staffPerformance = [];
  if (all) {
    const perf = await Lead.aggregate([
      { $match: { assignedTo: { $ne: null } } },
      { $group: { _id: '$assignedTo', assigned: { $sum: 1 }, converted: { $sum: { $cond: [{ $eq: ['$status', 'converted'] }, 1, 0] } }, open: { $sum: { $cond: [{ $in: ['$status', ['converted', 'not_interested', 'lost']] }, 0, 1] } } } },
      { $sort: { converted: -1, assigned: -1 } }, { $limit: 10 },
    ]);
    const users = await User.find({ _id: { $in: perf.map((p) => p._id) } }).select('name role').lean();
    staffPerformance = perf.map((p) => {
      const u = users.find((x) => x._id.equals(p._id));
      return { name: u?.name || 'Removed user', role: u?.role, assigned: p.assigned, converted: p.converted, open: p.open };
    });
  }

  const recentLeads = await Lead.find(scope).sort({ createdAt: -1 }).limit(6).select('code fullName service destination status createdAt').lean();

  ok(res, {
    scope: all ? 'all' : 'assigned',
    cards: {
      totalLeads, newLeads, leadsToday, convertedLeads, followUpsToday, overdueFollowUps, totalClients, activeClients, subscribers,
      conversionRate: totalLeads ? Math.round((convertedLeads / totalLeads) * 1000) / 10 : 0,
    },
    charts: {
      byStatus: byStatus.map((s) => ({ status: s._id, count: s.count })),
      byService: byService.map((s) => ({ service: s._id, count: s.count })),
      byDestination: byDestination.map((d) => ({ destination: d.name, count: d.count })),
      bySource: bySource.map((s) => ({ source: s._id || 'unknown', count: s.count })),
      byMonth: months,
      staffPerformance,
    },
    recentLeads,
  });
});
