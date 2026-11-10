// Creates the first Super Admin account.
// Usage: npm run create-admin -- --name "Your Name" --email you@lnpak.com
// The password is asked for interactively (or taken from SUPER_ADMIN_PASSWORD) and never stored in code.
import readline from 'readline';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { ensureRoles } from './roles.js';

const arg = (name) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
};

function ask(question, hidden = false) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  if (hidden) rl._writeToOutput = (s) => rl.output.write(s.includes(question) ? s : '*');
  return new Promise((resolve) => rl.question(question, (a) => { rl.close(); if (hidden) process.stdout.write('\n'); resolve(a.trim()); }));
}

async function main() {
  await connectDB();
  await ensureRoles();
  if (await User.exists({ role: 'super_admin' })) {
    console.log('A Super Admin already exists. Use the admin panel (Staff) to add more accounts.');
    return;
  }
  const name = arg('name') || process.env.SUPER_ADMIN_NAME || (await ask('Full name: '));
  const email = (arg('email') || process.env.SUPER_ADMIN_EMAIL || (await ask('Email: '))).toLowerCase();
  const password = process.env.SUPER_ADMIN_PASSWORD || (await ask('Password (min 8 chars, letters + numbers): ', true));
  if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) throw new Error('Password must be at least 8 characters with letters and numbers');
  const user = await User.create({ name, email, password, role: 'super_admin' });
  console.log(`Super Admin created: ${user.email}. Log in at /admin/login`);
}

main()
  .catch((e) => { console.error(e.message); process.exitCode = 1; })
  .finally(() => mongoose.disconnect());
