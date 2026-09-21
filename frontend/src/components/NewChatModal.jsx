import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { api } from '../services/api.js';
import { useChatStore } from '../store/chatStore.js';

export default function NewChatModal({ onClose }) {
  const { addChat, openChat } = useChatStore();
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [group, setGroup] = useState(false);
  const [picked, setPicked] = useState([]);
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get('/users', { params: { q } });
        setResults(data.users);
      } catch {
        setError('Could not load users');
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const start = async (users) => {
    setError('');
    try {
      const { data } = await api.post('/chats', { isGroup: group, name, userIds: users.map((u) => u.id) });
      addChat(data.chat);
      await openChat(data.chat.id);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create the chat');
    }
  };

  const choose = (user) => {
    if (!group) return start([user]); // private chat: one tap
    setPicked((p) => (p.some((x) => x.id === user.id) ? p.filter((x) => x.id !== user.id) : [...p, user]));
  };

  return (
    <div className="fixed inset-0 z-10 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div role="dialog" aria-label="New chat" className="w-full max-w-md rounded-xl bg-white p-5 text-slate-800 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">New chat</h2>
          <button aria-label="Close" onClick={onClose} className="rounded p-1 hover:bg-slate-100"><X size={18} /></button>
        </div>

        <label className="mb-3 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={group} onChange={(e) => { setGroup(e.target.checked); setPicked([]); }} />
          Make it a group
        </label>

        {group && (
          <input className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Group name" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} />
        )}

        <input autoFocus className="mb-2 w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Search by username" value={q} onChange={(e) => setQ(e.target.value)} />

        <ul className="max-h-56 overflow-y-auto">
          {results.length === 0 && <li className="py-3 text-sm text-slate-500">No one found.</li>}
          {results.map((u) => {
            const on = picked.some((x) => x.id === u.id);
            return (
              <li key={u.id}>
                <button onClick={() => choose(u)} className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-slate-100 ${on ? 'bg-harbor/10' : ''}`}>
                  {u.username}
                  {on && <span className="text-sm font-medium text-harbor">Added</span>}
                </button>
              </li>
            );
          })}
        </ul>

        {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}

        {group && (
          <button disabled={!name.trim() || picked.length === 0} onClick={() => start(picked)} className="mt-3 w-full rounded-lg bg-harbor py-2.5 font-semibold text-white disabled:opacity-50">
            Create group{picked.length ? ` (${picked.length + 1} people)` : ''}
          </button>
        )}
      </div>
    </div>
  );
}
