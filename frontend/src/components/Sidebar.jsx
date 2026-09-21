import { useState } from 'react';
import { LogOut, SquarePen } from 'lucide-react';
import { useAuthStore } from '../store/authStore.js';
import { useChatStore } from '../store/chatStore.js';
import { chatTitle, otherMember, previewText } from '../lib/chat.js';
import Avatar from './Avatar.jsx';
import NewChatModal from './NewChatModal.jsx';

const iconBtn = 'rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white';

export default function Sidebar({ className = '' }) {
  const { user, logout } = useAuthStore();
  const { chats, activeChatId, openChat, online } = useChatStore();
  const [creating, setCreating] = useState(false);

  return (
    <aside className={`w-full shrink-0 flex-col bg-ink text-slate-100 md:w-80 ${className}`}>
      <header className="flex items-center justify-between px-4 py-4">
        <div className="min-w-0">
          <p className="truncate font-semibold">{user.username}</p>
          <p className="truncate text-xs text-slate-400">{user.email}</p>
        </div>
        <div className="flex gap-1">
          <button className={iconBtn} aria-label="New chat" title="New chat" onClick={() => setCreating(true)}><SquarePen size={18} /></button>
          <button className={iconBtn} aria-label="Log out" title="Log out" onClick={logout}><LogOut size={18} /></button>
        </div>
      </header>

      <ul className="flex-1 overflow-y-auto">
        {chats.length === 0 && (
          <li className="px-4 py-8 text-sm text-slate-400">No conversations yet. Use the pencil icon to start one.</li>
        )}
        {chats.map((chat) => {
          const other = otherMember(chat, user.id);
          const title = chatTitle(chat, user.id);
          return (
            <li key={chat.id}>
              <button
                onClick={() => openChat(chat.id)}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/5 ${activeChatId === chat.id ? 'bg-white/10' : ''}`}
              >
                <Avatar name={title} online={chat.isGroup ? undefined : !!online[other?.userId]} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{title}</span>
                  <span className="block truncate text-sm text-slate-400">{previewText(chat, user.id)}</span>
                </span>
                {chat.unread > 0 && (
                  <span className="grid min-w-6 place-items-center rounded-full bg-amber px-1.5 text-xs font-bold text-ink">
                    {chat.unread}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {creating && <NewChatModal onClose={() => setCreating(false)} />}
    </aside>
  );
}
