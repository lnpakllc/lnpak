import mongoose from 'mongoose';
import { env } from './env.js';

// strictQuery drops unknown filter fields. Operator injection ($ne, $where ...) is blocked earlier:
// express-mongo-sanitize strips "$" keys from body/query/params, and zod validates every write.
mongoose.set('strictQuery', true);

export async function connectDB() {
  await mongoose.connect(env.mongoUri, { autoIndex: !env.isProd });
  console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
}
