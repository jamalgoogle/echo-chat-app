import { Check, CheckCheck, FileText } from 'lucide-react';
import { fileSrc } from '../services/api.js';
import { formatTime } from '../lib/chat.js';

function Attachment({ message }) {
  const src = fileSrc(message.fileUrl);
  switch (message.fileType) {
    case 'image':
      return (
        <a href={src} target="_blank" rel="noreferrer">
          <img src={src} alt={message.fileName || 'Shared image'} loading="lazy" className="max-h-72 rounded-lg object-cover" />
        </a>
      );
    case 'video':
      return <video src={src} controls preload="metadata" className="max-h-72 rounded-lg" />;
    case 'audio':
      return <audio src={src} controls preload="metadata" className="w-64 max-w-full" />;
    default:
      return (
        <a href={src} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg bg-black/10 px-3 py-2 text-sm">
          <FileText size={18} className="shrink-0" />
          <span className="truncate">{message.fileName || 'Document'}</span>
        </a>
      );
  }
}

export default function MessageBubble({ message, mine, chat }) {
  const showSender = chat.isGroup && !mine;
  // Read = every other member's lastReadAt is at or after this message.
  const read = chat.members
    .filter((m) => m.userId !== message.senderId)
    .every((m) => m.lastReadAt && new Date(m.lastReadAt) >= new Date(message.createdAt));

  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] space-y-1.5 rounded-2xl px-3.5 py-2 md:max-w-[65%] ${mine ? 'rounded-br-sm bg-harbor text-white' : 'rounded-bl-sm bg-white text-slate-800 shadow-sm'}`}>
        {showSender && <p className="text-xs font-semibold text-harbor">{message.sender?.username}</p>}
        {message.fileUrl && <Attachment message={message} />}
        {message.content && <p className="whitespace-pre-wrap break-words">{message.content}</p>}
        <p className={`flex items-center justify-end gap-1 text-[11px] ${mine ? 'text-white/70' : 'text-slate-400'}`}>
          {formatTime(message.createdAt)}
          {mine && (read ? <CheckCheck size={14} className="text-amber" aria-label="Read" /> : <Check size={14} aria-label="Sent" />)}
        </p>
      </div>
    </div>
  );
}
