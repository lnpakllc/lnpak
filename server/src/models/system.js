// Supporting models: notifications, audit log, newsletter, site settings.
import mongoose from 'mongoose';

const { Schema } = mongoose;

export const Notification = mongoose.model(
  'Notification',
  new Schema(
    {
      // Either a specific user, or an audience permission (every staff member holding it sees it).
      user: { type: Schema.Types.ObjectId, ref: 'User', index: true },
      audience: { type: String, index: true }, // e.g. 'leads:read_all'
      type: { type: String, required: true }, // new_lead, lead_assigned, client_registered ...
      title: { type: String, required: true },
      body: String,
      link: String,
      readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    },
    { timestamps: true },
  ),
);

export const AuditLog = mongoose.model(
  'AuditLog',
  new Schema(
    {
      user: { type: Schema.Types.ObjectId, ref: 'User' },
      action: { type: String, required: true },
      entity: String,
      entityId: String,
      details: Schema.Types.Mixed,
      ip: String,
    },
    { timestamps: { createdAt: true, updatedAt: false } },
  ).index({ createdAt: -1 }),
);

export const NewsletterSubscriber = mongoose.model(
  'NewsletterSubscriber',
  new Schema(
    {
      email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 160 },
      isActive: { type: Boolean, default: true },
      sourcePage: String,
    },
    { timestamps: true },
  ),
);

// Single document holding editable website settings and page content.
export const Setting = mongoose.model(
  'Setting',
  new Schema(
    {
      key: { type: String, default: 'site', unique: true },
      contact: {
        email: String,
        phone: String,
        whatsapp: String, // digits with country code, e.g. 923001234567
        address: String,
        mapUrl: String,
        officeHours: String,
        // Head office is first. `address`/`mapUrl` above mirror it for older code.
        offices: [{ _id: false, name: { type: String, maxlength: 80 }, address: { type: String, maxlength: 300 }, phone: { type: String, maxlength: 40 }, mapUrl: { type: String, maxlength: 500 } }],
      },
      social: { facebook: String, instagram: String, linkedin: String, youtube: String, tiktok: String },
      hero: {
        eyebrow: String,
        title: String,
        subtitle: String,
        image: String,
      },
      about: { title: String, body: String, mission: String, vision: String, values: [String] },
      footerAbout: String,
      pages: {
        privacy: String,
        terms: String,
        refund: String,
      },
      seo: { metaTitle: String, metaDescription: String, ogImage: String },
    },
    { timestamps: true, minimize: false },
  ),
);
