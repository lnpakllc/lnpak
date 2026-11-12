import { env } from '../config/env.js';
import { Service, Country, TourPackage, University, Scholarship } from '../models/content.js';
import { asyncHandler } from '../utils/http.js';

// XML sitemap of every public, indexable page. Admin and client pages are never listed.
export const sitemap = asyncHandler(async (_req, res) => {
  const site = process.env.PUBLIC_SITE_URL || env.clientUrls[0];
  const staticPaths = ['/', '/services', '/destinations', '/tours', '/videos', '/education', '/universities', '/scholarships', '/about', '/contact', '/privacy-policy', '/terms', '/refund-policy'];
  const groups = [
    ['/services', Service], ['/destinations', Country], ['/tours', TourPackage], ['/universities', University], ['/scholarships', Scholarship],
  ];
  const urls = staticPaths.map((p) => ({ loc: site + p }));
  for (const [prefix, Model] of groups) {
    const docs = await Model.find({ isPublished: true }).select('slug updatedAt').lean();
    docs.forEach((d) => urls.push({ loc: `${site}${prefix}/${d.slug}`, lastmod: d.updatedAt.toISOString().slice(0, 10) }));
  }
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`)
    .join('\n')}\n</urlset>`;
  res.type('application/xml').send(xml);
});
