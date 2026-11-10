import mongoose from 'mongoose';
import { LEAD_STATUSES, SERVICE_TYPES } from '../config/permissions.js';

const noteSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, maxlength: 4000 },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

const activitySchema = new mongoose.Schema(
  {
    action: { type: String, required: true }, // created, status_changed, assigned, note_added, converted ...
    message: String,
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

const leadSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true, index: true },
    fullName: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, lowercase: true, trim: true, maxlength: 160, index: true },
    phone: { type: String, trim: true, maxlength: 30, index: true },
    whatsapp: { type: String, trim: true, maxlength: 30 },
    country: { type: String, trim: true, maxlength: 80 }, // where the lead lives
    service: { type: String, enum: SERVICE_TYPES, default: 'general', index: true },
    destination: { type: String, trim: true, maxlength: 80, index: true },
    message: { type: String, maxlength: 4000 },
    formType: { type: String, maxlength: 60 }, // which website form was used
    reference: { // optional link to tour / university / scholarship the visitor asked about
      kind: { type: String, enum: ['tour', 'university', 'scholarship', 'service', 'country', null], default: null },
      title: String,
      slug: String,
    },
    source: { type: String, default: 'website', maxlength: 60 }, // website, facebook, walk-in, referral ...
    sourcePage: { type: String, maxlength: 300 },
    utm: {
      source: String, medium: String, campaign: String, term: String, content: String,
    },
    status: { type: String, enum: LEAD_STATUSES, default: 'new', index: true },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    followUpDate: { type: Date, index: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // set when a logged-in client submitted it
    notes: [noteSchema],
    activity: [activitySchema],
    duplicateOf: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
    ipHash: { type: String, select: false },
  },
  { timestamps: true },
);

leadSchema.index({ createdAt: -1 });
leadSchema.index({ fullName: 'text', email: 'text', phone: 'text', message: 'text' });

export const Lead = mongoose.model('Lead', leadSchema);
