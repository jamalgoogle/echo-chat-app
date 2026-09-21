export const otherMember = (chat, myId) => chat.members.find((m) => m.userId !== myId);

export const chatTitle = (chat, myId) =>
  chat.isGroup ? chat.name : otherMember(chat, myId)?.username ?? 'Unknown user';

const FILE_LABEL = { image: 'Photo', video: 'Video', audio: 'Audio', document: 'Document' };

export function previewText(chat, myId) {
  const m = chat.lastMessage;
  if (!m) return 'No messages yet';
  const who = m.senderId === myId ? 'You: ' : chat.isGroup ? `${m.sender?.username}: ` : '';
  return who + (m.content || FILE_LABEL[m.fileType] || 'File');
}

export const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
