// Shared HTTP helpers: async wrapper, error type, consistent response shape.

export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
  static badRequest(msg = 'Bad request', details) { return new ApiError(400, msg, details); }
  static unauthorized(msg = 'Please log in to continue') { return new ApiError(401, msg); }
  static forbidden(msg = 'You do not have permission to do this') { return new ApiError(403, msg); }
  static notFound(msg = 'Not found') { return new ApiError(404, msg); }
  static conflict(msg = 'Already exists') { return new ApiError(409, msg); }
}

export const ok = (res, data, meta, status = 200) => res.status(status).json({ success: true, data, ...(meta ? { meta } : {}) });
export const created = (res, data) => ok(res, data, undefined, 201);

// Pagination from query (?page=&limit=), limit capped to avoid huge reads.
export function getPaging(query, defaultLimit = 20) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
}

export const pageMeta = (total, { page, limit }) => ({ total, page, limit, pages: Math.ceil(total / limit) || 1 });

// Escape user text before using it in a RegExp search.
export const escapeRegex = (s = '') => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').slice(0, 100);

export const slugify = (s = '') =>
  String(s).toLowerCase().trim().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120);
