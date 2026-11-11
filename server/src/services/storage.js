// Stores public website images (tour photos, logos, hero image). First match wins:
// 1. CLOUDINARY_URL set       → Cloudinary (images are auto-compressed and served in the best format).
// 2. BLOB_READ_WRITE_TOKEN set → Vercel Blob.
// 3. Local development         → server/uploads/public on disk.
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

  if (env.cloudinaryUrl) return saveToCloudinary(file.buffer);

  if (env.blobToken) {
    const { put } = await import('@vercel/blob');
    const blob = await put(`website/${name}`, file.buffer, { access: 'public', contentType: type, token: env.blobToken });
    return { url: blob.url, size: file.size };
  }

  if (env.isVercel) {
    const err = new Error('Image storage is not set up. Add CLOUDINARY_URL (or connect a Vercel Blob store) in the API project settings and redeploy.');
    err.status = 503;
    throw err;
  }
  await fs.mkdir(PUBLIC_UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(PUBLIC_UPLOAD_DIR, name), file.buffer);
  return { url: `/uploads/public/${name}`, size: file.size };
}

// ---------- Cloudinary ----------
const setupError = (msg) => Object.assign(new Error(msg), { status: 503 });

// Checks the value has the shape cloudinary://API_KEY:API_SECRET@CLOUD_NAME and no placeholders.
export function parseCloudinaryUrl(value) {
  const m = /^cloudinary:\/\/([^:@\s]+):([^@\s]+)@([^/?\s]+)\/?$/.exec(value || '');
  if (!m) throw setupError('CLOUDINARY_URL is not in the right format. It must look like cloudinary://API_KEY:API_SECRET@CLOUD_NAME (copy "API environment variable" from Cloudinary → Settings → API Keys).');
  const [, apiKey, apiSecret, cloudName] = m;
  if ([apiKey, apiSecret, cloudName].some((x) => /[<>*]/.test(x))) {
    throw setupError('CLOUDINARY_URL still contains a placeholder such as <your_api_secret> or *****. Reveal the real secret in Cloudinary and paste the full value.');
  }
  return { cloud_name: cloudName, api_key: apiKey, api_secret: decodeURIComponent(apiSecret) };
}

let cloudinaryReady = null;
async function cloudinaryClient() {
  const creds = parseCloudinaryUrl(env.cloudinaryUrl);
  cloudinaryReady ||= import('cloudinary').then(({ v2 }) => v2).catch((e) => { cloudinaryReady = null; throw e; });
  const v2 = await cloudinaryReady;
  v2.config({ ...creds, secure: true }); // secure = always https links
  return v2;
}

// f_auto,q_auto: Cloudinary picks the lightest format (WebP/AVIF) and quality for each visitor's browser.
export const optimizedCloudinaryUrl = (url) => url.replace('/image/upload/', '/image/upload/f_auto,q_auto/');

async function saveToCloudinary(buffer) {
  const cloudinary = await cloudinaryClient();
  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'lnpak/website', resource_type: 'image', overwrite: false, unique_filename: true },
      (err, res) => {
        if (err) {
          const auth = [401, 403].includes(err.http_code) || /api_key|api_secret|cloud_name|signature/i.test(err.message || '');
          const e = new Error(auth ? `Cloudinary rejected the credentials (${err.message}). Check CLOUDINARY_URL in the API project settings.` : `Image upload failed: ${err.message}`);
          e.status = auth ? 503 : 502;
          return reject(e);
        }
        resolve(res);
      },
    );
    stream.end(buffer);
  });
  return { url: optimizedCloudinaryUrl(result.secure_url), size: result.bytes };
}
