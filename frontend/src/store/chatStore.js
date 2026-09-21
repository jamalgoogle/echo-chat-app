import { create } from 'zustand';
import { api } from '../services/api.js';
import { getSocket } from '../services/socket.js';

const initial = { chats: [], activeChatId: null, threads: {}, typing: {}, online: {} };
const typingTimers = {}; // `${chatId}:${userId}` -> timeout id (clears stale "typing…")

const stamp = (c) => new Date(c.lastMessage?.createdAt ?? c.createdAt).getTime();
const byRecent = (a, b) => stamp(b) - stamp(a);

export const useChatStore = create((set, get) => ({
  ...initial,

  reset: () => set(initial),

  addChat: (chat) =>
    set((s) => (s.chats.some((c) => c.id === chat.id) ? s : { chats: [chat, ...s.chats] })),

  async fetchChats() {
    const { data } = await api.get('/chats');
    set({ chats: data.chats });
  },

  async openChat(chatId) {
    set({ activeChatId: chatId });
    if (!chatId) return;
    await get().loadMessages(chatId, 1);
    get().markRead(chatId);
  },

  closeChat: () => set({ activeChatId: null }),

  async loadMessages(chatId, page) {
    const { data } = await api.get(`/messages/${chatId}`, { params: { page } });
    set((s) => {
      const prev = s.threads[chatId];
      const known = new Set((prev?.items ?? []).map((m) => m.id));
      const items = [...data.messages.filter((m) => !known.has(m.id)), ...(prev?.items ?? [])];
      return {
        threads: {
          ...s.threads,
          [chatId]: {
            items,
            // Re-fetching page 1 (e.g. after a reconnect) must not reset how far back we've paged.
            page: prev ? Math.max(prev.page, page) : page,
            hasMore: prev && page === 1 ? prev.hasMore : data.hasMore,
          },
        },
      };
    });
  },

  markRead(chatId) {
    getSocket()?.emit('mark_read', { chatId });
    set((s) => ({ chats: s.chats.map((c) => (c.id === chatId ? { ...c, unread: 0 } : c)) }));
  },

  receiveMessage(msg, myId) {
    set((s) => {
      const thread = s.threads[msg.chatId];
      const seen = thread?.items.some((m) => m.id === msg.id);
      const threads =
        thread && !seen
          ? { ...s.threads, [msg.chatId]: { ...thread, items: [...thread.items, msg] } }
          : s.threads;
      const countsAsUnread = !seen && msg.senderId !== myId && s.activeChatId !== msg.chatId;
      const chats = s.chats
        .map((c) =>
          c.id === msg.chatId ? { ...c, lastMessage: msg, unread: c.unread + (countsAsUnread ? 1 : 0) } : c
        )
        .sort(byRecent);
      return { threads, chats };
    });
    if (msg.chatId === get().activeChatId && msg.senderId !== myId) get().markRead(msg.chatId);
  },

  sendMessage(payload, myId) {
    return new Promise((resolve, reject) => {
      const socket = getSocket();
      if (!socket?.connected) return reject(new Error('Not connected. Reconnecting…'));
      socket.timeout(10000).emit('send_message', payload, (err, res) => {
        if (err) return reject(new Error('The server took too long to respond'));
        if (res?.error) return reject(new Error(res.error));
        get().receiveMessage(res.message, myId); // de-duplicated against the broadcast
        resolve(res.message);
      });
    });
  },

  setTyping({ chatId, userId, username, isTyping }) {
    const key = `${chatId}:${userId}`;
    clearTimeout(typingTimers[key]);
    if (isTyping) typingTimers[key] = setTimeout(() => get().setTyping({ chatId, userId, isTyping: false }), 5000);
    set((s) => {
      const current = { ...(s.typing[chatId] ?? {}) };
      if (isTyping) current[userId] = username;
      else delete current[userId];
      return { typing: { ...s.typing, [chatId]: current } };
    });
  },

  applyRead({ chatId, userId, readAt }) {
    set((s) => ({
      chats: s.chats.map((c) =>
        c.id !== chatId
          ? c
          : { ...c, members: c.members.map((m) => (m.userId === userId ? { ...m, lastReadAt: readAt } : m)) }
      ),
    }));
  },

  bindSocket(socket, myId) {
    socket.on('connect', async () => {
      await get().fetchChats();
      const active = get().activeChatId;
      if (active) get().loadMessages(active, 1); // catch up on anything missed while offline
    });
    socket.on('new_message', (m) => get().receiveMessage(m, myId));
    socket.on('typing', (t) => get().setTyping(t));
    socket.on('messages_read', (r) => get().applyRead(r));
    socket.on('chat_created', (chat) => get().addChat(chat));
    socket.on('presence', ({ userId, online }) => set((s) => ({ online: { ...s.online, [userId]: online } })));
    socket.on('presence_snapshot', (ids) => set({ online: Object.fromEntries(ids.map((id) => [id, true])) }));
  },
}));
