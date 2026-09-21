import { useLayoutEffect, useRef } from 'react';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore.js';
import { useChatStore } from '../store/chatStore.js';
import { chatTitle, otherMember } from '../lib/chat.js';
import MessageBubble from './MessageBubble.jsx';
import MessageInput from './MessageInput.jsx';

export default function ChatWindow({ className = '' }) {
  const myId = useAuthStore((s) => s.user.id);
  const { chats, activeChatId, threads, typing, online, loadMessages, closeChat } = useChatStore();
  const chat = chats.find((c) => c.id === activeChatId);

  if (!chat) {
    return (
      <main className={`flex-1 flex-col items-center justify-center gap-2 text-slate-500 ${className}`}>
        <MessageCircle size={40} />
        <p>Pick a conversation or start a new one.</p>
      </main>
    );
  }

  return (
    <main className={`min-w-0 flex-1 flex-col ${className}`}>
      <Thread key={chat.id} chat={chat} myId={myId} thread={threads[chat.id]} typingNow={typing[chat.id]} online={online} loadMessages={loadMessages} closeChat={closeChat} />
    </main>
  );
}

function Thread({ chat, myId, thread, typingNow, online, loadMessages, closeChat }) {
  const listRef = useRef(null);
  const stickToBottom = useRef(true);
  const heightBeforeLoad = useRef(0);
  const items = thread?.items ?? [];
  const lastIsMine = items.at(-1)?.senderId === myId;

  // New message → follow it if we're near the bottom (or we sent it).
  // Older page loaded → keep the reader's position instead of jumping.
  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;
    if (heightBeforeLoad.current) {
      el.scrollTop += el.scrollHeight - heightBeforeLoad.current;
      heightBeforeLoad.current = 0;
    } else if (stickToBottom.current || lastIsMine) {
      el.scrollTop = el.scrollHeight;
    }
  }, [items.length, thread?.page, lastIsMine]);

  const onScroll = () => {
    const el = listRef.current;
    stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  };

  const loadOlder = () => {
    heightBeforeLoad.current = listRef.current.scrollHeight;
    loadMessages(chat.id, thread.page + 1);
  };

  const others = Object.values(typingNow ?? {});
  const other = otherMember(chat, myId);
  const status = others.length
    ? `${others.join(', ')} ${others.length > 1 ? 'are' : 'is'} typing…`
    : chat.isGroup
      ? `${chat.members.length} members`
      : online[other?.userId] ? 'Online' : 'Offline';

  return (
    <>
      <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
        <button className="rounded-lg p-1.5 hover:bg-slate-100 md:hidden" aria-label="Back to conversations" onClick={closeChat}><ArrowLeft size={20} /></button>
        <div>
          <h2 className="font-semibold leading-tight">{chatTitle(chat, myId)}</h2>
          <p className={`text-sm ${others.length ? 'text-harbor' : 'text-slate-500'}`} aria-live="polite">{status}</p>
        </div>
      </header>

      <div ref={listRef} onScroll={onScroll} className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
        {thread?.hasMore && (
          <button onClick={loadOlder} className="mx-auto block rounded-full bg-white px-4 py-1.5 text-sm text-harbor shadow-sm hover:bg-slate-50">
            Load older messages
          </button>
        )}
        {thread && items.length === 0 && <p className="py-10 text-center text-slate-500">No messages yet. Say hello.</p>}
        {items.map((m) => (
          <MessageBubble key={m.id} message={m} mine={m.senderId === myId} chat={chat} />
        ))}
      </div>

      <MessageInput key={chat.id} chatId={chat.id} />
    </>
  );
}
