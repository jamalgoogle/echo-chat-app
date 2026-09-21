import prisma, { userSelect } from '../config/db.js';
import { verifyToken } from '../middleware/auth.js';
import { fileTypeFromPath } from '../config/multer.js';

// userId -> Set of socket ids (a user can have several tabs/devices open)
const online = new Map();

export function registerSockets(io) {
  // JWT handshake check: connections without a valid token never reach `connection`.
  io.use(async (socket, next) => {
    try {
      const raw = socket.handshake.auth?.token || (socket.handshake.headers.authorization || '').replace(/^Bearer /, '');
      const { sub } = verifyToken(raw);
      const user = await prisma.user.findUnique({ where: { id: sub }, select: { id: true, username: true } });
      if (!user) throw new Error('unknown user');
      socket.user = user;
      next();
    } catch {
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id;

    // ---- register handlers first so no event can arrive before a listener exists ----

    socket.on('send_message', async (payload, ack) => {
      const reply = typeof ack === 'function' ? ack : () => {};
      try {
        const { chatId, content, fileUrl, fileName } = payload ?? {};
        const text = typeof content === 'string' ? content.trim() : '';
        if (!chatId || (!text && !fileUrl)) return reply({ error: 'Message is empty' });
        if (text.length > 4000) return reply({ error: 'Message is too long (4000 characters max)' });

        let fileType = null;
        if (fileUrl) {
          fileType = fileTypeFromPath(fileUrl); // only paths we issued are accepted
          if (!fileType) return reply({ error: 'Invalid attachment' });
        }

        const member = await prisma.chatMember.findUnique({
          where: { chatId_userId: { chatId, userId } },
        });
        if (!member) return reply({ error: 'You are not a member of this chat' });

        const message = await prisma.message.create({
          data: {
            chatId,
            senderId: userId,
            content: text || null,
            fileUrl: fileUrl || null,
            fileType,
            fileName: typeof fileName === 'string' ? fileName.slice(0, 255) : null,
          },
          include: { sender: { select: userSelect } },
        });

        io.to(`chat:${chatId}`).emit('new_message', message);
        reply({ ok: true, message });
      } catch (err) {
        console.error('send_message failed:', err.message);
        reply({ error: 'Could not send the message' });
      }
    });

    socket.on('typing', ({ chatId, isTyping } = {}) => {
      if (!socket.rooms.has(`chat:${chatId}`)) return; // must be in the room; no DB hit needed
      socket.to(`chat:${chatId}`).emit('typing', {
        chatId,
        userId,
        username: socket.user.username,
        isTyping: !!isTyping,
      });
    });

    socket.on('mark_read', async ({ chatId } = {}) => {
      try {
        const readAt = new Date();
        await prisma.chatMember.update({
          where: { chatId_userId: { chatId, userId } },
          data: { lastReadAt: readAt },
        });
        socket.to(`chat:${chatId}`).emit('messages_read', { chatId, userId, readAt });
      } catch {
        /* not a member or invalid id: ignore */
      }
    });

    socket.on('disconnect', () => {
      const sockets = online.get(userId);
      if (!sockets) return;
      sockets.delete(socket.id);
      if (sockets.size === 0) {
        online.delete(userId);
        io.emit('presence', { userId, online: false });
      }
    });

    // ---- presence + rooms ----
    socket.join(`user:${userId}`);
    const sockets = online.get(userId) ?? new Set();
    sockets.add(socket.id);
    online.set(userId, sockets);
    if (sockets.size === 1) io.emit('presence', { userId, online: true });
    socket.emit('presence_snapshot', [...online.keys()]);

    prisma.chatMember
      .findMany({ where: { userId }, select: { chatId: true } })
      .then((rows) => rows.forEach((r) => socket.join(`chat:${r.chatId}`)))
      .catch((err) => console.error('joining rooms failed:', err.message));
  });
}
