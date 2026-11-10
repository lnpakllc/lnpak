import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, sparse: true }, // portal login
    fullName: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, lowercase: true, trim: true, maxlength: 160, index: true },
    phone: { type: String, trim: true, maxlength: 30 },
    whatsapp: { type: String, trim: true, maxlength: 30 },
    address: { type: String, maxlength: 300 },
    nationality: { type: String, maxlength: 80 },
    dateOfBirth: Date,
    // Passport details are sensitive: never returned to staff without clients:write (see controller projection).
    passport: {
      number: { type: String, maxlength: 30 },
      expiry: Date,
    },
    interestedService: String,
    assignedConsultant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    status: { type: String, enum: ['active', 'inactive', 'completed'], default: 'active', index: true },
    sourceLead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
    staffNotes: [
      new mongoose.Schema({ text: String, author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } }, { timestamps: true }),
    ],
  },
  { timestamps: true },
);

clientSchema.index({ fullName: 'text', email: 'text', phone: 'text' });

export const Client = mongoose.model('Client', clientSchema);
