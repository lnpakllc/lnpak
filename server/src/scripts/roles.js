import { Role } from '../models/Role.js';
import { STAFF_ROLES } from '../config/permissions.js';

// Creates the built-in roles if they are missing. Existing roles keep any permission edits made in the admin panel.
export async function ensureRoles() {
  for (const r of STAFF_ROLES) {
    await Role.updateOne({ key: r.key }, { $setOnInsert: { ...r, isSystem: true } }, { upsert: true });
  }
}
