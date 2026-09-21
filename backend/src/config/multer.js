import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { httpError } from '../middleware/error.js';

export const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// The extension is chosen by us from the MIME type, never from the client's filename.
const MIME_EXT = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
  'audio/mpeg': '.mp3',
  'audio/wav': '.wav',
  'audio/ogg': '.ogg',
  'audio/webm': '.webm',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
};

const EXT_TYPE = {
  '.png': 'image', '.jpg': 'image', '.webp': 'image',
  '.pdf': 'document',
  '.mp3': 'audio', '.wav': 'audio', '.ogg': 'audio',
  '.mp4': 'video', '.webm': 'video',
};

const PATH_RE = /^\/uploads\/[0-9a-f-]{36}(\.[a-z0-9]+)$/;

/** Returns 'image' | 'document' | 'audio' | 'video', or null if the path isn't one of our uploads. */
export function fileTypeFromPath(p) {
  const match = PATH_RE.exec(typeof p === 'string' ? p : '');
  return match ? EXT_TYPE[match[1]] ?? null : null;
}

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, file, cb) => cb(null, `${crypto.randomUUID()}${MIME_EXT[file.mimetype]}`),
  }),
  fileFilter: (req, file, cb) =>
    MIME_EXT[file.mimetype]
      ? cb(null, true)
      : cb(httpError(400, 'Unsupported file type. Use PNG, JPG, WEBP, PDF, or an audio/video clip.')),
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
});
