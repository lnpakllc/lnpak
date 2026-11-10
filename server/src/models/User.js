import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 160 },
    phone: { type: String, trim: true, maxlength: 30 },
    password: { type: String, required: true, minlength: 8, select: false },
    // 'client' for portal users, otherwise a Role.key (super_admin, admin, sales_agent ...)
    role: { type: String, required: true, default: 'client', index: true },
    isActive: { type: Boolean, default: true },
    avatar: String,
    lastLoginAt: Date,
    passwordChangedAt: Date,
    resetTokenHash: { type: String, select: false },
    resetTokenExpires: { type: Date, select: false },
  },
  { timestamps: true },
);

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
  if (!this.isNew) this.passwordChangedAt = new Date(Date.now() - 1000);
});

userSchema.methods.comparePassword = function comparePassword(plain) {
  return bcrypt.compare(plain, this.password);
};

userSchema.methods.createResetToken = function createResetToken() {
  const token = crypto.randomBytes(32).toString('hex');
  this.resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');
  this.resetTokenExpires = new Date(Date.now() + 30 * 60 * 1000);
  return token;
};

userSchema.virtual('isStaff').get(function isStaff() {
  return this.role !== 'client';
});

userSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.resetTokenHash;
    delete ret.resetTokenExpires;
    delete ret.__v;
    return ret;
  },
});

export const User = mongoose.model('User', userSchema);
