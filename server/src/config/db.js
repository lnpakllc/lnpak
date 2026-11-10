import mongoose from 'mongoose';
import { env } from './env.js';

// strictQuery drops unknown filter fields. Operator injection ($ne, $where ...) is blocked earlier:
// express-mongo-sanitize strips "$" keys from body/query/params, and zod validates every write.
mongoose.set('strictQuery', true);

// One shared connection per process. On Vercel a warm function instance handles many requests,
// so we connect once and reuse it instead of opening a new connection on every request.
let connecting = null;

export async function connectDB() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (!connecting) {
    connecting = mongoose
      .connect(env.mongoUri, {
        autoIndex: !env.isProd,
        maxPoolSize: env.isVercel ? 5 : 20,
        serverSelectionTimeoutMS: 10000,
      })
      .then((m) => {
        console.log(`MongoDB connected: ${m.connection.host}/${m.connection.name}`);
        return m.connection;
      })
      .catch((err) => {
        connecting = null; // allow the next request to retry
        throw err;
      });
  }
  return connecting;
}
