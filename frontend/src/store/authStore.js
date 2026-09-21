import { create } from 'zustand';
import { api } from '../services/api.js';
import { disconnectSocket } from '../services/socket.js';
import { useChatStore } from './chatStore.js';

const saveSession = (set, { token, user }) => {
  localStorage.setItem('token', token);
  set({ user });
};

export const useAuthStore = create((set) => ({
  user: null,
  loading: true,

  async login({ email, password }) {
    const { data } = await api.post('/auth/login', { email, password });
    saveSession(set, data);
  },

  async register({ email, username, password }) {
    const { data } = await api.post('/auth/register', { email, username, password });
    saveSession(set, data);
  },

  async loadMe() {
    try {
      if (!localStorage.getItem('token')) return;
      const { data } = await api.get('/auth/me');
      set({ user: data.user });
    } catch {
      localStorage.removeItem('token');
    } finally {
      set({ loading: false });
    }
  },

  logout() {
    localStorage.removeItem('token');
    disconnectSocket();
    useChatStore.getState().reset();
    set({ user: null });
  },
}));
