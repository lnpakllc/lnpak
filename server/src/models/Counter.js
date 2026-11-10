import mongoose from 'mongoose';

// Atomic sequence counters used for human-readable IDs (LD-2026-00001, CL-2026-00001 ...)
const counterSchema = new mongoose.Schema({ _id: String, seq: { type: Number, default: 0 } });
export const Counter = mongoose.model('Counter', counterSchema);

export async function nextCode(prefix) {
  const year = new Date().getFullYear();
  const key = `${prefix}-${year}`;
  const c = await Counter.findOneAndUpdate({ _id: key }, { $inc: { seq: 1 } }, { new: true, upsert: true });
  return `${prefix}-${year}-${String(c.seq).padStart(5, '0')}`;
}
