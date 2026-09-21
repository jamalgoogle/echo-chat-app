import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore.js';
import { useChatStore } from '../store/chatStore.js';
import { connectSocket, disconnectSocket } from '../services/socket.js';
import Sidebar from '../components/Sidebar.jsx';
import ChatWindow from '../components/ChatWindow.jsx';

export default function ChatApp() {
  const userId = useAuthStore((s) => s.user.id);
  const activeChatId = useChatStore((s) => s.activeChatId);

  useEffect(() => {
    const socket = connectSocket(localStorage.getItem('token'));
    useChatStore.getState().bindSocket(socket, userId); // its 'connect' handler loads the chat list
    return () => disconnectSocket();
  }, [userId]);

  // On phones show one pane at a time; from md up show both.
  return (
    <div className="flex h-dvh">
      <Sidebar className={activeChatId ? 'hidden md:flex' : 'flex'} />
      <ChatWindow className={activeChatId ? 'flex' : 'hidden md:flex'} />
    </div>
  );
}
