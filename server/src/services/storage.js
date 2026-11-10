// Stores public website images (tour photos, logos, hero image).
// - Vercel / production with BLOB_READ_WRITE_TOKEN → Vercel Blob (files survive redeploys).
// - Local development without the token → server/uploads/public on disk.
// Private client documents are NOT stored here; they will use private storage with signed URLs.
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { env } from '../config/env.js';

export const IMAGE_TYPES = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
export const PUBLIC_UPLOAD_DIR = path.resolve(env.uploadDir, 'public');

// Check the real file signature, not only the browser-reported type.
function sniffImage(buf) {
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  return null;
}

export async function savePublicImage(file) {
  const type = sniffImage(file.buffer);
  if (!type) {
    const err = new Error('This file is not a valid JPG, PNG or WEBP image');
    err.status = 400;
    throw err;
  }
  const name = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${IMAGE_TYPES[type]}`;

  if (env.blobToken) {
    const { put } = await import('@vercel/blob');
    const blob = await put(`website/${name}`, file.buffer, { access: 'public', contentType: type, token: env.blobToken });
    return { url: blob.url, size: file.size };
  }

  if (env.isVercel) {
    const err = new Error('Image storage is not set up. Connect a Vercel Blob store to this project (it adds BLOB_READ_WRITE_TOKEN).');
    err.status = 503;
    throw err;
  }
  await fs.mkdir(PUBLIC_UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(PUBLIC_UPLOAD_DIR, name), file.buffer);
  return { url: `/uploads/public/${name}`, size: file.size };
}
