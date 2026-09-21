import { useEffect, useRef, useState } from 'react';
import { FileText, Send, X } from 'lucide-react';
import { useAuthStore } from '../store/authStore.js';
import { useChatStore } from '../store/chatStore.js';
import { getSocket } from '../services/socket.js';
import FileUpload from './FileUpload.jsx';

export default function MessageInput({ chatId }) {
  const myId = useAuthStore((s) => s.user.id);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const [text, setText] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [progress, setProgress] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const typing = useRef({ last: 0, timer: null });

  useEffect(() => () => clearTimeout(typing.current.timer), []);

  const announceTyping = () => {
    const socket = getSocket();
    const now = Date.now();
    if (now - typing.current.last > 2000) {
      socket?.emit('typing', { chatId, isTyping: true });
      typing.current.last = now;
    }
    clearTimeout(typing.current.timer);
    typing.current.timer = setTimeout(() => {
      socket?.emit('typing', { chatId, isTyping: false });
      typing.current.last = 0;
    }, 2500);
  };

  const canSend = (text.trim() || attachment) && progress === null && !sending;

  const submit = async () => {
    if (!canSend) return;
    setSending(true);
    setError('');
    try {
      await sendMessage({ chatId, content: text, fileUrl: attachment?.fileUrl, fileName: attachment?.fileName }, myId);
      setText('');
      setAttachment(null);
      clearTimeout(typing.current.timer);
      typing.current.last = 0;
      getSocket()?.emit('typing', { chatId, isTyping: false });
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="border-t border-slate-200 bg-white p-3">
      {(attachment || progress !== null) && (
        <div className="mb-2 flex items-center gap-3 rounded-lg bg-slate-100 p-2 text-sm">
          {progress !== null ? (
            <span>Uploading… {progress}%</span>
          ) : (
            <>
              {attachment.previewUrl ? (
                <img src={attachment.previewUrl} alt="" className="h-12 w-12 rounded object-cover" />
              ) : (
                <FileText size={20} />
              )}
              <span className="min-w-0 flex-1 truncate">{attachment.fileName}</span>
              <button aria-label="Remove attachment" onClick={() => setAttachment(null)} className="rounded p-1 hover:bg-slate-200"><X size={16} /></button>
            </>
          )}
        </div>
      )}

      {error && <p role="alert" className="mb-2 text-sm text-red-600">{error}</p>}

      <div className="flex items-end gap-2">
        <FileUpload disabled={progress !== null} onUploaded={setAttachment} onProgress={setProgress} onError={setError} />
        <textarea
          rows={1}
          value={text}
          placeholder="Write a message"
          onChange={(e) => { setText(e.target.value); announceTyping(); }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          className="max-h-32 min-h-10 flex-1 resize-none rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-harbor focus:ring-2 focus:ring-harbor/25"
        />
        <button onClick={submit} disabled={!canSend} aria-label="Send message" className="rounded-lg bg-harbor p-2.5 text-white hover:bg-harbor/90 disabled:opacity-40">
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
