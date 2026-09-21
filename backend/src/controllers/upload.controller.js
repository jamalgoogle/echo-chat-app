import { fileTypeFromPath } from '../config/multer.js';
import { httpError } from '../middleware/error.js';

// POST /api/messages/upload  (multipart field name: "file")
export function uploadFile(req, res) {
  if (!req.file) throw httpError(400, 'No file received');
  const fileUrl = `/uploads/${req.file.filename}`;
  const base = process.env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`;
  res.status(201).json({
    fileUrl, // relative path: this is what gets sent in `send_message` and stored in the DB
    url: `${base}${fileUrl}`, // absolute URL, handy for previews
    fileType: fileTypeFromPath(fileUrl),
    size: req.file.size,
  });
}
