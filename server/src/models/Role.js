import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    permissions: [{ type: String }],
    isSystem: { type: Boolean, default: false }, // system roles cannot be deleted
  },
  { timestamps: true },
);

export const Role = mongoose.model('Role', roleSchema);
