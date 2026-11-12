// One-time content updates for an existing database. Each migration runs exactly once
// (recorded in the "migrations" collection) the first time the API starts after a deploy.
import mongoose from 'mongoose';
import { Service, Country, TourPackage } from '../models/content.js';
import { Setting } from '../models/system.js';
import {
  CONTACT_EMAIL, OFFICE_HOURS, ABOUT, BUSINESS_SETUP_SERVICE, NEW_COUNTRIES, COUNTRY_ORDER, HOMEPAGE_COUNTRIES, FOOTER_COUNTRIES,
} from './contentDefaults.js';
import { countryTemplate } from './seedData.js';

const nameIs = (name) => new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');

const MIGRATIONS = [
  {
    id: '2026-11-11-lnpak-content-update',
    async up() {
      // Contact, working hours and About Us.
      const site = await Setting.findOne({ key: 'site' });
      if (site) {
        site.set('contact.email', CONTACT_EMAIL);
        site.set('contact.officeHours', OFFICE_HOURS);
        site.set('about', ABOUT);
        await site.save();
      }

      // Immigration Services → Business Setup & Relocation.
      const svc = await Service.findOne({ $or: [{ serviceType: 'immigration' }, { slug: 'immigration-services' }] });
      if (svc) {
        svc.set({ ...BUSINESS_SETUP_SERVICE, faqs: svc.faqs, process: svc.process, seo: {} });
        await svc.save();
      }

      // New destination pages.
      for (const [name, isoCode, region] of NEW_COUNTRIES) {
        if (!(await Country.exists({ name: nameIs(name) }))) await Country.create(countryTemplate(name, isoCode, region));
      }

      // Homepage, footer and ordering.
      for (const c of await Country.find()) {
        const pos = COUNTRY_ORDER.findIndex((n) => n.toLowerCase() === c.name.toLowerCase());
        c.sortOrder = pos === -1 ? 100 + c.sortOrder : pos;
        c.isFeatured = HOMEPAGE_COUNTRIES.some((n) => n.toLowerCase() === c.name.toLowerCase());
        c.showInFooter = FOOTER_COUNTRIES.some((n) => n.toLowerCase() === c.name.toLowerCase());
        await c.save();
      }

      // Tour packages: no prices on the website.
      await TourPackage.updateMany({}, { $unset: { price: 1, priceNote: 1 } });
      for (const t of await TourPackage.find({ summary: /itinerary, hotels and price/ })) {
        t.summary = t.summary.replace('itinerary, hotels and price', 'itinerary and hotels');
        await t.save();
      }
    },
  },
  {
    id: '2026-11-12-tour-categories',
    async up() {
      // Old country-based categories → the new package types (destination stays on each package).
      const map = { turkey: 'family', dubai: 'family', malaysia: 'family', europe: 'family', saudi: 'religious', spiritual: 'religious' };
      for (const [from, to] of Object.entries(map)) await TourPackage.updateMany({ category: from }, { $set: { category: to } });
    },
  },
  {
    id: '2026-11-12-multiple-offices',
    async up() {
      // The existing single address becomes the first (head) office; staff add the others in Admin → Site Settings.
      const site = await Setting.findOne({ key: 'site' });
      if (site && !(site.contact?.offices || []).length && site.contact?.address) {
        site.set('contact.offices', [{ name: 'Head Office', address: site.contact.address, mapUrl: site.contact.mapUrl || undefined }]);
        await site.save();
      }
    },
  },
];

const Migration = mongoose.models.Migration
  || mongoose.model('Migration', new mongoose.Schema({ _id: String, status: String, finishedAt: Date }, { timestamps: true }));

export async function runMigrations() {
  for (const m of MIGRATIONS) {
    const done = await Migration.findById(m.id).lean();
    if (done?.status === 'done') continue;
    // Claim it so two server instances starting together don't both run it.
    try {
      if (!done) await Migration.create({ _id: m.id, status: 'running' });
      else if (Date.now() - new Date(done.updatedAt).getTime() < 5 * 60 * 1000) continue; // another instance is running it
    } catch (e) {
      if (e.code === 11000) continue;
      throw e;
    }
    await m.up();
    await Migration.updateOne({ _id: m.id }, { status: 'done', finishedAt: new Date() });
    console.log(`Migration applied: ${m.id}`);
  }
}
