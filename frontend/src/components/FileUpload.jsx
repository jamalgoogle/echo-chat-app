import { useRef } from 'react';
import { Paperclip } from 'lucide-react';
import { api } from '../services/api.js';

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPT = 'image/png,image/jpeg,image/webp,application/pdf,audio/mpeg,audio/wav,audio/ogg,audio/webm,video/mp4,video/webm';

// Uploads immediately on pick (POST /api/messages/upload) and reports the result to the parent.
export default function FileUpload({ disabled, onUploaded, onProgress, onError }) {
  const inputRef = useRef(null);

  const pick = async (e) => {
    const file = e.target.files[0];
    e.target.value = ''; // allow picking the same file again
    if (!file) return;
    if (file.size > MAX_BYTES) return onError('File is larger than 10 MB');

    const body = new FormData();
    body.append('file', file);
    onError('');
    onProgress(0);
    try {
      const { data } = await api.post('/messages/upload', body, {
        onUploadProgress: (p) => onProgress(Math.round((p.loaded / (p.total || file.size)) * 100)),
      });
      onUploaded({ ...data, fileName: file.name, previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null });
    } catch (err) {
      onError(err.response?.data?.error || 'Upload failed');
    } finally {
      onProgress(null);
    }
  };

  return (
    <>
      <input ref={inputRef} type="file" accept={ACCEPT} className="hidden" onChange={pick} />
      <button type="button" disabled={disabled} onClick={() => inputRef.current.click()} aria-label="Attach a file" title="Attach a file" className="rounded-lg p-2 text-slate-500 hover:bg-slate-200 disabled:opacity-50">
        <Paperclip size={20} />
      </button>
    </>
  );
}
