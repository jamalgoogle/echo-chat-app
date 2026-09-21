import prisma, { userSelect } from '../config/db.js';
import { httpError, UUID_RE } from '../middleware/error.js';

const PAGE_SIZE = 30;

// GET /api/messages/:chatId?page=1  → page 1 is the newest; each page is returned oldest→newest.
export async function getMessages(req, res) {
  const { chatId } = req.params;
  if (!UUID_RE.test(chatId)) throw httpError(400, 'Invalid chat id');

  const member = await prisma.chatMember.findUnique({
    where: { chatId_userId: { chatId, userId: req.userId } },
  });
  if (!member) throw httpError(403, 'You are not a member of this chat');

  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const rows = await prisma.message.findMany({
    where: { chatId },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE + 1, // one extra row tells us whether another page exists
    include: { sender: { select: userSelect } },
  });

  res.json({ messages: rows.slice(0, PAGE_SIZE).reverse(), page, hasMore: rows.length > PAGE_SIZE });
}
