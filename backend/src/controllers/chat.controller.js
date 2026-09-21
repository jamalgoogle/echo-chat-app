import prisma, { userSelect } from '../config/db.js';
import { httpError, UUID_RE } from '../middleware/error.js';

const chatInclude = {
  members: { include: { user: { select: userSelect } } },
  messages: { orderBy: { createdAt: 'desc' }, take: 1, include: { sender: { select: userSelect } } },
};

export function serializeChat(chat, unread = 0) {
  return {
    id: chat.id,
    isGroup: chat.isGroup,
    name: chat.name,
    createdAt: chat.createdAt,
    members: chat.members.map((m) => ({
      userId: m.userId,
      username: m.user.username,
      avatar: m.user.avatar,
      lastReadAt: m.lastReadAt,
    })),
    lastMessage: chat.messages[0] ?? null,
    unread,
  };
}

export async function searchUsers(req, res) {
  const q = String(req.query.q ?? '').trim();
  const users = await prisma.user.findMany({
    where: {
      id: { not: req.userId },
      ...(q && { username: { contains: q, mode: 'insensitive' } }),
    },
    select: userSelect,
    orderBy: { username: 'asc' },
    take: 20,
  });
  res.json({ users });
}

export async function listChats(req, res) {
  const rows = await prisma.chat.findMany({
    where: { members: { some: { userId: req.userId } } },
    include: chatInclude,
  });

  const chats = await Promise.all(
    rows.map(async (chat) => {
      const mine = chat.members.find((m) => m.userId === req.userId);
      const unread = await prisma.message.count({
        where: { chatId: chat.id, senderId: { not: req.userId }, createdAt: { gt: mine.lastReadAt } },
      });
      return serializeChat(chat, unread);
    })
  );

  const stamp = (c) => new Date(c.lastMessage?.createdAt ?? c.createdAt).getTime();
  chats.sort((a, b) => stamp(b) - stamp(a));
  res.json({ chats });
}

export async function createChat(req, res) {
  const { isGroup = false, name } = req.body;
  const others = [...new Set(Array.isArray(req.body.userIds) ? req.body.userIds : [])].filter(
    (id) => id !== req.userId
  );

  if (!others.length) throw httpError(400, 'Pick at least one person');
  if (!others.every((id) => typeof id === 'string' && UUID_RE.test(id))) throw httpError(400, 'Invalid user id');
  if (!isGroup && others.length !== 1) throw httpError(400, 'A private chat has exactly two people');
  if (isGroup && !String(name ?? '').trim()) throw httpError(400, 'Give the group a name');

  const found = await prisma.user.count({ where: { id: { in: others } } });
  if (found !== others.length) throw httpError(404, 'One or more users were not found');

  const directKey = isGroup ? null : [req.userId, others[0]].sort().join(':');
  const existing = () => prisma.chat.findUnique({ where: { directKey }, include: chatInclude });

  if (directKey) {
    const chat = await existing();
    if (chat) return res.json({ chat: serializeChat(chat) });
  }

  let chat;
  try {
    chat = await prisma.chat.create({
      data: {
        isGroup: !!isGroup,
        name: isGroup ? String(name).trim().slice(0, 60) : null,
        directKey,
        members: { create: [req.userId, ...others].map((userId) => ({ userId })) },
      },
      include: chatInclude,
    });
  } catch (err) {
    if (err.code === 'P2002' && directKey) return res.json({ chat: serializeChat(await existing()) });
    throw err;
  }

  // Put every member's live sockets into the new room and tell them about it.
  const io = req.app.get('io');
  const payload = serializeChat(chat);
  for (const m of chat.members) {
    io.in(`user:${m.userId}`).socketsJoin(`chat:${chat.id}`);
    io.to(`user:${m.userId}`).emit('chat_created', payload);
  }
  res.status(201).json({ chat: payload });
}
